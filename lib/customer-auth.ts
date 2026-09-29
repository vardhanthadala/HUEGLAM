import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Storefront customer sessions.
 *
 * Deliberately separate from lib/auth.ts: a different cookie name and a
 * different audience claim, so a customer token can never be accepted by the
 * admin panel (or the reverse) even though both are signed with AUTH_SECRET.
 */

const COOKIE_NAME = "hg_customer";
const AUDIENCE = "hueglam:customer";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type CustomerSession = { id: number; email: string; name: string };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Generate one with:\n" +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createCustomerSession(session: CustomerSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroyCustomerSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Returns the signed-in customer, or null. Never throws on a bad cookie. */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secretKey(), {
      audience: AUDIENCE,
    });
    if (typeof payload.id !== "number" || typeof payload.email !== "string") {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}
