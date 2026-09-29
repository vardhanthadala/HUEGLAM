import "server-only";
import { connectDB } from "./mongodb";
import { Announcement } from "@/models/Announcement";
import { HeroBanner } from "@/models/HeroBanner";
import { Reel } from "@/models/Reel";
import { InstagramPost } from "@/models/InstagramPost";

/**
 * Editable homepage content, read from MongoDB.
 *
 * These used to fall back to hardcoded copies of the launch content, which made
 * the storefront look correct while the admin was in fact reading nothing —
 * deleting a banner appeared to do nothing. The content now lives only in the
 * database (put there by `npm run db:seed`), and an empty collection renders as
 * an empty section, so what the admin shows is what the site serves.
 */

export type AnnouncementItem = {
  id: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
};

export type HeroSlide = {
  id: string;
  desktopImage: string;
  mobileImage: string;
  alt: string;
  href: string;
};

export type ReelItem = {
  id: string;
  video: string;
  videoType: string;
  poster: string;
  productHandle: string;
  alt: string;
};

export type InstagramItem = {
  id: string;
  image: string;
  permalink: string;
  caption: string;
};

export const INSTAGRAM_PROFILE = "https://www.instagram.com/hueglam_official";

/** Static generation calls these repeatedly; one warning per process is enough
 *  to diagnose a bad connection string without flooding the build log. */
let warned = false;

/**
 * Runs `read`, returning [] if the database cannot be reached. A content
 * section is not worth a 500: the rest of the page still renders.
 */
async function safely<T>(label: string, read: () => Promise<T[]>): Promise<T[]> {
  try {
    await connectDB();
    return await read();
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn(
        "[content] MongoDB unreachable, sections will render empty (" +
          label +
          "):",
        error instanceof Error ? error.message : error,
      );
    }
    return [];
  }
}

export function getAnnouncements(): Promise<AnnouncementItem[]> {
  return safely("announcements", async () => {
    const rows = await Announcement.find({ active: true })
      .sort({ position: 1, createdAt: 1 })
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      text: r.text,
      ctaLabel: r.ctaLabel ?? "",
      ctaHref: r.ctaHref || "/collections/all",
    }));
  });
}

export function getHeroSlides(): Promise<HeroSlide[]> {
  return safely("hero banners", async () => {
    const rows = await HeroBanner.find({ active: true })
      .sort({ position: 1, createdAt: 1 })
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      desktopImage: r.desktopImage,
      mobileImage: r.mobileImage || r.desktopImage,
      alt: r.alt ?? "",
      href: r.href ?? "",
    }));
  });
}

export function getReels(): Promise<ReelItem[]> {
  return safely("reels", async () => {
    const rows = await Reel.find({ active: true })
      .sort({ position: 1, createdAt: 1 })
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      video: r.video,
      videoType: r.videoType || "video/mp4",
      poster: r.poster ?? "",
      productHandle: r.productHandle ?? "",
      alt: r.alt ?? "",
    }));
  });
}

export function getInstagramTiles(): Promise<InstagramItem[]> {
  return safely("instagram", async () => {
    const rows = await InstagramPost.find({ active: true })
      .sort({ position: 1, createdAt: 1 })
      .lean();
    return rows.map((r) => ({
      id: String(r._id),
      image: r.image,
      permalink: r.permalink || INSTAGRAM_PROFILE,
      caption: r.caption ?? "",
    }));
  });
}
