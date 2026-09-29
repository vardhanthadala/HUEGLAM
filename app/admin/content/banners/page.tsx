import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { MongoNotice, loadContent } from "../shared";
import {
  ContentForm,
  DeleteButton,
  TextField,
  VisibilityFields,
} from "@/components/admin/ContentForm";
import { MediaField } from "@/components/admin/MediaField";
import { saveHeroBanner, deleteContent } from "../actions";
import { HeroBanner } from "@/models/HeroBanner";

export const dynamic = "force-dynamic";

export default async function BannersAdminPage() {
  const session = await requireSession();
  const rows = await loadContent(() =>
    HeroBanner.find().sort({ position: 1, createdAt: 1 }).lean(),
  );

  return (
    <AdminShell session={session} active="/admin/content/banners"
      title="Hero banners"
      description="The homepage slideshow. Desktop artwork is 3:1, mobile is 4:5."
    >

      <MongoNotice />

      <section className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
        <h2 className="eyebrow mb-4">Add a banner</h2>
        <ContentForm action={saveHeroBanner} submitLabel="Add banner">
          <MediaField name="desktopImage" label="Desktop image (3:1)" required hint="Wide artwork, around 4000x1334." />
          <MediaField name="mobileImage" label="Mobile image (4:5)" hint="Portrait artwork. Falls back to the desktop image if left empty." />
          <TextField name="alt" label="Alt text" placeholder="HUEGLAM skincare range" />
          <TextField name="href" label="Links to (optional)" placeholder="/collections/all" />
          <VisibilityFields />
        </ContentForm>
      </section>

      <div className="mt-8 flex flex-col gap-4">
        {rows.map((row) => (
          <section key={String(row._id)} className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="eyebrow">{row.active ? "Live" : "Hidden"}</h2>
              <DeleteButton action={deleteContent} kind="banner" id={String(row._id)} />
            </div>
            <ContentForm action={saveHeroBanner} submitLabel="Save">
              <input type="hidden" name="id" value={String(row._id)} />
              <MediaField name="desktopImage" label="Desktop image (3:1)" defaultValue={row.desktopImage} required />
              <MediaField name="mobileImage" label="Mobile image (4:5)" defaultValue={row.mobileImage ?? ""} />
              <TextField name="alt" label="Alt text" defaultValue={row.alt ?? ""} />
              <TextField name="href" label="Links to (optional)" defaultValue={row.href ?? ""} />
              <VisibilityFields active={row.active} position={row.position} />
            </ContentForm>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
