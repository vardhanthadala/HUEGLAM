import "server-only";
import { connectDB } from "./mongodb";
import { Product } from "@/models/Product";
import { Order, ORDER_STATUSES } from "@/models/Order";
import type {
  ProductImage,
  ProductWithImages,
  StoreAddress,
  StoreOrder,
  StoreOrderItem,
} from "./types";

export type { ProductImage, ProductWithImages } from "./types";

/**
 * Storefront and admin reads, backed by MongoDB.
 *
 * There is no seed or placeholder path: if the database is unreachable the
 * pages render empty rather than showing a catalogue that cannot be bought.
 * List reads log and return empty so one broken collection cannot take the
 * whole site down; single-item reads return null so the caller can 404.
 */

/** Statuses that mean money actually arrived. */
const PAID_STATUSES = ["paid", "shipped", "delivered"];

type LeanImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  position?: number;
};

type LeanProduct = {
  _id: { toString(): string };
  handle: string;
  title: string;
  vendor?: string;
  description?: string;
  bodyHtml?: string;
  activeIngredients?: string;
  benefits?: string[];
  ingredients?: string;
  directions?: string;
  careGuide?: string;
  sku?: string | null;
  price: number;
  compareAtPrice?: number | null;
  grams?: number;
  tags?: string[];
  inventory?: number;
  trackInventory?: boolean;
  available?: boolean;
  published?: boolean;
  position?: number;
  createdAt?: Date;
  updatedAt?: Date;
  images?: LeanImage[];
};

function toImage(image: LeanImage, index: number): ProductImage {
  return {
    src: image.src,
    alt: image.alt ?? "",
    width: image.width ?? 0,
    height: image.height ?? 0,
    position: image.position ?? index + 1,
  };
}

function toProduct(row: LeanProduct): ProductWithImages {
  return {
    id: row._id.toString(),
    handle: row.handle,
    title: row.title,
    vendor: row.vendor ?? "HUEGLAM",
    description: row.description ?? "",
    bodyHtml: row.bodyHtml ?? "",
    activeIngredients: row.activeIngredients ?? "",
    benefits: row.benefits ?? [],
    ingredients: row.ingredients ?? "",
    directions: row.directions ?? "",
    careGuide: row.careGuide ?? "",
    sku: row.sku ?? null,
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? null,
    grams: row.grams ?? 0,
    tags: row.tags ?? [],
    inventory: row.inventory ?? 0,
    trackInventory: row.trackInventory ?? true,
    available: row.available ?? true,
    published: row.published ?? true,
    position: row.position ?? 0,
    createdAt: row.createdAt ?? new Date(0),
    updatedAt: row.updatedAt ?? new Date(0),
    images: (row.images ?? []).map(toImage).sort((a, b) => a.position - b.position),
  };
}

/** All published products, in the order the store owner set. */
export async function getPublishedProducts(): Promise<ProductWithImages[]> {
  try {
    await connectDB();
    const rows = await Product.find({ published: true })
      .sort({ position: 1, createdAt: 1 })
      .lean();
    return (rows as unknown as LeanProduct[]).map(toProduct);
  } catch (error) {
    console.error("[queries] getPublishedProducts failed:", error);
    return [];
  }
}

export async function getProductByHandle(
  handle: string,
): Promise<ProductWithImages | null> {
  try {
    await connectDB();
    const row = await Product.findOne({ handle }).lean();
    if (!row) return null;
    const product = toProduct(row as unknown as LeanProduct);
    return product.published ? product : null;
  } catch (error) {
    console.error("[queries] getProductByHandle failed:", error);
    return null;
  }
}

export async function getProductById(
  id: string,
): Promise<ProductWithImages | null> {
  try {
    await connectDB();
    const row = await Product.findById(id).lean();
    return row ? toProduct(row as unknown as LeanProduct) : null;
  } catch (error) {
    console.error("[queries] getProductById failed:", error);
    return null;
  }
}

/** Up to `limit` other published products, for the "you may also like" rail. */
export async function getRelatedProducts(
  excludeId: string,
  limit = 4,
): Promise<ProductWithImages[]> {
  const all = await getPublishedProducts();
  return all.filter((p) => p.id !== excludeId).slice(0, limit);
}

/**
 * Units of a product actually sold in the last `hours`, counting paid orders
 * only. Returns null when the figure cannot be read, so the caller leaves the
 * line out rather than printing a zero it cannot stand behind.
 */
export async function getUnitsSoldSince(
  productId: string,
  hours = 24,
): Promise<number | null> {
  try {
    await connectDB();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const result = await Order.aggregate<{ total: number }>([
      { $match: { createdAt: { $gte: since }, status: { $in: PAID_STATUSES } } },
      { $unwind: "$items" },
      { $match: { "items.productId": productId } },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]);

    return result[0]?.total ?? 0;
  } catch (error) {
    console.error("[queries] getUnitsSoldSince failed:", error);
    return null;
  }
}

/* --------------------------------------------------------------- orders --- */

type LeanOrderItem = {
  _id?: { toString(): string };
  productId?: string | null;
  title: string;
  handle: string;
  sku?: string | null;
  image?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

type LeanOrder = {
  _id: { toString(): string };
  orderNumber?: string;
  email?: string;
  customerName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  total?: number;
  couponCode?: string | null;
  customerNote?: string | null;
  billingAddress?: {
    name?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  } | null;
  status?: string;
  paymentMethod?: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  items?: LeanOrderItem[];
};

/**
 * Orders written before the status set was unified still carry the old values,
 * so they are mapped rather than shown raw.
 */
function normaliseStatus(status: string): string {
  if (status === "pending_payment") return "pending";
  if (status === "processing") return "paid";
  return (ORDER_STATUSES as readonly string[]).includes(status) ? status : "pending";
}

function toOrderItem(item: LeanOrderItem, index: number): StoreOrderItem {
  return {
    id: item._id?.toString() ?? String(index),
    productId: item.productId ?? null,
    title: item.title,
    handle: item.handle,
    sku: item.sku ?? null,
    image: item.image ?? null,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  };
}

/** An embedded address is only worth showing when it has a street line. */
function toAddress(raw: LeanOrder["billingAddress"]): StoreAddress | null {
  if (!raw?.addressLine1) return null;
  return {
    name: raw.name ?? "",
    addressLine1: raw.addressLine1,
    addressLine2: raw.addressLine2 ?? "",
    city: raw.city ?? "",
    state: raw.state ?? "",
    pincode: raw.pincode ?? "",
    phone: raw.phone ?? "",
  };
}

/*
  Every field is defaulted. Orders written before this schema (they nested the
  buyer under `customer` and carried no money at all) would otherwise render as
  "Rs. NaN" in the admin. They degrade to blanks and zeros instead, which reads
  as obviously-wrong rather than plausibly-wrong.
*/
function toOrder(row: LeanOrder): StoreOrder {
  return {
    id: row._id.toString(),
    orderNumber: row.orderNumber ?? "—",
    email: row.email ?? "",
    customerName: row.customerName ?? "",
    phone: row.phone ?? "",
    addressLine1: row.addressLine1 ?? "",
    addressLine2: row.addressLine2 ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    pincode: row.pincode ?? "",
    country: row.country ?? "India",
    subtotal: row.subtotal ?? 0,
    discount: row.discount ?? 0,
    shipping: row.shipping ?? 0,
    total: row.total ?? 0,
    couponCode: row.couponCode ?? null,
    customerNote: row.customerNote ?? null,
    billingAddress: toAddress(row.billingAddress),
    status: normaliseStatus(row.status ?? "pending"),
    paymentMethod: row.paymentMethod ?? "razorpay",
    razorpayOrderId: row.razorpayOrderId ?? null,
    razorpayPaymentId: row.razorpayPaymentId ?? null,
    trackingCarrier: row.trackingCarrier ?? null,
    trackingNumber: row.trackingNumber ?? null,
    notes: row.notes ?? null,
    createdAt: row.createdAt ?? new Date(0),
    updatedAt: row.updatedAt ?? new Date(0),
    items: (row.items ?? []).map(toOrderItem),
  };
}

/** Newest orders for the admin. */
export async function getRecentOrders(limit = 100): Promise<StoreOrder[]> {
  try {
    await connectDB();
    const rows = await Order.find().sort({ createdAt: -1 }).limit(limit).lean();
    return (rows as unknown as LeanOrder[]).map(toOrder);
  } catch (error) {
    console.error("[queries] getRecentOrders failed:", error);
    return [];
  }
}

/** Orders belonging to a signed-in customer, newest first. */
export async function getOrdersForEmail(email: string): Promise<StoreOrder[]> {
  try {
    await connectDB();
    const rows = await Order.find({ email: email.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return (rows as unknown as LeanOrder[]).map(toOrder);
  } catch (error) {
    console.error("[queries] getOrdersForEmail failed:", error);
    return [];
  }
}

/**
 * Order history for the account page. Lines live on the order document, so this
 * is a single query — the split shape is kept because the page renders the
 * order header and its items separately.
 */
export async function getOrdersWithItemsForEmail(email: string) {
  const orders = await getOrdersForEmail(email);
  return orders.map((order) => ({ order, items: order.items }));
}

/** One order by its Mongo id, for the admin detail page. */
export async function getOrderById(id: string): Promise<StoreOrder | null> {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;
  try {
    await connectDB();
    const row = await Order.findById(id).lean();
    return row ? toOrder(row as unknown as LeanOrder) : null;
  } catch (error) {
    console.error("[queries] getOrderById failed:", error);
    return null;
  }
}

export async function getOrderWithItems(orderNumber: string) {
  try {
    await connectDB();
    const row = await Order.findOne({ orderNumber }).lean();
    if (!row) return null;
    const order = toOrder(row as unknown as LeanOrder);
    return { order, items: order.items };
  } catch (error) {
    console.error("[queries] getOrderWithItems failed:", error);
    return null;
  }
}
