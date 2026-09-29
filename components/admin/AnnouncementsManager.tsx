"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "./ContentForm";
import {
  saveAnnouncement,
  deleteContent,
  type ContentState,
} from "@/app/admin/content/actions";
import { useActionState } from "react";

type AnnouncementRow = {
  _id: string;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
  active?: boolean;
};

const initial: ContentState = {};

export function AnnouncementsManager({ initialRows }: { initialRows: AnnouncementRow[] }) {
  const router = useRouter();
  const [editingRow, setEditingRow] = useState<AnnouncementRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Modal / Toast states for production UX
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<AnnouncementRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  function triggerToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  const [state, formAction, pending] = useActionState(async (prev: ContentState, form: FormData) => {
    const isEdit = !!editingRow;
    const res = await saveAnnouncement(prev, form);
    if (res.ok) {
      setEditingRow(null);
      setIsAdding(false);
      triggerToast(isEdit ? "Announcement updated!" : "New announcement published!");
      router.refresh();
    } else if (res.error) {
      triggerToast(res.error, "error");
    }
    return res;
  }, initial);

  async function confirmDelete() {
    if (!rowToDelete) return;
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("kind", "announcement");
      formData.append("id", rowToDelete._id);
      await deleteContent(formData);
      triggerToast("Announcement deleted successfully.");
      setRowToDelete(null);
      router.refresh();
    } catch {
      triggerToast("Failed to delete. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // Preview rotation state (rotates every 4s)
  const [previewIndex, setPreviewIndex] = useState(0);
  const activeAnnouncements = initialRows.filter((r) => r.active !== false);

  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const timer = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeAnnouncements.length]);

  const currentPreview = activeAnnouncements.length > 0
    ? activeAnnouncements[previewIndex % activeAnnouncements.length]
    : null;

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
            Top Bar Announcements ({initialRows.length})
          </h2>
          <p className="text-xs text-ink-faint">
            Messages displayed in the black promotional top bar across your store.
          </p>
        </div>
        {!isAdding && !editingRow && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setEditingRow(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Announcement
          </button>
        )}
      </div>

      {/* Live Preview Box */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        <div className="border-b border-line bg-ground-alt/50 px-4 py-2 text-[11px] font-medium text-ink-muted flex items-center justify-between">
          <span>Website Preview (Top Bar)</span>
          <span className="text-ink-faint text-[10px]">
            {activeAnnouncements.length > 1
              ? `Rotating every 4s (${(previewIndex % activeAnnouncements.length) + 1} of ${activeAnnouncements.length})`
              : "Continuous bar across store"}
          </span>
        </div>
        <div className="relative flex h-11 items-center justify-center bg-black px-6 text-center text-xs font-medium text-white">
          {currentPreview ? (
            <div
              key={currentPreview._id}
              className="flex items-center gap-2 truncate transition-all duration-500 animate-in fade-in"
            >
              <span>{currentPreview.text}</span>
              {currentPreview.ctaLabel && (
                <span className="underline underline-offset-2 opacity-90">
                  {currentPreview.ctaLabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-white/40 italic text-xs">
              No live announcements (top bar hidden on storefront)
            </span>
          )}
        </div>
      </div>

      {/* Editor Modal / Panel */}
      {(isAdding || editingRow) && (
        <div className="rounded-xl border border-line bg-white p-6 shadow-md transition-all">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-sm font-bold text-ink">
                {editingRow ? "Edit Announcement" : "Create New Announcement"}
              </h3>
              <p className="text-xs text-ink-faint">
                Enter your promotional message and optional call-to-action button link.
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

          <form action={formAction} className="flex flex-col gap-4">
            {editingRow && (
              <input type="hidden" name="id" value={editingRow._id} />
            )}

            <TextField
              name="text"
              label="Promotional Message"
              defaultValue={editingRow?.text ?? ""}
              placeholder="e.g. Free shipping on all orders over ₹499 | Limited period offer"
              required
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name="ctaLabel"
                label="Action Button / Link Text (optional)"
                defaultValue={editingRow?.ctaLabel ?? ""}
                placeholder="e.g. Shop Now"
              />
              <TextField
                name="ctaHref"
                label="Link Target"
                defaultValue={editingRow?.ctaHref ?? "/collections/all"}
                placeholder="e.g. /collections/all or /products/face-cream"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editingRow ? editingRow.active : true}
                  className="size-4 rounded accent-ink cursor-pointer"
                />
                Show in top bar (Uncheck to keep as draft)
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
                    Saving...
                  </>
                ) : editingRow ? (
                  "Save Changes"
                ) : (
                  "Publish Announcement"
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

      {/* Cards List */}
      {initialRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ground-alt/40 p-12 text-center">
          <p className="text-sm font-medium text-ink">No announcements added yet</p>
          <p className="mt-1 text-xs text-ink-faint">
            Add a top bar message to inform visitors about sales, discounts, or delivery offers.
          </p>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90"
          >
            + Add First Announcement
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {initialRows.map((row, index) => (
            <div
              key={row._id}
              className={`flex items-center justify-between rounded-xl border bg-white p-4 shadow-xs transition-all hover:shadow-sm ${
                editingRow?._id === row._id ? "ring-2 ring-ink border-ink" : "border-line"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ground-alt text-xs font-bold text-ink-muted">
                  #{index + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink truncate">
                      {row.text}
                    </p>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        row.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {row.active ? "Live" : "Draft / Hidden"}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-ink-faint">
                    {row.ctaLabel && (
                      <span className="font-medium text-ink-muted">
                        Button: &ldquo;{row.ctaLabel}&rdquo;
                      </span>
                    )}
                    {row.ctaHref && (
                      <span className="truncate font-mono">
                        Target: {row.ctaHref}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingRow(row);
                    setIsAdding(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-ground-alt transition-colors"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => setRowToDelete(row)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-sale-ink hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal: Discard changes */}
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
              Any changes made to this announcement will be discarded.
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
                  setEditingRow(null);
                }}
                className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete */}
      {rowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-sale-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">Delete announcement?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Are you sure you want to delete <strong>&quot;{rowToDelete.text}&quot;</strong>? This cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setRowToDelete(null)}
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
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
