"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";

/** Dark bar pinned to the bottom of the product page once you scroll past the
 *  main Add to Cart button. */
export function StickyAddToCart({ product }: { product: ProductWithImages }) {
  const { add } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  const soldOut = product.trackInventory && product.inventory <= 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-[#2b2b2b] text-white">
      <div className="mx-auto flex max-w-[1460px] items-center gap-4 px-gutter py-3">
        {product.images[0] && (
          <span className="relative size-[54px] shrink-0 overflow-hidden bg-white/10">
            <Image
              src={product.images[0].src}
              alt=""
              fill
              sizes="54px"
              className="object-cover"
            />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.875rem]">{product.title}</p>
          <p className="mt-0.5 text-[0.875rem] font-medium">{formatINR(product.price)}</p>
        </div>

        <button
          type="button"
          disabled={soldOut}
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
          className="shrink-0 bg-white px-10 py-3.5 text-[0.8125rem] font-medium tracking-[0.16em] uppercase text-ink transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {soldOut ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
