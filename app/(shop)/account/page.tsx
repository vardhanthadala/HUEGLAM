import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCustomerSession } from "@/lib/customer-auth";
import { getOrdersWithItemsForEmail } from "@/lib/queries";
import { OrderLookup } from "@/components/OrderLookup";
import { StatusPill } from "@/components/StatusPill";
import { customerLogoutAction } from "./actions";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const customer = await getCustomerSession();

  if (!customer) {
    return (
      <div className="mx-auto max-w-xl px-gutter py-16">
        <h1 className="text-2xl font-light tracking-tight sm:text-3xl">
          Track your order
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          Enter your order number and the email you used at checkout, or sign in
          from the account icon to see every order.
        </p>
        <OrderLookup />
      </div>
    );
  }

  const orders = await getOrdersWithItemsForEmail(customer.email);

  return (
    <div className="mx-auto max-w-3xl px-gutter py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight sm:text-3xl">
            {customer.name ? "Hi, " + customer.name.split(" ")[0] : "My account"}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">{customer.email}</p>
        </div>

        <form action={customerLogoutAction}>
          <button
            type="submit"
            className="border border-line px-5 py-2.5 text-[0.75rem] tracking-[0.12em] uppercase text-ink transition-colors hover:border-ink"
          >
            Sign out
          </button>
        </form>
      </div>

      <h2 className="mt-12 text-[0.8125rem] tracking-[0.12em] uppercase text-ink-soft">
        My orders
      </h2>

      {orders.length === 0 ? (
        <div className="mt-5 border border-line px-6 py-10 text-center">
          <p className="text-sm text-ink-soft">No orders yet.</p>
          <Link
            href="/collections/all"
            className="mt-4 inline-block bg-ink px-6 py-3 text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-white"
          >
            Shop skincare
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          {orders.map(({ order, items }) => (
            <article key={order.id} className="border border-line">
              {/* Order header */}
              <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-ground-alt px-5 py-4">
                <div>
                  <Link
                    href={"/order/" + order.orderNumber}
                    className="text-[0.875rem] font-medium underline underline-offset-4"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="mt-0.5 text-[0.75rem] text-ink-faint">
                    Placed{" "}
                    {order.createdAt.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <StatusPill status={order.status} />

                <span className="ml-auto text-[0.9375rem] font-medium">
                  {formatINR(order.total)}
                </span>
              </header>

              {/* What they ordered */}
              <ul className="divide-y divide-line px-5">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
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
                        className="block text-[0.875rem] leading-snug text-ink hover:opacity-70"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 text-[0.8125rem] text-ink-faint">
                        {item.sku ? item.sku + " · " : ""}Qty {item.quantity}{" "}
                        &times; {formatINR(item.unitPrice)}
                      </p>
                    </div>

                    <span className="shrink-0 text-[0.875rem]">
                      {formatINR(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Delivery + tracking */}
              <footer className="flex flex-wrap gap-x-10 gap-y-3 border-t border-line px-5 py-4 text-[0.8125rem] text-ink-soft">
                <div>
                  <span className="block text-[0.6875rem] tracking-[0.1em] uppercase text-ink-faint">
                    Delivering to
                  </span>
                  {order.city}, {order.state} {order.pincode}
                </div>

                {order.trackingNumber ? (
                  <div>
                    <span className="block text-[0.6875rem] tracking-[0.1em] uppercase text-ink-faint">
                      Tracking
                    </span>
                    {order.trackingCarrier}: {order.trackingNumber}
                  </div>
                ) : (
                  <div>
                    <span className="block text-[0.6875rem] tracking-[0.1em] uppercase text-ink-faint">
                      Tracking
                    </span>
                    Not shipped yet
                  </div>
                )}

                {order.customerNote && (
                  <div className="w-full">
                    <span className="block text-[0.6875rem] tracking-[0.1em] uppercase text-ink-faint">
                      Your note
                    </span>
                    {order.customerNote}
                  </div>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}

      <p className="mt-8 text-[0.75rem] text-ink-faint">
        Orders are matched to your account by email address, so anything you
        bought as a guest with {customer.email} appears here too.
      </p>
    </div>
  );
}
