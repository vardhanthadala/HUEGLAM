import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/queries";
import { staticPages } from "@/lib/pages-content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hueglam.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getPublishedProducts();

  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: siteUrl + "/collections/all", changeFrequency: "weekly", priority: 0.9 },
    ...products.map((p) => ({
      url: siteUrl + "/products/" + p.handle,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...staticPages.map((p) => ({
      url: siteUrl + "/pages/" + p.slug,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
