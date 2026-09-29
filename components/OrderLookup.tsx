"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatINR } from "@/lib/money";

type LookupItem = {
  id: number;
  title: string;
  handle: string;
  image: string | null;
  quantity: number;
  lineTotal: number;
};

type LookupOrder = {
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  city: string;
  state: string;
  pincode: string;
};

/** Order tracking for people who checked out without an account. */
export function OrderLookup() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ order: LookupOrder; items: LookupItem[] } | null>(
    null,
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not find that order.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full border border-line px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink";

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        <input
          className={field}
          placeholder="Order number (e.g. HG3F2K9QWERT)"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
        />
        <input
          className={field}
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-ink py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-ground transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? "Looking up..." : "Find my order"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-5 border border-sale-ink/30 bg-sale px-4 py-3 text-sm text-sale-ink">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-10 border-t border-line pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[0.6875rem] tracking-[0.1em] uppercase">
              {result.order.orderNumber}
            </h2>
            <span className="text-[0.6875rem] tracking-[0.1em] uppercase text-ink-soft">
              {result.order.status}
            </span>
          </div>

          <ul className="mt-5 divide-y divide-line">
            {result.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-4">
                <Link
                  href={"/products/" + item.handle}
                  className="relative h-20 w-15 shrink-0 overflow-hidden bg-ground-alt"
                >
                  {item.image && (
                    <Image src={item.image} alt="" fill sizes="60px" className="object-cover" />
                  )}
                </Link>
                <div className="flex-1">
                  <p className="text-[0.75rem] tracking-[0.06em] uppercase">{item.title}</p>
                  <p className="mt-1 text-xs text-ink-soft">Qty {item.quantity}</p>
                </div>
                <span className="text-sm">{formatINR(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-medium">
            <span>Total</span>
            <span>{formatINR(result.order.total)}</span>
          </div>

          {result.order.trackingNumber && (
            <p className="mt-5 text-sm text-ink-soft">
              Tracking &mdash; {result.order.trackingCarrier}: {result.order.trackingNumber}
            </p>
          )}
          <p className="mt-2 text-xs text-ink-faint">
            Shipping to {result.order.city}, {result.order.state} {result.order.pincode}
          </p>
        </section>
      )}
    </>
  );
}
