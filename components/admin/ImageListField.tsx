"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export type EditorImage = { src: string; alt: string };

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
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
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
      <input type="hidden" name={name} value={JSON.stringify(images)} />

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) {
            void uploadFiles(e.dataTransfer.files);
          }
        }}
        className={`flex flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-ink bg-ground-alt/60"
            : "border-line bg-ground-alt/30 hover:border-ink/50 hover:bg-ground-alt/50"
        }`}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-white shadow-xs text-ink-muted">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-ink">
            {busy ? "Uploading photos..." : "Click or drag & drop product images"}
          </p>
          <p className="text-[11px] text-ink-faint mt-0.5">
            PNG, JPG or WebP. First image becomes the main storefront cover.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 pt-1">
          {images.map((image, index) => (
            <div
              key={image.src + index}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xs transition-all hover:shadow-md"
            >
              {/* Image Preview Box */}
              <div className="relative aspect-square w-full overflow-hidden bg-ground-alt">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.src}
                  alt={image.alt || `Product image ${index + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />

                {/* Primary / Thumbnail Badge */}
                {index === 0 && (
                  <span className="absolute top-2 left-2 rounded-md bg-ink/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-xs">
                    Main Cover
                  </span>
                )}

                {/* Action overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 transition-opacity">
                  <button
                    type="button"
                    title="Remove image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages((cur) => cur.filter((_, i) => i !== index));
                    }}
                    className="flex size-6 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Card Footer: Reorder & Alt Text */}
              <div className="flex flex-col gap-1.5 p-2 bg-white">
                <input
                  value={image.alt}
                  onChange={(e) =>
                    setImages((current) =>
                      current.map((img, i) =>
                        i === index ? { ...img, alt: e.target.value } : img
                      )
                    )
                  }
                  placeholder="Alt text / description"
                  className="w-full rounded-md border border-line px-2 py-1 text-[11px] text-ink placeholder:text-ink-faint outline-none focus:border-ink transition-colors"
                />

                <div className="flex items-center justify-between pt-0.5 text-[11px] text-ink-muted">
                  <span>#{index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      title="Move left/up"
                      className="flex size-5 items-center justify-center rounded border border-line bg-white hover:bg-ground disabled:opacity-30 transition-colors"
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      disabled={index === images.length - 1}
                      onClick={() => move(index, 1)}
                      title="Move right/down"
                      className="flex size-5 items-center justify-center rounded border border-line bg-white hover:bg-ground disabled:opacity-30 transition-colors"
                    >
                      &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
