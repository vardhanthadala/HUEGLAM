import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in customer, or null. Used to prefill checkout. */
export async function GET() {
  const customer = await getCustomerSession();
  if (!customer) return NextResponse.json({ customer: null });

  return NextResponse.json({
    customer: { email: customer.email, name: customer.name },
  });
}
