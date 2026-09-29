import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { getPublishedProducts } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Skincare",
  description:
    "The full HUEGLAM range — face wash, serum, moisturizer and sunscreen, formulated for Indian skin.",
};

export default async function AllProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div className="mx-auto max-w-[1200px] px-gutter py-10">
      {/* Promo banner. The live collection page leads with this instead of a
          breadcrumb, page title or product count. */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 bg-[linear-gradient(125deg,#f9f7f2,#fff2ee_99%)] px-6 py-12 text-center">
        <p className="text-[1.0625rem] font-semibold tracking-[1.5px] uppercase text-ink">
          Your Daily Skin Care
        </p>
        <p className="text-[0.875rem] text-ink-soft">
          Save 10% on your first purchase.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
