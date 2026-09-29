import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { MongoNotice, loadContent } from "../shared";
import { ReelsManager } from "@/components/admin/ReelsManager";
import { Reel } from "@/models/Reel";
import { getPublishedProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReelsAdminPage() {
  const session = await requireSession();
  const [rows, products] = await Promise.all([
    loadContent(() => Reel.find().sort({ position: 1, createdAt: 1 }).lean()),
    getPublishedProducts(),
  ]);

  const handles = products.map((p) => ({ handle: p.handle, title: p.title }));
  const initialReels = rows.map((r) => ({
    _id: String(r._id),
    video: r.video,
    poster: r.poster,
    productHandle: r.productHandle,
    alt: r.alt,
    active: r.active,
  }));

  return (
    <AdminShell
      session={session}
      active="/admin/content/reels"
      title="Reels"
      description="Portrait 9:16 shoppable video demonstrations featured on the homepage."
    >
      <MongoNotice />
      <ReelsManager initialReels={initialReels} products={handles} />
    </AdminShell>
  );
}

