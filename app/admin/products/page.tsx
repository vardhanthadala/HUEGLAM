import { requireSession } from "@/lib/auth";
import { AdminShell, Notice } from "@/components/AdminShell";
import { listAdminProducts } from "@/lib/admin-products";
import { ProductsListManager } from "@/components/admin/ProductsListManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await requireSession();
  const products = await listAdminProducts();

  return (
    <AdminShell
      session={session}
      active="/admin/products"
      title="Products"
      description="Manage your product inventory, pricing, and showcase."
    >
      {!process.env.MONGODB_URI && (
        <Notice>
          <strong className="font-medium">MONGODB_URI is not set.</strong> Add it to{" "}
          <code>.env.local</code> and restart the dev server.
        </Notice>
      )}

      <ProductsListManager products={products} />
    </AdminShell>
  );
}
