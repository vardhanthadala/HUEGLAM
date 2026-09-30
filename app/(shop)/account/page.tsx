import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCustomerSession } from "@/lib/customer-auth";
import { getOrdersWithItemsForEmail } from "@/lib/queries";
import { OrderLookup } from "@/components/OrderLookup";
import { AccountSignInTrigger } from "@/components/AccountSignInTrigger";
import { CustomerSignOutButton } from "@/components/CustomerSignOutButton";
import { StatusPill } from "@/components/StatusPill";
import { formatINR } from "@/lib/money";
import { connectDB, mongoConfigured } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account | HUEGLAM",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const customer = await getCustomerSession();

  if (!customer) {
    return (
      <div className="mx-auto max-w-xl px-gutter py-20 text-center animate-fade-in-up">
        <h1 className="text-2xl font-light tracking-tight text-ink sm:text-3xl">Track your order</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Enter your order number and email, or sign in to view every purchase.
        </p>

        <AccountSignInTrigger />

        <div className="mt-8 border border-line bg-white p-8 text-left">
          <OrderLookup />
        </div>
      </div>
    );
  }

  let customerDoc = null;
  if (mongoConfigured) {
    try {
      await connectDB();
      customerDoc = await Customer.findById(customer.id).lean();
    } catch {
      // Fallback
    }
  }

  const orders = await getOrdersWithItemsForEmail(customer.email);
  const paidOrders = orders.filter(({ order }) =>
    ["paid", "shipped", "delivered"].includes(order.status)
  );
  const totalSpent = paidOrders.reduce((sum, { order }) => sum + order.total, 0);
  const latestOrder = orders[0]?.order ?? null;

  const defaultAddress = customerDoc?.addressLine1
    ? {
        name: customerDoc.name || customer.name,
        phone: customerDoc.phone || latestOrder?.phone || "",
        addressLine1: customerDoc.addressLine1,
        addressLine2: customerDoc.addressLine2 || "",
        city: customerDoc.city || "",
        state: customerDoc.state || "",
        pincode: customerDoc.pincode || "",
        country: customerDoc.country || "India",
      }
    : latestOrder
    ? {
        name: latestOrder.customerName || customer.name,
        phone: latestOrder.phone,
        addressLine1: latestOrder.addressLine1,
        addressLine2: latestOrder.addressLine2 || "",
        city: latestOrder.city,
        state: latestOrder.state,
        pincode: latestOrder.pincode,
        country: latestOrder.country,
      }
    : null;

  return (
    <div className="mx-auto max-w-[1200px] px-gutter py-14 animate-fade-in-up">
      {/* Top Bar: Title & Sign Out */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-jost text-2xl tracking-[1px] uppercase text-ink sm:text-3xl">
            {customer.name ? "Welcome, " + customer.name.split(" ")[0] : "My Account"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{customer.email}</p>
        </div>

        <CustomerSignOutButton />
      </div>

      {/* Overview Stats: Luxury editorial metrics */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group relative overflow-hidden rounded-[16px] border border-[#e8ebef] bg-white p-5.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[#8c94a0] transition-colors group-hover:text-ink">
              Total Orders
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-[#f6f7f9] text-ink-soft transition-all duration-300 group-hover:scale-110 group-hover:bg-ink group-hover:text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-2xl font-normal tracking-tight text-ink font-serif sm:text-3xl transition-transform duration-300 group-hover:translate-x-0.5">
            {orders.length}
          </p>
          <p className="mt-1 text-[0.75rem] text-[#8c94a0]">
            {orders.length === 1 ? "1 order placed" : `${orders.length} orders placed`}
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-[16px] border border-[#e8ebef] bg-white p-5.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)] cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[#8c94a0] transition-colors group-hover:text-ink">
              Total Spent
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-[#f6f7f9] text-ink-soft transition-all duration-300 group-hover:scale-110 group-hover:bg-ink group-hover:text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-2xl font-normal tracking-tight text-ink font-serif sm:text-3xl transition-transform duration-300 group-hover:translate-x-0.5">
            {formatINR(totalSpent)}
          </p>
          <p className="mt-1 text-[0.75rem] text-[#8c94a0]">
            Across confirmed purchases
          </p>
        </div>

        <div className="group relative overflow-hidden rounded-[16px] border border-[#e8ebef] bg-white p-5.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_12px_28px_rgba(16,185,129,0.08)] cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-[#8c94a0] transition-colors group-hover:text-emerald-800">
              Membership
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-[1.125rem] font-medium tracking-tight text-ink">
            Verified Customer
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-[0.75rem] font-medium text-emerald-700">Active account</span>
          </div>
        </div>
      </div>

      {/* Split Grid: Orders list on left, Saved address on right */}
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: Orders */}
        <div>
          <h2 className="font-jost text-xs tracking-[0.16em] uppercase text-ink-soft">
            Order History ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div className="mt-5 border border-line p-10 text-center">
              <p className="text-sm text-ink-soft">You haven&apos;t placed any orders yet.</p>
              <Link
                href="/collections/all"
                className="btn-theme mt-5 inline-block text-xs"
              >
                Shop skincare
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-6">
              {orders.map(({ order, items }) => (
                <article key={order.id} className="overflow-hidden rounded-[16px] border border-[#e8ebef] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all">
                  {/* Order header row */}
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0f2f5] bg-[#fafbfc] px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link
                        href={"/order/" + order.orderNumber}
                        className="font-medium text-sm text-ink underline underline-offset-4 hover:opacity-70"
                      >
                        {order.orderNumber}
                      </Link>
                      <StatusPill status={order.status} />
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="text-xs text-ink-faint">
                        {order.createdAt.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        {formatINR(order.total)}
                      </span>
                    </div>
                  </header>

                  {/* Items list */}
                  <ul className="divide-y divide-line px-6">
                    {items.map((item) => (
                      <li key={item.id} className="flex gap-4 py-5">
                        <Link
                          href={"/products/" + item.handle}
                          className="relative aspect-2/3 w-16 shrink-0 overflow-hidden bg-ground-alt"
                        >
                          {item.image && (
                            <Image
                              src={item.image}
                              alt=""
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          )}
                        </Link>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={"/products/" + item.handle}
                            className="font-jost block text-sm tracking-[0.5px] uppercase text-ink hover:opacity-70"
                          >
                            {item.title}
                          </Link>
                          <p className="mt-1 text-xs text-ink-faint">
                            {item.sku ? item.sku + " · " : ""}Qty {item.quantity} &times;{" "}
                            {formatINR(item.unitPrice)}
                          </p>
                        </div>

                        <span className="shrink-0 text-sm font-medium text-ink">
                          {formatINR(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Order Footer */}
                  <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-3.5 text-xs text-ink-soft">
                    <span>
                      {order.trackingNumber
                        ? `Tracking (${order.trackingCarrier || "Courier"}): ${order.trackingNumber}`
                        : "Standard delivery — In progress"}
                    </span>

                    <Link
                      href={"/order/" + order.orderNumber}
                      className="text-ink underline underline-offset-4 hover:opacity-70"
                    >
                      View Receipt &rarr;
                    </Link>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Right: Primary Delivery Address (Sticky sidebar) */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-jost text-xs tracking-[0.16em] uppercase text-ink-soft">
            Default Address
          </h2>

          <div className="mt-5 rounded-[16px] border border-[#e8ebef] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all">
            {defaultAddress ? (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink">{defaultAddress.name}</p>
                  <span className="rounded-full bg-[#f6f7f9] px-2.5 py-0.5 text-[0.625rem] font-medium tracking-[0.08em] uppercase text-[#6b7280]">
                    Primary
                  </span>
                </div>
                {defaultAddress.phone && (
                  <p className="mt-1 text-xs text-ink-soft">+91 {defaultAddress.phone}</p>
                )}
                <address className="mt-3.5 rounded-[10px] bg-[#f9fafb] p-3 text-xs leading-relaxed text-[#4b5563] not-italic border border-[#f0f2f5]">
                  {defaultAddress.addressLine1}
                  {defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ""}
                  <br />
                  {defaultAddress.city ? `${defaultAddress.city}, ` : ""}
                  {defaultAddress.state} {defaultAddress.pincode}
                  <br />
                  {defaultAddress.country}
                </address>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-ink-soft">
                No delivery address saved yet. It will be added automatically on your next checkout.
              </p>
            )}

            <div className="mt-6 border-t border-[#f0f2f5] pt-5">
              <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-ink-faint">
                Need Help?
              </span>
              <p className="mt-1 text-xs text-ink-soft">
                Have questions regarding your orders or shipping?
              </p>
              <Link
                href="/pages/contact"
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-ink underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                <span>Contact customer care</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
