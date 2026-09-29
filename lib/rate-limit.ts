import "server-only";
import { headers } from "next/headers";
import { connectDB } from "./mongodb";
import { LoginAttempt } from "@/models/LoginAttempt";

/**
 * Failed-login throttling.
 *
 * Two limits apply to every sign-in: one per account, so a single account
 * cannot be ground through a password list, and a looser one per IP, so an
 * attacker cannot sidestep the first by spreading attempts across many
 * usernames. Successful sign-in clears the account's counter.
 */

export type Limit = { max: number; windowSeconds: number };

export const ADMIN_EMAIL_LIMIT: Limit = { max: 5, windowSeconds: 15 * 60 };
export const ADMIN_IP_LIMIT: Limit = { max: 20, windowSeconds: 15 * 60 };
export const CUSTOMER_EMAIL_LIMIT: Limit = { max: 10, windowSeconds: 15 * 60 };
export const CUSTOMER_IP_LIMIT: Limit = { max: 40, windowSeconds: 15 * 60 };

/**
 * The caller's IP. Behind a proxy the left-most x-forwarded-for entry is the
 * client; it is spoofable in general, which is exactly why the per-account
 * limit above does not rely on it.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "unknown";
}

async function countSince(key: string, windowSeconds: number): Promise<number> {
  const since = new Date(Date.now() - windowSeconds * 1000);
  return LoginAttempt.countDocuments({ key, createdAt: { $gte: since } });
}

/**
 * How long the caller must wait, in seconds, or 0 when they may try now.
 * Fails open: if the throttle store is unreachable the sign-in form still
 * works, because locking every admin out of their own store over a database
 * blip is worse than the slower brute force it would prevent.
 */
export async function retryAfterSeconds(
  checks: { key: string; limit: Limit }[],
): Promise<number> {
  try {
    await connectDB();

    let wait = 0;
    for (const { key, limit } of checks) {
      const count = await countSince(key, limit.windowSeconds);
      if (count < limit.max) continue;

      // Unlocked once the oldest attempt in the window ages out of it.
      const oldest = await LoginAttempt.findOne({
        key,
        createdAt: { $gte: new Date(Date.now() - limit.windowSeconds * 1000) },
      })
        .sort({ createdAt: 1 })
        .select({ createdAt: 1 })
        .lean();

      const freeAt = oldest
        ? oldest.createdAt.getTime() + limit.windowSeconds * 1000
        : Date.now() + limit.windowSeconds * 1000;

      wait = Math.max(wait, Math.ceil((freeAt - Date.now()) / 1000));
    }
    return wait;
  } catch (error) {
    console.error("[rate-limit] check failed, allowing attempt:", error);
    return 0;
  }
}

export async function recordFailure(keys: string[]): Promise<void> {
  try {
    await connectDB();
    await LoginAttempt.insertMany(keys.map((key) => ({ key })));
  } catch (error) {
    console.error("[rate-limit] could not record failure:", error);
  }
}

export async function clearFailures(keys: string[]): Promise<void> {
  try {
    await connectDB();
    await LoginAttempt.deleteMany({ key: { $in: keys } });
  } catch (error) {
    console.error("[rate-limit] could not clear failures:", error);
  }
}

/** "in 4 minutes" / "in 30 seconds", for the message shown on the form. */
export function describeWait(seconds: number): string {
  if (seconds >= 120) return "in " + Math.ceil(seconds / 60) + " minutes";
  if (seconds >= 60) return "in about a minute";
  return "in " + Math.max(seconds, 1) + " seconds";
}
