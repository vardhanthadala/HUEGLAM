import mongoose from "mongoose";
import dns from "dns";

// Windows local networks frequently fail on MongoDB SRV records (ECONNREFUSED querySrv).
// Setting reliable DNS servers ensures local development connects without hiccups.
try {
  dns.setDefaultResultOrder("ipv4first");
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in environments where setServers is restricted
}

/**
 * Cached across hot reloads so API routes do not open a new connection on
 * every request.
 *
 * The missing-env check lives inside connectDB rather than at module scope:
 * throwing on import would crash any page that merely imports a model, even
 * when that page has a fallback and never actually needs the database.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = global as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalForMongoose.mongoose ?? {
  conn: null,
  promise: null,
};
globalForMongoose.mongoose = cached;

/** True when a connection string is configured. */
export const mongoConfigured = Boolean(process.env.MONGODB_URI);

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local before using the admin portal.",
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
