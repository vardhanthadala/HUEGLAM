import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { MongoNotice, loadContent } from "../shared";
import { AnnouncementsManager } from "@/components/admin/AnnouncementsManager";
import { Announcement } from "@/models/Announcement";

export const dynamic = "force-dynamic";

export default async function AnnouncementsAdminPage() {
  const session = await requireSession();
  const rows = await loadContent(() =>
    Announcement.find().sort({ createdAt: 1 }).lean(),
  );

  const initialRows = rows.map((r) => ({
    _id: String(r._id),
    text: r.text,
    ctaLabel: r.ctaLabel,
    ctaHref: r.ctaHref,
    active: r.active,
  }));

  return (
    <AdminShell
      session={session}
      active="/admin/content/announcements"
      title="Announcements"
      description="Messages that rotate in the black top bar above the header."
    >
      <MongoNotice />
      <AnnouncementsManager initialRows={initialRows} />
    </AdminShell>
  );
}
