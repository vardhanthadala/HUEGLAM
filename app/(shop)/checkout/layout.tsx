import { getCustomerSession } from "@/lib/customer-auth";
import { CheckoutAuthGate } from "@/components/CheckoutAuthGate";

/**
 * Checkout is account-only. Gating here rather than inside the page keeps the
 * check on the server: the form is never sent to a signed-out browser, so it
 * cannot be bypassed from the client.
 */
export const dynamic = "force-dynamic";

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCustomerSession();
  if (!customer) return <CheckoutAuthGate />;
  return <>{children}</>;
}
