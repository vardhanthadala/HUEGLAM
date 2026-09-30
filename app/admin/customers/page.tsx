import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getAdminCustomers } from "@/lib/queries";
import { AdminShell } from "@/components/AdminShell";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const session = await requireSession();
  const customers = await getAdminCustomers();

  const totalCustomers = customers.length;
  const customersWithOrders = customers.filter((c) => c.totalOrders > 0).length;
  const totalLifetimeSpent = customers.reduce((n, c) => n + c.totalSpent, 0);

  const stats = [
    { label: "Registered Customers", value: String(totalCustomers) },
    { label: "With Orders", value: String(customersWithOrders) },
    { label: "Total Customer Spend", value: formatINR(totalLifetimeSpent) },
    {
      label: "Avg Spend / Customer",
      value: customersWithOrders > 0 ? formatINR(Math.round(totalLifetimeSpent / customersWithOrders)) : "₹0",
    },
  ];

  return (
    <AdminShell
      session={session}
      active="/admin/customers"
      title="Customers"
      description="Manage customer profiles, delivery addresses, order counts, and purchase histories."
    >
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-line bg-ground p-4 shadow-sm">
            <dt className="eyebrow">{s.label}</dt>
            <dd className="mt-1 text-lg font-medium text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      {customers.length === 0 ? (
        <div className="mt-8 border border-line bg-ground p-12 text-center">
          <p className="text-sm text-ink-soft">No registered customers yet.</p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border border-line bg-ground shadow-sm">
          <table className="w-full min-w-[55rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-ground-alt/60">
                <th className="eyebrow px-4 py-3 font-normal">Customer</th>
                <th className="eyebrow px-4 py-3 font-normal">Contact &amp; Delivery Address</th>
                <th className="eyebrow px-4 py-3 font-normal">Orders</th>
                <th className="eyebrow px-4 py-3 font-normal">Total Spent</th>
                <th className="eyebrow px-4 py-3 font-normal">Latest Order &amp; Items</th>
                <th className="eyebrow px-4 py-3 font-normal">Registered</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0 hover:bg-ground-alt/50 transition-colors">
                  {/* Name and email */}
                  <td className="px-4 py-3.5 align-top">
                    <Link
                      href={"/admin/customers/" + c.id}
                      className="block font-medium text-ink hover:underline group-hover:text-black"
                    >
                      {c.name || "Unnamed"} &rarr;
                    </Link>
                    <a
                      href={"mailto:" + c.email}
                      className="block text-xs text-ink-soft underline underline-offset-2 hover:text-ink mt-0.5"
                    >
                      {c.email}
                    </a>
                  </td>

                  {/* Phone & Address */}
                  <td className="px-4 py-3.5 align-top max-w-[260px]">
                    {c.phone ? (
                      <a href={"tel:" + c.phone} className="block text-xs font-medium text-ink hover:underline">
                        📞 {c.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-ink-faint">No phone registered</span>
                    )}
                    {c.addressLine1 ? (
                      <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                        📍 {c.addressLine1}
                        {c.addressLine2 ? `, ${c.addressLine2}` : ""}
                        <br />
                        {c.city ? `${c.city}, ` : ""}
                        {c.state ? `${c.state} ` : ""}
                        {c.pincode}
                      </span>
                    ) : (
                      <span className="mt-1 block text-xs text-ink-faint">No address on file yet</span>
                    )}
                  </td>

                  {/* Orders count */}
                  <td className="px-4 py-3.5 align-top font-medium text-ink">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-ground-alt border border-line">
                      {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                    </span>
                  </td>

                  {/* Total spent */}
                  <td className="px-4 py-3.5 align-top font-medium text-ink">
                    {formatINR(c.totalSpent)}
                  </td>

                  {/* Latest order */}
                  <td className="px-4 py-3.5 align-top max-w-[260px]">
                    {c.lastOrder ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={"/admin/orders"}
                            className="font-mono text-xs font-semibold text-ink underline underline-offset-2 hover:opacity-75"
                          >
                            {c.lastOrder.orderNumber}
                          </Link>
                          <StatusPill status={c.lastOrder.status} />
                        </div>
                        <span className="mt-1 block text-xs text-ink-soft truncate" title={c.lastOrder.itemsSummary}>
                          🛍️ {c.lastOrder.itemsSummary}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-ink-faint">
                          {c.lastOrder.createdAt.toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          · {formatINR(c.lastOrder.total)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-ink-faint">No orders placed</span>
                    )}
                  </td>

                  {/* Joined Date */}
                  <td className="px-4 py-3.5 align-top text-xs text-ink-soft whitespace-nowrap">
                    {c.createdAt.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
