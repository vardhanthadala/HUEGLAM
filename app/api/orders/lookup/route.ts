import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders } from "@/lib/db/schema";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  email: z.email().max(200),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Store is not configured." }, { status: 503 });
  }

  let payload: z.infer<typeof bodySchema>;
  try {
    payload = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Enter your order number and the email you ordered with." },
      { status: 400 },
    );
  }

  // Both must match, so an order number alone reveals nothing.
  const found = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, payload.orderNumber.toUpperCase()),
        eq(orders.email, payload.email.toLowerCase()),
      ),
    );

  const order = found[0];
  if (!order) {
    return NextResponse.json(
      { error: "We could not find an order with those details." },
      { status: 404 },
    );
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      trackingCarrier: order.trackingCarrier,
      trackingNumber: order.trackingNumber,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
    },
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      handle: i.handle,
      image: i.image,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
  });
}
