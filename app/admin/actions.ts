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
  console.log("[LOGIN DEBUG] email:", email, "userFound:", !!user);

  const valid = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  console.log("[LOGIN DEBUG] passwordValid:", valid);

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

const cancelOrderSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  reason: z.string().trim().min(1, "Please specify a cancellation reason").max(500),
  restock: z.enum(["true", "false"]).optional(),
});

export async function cancelOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const parsed = cancelOrderSchema.safeParse({
    id: formData.get("id"),
    reason: formData.get("reason"),
    restock: formData.get("restock") ?? "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid cancellation request." };
  }

  try {
    await connectDB();
    const order = await Order.findById(parsed.data.id);
    if (!order) return { error: "Order not found." };

    if (order.status === "cancelled") {
      return { error: "This order is already cancelled." };
    }

    const previousStatus = order.status;
    const shouldRestock = parsed.data.restock !== "false";

    // 1. Restock products if requested and order had reduced stock
    if (shouldRestock && ["paid", "shipped", "delivered"].includes(previousStatus)) {
      const { Product } = await import("@/models/Product");
      for (const item of order.items) {
        if (!item.productId) continue;
        try {
          await Product.updateOne(
            { _id: item.productId, trackInventory: true },
            { $inc: { inventory: item.quantity } },
          );
        } catch (stockErr) {
          console.error("[cancel] Failed to restock product " + item.productId, stockErr);
        }
      }
    }

    // 2. Adjust customer lifetime spend if previous status was paid/shipped/delivered
    if (["paid", "shipped", "delivered"].includes(previousStatus)) {
      try {
        const { Customer } = await import("@/models/Customer");
        const filter = order.customerId
          ? { _id: order.customerId }
          : { email: order.email.toLowerCase() };

        await Customer.updateOne(filter, [
          {
            $set: {
              totalSpent: {
                $max: [0, { $subtract: ["$totalSpent", order.total] }],
              },
            },
          },
        ]);
      } catch (custErr) {
        console.error("[cancel] Failed to adjust customer totalSpent:", custErr);
      }
    }

    // 3. Update order document with status "cancelled" and reason
    order.status = "cancelled";
    order.cancelledAt = new Date();
    order.cancelReason = parsed.data.reason;
    const adminNote = `[CANCELLED by admin on ${new Date().toLocaleString("en-IN")}]: ${parsed.data.reason}`;
    order.notes = order.notes ? `${order.notes}\n\n${adminNote}` : adminNote;
    await order.save();

    // 4. Send cancellation notification email to customer
    try {
      const { sendOrderCancellation } = await import("@/lib/mail");
      const { getOrderById } = await import("@/lib/queries");
      const storeOrder = await getOrderById(order._id.toString());
      if (storeOrder) {
        await sendOrderCancellation(storeOrder, parsed.data.reason);
      }
    } catch (mailErr) {
      console.error("[cancel] Failed to send cancellation email:", mailErr);
    }
  } catch (error) {
    console.error("[admin] cancel order failed:", error);
    return { error: "Failed to cancel order. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/" + parsed.data.id);
  revalidatePath("/admin/customers");
  return { ok: "Order successfully cancelled and inventory updated." };
}

const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(30)
    .toUpperCase(),
  type: z.enum(["percent", "fixed"]),
  value: z.coerce.number().positive("Value must be greater than 0"),
  minSubtotal: z.coerce.number().min(0).default(0),
  usageLimit: z.string().optional(),
  expiresAt: z.string().optional(),
});

export async function createCouponAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const parsed = createCouponSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minSubtotal: formData.get("minSubtotal"),
    usageLimit: formData.get("usageLimit") ?? "",
    expiresAt: formData.get("expiresAt") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid coupon details." };
  }

  const { code, type, value, minSubtotal, usageLimit, expiresAt } = parsed.data;

  // Percentage validation
  if (type === "percent" && value > 100) {
    return { error: "Percentage discount cannot exceed 100%." };
  }

  // Convert fixed rupees to integer paise for consistency with pricing engine
  const storedValue = type === "fixed" ? Math.round(value * 100) : Math.round(value);
  const storedMinSubtotal = Math.round(minSubtotal * 100);

  try {
    await connectDB();
    const { Coupon } = await import("@/models/Coupon");

    const existing = await Coupon.findOne({ code });
    if (existing) {
      return { error: "A coupon with code " + code + " already exists." };
    }

    await Coupon.create({
      code,
      type,
      value: storedValue,
      minSubtotal: storedMinSubtotal,
      active: true,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
  } catch (err) {
    console.error("[admin] createCouponAction failed:", err);
    return { error: "Could not create coupon. Please try again." };
  }

  revalidatePath("/admin/coupons");
  return { ok: "Coupon " + code + " created successfully." };
}

export async function toggleCouponAction(id: string, active: boolean) {
  await requireSession();
  try {
    await connectDB();
    const { Coupon } = await import("@/models/Coupon");
    await Coupon.findByIdAndUpdate(id, { $set: { active } });
    revalidatePath("/admin/coupons");
  } catch (err) {
    console.error("[admin] toggleCouponAction failed:", err);
  }
}

export async function deleteCouponAction(id: string) {
  await requireSession();
  try {
    await connectDB();
    const { Coupon } = await import("@/models/Coupon");
    await Coupon.findByIdAndDelete(id);
    revalidatePath("/admin/coupons");
  } catch (err) {
    console.error("[admin] deleteCouponAction failed:", err);
  }
}

const updateCredentialsSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.email("Enter a valid email address"),
  newPassword: z.string().optional(),
});

export async function updateAdminCredentialsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const parsed = updateCredentialsSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    name: formData.get("name"),
    email: formData.get("email"),
    newPassword: formData.get("newPassword") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input." };
  }

  const { currentPassword, name, email, newPassword } = parsed.data;

  if (newPassword && newPassword.length < 8) {
    return { error: "New password must be at least 8 characters long." };
  }

  try {
    await connectDB();
    const user = await AdminUser.findById(session.id);
    if (!user) {
      return { error: "Admin account not found." };
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: "Current password is incorrect." };
    }

    // Check if new email is taken by another admin
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await AdminUser.findOne({
        email: email.toLowerCase(),
        _id: { $ne: user._id },
      });
      if (emailTaken) {
        return { error: "Another account is already using that email address." };
      }
      user.email = email.toLowerCase();
    }

    user.name = name;

    if (newPassword) {
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    // Re-issue session with updated email/name
    await createSession({
      id: String(user._id),
      email: user.email,
      name: user.name,
    });

    revalidatePath("/admin");
    return { ok: "Profile & credentials updated successfully!" };
  } catch (err) {
    console.error("[admin] updateAdminCredentialsAction error:", err);
    return { error: "Could not update credentials. Please try again." };
  }
}

export async function requestAdminPasswordResetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  try {
    await connectDB();
    const admin = await AdminUser.findOne({ email });

    // For security, even if the account does not exist, return a generic success message so emails cannot be enumerated.
    if (!admin) {
      return { ok: "If an admin account exists for that email, a password reset link has been sent." };
    }

    // Generate cryptographic token
    const crypto = await import("node:crypto");
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const { PasswordResetToken } = await import("@/models/PasswordResetToken");
    // Clear any previous reset tokens for this email
    await PasswordResetToken.deleteMany({ email });
    await PasswordResetToken.create({
      email,
      tokenHash,
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

    const { sendAdminPasswordReset } = await import("@/lib/mail");
    await sendAdminPasswordReset(email, resetUrl);

    return { ok: "If an admin account exists for that email, a password reset link has been sent." };
  } catch (err) {
    console.error("[admin] requestAdminPasswordResetAction failed:", err);
    return { error: "Could not send reset link. Please try again." };
  }
}

export async function resetAdminPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") || "").trim();
  const newPassword = String(formData.get("newPassword") || "").trim();
  const confirmPassword = String(formData.get("confirmPassword") || "").trim();

  if (!token) {
    return { error: "Invalid or expired password reset link." };
  }

  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    await connectDB();
    const crypto = await import("node:crypto");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const { PasswordResetToken } = await import("@/models/PasswordResetToken");
    const record = await PasswordResetToken.findOne({ tokenHash });

    if (!record) {
      return { error: "This password reset link has expired or has already been used." };
    }

    const admin = await AdminUser.findOne({ email: record.email });
    if (!admin) {
      return { error: "No admin account found for this reset request." };
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await admin.save();

    // Consume the token so it cannot be used again
    await PasswordResetToken.deleteMany({ email: record.email });

    return { ok: "Password successfully changed! You can now sign in with your new password." };
  } catch (err) {
    console.error("[admin] resetAdminPasswordAction failed:", err);
    return { error: "Could not reset password. Please try again." };
  }
}



