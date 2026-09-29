import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import mongoose from "mongoose";
import { AdminUser } from "../models/AdminUser";

async function main() {
  const mongoUrl = process.env.MONGODB_URI;
  if (!mongoUrl) throw new Error("MONGODB_URI is not set.");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUrl);

  console.log("Fixing Admin User...");
  
  // Try to find the existing user
  let admin = await AdminUser.findOne({ email: "you@hueglam.com" });
  
  const correctHash = "$2b$10$1WUDeXJPDWZiGrpW0faX.eySeZZPCYrmlFUI05w8/sFPE9NWz2UF2";
  
  if (admin) {
    admin.passwordHash = correctHash;
    await admin.save();
    console.log("Updated existing admin user with the correct hash!");
  } else {
    // If they never managed to create it, create it now
    await AdminUser.create({
      email: "you@hueglam.com",
      name: "Admin",
      passwordHash: correctHash,
    });
    console.log("Created a new admin user with the correct hash!");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
