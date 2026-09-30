"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { HeroSlide } from "@/lib/content";

/**
 * The homepage slideshow. Two image-only slides on a #f8ede7 ground, with
 * separate desktop (3:1) and mobile (4:5) artwork, auto-advancing every 5s to
 * match the theme's --slide-rotate.
 */

type Slide = {
  id: string;
  desktop: string;
  mobile: string;
  alt: string;
};

const ROTATE_MS = 4000;

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const SLIDES: Slide[] = slides.map((s) => ({
    id: s.id,
    desktop: s.desktopImage,
    mobile: s.mobileImage || s.desktopImage,
    alt: s.alt,
  }));
  const [index, setIndex] = useState(0);

  const count = SLIDES.length;
  const go = useCallback(
    (next: number) => setIndex(((next % (count || 1)) + count) % (count || 1)),
    [count],
  );

  useEffect(() => {
    if (count < 2) return;

    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % count);
    }, ROTATE_MS);

    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-hero"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.id || slide.desktop}
          aria-hidden={i !== index}
          className={
            "transition-opacity duration-1000 ease-in-out " +
            (i === index ? "opacity-100 z-10" : "pointer-events-none absolute inset-0 opacity-0 z-0")
          }
        >
          {/* Mobile artwork, 4:5 */}
          <div className="relative aspect-[4/5] w-full lg:hidden overflow-hidden">
            <Image
              src={slide.mobile}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover transition-transform duration-7000 ease-out ${
                i === index ? "scale-105" : "scale-100"
              }`}
            />
          </div>
          {/* Desktop artwork: Fine-tuned height */}
          <div className="relative hidden h-[495px] w-full xl:h-[570px] 2xl:h-[640px] lg:block overflow-hidden">
            <Image
              src={slide.desktop}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover object-center transition-transform duration-7000 ease-out ${
                i === index ? "scale-105" : "scale-100"
              }`}
            />
          </div>
        </div>
      ))}

      {SLIDES.length > 1 && (
        /* Pagination indicator dots */
        <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2 lg:bottom-7">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id || slide.desktop}
              type="button"
              onClick={() => go(i)}
              aria-label={"Go to slide " + (i + 1)}
              aria-current={i === index}
              className={
                "h-2.5 rounded-full transition-all duration-300 " +
                (i === index
                  ? "w-8 bg-[#ff6f2e] shadow"
                  : "w-2.5 bg-black/30 hover:bg-black/50")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
