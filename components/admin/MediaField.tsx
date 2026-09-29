"use client";

import { useRef, useState } from "react";

/**
 * Modern file upload zone with preview and remove button.
 * Enforces file upload rather than typing raw URLs.
 */
export function MediaField({
  name,
  label,
  defaultValue = "",
  accept = "image/*",
  required = false,
  hint,
  uploadOnly = false,
  aspect = "aspect-[3/1]",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  accept?: string;
  required?: boolean;
  hint?: string;
  uploadOnly?: boolean;
  aspect?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      setValue(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const isVideo = /\.(mp4|webm)$/i.test(value);

  if (uploadOnly) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] font-medium text-ink">{label}</span>

        {/* Hidden input to hold the uploaded file path for form submission */}
        <input type="hidden" name={name} value={value} required={required} />

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />

        {value ? (
          <div className="relative group overflow-hidden rounded-xl border border-line bg-ground-alt p-2">
            <div className={`relative ${aspect} w-full overflow-hidden rounded-lg bg-black/5`}>
              {isVideo ? (
                <video src={value} className="h-full w-full object-cover" muted controls />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={value} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              <span className="text-[11px] text-ink-muted truncate max-w-[200px] font-mono">
                {value}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                  className="rounded border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-ground transition-colors"
                >
                  {busy ? "Uploading..." : "Change Image"}
                </button>
                <button
                  type="button"
                  onClick={() => setValue("")}
                  className="rounded px-2 py-1 text-xs text-sale-ink hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void upload(file);
            }}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
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
                {busy ? "Uploading image..." : "Click or drag & drop to upload image"}
              </p>
              {hint && <p className="text-[11px] text-ink-faint mt-0.5">{hint}</p>}
            </div>
          </div>
        )}

        {error && <span className="text-[0.75rem] text-sale-ink">{error}</span>}
      </div>
    );
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.8125rem] text-[#6b7280]">{label}</span>

      <div className="flex gap-2">
        <input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          placeholder="/uploads/... or https://..."
          className="w-full rounded-[9px] border border-[#e3e6eb] bg-white px-3 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-ink"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="shrink-0 rounded-[9px] border border-[#e3e6eb] bg-white px-4 text-[0.8125rem] transition-colors hover:border-[#cbd0d9] disabled:opacity-45"
        >
          {busy ? "Uploading" : "Upload"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />

      {hint && <span className="text-[0.6875rem] text-ink-faint">{hint}</span>}
      {error && <span className="text-[0.75rem] text-sale-ink">{error}</span>}

      {value && (
        <span className="mt-1 block max-w-md overflow-hidden rounded-lg border border-line bg-ground-alt">
          {isVideo ? (
            <video src={value} className="max-h-48 w-full object-contain" muted controls />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" className="max-h-48 w-full object-contain" />
          )}
        </span>
      )}
    </label>
  );
}
