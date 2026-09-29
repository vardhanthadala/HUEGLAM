"use client";

import { useActionState } from "react";
import { updateProductAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

export function ProductForm(props: {
  id: number;
  title: string;
  price: number;
  compareAtPrice: string;
  inventory: number;
  sku: string;
  description: string;
  published: boolean;
  trackInventory: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateProductAction, initial);

  const field =
    "w-full border border-line bg-ground px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={props.id} />

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Title</span>
        <input name="title" defaultValue={props.title} required className={field} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Price (Rs.)</span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={props.price}
            required
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Compare at (Rs.)</span>
          <input
            name="compareAtPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={props.compareAtPrice}
            placeholder="Leave blank for no sale price"
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">Stock</span>
          <input
            name="inventory"
            type="number"
            min="0"
            step="1"
            defaultValue={props.inventory}
            required
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="eyebrow">SKU</span>
          <input name="sku" defaultValue={props.sku} className={field} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Short description</span>
        <textarea
          name="description"
          defaultValue={props.description}
          rows={3}
          className={field}
        />
        <span className="text-[0.6875rem] text-ink-faint">
          Used for search results and link previews. The long product copy lives in{" "}
          <code>lib/products-seed.ts</code>.
        </span>
      </label>

      <div className="flex flex-col gap-2.5 border-t border-line pt-4">
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="published"
            defaultChecked={props.published}
            className="size-4 accent-ink"
          />
          Visible on the storefront
        </label>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            name="trackInventory"
            defaultChecked={props.trackInventory}
            className="size-4 accent-ink"
          />
          Track stock and show &ldquo;sold out&rdquo; at zero
        </label>
      </div>

      {state.error && (
        <p role="alert" className="bg-sale px-3 py-2 text-[0.8125rem] text-sale-ink">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="bg-ground-alt px-3 py-2 text-[0.8125rem] text-ink-soft">
          {state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 bg-ink py-3 text-[0.6875rem] font-medium tracking-[0.16em] uppercase text-ground transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
