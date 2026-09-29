import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/app/admin/actions";
import type { AdminSession } from "@/lib/auth";

/* ---------------- icons ---------------- */

const icon = "size-[17px] shrink-0";

function IconHome() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 10.8 12 4.5l8 6.3V19a1 1 0 0 1-1 1h-4.2v-5.6H9.2V20H5a1 1 0 0 1-1-1Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6.2 7.5h11.6l.9 12H5.3Z" strokeLinejoin="round" />
      <path d="M9.3 7.5a2.7 2.7 0 0 1 5.4 0" strokeLinecap="round" />
    </svg>
  );
}

function IconProducts() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m12 4 7.5 4.2v7.6L12 20l-7.5-4.2V8.2Z" strokeLinejoin="round" />
      <path d="M4.5 8.2 12 12.4l7.5-4.2M12 12.4V20" />
    </svg>
  );
}

function IconMegaphone() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 10.2v3.6h2.8l6.4 3.4V6.8l-6.4 3.4Z" strokeLinejoin="round" />
      <path d="M17.6 9.4a3.6 3.6 0 0 1 0 5.2" strokeLinecap="round" />
    </svg>
  );
}

function IconBanner() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 15.5 4.2-3.4 3.4 2.5 2.6-1.7 3.8 2.6" strokeLinejoin="round" />
    </svg>
  );
}

function IconReel() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <path d="M10.2 9.7v4.6l4-2.3Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- nav ---------------- */

type NavItem = { href: string; label: string; Icon: () => React.ReactElement };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "General",
    items: [
      { href: "/admin", label: "Dashboard", Icon: IconHome },
      { href: "/admin/orders", label: "Orders", Icon: IconOrders },
    ],
  },
  {
    label: "Catalogue",
    items: [{ href: "/admin/products", label: "Products", Icon: IconProducts }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/content/announcements", label: "Announcements", Icon: IconMegaphone },
      { href: "/admin/content/banners", label: "Hero banners", Icon: IconBanner },
      { href: "/admin/content/reels", label: "Reels", Icon: IconReel },
      { href: "/admin/content/instagram", label: "Instagram", Icon: IconGrid },
    ],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

/**
 * Admin chrome.
 *
 * Hierarchy comes from scale, colour and surface rather than weight: body text
 * stays at 400 and only figures and buttons step to 500.
 */
export function AdminShell({
  session,
  active,
  title,
  description,
  actions,
  children,
}: {
  session: AdminSession;
  active: string;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const current = ALL_ITEMS.find((i) => i.href === active);
  const initials = (session.name || session.email).slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-dvh bg-[#f6f7f9] text-ink">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col border-r border-[#ebedf1] bg-white lg:flex">
        <div className="flex h-[62px] items-center px-5">
          <Image
            src="/brand/Black_Hueglam.svg"
            alt="HUEGLAM"
            width={96}
            height={15}
            className="h-[15px] w-auto"
          />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[0.625rem] tracking-[0.13em] uppercase text-[#9aa0ab]">
                {group.label}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, Icon }) => {
                  const isCurrent = active === href;
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={isCurrent ? "page" : undefined}
                        className={
                          "flex items-center gap-3 rounded-[9px] px-3 py-2.5 text-[0.8125rem] transition-colors duration-150 " +
                          (isCurrent
                            ? "bg-[#f1f2f6] text-ink"
                            : "text-[#6b7280] hover:bg-[#f7f8fa] hover:text-ink")
                        }
                      >
                        <span className={isCurrent ? "text-ink" : "text-[#9aa0ab]"}>
                          <Icon />
                        </span>
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-3">
          <Link
            href="/"
            className="flex items-center justify-between rounded-[9px] bg-[#f7f8fa] px-3 py-2.5 text-[0.8125rem] text-[#6b7280] transition-colors hover:text-ink"
          >
            View store
            <IconExternal />
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[62px] items-center gap-5 border-b border-[#ebedf1] bg-white/85 px-6 backdrop-blur">
          <span className="hidden text-[0.8125rem] text-[#6b7280] lg:block">
            {current?.label ?? title}
          </span>

          {/* Sidebar collapses under lg, so nav moves inline */}
          <nav className="flex gap-4 overflow-x-auto lg:hidden">
            {ALL_ITEMS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={
                  "whitespace-nowrap text-[0.8125rem] transition-colors " +
                  (active === href ? "text-ink" : "text-[#9aa0ab] hover:text-ink")
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#f1f2f6] text-[0.6875rem] font-medium text-[#6b7280]">
              {initials}
            </span>
            <span className="hidden text-[0.8125rem] text-[#6b7280] sm:inline">
              {session.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-[9px] px-3 py-1.5 text-[0.8125rem] text-[#6b7280] transition-colors hover:bg-[#f1f2f6] hover:text-ink"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 py-8">
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-[1.375rem] leading-tight tracking-[-0.01em] text-ink">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-1.5 text-[0.875rem] text-[#6b7280]">{description}</p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2.5">{actions}</div>}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}

/* ---------------- shared primitives ---------------- */

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={
        "overflow-hidden rounded-[14px] border border-[#ebedf1] bg-white shadow-[0_1px_3px_rgba(17,24,39,0.04)] " +
        className
      }
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-[#f1f2f6] px-5 py-4">
          <div>
            {title && <h2 className="text-[0.9375rem] text-ink">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-[0.8125rem] text-[#9aa0ab]">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/** Stat tile: icon chip, label, figure, and an optional real delta. */
export function StatCard({
  label,
  value,
  href,
  icon: iconNode,
  delta,
  muted = false,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
  delta?: { direction: "up" | "down"; text: string } | null;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-[14px] border border-[#ebedf1] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(17,24,39,0.04)] transition-colors hover:border-[#dfe3ea]"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-[8px] bg-[#f1f2f6] text-[#6b7280]">
          {iconNode}
        </span>
        <span className="text-[0.8125rem] text-[#6b7280]">{label}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
        <span
          className={
            "text-[1.5rem] leading-none font-medium tracking-[-0.02em] " +
            (muted ? "text-[#b6bcc6]" : "text-ink")
          }
        >
          {value}
        </span>
        {delta && (
          <span
            className={
              "rounded-full px-2 py-0.5 text-[0.6875rem] " +
              (delta.direction === "up"
                ? "bg-[#edf7f0] text-[#3f7a4f]"
                : "bg-[#fdf1ee] text-[#9c4d33]")
            }
          >
            {delta.direction === "up" ? "↑" : "↓"} {delta.text}
          </span>
        )}
      </div>
    </Link>
  );
}

export function PrimaryLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-[9px] bg-ink px-4 py-2.5 text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-85"
    >
      {children}
    </Link>
  );
}

export function GhostLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-[9px] border border-[#e3e6eb] bg-white px-4 py-2.5 text-[0.8125rem] text-ink transition-colors hover:border-[#cbd0d9]"
    >
      {children}
    </Link>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-6 rounded-[14px] border border-[#f3e2da] bg-[#fdf7f4] px-4 py-3 text-[0.8125rem] text-[#8a4b33]">
      {children}
    </p>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#e3e6eb] bg-white px-6 py-16 text-center">
      <p className="text-[0.9375rem] text-ink">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-[0.8125rem] text-[#9aa0ab]">
          {description}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
