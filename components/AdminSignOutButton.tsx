"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiLogOut, FiAlertTriangle, FiX } from "react-icons/fi";
import { logoutAction } from "@/app/admin/actions";

export function AdminSignOutButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  const modalContent = open ? (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      {/* Dark backdrop with blur that covers the entire screen */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !isPending && setOpen(false)}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-[#9aa0ab] hover:bg-ground-alt hover:text-ink transition-colors"
        >
          <FiX className="size-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
          <FiAlertTriangle className="size-6" />
        </div>

        {/* Content */}
        <div className="mt-4 text-center">
          <h3 className="text-base font-semibold text-ink">Sign out of Admin</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-[#6b7280]">
            Are you sure you want to end your current session? You will need to sign in again to access the store management dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => setOpen(false)}
            className="w-1/2 rounded-xl border border-line bg-white py-2.5 text-xs font-medium text-ink transition hover:bg-ground-alt disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={handleLogout}
            className="inline-flex w-1/2 items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
          >
            <FiLogOut className="size-3.5" />
            <span>{isPending ? "Signing out..." : "Sign out"}</span>
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
        className="flex w-full items-center justify-between rounded-[9px] px-3 py-2.5 text-[0.8125rem] font-medium text-[#6b7280] transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <span className="flex items-center gap-2.5">
          <FiLogOut className="size-4" />
          Sign out
        </span>
      </button>

      {/* Render modal directly into document.body using React Portal */}
      {mounted && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}
