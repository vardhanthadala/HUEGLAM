import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getRecentOrders } from "@/lib/queries";
import { AdminShell } from "@/components/AdminShell";
import { formatINR } from "@/lib/money";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await requireSession();
  const orders = await getRecentOrders(100);

  const paid = orders.filter((o) => ["paid", "shipped", "delivered"].includes(o.status));
  const revenue = paid.reduce((n, o) => n + o.total, 0);
  const awaiting = orders.filter((o) => o.status === "paid").length;

  const stats = [
    { label: "Orders", value: String(orders.length) },
    { label: "Paid", value: String(paid.length) },
    { label: "Revenue", value: formatINR(revenue) },
    { label: "To ship", value: String(awaiting) },
  ];

  return (
    <AdminShell session={session} active="/admin">
      <h1 className="text-xl font-light tracking-tight">Orders</h1>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border border-line bg-ground p-4">
            <dt className="eyebrow">{s.label}</dt>
            <dd className="mt-1 text-lg font-medium">{s.value}</dd>
          </div>
        ))}
      </dl>

      {orders.length === 0 ? (
        <p className="mt-10 border border-line bg-ground p-8 text-center text-sm text-ink-soft">
          No orders yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border border-line bg-ground">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="eyebrow px-4 py-3 font-normal">Order</th>
                <th className="eyebrow px-4 py-3 font-normal">Customer</th>
                <th className="eyebrow px-4 py-3 font-normal">Placed</th>
                <th className="eyebrow px-4 py-3 font-normal">Status</th>
                <th className="eyebrow px-4 py-3 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-line last:border-0 hover:bg-ground-alt">
                  <td className="px-4 py-3">
                    <Link
                      href={"/admin/orders/" + order.id}
                      className="font-medium underline underline-offset-2"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{order.customerName}</span>
                    <span className="block text-xs text-ink-faint">{order.city}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">
                    {order.createdAt.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatINR(order.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
