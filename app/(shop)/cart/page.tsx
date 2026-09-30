"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatINR } from "@/lib/money";

export default function CartPage() {
  const { lines, note, subtotal, setQuantity, remove, setNote, ready } = useCart();

  if (!ready) {
    return <div className="mx-auto max-w-[1200px] px-gutter py-20" aria-busy="true" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-gutter py-28 text-center">
        <h1 className="text-[28px] font-light tracking-tight">Your Cart</h1>
        <p className="text-sm text-ink-soft">Your cart is currently empty.</p>
        <Link
          href="/collections/all"
          className="mt-2 bg-ink px-8 py-3.5 text-[0.75rem] font-medium tracking-[0.16em] uppercase text-white transition-opacity hover:opacity-85"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-gutter py-10">
      <h1 className="text-[28px] font-light tracking-tight text-ink">Your Cart</h1>

      {/* Free Shipping Progress Banner */}
      <div className="mt-6 rounded-lg border border-line bg-[#fafafa] p-4">
        {subtotal >= 99900 ? (
          <div className="flex items-center gap-2.5 text-[0.875rem] font-medium text-emerald-700">
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span>You've unlocked <strong>FREE Standard Delivery</strong> on this order!</span>
          </div>
        ) : (
          <div>
            <p className="text-[0.875rem] text-ink">
              Add <strong className="font-semibold text-ink">{formatINR(99900 - subtotal)}</strong> more to get <strong className="text-emerald-700">FREE Delivery</strong>
            </p>
            <div className="mt-2.5 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#e5e7eb]">
              <div
                className="h-full rounded-full bg-ink transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.round((subtotal / 99900) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_370px] lg:gap-10">
        {/* Line items */}
        <div>
          <div className="grid grid-cols-[1fr_130px_110px] items-center border-b border-line pb-3 text-[0.8125rem] text-ink-soft">
            <span>Product</span>
            <span className="text-center">Quantity</span>
            <span className="text-right">Total</span>
          </div>

          <ul className="divide-y divide-line">
            {lines.map((line) => (
              <li
                key={line.productId}
                className="grid grid-cols-[1fr_130px_110px] items-center gap-4 py-7"
              >
                <div className="flex min-w-0 gap-5">
                  <Link
                    href={"/products/" + line.handle}
                    className="relative aspect-2/3 w-25 shrink-0 overflow-hidden bg-ground-alt"
                  >
                    {line.image && (
                      <Image
                        src={line.image}
                        alt=""
                        fill
                        sizes="100px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="min-w-0">
                    <Link
                      href={"/products/" + line.handle}
                      className="block text-[0.875rem] leading-[1.6] text-ink hover:opacity-70"
                    >
                      {line.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="mt-1.5 text-[0.8125rem] text-ink-soft underline underline-offset-4 hover:text-ink"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="mx-auto flex items-center border border-line">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    className="px-3.5 py-2.5 text-[0.9375rem] hover:bg-ground-alt"
                    aria-label="Decrease quantity"
                  >
                    &minus;
                  </button>
                  <span className="min-w-8 text-center text-[0.875rem]">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    className="px-3.5 py-2.5 text-[0.9375rem] hover:bg-ground-alt"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <span className="text-right text-[0.875rem] text-ink">
                  {formatINR(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Summary */}
        <aside className="h-fit bg-ground-alt p-6">
          <label
            htmlFor="cart-note"
            className="block text-[0.875rem] text-ink"
          >
            Special instructions for seller
          </label>
          <textarea
            id="cart-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-3 w-full resize-y border border-line bg-white px-3 py-2.5 text-[0.875rem] outline-none focus:border-ink"
          />

          <div className="mt-6 flex items-baseline justify-between">
            <span className="text-[0.9375rem] text-ink">Total</span>
            <span className="text-[1.375rem] font-semibold text-ink">
              {formatINR(subtotal)}
            </span>
          </div>

          <p className="mt-2 text-[0.8125rem] text-ink-soft">
            Taxes and{" "}
            <Link
              href="/pages/shipping-policy"
              className="underline underline-offset-4 hover:text-ink"
            >
              shipping
            </Link>{" "}
            calculated at checkout
          </p>

          <Link
            href="/checkout"
            className="mt-5 block bg-black py-4 text-center text-[0.8125rem] font-medium tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-85"
          >
            Check Out
          </Link>
        </aside>
      </div>
    </div>
  );
}
