"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestAdminPasswordResetAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestAdminPasswordResetAction, initial);

  const field =
    "w-full rounded-[9px] border border-[#e3e6eb] bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-[#b6bcc6] focus:border-[#9aa0ab]";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.ok ? (
        <div className="py-2 text-center animate-in fade-in duration-300">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#f4f7f4] text-[#2d5a37] ring-1 ring-[#e2ede4]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-[1.0625rem] font-medium text-ink">Check your inbox</h3>
          <p className="mt-2 text-[0.8125rem] text-[#6b7280] leading-relaxed">
            {state.ok}
          </p>

          <div className="mt-6 pt-5 border-t border-[#f0f2f5] flex flex-col gap-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-1.5 text-[0.8125rem] font-medium text-ink hover:text-[#4b5563] transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] text-[#6b7280]">Admin Email</span>
            <input
              className={field}
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              required
              placeholder="admin@hueglam.com"
            />
          </label>

          {state.error && (
            <p
              role="alert"
              className="rounded-[9px] bg-[#fdf1ee] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-[#9c4d33]"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center rounded-[9px] bg-ink py-2.5 text-[0.875rem] font-medium text-white transition-all hover:bg-black/90 active:scale-[0.99] disabled:opacity-50"
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <svg className="size-4 animate-spin text-white/80" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending link…
              </span>
            ) : (
              "Send reset link"
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-[0.8125rem] text-[#6b7280] hover:text-ink transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to sign in</span>
            </Link>
          </div>
        </>
      )}
    </form>
  );
}
