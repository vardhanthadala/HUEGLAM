import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * All money is stored in paise (integer) so we never do float maths on rupees.
 * 24900 === Rs. 249.00
 */

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    handle: text("handle").notNull().unique(),
    title: text("title").notNull(),
    vendor: text("vendor").notNull().default("HUEGLAM"),
    description: text("description").notNull().default(""),
    // Rendered HTML body, ported over from Shopify.
    bodyHtml: text("body_html").notNull().default(""),
    sku: text("sku"),
    price: integer("price").notNull(),
    compareAtPrice: integer("compare_at_price"),
    grams: integer("grams").notNull().default(0),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    inventory: integer("inventory").notNull().default(0),
    trackInventory: boolean("track_inventory").notNull().default(true),
    available: boolean("available").notNull().default(true),
    published: boolean("published").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("products_handle_idx").on(t.handle)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    src: text("src").notNull(),
    alt: text("alt").notNull().default(""),
    width: integer("width").notNull().default(0),
    height: integer("height").notNull().default(0),
    position: integer("position").notNull().default(1),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    // Human-facing number, e.g. HG1042.
    orderNumber: text("order_number").notNull().unique(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    customerName: text("customer_name").notNull(),

    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2").notNull().default(""),
    city: text("city").notNull(),
    state: text("state").notNull(),
    pincode: text("pincode").notNull(),
    country: text("country").notNull().default("India"),

    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull().default(0),
    discount: integer("discount").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),

    // pending -> paid -> shipped -> delivered, or cancelled / failed
    status: text("status").notNull().default("pending"),
    paymentMethod: text("payment_method").notNull().default("razorpay"),
    razorpayOrderId: text("razorpay_order_id"),
    razorpayPaymentId: text("razorpay_payment_id"),

    trackingCarrier: text("tracking_carrier"),
    trackingNumber: text("tracking_number"),
    /** Internal, admin-only. Never shown to the customer. */
    notes: text("notes"),
    /** Written by the customer in the cart drawer's Order Note field. */
    customerNote: text("customer_note"),
    /** Null when billing matches the shipping address. */
    billingAddress: jsonb("billing_address").$type<{
      name: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    } | null>(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    // Denormalised so an order stays readable even if the product changes later.
    title: text("title").notNull(),
    handle: text("handle").notNull(),
    sku: text("sku"),
    image: text("image"),
    unitPrice: integer("unit_price").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  // "percent" or "fixed"
  type: text("type").notNull().default("percent"),
  value: integer("value").notNull(),
  minSubtotal: integer("min_subtotal").notNull().default(0),
  active: boolean("active").notNull().default(true),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Storefront customer accounts. Entirely separate from adminUsers — a customer
 * signing in must never be able to reach the admin panel.
 */
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  phone: text("phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Customer = typeof customers.$inferSelect;
