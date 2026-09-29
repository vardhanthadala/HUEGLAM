import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { Product } from "@/models/Product";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    await requireSession();
    const formData = await request.formData();
    const id = formData.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    await connectDB();
    await Product.findByIdAndDelete(id);

    revalidatePath("/", "layout");
    revalidatePath("/admin/products");

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
