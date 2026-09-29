"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/types";

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d={dir === "prev" ? "m15 5-7 7 7 7" : "m9 5 7 7-7 7"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  const many = images.length > 1;

  const step = (delta: number) =>
    setActive((i) => (i + delta + images.length) % images.length);

  return (
    <div>
      <div className="relative aspect-square w-full overflow-hidden bg-ground-alt">
        {current && (
          <Image
            src={current.src}
            alt={current.alt || title}
            fill
            priority
            sizes="(min-width: 1024px) 570px, 100vw"
            className="object-cover"
          />
        )}

        {many && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink transition-colors hover:bg-white"
            >
              <Arrow dir="prev" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink transition-colors hover:bg-white"
            >
              <Arrow dir="next" />
            </button>
          </>
        )}
      </div>

      {many && (
        <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={"View image " + (i + 1)}
              aria-current={i === active}
              className={
                "relative size-[86px] shrink-0 overflow-hidden bg-ground-alt transition-opacity " +
                (i === active ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100")
              }
            >
              <Image src={img.src} alt="" fill sizes="86px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
