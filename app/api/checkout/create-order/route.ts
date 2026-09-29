import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB, mongoConfigured } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Coupon } from "@/models/Coupon";
import { Order } from "@/models/Order";
import { generateOrderNumber, priceOrder, type PricedLine } from "@/lib/pricing";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { getCustomerSession } from "@/lib/customer-auth";

export const runtime = "nodejs";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "That item is no longer available");

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
        productId: objectId,
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

  if (!mongoConfigured) {
    return NextResponse.json(
      { error: "Store is not configured yet. MONGODB_URI is missing." },
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

  await connectDB();

  /*
    Collapse repeats before doing anything else. Checking each line on its own
    would let two lines of 20 through against 25 in stock, because each passes
    the test individually; merging first means the check is against what the
    order actually asks for. It also keeps one line per product on the invoice.
  */
  const merged = new Map<string, number>();
  for (const line of payload.lines) {
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + line.quantity);
  }

  const ids = [...merged.keys()];

  // Re-read prices and stock from the database. The client's numbers are only
  // ever used for which product and how many.
  const found = await Product.find({ _id: { $in: ids }, published: true }).lean();

  if (found.length !== ids.length) {
    return NextResponse.json(
      { error: "One of the items is no longer available." },
      { status: 409 },
    );
  }

  const byId = new Map(found.map((p) => [String(p._id), p]));

  const priced: PricedLine[] = [];
  for (const [productId, quantity] of merged) {
    const product = byId.get(productId)!;

    if (product.trackInventory && product.inventory < quantity) {
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
      [...(product.images ?? [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      )[0]?.src ?? null;

    priced.push({
      productId: String(product._id),
      title: product.title,
      handle: product.handle,
      sku: product.sku ?? null,
      image,
      unitPrice: product.price,
      quantity,
      lineTotal: product.price * quantity,
    });
  }

  // Resolve the coupon server-side too.
  let coupon = null;
  if (payload.couponCode) {
    const c = await Coupon.findOne({
      code: payload.couponCode.toUpperCase(),
    }).lean();

    const usable =
      c &&
      c.active &&
      (!c.expiresAt || c.expiresAt > new Date()) &&
      (c.usageLimit == null || c.usageCount < c.usageLimit);

    if (!usable) {
      return NextResponse.json(
        { error: "That coupon code is not valid." },
        { status: 400 },
      );
    }
    coupon = {
      code: c.code,
      type: c.type,
      value: c.value,
      minSubtotal: c.minSubtotal,
    };
  }

  const totals = priceOrder(priced, coupon);

  const rzp = getRazorpay();

  /*
    The order number is generated, not sequential, so a collision is possible in
    principle. The unique index is what actually guarantees uniqueness; this
    retries a couple of times before giving up rather than handing the customer
    a payment sheet for an order that was never stored.
  */
  let orderNumber = "";
  let saved = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 3 && !saved; attempt++) {
    orderNumber = generateOrderNumber();

    const rzpOrder = await rzp.orders.create({
      amount: totals.total,
      currency: "INR",
      receipt: orderNumber,
      notes: { orderNumber, email: session.email.toLowerCase() },
    });

    try {
      saved = await Order.create({
        orderNumber,
        // Always the session's email, never the client's: orders are matched
        // back to an account by email, so a mismatched value here would hide
        // the order from the customer's own history.
        email: session.email.toLowerCase(),
        customerId: session.id,
        customerName: payload.customer.name,
        phone: payload.customer.phone,
        addressLine1: payload.customer.addressLine1,
        addressLine2: payload.customer.addressLine2 ?? "",
        city: payload.customer.city,
        state: payload.customer.state,
        pincode: payload.customer.pincode,
        country: "India",
        items: priced,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        couponCode: coupon?.code ?? null,
        customerNote: payload.customerNote || null,
        billingAddress: payload.billingAddress ?? null,
        status: "pending",
        paymentMethod: "razorpay",
        razorpayOrderId: rzpOrder.id,
      });
    } catch (err) {
      lastError = err;
      // 11000 is a duplicate key — retry with a fresh number. Anything else is
      // a real failure and should not be retried.
      const code = (err as { code?: number })?.code;
      if (code !== 11000) break;
    }
  }

  if (!saved) {
    console.error("[checkout] could not store order:", lastError);
    return NextResponse.json(
      { error: "We could not start your order. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    orderNumber,
    razorpayOrderId: saved.razorpayOrderId,
    amount: totals.total,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    totals,
  });
}
