import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forgot password · HUEGLAM Admin",
  robots: { index: false, follow: false },
};

export default async function AdminForgotPasswordPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] px-6 py-16">
      <div className="w-full max-w-[24rem]">
        <div className="mb-8 text-center">
          <Link
            href="/admin/login"
            className="inline-block text-[0.875rem] font-medium tracking-[0.28em] text-ink uppercase hover:opacity-75 transition-opacity"
          >
            HUEGLAM
          </Link>
          <h1 className="mt-4 text-[1.5rem] font-normal tracking-tight text-ink font-serif">
            Reset password
          </h1>
          <p className="mt-1.5 text-[0.8125rem] text-[#6b7280]">
            Enter your admin email and we'll send you a secure link to reset your password.
          </p>
        </div>

        <div className="rounded-[16px] border border-[#e8ebef] bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)]">
          <ForgotPasswordForm />
        </div>

        <p className="mt-8 text-center text-[0.75rem] tracking-wide text-[#9aa0ab]">
          Protected admin area &middot; HUEGLAM
        </p>
      </div>
    </div>
  );
}
