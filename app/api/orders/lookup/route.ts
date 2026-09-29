import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB, mongoConfigured } from "@/lib/mongodb";
import { Order } from "@/models/Order";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  email: z.email().max(200),
});

export async function POST(request: Request) {
  if (!mongoConfigured) {
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

  await connectDB();

  // Both must match, so an order number alone reveals nothing.
  const order = await Order.findOne({
    orderNumber: payload.orderNumber.toUpperCase(),
    email: payload.email.toLowerCase(),
  }).lean();

  if (!order) {
    return NextResponse.json(
      { error: "We could not find an order with those details." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      trackingCarrier: order.trackingCarrier ?? null,
      trackingNumber: order.trackingNumber ?? null,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
    },
    items: (order.items ?? []).map((item, index) => ({
      id: String(item._id ?? index),
      title: item.title,
      handle: item.handle,
      image: item.image ?? null,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  });
}
