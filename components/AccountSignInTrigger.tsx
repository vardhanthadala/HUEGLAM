"use client";

import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";

export function AccountSignInTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-[9px] border border-ink/20 px-5 py-2.5 text-xs font-medium tracking-[0.14em] uppercase text-ink transition-all hover:border-ink hover:bg-ink hover:text-white active:scale-[0.99]"
      >
        Sign in to your account
      </button>

      {open && <AuthModal onClose={() => setOpen(false)} />}
    </>
  );
}
