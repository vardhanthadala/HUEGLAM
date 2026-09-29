import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | null = null;

function connect(): Database {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
    );
  }
  if (!instance) {
    instance = drizzle(neon(connectionString), { schema });
  }
  return instance;
}

/**
 * Connects on first use rather than on import. Routes that guard on
 * DATABASE_URL can then be imported during `next build` on a machine that has
 * no database configured, instead of failing page-data collection.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(connect(), prop, receiver);
  },
});

export { schema };
