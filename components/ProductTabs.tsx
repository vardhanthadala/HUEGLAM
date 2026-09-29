"use client";

import { useState } from "react";

/**
 * Description / Reviews tabs. The live store runs reviews through a
 * third-party app; there is no review data in this project, so the tab is
 * honest about being empty rather than showing placeholder testimonials.
 */
export function ProductTabs({ bodyHtml }: { bodyHtml: string }) {
  const [tab, setTab] = useState<"description" | "reviews">("description");

  const tabClass = (active: boolean) =>
    "pb-3 text-[0.9375rem] transition-colors " +
    (active
      ? "border-b-2 border-ink text-ink"
      : "border-b-2 border-transparent text-ink-soft hover:text-ink");

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
        <div className="rte mt-8" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
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
