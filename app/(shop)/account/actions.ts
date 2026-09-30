"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB, mongoConfigured } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";
import {
  createCustomerSession,
  destroyCustomerSession,
} from "@/lib/customer-auth";
import {
  CUSTOMER_EMAIL_LIMIT,
  CUSTOMER_IP_LIMIT,
  clearFailures,
  clientIp,
  describeWait,
  recordFailure,
  retryAfterSeconds,
} from "@/lib/rate-limit";

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
  phone: z.string().trim().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

function configured(): string | null {
  if (!mongoConfigured) {
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

  const email = parsed.data.email.toLowerCase();
  const ip = await clientIp();
  const emailKey = "customer:email:" + email;
  const ipKey = "customer:ip:" + ip;

  const wait = await retryAfterSeconds([
    { key: emailKey, limit: CUSTOMER_EMAIL_LIMIT },
    { key: ipKey, limit: CUSTOMER_IP_LIMIT },
  ]);
  if (wait > 0) {
    return {
      error: "Too many failed attempts. Try again " + describeWait(wait) + ".",
    };
  }

  await connectDB();
  const user = await Customer.findOne({ email }).lean();

  const valid = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  // Same message either way: never reveal whether an email is registered.
  if (!user || !valid) {
    await recordFailure([emailKey, ipKey]);
    return { error: "Those details do not match an account." };
  }

  await clearFailures([emailKey]);
  await createCustomerSession({
    id: String(user._id),
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
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const email = parsed.data.email.toLowerCase();
  await connectDB();

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_COST);

  let created;
  try {
    created = await Customer.create({
      email,
      passwordHash,
      name: parsed.data.name,
      phone: parsed.data.phone || "",
    });
  } catch (error) {
    // The unique index on email is what actually prevents duplicates; checking
    // first and inserting after would leave a race between the two.
    if ((error as { code?: number })?.code === 11000) {
      return {
        error: "An account with that email already exists. Try signing in.",
      };
    }
    console.error("[account] registration failed:", error);
    return { error: "We could not create your account. Please try again." };
  }

  await createCustomerSession({
    id: String(created._id),
    email,
    name: parsed.data.name,
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function customerLogoutAction() {
  await destroyCustomerSession();
  revalidatePath("/");
  revalidatePath("/account");
  redirect("/");
}
