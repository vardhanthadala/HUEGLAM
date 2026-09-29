"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/money";
import type { AdminProduct } from "@/lib/admin-products";

export function ProductsListManager({
  products,
}: {
  products: AdminProduct[];
}) {
  const router = useRouter();
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  function triggerToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  async function confirmDelete() {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("id", productToDelete.id);
      
      const res = await fetch("/api/admin/products/delete", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      triggerToast("Product removed from catalogue.");
      setProductToDelete(null);
      router.refresh();
    } catch {
      triggerToast("Failed to delete product. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative flex flex-col gap-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-[#111827] text-white border border-white/10"
              : "bg-red-600 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div className="flex size-5 items-center justify-center rounded-full bg-white/20 text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
          <span className="text-xs font-medium tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-sale-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">Delete this product?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Are you sure you want to permanently delete <strong>&quot;{productToDelete.title}&quot;</strong>? This will remove it from the storefront catalog and search.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink hover:bg-ground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Store Catalogue ({products.length})
          </h2>
          <p className="text-xs text-ink-faint">
            Manage your skincare products, live inventory, and pricing details.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Product
        </Link>
      </div>

      {/* Products Display */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ground-alt/40 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-white text-ink-muted shadow-xs">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m12 4 7.5 4.2v7.6L12 20l-7.5-4.2V8.2Z" strokeLinejoin="round" />
              <path d="M4.5 8.2 12 12.4l7.5-4.2M12 12.4V20" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-ink">No products in catalogue yet</p>
          <p className="mt-1 max-w-sm text-xs text-ink-faint">
            Click the button below to add your first skincare product and start selling.
          </p>
          <Link
            href="/admin/products/new"
            className="mt-4 flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            Add New Product
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-ground-alt/50 text-[11px] font-semibold text-ink-muted">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Price</th>
                  <th className="px-4 py-3.5 text-right">Stock</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-ground-alt/30"
                  >
                    {/* Thumbnail & Title */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line/60 bg-ground-alt">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].src}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-faint">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={"/admin/products/" + product.id}
                            className="block truncate font-semibold text-ink hover:underline"
                          >
                            {product.title}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-faint">
                            <span>/{product.handle}</span>
                            {product.sku && (
                              <>
                                <span>&bull;</span>
                                <span className="font-mono">{product.sku}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
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
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span className="font-semibold text-ink">
                        {formatINR(product.price)}
                      </span>
                      {product.compareAtPrice && (
                        <span className="mt-0.5 block text-[11px] text-ink-faint line-through">
                          {formatINR(product.compareAtPrice)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {product.trackInventory ? (
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            product.inventory <= 5
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "text-ink"
                          }`}
                        >
                          {product.inventory} in stock
                        </span>
                      ) : (
                        <span className="text-ink-faint">&infin; untracked</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={"/products/" + product.handle}
                          target="_blank"
                          title="View on store"
                          className="rounded-lg p-1.5 text-ink-muted hover:bg-ground hover:text-ink transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </Link>
                        <Link
                          href={"/admin/products/" + product.id}
                          className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-ground transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setProductToDelete(product)}
                          title="Delete product"
                          className="rounded-lg p-1.5 text-ink-faint hover:bg-red-50 hover:text-sale-ink transition-colors"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
