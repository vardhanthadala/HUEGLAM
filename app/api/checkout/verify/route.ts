import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons, orderItems, orders, products } from "@/lib/db/schema";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendOrderConfirmation } from "@/lib/mail";

export const runtime = "nodejs";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(4),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Store is not configured." }, { status: 503 });
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payment payload." }, { status: 400 });
  }

  const ok = verifyPaymentSignature({
    razorpayOrderId: payload.razorpay_order_id,
    razorpayPaymentId: payload.razorpay_payment_id,
    signature: payload.razorpay_signature,
  });

  if (!ok) {
    // Signature mismatch means the callback was not produced by Razorpay.
    await db
      .update(orders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(orders.razorpayOrderId, payload.razorpay_order_id));

    try {
      const { connectDB } = require("@/lib/mongodb.ts");
      const { Order: MongoOrder } = require("@/models/Order");
      await connectDB();
      await MongoOrder.findOneAndUpdate(
        { razorpayOrderId: payload.razorpay_order_id },
        { status: "failed" }
      );
    } catch (err) {
      console.error("MongoDB update failed:", err);
    }

    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  const matched = await db
    .select()
    .from(orders)
    .where(eq(orders.razorpayOrderId, payload.razorpay_order_id));

  const order = matched[0];
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Already processed — return success without double-decrementing stock.
  if (order.status !== "pending") {
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  const paid = await db
    .update(orders)
    .set({
      status: "paid",
      razorpayPaymentId: payload.razorpay_payment_id,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))
    .returning();

  try {
    const { connectDB } = require("@/lib/mongodb.ts");
    const { Order: MongoOrder } = require("@/models/Order");
    await connectDB();
    await MongoOrder.findOneAndUpdate(
      { razorpayOrderId: payload.razorpay_order_id },
      { 
        status: "paid",
        razorpayPaymentId: payload.razorpay_payment_id
      }
    );
  } catch (err) {
    console.error("MongoDB update failed:", err);
  }

  // Draw down stock for each line.
  for (const item of items) {
    if (!item.productId) continue;
    await db
      .update(products)
      .set({
        inventory: sql`GREATEST(${products.inventory} - ${item.quantity}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, item.productId));
  }

  if (order.couponCode) {
    await db
      .update(coupons)
      .set({ usageCount: sql`${coupons.usageCount} + 1` })
      .where(eq(coupons.code, order.couponCode));
  }

  await sendOrderConfirmation(paid[0] ?? order, items);

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber });
}
