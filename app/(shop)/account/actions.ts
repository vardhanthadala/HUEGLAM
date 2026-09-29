"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import {
  createCustomerSession,
  destroyCustomerSession,
} from "@/lib/customer-auth";

export type AuthState = { error?: string; ok?: boolean };

/** Cost 12 everywhere, and a dummy hash so a missing account costs the same
 *  time as a wrong password. */
const BCRYPT_COST = 12;
const DUMMY_HASH = "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";

const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

function configured(): string | null {
  if (!process.env.DATABASE_URL) {
    return "Accounts are not available yet. The store database is not configured.";
  }
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    return "Accounts are not available yet. AUTH_SECRET is not configured.";
  }
  return null;
}

export async function customerLoginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const problem = configured();
  if (problem) return { error: problem };

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const found = await db
    .select()
    .from(customers)
    .where(eq(customers.email, parsed.data.email.toLowerCase()));

  const user = found[0];
  const valid = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  // Same message either way: never reveal whether an email is registered.
  if (!user || !valid) {
    return { error: "Those details do not match an account." };
  }

  await createCustomerSession({
    id: user.id,
    email: user.email,
    name: user.name,
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function customerRegisterAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const problem = configured();
  if (problem) return { error: problem };

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.email, email));

  if (existing.length > 0) {
    return { error: "An account with that email already exists. Try signing in." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);
  const inserted = await db
    .insert(customers)
    .values({ email, passwordHash, name: parsed.data.name })
    .returning({ id: customers.id });

  await createCustomerSession({
    id: inserted[0].id,
    email,
    name: parsed.data.name,
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function customerLogoutAction() {
  await destroyCustomerSession();
  revalidatePath("/account");
}
