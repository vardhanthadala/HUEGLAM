/**
 * Seeds MongoDB with everything the store needs to run: the admin login, the
 * catalogue, and the homepage content that used to be hardcoded in lib/content.ts.
 *
 * Safe to re-run. It never deletes and never overwrites:
 *   - the admin password is reset to ADMIN_PASSWORD (that is the point of it),
 *   - products are inserted only if their handle is missing, so live stock
 *     levels and admin edits survive,
 *   - a content collection is filled only when it is completely empty, so
 *     banners you deleted stay deleted.
 *
 *   npm run db:seed
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose, { type Model } from "mongoose";
import bcrypt from "bcryptjs";

import { AdminUser } from "../models/AdminUser";
import { Product } from "../models/Product";
import { Order } from "../models/Order";
import { Customer } from "../models/Customer";
import { Coupon } from "../models/Coupon";
import { LoginAttempt } from "../models/LoginAttempt";
import { Announcement } from "../models/Announcement";
import { HeroBanner } from "../models/HeroBanner";
import { Reel } from "../models/Reel";
import { InstagramPost } from "../models/InstagramPost";
import { seedProducts } from "../lib/products-seed";

const PROFILE = "https://www.instagram.com/hueglam_official";

const announcements = [
  {
    text: "*CLEARANCE SALE 50-60% off.*",
    ctaLabel: "Shop Now",
    ctaHref: "/collections/all",
    position: 1,
  },
  {
    text: "Limited Time offer.",
    ctaLabel: "Shop Now",
    ctaHref: "/collections/all",
    position: 2,
  },
];

const heroBanners = [
  {
    desktopImage: "/brand/banner2_6b270fa9-fbee-4798-bd35-20e51293222b.jpg",
    mobileImage: "/brand/mobile_banner2.jpg",
    alt: "HUEGLAM clearance sale",
    href: "",
    position: 1,
  },
  {
    desktopImage: "/brand/banner1_211d5d7d-c603-4648-a633-ef8709de8b69.jpg",
    mobileImage:
      "/brand/mobile_banner1_545a64a9-281b-4167-8a6a-5f2ece8a1878.jpg",
    alt: "HUEGLAM skincare range",
    href: "",
    position: 2,
  },
];

const reels = [
  {
    video: "/reels/reel1.webm",
    videoType: "video/webm",
    poster: "/reels/reel1.jpg",
    productHandle: "hueglam-ultimate-glow-combo",
    alt: "Creator unboxing the HUEGLAM Ultimate Glow Combo",
    position: 1,
  },
  {
    video: "/reels/reel2.mp4",
    videoType: "video/mp4",
    poster: "/reels/reel2.jpg",
    productHandle: "3-salicylic-acid-face-wash",
    alt: "Creator demonstrating the 3% Salicylic Acid Face Wash",
    position: 2,
  },
  {
    video: "/reels/reel3.mp4",
    videoType: "video/mp4",
    poster: "/reels/reel3.jpg",
    productHandle: "hueglam-ultimate-glow-combo",
    alt: "Creator reviewing the HUEGLAM Ultimate Glow Combo",
    position: 3,
  },
  {
    video: "/reels/reel4.mp4",
    videoType: "video/mp4",
    poster: "/reels/reel4.jpg",
    productHandle: "clarifying-face-serum-10-niacinamide-1-zinc",
    alt: "Creator applying the Clarifying Face Serum",
    position: 4,
  },
];

const instagramPosts = [
  { image: "/brand/11_aug25.jpg", caption: "HUEGLAM skincare", position: 1 },
  {
    image: "/products/combo1_1-_2__final.jpg",
    caption: "HUEGLAM Ultimate Glow Combo",
    position: 2,
  },
  {
    image: "/products/facewash_4thaug.jpg",
    caption: "3% Salicylic Acid Face Wash",
    position: 3,
  },
  {
    image: "/products/hue_p5.jpg",
    caption: "Vitamin C Sunscreen SPF 50",
    position: 4,
  },
  {
    image: "/products/serum234.jpg",
    caption: "Clarifying Face Serum",
    position: 5,
  },
  {
    image: "/products/faceserum1instapost.jpg",
    caption: "Vitamin C Day Moisturizer",
    position: 6,
  },
];

/** Fills a collection only when it is empty, so re-seeding never duplicates. */
async function fillIfEmpty<T>(
  label: string,
  model: Model<never>,
  rows: T[],
): Promise<void> {
  const existing = await model.countDocuments();
  if (existing > 0) {
    console.log("  " + label + ": " + existing + " already there, left alone");
    return;
  }
  await model.insertMany(rows as never[]);
  console.log("  " + label + ": inserted " + rows.length);
}

async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      "  admin: skipped (set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local)",
    );
    return;
  }
  if (password.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 12 characters. This is the only credential " +
        "guarding the store's order data.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await AdminUser.findOneAndUpdate(
    { email },
    { $set: { passwordHash, name: "Admin" }, $setOnInsert: { email } },
    { upsert: true },
  );
  console.log("  admin: " + email + " ready");
}

async function seedCatalogue(): Promise<void> {
  let inserted = 0;
  let kept = 0;

  for (const p of seedProducts) {
    const existing = await Product.findOne({ handle: p.handle }).select({
      _id: 1,
    });
    if (existing) {
      kept++;
      continue;
    }

    await Product.create({
      handle: p.handle,
      title: p.title,
      vendor: "HUEGLAM",
      description: p.description,
      bodyHtml: p.bodyHtml,
      sku: p.sku || undefined,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? undefined,
      grams: p.grams,
      tags: p.tags,
      inventory: p.inventory,
      trackInventory: true,
      available: true,
      published: true,
      position: p.position,
      images: p.images.map((image, index) => ({
        src: image.src,
        alt: image.alt,
        width: image.width,
        height: image.height,
        position: index + 1,
      })),
    });
    inserted++;
  }

  console.log(
    "  products: inserted " + inserted + ", left " + kept + " untouched",
  );
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);

  /*
    Build the indexes up front. The unique index on orderNumber and the TTL
    index on login attempts are load-bearing — uniqueness is what stops two
    orders sharing a number, and the app should not be the thing that discovers
    a missing index at 2am.
  */
  console.log("Syncing indexes...");
  for (const model of [
    AdminUser,
    Product,
    Order,
    Customer,
    Coupon,
    LoginAttempt,
    Announcement,
    HeroBanner,
    Reel,
    InstagramPost,
  ]) {
    await model.syncIndexes();
  }

  console.log("Seeding:");
  await seedAdmin();
  await seedCatalogue();
  await fillIfEmpty("announcements", Announcement as never, announcements);
  await fillIfEmpty("hero banners", HeroBanner as never, heroBanners);
  await fillIfEmpty("reels", Reel as never, reels);
  await fillIfEmpty(
    "instagram",
    InstagramPost as never,
    instagramPosts.map((p) => ({ ...p, permalink: PROFILE })),
  );

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
