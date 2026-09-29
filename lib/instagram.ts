/**
 * Instagram feed for the homepage rail.
 *
 * The Shopify theme fetched this in the browser with a long-lived access token
 * printed into the page HTML. That is done server-side here instead, so the
 * token never reaches the client. Set INSTAGRAM_ACCESS_TOKEN in .env.local to
 * enable the live feed; without it the curated fallback below is used, which
 * is fine for launch.
 */

export type InstagramPost = {
  id: string;
  image: string;
  permalink: string;
  caption: string;
};

const PROFILE = "https://www.instagram.com/hueglam_official";

/** HUEGLAM's own campaign creatives, already in the project. */
const FALLBACK: InstagramPost[] = [
  {
    id: "fallback-1",
    image: "/brand/11_aug25.jpg",
    permalink: PROFILE,
    caption: "HUEGLAM skincare",
  },
  {
    id: "fallback-2",
    image: "/products/combo1_1-_2__final.jpg",
    permalink: PROFILE,
    caption: "HUEGLAM Ultimate Glow Combo",
  },
  {
    id: "fallback-3",
    image: "/products/facewash_4thaug.jpg",
    permalink: PROFILE,
    caption: "3% Salicylic Acid Face Wash",
  },
  {
    id: "fallback-4",
    image: "/products/hue_p5.jpg",
    permalink: PROFILE,
    caption: "Vitamin C Sunscreen SPF 50",
  },
  {
    id: "fallback-5",
    image: "/products/serum234.jpg",
    permalink: PROFILE,
    caption: "Clarifying Face Serum",
  },
  {
    id: "fallback-6",
    image: "/products/faceserum1instapost.jpg",
    permalink: PROFILE,
    caption: "Vitamin C Day Moisturizer",
  },
];

type GraphMedia = {
  id: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  caption?: string;
};

export async function getInstagramPosts(limit = 6): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return FALLBACK.slice(0, limit);

  try {
    const url =
      "https://graph.instagram.com/me/media" +
      "?fields=id,media_type,media_url,thumbnail_url,permalink,caption" +
      "&limit=" +
      limit +
      "&access_token=" +
      encodeURIComponent(token);

    // Cached for an hour so the homepage does not call Instagram per request.
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return FALLBACK.slice(0, limit);

    const payload: { data?: GraphMedia[] } = await response.json();
    const posts = (payload.data ?? [])
      .map((item) => ({
        id: item.id,
        image: item.media_type === "VIDEO" ? (item.thumbnail_url ?? "") : (item.media_url ?? ""),
        permalink: item.permalink ?? PROFILE,
        caption: (item.caption ?? "").slice(0, 120),
      }))
      .filter((p) => p.image);

    return posts.length > 0 ? posts.slice(0, limit) : FALLBACK.slice(0, limit);
  } catch {
    // Network problem or an expired token: never break the homepage over it.
    return FALLBACK.slice(0, limit);
  }
}
