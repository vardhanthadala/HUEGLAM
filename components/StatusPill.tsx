const STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  paid: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200/80",
    dot: "bg-emerald-600",
  },
  shipped: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200/80",
    dot: "bg-blue-600",
  },
  delivered: {
    bg: "bg-[#f4f7f4]",
    text: "text-ink",
    border: "border-[#d8deda]",
    dot: "bg-ink",
  },
  cancelled: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  failed: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

export function StatusPill({ status }: { status: string }) {
  const current = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.625rem] font-semibold tracking-[0.08em] uppercase shadow-[0_1px_2px_rgba(0,0,0,0.02)] " +
        `${current.bg} ${current.text} ${current.border}`
      }
    >
      <span className={"size-1.5 rounded-full " + current.dot} />
      <span>{status}</span>
    </span>
  );
}
