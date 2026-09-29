/**
 * Order pricing. This is the only place totals are decided, and it runs on the
 * server against database prices — the browser's cart is display-only, so a
 * tampered client payload cannot change what is charged.
 */

export const FREE_SHIPPING_THRESHOLD = Number(
  process.env.FREE_SHIPPING_THRESHOLD ?? 99900,
);
export const SHIPPING_FLAT_RATE = Number(process.env.SHIPPING_FLAT_RATE ?? 4900);

export type PricedLine = {
  productId: string;
  title: string;
  handle: string;
  sku: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CouponInput = {
  code: string;
  type: string;
  value: number;
  minSubtotal: number;
} | null;

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
}

export function discountFor(subtotal: number, coupon: CouponInput): number {
  if (!coupon) return 0;
  if (subtotal < coupon.minSubtotal) return 0;

  const raw =
    coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  // Never discount below zero.
  return Math.min(raw, subtotal);
}

export function priceOrder(lines: PricedLine[], coupon: CouponInput) {
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const discount = discountFor(subtotal, coupon);
  const shipping = shippingFor(subtotal - discount);
  const total = subtotal - discount + shipping;
  return { subtotal, discount, shipping, total };
}

/**
 * HG + base-36 timestamp + 5 random chars.
 * The order number is also the confirmation URL, so the random tail is there to
 * make order pages impractical to enumerate, not just to avoid collisions.
 */
export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  let noise = "";
  for (const byte of bytes) noise += alphabet[byte % alphabet.length];
  return "HG" + stamp + noise;
}
