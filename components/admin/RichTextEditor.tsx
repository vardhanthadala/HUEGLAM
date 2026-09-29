"use client";

import { useRef, useState } from "react";

export function RichTextEditor({
  name,
  label,
  defaultValue = "",
  rows = 7,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after: string = before, placeholder = "text") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end) || placeholder;
    const replacement = `${before}${selectedText}${after}`;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setValue(newValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 10);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink">{label}</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-white focus-within:border-ink transition-colors">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-ground-alt/50 px-3 py-1.5">
          <button
            type="button"
            title="Highlight selected word in soft yellow"
            onClick={() => wrapSelection("<mark>", "</mark>", "highlighted word")}
            className="flex items-center gap-1.5 rounded bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 border border-amber-300/80 hover:bg-amber-200 transition-colors"
          >
            <span className="text-sm">✨</span> Highlight Word
          </button>

          <div className="mx-1 h-4 w-px bg-line" />

          <button
            type="button"
            title="Make bold"
            onClick={() => wrapSelection("<strong>", "</strong>", "bold text")}
            className="rounded px-2.5 py-1 text-xs font-bold text-ink hover:bg-ground transition-colors"
          >
            B
          </button>

          <button
            type="button"
            title="Make italic"
            onClick={() => wrapSelection("<em>", "</em>", "italic text")}
            className="rounded px-2.5 py-1 text-xs italic text-ink hover:bg-ground transition-colors"
          >
            I
          </button>

          <button
            type="button"
            title="Heading"
            onClick={() => wrapSelection("<h3><strong>", "</strong></h3>", "Section Heading")}
            className="rounded px-2 py-1 text-xs font-semibold text-ink-muted hover:bg-ground hover:text-ink transition-colors"
          >
            H3
          </button>

          <button
            type="button"
            title="Bulleted list item"
            onClick={() => wrapSelection("• ", "", "List item")}
            className="rounded px-2 py-1 text-xs font-semibold text-ink-muted hover:bg-ground hover:text-ink transition-colors"
          >
            &bull; List
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          name={name}
          rows={rows}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Select any word and click '✨ Highlight Word' to make it stand out on the website!&#10;&#10;e.g. This conditioning sunscreen is infused with <mark>ceramide and vitamin C</mark> to prevent fine lines..."
          className="w-full bg-white px-3.5 py-2.5 text-xs text-ink outline-none leading-relaxed placeholder:text-ink-faint font-mono"
        />

        {/* Live Preview Box */}
        {value && (
          <div className="border-t border-line/70 bg-ground-alt/20 px-3.5 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
              Live Preview:
            </span>
            <div
              className="mt-1 text-xs leading-relaxed text-ink/90 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        )}
      </div>

      {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
    </div>
  );
}
