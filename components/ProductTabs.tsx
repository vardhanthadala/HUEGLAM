"use client";

import { useState } from "react";

/**
 * Description / Reviews tabs. The live store runs reviews through a
 * third-party app; there is no review data in this project, so the tab is
 * honest about being empty rather than showing placeholder testimonials.
 */
/** Format description by rendering clean, structured paragraphs and headings */
export function formatDescriptionText(raw: string, compact = false) {
  if (!raw) return null;

  // Normalize all line breaks and HTML paragraph wrappers
  let text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p>/gi, "\n")
    .trim();

  // Pattern to detect section headings (with or without colons, bold tags, etc.)
  const headingRegex =
    /(?:^|\n|\.\s+|\b)(Directions|Active\s+Ingredients?|Ingredients|Key\s+Benefits|Benefits|How\s+to\s+use)\s*:\s*/gi;

  // Insert distinct delimiter before each section heading
  const delimited = text.replace(headingRegex, "\n\n@@HEADING:$1@@\n");

  const sections = delimited
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const htmlBlocks: string[] = [];

  for (const section of sections) {
    if (section.startsWith("@@HEADING:")) {
      const match = section.match(/^@@HEADING:(.+?)@@\n?([\s\S]*)$/);
      if (match) {
        const title = match[1].trim();
        const content = match[2].trim();
        htmlBlocks.push(
          `<div class="${compact ? "mt-3.5 mb-1" : "mt-6 mb-2"}">` +
            `<h4 class="${
              compact
                ? "text-[11px] font-bold tracking-wider uppercase text-ink mb-1"
                : "text-[0.875rem] font-bold tracking-wider uppercase text-ink mb-1.5"
            }">${title}:</h4>` +
            (content
              ? `<p class="${
                  compact
                    ? "leading-relaxed text-xs text-body"
                    : "leading-[1.8] text-ink/80 text-[0.875rem]"
                }">${content}</p>`
              : "") +
            `</div>`
        );
        continue;
      }
    }

    // Standard paragraph
    htmlBlocks.push(
      `<p class="${
        compact
          ? "mb-2.5 leading-relaxed text-xs text-body"
          : "mb-4 leading-[1.8] text-ink/90 text-[0.875rem]"
      }">${section}</p>`
    );
  }

  return (
    <div
      className={`rte ${compact ? "text-xs max-w-full" : "text-[0.875rem] max-w-[850px]"}`}
      dangerouslySetInnerHTML={{ __html: htmlBlocks.join("") }}
    />
  );
}

export function ProductTabs({
  bodyHtml,
  description = "",
  directions = "",
  activeIngredients = "",
  ingredients = "",
  benefits = [],
}: {
  bodyHtml: string;
  description?: string;
  directions?: string;
  activeIngredients?: string;
  ingredients?: string;
  benefits?: string[];
}) {
  const [tab, setTab] = useState<"description" | "reviews">("description");

  const tabClass = (active: boolean) =>
    "pb-3 text-[0.9375rem] transition-colors font-medium " +
    (active
      ? "border-b-2 border-ink text-ink"
      : "border-b-2 border-transparent text-ink-soft hover:text-ink");

  const contentToDisplay = bodyHtml || description;
  const hasStructured = contentToDisplay || directions || activeIngredients || ingredients || benefits.length > 0;

  return (
    <div>
      <div className="flex gap-10 border-b border-line">
        <button
          type="button"
          onClick={() => setTab("description")}
          aria-current={tab === "description"}
          className={tabClass(tab === "description")}
        >
          Description
        </button>
        <button
          type="button"
          onClick={() => setTab("reviews")}
          aria-current={tab === "reviews"}
          className={tabClass(tab === "reviews")}
        >
          Reviews
        </button>
      </div>

      {tab === "description" ? (
        contentToDisplay ? (
          <div className="mt-8">
            {formatDescriptionText(contentToDisplay)}
          </div>
        ) : hasStructured ? (
          <div className="mt-8 flex flex-col gap-6 text-[0.875rem] leading-[1.8] text-ink/80 max-w-[850px]">
            {description && (
              <p className="whitespace-pre-line text-ink">{description}</p>
            )}

            {directions && (
              <div>
                <p className="font-semibold text-ink">Directions:</p>
                <p className="mt-1 whitespace-pre-line">{directions}</p>
              </div>
            )}

            {activeIngredients && (
              <div>
                <p className="font-semibold text-ink">Active Ingredient:</p>
                <p className="mt-1 uppercase tracking-wide font-medium text-ink/90">
                  {activeIngredients}
                </p>
              </div>
            )}

            {benefits.length > 0 && (
              <div>
                <p className="font-semibold text-ink">Benefits:</p>
                <ul className="mt-1 list-disc pl-5 space-y-1">
                  {benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {ingredients && (
              <div>
                <p className="font-semibold text-ink">Ingredients:</p>
                <p className="mt-1 uppercase text-xs tracking-wider leading-relaxed text-ink-muted">
                  {ingredients}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 text-[0.875rem] text-ink-faint">
            <p>No description provided for this product.</p>
          </div>
        )
      ) : (
        <div className="mt-8 text-[0.9375rem] text-ink-soft">
          <p>No reviews yet.</p>
          <p className="mt-2 text-[0.875rem]">
            Reviews collected on the Shopify store live in a separate app and were
            not carried over. They can be imported, or collected fresh here.
          </p>
        </div>
      )}
    </div>
  );
}
