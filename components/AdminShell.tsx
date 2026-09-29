import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";
import type { AdminSession } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/products", label: "Products" },
];

export function AdminShell({
  session,
  active,
  children,
}: {
  session: AdminSession;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-line bg-ground">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-gutter py-4">
          <Link href="/admin" className="font-display text-base tracking-[0.2em]">
            HUEGLAM
          </Link>
          <span className="text-[0.625rem] tracking-[0.14em] uppercase text-ink-faint">
            Admin
          </span>

          <nav className="ml-6 flex gap-5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "text-[0.75rem] tracking-[0.08em] uppercase transition-opacity hover:opacity-60 " +
                  (active === item.href ? "text-ink underline underline-offset-4" : "text-ink-soft")
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/"
              className="text-[0.6875rem] tracking-[0.08em] uppercase text-ink-soft hover:text-ink"
            >
              View store
            </Link>
            <span className="hidden text-[0.6875rem] text-ink-faint sm:inline">
              {session.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-[0.6875rem] tracking-[0.08em] uppercase text-ink-soft underline hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-gutter py-10">{children}</main>
    </>
  );
}
