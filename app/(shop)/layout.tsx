import { CartProvider } from "@/components/CartProvider";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollToTop } from "@/components/ScrollToTop";
import { getPublishedProducts } from "@/lib/queries";
import { getCustomerSession } from "@/lib/customer-auth";
import { getAnnouncements } from "@/lib/content";

/**
 * Storefront chrome. The black announcement bar sits above the header on every
 * page; the scrolling "clearance sale" marquee is a homepage section on the
 * live site, not global, so it lives in the homepage instead.
 * The admin panel sits outside this group entirely.
 */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The cart drawer recommends other products, so the catalogue is loaded here
  // once for the whole storefront rather than fetched again in the client.
  const [products, customer, announcements] = await Promise.all([
    getPublishedProducts(),
    getCustomerSession(),
    getAnnouncements(),
  ]);

  return (
    <CartProvider>
      <AnnouncementBar messages={announcements} />
      <SiteHeader products={products} customer={customer} />
      <main>{children}</main>
      <SiteFooter />
      <ScrollToTop />
    </CartProvider>
  );
}
