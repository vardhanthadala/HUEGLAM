"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [showPassword, setShowPassword] = useState(false);

  const isLocked = Boolean(state.error && state.error.includes("Too many failed attempts"));

  const field =
    "w-full rounded-[9px] border border-[#e3e6eb] bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-[#b6bcc6] focus:border-[#9aa0ab]";

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] text-[#6b7280]">Email</span>
        <input
          className={field + (isLocked ? " cursor-not-allowed bg-gray-50 opacity-60" : "")}
          type="email"
          name="email"
          autoComplete="username"
          autoFocus
          required
          disabled={isLocked || pending}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.8125rem] text-[#6b7280]">Password</span>
          <Link
            href="/admin/forgot-password"
            className="text-[0.75rem] text-ink-soft hover:text-ink transition-colors underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            className={`${field} pr-10` + (isLocked ? " cursor-not-allowed bg-gray-50 opacity-60" : "")}
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            disabled={isLocked || pending}
          />
          <button
            type="button"
            disabled={isLocked || pending}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b6bcc6] hover:text-ink transition-colors disabled:opacity-40"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
      </div>

      {state.error && (
        <div
          role="alert"
          className={
            "flex items-start gap-2.5 rounded-[9px] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed " +
            (isLocked
              ? "border border-red-200 bg-red-50 text-red-800"
              : "bg-[#fdf1ee] text-[#9c4d33]")
          }
        >
          {isLocked && (
            <svg className="size-4 shrink-0 text-red-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          )}
          <span>{state.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || isLocked}
        className="mt-1 flex w-full items-center justify-center rounded-[9px] bg-ink py-2.5 text-[0.875rem] font-medium text-white transition-all hover:bg-black/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isLocked ? (
          "Sign-in Locked"
        ) : pending ? (
          <span className="inline-flex items-center gap-2">
            <svg className="size-4 animate-spin text-white/80" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
