"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  customerLoginAction,
  customerRegisterAction,
  type AuthState,
} from "@/app/(shop)/account/actions";

const initial: AuthState = {};

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

const field =
  "w-full border border-line px-4 py-3.5 text-[0.9375rem] outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [loginState, loginAction, loginPending] = useActionState(
    customerLoginAction,
    initial,
  );
  const [registerState, registerAction, registerPending] = useActionState(
    customerRegisterAction,
    initial,
  );

  const state = mode === "login" ? loginState : registerState;
  const pending = mode === "login" ? loginPending : registerPending;

  // Close and refresh once the server confirms the session cookie is set.
  useEffect(() => {
    if (state.ok) {
      onClose();
      router.refresh();
    }
  }, [state.ok, onClose, router]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Login" : "Create account"}
        className="relative z-10 w-full max-w-[500px] bg-white px-14 py-10 max-sm:px-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 text-ink transition-opacity hover:opacity-60"
        >
          <IconClose />
        </button>

        <h2 className="text-center text-[1.5rem] text-ink">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        <p className="mt-2 text-center text-[0.875rem] text-ink-soft">
          {mode === "login"
            ? "Please enter your e-mail and password:"
            : "Create an account to track your orders:"}
        </p>

        {mode === "login" ? (
          <form action={loginAction} className="mt-8 flex flex-col gap-4">
            <input
              className={field}
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
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

            <Link
              href="/pages/contact"
              onClick={onClose}
              className="self-end text-[0.8125rem] text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              Forgot your password?
            </Link>

            {state.error && (
              <p role="alert" className="bg-sale px-4 py-3 text-[0.875rem] text-sale-ink">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 bg-black py-3.5 text-[0.8125rem] font-medium tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "Signing in..." : "Login"}
            </button>

            <p className="mt-2 text-center text-[0.875rem] text-ink">
              New customer?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="underline underline-offset-4 hover:opacity-70"
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form action={registerAction} className="mt-8 flex flex-col gap-4">
            <input
              className={field}
              name="name"
              placeholder="Full name"
              autoComplete="name"
              required
            />
            <input
              className={field}
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              required
            />
            <input
              className={field}
              type="password"
              name="password"
              placeholder="Password (at least 8 characters)"
              autoComplete="new-password"
              minLength={8}
              required
            />

            {state.error && (
              <p role="alert" className="bg-sale px-4 py-3 text-[0.875rem] text-sale-ink">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-1 bg-black py-3.5 text-[0.8125rem] font-medium tracking-[0.18em] uppercase text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "Creating account..." : "Register"}
            </button>

            <p className="mt-2 text-center text-[0.875rem] text-ink">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="underline underline-offset-4 hover:opacity-70"
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
