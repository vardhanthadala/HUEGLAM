import Image from "next/image";
import Link from "next/link";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Marquee } from "@/components/Marquee";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ReelsCarousel } from "@/components/ReelsCarousel";
import { InstagramCarousel } from "@/components/InstagramCarousel";
import { getInstagramPosts } from "@/lib/instagram";
import { getPublishedProducts } from "@/lib/queries";

export const revalidate = 300;

export default async function HomePage() {
  const [products, instagramPosts] = await Promise.all([
    getPublishedProducts(),
    getInstagramPosts(6),
  ]);

  return (
    <>
      <HeroSlideshow />

      <Marquee />

      {/* Intro */}
      <section className="mx-auto max-w-[1600px] px-gutter py-12">
        <div className="mx-auto max-w-[750px] text-center">
          <h2 className="h-section mb-3">Skincare For Every Shade Of Beautiful</h2>
          <p className="mb-5 text-[1rem] leading-6 text-body">
            our products treat your skin with the proper vitamins for every season so it&rsquo;s healthy year_round.
          </p>
          <Link href="/collections/all" className="btn-theme">
            All Products
          </Link>
        </div>
      </section>

      {/* Product rail. Narrower container than the rest of the page, so the
          three cards land at ~370px wide as on the live site. */}
      <section className="mx-auto max-w-[1200px] px-gutter pb-16">
        <ProductCarousel products={products} />
      </section>

      {/* Certification badges. Constrained to the same 1200px container as the
          product rail, not full-bleed, so the circles come out ~126px across. */}
      <section className="mx-auto max-w-[1200px] px-gutter py-12">
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

      {/* "Backed by science" panel. The grey card, copy and cut-out model are
          all baked into this one asset, so it just needs the 1200px container
          rather than running full-bleed. */}
      <section className="mx-auto max-w-[1200px] px-gutter pb-8">
        <div className="relative aspect-[4097/1743] w-full">
          <Image
            src="/brand/mb2.1.png"
            alt="Backed by science. Loved by skin. Every drop is crafted to deliver real results. Dermatologist-tested, clean, and powered by Korean skincare innovation."
            fill
            sizes="(min-width: 1200px) 1160px, 100vw"
            className="object-contain"
          />
        </div>
      </section>

      {/* Shoppable video reels */}
      <section className="mx-auto max-w-[1200px] px-gutter pb-16">
        <ReelsCarousel products={products} />
      </section>

      {/* Brand statement: grey ground, two overlapping photos on the left,
          copy in a white card on the right. */}
      <section className="w-full bg-ground-alt py-14 lg:py-20">
        <div className="mx-auto grid max-w-[1460px] items-center gap-10 px-gutter lg:grid-cols-2 lg:gap-7">
          {/* Overlapping photo pair */}
          <div className="relative aspect-[714/299] w-full">
            <div className="absolute right-0 top-0 aspect-3/2 w-[53.2%]">
              <Image
                src="/brand/123456.jpg"
                alt="Two HUEGLAM models"
                fill
                sizes="(min-width: 1024px) 380px, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 aspect-3/2 w-[53.2%]">
              <Image
                src="/brand/model-in-neutral-colors-by-window.jpg"
                alt="HUEGLAM model in neutral tones by a window"
                fill
                sizes="(min-width: 1024px) 380px, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* White copy card */}
          <div className="flex items-center bg-ground px-8 py-12 lg:px-12 lg:py-14">
            <div>
              <p className="mb-3 text-[0.8125rem] tracking-[2px] uppercase text-ink-soft">
                HUEGLAM
              </p>
              <h2 className="mb-4 text-[30px] leading-tight font-bold tracking-[1.5px] uppercase text-ink">
                Embrace Your True Hue
              </h2>
              <p className="text-[0.875rem] leading-[1.7] text-body">
                &ldquo;At HUEGLAM, our mission is to empower individuals to embrace
                their unique beauty through innovative, high-quality skincare and
                cosmetics. We strive to make self-expression effortless and
                accessible, blending cutting-edge formulations with vibrant
                aesthetics for every shade, style, and story.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="mx-auto max-w-[1200px] px-gutter py-14">
        <p className="mb-2 text-center text-[0.875rem] tracking-[2px] uppercase text-ink-soft">
          Follow Us on Instagram
        </p>
        <h3 className="mb-8 text-center text-[30px] font-bold text-ink">
          <a
            href="https://www.instagram.com/hueglam_official"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:opacity-70"
          >
            @Hueglam_official
          </a>
        </h3>
        <InstagramCarousel posts={instagramPosts} />
      </section>
    </>
  );
}
