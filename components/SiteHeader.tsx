"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { CartDrawer } from "./CartDrawer";
import { AuthModal } from "./AuthModal";
import type { ProductWithImages } from "@/lib/queries";
import type { CustomerSession } from "@/lib/customer-auth";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/collections/all", label: "Skincare" },
];

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  );
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 7h12l1 14H5L6 7Z" strokeLinejoin="round" />
      <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 12.5 21 14v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 5.2 2 2 0 0 1 6 3Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMinus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 12h12" strokeLinecap="round" />
    </svg>
  );
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/Black_Hueglam.svg"
      alt="HUEGLAM"
      width={154}
      height={24}
      priority
      className={"h-6 w-auto " + className}
    />
  );
}

export function SiteHeader({
  products,
  customer,
}: {
  products: ProductWithImages[];
  customer: CustomerSession | null;
}) {
  const { count, isOpen, openCart, closeCart, ready } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const locked = isOpen || menuOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeCart();
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeCart]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-ground">
        <div className="mx-auto flex h-18 max-w-[1600px] items-center justify-between px-gutter lg:px-14">
          <nav className="hidden flex-1 items-center gap-16 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={
                  "font-jost text-[14px] font-medium tracking-[1.4px] text-ink transition-opacity hover:opacity-60 " +
                  (pathname === item.href ? "underline underline-offset-[6px]" : "")
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-1 items-center md:hidden"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" className="shrink-0" aria-label="HUEGLAM home">
            <Wordmark />
          </Link>

          <div className="flex flex-1 items-center justify-end gap-4">
            <Link href="/search" aria-label="Search" className="text-ink transition-opacity hover:opacity-60">
              <IconSearch />
            </Link>
            {customer ? (
              <Link
                href="/account"
                aria-label={"Account, signed in as " + customer.email}
                className="hidden text-ink transition-opacity hover:opacity-60 sm:block"
              >
                <IconUser />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                aria-label="Login or register"
                className="hidden text-ink transition-opacity hover:opacity-60 sm:block"
              >
                <IconUser />
              </button>
            )}
            <button
              type="button"
              onClick={openCart}
              className="relative text-ink transition-opacity hover:opacity-60"
              aria-label={"Cart, " + count + " items"}
            >
              <IconBag />
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.5625rem] font-semibold text-ground">
                {ready ? count : 0}
              </span>
            </button>
          </div>
        </div>

        {/* Phone, email and account live in the mobile drawer, and the live
            site does not show them on desktop, so there is no contact strip. */}
      </header>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[88vw] flex-col bg-ground">
            <div className="flex justify-end px-5 pt-5">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-full bg-ground-alt text-ink transition-colors hover:bg-line"
              >
                <IconMinus />
              </button>
            </div>

            {/* Nav, contact and account all live in the drawer on mobile. */}
            <nav className="mt-4 flex flex-col px-6">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-jost border-b border-line py-4 text-[0.9375rem] text-ink"
                >
                  {item.label}
                </Link>
              ))}

              <a
                href="tel:8886677330"
                className="flex items-center gap-3 border-b border-line py-4 text-[0.9375rem] text-ink-soft"
              >
                <IconPhone />
                8886677330
              </a>

              <a
                href="mailto:support@hueglam.com"
                className="flex items-center gap-3 border-b border-line py-4 text-[0.9375rem] text-ink-soft"
              >
                <IconMail />
                support@hueglam.com
              </a>

              {customer ? (
                <Link
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 border-b border-line py-4 text-[0.9375rem] text-ink-soft"
                >
                  <IconUser />
                  My Account
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="flex items-center gap-3 border-b border-line py-4 text-left text-[0.9375rem] text-ink-soft"
                >
                  <IconUser />
                  Login / Register
                </button>
              )}
            </nav>
          </div>
        </div>
      )}

      <CartDrawer products={products} />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
