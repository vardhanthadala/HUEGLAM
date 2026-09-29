"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { ProductWithImages } from "@/lib/queries";

/**
 * Client-side search. With a catalogue this size there is no reason to make a
 * round trip — the whole list is already on the page.
 */
export function SearchResults({ products }: { products: ProductWithImages[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.title, p.description, p.sku ?? "", ...p.tags]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, query]);

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for serum, sunscreen, face wash..."
        autoFocus
        className="w-full max-w-lg border border-line px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
      />

      <p className="mt-4 text-[0.6875rem] tracking-[0.08em] uppercase text-ink-faint">
        {results.length} {results.length === 1 ? "result" : "results"}
      </p>

      {results.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-sm text-ink-soft">
          Nothing matched that. Try &ldquo;serum&rdquo; or &ldquo;sunscreen&rdquo;.
        </p>
      )}
    </>
  );
}
