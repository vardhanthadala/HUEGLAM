import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductTabs } from "@/components/ProductTabs";
import { ProductCarousel } from "@/components/ProductCarousel";
import { StickyAddToCart } from "@/components/StickyAddToCart";
import {
  getProductByHandle,
  getPublishedProducts,
  getRelatedProducts,
  getUnitsSoldSince,
} from "@/lib/queries";
import { paiseToRupees } from "@/lib/money";

export const revalidate = 300;

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((p) => ({ handle: p.handle }));
}

type PageProps = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Product not found" };

  return {
    title: product.title,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images[0] ? [{ url: product.images[0].src }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const [related, soldRecently] = await Promise.all([
    getRelatedProducts(product.id, 4),
    getUnitsSoldSince(product.id, 24),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: "HUEGLAM" },
    image: product.images.map((i) => i.src),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: paiseToRupees(product.price).toFixed(2),
      availability:
        product.trackInventory && product.inventory <= 0
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1200px] px-gutter">
        <nav className="py-6 text-[0.875rem] text-ink-soft">
          <Link href="/" className="hover:text-ink">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{product.title}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.images} title={product.title} />
          <ProductDetail product={product} soldRecently={soldRecently} />
        </div>

        <section className="mt-20">
          <ProductTabs bodyHtml={product.bodyHtml} />
        </section>

        {/* Certification badges */}
        <section className="py-16">
          <div className="relative aspect-[1653/247] w-full">
            <Image
              src="/brand/Huegalm_Safe_and_Scientific_917fd176-2f2a-4f9d-931b-2251834a0bf5.jpg"
              alt="Dermatologically tested, cruelty free, vegan, pH balanced, no phthalates, no sulphate, no parabens"
              fill
              sizes="(min-width: 1200px) 1160px, 100vw"
              className="object-contain"
            />
          </div>
        </section>
      </div>

      {/* Brand statement */}
      <section className="w-full bg-gradient-to-b from-white to-[#faf7ec] py-20">
        <div className="mx-auto max-w-[900px] px-gutter text-center">
          <p className="text-[0.875rem] tracking-[3px] uppercase text-ink">HUEGLAM</p>
          <p className="mt-6 text-[1.125rem] leading-[1.7] text-ink">
            We Stand Out By Delivering Clean, Cruelty-Free, And
            Dermatologist-Approved Skincare &amp; Cosmetics That Cater To The Bold
            Self-Expression &amp; Versatile Needs Of Modern Women. With Vibrant
            Hues, Multitasking Products, And Sustainability At Its Core, HUEGLAM
            Redefines Beauty For The Empowered Generation.&rdquo;
          </p>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-gutter py-16">
          <h2 className="mb-12 text-center text-[28px] font-light tracking-[3px] uppercase text-ink">
            You May Also Like
          </h2>
          <ProductCarousel products={related} />
        </section>
      )}

      <StickyAddToCart product={product} />
    </>
  );
}
