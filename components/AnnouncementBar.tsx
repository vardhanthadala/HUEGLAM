"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { AnnouncementItem } from "@/lib/content";

/**
 * The 40px black bar above the header. On the live site it is a slick carousel
 * with prev/next arrows, so the messages live in an array here.
 *
 * There is deliberately no built-in message list: this bar used to fall back to
 * a hardcoded "CLEARANCE SALE" line, which meant deleting every announcement in
 * the admin left the site still advertising a sale that had ended. With nothing
 * to show, the bar renders nothing.
 */
export function AnnouncementBar({
  messages,
}: {
  messages: AnnouncementItem[];
}) {
  const [index, setIndex] = useState(0);
  const count = messages.length;

  const step = (delta: number) =>
    setIndex((i) => (i + delta + (count || 1)) % (count || 1));

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 4000);
    return () => clearInterval(timer);
  }, [count]);

  // After the hooks, never before.
  if (count === 0) return null;
  const message = messages[Math.min(index, count - 1)];

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
