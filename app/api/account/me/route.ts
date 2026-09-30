import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectDB, mongoConfigured } from "@/lib/mongodb";
import { Customer } from "@/models/Customer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in customer with their saved address. Used to prefill checkout. */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ customer: null });

  let customerDoc = null;
  if (mongoConfigured) {
    try {
      await connectDB();
      customerDoc = await Customer.findById(session.id).lean();
    } catch {
      // Fallback to session
    }
  }

  return NextResponse.json({
    customer: {
      id: session.id,
      email: session.email,
      name: customerDoc?.name || session.name,
      phone: customerDoc?.phone || "",
      addressLine1: customerDoc?.addressLine1 || "",
      addressLine2: customerDoc?.addressLine2 || "",
      city: customerDoc?.city || "",
      state: customerDoc?.state || "Telangana",
      pincode: customerDoc?.pincode || "",
      country: customerDoc?.country || "India",
    },
  });
}
