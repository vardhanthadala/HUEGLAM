"use client";

import { useRef, useState } from "react";

/**
 * A path input paired with an uploader. The value is always a plain path or
 * URL, so content can also be pointed at an existing asset without uploading.
 */
export function MediaField({
  name,
  label,
  defaultValue = "",
  accept = "image/*",
  required = false,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  accept?: string;
  required?: boolean;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        <span className="mt-1 block w-28 overflow-hidden border border-line bg-ground-alt">
          {isVideo ? (
            <video src={value} className="h-32 w-full object-cover" muted />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={value} alt="" className="h-32 w-full object-cover" />
          )}
        </span>
      )}
    </label>
  );
}
