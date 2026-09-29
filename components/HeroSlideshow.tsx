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
  desktop: string;
  mobile: string;
  alt: string;
};


const ROTATE_MS = 5000;

export function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const SLIDES: Slide[] = slides.map((s) => ({
    desktop: s.desktopImage,
    mobile: s.mobileImage,
    alt: s.alt,
  }));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = SLIDES.length;
  const go = useCallback(
    // count || 1 keeps the modulo defined when there are no banners yet.
    (next: number) => setIndex(((next % (count || 1)) + count) % (count || 1)),
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;

    // Respect a reduced-motion preference by not auto-advancing.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  // After the hooks, never before: with no banners saved there is nothing to
  // show, and an empty hero band would just be a coloured gap.
  if (count === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-hero"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.desktop}
          aria-hidden={i !== index}
          className={
            "transition-opacity duration-700 " +
            (i === index ? "opacity-100" : "pointer-events-none absolute inset-0 opacity-0")
          }
        >
          {/* Mobile artwork, 4:5 */}
          <div className="relative aspect-4/5 w-full lg:hidden">
            <Image
              src={slide.mobile}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
          </div>
          {/* Desktop artwork. Measured off the live theme: the slideshow is a
              fixed 702px tall (unchanged across viewport heights) and its
              carousel track runs ~6.9% wider than the viewport, so the 3:1
              banner is cover-cropped against that slightly wider box. */}
          <div className="relative hidden h-[702px] w-[106.9%] -ml-[3.45%] lg:block">
            <Image
              src={slide.desktop}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="107vw"
              className="object-cover object-center"
            />
          </div>
        </div>
      ))}

      {SLIDES.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 lg:bottom-7">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.desktop}
              type="button"
              onClick={() => go(i)}
              aria-label={"Go to slide " + (i + 1)}
              aria-current={i === index}
              className={
                "size-2.5 rounded-full border border-ink/30 transition-colors " +
                (i === index ? "bg-[#ff6f2e]" : "bg-ink/20 hover:bg-ink/40")
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
