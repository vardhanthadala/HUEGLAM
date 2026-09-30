"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconNote() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M7 10h10M7 14h6" strokeLinecap="round" />
    </svg>
  );
}

export function CartDrawer({ products }: { products: ProductWithImages[] }) {
  const router = useRouter();
  const { lines, note, count, subtotal, isOpen, closeCart, setQuantity, remove, setNote, add } =
    useCart();
  const [noteOpen, setNoteOpen] = useState(false);
  // Edited separately from the saved note so Close can discard the changes.
  const [draft, setDraft] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Smooth entrance and exit animations
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = requestAnimationFrame(() => {
        setAnimating(true);
      });
      // Lock background scrolling
      document.body.style.overflow = "hidden";
      return () => cancelAnimationFrame(timer);
    } else {
      setAnimating(false);
      const timer = setTimeout(() => {
        setMounted(false);
        document.body.style.overflow = "";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        closeCart();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  // Build product inventory lookup to cap + button dynamically
  const productStockMap = useMemo(() => {
    const map = new Map<string, { trackInventory: boolean; inventory: number }>();
    for (const p of products) {
      map.set(p.id, {
        trackInventory: Boolean(p.trackInventory),
        inventory: typeof p.inventory === "number" ? p.inventory : 999,
      });
    }
    return map;
  }, [products]);

  if (!mounted && !isOpen) return null;

  const inCart = new Set(lines.map((l) => l.productId));
  const recommendations = products.filter((p) => !inCart.has(p.id)).slice(0, 4);

  function goToCheckout() {
    if (!agreed) return;
    closeCart();
    router.push("/checkout");
  }

  /* Product photography is 2:3, so thumbnails keep that ratio rather than
     being cropped to a square. */
  const thumb = "relative w-20 shrink-0 overflow-hidden bg-ground-alt aspect-2/3";

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        animating ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={closeCart}
        aria-label="Close cart"
      />

      {/* Drawer Panel */}
      <aside
        className={`absolute inset-y-0 right-0 flex w-[843px] max-w-full bg-white shadow-2xl transition-transform duration-300 ease-out ${
          animating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* You may also like */}
        <div className="hidden w-[353px] shrink-0 flex-col border-r border-line lg:flex">
          <h2 className="px-[26px] pt-6 pb-4 text-[0.9375rem] text-ink">You May Also Like</h2>

          <ul className="flex-1 overflow-y-auto px-[26px] pb-6">
            {recommendations.map((product) => (
              <li key={product.id} className="flex gap-5 py-4">
                <Link
                  href={"/products/" + product.handle}
                  onClick={closeCart}
                  className={thumb}
                >
                  {product.images[0] && (
                    <Image
                      src={product.images[0].src}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={"/products/" + product.handle}
                    onClick={closeCart}
                    className="block text-[15px] leading-[1.6] text-ink hover:opacity-70"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span
                      className={
                        "text-[15px] " +
                        (product.compareAtPrice ? "text-sale-ink" : "text-ink")
                      }
                    >
                      {formatINR(product.price)}
                    </span>
                    {product.compareAtPrice && (
                      <span className="text-[0.8125rem] text-ink-faint line-through">
                        {formatINR(product.compareAtPrice)}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      add({
                        productId: product.id,
                        handle: product.handle,
                        title: product.title,
                        image: product.images[0]?.src ?? null,
                        price: product.price,
                        compareAtPrice: product.compareAtPrice,
                      })
                    }
                    className="mt-2 text-[0.8125rem] text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    + Add to Cart
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Cart */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-[26px] pt-6 pb-4">
            <h2 className="flex items-center gap-2.5 text-[1rem] text-ink">
              Cart
              <span className="flex size-6 items-center justify-center rounded-full bg-ink text-[0.75rem] font-medium text-white">
                {count}
              </span>
            </h2>
            <button
              type="button"
              onClick={closeCart}
              aria-label="Close cart"
              className="text-ink transition-opacity hover:opacity-60"
            >
              <IconClose />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          {lines.length > 0 && (
            <div className="border-t border-line bg-[#fafafa] px-[26px] py-3.5">
              {subtotal >= 99900 ? (
                <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-emerald-700">
                  <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>Congratulations! You've unlocked <strong>FREE Standard Delivery</strong>!</span>
                </div>
              ) : (
                <div>
                  <p className="text-[0.8125rem] text-ink">
                    Add <strong className="font-semibold text-ink">{formatINR(99900 - subtotal)}</strong> more to get <strong className="text-emerald-700">FREE Delivery</strong>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
                    <div
                      className="h-full rounded-full bg-ink transition-all duration-300 ease-out"
                      style={{ width: `${Math.min(100, Math.round((subtotal / 99900) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-[0.9375rem] text-ink-soft">Your cart is empty.</p>
              <Link
                href="/collections/all"
                onClick={closeCart}
                className="bg-ink px-6 py-3 text-[0.75rem] font-medium tracking-[0.16em] uppercase text-white"
              >
                Shop skincare
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 overflow-y-auto border-t border-line px-[26px]">
                {lines.map((line) => (
                  <li key={line.productId} className="flex gap-5 py-6">
                    <Link
                      href={"/products/" + line.handle}
                      onClick={closeCart}
                      className={thumb}
                    >
                      {line.image && (
                        <Image
                          src={line.image}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={"/products/" + line.handle}
                        onClick={closeCart}
                        className="block text-[15px] leading-[1.6] text-ink hover:opacity-70"
                      >
                        {line.title}
                      </Link>
                      <p className="mt-1.5 text-[0.875rem] text-ink-faint">
                        {formatINR(line.price)} x {line.quantity}
                      </p>

                      {(() => {
                        const stockInfo = productStockMap.get(line.productId);
                        const isStockCapped =
                          Boolean(stockInfo?.trackInventory) &&
                          line.quantity >= (stockInfo?.inventory ?? 0);

                        return (
                          <>
                            <div className="mt-4 inline-flex items-center border border-line">
                              <button
                                type="button"
                                onClick={() => setQuantity(line.productId, line.quantity - 1)}
                                className="px-3.5 py-2 text-[0.9375rem] hover:bg-ground-alt"
                                aria-label="Decrease quantity"
                              >
                                &minus;
                              </button>
                              <span className="min-w-9 text-center text-[0.875rem]">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={isStockCapped}
                                onClick={() => {
                                  if (!isStockCapped) {
                                    setQuantity(line.productId, line.quantity + 1);
                                  }
                                }}
                                className={`px-3.5 py-2 text-[0.9375rem] ${
                                  isStockCapped
                                    ? "cursor-not-allowed text-ink-faint opacity-40"
                                    : "hover:bg-ground-alt"
                                }`}
                                aria-label="Increase quantity"
                                title={isStockCapped ? "Maximum available stock reached" : "Increase quantity"}
                              >
                                +
                              </button>
                            </div>
                            {isStockCapped && (
                              <p className="mt-1 text-[0.75rem] text-ink-soft">
                                Max stock reached ({stockInfo?.inventory} in stock)
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.productId)}
                      className="self-start text-[0.875rem] text-ink-soft underline underline-offset-4 hover:text-ink"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              {/* Footer */}
              <div className="relative border-t border-line px-[26px] py-5">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(note);
                    setNoteOpen(true);
                  }}
                  aria-expanded={noteOpen}
                  className={
                    "flex items-center gap-2.5 text-[0.9375rem] transition-opacity " +
                    (noteOpen ? "text-ink-faint" : "text-ink hover:opacity-70")
                  }
                >
                  <IconNote />
                  Order Note
                </button>

                <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
                  <span className="text-[1rem] font-semibold text-ink">Total:</span>
                  <span className="text-[1rem] font-semibold text-ink">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
                  Taxes and shipping calculated at checkout
                </p>

                <label className="mt-4 flex items-center gap-3 text-[0.875rem] text-ink">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="size-[18px] accent-ink"
                  />
                  <span>
                    I agree with the{" "}
                    <Link
                      href="/pages/terms-of-service"
                      onClick={closeCart}
                      className="underline underline-offset-4"
                    >
                      terms and conditions
                    </Link>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={goToCheckout}
                  disabled={!agreed}
                  title={agreed ? undefined : "Please accept the terms and conditions first"}
                  className="mt-4 w-full py-3.5 text-[0.875rem] font-medium tracking-[0.16em] uppercase text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#5a5a5a] enabled:bg-ink enabled:hover:opacity-85"
                >
                  Check Out
                </button>

                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="mt-4 block text-center text-[0.875rem] tracking-[0.1em] uppercase text-ink underline underline-offset-4"
                >
                  View Cart
                </Link>

                {/* Note editor slides over the totals, leaving the dimmed
                    "Order Note" row visible above it. */}
                {noteOpen && (
                  <div className="absolute inset-x-0 bottom-0 top-[60px] border-t border-line bg-white px-[26px] py-6">
                    <h3 className="text-[0.9375rem] text-ink">Add Order Note</h3>

                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={3}
                      autoFocus
                      aria-label="Order note"
                      className="mt-4 w-full resize-y border border-ink/70 px-3 py-2.5 text-[0.875rem] outline-none focus:border-ink"
                    />

                    <div className="mt-5 flex items-center gap-7">
                      <button
                        type="button"
                        onClick={() => {
                          setNote(draft);
                          setNoteOpen(false);
                        }}
                        className="bg-ink px-9 py-3.5 text-[0.8125rem] font-medium tracking-[0.16em] uppercase text-white transition-opacity hover:opacity-85"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteOpen(false)}
                        className="text-[0.875rem] text-ink underline underline-offset-4 hover:opacity-70"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
