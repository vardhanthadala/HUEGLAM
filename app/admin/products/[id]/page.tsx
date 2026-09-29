import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getProductById } from "@/lib/queries";
import { AdminShell } from "@/components/AdminShell";
import { ProductForm } from "@/components/ProductForm";
import { paiseToRupees } from "@/lib/money";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminProductPage({ params }: PageProps) {
  const session = await requireSession();
  const { id } = await params;

  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const product = await getProductById(productId);
  if (!product) notFound();

  return (
    <AdminShell session={session} active="/admin/products">
      <Link
        href="/admin/products"
        className="text-[0.6875rem] tracking-[0.08em] uppercase text-ink-soft hover:text-ink"
      >
        &larr; All products
      </Link>

      <h1 className="mt-4 text-xl font-light tracking-tight">{product.title}</h1>
      <Link
        href={"/products/" + product.handle}
        className="mt-1 inline-block text-[0.6875rem] text-ink-faint underline underline-offset-2"
      >
        /products/{product.handle}
      </Link>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <section className="border border-line bg-ground p-5">
          <h2 className="eyebrow mb-3">Images</h2>
          <div className="grid grid-cols-3 gap-2">
            {product.images.map((img) => (
              <div key={img.id} className="relative aspect-4/5 overflow-hidden bg-ground-alt">
                <Image src={img.src} alt={img.alt} fill sizes="120px" className="object-cover" />
              </div>
            ))}
          </div>
          <p className="mt-4 text-[0.6875rem] leading-relaxed text-ink-faint">
            Images live in <code>public/products/</code> and are listed in{" "}
            <code>lib/products-seed.ts</code>. To swap one, drop the new file in that
            folder, update the entry, and run <code>npm run db:seed</code>.
          </p>
        </section>

        <section className="border border-line bg-ground p-5">
          <h2 className="eyebrow mb-4">Details</h2>
          <ProductForm
            id={product.id}
            title={product.title}
            price={paiseToRupees(product.price)}
            compareAtPrice={
              product.compareAtPrice === null ? "" : String(paiseToRupees(product.compareAtPrice))
            }
            inventory={product.inventory}
            sku={product.sku ?? ""}
            description={product.description}
            published={product.published}
            trackInventory={product.trackInventory}
          />
        </section>
      </div>
    </AdminShell>
  );
}
