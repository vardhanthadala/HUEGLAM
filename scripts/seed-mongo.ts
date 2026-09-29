import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { Product } from "../models/Product";
import { seedProducts } from "../lib/products-seed";

async function main() {
  const mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl) throw new Error("MONGODB_URI is not set.");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUrl);

  console.log("Seeding Products into MongoDB...");
  await Product.deleteMany({});
  
  for (const p of seedProducts) {
    const pImages = p.images.map((i, idx) => ({
      src: i.src,
      alt: i.alt,
      width: i.width,
      height: i.height,
      position: idx + 1,
    }));
    
    await Product.create({
      handle: p.handle,
      title: p.title,
      vendor: "HUEGLAM",
      description: p.description,
      bodyHtml: p.bodyHtml,
      sku: p.sku || undefined,
      price: p.price,
      compareAtPrice: p.compareAtPrice || undefined,
      grams: p.grams,
      tags: p.tags,
      inventory: p.inventory,
      trackInventory: true,
      available: true,
      published: true,
      position: p.position,
      images: pImages,
    });
  }
  console.log(`Seeded ${seedProducts.length} products to MongoDB!`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
