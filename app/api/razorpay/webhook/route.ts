import { NextResponse } from "next/server";
import { mongoConfigured } from "@/lib/mongodb";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markOrderFailed, markOrderPaid } from "@/lib/fulfil-order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay's server-to-server notification.
 *
 * This is what makes payment capture reliable. The browser callback only fires
 * if the customer's tab survives long enough to send it; a closed laptop, a
 * dropped connection or a killed app would otherwise leave an order stuck at
 * "pending" with the money already taken. Razorpay retries this endpoint until
 * it gets a 2xx, so it is the one that eventually wins.
 *
 * Set it up: Razorpay Dashboard -> Settings -> Webhooks -> Add New Webhook
 *   URL     https://your-domain.com/api/razorpay/webhook
 *   Events  payment.captured, payment.failed
 *   Secret  the same value as RAZORPAY_WEBHOOK_SECRET
 */
export async function POST(request: Request) {
  if (!mongoConfigured) {
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET is not set; refusing.");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  // The signature covers the exact bytes Razorpay sent, so the body has to be
  // read raw. Parsing it first and re-serialising would change the whitespace
  // and the digest would never match.
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const entity = event.payload?.payment?.entity;
  const orderId = entity?.order_id;
  const paymentId = entity?.id;

  if (!orderId) {
    // Nothing to act on, but it was genuinely from Razorpay: 200 so it is not
    // retried forever.
    return NextResponse.json({ ok: true, ignored: event.event ?? "unknown" });
  }

  try {
    if (event.event === "payment.captured" && paymentId) {
      const result = await markOrderPaid(orderId, paymentId);
      return NextResponse.json({ ok: true, outcome: result.outcome });
    }

    if (event.event === "payment.failed") {
      await markOrderFailed(orderId);
      return NextResponse.json({ ok: true, outcome: "failed" });
    }

    return NextResponse.json({ ok: true, ignored: event.event ?? "unknown" });
  } catch (error) {
    // A 500 tells Razorpay to retry, which is what we want for a transient
    // database problem.
    console.error("[webhook] handling failed for " + orderId, error);
    return NextResponse.json({ error: "Could not process." }, { status: 500 });
  }
}
