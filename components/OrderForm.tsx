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
  id: string;
  status: string;
  trackingCarrier: string;
  trackingNumber: string;
  notes: string;
}) {
  const [state, formAction, pending] = useActionState(updateOrderAction, initial);

  const field =
    "w-full rounded-[8px] border border-[#e3e6eb] bg-white px-3 py-2 text-[0.875rem] text-ink outline-none transition-colors focus:border-[#b6bcc6]";
  const label = "text-[0.75rem] text-[#9aa0ab]";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />

      <label className="flex flex-col gap-1.5">
        <span className={label}>Status</span>
        <select name="status" defaultValue={status} className={field}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>Carrier</span>
        <input
          name="trackingCarrier"
          defaultValue={trackingCarrier}
          placeholder="Delhivery, Bluedart, India Post..."
          className={field}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>Tracking number</span>
        <input name="trackingNumber" defaultValue={trackingNumber} className={field} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={label}>Internal notes</span>
        <textarea name="notes" defaultValue={notes} rows={3} className={field} />
      </label>

      {state.error && (
        <p role="alert" className="rounded-[8px] bg-[#fdf1ee] px-3 py-2 text-[0.8125rem] text-[#9c4d33]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-[8px] bg-[#edf7f0] px-3 py-2 text-[0.8125rem] text-[#3f7a4f]">
          {state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-[8px] bg-ink py-2.5 text-[0.875rem] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
