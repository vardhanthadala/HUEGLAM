import crypto from "node:crypto";
import Razorpay from "razorpay";

export const razorpayConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
);

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayConfigured) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }
  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

/**
 * Confirms a payment really came from Razorpay. The signature is an HMAC of
 * "<order_id>|<payment_id>" keyed with our secret, so a forged client callback
 * cannot mark an order paid.
 */
export function verifyPaymentSignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(params.razorpayOrderId + "|" + params.razorpayPaymentId)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(params.signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Verifies a Razorpay webhook body against the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
