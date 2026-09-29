import { asc, desc, eq } from "drizzle-orm";
import type { Product, ProductImage } from "./db/schema";
import { seedProducts } from "./products-seed";

export type ProductWithImages = Product & { images: ProductImage[] };

export const hasDatabase = Boolean(process.env.DATABASE_URL);

/**
 * Before Neon is wired up the storefront still renders, straight from
 * `lib/products-seed.ts`. Everything that writes (orders, admin) requires a
 * real database and says so explicitly.
 */
function seedAsProducts(): ProductWithImages[] {
  return seedProducts.map((p, i) => ({
    id: i + 1,
    handle: p.handle,
    title: p.title,
    vendor: "HUEGLAM",
    description: p.description,
    bodyHtml: p.bodyHtml,
    sku: p.sku,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    grams: p.grams,
    tags: p.tags,
    inventory: p.inventory,
    trackInventory: true,
    available: true,
    published: true,
    position: p.position,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: p.images.map((img, j) => ({
      id: (i + 1) * 100 + j,
      productId: i + 1,
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      position: j + 1,
    })),
  }));
}

async function getDb() {
  const { db } = await import("./db");
  return db;
}

function groupImages(
  rows: { product: Product; image: ProductImage | null }[],
): ProductWithImages[] {
  const byId = new Map<number, ProductWithImages>();
  for (const row of rows) {
    let entry = byId.get(row.product.id);
    if (!entry) {
      entry = { ...row.product, images: [] };
      byId.set(row.product.id, entry);
    }
    if (row.image) entry.images.push(row.image);
  }
  for (const entry of byId.values()) {
    entry.images.sort((a, b) => a.position - b.position);
  }
  return [...byId.values()];
}

/** All published products, in the order the store owner set. */
export async function getPublishedProducts(): Promise<ProductWithImages[]> {
  if (!hasDatabase) return seedAsProducts();

  const db = await getDb();
  const { products, productImages } = await import("./db/schema");
  const rows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.published, true))
    .orderBy(asc(products.position), asc(products.id), asc(productImages.position));

  return groupImages(rows);
}

export async function getProductByHandle(handle: string): Promise<ProductWithImages | null> {
  if (!hasDatabase) {
    return seedAsProducts().find((p) => p.handle === handle) ?? null;
  }

  const db = await getDb();
  const { products, productImages } = await import("./db/schema");
  const rows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.handle, handle))
    .orderBy(asc(productImages.position));

  const found = groupImages(rows)[0];
  if (!found || !found.published) return null;
  return found;
}

/** Every product for the admin list, published or not. Requires a database. */
export async function getAllProductsForAdmin(): Promise<ProductWithImages[]> {
  const db = await getDb();
  const { products, productImages } = await import("./db/schema");
  const rows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .orderBy(asc(products.position), asc(products.id), asc(productImages.position));

  return groupImages(rows);
}

export async function getProductById(id: number): Promise<ProductWithImages | null> {
  const db = await getDb();
  const { products, productImages } = await import("./db/schema");
  const rows = await db
    .select({ product: products, image: productImages })
    .from(products)
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.id, id))
    .orderBy(asc(productImages.position));

  return groupImages(rows)[0] ?? null;
}

/** Up to `limit` other published products, for the "you may also like" rail. */
export async function getRelatedProducts(
  excludeId: number,
  limit = 4,
): Promise<ProductWithImages[]> {
  const all = await getPublishedProducts();
  return all.filter((p) => p.id !== excludeId).slice(0, limit);
}

/**
 * Units of a product actually sold in the last `hours`, counting paid orders
 * only. Returns null when there is no database, so the caller can leave the
 * line out rather than invent a number.
 */
export async function getUnitsSoldSince(
  productId: number,
  hours = 24,
): Promise<number | null> {
  if (!hasDatabase) return null;

  try {
    const db = await getDb();
    const { orders, orderItems } = await import("./db/schema");
    const { and, gte, inArray, sql } = await import("drizzle-orm");

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const rows = await db
      .select({ total: sql<number>`coalesce(sum(${orderItems.quantity}), 0)` })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(
        and(
          eq(orderItems.productId, productId),
          gte(orders.createdAt, since),
          inArray(orders.status, ["paid", "shipped", "delivered"]),
        ),
      );

    return Number(rows[0]?.total ?? 0);
  } catch {
    return null;
  }
}

export async function getRecentOrders(limit = 100) {
  try {
    const { connectDB } = await import("./mongodb");
    const { Order } = await import("../models/Order");
    await connectDB();

    const orders = await Order.find().sort({ createdAt: -1 }).limit(limit).lean();

    return orders.map((o: any) => ({
      id: o._id.toString(),
      orderNumber: o.razorpayOrderId || "ORD-" + o._id.toString().slice(-4),
      email: o.customer?.email || "",
      customerName: o.customer?.name || "Unknown",
      city: o.customer?.city || "Unknown",
      createdAt: o.createdAt,
      status: o.status === "pending_payment" ? "pending" : o.status,
      total: 0, // Fallback since it wasn't saved in this schema initially
    }));
  } catch (err) {
    console.error("Failed to fetch orders from MongoDB", err);
    return [];
  }
}

/** Orders belonging to a signed-in customer, newest first. */
export async function getOrdersForEmail(email: string) {
  if (!hasDatabase) return [];

  try {
    const db = await getDb();
    const { orders } = await import("./db/schema");
    return await db
      .select()
      .from(orders)
      .where(eq(orders.email, email.toLowerCase()))
      .orderBy(desc(orders.createdAt))
      .limit(50);
  } catch {
    return [];
  }
}

/**
 * A customer's orders with their line items, newest first. One query for the
 * orders and one for all their items, rather than a query per order.
 */
export async function getOrdersWithItemsForEmail(email: string) {
  if (!hasDatabase) return [];

  try {
    const db = await getDb();
    const { orders, orderItems } = await import("./db/schema");
    const { inArray } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.email, email.toLowerCase()))
      .orderBy(desc(orders.createdAt))
      .limit(50);

    if (rows.length === 0) return [];

    const items = await db
      .select()
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          rows.map((o) => o.id),
        ),
      );

    return rows.map((order) => ({
      order,
      items: items.filter((i) => i.orderId === order.id),
    }));
  } catch {
    return [];
  }
}

export async function getOrderWithItems(orderNumber: string) {
  const db = await getDb();
  const { orders, orderItems } = await import("./db/schema");
  const found = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
  if (found.length === 0) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, found[0].id));
  return { order: found[0], items };
}
