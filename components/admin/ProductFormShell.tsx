"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { ProductState } from "@/app/admin/products/actions";

const initial: ProductState = {};

export function ProductFormShell({
  action,
  submitLabel,
  isEdit = false,
  children,
}: {
  action: (state: ProductState, form: FormData) => Promise<ProductState>;
  submitLabel: string;
  isEdit?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  function triggerToast(text: string, type: "success" | "error" = "success") {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }

  const [state, formAction, pending] = useActionState(
    async (prev: ProductState, form: FormData) => {
      const res = await action(prev, form);
      if (res.ok) {
        triggerToast(res.ok, "success");
        setTimeout(() => {
          router.push("/admin/products");
          router.refresh();
        }, 800);
      } else if (res.error) {
        triggerToast(res.error, "error");
      }
      return res;
    },
    initial
  );

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-[#111827] text-white border border-white/10"
              : "bg-red-600 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div className="flex size-5 items-center justify-center rounded-full bg-white/20 text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
          <span className="text-xs font-medium tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-ink">Discard product changes?</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Any unsaved edits to this product will be lost. Are you sure you want to exit?
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="rounded-lg border border-line px-3.5 py-2 text-xs font-medium text-ink hover:bg-ground transition-colors"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardModal(false);
                  router.push("/admin/products");
                }}
                className="rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
              >
                Discard & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-6">
        {children}

        {state.error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 font-medium">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 font-medium">
            {state.ok}
          </p>
        )}

        {/* Bottom Action Footer Bar */}
        <div className="sticky bottom-6 z-20 flex items-center justify-between rounded-xl border border-line bg-white/95 px-6 py-4 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowDiscardModal(true)}
            className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-2 rounded-lg bg-ink px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {pending ? (
              <>
                <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Saving Product...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </>
  );
}

/** Card wrapper used to group fields cleanly with modern borders and headers */
export function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-6 shadow-xs">
      <div className="mb-5 border-b border-line pb-3">
        <h2 className="text-sm font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Field({
  name,
  label,
  defaultValue = "",
  placeholder,
  type = "text",
  required = false,
  hint,
  step,
  prefix,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  step?: string;
  prefix?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3.5 text-xs font-medium text-ink-muted pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          name={name}
          type={type}
          step={step}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink ${
            prefix ? "pl-8" : ""
          }`}
        />
      </div>
      {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}

export function TextArea({
  name,
  label,
  defaultValue = "",
  rows = 3,
  placeholder,
  hint,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-xs text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink leading-relaxed"
      />
      {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Toggle({
  name,
  label,
  description,
  defaultChecked = true,
}: {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-line/60 bg-ground-alt/30 p-3.5 cursor-pointer hover:bg-ground-alt/60 transition-colors">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded accent-ink cursor-pointer"
      />
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-ink">{label}</span>
        {description && (
          <span className="text-[11px] text-ink-faint mt-0.5">{description}</span>
        )}
      </div>
    </label>
  );
}
