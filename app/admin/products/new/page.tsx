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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Products
          </Link>
          <h1 className="mt-2 text-xl font-bold text-ink">Add New Product</h1>
          <p className="mt-0.5 text-xs text-ink-faint">
            Create a new skincare product for your online store.
          </p>
        </div>
      </div>

      <ProductFormShell action={saveProduct} submitLabel="Publish Product" isEdit={false}>
        <ProductFields />
      </ProductFormShell>
    </AdminShell>
  );
}
