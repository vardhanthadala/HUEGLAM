/**
 * CLI script to create, list, or reset admin credentials safely.
 *
 * Usage:
 *   npx tsx scripts/admin.ts create <email> <password> [name]
 *   npx tsx scripts/admin.ts reset <email> <newPassword>
 *   npx tsx scripts/admin.ts list
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { AdminUser } from "../models/AdminUser";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  if (!command || !["create", "reset", "delete", "list"].includes(command)) {
    console.log(`
HUEGLAM Admin Management CLI
============================
Usage:
  npx tsx scripts/admin.ts create <email> <password> [name]
  npx tsx scripts/admin.ts reset <email> <newPassword>
  npx tsx scripts/admin.ts delete <email>
  npx tsx scripts/admin.ts list

Examples:
  npx tsx scripts/admin.ts create admin@hueglam.com MySecurePassword123 "Main Admin"
  npx tsx scripts/admin.ts reset admin@hueglam.com NewPassword456!
  npx tsx scripts/admin.ts delete you@hueglam.com
  npx tsx scripts/admin.ts list
`);
    process.exit(0);
  }

  await mongoose.connect(uri);

  try {
    if (command === "list") {
      const admins = await AdminUser.find().select("email name createdAt").lean();
      console.log("\nRegistered Admins:");
      console.log("-------------------");
      if (admins.length === 0) {
        console.log("No admin accounts found in database.");
      } else {
        admins.forEach((a, i) => {
          console.log(`${i + 1}. ${a.email} (${a.name}) - Created: ${new Date(a.createdAt).toLocaleDateString()}`);
        });
      }
      console.log("");
    } else if (command === "create") {
      const email = args[1]?.trim().toLowerCase();
      const password = args[2];
      const name = args[3] || "Administrator";

      if (!email || !password) {
        console.error("❌ Email and password are required. Example: npx tsx scripts/admin.ts create admin@hueglam.com Pass123");
        process.exit(1);
      }

      if (password.length < 8) {
        console.error("❌ Password must be at least 8 characters long for security.");
        process.exit(1);
      }

      const existing = await AdminUser.findOne({ email });
      if (existing) {
        console.error(`❌ Admin with email '${email}' already exists. Use 'reset' command to change their password.`);
        process.exit(1);
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await AdminUser.create({
        email,
        name,
        passwordHash,
      });

      console.log(`\n✅ Admin account created successfully!`);
      console.log(`   Email: ${email}`);
      console.log(`   Name:  ${name}`);
      console.log(`   You can now sign in at /admin/login\n`);
    } else if (command === "reset") {
      const email = args[1]?.trim().toLowerCase();
      const newPassword = args[2];

      if (!email || !newPassword) {
        console.error("❌ Email and new password are required. Example: npx tsx scripts/admin.ts reset admin@hueglam.com NewPass123");
        process.exit(1);
      }

      if (newPassword.length < 8) {
        console.error("❌ Password must be at least 8 characters long for security.");
        process.exit(1);
      }

      const user = await AdminUser.findOne({ email });
      if (!user) {
        console.error(`❌ No admin account found with email '${email}'.`);
        process.exit(1);
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      user.passwordHash = passwordHash;
      await user.save();

      console.log(`\n✅ Password successfully updated for '${email}'!`);
      console.log(`   You can now sign in with the new password at /admin/login\n`);
    } else if (command === "delete") {
      const email = args[1]?.trim().toLowerCase();

      if (!email) {
        console.error("❌ Email is required. Example: npx tsx scripts/admin.ts delete you@hueglam.com");
        process.exit(1);
      }

      const totalAdmins = await AdminUser.countDocuments();
      if (totalAdmins <= 1) {
        console.error("❌ Cannot delete the only remaining admin account in the database.");
        process.exit(1);
      }

      const deleted = await AdminUser.findOneAndDelete({ email });
      if (!deleted) {
        console.error(`❌ No admin account found with email '${email}'.`);
        process.exit(1);
      }

      console.log(`\n✅ Admin account '${email}' has been permanently deleted.\n`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
