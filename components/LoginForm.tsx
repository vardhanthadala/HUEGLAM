"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  const field =
    "w-full border border-line bg-ground px-3.5 py-3 text-sm outline-none transition-colors focus:border-ink";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        className={field}
        type="email"
        name="email"
        placeholder="Email"
        autoComplete="username"
        required
      />
      <input
        className={field}
        type="password"
        name="password"
        placeholder="Password"
        autoComplete="current-password"
        required
      />

      {state.error && (
        <p role="alert" className="border border-sale-ink/30 bg-sale px-3.5 py-2.5 text-[0.8125rem] text-sale-ink">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 bg-ink py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-ground transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
