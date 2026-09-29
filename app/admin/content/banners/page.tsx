import { requireSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { MongoNotice, loadContent } from "../shared";
import { BannersManager } from "@/components/admin/BannersManager";
import { HeroBanner } from "@/models/HeroBanner";

export const dynamic = "force-dynamic";

export default async function BannersAdminPage() {
  const session = await requireSession();
  const rows = await loadContent(() =>
    HeroBanner.find().sort({ createdAt: 1 }).lean(),
  );

  const initialBanners = rows.map((r) => ({
    _id: String(r._id),
    desktopImage: r.desktopImage,
    mobileImage: r.mobileImage,
    alt: r.alt,
    href: r.href,
    active: r.active,
    position: r.position,
  }));

  return (
    <AdminShell
      session={session}
      active="/admin/content/banners"
      title="Hero banners"
      description="The homepage slideshow. High-resolution desktop (3:1) and mobile (4:5) banners."
    >
      <MongoNotice />
      <BannersManager initialBanners={initialBanners} />
    </AdminShell>
  );
}
