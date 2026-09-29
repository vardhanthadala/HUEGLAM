"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthModal } from "./AuthModal";

/**
 * Shown in place of the checkout form when nobody is signed in.
 * Signing in refreshes the route, which re-runs the layout's session check and
 * reveals the real checkout.
 */
export function CheckoutAuthGate() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[520px] px-gutter py-20 text-center">
      <h1 className="text-[1.5rem] text-ink">Sign in to check out</h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
        We keep your order history and delivery details in your account, so you
        can track everything you have bought from us in one place.
      </p>

      <button
        type="button"
        onClick={() => setAuthOpen(true)}
        className="mt-8 w-full rounded-lg bg-black py-4 text-[0.8125rem] font-medium tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-85"
      >
        Login
      </button>

      <p className="mt-4 text-[0.875rem] text-ink">
        New customer?{" "}
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="underline underline-offset-4 hover:opacity-70"
        >
          Register
        </button>
      </p>

      <p className="mt-10 border-t border-line pt-6 text-[0.8125rem] text-ink-soft">
        Your cart is saved. Nothing is lost while you sign in.
      </p>

      <Link
        href="/cart"
        className="mt-4 inline-block text-[0.8125rem] text-ink underline underline-offset-4"
      >
        Back to cart
      </Link>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
