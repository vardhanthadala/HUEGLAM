"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField } from "./ContentForm";
import {
  saveMarqueeItem,
  deleteContent,
  type ContentState,
} from "@/app/admin/content/actions";
import { useActionState } from "react";

type MarqueeRow = {
  _id: string;
  text: string;
  active?: boolean;
};

const initial: ContentState = {};

export function MarqueeManager({ initialRows }: { initialRows: MarqueeRow[] }) {
  const router = useRouter();
  const [editingRow, setEditingRow] = useState<MarqueeRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Popups & Toast
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<MarqueeRow | null>(null);
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
    const res = await saveMarqueeItem(prev, form);
    if (res.ok) {
      setEditingRow(null);
      setIsAdding(false);
      triggerToast(isEdit ? "Phrase updated!" : "New phrase added to ticker!");
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
      formData.append("kind", "marquee");
      formData.append("id", rowToDelete._id);
      await deleteContent(formData);
      triggerToast("Phrase deleted successfully.");
      setRowToDelete(null);
      router.refresh();
    } catch {
      triggerToast("Failed to delete phrase.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  const livePhrases = initialRows.filter((r) => r.active !== false).map((r) => r.text);

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
            Clearance Ticker Phrases ({initialRows.length})
          </h2>
          <p className="text-xs text-ink-faint">
            These phrases alternate and scroll infinitely in the clearance ribbon right below the hero slideshow.
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
            Add Phrase
          </button>
        )}
      </div>

      {/* Live Preview Strip */}
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-xs">
        <div className="border-b border-line bg-ground-alt/50 px-4 py-2 text-[11px] font-medium text-ink-muted flex items-center justify-between">
          <span>Live Storefront Preview</span>
          <span className="text-ink-faint text-[10px]">
            {livePhrases.length > 0 ? "Continuous loop on homepage" : "Hidden from storefront when empty"}
          </span>
        </div>
        {livePhrases.length === 0 ? (
          <div className="flex h-14 items-center justify-center bg-ground-alt/40 px-6 text-center text-xs text-ink-faint italic">
            Ticker strip is empty &amp; hidden on storefront. Click &quot;Add Phrase&quot; to publish phrases.
          </div>
        ) : (
          <div className="overflow-hidden bg-[#f4efe9] py-4 select-none">
            <div className="marquee-track flex w-max">
              {[0, 1].map((half) => (
                <div key={half} className="flex shrink-0 items-center gap-16 pr-16" aria-hidden={half === 1}>
                  {Array.from({ length: Math.max(1, Math.ceil(6 / livePhrases.length)) }, (_, rep) => (
                    <div key={rep} className="flex shrink-0 items-center gap-16">
                      {livePhrases.map((phrase, i) => (
                        <span key={`${rep}-${i}`} className="text-base font-black tracking-wider text-black whitespace-nowrap uppercase">
                          {phrase}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal / Panel */}
      {(isAdding || editingRow) && (
        <div className="rounded-xl border border-line bg-white p-6 shadow-md transition-all">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-sm font-bold text-ink">
                {editingRow ? "Edit Ticker Phrase" : "Add Ticker Phrase"}
              </h3>
              <p className="text-xs text-ink-faint">
                e.g. &quot;CLEARANCE SALE&quot;, &quot;50-60% Off&quot;, &quot;BUY 1 GET 1 FREE&quot;, &quot;LIMITED STOCKS&quot;
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
              label="Phrase / Heading Text"
              defaultValue={editingRow?.text ?? ""}
              placeholder="e.g. CLEARANCE SALE or 50-60% Off"
              required
            />

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={editingRow ? editingRow.active : true}
                  className="size-4 rounded accent-ink cursor-pointer"
                />
                Active (Include in scrolling ribbon)
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
                  "Add to Ticker"
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

      {/* Phrases List */}
      <div className="flex flex-col gap-3">
        {initialRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ground-alt/40 p-10 text-center">
            <p className="text-sm font-medium text-ink">No ticker phrases added yet</p>
            <p className="mt-1 text-xs text-ink-faint">
              Add phrases to display an infinite scrolling announcement ribbon under the hero slideshow.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90"
            >
              + Add Phrase
            </button>
          </div>
        ) : (
          initialRows.map((row, index) => (
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

                <div className="flex items-center gap-3 min-w-0">
                  <p className="text-base font-bold text-black tracking-wide truncate">
                    {row.text}
                  </p>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      row.active !== false
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {row.active !== false ? "Live" : "Draft / Hidden"}
                  </span>
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
          ))
        )}
      </div>

      {/* Discard Confirmation */}
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
              Any changes made to this ticker phrase will be discarded.
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

      {/* Delete Confirmation */}
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
            <h3 className="mt-3 text-base font-semibold text-ink">Delete phrase?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Are you sure you want to remove &quot;{rowToDelete.text}&quot; from the clearance ticker?
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
