"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/**
 * The 40px black bar above the header. On the live site it is a slick carousel
 * with prev/next arrows, so the messages live in an array here.
 */
const MESSAGES = [
  { text: "*CLEARANCE SALE 50-60% off.*", ctaLabel: "Shop Now", ctaHref: "/collections/all" },
  { text: "Limited Time offer.", ctaLabel: "Shop Now", ctaHref: "/collections/all" },
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const message = MESSAGES[index];

  const step = (delta: number) =>
    setIndex((i) => (i + delta + MESSAGES.length) % MESSAGES.length);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="announcement-slide relative flex h-10 w-full items-center justify-center bg-black px-12 text-white">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Previous announcement"
        className="absolute left-4 flex size-6 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <p className="text-center text-[0.8125rem] font-medium tracking-wide">
        {message.text}{" "}
        <Link href={message.ctaHref} className="underline underline-offset-[3px] hover:opacity-80">
          {message.ctaLabel}
        </Link>
      </p>

      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Next announcement"
        className="absolute right-4 flex size-6 items-center justify-center opacity-70 transition-opacity hover:opacity-100"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
