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

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" strokeLinecap="round" />
    </svg>
  );
}

const field =
  "w-full border border-line px-4 py-3.5 text-[0.9375rem] outline-none transition-colors placeholder:text-ink-soft focus:border-ink";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label="Close"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Login" : "Register"}
        className="relative z-10 w-full max-w-[500px] bg-white px-14 py-10 shadow-2xl max-sm:px-7 animate-zoom-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 text-ink transition-opacity hover:opacity-60"
        >
          <IconClose />
        </button>

        <h2 className="text-center text-[1.5rem] font-normal text-ink">
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

            {/* Password with eye toggle */}
            <div className="relative">
              <input
                className={`${field} pr-12`}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <IconEye open={showPassword} />
              </button>
            </div>

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
                onClick={() => {
                  setMode("register");
                  setShowPassword(false);
                }}
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

            {/* Mobile with +91 Indian badge */}
            <div className="relative flex items-center border border-line transition-colors focus-within:border-ink">
              <span className="flex select-none items-center border-r border-line bg-ground-alt px-3.5 py-3.5 text-[0.875rem] font-medium text-ink-soft">
                +91
              </span>
              <input
                className="w-full bg-white px-3.5 py-3.5 text-[0.9375rem] text-ink outline-none placeholder:text-ink-soft"
                type="tel"
                name="phone"
                placeholder="Mobile number (10 digits)"
                pattern="[0-9]{10}"
                maxLength={10}
                autoComplete="tel"
              />
            </div>

            {/* Password with eye toggle */}
            <div className="relative">
              <input
                className={`${field} pr-12`}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password (at least 8 characters)"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft transition-colors hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <IconEye open={showPassword} />
              </button>
            </div>

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
                onClick={() => {
                  setMode("login");
                  setShowPassword(false);
                }}
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
