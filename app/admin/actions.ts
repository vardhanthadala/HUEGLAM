"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminUsers, orders, products } from "@/lib/db/schema";
import { createSession, destroySession, requireSession } from "@/lib/auth";
import { rupeesToPaise } from "@/lib/money";

export type ActionState = { error?: string; ok?: string };

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!process.env.DATABASE_URL) {
    return { error: "DATABASE_URL is not set. Configure the database first." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const found = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, parsed.data.email.toLowerCase()));

  const user = found[0];
  // Compare against a dummy hash when the user is missing so a wrong email and
  // a wrong password take the same time to answer.
  const hash =
    user?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const valid = await bcrypt.compare(parsed.data.password, hash);

  if (!user || !valid) {
    return { error: "Those details do not match an admin account." };
  }

  await createSession({ id: user.id, email: user.email, name: user.name });
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "failed"];

export async function updateOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(id) || !ORDER_STATUSES.includes(status)) {
    return { error: "Invalid order update." };
  }

  await db
    .update(orders)
    .set({
      status,
      trackingCarrier: String(formData.get("trackingCarrier") ?? "").trim() || null,
      trackingNumber: String(formData.get("trackingNumber") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  revalidatePath("/admin");
  revalidatePath("/admin/orders/" + id);
  return { ok: "Order updated." };
}

const productSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().trim().min(2).max(300),
  price: z.coerce.number().min(0).max(1000000),
  compareAtPrice: z.string().trim(),
  inventory: z.coerce.number().int().min(0).max(100000),
  sku: z.string().trim().max(60),
  description: z.string().trim().max(1000),
  published: z.string().optional(),
  trackInventory: z.string().optional(),
});

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();

  const parsed = productSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") ?? "",
    inventory: formData.get("inventory"),
    sku: formData.get("sku") ?? "",
    description: formData.get("description") ?? "",
    published: formData.get("published") ?? undefined,
    trackInventory: formData.get("trackInventory") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the values and try again." };
  }

  const data = parsed.data;
  const compareAt = data.compareAtPrice === "" ? null : rupeesToPaise(data.compareAtPrice);
  const price = rupeesToPaise(data.price);

  if (compareAt !== null && compareAt <= price) {
    return { error: "Compare-at price must be higher than the selling price, or left blank." };
  }

  await db
    .update(products)
    .set({
      title: data.title,
      price,
      compareAtPrice: compareAt,
      inventory: data.inventory,
      sku: data.sku || null,
      description: data.description,
      published: data.published === "on",
      trackInventory: data.trackInventory === "on",
      updatedAt: new Date(),
    })
    .where(eq(products.id, data.id));

  // Storefront pages are cached, so push the change out immediately.
  revalidatePath("/");
  revalidatePath("/collections/all");
  revalidatePath("/search");
  // Every product detail page, since related-product rails show other items too.
  revalidatePath("/products/[handle]", "page");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/" + data.id);

  return { ok: "Saved." };
}
