import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { ProductFormShell } from "@/components/admin/ProductFormShell";
import { ProductFields } from "@/components/admin/ProductFields";
import { saveProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireSession();

  return (
    <AdminShell session={session} active="/admin/products">
      <Link
        href="/admin/products"
        className="text-[0.8125rem] text-ink-soft hover:text-ink"
      >
        &larr; Products
      </Link>
      <h1 className="mt-3 mb-6 text-[1.375rem] text-ink">New product</h1>

      <ProductFormShell action={saveProduct} submitLabel="Create product">
        <ProductFields />
      </ProductFormShell>
    </AdminShell>
  );
}
