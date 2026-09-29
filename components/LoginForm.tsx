"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

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
        <input
          className={field}
          type="password"
          name="password"
          autoComplete="current-password"
          required
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
        className="mt-1 rounded-[9px] bg-ink py-3 text-[0.9375rem] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
