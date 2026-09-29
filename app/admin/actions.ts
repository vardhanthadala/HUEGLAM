"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB, mongoConfigured } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";
import { Order, ORDER_STATUSES } from "@/models/Order";
import { createSession, destroySession, requireSession } from "@/lib/auth";
import {
  ADMIN_EMAIL_LIMIT,
  ADMIN_IP_LIMIT,
  clearFailures,
  clientIp,
  describeWait,
  recordFailure,
  retryAfterSeconds,
} from "@/lib/rate-limit";

export type ActionState = { error?: string; ok?: string };

/** A bcrypt hash of a value nothing will match, so a missing account costs the
 *  same time as a wrong password. */
const DUMMY_HASH = "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(200),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!mongoConfigured) {
    return { error: "MONGODB_URI is not set. Configure the database first." };
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    return { error: "AUTH_SECRET is not configured. Sign-in is disabled." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  const emailKey = "admin:email:" + email;
  const ipKey = "admin:ip:" + ip;

  // Throttle before touching the password, so a locked account costs an
  // attacker a round trip and nothing else.
  const wait = await retryAfterSeconds([
    { key: emailKey, limit: ADMIN_EMAIL_LIMIT },
    { key: ipKey, limit: ADMIN_IP_LIMIT },
  ]);
  if (wait > 0) {
    return {
      error: "Too many failed attempts. Try again " + describeWait(wait) + ".",
    };
  }

  await connectDB();
  const user = await AdminUser.findOne({ email }).lean();

  const valid = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !valid) {
    await recordFailure([emailKey, ipKey]);
    // Same message either way: never reveal whether the account exists.
    return { error: "Those details do not match an admin account." };
  }

  await clearFailures([emailKey]);
  await createSession({
    id: String(user._id),
    email: user.email,
    name: user.name,
  });
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const orderSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  status: z.enum(ORDER_STATUSES),
  trackingCarrier: z.string().trim().max(100),
  trackingNumber: z.string().trim().max(100),
  notes: z.string().trim().max(2000),
});

export async function updateOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const parsed = orderSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    trackingCarrier: formData.get("trackingCarrier") ?? "",
    trackingNumber: formData.get("trackingNumber") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: "Invalid order update." };

  try {
    await connectDB();
    const updated = await Order.findByIdAndUpdate(parsed.data.id, {
      $set: {
        status: parsed.data.status,
        trackingCarrier: parsed.data.trackingCarrier || null,
        trackingNumber: parsed.data.trackingNumber || null,
        notes: parsed.data.notes || null,
      },
    });
    if (!updated) return { error: "That order no longer exists." };
  } catch (error) {
    console.error("[admin] order update failed:", error);
    return { error: "Could not save the order. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/" + parsed.data.id);
  return { ok: "Order updated." };
}
