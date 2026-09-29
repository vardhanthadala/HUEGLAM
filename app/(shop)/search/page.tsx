import type { Metadata } from "next";
import { SearchResults } from "@/components/SearchResults";
import { getPublishedProducts } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage() {
  const products = await getPublishedProducts();
  return (
    <div className="mx-auto max-w-7xl px-gutter py-12">
      <h1 className="mb-8 text-2xl font-light tracking-tight sm:text-3xl">Search</h1>
      <SearchResults products={products} />
    </div>
  );
}
