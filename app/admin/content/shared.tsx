import { connectDB } from "@/lib/mongodb";

/**
 * Runs a Mongo query for an admin content page. Returns an empty list when
 * MONGODB_URI is unset or the connection fails, so the admin still renders and
 * can explain what is missing instead of throwing.
 */
export async function loadContent<T>(run: () => Promise<T[]>): Promise<T[]> {
  if (!process.env.MONGODB_URI) return [];
  try {
    await connectDB();
    return await run();
  } catch (error) {
    console.error("[admin/content] query failed:", error);
    return [];
  }
}

/** Banner shown on every content page while MONGODB_URI is missing. */
export function MongoNotice() {
  if (process.env.MONGODB_URI) return null;

  return (
    <p className="mt-6 border border-sale-ink/30 bg-sale px-4 py-3 text-[0.8125rem] text-sale-ink">
      <strong>MONGODB_URI is not set.</strong> Add it to <code>.env.local</code> and
      restart the dev server. Until then the storefront shows its built-in
      content and nothing saved here will persist.
    </p>
  );
}
