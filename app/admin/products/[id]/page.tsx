import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { ProductFormShell } from "@/components/admin/ProductFormShell";
import { ProductFields } from "@/components/admin/ProductFields";
import { getAdminProduct } from "@/lib/admin-products";
import { saveProduct, deleteProduct } from "../actions";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return (
    <AdminShell session={session} active="/admin/products">
      <Link
        href="/admin/products"
        className="text-[0.8125rem] text-ink-soft hover:text-ink"
      >
        &larr; Products
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[1.375rem] text-ink">{product.title}</h1>
        <div className="flex items-center gap-4">
          <Link
            href={"/products/" + product.handle}
            className="text-[0.8125rem] text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            View on store
          </Link>
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button
              type="submit"
              className="text-[0.8125rem] text-ink-faint underline underline-offset-4 hover:text-sale-ink"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <ProductFormShell action={saveProduct} submitLabel="Save changes">
        <ProductFields product={product} />
      </ProductFormShell>
    </AdminShell>
  );
}
