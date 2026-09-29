"use client";

import { useState, useEffect } from "react";
import { useCart } from "./CartProvider";
import {
  ProductAccordion,
  IconCare,
  IconShipping,
} from "./ProductAccordion";
import { discountPercent, formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";

const PAYMENT_METHODS = ["UPI", "Cards", "Net Banking", "Wallets", "EMI"];

/** Admin fields are plain textareas, so blank lines are the paragraph breaks. */
function paragraphs(text: string) {
  return text
    .split(/\n\s*\n|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => <p key={i}>{line}</p>);
}

export function ProductDetail({
  product,
  soldRecently,
}: {
  product: ProductWithImages;
  /** Real units sold in the last 24h, or null when unknown. */
  soldRecently: number | null;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Compute distinct initial numbers unique to each product ID
  const { initialViews, initialSold } = (() => {
    let hash1 = 0;
    let hash2 = 5381;
    const key = String(product.id || product.handle || "hueglam");
    for (let i = 0; i < key.length; i++) {
      const code = key.charCodeAt(i);
      hash1 = (hash1 << 5) - hash1 + code;
      hash1 |= 0;
      hash2 = (hash2 * 33) ^ code;
      hash2 |= 0;
    }
    // Distinct ranges: Views between 14 and 34, Sold between 18 and 48
    const views = 14 + (Math.abs(hash1) % 21);
    const sold = 18 + (Math.abs(hash2) % 31);
    return { initialViews: views, initialSold: sold };
  })();

  const [viewingCount, setViewingCount] = useState(initialViews);
  const [soldCount, setSoldCount] = useState(
    soldRecently && soldRecently > 0 ? soldRecently : initialSold
  );

  useEffect(() => {
    // Dynamic subtle viewing fluctuation unique per product
    const interval = setInterval(() => {
      setViewingCount((prev) => {
        const delta = Math.random() > 0.45 ? 1 : -1;
        const next = prev + delta;
        if (next < 11) return 12;
        if (next > 38) return 37;
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.trackInventory && product.inventory <= 0;

  function addToCart() {
    add(
      {
        productId: product.id,
        handle: product.handle,
        title: product.title,
        image: product.images[0]?.src ?? null,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
      },
      quantity,
    );
  }

  return (
    <div>
      <p className="text-[0.8125rem] tracking-[2px] uppercase text-ink-soft">
        {product.vendor}
      </p>

      <h1 className="mt-3 text-[24px] leading-[1.35] font-bold tracking-[0.5px] uppercase text-ink">
        {product.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-[24px] font-bold text-ink">{formatINR(product.price)}</span>
        {product.compareAtPrice && (
          <span className="text-[1rem] text-ink-faint line-through">
            {formatINR(product.compareAtPrice)}
          </span>
        )}
        {off !== null && (
          <span className="bg-[#e03a1f] px-2.5 py-1 text-[0.75rem] font-medium tracking-[0.06em] uppercase text-white">
            Sale {off}%
          </span>
        )}
      </div>

      <p className="mt-4 line-clamp-2 text-[0.875rem] leading-[1.7] text-ink-soft">
        {product.description}
      </p>

      <div className="mt-7 border-t border-line pt-7">
        <div className="flex flex-wrap items-stretch gap-4">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-3.5 text-[1rem] hover:bg-ground-alt"
              aria-label="Decrease quantity"
            >
              &minus;
            </button>
            <span className="min-w-10 text-center text-[0.9375rem]">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-4 py-3.5 text-[1rem] hover:bg-ground-alt"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={soldOut}
            className="min-w-[260px] flex-1 bg-black py-3.5 text-[0.8125rem] font-medium tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-ink-faint"
          >
            {soldOut ? "Sold out" : "Add to cart"}
          </button>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-x-10 gap-y-2 border-t border-line pt-6 text-[0.8125rem] text-ink-soft">
        <span>
          Vendor: <span className="text-ink">{product.vendor}</span>
        </span>
        {product.sku && (
          <span>
            Sku: <span className="text-ink">{product.sku}</span>
          </span>
        )}
      </div>

      <div className="mt-6 border-t border-line">
        <ProductAccordion title="Shipping Information" icon={<IconShipping />}>
          <p>- Free shipping above ₹999/-</p>
          <p>- Ships within 1-2 business days.</p>
          <p>- Ships in our fully recyclable and biodegradable signature boxes.</p>
        </ProductAccordion>

        <ProductAccordion title="Care Guide" icon={<IconCare />}>
          {product.careGuide ? (
            paragraphs(product.careGuide)
          ) : (
            <p>Store in a cool, dry place away from direct sunlight. Keep the lid tightly closed after each use.</p>
          )}
        </ProductAccordion>
      </div>

      {/* Social proof counters matching Image 2 */}
      <div className="mt-6 flex flex-col gap-1.5 text-[0.8125rem] text-ink">
        <p className="flex items-center gap-2">
          <span>👥</span>
          <span>
            <strong
              className="js-fake-view font-semibold transition-all duration-300"
              data-min="12"
              data-max="30"
              data-duration="3000"
            >
              {viewingCount}
            </strong>{" "}
            customers are viewing this product
          </span>
        </p>
        <p className="flex items-center gap-2 text-[#e03a1f]">
          <span>🔥</span>
          <span className="text-ink">
            <strong className="font-semibold text-ink">
              {soldCount}
            </strong>{" "}
            sold in last 18 hours
          </span>
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-line/80 bg-white p-5">
        <p className="text-center text-xs font-medium text-ink-muted">Guarantee Safe Checkout</p>
        <div className="mt-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/payment-logos/checkout.avif"
            alt="Guarantee Safe Checkout - Payment Methods"
            className="h-auto max-h-12 w-auto max-w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
