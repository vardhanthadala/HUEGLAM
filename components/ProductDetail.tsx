"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import {
  ProductAccordion,
  IconCare,
  IconShipping,
} from "./ProductAccordion";
import { discountPercent, formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";

const PAYMENT_METHODS = ["UPI", "Cards", "Net Banking", "Wallets", "EMI"];

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
          <p>- Free shipping above 999/-</p>
          <p>- Ships within 1-2 business days.</p>
          <p>- Ships in our fully recyclable and biodegradable signature boxes.</p>
        </ProductAccordion>

        <ProductAccordion title="Care Guide" icon={<IconCare />}>
          <p>
            Apply the sunscreen at least fifteen to thirty minutes before going
            outside so the formula can soak in. Ensure that you apply sunscreen to
            all the exposed parts of your body, including the face, ears, neck, and
            hands.
          </p>
        </ProductAccordion>
      </div>

      {/* Only shown when there is a real number behind it. */}
      {soldRecently !== null && soldRecently > 0 && (
        <p className="mt-6 text-[0.875rem] text-ink">
          <span className="font-semibold">{soldRecently}</span> sold in the last 24
          hours
        </p>
      )}

      <div className="mt-8">
        <p className="text-center text-[0.875rem] text-ink">Guarantee Safe Checkout</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border border-line px-5 py-5">
          {PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="border border-line px-3 py-1.5 text-[0.75rem] tracking-[0.04em] text-ink-soft"
            >
              {method}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
