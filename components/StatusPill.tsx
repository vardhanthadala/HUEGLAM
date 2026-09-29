const STYLES: Record<string, string> = {
  pending: "bg-ground-alt text-ink-soft border-line",
  paid: "bg-sale text-sale-ink border-sale-ink/25",
  shipped: "bg-ink text-ground border-ink",
  delivered: "bg-ground text-ink border-ink",
  cancelled: "bg-ground-alt text-ink-faint border-line",
  failed: "bg-ground-alt text-ink-faint border-line",
};

export function StatusPill({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={
        "inline-block border px-2 py-0.5 text-[0.625rem] font-medium tracking-[0.1em] uppercase " +
        style
      }
    >
      {status}
    </span>
  );
}
