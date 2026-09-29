import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hueglam.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/checkout", "/cart", "/order/", "/api/"],
    },
    sitemap: siteUrl + "/sitemap.xml",
  };
}
