"use client";

import { useState, useActionState } from "react";
import { cancelOrderAction, type ActionState } from "@/app/admin/actions";

const initial: ActionState = {};

const REASONS = [
  "Customer requested cancellation",
  "Item out of stock / inventory discrepancy",
  "Suspected fraudulent order",
  "Incorrect shipping address / undeliverable",
  "Duplicate order placed by customer",
  "Other administrative reason",
];

export function CancelOrderModal({
  orderId,
  orderNumber,
  status,
}: {
  orderId: string;
  orderNumber: string;
  status: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [state, formAction, pending] = useActionState(cancelOrderAction, initial);

  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="rounded-[8px] border border-line bg-ground-alt/60 p-4 text-xs text-ink-soft">
        <span className="font-medium text-ink block mb-0.5">Order is Cancelled</span>
        This order has already been cancelled. No further fulfillment actions are required.
      </div>
    );
  }

  const finalReason = selectedReason === "Other administrative reason" 
    ? (customReason.trim() || selectedReason) 
    : selectedReason;

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full rounded-[8px] border border-red-200 bg-red-50/50 py-2.5 text-[0.8125rem] font-medium text-red-700 transition hover:bg-red-100 hover:border-red-300"
      >
        Cancel Order...
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-ground p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink">Cancel Order {orderNumber}</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  This will change the order status to cancelled.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-ink-soft hover:text-ink text-lg leading-none p-1"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form action={formAction} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="id" value={orderId} />
              <input type="hidden" name="reason" value={finalReason} />
              <input type="hidden" name="restock" value={restock ? "true" : "false"} />

              {/* Cancellation Reason Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-ink">
                  Reason for Cancellation
                </label>
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-full rounded-[8px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                >
                  {REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReason === "Other administrative reason" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ink">
                    Specify Reason
                  </label>
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter reason for cancellation..."
                    className="w-full rounded-[8px] border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
              )}

              {/* Restock items checkbox */}
              {["paid", "shipped", "delivered"].includes(status) && (
                <label className="flex items-start gap-2.5 rounded-lg border border-line bg-ground-alt/40 p-3 text-xs text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restock}
                    onChange={(e) => setRestock(e.target.checked)}
                    className="mt-0.5 rounded border-line text-ink accent-ink"
                  />
                  <span>
                    <strong className="block font-medium">Restock inventory</strong>
                    Return ordered items back into product available stock automatically.
                  </span>
                </label>
              )}

              {state.error && (
                <p role="alert" className="rounded-[8px] bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                  {state.error}
                </p>
              )}
              {state.ok && (
                <p role="status" className="rounded-[8px] bg-green-50 p-2.5 text-xs text-green-700 border border-green-200">
                  {state.ok}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-line">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setIsOpen(false)}
                  className="rounded-[8px] border border-line px-3.5 py-2 text-xs font-medium text-ink hover:bg-ground-alt"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-[8px] bg-red-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {pending ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
