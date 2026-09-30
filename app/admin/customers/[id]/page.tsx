import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getAdminCustomerById } from "@/lib/queries";
import { AdminShell, Panel } from "@/components/AdminShell";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;

  const customer = await getAdminCustomerById(id);
  if (!customer) notFound();

  const formattedJoinedDate = customer.createdAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const ordersCount = customer.orders.length;
  const completedOrders = customer.orders.filter((o) =>
    ["paid", "shipped", "delivered"].includes(o.status),
  ).length;

  return (
    <AdminShell
      session={session}
      active="/admin/customers"
      title={customer.name || "Customer Profile"}
      description={`Customer Account since ${formattedJoinedDate}`}
    >
      <div className="mb-4">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink transition-colors"
        >
          <span>&larr;</span> Back to all customers
        </Link>
      </div>

      {/* Customer Quick Metric Cards */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <div className="border border-line bg-ground p-4 shadow-sm">
          <dt className="eyebrow">Total Orders</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {ordersCount}
          </dd>
        </div>
        <div className="border border-line bg-ground p-4 shadow-sm">
          <dt className="eyebrow">Completed / Paid</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {completedOrders}
          </dd>
        </div>
        <div className="border border-line bg-ground p-4 shadow-sm">
          <dt className="eyebrow">Lifetime Spend</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {formatINR(customer.totalSpent)}
          </dd>
        </div>
        <div className="border border-line bg-ground p-4 shadow-sm">
          <dt className="eyebrow">Avg Order Value</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">
            {ordersCount > 0
              ? formatINR(Math.round(customer.totalSpent / Math.max(completedOrders, 1)))
              : "₹0"}
          </dd>
        </div>
      </dl>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Orders Placed History */}
        <div className="flex flex-col gap-6">
          <Panel
            title={`Orders Placed (${ordersCount})`}
            description="Chronological record of every order placed by this customer."
            bodyClassName="p-0"
          >
            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-soft">
                This customer has not placed any orders yet.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {customer.orders.map((order) => (
                  <div key={order.id} className="p-5 hover:bg-ground-alt/30 transition-colors">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-sm font-semibold text-ink underline underline-offset-4 hover:text-black"
                        >
                          {order.orderNumber}
                        </Link>
                        <StatusPill status={order.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-ink-soft">
                        <time dateTime={order.createdAt.toISOString()}>
                          {order.createdAt.toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                        <span className="font-semibold text-sm text-ink">
                          {formatINR(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items Preview */}
                    <ul className="mt-3 divide-y divide-line/40">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-3 py-2 text-xs">
                          <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded border border-line bg-ground-alt">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] text-ink-faint">
                                No img
                              </span>
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-ink">
                              {item.title}
                            </span>
                            <span className="text-ink-soft">
                              Qty: {item.quantity} &times; {formatINR(item.unitPrice)}
                            </span>
                          </div>
                          <span className="shrink-0 font-medium text-ink">
                            {formatINR(item.lineTotal)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer Row: Payment method & Action */}
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-soft pt-1">
                      <span>Payment: <strong className="font-medium text-ink capitalize">{order.paymentMethod}</strong></span>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-ink hover:underline inline-flex items-center gap-1"
                      >
                        Manage Order &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Customer Profile & Address Sidebar */}
        <div className="flex flex-col gap-6">
          <Panel title="Customer Information">
            <dl className="flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-soft">Full Name</dt>
                <dd className="mt-0.5 font-medium text-ink">{customer.name || "Not provided"}</dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-soft">Email Address</dt>
                <dd className="mt-0.5">
                  <a
                    href={`mailto:${customer.email}`}
                    className="font-medium text-ink underline underline-offset-2 hover:opacity-80"
                  >
                    {customer.email}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="text-xs uppercase tracking-wider text-ink-soft">Phone Number</dt>
                <dd className="mt-0.5">
                  {customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      className="font-medium text-ink underline underline-offset-2 hover:opacity-80"
                    >
                      {customer.phone}
                    </a>
                  ) : (
                    <span className="text-ink-faint">No phone registered</span>
                  )}
                </dd>
              </div>

              <div className="border-t border-line pt-3">
                <dt className="text-xs uppercase tracking-wider text-ink-soft">Account Created</dt>
                <dd className="mt-0.5 text-xs text-ink">{formattedJoinedDate}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Delivery & Shipping Address">
            {customer.addressLine1 ? (
              <address className="not-italic text-sm text-ink leading-relaxed">
                <p className="font-medium">{customer.name}</p>
                <p className="text-ink-soft">{customer.addressLine1}</p>
                {customer.addressLine2 && <p className="text-ink-soft">{customer.addressLine2}</p>}
                <p className="text-ink-soft">
                  {customer.city ? `${customer.city}, ` : ""}
                  {customer.state ? `${customer.state} ` : ""}
                  {customer.pincode}
                </p>
                <p className="text-ink-soft">{customer.country || "India"}</p>
                {customer.phone && (
                  <p className="mt-2 text-xs font-mono text-ink">📞 {customer.phone}</p>
                )}
              </address>
            ) : (
              <p className="text-sm text-ink-soft">
                No delivery address on record yet. An address will be automatically saved when this customer places their next order.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
