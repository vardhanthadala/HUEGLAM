"use client";

import { useState, useActionState, useTransition } from "react";
import { createCouponAction, toggleCouponAction, deleteCouponAction, type ActionState } from "@/app/admin/actions";
import { formatINR } from "@/lib/money";
import type { AdminCoupon } from "@/lib/queries";
import { FiPlus, FiTag, FiTrash2, FiCheck, FiX, FiCalendar, FiUsers } from "react-icons/fi";

const initial: ActionState = {};

export function CouponsManager({ coupons }: { coupons: AdminCoupon[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCouponAction, initial);
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      await toggleCouponAction(id, !current);
    });
  };

  const handleDelete = (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete coupon ${code}?`)) {
      startTransition(async () => {
        await deleteCouponAction(id);
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-ink">Active &amp; Scheduled Coupons</h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Customers apply these codes at checkout for instant discounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-xs font-medium text-white transition hover:opacity-85 shadow-sm"
        >
          <FiPlus className="size-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-ground p-12 text-center">
          <span className="flex size-12 mx-auto items-center justify-center rounded-full bg-ground-alt text-ink-soft">
            <FiTag className="size-6" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-ink">No coupons created yet</h3>
          <p className="mt-1 text-xs text-ink-soft max-w-sm mx-auto">
            Create your first promo code to boost conversions and launch marketing campaigns.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-85"
          >
            <FiPlus className="size-3.5" /> Create Coupon
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-ground shadow-2xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-ground-alt/50 text-[0.6875rem] uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3 font-medium">Coupon Code</th>
                <th className="px-5 py-3 font-medium">Discount Value</th>
                <th className="px-5 py-3 font-medium">Min Order</th>
                <th className="px-5 py-3 font-medium">Uses</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Expiry</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {coupons.map((c) => {
                const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                const isExhausted = c.usageLimit != null && c.usageCount >= c.usageLimit;
                const isActive = c.active && !isExpired && !isExhausted;

                return (
                  <tr key={c.id} className="transition-colors hover:bg-ground-alt/40">
                    {/* Code */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold tracking-wider text-ink bg-ground-alt px-2 py-1 rounded border border-line">
                          {c.code}
                        </span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="px-5 py-4 font-semibold text-ink">
                      {c.type === "percent" ? `${c.value}% OFF` : `${formatINR(c.value)} FLAT OFF`}
                    </td>

                    {/* Min Subtotal */}
                    <td className="px-5 py-4 text-xs text-ink-soft">
                      {c.minSubtotal > 0 ? `Min. ${formatINR(c.minSubtotal)}` : "No minimum"}
                    </td>

                    {/* Usage count */}
                    <td className="px-5 py-4 text-xs text-ink">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <FiUsers className="size-3 text-ink-faint" />
                        {c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : "used"}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      {isExpired ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-medium text-amber-700 border border-amber-200">
                          Expired
                        </span>
                      ) : isExhausted ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[0.6875rem] font-medium text-red-700 border border-red-200">
                          Exhausted
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.6875rem] font-medium text-emerald-700 border border-emerald-200">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-ground-alt px-2 py-0.5 text-[0.6875rem] font-medium text-ink-faint border border-line">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Expiry */}
                    <td className="px-5 py-4 text-xs text-ink-soft whitespace-nowrap">
                      {c.expiresAt ? (
                        <span className="inline-flex items-center gap-1">
                          <FiCalendar className="size-3 text-ink-faint" />
                          {c.expiresAt.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        "No expiry"
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleToggle(c.id, c.active)}
                          className={
                            "rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors " +
                            (c.active
                              ? "border-line text-ink-soft hover:bg-ground-alt hover:text-ink"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100")
                          }
                        >
                          {c.active ? "Pause" : "Enable"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(c.id, c.code)}
                          className="rounded-lg p-1.5 text-ink-faint hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete coupon"
                        >
                          <FiTrash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-line bg-ground p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-semibold text-ink">Create New Discount Coupon</h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Configure promo code parameters and discount rules.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-ink-soft hover:text-ink text-xl leading-none p-1"
              >
                &times;
              </button>
            </div>

            <form
              action={async (formData) => {
                const res = await createCouponAction({}, formData);
                if (res?.error) {
                  alert(res.error);
                } else {
                  setModalOpen(false);
                }
              }}
              className="mt-5 flex flex-col gap-4"
            >
              {/* Code */}
              <div>
                <label className="text-xs font-medium text-ink block mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  name="code"
                  required
                  placeholder="e.g. WELCOME10, GLAM500"
                  className="w-full uppercase font-mono rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink block mb-1">
                    Discount Type
                  </label>
                  <select
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as "percent" | "fixed")}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  >
                    <option value="percent">Percentage (% OFF)</option>
                    <option value="fixed">Fixed Rupees (₹ OFF)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-ink block mb-1">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="value"
                      type="number"
                      min="1"
                      max={type === "percent" ? 100 : undefined}
                      required
                      placeholder={type === "percent" ? "10" : "500"}
                      className="w-full rounded-lg border border-line bg-white pl-3 pr-8 py-2 text-sm text-ink outline-none focus:border-ink"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-soft">
                      {type === "percent" ? "%" : "₹"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Min Subtotal */}
              <div>
                <label className="text-xs font-medium text-ink block mb-1">
                  Minimum Order Subtotal (₹)
                </label>
                <input
                  name="minSubtotal"
                  type="number"
                  min="0"
                  defaultValue="0"
                  placeholder="0 for no minimum"
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                />
                <span className="text-[11px] text-ink-faint mt-1 block">
                  e.g. 999 for orders above ₹999.
                </span>
              </div>

              {/* Limits and Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink block mb-1">
                    Usage Limit (Optional)
                  </label>
                  <input
                    name="usageLimit"
                    type="number"
                    min="1"
                    placeholder="e.g. 100 uses"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink block mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    name="expiresAt"
                    type="date"
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
                  />
                </div>
              </div>

              {state.error && (
                <p role="alert" className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
                  {state.error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink hover:bg-ground-alt"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-85 disabled:opacity-50"
                >
                  {pending ? "Creating..." : "Save Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
