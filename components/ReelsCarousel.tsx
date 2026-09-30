"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ReelLightbox } from "./ReelLightbox";
import { formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";
import type { ReelItem } from "@/lib/content";

/**
 * Shoppable video reels, ported from the store's Reelfy section.
 * Each tile is a 9:16 clip with the promoted product overlaid at the bottom.
 * Clips only play while on screen, so four videos are not decoding at once.
 */

type Reel = {
  video: string;
  type: string;
  poster: string;
  handle: string;
  alt: string;
};


function perViewFor(width: number): number {
  if (width >= 1024) return 4;
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

function ReelTile({
  reel,
  product,
  onOpen,
}: {
  reel: Reel;
  product: ProductWithImages | undefined;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play only while visible. Autoplaying four clips at once is wasteful and
  // some browsers refuse it outright.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const attempt = el.play();
            if (attempt && attempt.catch) attempt.catch(() => {});
          } else {
            el.pause();
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const thumb = product?.images[0]?.src ?? null;

  return (
    <div className="group relative aspect-9/16 overflow-hidden bg-ground-alt shadow-sm transition-all duration-500 hover:shadow-lg">
      <video
        ref={videoRef}
        poster={reel.poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={reel.alt}
        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      >
        <source src={reel.video} type={reel.type} />
      </video>

      {/* Clicking the clip opens the full player. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={"Play " + reel.alt}
        className="absolute inset-0 cursor-pointer flex items-center justify-center"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
      </button>

      {product && (
        <Link
          href={"/products/" + product.handle}
          className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-10 transition-opacity hover:opacity-95"
        >
          {thumb && (
            <span className="relative size-10 shrink-0 overflow-hidden rounded bg-white shadow">
              <Image src={thumb} alt="" fill sizes="40px" className="object-cover" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8125rem] font-medium text-white">
              {product.title}
            </span>
            <span className="mt-0.5 flex items-baseline gap-1.5">
              {product.compareAtPrice && (
                <span className="text-[0.75rem] text-white/70 line-through">
                  {formatINR(product.compareAtPrice)}
                </span>
              )}
              <span className="text-[0.8125rem] font-medium text-white">
                {formatINR(product.price)}
              </span>
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}

/**
 * The store has four distinct clips; its carousel clones them to loop, which
 * is why the live site renders eight video elements and two page dots. The
 * duplicate pass here reproduces that, and the clones cost nothing until
 * scrolled to because each tile preloads nothing.
 */


export function ReelsCarousel({
  products,
  reels,
}: {
  products: ProductWithImages[];
  reels: ReelItem[];
}) {
  const REELS: Reel[] = reels.map((r) => ({
    video: r.video,
    type: r.videoType,
    poster: r.poster,
    handle: r.productHandle,
    alt: r.alt,
  }));
  // Only duplicate when there are more items than perView to provide pagination loop.
  // When there are few items (e.g. 1 or 2), display only the exact items added by the admin.
  const TILES: Reel[] = REELS;
  const [perView, setPerView] = useState(4);
  const [requestedPage, setRequestedPage] = useState(0);
  // Index into REELS (the four distinct clips), not into the cloned TILES.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setPerView(perViewFor(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(TILES.length / perView));
  const page = Math.min(requestedPage, pageCount - 1);

  const step = (delta: number) =>
    setRequestedPage((page + delta + pageCount) % pageCount);

  // After the hooks: with no reels saved there is no rail to draw.
  if (REELS.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          className={`flex transition-transform duration-500 ease-out ${
            TILES.length < perView ? "justify-center" : ""
          }`}
          style={{ transform: "translateX(-" + page * 100 + "%)" }}
        >
          {TILES.map((reel, i) => (
            <div
              key={reel.video + "-" + i}
              className="shrink-0 px-2"
              style={{
                width: TILES.length < perView ? `${Math.min(100 / TILES.length, 25)}%` : `${100 / perView}%`,
                maxWidth: "320px",
              }}
            >
              <ReelTile
                reel={reel}
                product={products.find((p) => p.handle === reel.handle)}
                onOpen={() => setOpenIndex(i % REELS.length)}
              />
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous videos"
            className="absolute -left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-ground/90 text-ink shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-colors hover:bg-ink hover:text-ground lg:left-2"
          >
            <Arrow dir="prev" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next videos"
            className="absolute -right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-ground/90 text-ink shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-colors hover:bg-ink hover:text-ground lg:right-2"
          >
            <Arrow dir="next" />
          </button>

          <div className="mt-6 flex justify-center gap-2">
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

      {openIndex !== null && (
        <ReelLightbox
          reels={REELS}
          index={openIndex}
          products={products}
          onNavigate={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}
