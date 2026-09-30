"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { customerLogoutAction } from "@/app/(shop)/account/actions";

export function CustomerSignOutButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await customerLogoutAction();
    });
  };

  const modalContent = open ? (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !isPending && setOpen(false)}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-sm rounded-[16px] border border-line bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-[#9aa0ab] hover:bg-ground-alt hover:text-ink transition-colors"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Brand Icon Badge */}
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fdf1ee] text-[#9c4d33] ring-8 ring-[#fdf1ee]/50">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <h3 className="font-jost text-lg uppercase tracking-[1px] text-ink">Sign Out</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft">
            Are you sure you want to sign out of your HUEGLAM account? You will need to log in again to view your order history or saved addresses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen(false)}
            className="w-1/2 rounded-[9px] border border-line bg-white py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink transition hover:bg-ground-alt disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleLogout}
            className="inline-flex w-1/2 items-center justify-center gap-1.5 rounded-[9px] bg-ink py-2.5 text-xs font-medium uppercase tracking-[0.1em] text-white shadow-xs transition hover:bg-black/85 active:scale-[0.99] disabled:opacity-50"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-1.5">
                <svg className="size-3.5 animate-spin text-white/80" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing out…
              </span>
            ) : (
              "Sign out"
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-full border border-[#e3e6eb] bg-white px-4 py-2 text-[0.75rem] font-medium tracking-[0.12em] uppercase text-[#4b5563] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-red-200 hover:bg-red-50/60 hover:text-red-700 active:scale-[0.98]"
      >
        <span>Sign out</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-[#9aa0ab] transition-all group-hover:translate-x-0.5 group-hover:text-red-600"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
          <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
        </svg>
      </button>

      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
