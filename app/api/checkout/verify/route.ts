import { NextResponse } from "next/server";
import { z } from "zod";
import { mongoConfigured } from "@/lib/mongodb";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { markOrderFailed, markOrderPaid } from "@/lib/fulfil-order";

export const runtime = "nodejs";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(4),
});

/**
 * The browser callback, fired when Razorpay's checkout closes successfully.
 *
 * This is the fast path, not the authoritative one: the webhook at
 * /api/razorpay/webhook covers the customer who pays and then closes the tab.
 * Both funnel into markOrderPaid, which is safe to run twice.
 */
export async function POST(request: Request) {
  if (!mongoConfigured) {
    return NextResponse.json({ error: "Store is not configured." }, { status: 503 });
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 });
  }

  /*
    The signature is the only thing that proves this came from Razorpay — it is
    computed over the order and payment ids with the key secret, which the
    browser never sees. No session check: a customer who loses their cookie
    between paying and returning must still have their order marked paid.
  */
  const ok = verifyPaymentSignature({
    razorpayOrderId: payload.razorpay_order_id,
    razorpayPaymentId: payload.razorpay_payment_id,
    signature: payload.razorpay_signature,
  });

  if (!ok) {
    await markOrderFailed(payload.razorpay_order_id);
    return NextResponse.json(
      { error: "Payment could not be verified." },
      { status: 400 },
    );
  }

  const result = await markOrderPaid(
    payload.razorpay_order_id,
    payload.razorpay_payment_id,
  );

  if (result.outcome === "missing") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, orderNumber: result.orderNumber });
}
