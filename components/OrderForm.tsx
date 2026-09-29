"use client";

import { useActionState } from "react";
import { updateOrderAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "failed"];

export function OrderForm({
  id,
  status,
  trackingCarrier,
  trackingNumber,
  notes,
}: {
  id: number;
  status: string;
  trackingCarrier: string;
  trackingNumber: string;
  notes: string;
}) {
  const [state, formAction, pending] = useActionState(updateOrderAction, initial);

  const field =
    "w-full border border-line bg-ground px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Status</span>
        <select name="status" defaultValue={status} className={field}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Carrier</span>
        <input
          name="trackingCarrier"
          defaultValue={trackingCarrier}
          placeholder="Delhivery, Bluedart, India Post..."
          className={field}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Tracking number</span>
        <input name="trackingNumber" defaultValue={trackingNumber} className={field} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="eyebrow">Internal notes</span>
        <textarea name="notes" defaultValue={notes} rows={3} className={field} />
      </label>

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
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
