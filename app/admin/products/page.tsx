import Image from "next/image";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getAllProductsForAdmin } from "@/lib/queries";
import { AdminShell } from "@/components/AdminShell";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await requireSession();
  const products = await getAllProductsForAdmin();

  return (
    <AdminShell session={session} active="/admin/products">
      <h1 className="text-xl font-light tracking-tight">Products</h1>
      <p className="mt-2 text-[0.8125rem] text-ink-soft">
        Prices and stock update the storefront immediately.
      </p>

      <div className="mt-8 overflow-x-auto border border-line bg-ground">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="eyebrow px-4 py-3 font-normal">Product</th>
              <th className="eyebrow px-4 py-3 font-normal">SKU</th>
              <th className="eyebrow px-4 py-3 text-right font-normal">Price</th>
              <th className="eyebrow px-4 py-3 text-right font-normal">Stock</th>
              <th className="eyebrow px-4 py-3 font-normal">Live</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-line last:border-0 hover:bg-ground-alt">
                <td className="px-4 py-3">
                  <Link href={"/admin/products/" + product.id} className="flex items-center gap-3">
                    <span className="relative h-14 w-11 shrink-0 overflow-hidden bg-ground-alt">
                      {product.images[0] && (
                        <Image
                          src={product.images[0].src}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="max-w-xs text-[0.75rem] tracking-[0.04em] uppercase underline underline-offset-2">
                      {product.title}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-ink-soft">{product.sku ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-medium">{formatINR(product.price)}</span>
                  {product.compareAtPrice && (
                    <span className="block text-xs text-ink-faint line-through">
                      {formatINR(product.compareAtPrice)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {product.trackInventory ? (
                    <span className={product.inventory <= 5 ? "text-sale-ink" : ""}>
                      {product.inventory}
                    </span>
                  ) : (
                    <span className="text-ink-faint">&infin;</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {product.published ? "Yes" : <span className="text-ink-faint">Hidden</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
