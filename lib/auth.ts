import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

/**
 * Admin sessions.
 *
 * Separate from lib/customer-auth.ts by cookie name *and* audience claim, so a
 * customer token is rejected here even though both are signed with AUTH_SECRET.
 * There is deliberately no development bypass: an admin panel that trusts
 * NODE_ENV is one misconfigured deploy away from being wide open.
 */

const COOKIE_NAME = "hg_admin";
const AUDIENCE = "hueglam:admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type AdminSession = { id: string; email: string; name: string };

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Generate one with:\n" +
        '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(session: AdminSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    // strict rather than lax: nothing should ever navigate into the admin from
    // another site carrying this cookie.
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** The signed-in admin, or null. Never throws on a bad or absent cookie. */
export async function getSession(): Promise<AdminSession | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secretKey(), {
      audience: AUDIENCE,
    });

    if (typeof payload.id !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "Admin",
    };
  } catch (err) {
    console.error("[AUTH DEBUG] getSession failed:", err);
    return null;
  }
}

/** Use at the top of every admin page and action. */
export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
