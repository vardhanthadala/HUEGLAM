"use client";

import { useRef, useState } from "react";

export type EditorImage = { src: string; alt: string };

/**
 * Manages an ordered list of product images. The list is serialised to JSON in
 * a hidden input so the server action receives order and alt text together.
 */
export function ImageListField({
  name = "images",
  defaultValue = [],
}: {
  name?: string;
  defaultValue?: EditorImage[];
}) {
  const [images, setImages] = useState<EditorImage[]>(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList) {
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Upload failed.");
        setImages((current) => [...current, { src: data.url, alt: "" }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, delta: number) {
    setImages((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Images</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-[#e0e0e0] px-3 py-1.5 text-[0.8125rem] transition-colors hover:border-ink disabled:opacity-50"
        >
          {busy ? "Uploading..." : "Add images"}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void upload(e.target.files);
          e.target.value = "";
        }}
      />

      <input type="hidden" name={name} value={JSON.stringify(images)} />

      {error && <p className="text-[0.8125rem] text-sale-ink">{error}</p>}

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#e0e0e0] px-4 py-8 text-center text-[0.8125rem] text-ink-faint">
          No images yet. The first image is used on product cards.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {images.map((image, index) => (
            <li
              key={image.src + index}
              className="flex items-center gap-3 rounded-lg border border-[#e0e0e0] p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt=""
                className="size-16 shrink-0 rounded object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.75rem] text-ink-faint">{image.src}</p>
                <input
                  value={image.alt}
                  onChange={(e) =>
                    setImages((current) =>
                      current.map((img, i) =>
                        i === index ? { ...img, alt: e.target.value } : img,
                      ),
                    )
                  }
                  placeholder="Alt text"
                  className="mt-1 w-full rounded border border-[#e0e0e0] px-2 py-1 text-[0.8125rem] outline-none focus:border-ink"
                />
              </div>

              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                  className="rounded border border-[#e0e0e0] px-2 text-[0.75rem] hover:border-ink"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                  className="rounded border border-[#e0e0e0] px-2 text-[0.75rem] hover:border-ink"
                >
                  ↓
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setImages((current) => current.filter((_, i) => i !== index))
                }
                className="shrink-0 text-[0.75rem] text-ink-faint underline underline-offset-4 hover:text-sale-ink"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {images.length > 0 && (
        <p className="text-[0.6875rem] text-ink-faint">
          First image is the card thumbnail. Use the arrows to reorder.
        </p>
      )}
    </div>
  );
}
