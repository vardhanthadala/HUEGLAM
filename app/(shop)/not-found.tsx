import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 px-gutter py-32 text-center">
      <span className="eyebrow">404</span>
      <h1 className="text-2xl font-light tracking-tight sm:text-3xl">
        We could not find that page
      </h1>
      <p className="text-sm text-ink-soft">
        The link may be old, or the product may have been renamed.
      </p>
      <Link
        href="/collections/all"
        className="mt-2 bg-ink px-8 py-3.5 text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-ground transition-opacity hover:opacity-85"
      >
        Shop skincare
      </Link>
    </div>
  );
}
