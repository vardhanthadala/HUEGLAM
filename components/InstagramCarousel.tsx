"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { InstagramItem } from "@/lib/content";

/**
 * Instagram rail. The theme's config is four slides in view out of six posts,
 * with dots and no arrows, so that is reproduced here.
 */

function perViewFor(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 640) return 2;
  return 2;
}

export function InstagramCarousel({ posts }: { posts: InstagramItem[] }) {
  const [perView, setPerView] = useState(4);
  const [requestedPage, setRequestedPage] = useState(0);

  useEffect(() => {
    const update = () => setPerView(perViewFor(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(posts.length / perView));
  const page = Math.min(requestedPage, pageCount - 1);

  if (posts.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: "translateX(-" + page * 100 + "%)" }}
        >
          {posts.map((post) => (
            <div
              key={post.id}
              className="shrink-0 px-px"
              style={{ width: 100 / perView + "%" }}
            >
              <a
                href={post.permalink}
                target="_blank"
                rel="noreferrer noopener"
                className="group relative block aspect-[0.72] overflow-hidden bg-ground-alt"
              >
                <Image
                  src={post.image}
                  alt={post.caption || "HUEGLAM on Instagram"}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                {/* Darken and show a camera glyph on hover, as on the live rail. */}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="1.6"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17" cy="7" r="1.1" fill="#fff" stroke="none" />
                  </svg>
                </span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
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
      )}
    </div>
  );
}
