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
import { saveReel, deleteContent } from "../actions";
import { Reel } from "@/models/Reel";
import { getPublishedProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Handle = { handle: string; title: string };

/** Defined at module scope: a component created inside render would be a new
 *  type on every pass, remounting the select and losing its value. */
function ProductPicker({
  handles,
  value = "",
}: {
  handles: Handle[];
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow">Promoted product</span>
      <select
        name="productHandle"
        defaultValue={value}
        className="border border-line bg-ground px-3 py-2.5 text-sm outline-none focus:border-ink"
      >
        <option value="">None</option>
        {handles.map((p) => (
          <option key={p.handle} value={p.handle}>
            {p.title}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function ReelsAdminPage() {
  const session = await requireSession();
  const [rows, products] = await Promise.all([
    loadContent(() => Reel.find().sort({ position: 1, createdAt: 1 }).lean()),
    getPublishedProducts(),
  ]);

  const handles = products.map((p) => ({ handle: p.handle, title: p.title }));

  return (
    <AdminShell session={session} active="/admin/content/reels"
      title="Reels"
      description="Shoppable videos on the homepage. Portrait 9:16 works best."
    >

      <MongoNotice />

      <section className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
        <h2 className="eyebrow mb-4">Add a reel</h2>
        <ContentForm action={saveReel} submitLabel="Add reel">
          <MediaField name="video" label="Video" accept="video/mp4,video/webm" required hint="MP4 or WebM, up to 25MB. Compress before uploading." />
          <MediaField name="poster" label="Poster frame" hint="Shown before the video plays." />
          <ProductPicker handles={handles} />
          <TextField name="alt" label="Description for screen readers" placeholder="Creator applying the serum" />
          <VisibilityFields />
        </ContentForm>
      </section>

      <div className="mt-8 flex flex-col gap-4">
        {rows.map((row) => (
          <section key={String(row._id)} className="rounded-[14px] border border-[#ebedf1] bg-white p-5 shadow-[0_1px_3px_rgba(17,24,39,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="eyebrow">{row.active ? "Live" : "Hidden"}</h2>
              <DeleteButton action={deleteContent} kind="reel" id={String(row._id)} />
            </div>
            <ContentForm action={saveReel} submitLabel="Save">
              <input type="hidden" name="id" value={String(row._id)} />
              <MediaField name="video" label="Video" accept="video/mp4,video/webm" defaultValue={row.video} required />
              <MediaField name="poster" label="Poster frame" defaultValue={row.poster ?? ""} />
              <ProductPicker handles={handles} value={row.productHandle ?? ""} />
              <TextField name="alt" label="Description for screen readers" defaultValue={row.alt ?? ""} />
              <VisibilityFields active={row.active} position={row.position} />
            </ContentForm>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
