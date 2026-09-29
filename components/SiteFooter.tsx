import Link from "next/link";
import Image from "next/image";

const SHOP = [
  { href: "/", label: "Home" },
  { href: "/collections/all", label: "Skincare" },
];

const QUICK_LINKS = [
  { href: "/search", label: "Search" },
  { href: "/pages/terms-of-service", label: "Terms & Conditions" },
  { href: "/pages/privacy-policy", label: "Privacy Policy" },
  { href: "/pages/refund-policy", label: "Refund Policy" },
];

const SUPPORT = [
  { href: "/account", label: "Orders" },
  { href: "/account", label: "Profile" },
];

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M15.1 7.5h1.9V4.6c-.9-.1-1.8-.1-2.7-.1-2.7 0-4.4 1.6-4.4 4.6V11H7.4v3.2h2.5V21h3.2v-6.8h2.5l.4-3.2h-2.9V9.4c0-1.3.4-1.9 1.9-1.9Z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}

const SOCIAL = [
  { href: "https://www.facebook.com/hue.glam/", label: "Facebook", Icon: IconFacebook },
  { href: "https://www.instagram.com/hueglam_official", label: "Instagram", Icon: IconInstagram },
  { href: "https://youtube.com/@hueglam", label: "YouTube", Icon: IconYouTube },
];

function Column({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="mb-6 text-[0.8125rem] font-medium tracking-[2px] uppercase text-white">
        {title}
      </h4>
      <ul className="flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-[0.875rem] text-white/85 link-underline transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-[1460px] gap-12 px-gutter pt-14 pb-10 md:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1.25fr_1fr] lg:gap-8">
        <div>
          <Image
            src="/brand/white_Hueglam.svg"
            alt="HUEGLAM"
            width={154}
            height={24}
            className="h-6 w-auto"
          />

          <p className="mt-6 max-w-md text-[0.875rem] leading-[1.8] text-white/85">
            At HUEGLAM, Our philosophy is rooted in empowerment, inclusivity, and
            science-backed skincare, designed to help every individual embrace
            their natural glow.
          </p>

          <div className="mt-7 text-[0.875rem] leading-[1.8] text-white/85">
            <p>Operating hours : 10am-9pm (Monday-Friday)</p>
            <p>9am-6pm ( Saturday )</p>
            <p>Reach out today!</p>
            <p>
              Email:{" "}
              <a href="mailto:support@hueglam.com" className="link-underline hover:text-white">
                support@hueglam.com
              </a>
              ,
            </p>
            <p>
              (WhatsApp){" "}
              <a href="tel:+918886677330" className="link-underline hover:text-white">
                +91 8886677330
              </a>
              .
            </p>
          </div>

          <h4 className="mt-9 mb-6 text-[0.8125rem] font-medium tracking-[2px] uppercase text-white">
            Follow Us
          </h4>
          <ul className="flex items-center gap-6">
            {SOCIAL.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="block text-white/85 transition-colors hover:text-white"
                >
                  <Icon />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Column title="Shop" links={SHOP} />
        <Column title="Quick Links" links={QUICK_LINKS} />
        <Column title="Support" links={SUPPORT} />
      </div>

      <div className="border-t border-white/20">
        <div className="mx-auto max-w-[1460px] px-gutter py-6 text-[0.875rem] text-white/85">
          &copy; {new Date().getFullYear()} - HUEGLAM, All rights Reserved.
        </div>
      </div>
    </footer>
  );
}
