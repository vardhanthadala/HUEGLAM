import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { ProductFormShell } from "@/components/admin/ProductFormShell";
import { ProductFields } from "@/components/admin/ProductFields";
import { getAdminProduct } from "@/lib/admin-products";
import { saveProduct } from "../actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return (
    <AdminShell session={session} active="/admin/products">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
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
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-xl font-bold text-ink">{product.title}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                product.published
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  product.published ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              {product.published ? "Live" : "Draft"}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            Edit product information, update stock units, or modify pricing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={"/products/" + product.handle}
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-ground transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View on Storefront
          </Link>
        </div>
      </div>

      <ProductFormShell action={saveProduct} submitLabel="Save Changes" isEdit={true}>
        <ProductFields product={product} />
      </ProductFormShell>
    </AdminShell>
  );
}
