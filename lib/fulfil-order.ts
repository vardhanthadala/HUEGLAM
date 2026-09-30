import "server-only";
import { connectDB } from "./mongodb";
import { Product } from "@/models/Product";
import { Coupon } from "@/models/Coupon";
import { Order } from "@/models/Order";
import { sendOrderConfirmation } from "./mail";
import { getOrderWithItems } from "./queries";

/**
 * Moving an order to paid, and everything that follows from it.
 *
 * Two different things call this: the browser callback after Razorpay's
 * checkout closes, and Razorpay's server-to-server webhook. They race, and
 * either one can arrive alone — a customer who closes the tab straight after
 * paying only ever produces the webhook. So this has to be safe to run twice
 * and safe to run from either side, which is why the transition is a single
 * conditional update rather than a read followed by a write.
 */

export type PaidResult =
  | { outcome: "paid"; orderNumber: string }
  | { outcome: "already"; orderNumber: string }
  | { outcome: "missing" };

export async function markOrderPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): Promise<PaidResult> {
  await connectDB();

  // Matching on status "pending" is the lock: exactly one caller can make the
  // transition, so stock is never drawn down twice for one payment.
  const claimed = await Order.findOneAndUpdate(
    { razorpayOrderId, status: "pending" },
    { $set: { status: "paid", razorpayPaymentId } },
    { new: true },
  );

  if (!claimed) {
    const existing = await Order.findOne({ razorpayOrderId })
      .select({ orderNumber: 1 })
      .lean();
    if (!existing) return { outcome: "missing" };
    return { outcome: "already", orderNumber: existing.orderNumber };
  }

  // Draw down stock. The pipeline form clamps at zero inside the database, so
  // concurrent orders cannot drive inventory negative between a read and a write.
  for (const item of claimed.items) {
    if (!item.productId) continue;
    try {
      await Product.updateOne(
        { _id: item.productId, trackInventory: true },
        [
          {
            $set: {
              inventory: {
                $max: [0, { $subtract: ["$inventory", item.quantity] }],
              },
            },
          },
        ],
        { updatePipeline: true },
      );
    } catch (error) {
      // Bookkeeping must never fail a payment that already succeeded.
      console.error("[fulfil] stock update failed for " + item.productId, error);
    }
  }

  if (claimed.couponCode) {
    try {
      await Coupon.updateOne(
        { code: claimed.couponCode },
        { $inc: { usageCount: 1 } },
      );
    } catch (error) {
      console.error("[fulfil] coupon usage update failed", error);
    }
  }

  // Update customer analytics (total orders count & lifetime spend)
  if (claimed.customerId || claimed.email) {
    try {
      const { Customer } = await import("@/models/Customer");
      const filter = claimed.customerId
        ? { _id: claimed.customerId }
        : { email: claimed.email.toLowerCase() };

      await Customer.updateOne(filter, {
        $inc: { totalOrders: 1, totalSpent: claimed.total },
      });
    } catch (error) {
      console.error("[fulfil] customer metric update failed:", error);
    }
  }

  try {
    const detail = await getOrderWithItems(claimed.orderNumber);
    if (detail) await sendOrderConfirmation(detail.order, detail.items);
  } catch (error) {
    console.error("[fulfil] confirmation email failed", error);
  }

  return { outcome: "paid", orderNumber: claimed.orderNumber };
}

/** Marks a still-pending order failed. Never touches one that already paid. */
export async function markOrderFailed(razorpayOrderId: string): Promise<void> {
  await connectDB();
  await Order.findOneAndUpdate(
    { razorpayOrderId, status: "pending" },
    { $set: { status: "failed" } },
  );
}
