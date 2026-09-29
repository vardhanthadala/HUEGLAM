import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "hg_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export type AdminSession = { id: number; email: string; name: string };

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

export async function createSession(session: AdminSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
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

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Returns the signed-in admin, or null. Never throws on a bad cookie. */
export async function getSession(): Promise<AdminSession | null> {
  // Bypass login completely for local development
  if (process.env.NODE_ENV === "development") {
    return { id: 1, email: "dev@hueglam.com", name: "Dev Admin" };
  }

  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.id !== "number" || typeof payload.email !== "string") {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : "Admin",
    };
  } catch {
    return null;
  }
}

/** Use at the top of every admin page and action. */
export async function requireSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
