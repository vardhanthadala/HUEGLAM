import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { MongoNotice, loadContent } from "../shared";
import {
  ContentForm,
  DeleteButton,
  TextField,
  VisibilityFields,
} from "@/components/admin/ContentForm";
import { saveAnnouncement, deleteContent } from "../actions";
import { Announcement } from "@/models/Announcement";

export const dynamic = "force-dynamic";

export default async function AnnouncementsAdminPage() {
  const session = await requireSession();
  const rows = await loadContent(() =>
    Announcement.find().sort({ position: 1, createdAt: 1 }).lean(),
  );

  return (
    <AdminShell session={session} active="/admin/content/announcements"
      title="Announcements"
      description="Messages that scroll in the black bar above the header."
    >

      <MongoNotice />

      <section className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
        <h2 className="eyebrow mb-4">Add a message</h2>
        <ContentForm action={saveAnnouncement} submitLabel="Add message">
          <TextField name="text" label="Message" placeholder="Limited Time offer." required />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField name="ctaLabel" label="Link text" placeholder="Shop Now" />
            <TextField name="ctaHref" label="Link target" defaultValue="/collections/all" />
          </div>
          <VisibilityFields />
        </ContentForm>
      </section>

      <div className="mt-8 flex flex-col gap-4">
        {rows.map((row) => (
          <section key={String(row._id)} className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="eyebrow">{row.active ? "Live" : "Hidden"}</h2>
              <DeleteButton action={deleteContent} kind="announcement" id={String(row._id)} />
            </div>
            <ContentForm action={saveAnnouncement} submitLabel="Save">
              <input type="hidden" name="id" value={String(row._id)} />
              <TextField name="text" label="Message" defaultValue={row.text} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="ctaLabel" label="Link text" defaultValue={row.ctaLabel ?? ""} />
                <TextField name="ctaHref" label="Link target" defaultValue={row.ctaHref ?? ""} />
              </div>
              <VisibilityFields active={row.active} position={row.position} />
            </ContentForm>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
