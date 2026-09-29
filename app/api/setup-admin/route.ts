import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AdminUser } from "@/models/AdminUser";

export async function GET() {
  try {
    await connectDB();
    const correctHash = "$2b$10$1WUDeXJPDWZiGrpW0faX.eySeZZPCYrmlFUI05w8/sFPE9NWz2UF2";
    
    const existing = await AdminUser.findOne({ email: "you@hueglam.com" });
    if (!existing) {
      await AdminUser.create({
        email: "you@hueglam.com",
        name: "Admin",
        passwordHash: correctHash,
      });
      return NextResponse.json({ success: true, message: "Admin user created successfully!" });
    } else {
      existing.passwordHash = correctHash;
      await existing.save();
      return NextResponse.json({ success: true, message: "Admin user hash updated successfully!" });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
