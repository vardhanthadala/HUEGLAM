"use client";

import { useActionState, useState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [showPassword, setShowPassword] = useState(false);

  const field =
    "w-full rounded-[9px] border border-[#e3e6eb] bg-white px-3.5 py-2.5 text-[0.9375rem] text-ink outline-none transition-colors placeholder:text-[#b6bcc6] focus:border-[#9aa0ab]";

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] text-[#6b7280]">Email</span>
        <input
          className={field}
          type="email"
          name="email"
          autoComplete="username"
          autoFocus
          required
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] text-[#6b7280]">Password</span>
        <div className="relative">
          <input
            className={`${field} pr-10`}
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b6bcc6] hover:text-ink transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
        </div>
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
        className="mt-1 rounded-[9px] bg-ink py-3 text-[0.9375rem] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
