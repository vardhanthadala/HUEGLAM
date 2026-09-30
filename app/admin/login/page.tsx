import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";
import { mongoConfigured } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

/*
  Deliberately not the storefront sign-in.

  A customer signs in through the account modal on the shop; this is a separate
  page on the admin surface, with its own cookie and its own audience claim (see
  lib/auth.ts). It carries no shop navigation and no link back into the store,
  so there is no path that quietly moves someone between the two sessions, and
  it is kept out of search engines.
*/
export const metadata: Metadata = {
  title: "Store admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  const secretMissing =
    !process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f8f9fa] px-6 py-16">
      <div className="w-full max-w-[24rem]">
        <div className="mb-8 text-center">
          <span className="inline-block text-[0.875rem] font-medium tracking-[0.28em] text-ink uppercase">
            HUEGLAM
          </span>
          <h1 className="mt-4 text-[1.5rem] font-normal tracking-tight text-ink font-serif">
            Store admin
          </h1>
          <p className="mt-1.5 text-[0.8125rem] text-[#6b7280]">
            Sign in to manage products, content and orders.
          </p>
        </div>

        <div className="rounded-[16px] border border-[#e8ebef] bg-white p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)]">
          <LoginForm />
        </div>

        {(!mongoConfigured || secretMissing) && (
          <p className="mt-4 rounded-[10px] border border-[#f0e2db] bg-[#fdf6f3] p-4 text-[0.8125rem] leading-relaxed text-[#8a5a45]">
            Sign-in is disabled until{" "}
            {!mongoConfigured && <code>MONGODB_URI</code>}
            {!mongoConfigured && secretMissing && " and "}
            {secretMissing && <code>AUTH_SECRET</code>} {" "}
            {!mongoConfigured && secretMissing ? "are" : "is"} set in{" "}
            <code>.env.local</code>. Then run <code>npm run db:seed</code> to
            create the admin account.
          </p>
        )}

        <p className="mt-8 text-center text-[0.75rem] tracking-wide text-[#9aa0ab]">
          Authorised access only &middot; Attempts are rate limited
        </p>
      </div>
    </div>
  );
}
