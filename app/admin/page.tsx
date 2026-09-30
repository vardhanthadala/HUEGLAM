import Link from "next/link";
import Image from "next/image";
import { requireSession } from "@/lib/auth";
import {
  AdminShell,
  EmptyState,
  Notice,
  Panel,
  PrimaryLink,
  StatCard,
} from "@/components/AdminShell";
import { listAdminProducts } from "@/lib/admin-products";
import { getRecentOrders } from "@/lib/queries";
import { formatINR } from "@/lib/money";
import {
  FiVolume2,
  FiImage,
  FiActivity,
  FiVideo,
  FiInstagram,
  FiCheckCircle,
  FiShoppingBag,
  FiDollarSign,
  FiTruck,
  FiBox,
} from "react-icons/fi";

export const dynamic = "force-dynamic";

/** Orders can fail independently of products, so each side degrades alone. */
async function safeOrders() {
  try {
    return await getRecentOrders(100);
  } catch (error) {
    console.error("[admin/home] orders unavailable:", error);
    return [];
  }
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Period-over-period change, from real orders only. Returns null when there is
 * no prior period to compare against, so the tile shows no chip rather than an
 * invented figure.
 */
function change(current: number, previous: number) {
  if (previous <= 0) return null;
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return null;
  return {
    direction: percent > 0 ? ("up" as const) : ("down" as const),
    text: Math.abs(percent) + "%",
  };
}

/** Splits orders into the last 30 days and the 30 before that. Kept out of the
 *  component so the render stays free of clock reads. */
function splitByPeriod<T extends { createdAt: Date | string }>(orders: T[]) {
  const now = Date.now();
  const within = (from: number, to: number) =>
    orders.filter((o) => {
      const at = new Date(o.createdAt).getTime();
      return at >= from && at < to;
    });

  return {
    last30: within(now - 30 * DAY, now),
    prior30: within(now - 60 * DAY, now - 30 * DAY),
  };
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  width: 15,
  height: 15,
} as const;

export default async function AdminHomePage() {
  const session = await requireSession();
  const [products, orders] = await Promise.all([listAdminProducts(), safeOrders()]);

  const { last30, prior30 } = splitByPeriod(orders);

  const isPaid = (status: string) =>
    ["paid", "shipped", "delivered"].includes(status);

  const revenue = orders
    .filter((o) => isPaid(o.status))
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const revenue30 = last30
    .filter((o) => isPaid(o.status))
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const revenuePrior = prior30
    .filter((o) => isPaid(o.status))
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const toShip = orders.filter((o) => o.status === "paid").length;
  const lowStock = products.filter((p) => p.trackInventory && p.inventory <= 5);
  const recent = orders.slice(0, 6);

  return (
    <AdminShell
      session={session}
      active="/admin"
      title="Dashboard"
      description="Store activity and everything you can edit on the storefront."
      actions={<PrimaryLink href="/admin/products/new">Add product</PrimaryLink>}
    >
      {!process.env.MONGODB_URI && (
        <Notice>
          <strong className="font-medium">MONGODB_URI is not set.</strong> Add it to{" "}
          <code>.env.local</code> and restart the dev server, or the admin has
          nothing to read or write.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Orders"
          value={String(orders.length)}
          href="/admin/orders"
          delta={change(last30.length, prior30.length)}
          muted={orders.length === 0}
          icon={<FiShoppingBag className="size-4" />}
        />
        <StatCard
          label="Revenue"
          value={formatINR(revenue)}
          href="/admin/orders"
          delta={change(revenue30, revenuePrior)}
          muted={revenue === 0}
          icon={<FiDollarSign className="size-4" />}
        />
        <StatCard
          label="Awaiting shipment"
          value={String(toShip)}
          href="/admin/orders"
          muted={toShip === 0}
          icon={<FiTruck className="size-4" />}
        />
        <StatCard
          label="Products"
          value={String(products.length)}
          href="/admin/products"
          muted={products.length === 0}
          icon={<FiBox className="size-4" />}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent orders */}
        <Panel
          title="Recent orders"
          description="Latest purchases and order activity"
          action={
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-ink underline underline-offset-4 hover:opacity-75"
            >
              See all orders &rarr;
            </Link>
          }
          bodyClassName={recent.length === 0 ? "p-5" : "p-0"}
        >
          {recent.length === 0 ? (
            <p className="py-8 text-center text-[0.8125rem] text-[#9aa0ab]">
              No orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-ground-alt/40 text-[0.6875rem] uppercase tracking-wider text-ink-soft">
                    <th className="px-5 py-3 font-medium">Order</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {recent.map((order) => {
                    const isCancelled = order.status === "cancelled";
                    const isPaidStatus = isPaid(order.status);
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-ground-alt/50"
                      >
                        <td className="px-5 py-3.5">
                          <Link href={"/admin/orders/" + order.id} className="group block">
                            <span className="font-mono text-xs font-semibold text-ink group-hover:underline">
                              {order.orderNumber}
                            </span>
                            <span className="mt-0.5 block text-xs text-ink-soft">
                              {order.customerName} {order.city ? `· ${order.city}` : ""}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-wider " +
                              (isCancelled
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : isPaidStatus
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-ground-alt text-ink-soft border border-line")
                            }
                          >
                            <span
                              className={
                                "size-1.5 rounded-full " +
                                (isCancelled
                                  ? "bg-red-500"
                                  : isPaidStatus
                                  ? "bg-emerald-500"
                                  : "bg-ink-faint")
                              }
                            />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium text-ink">
                          {formatINR(order.total ?? 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Low stock */}
        <Panel
          title="Low stock alerts"
          description="Products with 5 or fewer units left"
          action={
            <Link
              href="/admin/products"
              className="text-xs font-medium text-ink underline underline-offset-4 hover:opacity-75"
            >
              All products &rarr;
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <div className="py-10 text-center">
              <span className="flex size-10 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                <FiCheckCircle className="size-5" />
              </span>
              <p className="mt-2.5 text-xs font-semibold text-ink">Inventory healthy</p>
              <p className="mt-0.5 text-xs text-ink-soft">No products currently running low.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-line/60">
              {lowStock.slice(0, 5).map((product) => (
                <li key={product.id} className="py-2.5 first:pt-0 last:pb-0">
                  <Link
                    href={"/admin/products/" + product.id}
                    className="flex items-center gap-3 group"
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-ground-alt">
                      {product.images[0] && (
                        <Image
                          src={product.images[0].src}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink group-hover:underline">
                      {product.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      {product.inventory} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Content shortcuts */}
      <Panel className="mt-6" title="Storefront content" description="Quick access to configure your homepage and marketing channels.">
        {products.length === 0 && orders.length === 0 && !process.env.MONGODB_URI ? (
          <EmptyState
            title="Nothing connected yet"
            description="Set MONGODB_URI, then add your first product."
          >
            <PrimaryLink href="/admin/products/new">Add product</PrimaryLink>
          </EmptyState>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/admin/content/announcements",
                label: "Announcements",
                hint: "Top marquee notification bar",
                badge: "Top Bar",
                icon: <FiVolume2 className="size-5 text-amber-600" />,
                bg: "bg-amber-500/10",
              },
              {
                href: "/admin/content/banners",
                label: "Hero Banners",
                hint: "Homepage visual hero carousel",
                badge: "Hero Section",
                icon: <FiImage className="size-5 text-indigo-600" />,
                bg: "bg-indigo-500/10",
              },
              {
                href: "/admin/content/marquee",
                label: "Ticker Strip",
                hint: "Moving USP perks & highlights",
                badge: "USP Bar",
                icon: <FiActivity className="size-5 text-emerald-600" />,
                bg: "bg-emerald-500/10",
              },
              {
                href: "/admin/content/reels",
                label: "Shoppable Reels",
                hint: "Vertical video demo feeds",
                badge: "Video",
                icon: <FiVideo className="size-5 text-rose-600" />,
                bg: "bg-rose-500/10",
              },
              {
                href: "/admin/content/instagram",
                label: "Instagram Feed",
                hint: "Social community grid showcase",
                badge: "Community",
                icon: <FiInstagram className="size-5 text-fuchsia-600" />,
                bg: "bg-fuchsia-500/10",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-ground p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`flex size-10 items-center justify-center rounded-lg ${item.bg}`}>
                      {item.icon}
                    </span>
                    <span className="rounded-full bg-ground-alt px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider text-ink-soft">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-sm font-semibold text-ink group-hover:text-black">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft line-clamp-2">
                    {item.hint}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-ink transition-transform duration-150 group-hover:translate-x-1">
                  <span>Customize</span>
                  <span>&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
