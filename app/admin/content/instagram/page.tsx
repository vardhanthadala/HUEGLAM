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
import { saveInstagramPost, deleteContent } from "../actions";
import { InstagramPost } from "@/models/InstagramPost";

export const dynamic = "force-dynamic";

export default async function InstagramAdminPage() {
  const session = await requireSession();
  const rows = await loadContent(() =>
    InstagramPost.find().sort({ position: 1, createdAt: 1 }).lean(),
  );

  return (
    <AdminShell session={session} active="/admin/content/instagram"
      title="Instagram posts"
      description="Tiles in the follow rail. Each one links to its post."
    >

      <MongoNotice />

      <section className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
        <h2 className="eyebrow mb-4">Add a post</h2>
        <ContentForm action={saveInstagramPost} submitLabel="Add post">
          <MediaField name="image" label="Image" required hint="Portrait crops best in the rail." />
          <TextField
            name="permalink"
            label="Links to"
            defaultValue="https://www.instagram.com/hueglam_official"
            placeholder="https://www.instagram.com/p/..."
          />
          <TextField name="caption" label="Caption" placeholder="Used as the image alt text" />
          <VisibilityFields />
        </ContentForm>
      </section>

      <div className="mt-8 flex flex-col gap-4">
        {rows.map((row) => (
          <section key={String(row._id)} className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="eyebrow">{row.active ? "Live" : "Hidden"}</h2>
              <DeleteButton action={deleteContent} kind="instagram" id={String(row._id)} />
            </div>
            <ContentForm action={saveInstagramPost} submitLabel="Save">
              <input type="hidden" name="id" value={String(row._id)} />
              <MediaField name="image" label="Image" defaultValue={row.image} required />
              <TextField name="permalink" label="Links to" defaultValue={row.permalink ?? ""} />
              <TextField name="caption" label="Caption" defaultValue={row.caption ?? ""} />
              <VisibilityFields active={row.active} position={row.position} />
            </ContentForm>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
