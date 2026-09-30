import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set new password · HUEGLAM Admin",
  robots: { index: false, follow: false },
};

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/admin");

  const { token } = await searchParams;

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
            Choose new password
          </h1>
          <p className="mt-1.5 text-[0.8125rem] text-[#6b7280]">
            Enter and confirm your new secure password below.
          </p>
        </div>

        <div className="rounded-[16px] border border-[#e8ebef] bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)]">
          {!token ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-[#fdf1ee] text-[#9c4d33]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <p className="text-[0.8125rem] text-[#9c4d33] mb-4">
                Missing or expired reset token. Please request a new link.
              </p>
              <Link
                href="/admin/forgot-password"
                className="inline-block text-xs font-medium text-ink underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Request a new reset link
              </Link>
            </div>
          ) : (
            <ResetPasswordForm token={token} />
          )}
        </div>

        <p className="mt-8 text-center text-[0.75rem] tracking-wide text-[#9aa0ab]">
          Protected admin area &middot; HUEGLAM
        </p>
      </div>
    </div>
  );
}
