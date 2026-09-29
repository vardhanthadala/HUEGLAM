import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons, orderItems, orders, products, productImages } from "@/lib/db/schema";
import { generateOrderNumber, priceOrder, type PricedLine } from "@/lib/pricing";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { getCustomerSession } from "@/lib/customer-auth";

export const runtime = "nodejs";

const bodySchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.email().max(200),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{10}$/, "Enter a 10-digit mobile number"),
    addressLine1: z.string().trim().min(4).max(200),
    addressLine2: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  }),
  lines: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(30),
  couponCode: z.string().trim().max(40).optional(),
  customerNote: z.string().trim().max(1000).optional(),
  // Only sent when the customer chose a different billing address.
  billingAddress: z
    .object({
      name: z.string().trim().min(2).max(120),
      addressLine1: z.string().trim().min(4).max(200),
      addressLine2: z.string().trim().max(200).default(""),
      city: z.string().trim().min(2).max(100),
      state: z.string().trim().min(2).max(100),
      pincode: z
        .string()
        .trim()
        .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit billing pincode"),
      phone: z.string().trim().max(20).default(""),
    })
    .optional(),
});

export async function POST(request: Request) {
  // Checkout is account-only. The page is gated server-side too, but this is
  // the check that actually matters — the UI gate alone could be bypassed by
  // posting here directly. It runs before the configuration checks so an
  // anonymous caller learns nothing about how the store is set up.
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please sign in to place an order." },
      { status: 401 },
    );
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Store is not configured yet. DATABASE_URL is missing." },
      { status: 503 },
    );
  }
  if (!razorpayConfigured) {
    return NextResponse.json(
      { error: "Payments are not configured yet. Add your Razorpay keys." },
      { status: 503 },
    );
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError
        ? (err.issues[0]?.message ?? "Invalid details")
        : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const ids = [...new Set(payload.lines.map((l) => l.productId))];

  // Re-read prices and stock from the database. The client's numbers are ignored.
  const found = await db
    .select()
    .from(products)
    .where(and(inArray(products.id, ids), eq(products.published, true)));

  if (found.length !== ids.length) {
    return NextResponse.json(
      { error: "One of the items is no longer available." },
      { status: 409 },
    );
  }

  const images = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, ids));

  const priced: PricedLine[] = [];
  for (const line of payload.lines) {
    const product = found.find((p) => p.id === line.productId)!;

    if (product.trackInventory && product.inventory < line.quantity) {
      return NextResponse.json(
        {
          error:
            product.inventory <= 0
              ? product.title + " is sold out."
              : "Only " + product.inventory + " left of " + product.title + ".",
        },
        { status: 409 },
      );
    }

    const image =
      images
        .filter((i) => i.productId === product.id)
        .sort((a, b) => a.position - b.position)[0]?.src ?? null;

    priced.push({
      productId: product.id,
      title: product.title,
      handle: product.handle,
      sku: product.sku,
      image,
      unitPrice: product.price,
      quantity: line.quantity,
      lineTotal: product.price * line.quantity,
    });
  }

  // Resolve the coupon server-side too.
  let coupon = null;
  if (payload.couponCode) {
    const match = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, payload.couponCode.toUpperCase()));

    const c = match[0];
    const usable =
      c &&
      c.active &&
      (!c.expiresAt || c.expiresAt > new Date()) &&
      (c.usageLimit === null || c.usageCount < c.usageLimit);

    if (!usable) {
      return NextResponse.json({ error: "That coupon code is not valid." }, { status: 400 });
    }
    coupon = { code: c.code, type: c.type, value: c.value, minSubtotal: c.minSubtotal };
  }

  const totals = priceOrder(priced, coupon);
  const orderNumber = generateOrderNumber();

  const rzp = getRazorpay();
  const rzpOrder = await rzp.orders.create({
    amount: totals.total,
    currency: "INR",
    receipt: orderNumber,
    notes: { orderNumber, email: payload.customer.email },
  });

  const inserted = await db
    .insert(orders)
    .values({
      orderNumber,
      // Always the session's email, never the client's: orders are matched back
      // to an account by email, so a mismatched value here would hide the order
      // from the customer's own order history.
      email: session.email.toLowerCase(),
      phone: payload.customer.phone,
      customerName: payload.customer.name,
      addressLine1: payload.customer.addressLine1,
      addressLine2: payload.customer.addressLine2 ?? "",
      city: payload.customer.city,
      state: payload.customer.state,
      pincode: payload.customer.pincode,
      country: "India",
      subtotal: totals.subtotal,
      shipping: totals.shipping,
      discount: totals.discount,
      total: totals.total,
      couponCode: coupon?.code ?? null,
      customerNote: payload.customerNote || null,
      billingAddress: payload.billingAddress ?? null,
      status: "pending",
      paymentMethod: "razorpay",
      razorpayOrderId: rzpOrder.id,
    })
    .returning({ id: orders.id });

  // --- MONGODB INTEGRATION ---
  try {
    const { connectDB } = require("@/lib/mongodb.ts"); // Use require to avoid top-level import conflicts if lib/db exports differ
    const { Order: MongoOrder } = require("@/models/Order");
    
    await connectDB();
    await MongoOrder.create({
      customer: {
        name: payload.customer.name,
        email: session.email.toLowerCase(),
        phone: payload.customer.phone,
        addressLine1: payload.customer.addressLine1,
        addressLine2: payload.customer.addressLine2,
        city: payload.customer.city,
        state: payload.customer.state,
        pincode: payload.customer.pincode,
      },
      lines: payload.lines,
      customerNote: payload.customerNote,
      couponCode: payload.couponCode,
      billingAddress: payload.billingAddress,
      status: "pending_payment",
      razorpayOrderId: rzpOrder.id,
    });
  } catch (err) {
    console.error("Failed to save order to MongoDB:", err);
  }
  // ---------------------------

  await db.insert(orderItems).values(
    priced.map((l) => ({
      orderId: inserted[0].id,
      productId: l.productId,
      title: l.title,
      handle: l.handle,
      sku: l.sku,
      image: l.image,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
  );

  return NextResponse.json({
    orderNumber,
    razorpayOrderId: rzpOrder.id,
    amount: totals.total,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    totals,
  });
}
