import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

/* Jost is used for the nav, product card names and footer section titles.
   Everything else renders in the system stack, as on the live site. */
const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jost-face",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hueglam.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HUEGLAM – Skincare & Beauty for a Radiant You.",
    template: "%s – HUEGLAM",
  },
  description:
    "Skincare for every shade of beautiful. Vitamin C, niacinamide and salicylic acid formulations made for Indian skin.",
  openGraph: {
    type: "website",
    siteName: "HUEGLAM",
    url: siteUrl,
    title: "HUEGLAM – Skincare & Beauty for a Radiant You.",
    description:
      "Skincare for every shade of beautiful. Formulated in India, made for Indian skin and weather.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jost.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
