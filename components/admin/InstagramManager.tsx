"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MediaField } from "./MediaField";
import { TextField } from "./ContentForm";
import {
  saveInstagramPost,
  deleteContent,
  type ContentState,
} from "@/app/admin/content/actions";

type InstagramRow = {
  _id: string;
  image: string;
  permalink?: string;
  caption?: string;
  active?: boolean;
};

const initial: ContentState = {};

export function InstagramManager({
  initialPosts,
}: {
  initialPosts: InstagramRow[];
}) {
  const router = useRouter();
  const [editingPost, setEditingPost] = useState<InstagramRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Modal & Toast states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<InstagramRow | null>(null);
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
      const isEdit = !!editingPost;
      const res = await saveInstagramPost(prev, form);
      if (res.ok) {
        setEditingPost(null);
        setIsAdding(false);
        triggerToast(isEdit ? "Instagram post updated!" : "New post added to Instagram rail!");
        router.refresh();
      } else if (res.error) {
        triggerToast(res.error, "error");
      }
      return res;
    },
    initial
  );

  async function confirmDelete() {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("kind", "instagram");
      formData.append("id", postToDelete._id);
      await deleteContent(formData);
      triggerToast("Post removed from Instagram rail.");
      setPostToDelete(null);
      router.refresh();
    } catch {
      triggerToast("Failed to delete post. Please try again.", "error");
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
            Instagram Feed Tiles ({initialPosts.length})
          </h2>
          <p className="text-xs text-ink-faint">
            Curated grid of photo cards displayed in the &ldquo;Follow Us on Instagram&rdquo; section.
          </p>
        </div>
        {!isAdding && !editingPost && (
          <button
            type="button"
            onClick={() => {
              setIsAdding(true);
              setEditingPost(null);
            }}
            className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Post
          </button>
        )}
      </div>

      {/* Editor Modal / Panel */}
      {(isAdding || editingPost) && (
        <div className="rounded-xl border border-line bg-white p-6 shadow-md transition-all">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-sm font-bold text-ink">
                {editingPost ? "Edit Instagram Post" : "Add Instagram Post"}
              </h3>
              <p className="text-xs text-ink-faint">
                Upload a square or portrait photo. It will link directly to your Instagram profile or post.
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
            {editingPost && <input type="hidden" name="id" value={editingPost._id} />}

            <div className="grid gap-6 md:grid-cols-2">
              <MediaField
                name="image"
                label="Post Photo"
                accept="image/*"
                required
                uploadOnly
                aspect="aspect-square max-h-[300px]"
                hint="Square or portrait photo. Uploaded directly to Cloudinary."
                defaultValue={editingPost?.image ?? ""}
              />
              <div className="flex flex-col gap-4">
                <TextField
                  name="permalink"
                  label="Instagram Post URL"
                  placeholder="https://www.instagram.com/p/..."
                  defaultValue={editingPost?.permalink || "https://www.instagram.com/hueglam_official"}
                />

                <TextField
                  name="caption"
                  label="Caption (Alt description)"
                  placeholder="e.g. Glowing skin essentials with @hueglam_official"
                  defaultValue={editingPost?.caption ?? ""}
                />

                <label className="mt-1 flex items-center gap-2.5 cursor-pointer">
                  <input
                    key={editingPost ? `edit-${editingPost._id}-${editingPost.active}` : "new-post"}
                    type="checkbox"
                    name="active"
                    value="true"
                    defaultChecked={editingPost ? editingPost.active !== false : true}
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
                  <span>{editingPost ? "Save Changes" : "Publish Post"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Instagram Tiles */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
        {initialPosts.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-ground-alt/40 p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-ground-alt text-ink-muted mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <p className="text-base font-semibold text-ink">No Instagram posts added yet</p>
            <p className="mt-1 text-xs text-ink-faint">
              Add photos to create an interactive &ldquo;Follow Us on Instagram&rdquo; gallery on your homepage.
            </p>
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="mt-4 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90"
            >
              + Add First Post
            </button>
          </div>
        ) : (
          initialPosts.map((post, index) => (
            <div
              key={post._id}
              className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-xs transition-all hover:shadow-lg ${
                editingPost?._id === post._id ? "ring-2 ring-ink border-ink" : "border-line"
              }`}
            >
              {/* Photo Preview */}
              <div className="relative aspect-square w-full bg-ground-alt overflow-hidden">
                <Image
                  src={post.image}
                  alt={post.caption || "Instagram photo"}
                  fill
                  sizes="(min-width: 1024px) 300px, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 flex size-7 items-center justify-center rounded-lg bg-black/60 text-xs font-bold text-white backdrop-blur-xs shadow-xs">
                  #{index + 1}
                </span>
                <span
                  className={`absolute top-3 right-3 rounded-lg px-2.5 py-1 text-[11px] font-bold backdrop-blur-xs shadow-xs ${
                    post.active !== false
                      ? "bg-emerald-500/90 text-white"
                      : "bg-neutral-800/80 text-neutral-300"
                  }`}
                >
                  {post.active !== false ? "Live" : "Draft"}
                </span>
              </div>

              {/* Caption & Actions */}
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-ink line-clamp-2">
                    {post.caption || "Instagram Post"}
                  </p>
                  {post.permalink && (
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink hover:underline truncate"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span className="truncate">{post.permalink.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    </a>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(post);
                      setIsAdding(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ground-alt transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostToDelete(post)}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-sale-ink hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
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
              Any changes made to this Instagram post will be discarded.
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
                  setEditingPost(null);
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
      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-sale-ink">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">Delete post?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Are you sure you want to remove this tile from your Instagram feed rail?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPostToDelete(null)}
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
                {isDeleting ? "Deleting..." : "Delete Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
