import { Resend } from "resend";
import { formatINR } from "./money";
import type { StoreOrder, StoreOrderItem } from "./types";

export const mailConfigured = Boolean(process.env.RESEND_API_KEY);

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function orderEmailHtml(order: StoreOrder, items: StoreOrderItem[]): string {
  const rows = items
    .map(
      (i) =>
        '<tr><td style="padding:10px 0;border-bottom:1px solid #eee">' +
        escapeHtml(i.title) +
        '<br><span style="color:#888;font-size:12px">Qty ' +
        i.quantity +
        "</span></td>" +
        '<td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap">' +
        formatINR(i.lineTotal) +
        "</td></tr>",
    )
    .join("");

  const totalRow = (label: string, value: string, bold = false) =>
    '<tr><td style="padding:4px 0' +
    (bold ? ";font-weight:600" : "") +
    '">' +
    label +
    '</td><td style="padding:4px 0;text-align:right' +
    (bold ? ";font-weight:600" : "") +
    '">' +
    value +
    "</td></tr>";

  return [
    '<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#212529">',
    '<h1 style="letter-spacing:.2em;font-size:18px;text-align:center;margin:24px 0">HUEGLAM</h1>',
    '<p style="font-size:15px">Hi ' + escapeHtml(order.customerName) + ",</p>",
    '<p style="font-size:15px">Thanks for your order. We have received your payment and will ship it within 2 business days.</p>',
    '<p style="font-size:13px;color:#666">Order <strong>' +
      escapeHtml(order.orderNumber) +
      "</strong></p>",
    '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">' +
      rows +
      "</table>",
    '<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px">',
    totalRow("Subtotal", formatINR(order.subtotal)),
    order.discount > 0 ? totalRow("Discount", "-" + formatINR(order.discount)) : "",
    totalRow("Shipping", order.shipping === 0 ? "Free" : formatINR(order.shipping)),
    totalRow("Total", formatINR(order.total), true),
    "</table>",
    '<p style="font-size:13px;color:#666;margin-top:24px">Shipping to:<br>' +
      escapeHtml(order.customerName) +
      "<br>" +
      escapeHtml(order.addressLine1) +
      (order.addressLine2 ? "<br>" + escapeHtml(order.addressLine2) : "") +
      "<br>" +
      escapeHtml(order.city) +
      ", " +
      escapeHtml(order.state) +
      " " +
      escapeHtml(order.pincode) +
      "<br>" +
      escapeHtml(order.phone) +
      "</p>",
    '<p style="font-size:12px;color:#999;margin-top:28px">Questions? Reply to this email or write to support@hueglam.com.</p>',
    "</div>",
  ].join("");
}

/**
 * Sends the order confirmation. Never throws: a mail failure must not roll back
 * a payment that already succeeded, so problems are logged and swallowed.
 */
export async function sendOrderConfirmation(order: StoreOrder, items: StoreOrderItem[]) {
  const resend = getResend();
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY not set, skipping confirmation for " + order.orderNumber);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.ORDER_EMAIL_FROM ?? "HUEGLAM <support@hueglam.com>",
      to: order.email,
      bcc: process.env.ORDER_EMAIL_BCC || undefined,
      subject: "Your HUEGLAM order " + order.orderNumber,
      html: orderEmailHtml(order, items),
    });
  } catch (err) {
    console.error("[mail] failed to send confirmation for " + order.orderNumber, err);
  }
}

export async function sendOrderCancellation(
  order: StoreOrder,
  reason: string,
) {
  const resend = getResend();
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY not set, skipping cancellation email for " + order.orderNumber);
    return;
  }

  try {
    const html = [
      '<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#212529">',
      '<h1 style="letter-spacing:.2em;font-size:18px;text-align:center;margin:24px 0">HUEGLAM</h1>',
      '<p style="font-size:15px">Hi ' + escapeHtml(order.customerName) + ",</p>",
      '<p style="font-size:15px">Your order <strong>' + escapeHtml(order.orderNumber) + '</strong> has been cancelled.</p>',
      reason ? '<p style="font-size:14px;background:#f9f9f9;padding:12px;border-left:3px solid #111"><strong>Reason:</strong> ' + escapeHtml(reason) + '</p>' : '',
      '<p style="font-size:14px;color:#555">If any payment was captured, a full refund will be processed back to your original payment method in 5-7 business days.</p>',
      '<p style="font-size:12px;color:#999;margin-top:28px">Questions? Reply to this email or write to support@hueglam.com.</p>',
      "</div>",
    ].join("");

    await resend.emails.send({
      from: process.env.ORDER_EMAIL_FROM ?? "HUEGLAM <support@hueglam.com>",
      to: order.email,
      bcc: process.env.ORDER_EMAIL_BCC || undefined,
      subject: "Order Cancelled - HUEGLAM " + order.orderNumber,
      html,
    });
  } catch (err) {
    console.error("[mail] failed to send cancellation email for " + order.orderNumber, err);
  }
}

export async function sendAdminPasswordReset(email: string, resetUrl: string) {
  const resend = getResend();
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY not set, password reset link:", resetUrl);
    return;
  }

  try {
    const html = [
      '<div style="font-family:Helvetica,Arial,sans-serif;max-width:540px;margin:0 auto;color:#212529;padding:20px 0;">',
      '<div style="text-align:center;margin-bottom:24px;">',
      '<h1 style="letter-spacing:.25em;font-size:20px;margin:0;font-weight:600;">HUEGLAM</h1>',
      '<p style="font-size:12px;color:#888;letter-spacing:.1em;margin-top:4px;">STORE ADMINISTRATION</p>',
      '</div>',
      '<div style="background:#ffffff;border:1px solid #ebedf1;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">',
      '<h2 style="font-size:18px;margin-top:0;margin-bottom:12px;font-weight:600;">Reset your admin password</h2>',
      '<p style="font-size:14px;color:#4b5563;line-height:1.6;margin-bottom:24px;">',
      'We received a request to reset the password for your HUEGLAM store admin account (<strong>' + escapeHtml(email) + '</strong>). Click the button below to choose a new password:',
      '</p>',
      '<div style="text-align:center;margin-bottom:24px;">',
      '<a href="' + resetUrl + '" style="background:#111827;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:500;display:inline-block;">Reset Password</a>',
      '</div>',
      '<p style="font-size:12px;color:#6b7280;line-height:1.5;">',
      'This link is valid for <strong>15 minutes</strong> only. If you did not request a password reset, please ignore this email or review your account security.',
      '</p>',
      '<p style="font-size:11px;color:#9ca3af;word-break:break-all;margin-top:20px;">',
      'Button not working? Copy and paste this URL into your browser:<br>' + resetUrl,
      '</p>',
      '</div>',
      '</div>',
    ].join("");

    await resend.emails.send({
      from: process.env.ORDER_EMAIL_FROM ?? "HUEGLAM <support@hueglam.com>",
      to: email,
      subject: "Reset your HUEGLAM admin password",
      html,
    });
  } catch (err) {
    console.error("[mail] failed to send password reset email:", err);
  }
}

