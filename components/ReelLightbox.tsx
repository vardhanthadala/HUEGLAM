"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/money";
import type { ProductWithImages } from "@/lib/queries";

export type LightboxReel = {
  video: string;
  type: string;
  poster: string;
  handle: string;
  alt: string;
};

function IconClose() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d={dir === "prev" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReelLightbox({
  reels,
  index,
  products,
  onNavigate,
  onClose,
}: {
  reels: LightboxReel[];
  index: number;
  products: ProductWithImages[];
  onNavigate: (next: number) => void;
  onClose: () => void;
}) {
  const { add } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [descriptionOpen, setDescriptionOpen] = useState(true);

  const reel = reels[index];
  const product = products.find((p) => p.handle === reel.handle);

  // Lock page scroll while open.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onNavigate((index - 1 + reels.length) % reels.length);
      if (event.key === "ArrowRight") onNavigate((index + 1) % reels.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, reels.length, onNavigate, onClose]);

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      const attempt = el.play();
      if (attempt && attempt.catch) attempt.catch(() => {});
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  }

  function handleAddToCart() {
    if (!product) return;
    add({
      productId: product.id,
      handle: product.handle,
      title: product.title,
      image: product.images[0]?.src ?? null,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
    });
    // Adding opens the cart drawer, so step out of the way.
    onClose();
  }

  const controlButton =
    "flex size-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/65";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close video"
        tabIndex={-1}
      />

      <span className="absolute left-5 top-4 z-10 text-sm text-white">
        {index + 1} / {reels.length}
      </span>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute right-5 top-4 z-10 text-white transition-opacity hover:opacity-70"
      >
        <IconClose />
      </button>

      {reels.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onNavigate((index - 1 + reels.length) % reels.length)}
            aria-label="Previous video"
            className="absolute left-2 z-10 text-white transition-opacity hover:opacity-70 sm:left-6"
          >
            <IconChevron dir="prev" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate((index + 1) % reels.length)}
            aria-label="Next video"
            className="absolute right-2 z-10 text-white transition-opacity hover:opacity-70 sm:right-6"
          >
            <IconChevron dir="next" />
          </button>
        </>
      )}

      {/* Panel */}
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-[712px] overflow-hidden rounded-lg bg-white max-sm:flex-col">
        {/* Video */}
        <div className="relative aspect-9/16 w-1/2 shrink-0 bg-black max-sm:w-full">
          <video
            key={reel.video}
            ref={videoRef}
            poster={reel.poster}
            autoPlay
            muted
            loop
            playsInline
            aria-label={reel.alt}
            onTimeUpdate={(e) => {
              const el = e.currentTarget;
              if (el.duration) setProgress((el.currentTime / el.duration) * 100);
            }}
            onClick={togglePlay}
            className="size-full cursor-pointer object-cover"
          >
            <source src={reel.video} type={reel.type} />
          </video>

          {/* Progress */}
          <div className="absolute inset-x-3 top-3 h-1 overflow-hidden rounded-full bg-white/35">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-200"
              style={{ width: progress + "%" }}
            />
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause video" : "Play video"}
              className={controlButton}
            >
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="7" y="5" width="3.5" height="14" rx="1" />
                  <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5L8 5.5Z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute video" : "Mute video"}
              className={controlButton}
            >
              {muted ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" stroke="none" />
                  <path d="m17 9 4 6m0-6-4 6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" stroke="none" />
                  <path d="M17 9.5a3.5 3.5 0 0 1 0 5M19.5 7a7 7 0 0 1 0 10" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Product panel */}
        <div className="flex w-1/2 flex-col overflow-y-auto p-5 max-sm:w-full">
          {product && (
            <>
              <Link
                href={"/products/" + product.handle}
                onClick={onClose}
                className="flex gap-3.5"
              >
                {product.images[0] && (
                  <span className="relative size-[72px] shrink-0 overflow-hidden rounded bg-ground-alt">
                    <Image
                      src={product.images[0].src}
                      alt=""
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.8125rem] leading-snug text-ink-soft">
                    {product.title}
                  </span>
                  <span className="mt-1.5 flex items-baseline gap-2">
                    {product.compareAtPrice && (
                      <span className="text-[0.8125rem] text-ink-faint line-through">
                        {formatINR(product.compareAtPrice)}
                      </span>
                    )}
                    <span className="text-[0.875rem] text-ink-soft">
                      {formatINR(product.price)}
                    </span>
                  </span>
                </span>
              </Link>

              <div className="mt-5 flex items-stretch gap-2.5">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 rounded bg-black py-3.5 text-[0.875rem] font-medium text-white transition-opacity hover:opacity-85"
                >
                  Add to Cart
                </button>
                <Link
                  href={"/products/" + product.handle}
                  onClick={onClose}
                  aria-label="View product details"
                  className="flex w-[52px] items-center justify-center rounded border border-line text-ink transition-colors hover:border-ink"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 11v5" strokeLinecap="round" />
                    <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
                  </svg>
                </Link>
              </div>

              <button
                type="button"
                onClick={() => setDescriptionOpen((open) => !open)}
                aria-expanded={descriptionOpen}
                className="mt-6 flex items-center justify-between border-b border-line px-1 pb-3 text-[0.9375rem] text-ink"
              >
                Description
                <span aria-hidden className="text-lg leading-none font-medium">
                  {descriptionOpen ? "—" : "+"}
                </span>
              </button>

              {descriptionOpen && (
                <div
                  className="rte mt-4 rounded border border-line p-4 text-[0.8125rem]"
                  dangerouslySetInnerHTML={{ __html: product.bodyHtml }}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
