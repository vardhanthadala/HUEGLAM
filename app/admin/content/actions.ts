"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { Announcement } from "@/models/Announcement";
import { HeroBanner } from "@/models/HeroBanner";
import { Reel } from "@/models/Reel";
import { InstagramPost } from "@/models/InstagramPost";

export type ContentState = { error?: string; ok?: string };

/** Every storefront surface that renders editable content. */
function revalidateStorefront() {
  revalidatePath("/", "layout");
  revalidatePath("/collections/all");
  revalidatePath("/products/[handle]", "page");
}

function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function num(form: FormData, key: string): number {
  const parsed = Number(str(form, key));
  return Number.isFinite(parsed) ? parsed : 0;
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === "on";
}

async function guard(): Promise<string | null> {
  await requireSession();
  if (!process.env.MONGODB_URI) {
    return "MONGODB_URI is not set. Add it to .env.local to use the admin portal.";
  }
  await connectDB();
  return null;
}

/* ---------------- Announcements ---------------- */

export async function saveAnnouncement(
  _prev: ContentState,
  form: FormData,
): Promise<ContentState> {
  const problem = await guard();
  if (problem) return { error: problem };

  const text = str(form, "text");
  if (text.length < 2) return { error: "Enter the message text." };

  const doc = {
    text,
    ctaLabel: str(form, "ctaLabel"),
    ctaHref: str(form, "ctaHref") || "/collections/all",
    active: bool(form, "active"),
    position: num(form, "position"),
  };

  const id = str(form, "id");
  if (id) await Announcement.findByIdAndUpdate(id, doc);
  else await Announcement.create(doc);

  revalidateStorefront();
  revalidatePath("/admin/content/announcements");
  return { ok: id ? "Message updated." : "Message added." };
}

/* ---------------- Hero banners ---------------- */

export async function saveHeroBanner(
  _prev: ContentState,
  form: FormData,
): Promise<ContentState> {
  const problem = await guard();
  if (problem) return { error: problem };

  const desktopImage = str(form, "desktopImage");
  if (!desktopImage) return { error: "A desktop image is required." };

  const doc = {
    desktopImage,
    mobileImage: str(form, "mobileImage"),
    alt: str(form, "alt"),
    href: str(form, "href"),
    active: bool(form, "active"),
    position: num(form, "position"),
  };

  const id = str(form, "id");
  if (id) await HeroBanner.findByIdAndUpdate(id, doc);
  else await HeroBanner.create(doc);

  revalidateStorefront();
  revalidatePath("/admin/content/banners");
  return { ok: id ? "Banner updated." : "Banner added." };
}

/* ---------------- Reels ---------------- */

export async function saveReel(
  _prev: ContentState,
  form: FormData,
): Promise<ContentState> {
  const problem = await guard();
  if (problem) return { error: problem };

  const video = str(form, "video");
  if (!video) return { error: "A video file is required." };

  const doc = {
    video,
    videoType: video.endsWith(".webm") ? "video/webm" : "video/mp4",
    poster: str(form, "poster"),
    productHandle: str(form, "productHandle"),
    alt: str(form, "alt"),
    active: bool(form, "active"),
    position: num(form, "position"),
  };

  const id = str(form, "id");
  if (id) await Reel.findByIdAndUpdate(id, doc);
  else await Reel.create(doc);

  revalidateStorefront();
  revalidatePath("/admin/content/reels");
  return { ok: id ? "Reel updated." : "Reel added." };
}

/* ---------------- Instagram ---------------- */

export async function saveInstagramPost(
  _prev: ContentState,
  form: FormData,
): Promise<ContentState> {
  const problem = await guard();
  if (problem) return { error: problem };

  const image = str(form, "image");
  if (!image) return { error: "An image is required." };

  const doc = {
    image,
    permalink: str(form, "permalink") || "https://www.instagram.com/hueglam_official",
    caption: str(form, "caption"),
    active: bool(form, "active"),
    position: num(form, "position"),
  };

  const id = str(form, "id");
  if (id) await InstagramPost.findByIdAndUpdate(id, doc);
  else await InstagramPost.create(doc);

  revalidateStorefront();
  revalidatePath("/admin/content/instagram");
  return { ok: id ? "Post updated." : "Post added." };
}

/* ---------------- Delete ---------------- */

/**
 * A switch rather than a lookup map: the four models have different document
 * types, so indexing a map of them gives TypeScript a union whose
 * findByIdAndDelete overloads cannot be reconciled.
 */
export async function deleteContent(form: FormData) {
  await requireSession();
  if (!process.env.MONGODB_URI) return;
  await connectDB();

  const kind = str(form, "kind");
  const id = str(form, "id");
  if (!id) return;

  switch (kind) {
    case "announcement":
      await Announcement.findByIdAndDelete(id);
      break;
    case "banner":
      await HeroBanner.findByIdAndDelete(id);
      break;
    case "reel":
      await Reel.findByIdAndDelete(id);
      break;
    case "instagram":
      await InstagramPost.findByIdAndDelete(id);
      break;
    default:
      return;
  }

  revalidateStorefront();
  revalidatePath("/admin/content/" + kind);
}
