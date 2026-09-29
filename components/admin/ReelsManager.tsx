"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { MediaField } from "./MediaField";
import { TextField } from "./ContentForm";
import {
  saveReel,
  deleteContent,
  type ContentState,
} from "@/app/admin/content/actions";

type ReelRow = {
  _id: string;
  video: string;
  poster?: string;
  productHandle?: string;
  alt?: string;
  active?: boolean;
};

type ProductHandle = { handle: string; title: string };

const initial: ContentState = {};

export function ReelsManager({
  initialReels,
  products,
}: {
  initialReels: ReelRow[];
  products: ProductHandle[];
}) {
  const router = useRouter();
  const [editingReel, setEditingReel] = useState<ReelRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [reelToDelete, setReelToDelete] = useState<ReelRow | null>(null);
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

  const [state, formAction, pending] = useActionState(
    async (prev: ContentState, form: FormData) => {
      const isEdit = !!editingReel;
      const res = await saveReel(prev, form);
      if (res.ok) {
        setEditingReel(null);
        setIsAdding(false);
        triggerToast(isEdit ? "Reel updated successfully!" : "New reel published!");
        router.refresh();
      } else if (res.error) {
        triggerToast(res.error, "error");
      }
      return res;
    },
    initial
  );

  async function confirmDelete() {
    if (!reelToDelete) return;
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("kind", "reel");
      formData.append("id", reelToDelete._id);
      await deleteContent(formData);
      triggerToast("Reel deleted successfully.");
      setReelToDelete(null);
      router.refresh();
    } catch {
      triggerToast("Failed to delete reel. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative flex flex-col gap-6">
      {/* Toast Alert */}
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

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Homepage Reels ({initialReels.length})
          </h2>
          <p className="text-xs text-ink-faint">
            Portrait 9:16 shoppable video cards displayed on the storefront.
          </p>
        </div>
        {!isAdding && !editingReel && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setEditingReel(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Reel
          </button>
        )}
      </div>

      {/* Editor Modal / Panel */}
      {(isAdding || editingReel) && (
        <div className="rounded-xl border border-line bg-white p-6 shadow-md transition-all">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-sm font-bold text-ink">
                {editingReel ? "Edit Reel" : "Add New Reel"}
              </h3>
              <p className="text-xs text-ink-faint">
                Upload a portrait 9:16 video (MP4 or WebM). Cloudinary will automatically optimize playback.
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
            {editingReel && <input type="hidden" name="id" value={editingReel._id} />}

            <div className="grid gap-6 md:grid-cols-2">
              <MediaField
                name="video"
                label="Reel Video (Portrait 9:16)"
                accept="video/mp4,video/webm"
                required
                uploadOnly
                aspect="aspect-[9/16] max-h-[360px]"
                hint="MP4 or WebM video. Automatically stored on Cloudinary."
                defaultValue={editingReel?.video ?? ""}
              />
              <div className="flex flex-col gap-4">
                <MediaField
                  name="poster"
                  label="Poster Thumbnail (Optional)"
                  accept="image/*"
                  uploadOnly
                  aspect="aspect-[9/16] max-h-[200px]"
                  hint="Preview image shown before video plays."
                  defaultValue={editingReel?.poster ?? ""}
                />

                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.8125rem] font-medium text-ink">Linked Product (Shoppable tag)</span>
                  <select
                    name="productHandle"
                    defaultValue={editingReel?.productHandle ?? ""}
                    className="w-full rounded-[9px] border border-line bg-white px-3 py-2.5 text-xs outline-none focus:border-ink"
                  >
                    <option value="">None (Video only)</option>
                    {products.map((p) => (
                      <option key={p.handle} value={p.handle}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-ink-faint">
                    {products.length === 0
                      ? "No products added yet. Add products under Catalogue → Products to tag them in your reels."
                      : "Visitors can click this product directly from the video reel."}
                  </span>
                </label>

                <TextField
                  name="alt"
                  label="Description (Alt text)"
                  placeholder="e.g. Model applying Vitamin C Radiance Serum"
                  defaultValue={editingReel?.alt ?? ""}
                />

                <label className="mt-1 flex items-center gap-2.5 cursor-pointer">
                  <input
                    key={editingReel ? `edit-${editingReel._id}-${editingReel.active}` : "new-reel"}
                    type="checkbox"
                    name="active"
                    value="true"
                    defaultChecked={editingReel ? editingReel.active !== false : true}
                    className="size-4 rounded border-line text-ink accent-ink"
                  />
                  <span className="text-xs font-medium text-ink">Active / Visible on storefront</span>
                </label>
              </div>
            </div>

            {state?.error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                {state.error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink hover:bg-ground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingReel ? "Save Changes" : "Publish Reel"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reels Grid / Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {initialReels.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ground-alt/40 p-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-ground-alt text-ink-muted mb-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="m10 8 6 4-6 4V8z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-ink">No reels added yet</p>
            <p className="mt-1 text-xs text-ink-faint">
              Upload portrait video clips to show shoppable video demonstrations on your homepage.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90"
            >
              + Add First Reel
            </button>
          </div>
        ) : (
          initialReels.map((reel, index) => {
            const matchedProduct = products.find((p) => p.handle === reel.productHandle);
            return (
              <div
                key={reel._id}
                className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-xs transition-all hover:shadow-md ${
                  editingReel?._id === reel._id ? "ring-2 ring-ink border-ink" : "border-line"
                }`}
              >
                {/* Portrait Video Preview */}
                <div className="relative aspect-[9/16] w-full bg-black/5 overflow-hidden flex items-center justify-center">
                  <video
                    src={reel.video}
                    poster={reel.poster}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    loop
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={(e) => {
                      const v = e.currentTarget as HTMLVideoElement;
                      v.pause();
                      v.currentTime = 0;
                    }}
                  />
                  <span className="absolute top-2.5 left-2.5 flex size-6 items-center justify-center rounded-md bg-black/60 text-[10px] font-bold text-white backdrop-blur-xs">
                    #{index + 1}
                  </span>
                  <span
                    className={`absolute top-2.5 right-2.5 rounded-md px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs ${
                      reel.active !== false
                        ? "bg-emerald-500/90 text-white"
                        : "bg-neutral-800/80 text-neutral-300"
                    }`}
                  >
                    {reel.active !== false ? "Live" : "Draft"}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-3.5">
                  <div>
                    <p className="text-xs font-semibold text-ink truncate">
                      {reel.alt || "Untitled Reel"}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-faint truncate">
                      {matchedProduct ? (
                        <span className="font-medium text-ink">🏷️ {matchedProduct.title}</span>
                      ) : (
                        <span className="italic">No product linked</span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReel(reel);
                        setIsAdding(false);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="rounded-md border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-ground-alt transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setReelToDelete(reel)}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-sale-ink hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Discard Confirmation Modal */}
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
            <h3 className="mt-3 text-base font-semibold text-ink">Discard changes?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Any uploaded video or changes to this reel will not be saved.
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
                  setEditingReel(null);
                }}
                className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-sale-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">Delete reel?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Are you sure you want to remove this reel from your homepage?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setReelToDelete(null)}
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
                {isDeleting ? "Deleting..." : "Delete Reel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
