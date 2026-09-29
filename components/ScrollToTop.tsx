"use client";

import { useEffect, useState } from "react";

const SIZE = 48;
const RADIUS = 21;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Back-to-top button with a ring that fills as the page scrolls.
 * The ring starts at 12 o'clock and fills clockwise.
 */
export function ScrollToTop() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, ratio)));
    };

    const onScroll = () => {
      // Coalesce to one update per frame; scroll fires far more often.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function toTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      title="Back to top"
      className="group fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.14)] transition-shadow hover:shadow-[0_4px_18px_rgba(0,0,0,0.2)]"
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={"0 0 " + SIZE + " " + SIZE}
        className="absolute inset-0"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="2"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#212529"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          transform={"rotate(-90 " + SIZE / 2 + " " + SIZE / 2 + ")"}
        />
      </svg>

      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="relative text-ink transition-transform duration-200 group-hover:-translate-y-0.5"
        aria-hidden="true"
      >
        <path d="M12 19V5m0 0-6 6m6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
