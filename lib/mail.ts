import { Resend } from "resend";
import { formatINR } from "./money";
import type { StoreOrder, StoreOrderItem } from "./types";

const apiKey = process.env.RESEND_API_KEY;
export const mailConfigured = Boolean(apiKey);

const resend = apiKey ? new Resend(apiKey) : null;

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
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY not set, skipping confirmation for " + order.orderNumber);
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.ORDER_EMAIL_FROM ?? "HUEGLAM <orders@hueglam.com>",
      to: order.email,
      bcc: process.env.ORDER_EMAIL_BCC || undefined,
      subject: "Your HUEGLAM order " + order.orderNumber,
      html: orderEmailHtml(order, items),
    });
  } catch (err) {
    console.error("[mail] failed to send confirmation for " + order.orderNumber, err);
  }
}
