import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { MongoNotice, loadContent } from "../shared";
import { MarqueeManager } from "@/components/admin/MarqueeManager";
import { MarqueeItem } from "@/models/MarqueeItem";

export const dynamic = "force-dynamic";

export default async function MarqueeAdminPage() {
  const session = await requireSession();
  const rows = await loadContent(() =>
    MarqueeItem.find().sort({ createdAt: 1 }).lean(),
  );

  const initialRows = rows.map((r) => ({
    _id: String(r._id),
    text: r.text,
    active: r.active,
  }));

  return (
    <AdminShell
      session={session}
      active="/admin/content/marquee"
      title="Ticker strip"
      description="The infinite scrolling phrases strip right below the hero slideshow."
    >
      <MongoNotice />
      <MarqueeManager initialRows={initialRows} />
    </AdminShell>
  );
}
