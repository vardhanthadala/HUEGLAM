import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderWithItems } from "@/lib/queries";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSession } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ orderNumber: string }> };

export default async function OrderPage({ params }: PageProps) {
  const { orderNumber } = await params;

  const result = await getOrderWithItems(orderNumber.toUpperCase());
  if (!result) notFound();

  const { order, items } = result;

  /*
    This page shows the full delivery address, phone and email, so it is not
    safe to hand out to anyone holding the order number — the number appears in
    URLs, browser history and support emails, and the random tail is only a
    speed bump, not an access control.

    Checkout requires an account, so whoever placed this order has a session:
    gate on it. Admins can see any order. Everyone else gets a 404 rather than
    a 403, which keeps the page from confirming that an order number exists.
  */
  const [customer, admin] = await Promise.all([
    getCustomerSession(),
    getSession(),
  ]);
  const isOwner =
    customer?.email?.toLowerCase() === order.email.toLowerCase();
  if (!isOwner && !admin) notFound();
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const isShipped = order.status === "shipped";
  const isPaid = order.status === "paid";
  const isPendingOrFailed = order.status === "pending" || order.status === "failed";

  let eyebrowText = "Order confirmed";
  let headingText = "Thank you, " + order.customerName.split(" ")[0] + "!";
  let subtitleText = "We have received your payment. A confirmation has been sent to " + order.email + ".";

  if (isCancelled) {
    eyebrowText = "Order cancelled";
    headingText = "This order was cancelled";
    subtitleText = order.cancelReason
      ? "Cancellation reason: " + order.cancelReason
      : "This order has been cancelled. Any captured payment will be refunded.";
  } else if (isDelivered) {
    eyebrowText = "Order delivered";
    headingText = "Your package has arrived!";
    subtitleText = "Delivered to " + order.city + ", " + order.state + ". We hope you love your HUEGLAM purchase.";
  } else if (isShipped) {
    eyebrowText = "Order shipped";
    headingText = "Your order is on the way!";
    subtitleText = "Your package has been dispatched. Track your delivery below.";
  } else if (isPendingOrFailed) {
    eyebrowText = "Order pending";
    headingText = "Payment not completed";
    subtitleText = "We have not received payment for this order yet. If money was debited, write to support@hueglam.com.";
  }

  return (
    <div className="mx-auto max-w-3xl px-gutter py-16">
      <div className="text-center">
        <span className="eyebrow">{eyebrowText}</span>
        <h1 className="mt-3 text-2xl font-light tracking-tight sm:text-3xl">
          {headingText}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          {subtitleText}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <p className="text-[0.6875rem] tracking-[0.1em] uppercase text-ink-faint">
            Order {order.orderNumber}
          </p>
          <StatusPill status={order.status} />
        </div>
      </div>

      <ul className="mt-12 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 py-5">
            <Link
              href={"/products/" + item.handle}
              className="relative h-24 w-18 shrink-0 overflow-hidden bg-ground-alt"
            >
              {item.image && (
                <Image src={item.image} alt={item.title} fill sizes="72px" className="object-cover" />
              )}
            </Link>
            <div className="flex-1">
              <p className="text-[0.75rem] tracking-[0.06em] uppercase">{item.title}</p>
              <p className="mt-1 text-xs text-ink-soft">
                Qty {item.quantity} &middot; {formatINR(item.unitPrice)}
              </p>
            </div>
            <span className="text-sm font-medium">{formatINR(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 ml-auto flex max-w-xs flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd>{formatINR(order.subtotal)}</dd>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              Discount{order.couponCode ? " (" + order.couponCode + ")" : ""}
            </dt>
            <dd>&minus;{formatINR(order.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-ink-soft">Shipping</dt>
          <dd>{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
          <dt>Total</dt>
          <dd>{formatINR(order.total)}</dd>
        </div>
      </dl>

      <div className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-2">
        <div>
          <h2 className="eyebrow mb-2">Shipping to</h2>
          <address className="text-sm leading-relaxed text-ink-soft not-italic">
            {order.customerName}
            <br />
            {order.addressLine1}
            {order.addressLine2 && (
              <>
                <br />
                {order.addressLine2}
              </>
            )}
            <br />
            {order.city}, {order.state} {order.pincode}
            <br />
            {order.country}
            <br />
            {order.phone}
          </address>
        </div>
        <div>
          <h2 className="eyebrow mb-2">Order Status</h2>
          <div className="mt-1 flex items-center gap-2">
            <StatusPill status={order.status} />
          </div>
          {order.trackingNumber && (
            <div className="mt-3 rounded-[8px] border border-line bg-ground-alt/40 p-3 text-xs leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">Carrier:</span> {order.trackingCarrier || "Standard"}
              <br />
              <span className="font-medium text-ink">Tracking #:</span> {order.trackingNumber}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/collections/all"
          className="inline-block border border-ink px-8 py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] uppercase transition-colors hover:bg-ink hover:text-ground"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
