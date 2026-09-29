"use client";

import { useState, type ReactNode } from "react";

export function ProductAccordion({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="flex items-center gap-3 text-[0.9375rem] text-ink">
          <span className="text-ink-soft">{icon}</span>
          {title}
        </span>
        <span aria-hidden className="text-xl leading-none text-ink">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && <div className="pb-6 text-[0.875rem] leading-[1.8] text-body">{children}</div>}
    </div>
  );
}

export function IconShipping() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  );
}

export function IconCare() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 4c0 8-5 13-11 13a5 5 0 0 1-5-5C4 6 11 4 20 4Z" strokeLinejoin="round" />
      <path d="M4 20c2-5 6-8 11-9" strokeLinecap="round" />
    </svg>
  );
}
