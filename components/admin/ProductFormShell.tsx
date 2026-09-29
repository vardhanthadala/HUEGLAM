"use client";

import { useActionState, type ReactNode } from "react";
import type { ProductState } from "@/app/admin/products/actions";

const initial: ProductState = {};

export function ProductFormShell({
  action,
  submitLabel,
  children,
}: {
  action: (state: ProductState, form: FormData) => Promise<ProductState>;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {children}

      {state.error && (
        <p role="alert" className="rounded-[10px] border border-[#f3e2da] bg-[#fdf7f4] px-4 py-3 text-[0.8125rem] text-[#8a4b33]">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-[10px] border border-[#dceadf] bg-[#f3f9f5] px-4 py-3 text-[0.8125rem] text-[#3f7a4f]">
          {state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-[9px] bg-ink px-5 py-2.5 text-[0.8125rem] font-medium text-white transition-opacity hover:opacity-85 disabled:opacity-45"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

/** Card wrapper used to group fields on the product form. */
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
      <h2 className="mb-4 text-[0.9375rem] text-ink">{title}</h2>
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
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  placeholder?: string;
  type?: string;
  required?: boolean;
  hint?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.8125rem] text-[#6b7280]">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-[9px] border border-[#e3e6eb] px-3 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-ink"
      />
      {hint && <span className="text-[0.75rem] text-[#9aa0ab]">{hint}</span>}
    </label>
  );
}

export function TextArea({
  name,
  label,
  defaultValue = "",
  rows = 4,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.8125rem] text-[#6b7280]">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="rounded-[9px] border border-[#e3e6eb] px-3 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-ink"
      />
      {hint && <span className="text-[0.75rem] text-[#9aa0ab]">{hint}</span>}
    </label>
  );
}

export function Toggle({
  name,
  label,
  defaultChecked = true,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 text-[0.875rem] text-ink">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 accent-ink"
      />
      {label}
    </label>
  );
}
