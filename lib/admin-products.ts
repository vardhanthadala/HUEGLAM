import "server-only";
import { connectDB } from "./mongodb";
import { Product } from "@/models/Product";

/**
 * Product reads for the admin, backed by MongoDB.
 *
 * Separate from lib/queries.ts because the admin needs every product including
 * drafts, and only the subset of fields its forms edit. The storefront reads
 * published products with their full render shape. The two overlap enough that
 * they could be merged behind one function with a flag; that is left alone for
 * now because the admin forms are typed against AdminProduct.
 */

export type AdminProductImage = {
  src: string;
  alt: string;
  position: number;
};

export type AdminProduct = {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  description: string;
  sku: string;
  /** Paise, as stored. */
  price: number;
  compareAtPrice: number | null;
  inventory: number;
  trackInventory: boolean;
  published: boolean;
  position: number;
  images: AdminProductImage[];
  activeIngredients: string;
  benefits: string[];
  ingredients: string;
  directions: string;
  careGuide: string;
};

type LeanProduct = {
  _id: { toString(): string };
  handle: string;
  title: string;
  vendor?: string;
  description?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number | null;
  inventory?: number;
  trackInventory?: boolean;
  published?: boolean;
  position?: number;
  images?: { src: string; alt?: string; position?: number }[];
  activeIngredients?: string;
  benefits?: string[];
  ingredients?: string;
  directions?: string;
  careGuide?: string;
};

function toAdminProduct(row: LeanProduct): AdminProduct {
  return {
    id: row._id.toString(),
    handle: row.handle,
    title: row.title,
    vendor: row.vendor ?? "HUEGLAM",
    description: row.description ?? "",
    sku: row.sku ?? "",
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? null,
    inventory: row.inventory ?? 0,
    trackInventory: row.trackInventory ?? true,
    published: row.published ?? true,
    position: row.position ?? 0,
    images: (row.images ?? [])
      .map((i, index) => ({
        src: i.src,
        alt: i.alt ?? "",
        position: i.position ?? index + 1,
      }))
      .sort((a, b) => a.position - b.position),
    activeIngredients: row.activeIngredients ?? "",
    benefits: row.benefits ?? [],
    ingredients: row.ingredients ?? "",
    directions: row.directions ?? "",
    careGuide: row.careGuide ?? "",
  };
}

/** Every product, published or not. Empty when Mongo is unreachable. */
export async function listAdminProducts(): Promise<AdminProduct[]> {
  if (!process.env.MONGODB_URI) return [];
  try {
    await connectDB();
    const rows = await Product.find().sort({ position: 1, createdAt: 1 }).lean();
    return (rows as unknown as LeanProduct[]).map(toAdminProduct);
  } catch (error) {
    console.error("[admin-products] list failed:", error);
    return [];
  }
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  if (!process.env.MONGODB_URI) return null;
  try {
    await connectDB();
    const row = await Product.findById(id).lean();
    return row ? toAdminProduct(row as unknown as LeanProduct) : null;
  } catch (error) {
    console.error("[admin-products] fetch failed:", error);
    return null;
  }
}
