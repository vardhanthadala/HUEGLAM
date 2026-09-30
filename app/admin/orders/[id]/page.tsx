import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOrderById } from "@/lib/queries";
import { AdminShell, Panel } from "@/components/AdminShell";
import { OrderForm } from "@/components/OrderForm";
import { CancelOrderModal } from "@/components/CancelOrderModal";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const paid = ["paid", "shipped", "delivered"].includes(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <AdminShell
      session={session}
      active="/admin/orders"
      title={order.orderNumber}
      description={order.createdAt.toLocaleString("en-IN")}
      actions={
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.8125rem] " +
            (cancelled
              ? "bg-[#fef2f2] text-[#b91c1c]"
              : paid
              ? "bg-[#edf7f0] text-[#3f7a4f]"
              : "bg-[#f1f2f6] text-[#6b7280]")
          }
        >
          <span
            className={
              "size-1.5 rounded-full " +
              (cancelled ? "bg-[#ef4444]" : paid ? "bg-[#5a8a63]" : "bg-[#b6bcc6]")
            }
          />
          {order.status}
        </span>
      }
    >
      <Link
        href="/admin/orders"
        className="text-[0.8125rem] text-[#6b7280] transition-colors hover:text-ink"
      >
        &larr; All orders
      </Link>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Items and totals */}
        <Panel title="Items" bodyClassName="">
          <ul className="divide-y divide-[#f6f7f9] px-5">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <span className="relative h-20 w-[3.75rem] shrink-0 overflow-hidden rounded-[6px] bg-[#f1f2f6]">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="60px"
                      className="object-cover"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={"/products/" + item.handle}
                    className="block truncate text-[0.875rem] text-ink hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="mt-0.5 block text-[0.75rem] text-[#9aa0ab]">
                    {item.sku ? item.sku + " · " : ""}Qty {item.quantity} &times;{" "}
                    {formatINR(item.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 text-[0.875rem] font-medium text-ink">
                  {formatINR(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-2 border-t border-[#f1f2f6] px-5 py-4 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-[#6b7280]">Subtotal</dt>
              <dd className="text-ink">{formatINR(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#6b7280]">
                  Discount{order.couponCode ? " (" + order.couponCode + ")" : ""}
                </dt>
                <dd className="text-ink">&minus;{formatINR(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-[#6b7280]">Shipping</dt>
              <dd className="text-ink">
                {order.shipping === 0 ? "Free" : formatINR(order.shipping)}
              </dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-[#f1f2f6] pt-3 text-[1rem]">
              <dt className="text-ink">Total</dt>
              <dd className="font-medium text-ink">{formatINR(order.total)}</dd>
            </div>
          </dl>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Customer">
            <address className="text-[0.875rem] leading-relaxed text-[#6b7280] not-italic">
              <span className="text-ink">{order.customerName}</span>
              <br />
              <a
                href={"mailto:" + order.email}
                className="underline underline-offset-2 hover:text-ink"
              >
                {order.email}
              </a>
              <br />
              <a
                href={"tel:" + order.phone}
                className="underline underline-offset-2 hover:text-ink"
              >
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
          </Panel>

          {/* Only present when billing differed from shipping */}
          {order.billingAddress && (
            <Panel title="Billing address">
              <address className="text-[0.875rem] leading-relaxed text-[#6b7280] not-italic">
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
            </Panel>
          )}

          {/* Note left by the customer at checkout */}
          {order.customerNote && (
            <Panel title="Customer note">
              <p className="text-[0.875rem] whitespace-pre-wrap text-ink">
                {order.customerNote}
              </p>
            </Panel>
          )}

          <Panel title="Payment">
            <dl className="flex flex-col gap-2 text-[0.8125rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#9aa0ab]">Method</dt>
                <dd className="text-right text-ink">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-[#9aa0ab]">Razorpay order</dt>
                <dd className="truncate text-right font-mono text-[0.75rem] text-ink">
                  {order.razorpayOrderId ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-[#9aa0ab]">Payment ID</dt>
                <dd className="truncate text-right font-mono text-[0.75rem] text-ink">
                  {order.razorpayPaymentId ?? "—"}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Fulfilment">
            <OrderForm
              id={order.id}
              status={order.status}
              trackingCarrier={order.trackingCarrier ?? ""}
              trackingNumber={order.trackingNumber ?? ""}
              notes={order.notes ?? ""}
            />
          </Panel>

          <Panel title="Cancel Order">
            {order.status === "cancelled" ? (
              <div className="flex flex-col gap-2 text-xs">
                <div className="rounded-[8px] border border-line bg-ground-alt/60 p-3">
                  <span className="font-semibold text-ink block">Status: Cancelled</span>
                  {order.cancelledAt && (
                    <span className="text-ink-soft block mt-0.5">
                      Cancelled on: {order.cancelledAt.toLocaleString("en-IN")}
                    </span>
                  )}
                  {order.cancelReason && (
                    <span className="text-ink block mt-1.5 font-medium">
                      Reason: <span className="font-normal text-ink-soft">{order.cancelReason}</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-ink-soft leading-relaxed">
                  Need to cancel this order? Cancelling will notify the customer, update order records, and optionally restock the inventory.
                </p>
                <CancelOrderModal
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  status={order.status}
                />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
