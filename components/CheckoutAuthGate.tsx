"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { AuthModal } from "./AuthModal";
import { formatINR } from "@/lib/money";

export function CheckoutAuthGate() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { lines, subtotal, ready } = useCart();

  const totalItems = lines.reduce((acc, l) => acc + l.quantity, 0);

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-2">
      {/* Left: Professional Shopify-style Checkout Sign-in Portal */}
      <div className="relative z-10 lg:flex lg:justify-end">
        <div className="w-full px-gutter py-12 lg:max-w-[560px] lg:px-12">
          {/* Breadcrumb Steps */}
          <nav className="flex items-center gap-2 text-[0.8125rem] text-[#707070]">
            <Link href="/cart" className="hover:text-ink">
              Cart
            </Link>
            <span className="text-[#a0a0a0]">&rsaquo;</span>
            <span className="font-semibold text-ink">Account</span>
            <span className="text-[#a0a0a0]">&rsaquo;</span>
            <span className="text-[#a0a0a0]">Delivery</span>
            <span className="text-[#a0a0a0]">&rsaquo;</span>
            <span className="text-[#a0a0a0]">Payment</span>
          </nav>

          <div className="mt-10">
            <h1 className="text-[1.5rem] font-semibold text-ink">
              Express Checkout
            </h1>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-[#707070]">
              Sign in to use your saved delivery address and track your order.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3.5">
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="w-full rounded-lg bg-black py-4 text-[0.875rem] font-medium tracking-[0.08em] uppercase text-white transition-opacity hover:opacity-85 shadow-sm active:scale-[0.99]"
              >
                Sign In to Account
              </button>

              <button
                type="button"
                onClick={() => openAuth("register")}
                className="w-full rounded-lg border border-[#d9d9d9] bg-white py-4 text-[0.875rem] font-medium tracking-[0.08em] uppercase text-ink transition-colors hover:border-black hover:bg-[#fbfbfb] active:scale-[0.99]"
              >
                Create New Account
              </button>
            </div>

            {/* Reassurance notes */}
            <div className="mt-8 border-t border-[#e5e5e5] pt-6">
              <div className="flex items-center gap-2.5 text-[0.8125rem] text-[#707070]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#2563eb]">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Encrypted 256-bit SSL transaction</span>
              </div>
              <p className="mt-2 text-[0.8125rem] text-[#707070]">
                Your cart is saved. Nothing will be removed while you sign in.
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/cart"
                className="text-[0.8125rem] text-[#1a73e8] hover:underline"
              >
                &larr; Return to cart
              </Link>
            </div>
          </div>

          {/* Footer Policies */}
          <nav className="mt-16 flex flex-wrap gap-5 border-t border-[#e5e5e5] pt-6 text-[0.8125rem] text-[#1a73e8]">
            <Link href="/pages/refund-policy" className="hover:underline">
              Refund policy
            </Link>
            <Link href="/pages/shipping-policy" className="hover:underline">
              Shipping policy
            </Link>
            <Link href="/pages/privacy-policy" className="hover:underline">
              Privacy policy
            </Link>
            <Link href="/pages/terms-of-service" className="hover:underline">
              Terms of service
            </Link>
          </nav>
        </div>
      </div>

      {/* Right: Identical Standard Shopify Summary Sidebar */}
      <aside className="border-l border-line bg-[#f5f5f5] lg:sticky lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:overflow-y-auto self-start">
        <div className="w-full px-gutter py-12 lg:max-w-[560px] lg:px-12">
          {ready && lines.length > 0 ? (
            <>
              <ul className="flex flex-col gap-5">
                {lines.map((line) => (
                  <li key={line.productId} className="flex items-center gap-4">
                    <div className="relative size-16 shrink-0">
                      <div className="relative h-full w-full overflow-hidden rounded-lg border border-line bg-white">
                        {line.image && (
                          <Image src={line.image} alt="" fill sizes="64px" className="object-cover" />
                        )}
                      </div>
                      <span className="absolute -right-2 -top-2 z-10 flex size-[22px] items-center justify-center rounded-full bg-[#5c5c5c] text-[0.6875rem] font-medium text-white">
                        {line.quantity}
                      </span>
                    </div>
                    <p className="min-w-0 flex-1 text-[0.875rem] leading-snug text-ink">
                      {line.title}
                    </p>
                    <span className="shrink-0 text-[0.875rem] font-medium text-ink">
                      {formatINR(line.price * line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-8 flex flex-col gap-3 border-t border-[#e5e5e5] pt-6 text-[0.875rem]">
                <div className="flex justify-between">
                  <dt className="text-ink">Subtotal &middot; {totalItems} items</dt>
                  <dd className="text-ink font-medium">{formatINR(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink">Shipping</dt>
                  <dd className="text-[#707070]">
                    {subtotal >= 99900 ? "FREE" : "Calculated next step"}
                  </dd>
                </div>
                <div className="mt-2 flex justify-between border-t border-[#e5e5e5] pt-4 text-[1.125rem] font-bold text-ink">
                  <dt>Total</dt>
                  <dd className="flex items-baseline gap-2">
                    <span className="text-xs font-normal text-[#707070]">INR</span>
                    <span>{formatINR(subtotal)}</span>
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-[#707070]">Your cart is currently empty.</p>
          )}
        </div>
      </aside>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
