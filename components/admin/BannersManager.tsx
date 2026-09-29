"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MediaField } from "./MediaField";
import { TextField } from "./ContentForm";
import {
  saveHeroBanner,
  deleteContent,
  type ContentState,
} from "@/app/admin/content/actions";
import { useActionState } from "react";

type BannerRow = {
  _id: string;
  desktopImage: string;
  mobileImage?: string;
  alt?: string;
  href?: string;
  active?: boolean;
};

const initial: ContentState = {};

export function BannersManager({ initialBanners }: { initialBanners: BannerRow[] }) {
  const router = useRouter();
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Modal states for production-grade UX
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<BannerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  function triggerToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  // Form action
  const [state, formAction, pending] = useActionState(async (prev: ContentState, form: FormData) => {
    const isEdit = !!editingBanner;
    const res = await saveHeroBanner(prev, form);
    if (res.ok) {
      setEditingBanner(null);
      setIsAdding(false);
      triggerToast(isEdit ? "Banner updated successfully!" : "New hero banner published!");
      router.refresh();
    } else if (res.error) {
      triggerToast(res.error, "error");
    }
    return res;
  }, initial);

  async function confirmDelete() {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("kind", "banner");
      formData.append("id", bannerToDelete._id);
      await deleteContent(formData);
      triggerToast("Banner deleted successfully.");
      setBannerToDelete(null);
      router.refresh();
    } catch {
      triggerToast("Failed to delete banner. Please try again.", "error");
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

      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Homepage Slideshow ({initialBanners.length})
          </h2>
          <p className="text-xs text-ink-faint">
            Banners are displayed in the exact order they are added (first banner added shows first).
          </p>
        </div>
        {!isAdding && !editingBanner && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setEditingBanner(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New Banner
          </button>
        )}
      </div>

      {/* Editor Panel (Add or Edit) */}
      {(isAdding || editingBanner) && (
        <div className="rounded-xl border border-line bg-white p-6 shadow-md transition-all">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-sm font-bold text-ink">
                {editingBanner ? "Edit Hero Banner" : "Add New Hero Banner"}
              </h3>
              <p className="text-xs text-ink-faint">
                Upload wide artwork for desktop (3:1) and portrait artwork for mobile (4:5).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-muted hover:text-ink hover:border-ink transition-colors"
            >
              Cancel
            </button>
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            {editingBanner && (
              <input type="hidden" name="id" value={editingBanner._id} />
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <MediaField
                  name="desktopImage"
                  label="Upload Desktop Banner (3:1 wide, ~4000x1334)"
                  defaultValue={editingBanner?.desktopImage ?? ""}
                  required
                  uploadOnly={true}
                  hint="Drag & drop or click to upload your desktop banner image"
                />
              </div>
              <div>
                <MediaField
                  name="mobileImage"
                  label="Upload Mobile Banner (4:5 portrait, ~1080x1350)"
                  defaultValue={editingBanner?.mobileImage ?? ""}
                  uploadOnly={true}
                  hint="Optional: falls back to desktop artwork on mobile"
                />
              </div>
            </div>

            <div>
              <TextField
                name="alt"
                label="Alt text (Image description / accessibility title)"
                defaultValue={editingBanner?.alt ?? ""}
                placeholder="e.g. Summer Skincare Essentials Sale"
                required
              />
            </div>

            {/* Clean Visibility Toggle */}
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editingBanner ? editingBanner.active : true}
                  className="size-4 rounded accent-ink cursor-pointer"
                />
                Show on homepage (Uncheck to keep as draft)
              </label>
            </div>

            {state.error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-600">
                {state.error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-line">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-lg bg-ink px-6 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {pending ? (
                  <>
                    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Saving Changes...
                  </>
                ) : editingBanner ? (
                  "Save Changes"
                ) : (
                  "Publish Banner"
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-xs text-ink-muted hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cards Grid */}
      {initialBanners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ground-alt/40 p-12 text-center">
          <p className="text-sm font-medium text-ink">No hero banners created yet</p>
          <p className="mt-1 text-xs text-ink-faint">
            Add your first banner to populate your homepage slideshow.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            + Add First Banner
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {initialBanners.map((banner, index) => (
            <div
              key={banner._id}
              className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
                editingBanner?._id === banner._id ? "ring-2 ring-ink border-ink" : "border-line"
              }`}
            >
              {/* Aspect Ratio Preview */}
              <div className="relative aspect-[3/1] w-full overflow-hidden bg-ground-alt border-b border-line">
                {banner.desktopImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={banner.desktopImage}
                    alt={banner.alt || "Hero Banner"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02] duration-300"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-faint">
                    No image uploaded
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    Slide #{index + 1}
                  </span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold shadow-sm ${
                      banner.active
                        ? "bg-emerald-500 text-white"
                        : "bg-neutral-600 text-white"
                    }`}
                  >
                    {banner.active ? "Live" : "Draft / Hidden"}
                  </span>
                </div>

                {banner.mobileImage && (
                  <div className="absolute bottom-2.5 right-2.5 rounded bg-black/75 px-2 py-0.5 text-[10px] text-white">
                    📱 Mobile Artwork
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <h4 className="text-sm font-semibold text-ink truncate">
                    {banner.alt || "Untitled Hero Banner"}
                  </h4>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    Alt text (Accessibility & SEO)
                  </p>
                </div>

                {/* Actions Bar */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-line/60 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBanner(banner);
                      setIsAdding(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-ground-alt transition-colors"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => setBannerToDelete(banner)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium text-sale-ink hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal: Cancel Editing / Unsaved Changes */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">Discard unsaved changes?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Any changes you made to this banner will not be saved. Are you sure you want to cancel?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink hover:bg-ground transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setIsAdding(false);
                  setEditingBanner(null);
                }}
                className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Banner */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-sale-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">Delete this banner?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Are you sure you want to delete <strong>&quot;{bannerToDelete.alt || "Untitled Banner"}&quot;</strong>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBannerToDelete(null)}
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
                {isDeleting ? "Deleting..." : "Delete Banner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
