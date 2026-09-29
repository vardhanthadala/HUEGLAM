"use client";

import { useActionState, type ReactNode } from "react";
import type { ContentState } from "@/app/admin/content/actions";

const initial: ContentState = {};

type Action = (state: ContentState, form: FormData) => Promise<ContentState>;

/** Wraps a content form with its pending state and result message. */
export function ContentForm({
  action,
  submitLabel,
  children,
}: {
  action: Action;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
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

/** Small delete button used in each content list row. */
export function DeleteButton({
  action,
  kind,
  id,
}: {
  action: (form: FormData) => Promise<void>;
  kind: string;
  id: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-[0.6875rem] tracking-[0.1em] uppercase text-ink-faint underline underline-offset-4 hover:text-sale-ink"
      >
        Delete
      </button>
    </form>
  );
}

/** Plain labelled text input used across the content forms. */
export function TextField({
  name,
  label,
  defaultValue = "",
  placeholder,
  required = false,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.8125rem] text-[#6b7280]">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="rounded-[9px] border border-[#e3e6eb] bg-white px-3 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-ink"
      />
    </label>
  );
}

/** Active + position pair, shared by every content type. */
export function VisibilityFields({
  active = true,
  position = 0,
}: {
  active?: boolean;
  position?: number;
}) {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.8125rem] text-[#6b7280]">Order</span>
        <input
          name="position"
          type="number"
          defaultValue={position}
          className="w-24 rounded-[9px] border border-[#e3e6eb] bg-white px-3 py-2.5 text-[0.875rem] outline-none transition-colors focus:border-ink"
        />
      </label>
      <label className="flex items-center gap-2.5 pb-2.5 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={active}
          className="size-4 accent-ink"
        />
        Visible on the site
      </label>
    </div>
  );
}
