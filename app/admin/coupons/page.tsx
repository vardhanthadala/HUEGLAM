import { requireSession } from "@/lib/auth";
import { getAdminCoupons } from "@/lib/queries";
import { AdminShell } from "@/components/AdminShell";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const session = await requireSession();
  const coupons = await getAdminCoupons();

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(
    (c) => c.active && (!c.expiresAt || c.expiresAt > new Date()),
  ).length;
  const totalUses = coupons.reduce((n, c) => n + c.usageCount, 0);

  const stats = [
    { label: "Total Coupons", value: String(totalCoupons) },
    { label: "Active & Valid", value: String(activeCoupons) },
    { label: "Total Times Redeemed", value: String(totalUses) },
  ];

  return (
    <AdminShell
      session={session}
      active="/admin/coupons"
      title="Discount Coupons"
      description="Manage promotional codes, percentage discounts, minimum order requirements, and usage caps."
    >
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="border border-line bg-ground p-4 shadow-sm rounded-xl">
            <dt className="eyebrow">{s.label}</dt>
            <dd className="mt-1 text-xl font-semibold text-ink">{s.value}</dd>
          </div>
        ))}
      </dl>

      <CouponsManager coupons={coupons} />
    </AdminShell>
  );
}
