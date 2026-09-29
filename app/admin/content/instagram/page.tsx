import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { MongoNotice, loadContent } from "../shared";
import { InstagramManager } from "@/components/admin/InstagramManager";
import { InstagramPost } from "@/models/InstagramPost";

export const dynamic = "force-dynamic";

export default async function InstagramAdminPage() {
  const session = await requireSession();
  const rows = await loadContent(() =>
    InstagramPost.find().sort({ position: 1, createdAt: 1 }).lean(),
  );

  const initialPosts = rows.map((r) => ({
    _id: String(r._id),
    image: r.image,
    permalink: r.permalink,
    caption: r.caption,
    active: r.active,
  }));

  return (
    <AdminShell
      session={session}
      active="/admin/content/instagram"
      title="Instagram"
      description="Visual gallery tiles in the 'Follow Us on Instagram' rail on your storefront."
    >
      <MongoNotice />
      <InstagramManager initialPosts={initialPosts} />
    </AdminShell>
  );
}
