"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { resetAdminPasswordAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetAdminPasswordAction, initial);
  const [showPassword, setShowPassword] = useState(false);

  const field =
    "w-full rounded-[9px] border border-[#e3e6eb] bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-[#b6bcc6] focus:border-[#9aa0ab]";

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <input type="hidden" name="token" value={token} />

      {state.ok ? (
        <div className="py-2 text-center animate-in fade-in duration-300">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-[#f4f7f4] text-[#2d5a37] ring-1 ring-[#e2ede4]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 className="text-[1.0625rem] font-medium text-ink">Password updated</h3>
          <p className="mt-2 text-[0.8125rem] text-[#6b7280] leading-relaxed">
            {state.ok}
          </p>
          <div className="mt-6 pt-5 border-t border-[#f0f2f5]">
            <Link
              href="/admin/login"
              className="inline-flex w-full items-center justify-center rounded-[9px] bg-ink py-2.5 text-[0.875rem] font-medium text-white transition-all hover:bg-black/90 active:scale-[0.99]"
            >
              Sign in to admin
            </Link>
          </div>
        </div>
      ) : (
        <>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] text-[#6b7280]">New Password</span>
            <div className="relative">
              <input
                className={`${field} pr-10`}
                type={showPassword ? "text" : "password"}
                name="newPassword"
                required
                minLength={8}
                autoFocus
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b6bcc6] hover:text-ink transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[0.8125rem] text-[#6b7280]">Confirm New Password</span>
            <input
              className={field}
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              required
              minLength={8}
              placeholder="Repeat your new password"
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
                Updating password…
              </span>
            ) : (
              "Set new password"
            )}
          </button>
        </>
      )}
    </form>
  );
}
