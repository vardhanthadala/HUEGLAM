"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { discountPercent, formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const { add } = useCart();
  const primary = product.images[0];
  const hover = product.images[1];
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.trackInventory && product.inventory <= 0;
  const onSale = product.compareAtPrice !== null;

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden bg-ground-alt">
        {/* 2:3 portrait, the native ratio of the product photography. */}
        <Link
          href={"/products/" + product.handle}
          className="relative block aspect-2/3 w-full"
        >
          {primary && (
            <Image
              src={primary.src}
              alt={primary.alt || product.title}
              fill
              sizes="(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-opacity duration-500 group-hover:opacity-0"
            />
          )}
          {hover && (
            <Image
              src={hover.src}
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1024px) 390px, (min-width: 640px) 50vw, 100vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {off !== null && (
          <span className="pointer-events-none absolute left-3 top-3 bg-sale px-2 py-1 text-[0.625rem] font-medium tracking-[0.06em] uppercase text-sale-ink">
            Sale &minus;{off}%
          </span>
        )}
        {soldOut && (
          <span className="pointer-events-none absolute right-3 top-3 bg-ink px-2 py-1 text-[0.625rem] font-medium tracking-[0.06em] uppercase text-ground">
            Sold out
          </span>
        )}

        {/* Add to cart slides up on hover, as on the live cards. */}
        <button
          type="button"
          disabled={soldOut}
          onClick={() =>
            add({
              productId: product.id,
              handle: product.handle,
              title: product.title,
              image: primary?.src ?? null,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
            })
          }
          className="absolute inset-x-0 bottom-0 translate-y-full bg-ink py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-ground opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 disabled:bg-ink-faint"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <span className="text-[0.6875rem] tracking-[0.08em] uppercase text-ink-faint">
          {product.vendor}
        </span>
        <Link
          href={"/products/" + product.handle}
          className="font-jost mt-1.5 text-[13px] leading-[1.6] tracking-[1.3px] uppercase text-black hover:opacity-60"
        >
          {product.title}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={
              "text-[0.9375rem] " + (onSale ? "text-sale-ink" : "text-ink")
            }
          >
            {formatINR(product.price)}
          </span>
          {product.compareAtPrice && (
            <span className="text-[0.8125rem] text-ink-faint line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
