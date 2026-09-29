import Image from "next/image";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import {
  AdminShell,
  EmptyState,
  Notice,
  Panel,
  PrimaryLink,
} from "@/components/AdminShell";
import { listAdminProducts } from "@/lib/admin-products";
import { formatINR } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await requireSession();
  const products = await listAdminProducts();

  return (
    <AdminShell
      session={session}
      active="/admin/products"
      title="Products"
      description={
        products.length +
        (products.length === 1 ? " product" : " products") +
        " in the catalogue"
      }
      actions={<PrimaryLink href="/admin/products/new">Add product</PrimaryLink>}
    >
      {!process.env.MONGODB_URI && (
        <Notice>
          <strong className="font-medium">MONGODB_URI is not set.</strong> Add it to{" "}
          <code>.env.local</code> and restart the dev server.
        </Notice>
      )}

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first product, or run the seed script to import the existing catalogue."
        >
          <PrimaryLink href="/admin/products/new">Add product</PrimaryLink>
        </EmptyState>
      ) : (
        <Panel bodyClassName="">
          <table className="w-full text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-[#f1f2f6] text-[0.75rem] text-[#9aa0ab]">
                <th className="px-5 py-3 font-normal">Product</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 text-right font-normal">Price</th>
                <th className="px-5 py-3 text-right font-normal">Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-[#f6f7f9] last:border-0 transition-colors hover:bg-[#fbfcfd]"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={"/admin/products/" + product.id}
                      className="flex items-center gap-3.5"
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-[6px] bg-[#f1f2f6]">
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
                      <span className="min-w-0">
                        <span className="block truncate text-ink">{product.title}</span>
                        <span className="mt-0.5 block text-[0.75rem] text-[#9aa0ab]">
                          {product.sku || product.handle}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] " +
                        (product.published
                          ? "bg-[#edf7f0] text-[#3f7a4f]"
                          : "bg-[#f1f2f6] text-[#9aa0ab]")
                      }
                    >
                      <span
                        className={
                          "size-1.5 rounded-full " +
                          (product.published ? "bg-[#5a8a63]" : "bg-[#bdbdb7]")
                        }
                      />
                      {product.published ? "Active" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-ink">{formatINR(product.price)}</span>
                    {product.compareAtPrice && (
                      <span className="mt-0.5 block text-[0.75rem] text-[#b6bcc6] line-through">
                        {formatINR(product.compareAtPrice)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {product.trackInventory ? (
                      <span
                        className={
                          product.inventory <= 5 ? "text-[#9c4d33]" : "text-ink"
                        }
                      >
                        {product.inventory}
                      </span>
                    ) : (
                      <span className="text-[#b6bcc6]">&infin;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </AdminShell>
  );
}
