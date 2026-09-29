"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { Product } from "@/models/Product";
import { rupeesToPaise } from "@/lib/money";

export type ProductState = { error?: string; ok?: string };

function str(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Splits a textarea into trimmed, non-empty lines. */
function lines(form: FormData, key: string): string[] {
  return str(form, key)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function saveProduct(
  _prev: ProductState,
  form: FormData,
): Promise<ProductState> {
  await requireSession();
  if (!process.env.MONGODB_URI) {
    return { error: "MONGODB_URI is not set. Add it to .env.local first." };
  }

  const title = str(form, "title");
  if (title.length < 2) return { error: "Enter a product name." };

  const priceRupees = Number(str(form, "price"));
  if (!Number.isFinite(priceRupees) || priceRupees < 0) {
    return { error: "Enter a valid price." };
  }

  const compareRaw = str(form, "compareAtPrice");
  const compareRupees = compareRaw === "" ? null : Number(compareRaw);
  if (compareRupees !== null && !Number.isFinite(compareRupees)) {
    return { error: "Enter a valid compare-at price, or leave it blank." };
  }

  const price = rupeesToPaise(priceRupees);
  const compareAtPrice = compareRupees === null ? null : rupeesToPaise(compareRupees);

  if (compareAtPrice !== null && compareAtPrice <= price) {
    return {
      error: "The compare-at price must be higher than the selling price, or blank.",
    };
  }

  // Images arrive as JSON from the image editor so order is preserved.
  let images: { src: string; alt: string; position: number }[] = [];
  try {
    const parsed: unknown = JSON.parse(str(form, "images") || "[]");
    if (Array.isArray(parsed)) {
      images = parsed
        .filter((i): i is { src: string; alt?: string } => Boolean(i?.src))
        .map((i, index) => ({
          src: String(i.src),
          alt: String(i.alt ?? ""),
          position: index + 1,
        }));
    }
  } catch {
    return { error: "Could not read the image list. Try re-adding the images." };
  }

  const doc = {
    title,
    handle: str(form, "handle") || slugify(title),
    vendor: str(form, "vendor") || "HUEGLAM",
    sku: str(form, "sku"),
    description: str(form, "description"),
    bodyHtml: str(form, "bodyHtml"),
    price,
    inventory: Number(str(form, "inventory")) || 0,
    trackInventory: form.get("trackInventory") === "on",
    published: form.get("published") === "on",
    position: Number(str(form, "position")) || 0,
    images,
    activeIngredients: str(form, "activeIngredients"),
    benefits: lines(form, "benefits"),
    ingredients: str(form, "ingredients"),
    directions: str(form, "directions"),
    careGuide: str(form, "careGuide"),
  };

  try {
    await connectDB();
    const id = str(form, "id");

    if (id) {
      // $unset rather than undefined: clearing the sale price has to actually
      // remove it, or the storefront keeps showing a struck-through price that
      // no longer applies.
      await Product.findByIdAndUpdate(
        id,
        compareAtPrice === null
          ? { $set: doc, $unset: { compareAtPrice: "" } }
          : { $set: { ...doc, compareAtPrice } },
      );
    } else {
      await Product.create(
        compareAtPrice === null ? doc : { ...doc, compareAtPrice },
      );
    }
  } catch (error) {
    const duplicate =
      error instanceof Error && /duplicate key/i.test(error.message);
    return {
      error: duplicate
        ? "Another product already uses that handle. Pick a different one."
        : "Could not save. Check the database connection.",
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
  return { ok: str(form, "id") ? "Product saved." : "Product created." };
}

export async function deleteProduct(form: FormData) {
  await requireSession();
  if (!process.env.MONGODB_URI) return;

  const id = String(form.get("id") ?? "");
  if (!id) return;

  await connectDB();
  await Product.findByIdAndDelete(id);

  revalidatePath("/", "layout");
  revalidatePath("/admin/products");

  // The page we were on no longer has a product behind it, so stay off it.
  redirect("/admin/products");
}
