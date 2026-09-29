import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../lib/db/schema";
import { seedProducts } from "../lib/products-seed";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local first.");

  const db = drizzle(neon(url), { schema });

  for (const p of seedProducts) {
    const existing = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.handle, p.handle));

    const row = {
      handle: p.handle,
      title: p.title,
      vendor: "HUEGLAM",
      description: p.description,
      bodyHtml: p.bodyHtml,
      sku: p.sku,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      grams: p.grams,
      tags: p.tags,
      inventory: p.inventory,
      position: p.position,
      available: true,
      published: true,
      updatedAt: new Date(),
    };

    let productId: number;
    if (existing.length > 0) {
      productId = existing[0].id;
      await db.update(schema.products).set(row).where(eq(schema.products.id, productId));
      await db
        .delete(schema.productImages)
        .where(eq(schema.productImages.productId, productId));
      console.log("updated  " + p.handle);
    } else {
      const inserted = await db
        .insert(schema.products)
        .values(row)
        .returning({ id: schema.products.id });
      productId = inserted[0].id;
      console.log("inserted " + p.handle);
    }

    await db.insert(schema.productImages).values(
      p.images.map((img, i) => ({
        productId,
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
        position: i + 1,
      })),
    );
  }

  // Bootstrap the admin account from env, if provided.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existingAdmin = await db
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, adminEmail.toLowerCase()));

    const passwordHash = await bcrypt.hash(adminPassword, 12);
    if (existingAdmin.length > 0) {
      await db
        .update(schema.adminUsers)
        .set({ passwordHash })
        .where(eq(schema.adminUsers.id, existingAdmin[0].id));
      console.log("admin password reset for " + adminEmail);
    } else {
      await db
        .insert(schema.adminUsers)
        .values({ email: adminEmail.toLowerCase(), passwordHash, name: "HUEGLAM Admin" });
      console.log("admin created " + adminEmail);
    }
  } else {
    console.log("skipped admin bootstrap (set ADMIN_EMAIL and ADMIN_PASSWORD)");
  }

  console.log("seed complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
