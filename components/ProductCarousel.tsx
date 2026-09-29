"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { ProductWithImages } from "@/lib/queries";

/**
 * The homepage product rail: three cards per view on desktop, paged by
 * circular prev/next arrows with a dot per page, matching the live theme.
 */

function perViewFor(width: number): number {
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d={dir === "prev" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCarousel({ products }: { products: ProductWithImages[] }) {
  const [perView, setPerView] = useState(3);
  const [requestedPage, setRequestedPage] = useState(0);

  useEffect(() => {
    const update = () => setPerView(perViewFor(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(products.length / perView));

  // Derived, not stored: if the breakpoint changes and there are now fewer
  // pages, the clamp happens during render rather than in an effect.
  const page = Math.min(requestedPage, pageCount - 1);

  const step = (delta: number) =>
    setRequestedPage((page + delta + pageCount) % pageCount);

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: "translateX(-" + page * 100 + "%)" }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="shrink-0 px-2.5"
              style={{ width: 100 / perView + "%" }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous products"
            className="absolute -left-3 top-[28%] flex size-11 items-center justify-center rounded-full bg-ground text-ink shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-ink hover:text-ground lg:-left-5"
          >
            <Arrow dir="prev" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next products"
            className="absolute -right-3 top-[28%] flex size-11 items-center justify-center rounded-full bg-ground text-ink shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-ink hover:text-ground lg:-right-5"
          >
            <Arrow dir="next" />
          </button>

          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRequestedPage(i)}
                aria-label={"Go to page " + (i + 1)}
                aria-current={i === page}
                className={
                  "size-2.5 rounded-full transition-colors " +
                  (i === page ? "bg-ink" : "bg-ink/25 hover:bg-ink/50")
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
