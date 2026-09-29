import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../lib/db/schema";
import mongoose from "mongoose";

// Mongoose Models
import { Product } from "../models/Product";
import { Coupon } from "../models/Coupon";
import { AdminUser } from "../models/AdminUser";
import { Customer } from "../models/Customer";
import { Order } from "../models/Order";

async function main() {
  const pgUrl = process.env.DATABASE_URL;
  if (!pgUrl) throw new Error("DATABASE_URL is not set.");
  const mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl) throw new Error("MONGODB_URI is not set.");

  console.log("Connecting to PostgreSQL...");
  const db = drizzle(neon(pgUrl), { schema });

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUrl);

  console.log("Migrating Products...");
  const pgProducts = await db.select().from(schema.products);
  const pgImages = await db.select().from(schema.productImages);
  
  await Product.deleteMany({});
  for (const p of pgProducts) {
    const pImages = pgImages
      .filter((i) => i.productId === p.id)
      .map((i) => ({
        src: i.src,
        alt: i.alt,
        width: i.width,
        height: i.height,
        position: i.position,
      }));
    
    await Product.create({
      handle: p.handle,
      title: p.title,
      vendor: p.vendor,
      description: p.description,
      bodyHtml: p.bodyHtml,
      sku: p.sku || undefined,
      price: p.price,
      compareAtPrice: p.compareAtPrice || undefined,
      grams: p.grams,
      tags: p.tags,
      inventory: p.inventory,
      trackInventory: p.trackInventory,
      available: p.available,
      published: p.published,
      position: p.position,
      images: pImages,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }
  console.log(`Migrated ${pgProducts.length} products.`);

  console.log("Migrating Coupons...");
  const pgCoupons = await db.select().from(schema.coupons);
  await Coupon.deleteMany({});
  for (const c of pgCoupons) {
    await Coupon.create({
      code: c.code,
      type: c.type,
      value: c.value,
      minSubtotal: c.minSubtotal,
      active: c.active,
      usageLimit: c.usageLimit || undefined,
      usageCount: c.usageCount,
      expiresAt: c.expiresAt || undefined,
      createdAt: c.createdAt,
    });
  }
  console.log(`Migrated ${pgCoupons.length} coupons.`);

  console.log("Migrating Admin Users...");
  const pgAdmins = await db.select().from(schema.adminUsers);
  await AdminUser.deleteMany({});
  for (const a of pgAdmins) {
    await AdminUser.create({
      email: a.email,
      passwordHash: a.passwordHash,
      name: a.name,
      createdAt: a.createdAt,
    });
  }
  console.log(`Migrated ${pgAdmins.length} admins.`);

  console.log("Migrating Customers...");
  const pgCustomers = await db.select().from(schema.customers);
  await Customer.deleteMany({});
  for (const c of pgCustomers) {
    await Customer.create({
      email: c.email,
      passwordHash: c.passwordHash,
      name: c.name,
      phone: c.phone || undefined,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    });
  }
  console.log(`Migrated ${pgCustomers.length} customers.`);

  console.log("All migrations complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
