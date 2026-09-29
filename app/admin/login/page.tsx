import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="flex min-h-dvh items-center justify-center px-gutter py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-xl tracking-[0.22em]">HUEGLAM</span>
          <p className="eyebrow mt-2">Store admin</p>
        </div>
        <LoginForm />
        {!process.env.DATABASE_URL && (
          <p className="mt-6 border border-line bg-ground p-4 text-[0.75rem] leading-relaxed text-ink-soft">
            No database is configured yet. Add <code>DATABASE_URL</code> and{" "}
            <code>AUTH_SECRET</code> to <code>.env.local</code>, then run{" "}
            <code>npm run db:push</code> and <code>npm run db:seed</code>.
          </p>
        )}
      </div>
    </div>
  );
}
