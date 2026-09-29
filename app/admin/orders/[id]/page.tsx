import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";
import { AdminShell } from "@/components/AdminShell";
import { OrderForm } from "@/components/OrderForm";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;

  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const found = await db.select().from(orders).where(eq(orders.id, orderId));
  const order = found[0];
  if (!order) notFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return (
    <AdminShell session={session} active="/admin">
      <Link
        href="/admin"
        className="text-[0.6875rem] tracking-[0.08em] uppercase text-ink-soft hover:text-ink"
      >
        &larr; All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-xl font-light tracking-tight">{order.orderNumber}</h1>
        <span className="text-[0.75rem] text-ink-faint">
          {order.createdAt.toLocaleString("en-IN")}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Items and totals */}
        <section className="border border-line bg-ground">
          <h2 className="eyebrow border-b border-line px-5 py-3">Items</h2>
          <ul className="divide-y divide-line px-5">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4">
                <div className="relative h-20 w-15 shrink-0 overflow-hidden bg-ground-alt">
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill sizes="60px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.75rem] tracking-[0.04em] uppercase">{item.title}</p>
                  <p className="mt-1 text-xs text-ink-faint">
                    {item.sku ? item.sku + " · " : ""}Qty {item.quantity} &times;{" "}
                    {formatINR(item.unitPrice)}
                  </p>
                </div>
                <span className="text-sm font-medium">{formatINR(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-2 border-t border-line px-5 py-4 text-sm">
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
        </section>

        <div className="flex flex-col gap-6">
          {/* Customer */}
          <section className="border border-line bg-ground p-5">
            <h2 className="eyebrow mb-3">Customer</h2>
            <address className="text-sm leading-relaxed text-ink-soft not-italic">
              {order.customerName}
              <br />
              <a href={"mailto:" + order.email} className="underline underline-offset-2">
                {order.email}
              </a>
              <br />
              <a href={"tel:" + order.phone} className="underline underline-offset-2">
                {order.phone}
              </a>
              <br />
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
            </address>
          </section>

          {/* Only present when billing differed from shipping */}
          {order.billingAddress && (
            <section className="border border-line bg-ground p-5">
              <h2 className="eyebrow mb-3">Billing address</h2>
              <address className="text-sm leading-relaxed text-ink-soft not-italic">
                {order.billingAddress.name}
                <br />
                {order.billingAddress.addressLine1}
                {order.billingAddress.addressLine2 && (
                  <>
                    <br />
                    {order.billingAddress.addressLine2}
                  </>
                )}
                <br />
                {order.billingAddress.city}, {order.billingAddress.state}{" "}
                {order.billingAddress.pincode}
                {order.billingAddress.phone && (
                  <>
                    <br />
                    {order.billingAddress.phone}
                  </>
                )}
              </address>
            </section>
          )}

          {/* Note left by the customer at checkout */}
          {order.customerNote && (
            <section className="border border-line bg-sale p-5">
              <h2 className="eyebrow mb-2">Customer note</h2>
              <p className="text-sm whitespace-pre-wrap text-ink">{order.customerNote}</p>
            </section>
          )}

          {/* Payment */}
          <section className="border border-line bg-ground p-5">
            <h2 className="eyebrow mb-3">Payment</h2>
            <dl className="flex flex-col gap-1.5 text-xs text-ink-soft">
              <div className="flex justify-between gap-3">
                <dt>Method</dt>
                <dd className="text-right">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Razorpay order</dt>
                <dd className="truncate text-right font-mono">{order.razorpayOrderId ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Payment ID</dt>
                <dd className="truncate text-right font-mono">
                  {order.razorpayPaymentId ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          {/* Fulfilment */}
          <section className="border border-line bg-ground p-5">
            <h2 className="eyebrow mb-3">Fulfilment</h2>
            <OrderForm
              id={order.id}
              status={order.status}
              trackingCarrier={order.trackingCarrier ?? ""}
              trackingNumber={order.trackingNumber ?? ""}
              notes={order.notes ?? ""}
            />
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
