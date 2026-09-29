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
          icon={
            <svg {...iconProps}>
              <path d="M6.2 7.5h11.6l.9 12H5.3Z" strokeLinejoin="round" />
              <path d="M9.3 7.5a2.7 2.7 0 0 1 5.4 0" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Revenue"
          value={formatINR(revenue)}
          href="/admin/orders"
          delta={change(revenue30, revenuePrior)}
          muted={revenue === 0}
          icon={
            <svg {...iconProps}>
              <path d="M6 7h9M6 11h9M8 7c4 0 4 8 0 8h-2l7 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <StatCard
          label="Awaiting shipment"
          value={String(toShip)}
          href="/admin/orders"
          muted={toShip === 0}
          icon={
            <svg {...iconProps}>
              <path d="M3 8h10v8H3zM13 10.5h4l3 3V16h-7z" strokeLinejoin="round" />
              <circle cx="7" cy="17.5" r="1.4" />
              <circle cx="16.5" cy="17.5" r="1.4" />
            </svg>
          }
        />
        <StatCard
          label="Products"
          value={String(products.length)}
          href="/admin/products"
          muted={products.length === 0}
          icon={
            <svg {...iconProps}>
              <path d="m12 4 7.5 4.2v7.6L12 20l-7.5-4.2V8.2Z" strokeLinejoin="round" />
              <path d="M4.5 8.2 12 12.4l7.5-4.2M12 12.4V20" />
            </svg>
          }
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent orders */}
        <Panel
          title="Recent orders"
          action={
            <Link
              href="/admin/orders"
              className="text-[0.8125rem] text-[#6b7280] transition-colors hover:text-ink"
            >
              See all
            </Link>
          }
          bodyClassName={recent.length === 0 ? "p-5" : ""}
        >
          {recent.length === 0 ? (
            <p className="py-8 text-center text-[0.8125rem] text-[#9aa0ab]">
              No orders yet.
            </p>
          ) : (
            <table className="w-full text-left text-[0.875rem]">
              <thead>
                <tr className="border-b border-[#f1f2f6] text-[0.75rem] text-[#9aa0ab]">
                  <th className="px-5 py-2.5 font-normal">Order</th>
                  <th className="px-5 py-2.5 font-normal">Status</th>
                  <th className="px-5 py-2.5 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#f6f7f9] last:border-0 transition-colors hover:bg-[#fbfcfd]"
                  >
                    <td className="px-5 py-3">
                      <Link href={"/admin/orders/" + order.id} className="block">
                        <span className="block text-ink">{order.orderNumber}</span>
                        <span className="mt-0.5 block text-[0.75rem] text-[#9aa0ab]">
                          {order.customerName} &middot; {order.city}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] " +
                          (isPaid(order.status)
                            ? "bg-[#edf7f0] text-[#3f7a4f]"
                            : "bg-[#f1f2f6] text-[#6b7280]")
                        }
                      >
                        <span
                          className={
                            "size-1.5 rounded-full " +
                            (isPaid(order.status) ? "bg-[#5a8a63]" : "bg-[#b6bcc6]")
                          }
                        />
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-ink">
                      {formatINR(order.total ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        {/* Low stock */}
        <Panel
          title="Low stock"
          description="Five or fewer left"
          action={
            <Link
              href="/admin/products"
              className="text-[0.8125rem] text-[#6b7280] transition-colors hover:text-ink"
            >
              All
            </Link>
          }
        >
          {lowStock.length === 0 ? (
            <p className="py-6 text-center text-[0.8125rem] text-[#9aa0ab]">
              Nothing running low.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {lowStock.slice(0, 5).map((product) => (
                <li key={product.id}>
                  <Link
                    href={"/admin/products/" + product.id}
                    className="flex items-center gap-3"
                  >
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-[9px] bg-[#f1f2f6]">
                      {product.images[0] && (
                        <Image
                          src={product.images[0].src}
                          alt=""
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink">
                      {product.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#fdf1ee] px-2 py-0.5 text-[0.75rem] text-[#9c4d33]">
                      {product.inventory}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Content shortcuts */}
      <Panel className="mt-4" title="Storefront content">
        {products.length === 0 && orders.length === 0 && !process.env.MONGODB_URI ? (
          <EmptyState
            title="Nothing connected yet"
            description="Set MONGODB_URI, then add your first product."
          >
            <PrimaryLink href="/admin/products/new">Add product</PrimaryLink>
          </EmptyState>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              {
                href: "/admin/content/announcements",
                label: "Announcements",
                hint: "Messages in the top bar",
              },
              {
                href: "/admin/content/banners",
                label: "Hero banners",
                hint: "Homepage slideshow",
              },
              {
                href: "/admin/content/reels",
                label: "Reels",
                hint: "Shoppable videos",
              },
              {
                href: "/admin/content/instagram",
                label: "Instagram",
                hint: "Follow rail tiles",
              },
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 rounded-[10px] border border-[#ebedf1] px-4 py-3 transition-colors hover:border-[#dfe3ea] hover:bg-[#fbfcfd]"
                >
                  <span>
                    <span className="block text-[0.875rem] text-ink">{item.label}</span>
                    <span className="mt-0.5 block text-[0.8125rem] text-[#9aa0ab]">
                      {item.hint}
                    </span>
                  </span>
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="shrink-0 text-[#c4c9d2]"
                    aria-hidden="true"
                  >
                    <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
