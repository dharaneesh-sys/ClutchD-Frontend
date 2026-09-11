// Client-side receipt / invoice downloads that work with the backend OFF.
//
// Builds a printable HTML document from data already in local stores and
// saves it with a dependency-free Blob + anchor download. No npm deps.

function text(value, fallback = "\u2014") {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str.length > 0 ? str : fallback;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeFilename(name, fallback = "document") {
  const clean = String(name ?? fallback)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return clean.length > 0 ? clean : fallback;
}

export function formatMoney(amount) {
  if (amount === null || amount === undefined || amount === "") return "\u2014";
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortId(id) {
  const str = String(id ?? "").trim();
  return str.length > 0 ? str.slice(0, 8) : "unknown";
}

export function buildDocumentHtml({ title, subtitle = "", rows = [], notes = [] }) {
  const safeTitle = escapeHtml(text(title, "Receipt"));
  const rowHtml = rows
    .map(
      ([label, value]) =>
        `      <tr><th>${escapeHtml(String(label))}</th><td>${escapeHtml(String(value))}</td></tr>`
    )
    .join("\n");
  const notesHtml = notes
    .filter((n) => String(n ?? "").trim().length > 0)
    .map((n) => `    <p class="note">${escapeHtml(String(n))}</p>`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; color: #111; background: #fff; }
  .sheet { max-width: 640px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .subtitle { color: #555; font-size: 13px; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  th { width: 38%; color: #555; font-weight: 600; }
  .note { font-size: 12px; color: #666; }
  .generated { margin-top: 20px; font-size: 11px; color: #999; }
</style>
</head>
<body>
<main class="sheet">
  <h1>${safeTitle}</h1>
${subtitle ? `  <p class="subtitle">${escapeHtml(String(subtitle))}</p>\n` : ""}<table>
${rowHtml}
  </table>
${notesHtml ? `${notesHtml}\n` : ""}  <p class="generated">Generated offline by ClutchD from data on this device.</p>
</main>
</body>
</html>`;
}

export function triggerFileDownload({ filename, content, mimeType = "text/html;charset=utf-8" }) {
  const safeName = sanitizeFilename(filename);
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", safeName);
  document.body.appendChild(link);
  link.click();
  if (link.parentNode) link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
  return safeName;
}

export function downloadDocument({ filename, title, subtitle = "", rows = [], notes = [] }) {
  const html = buildDocumentHtml({ title, subtitle, rows, notes });
  return triggerFileDownload({ filename, content: html });
}

function pricingRows(pricing) {
  if (!pricing) return [];
  const rows = [
    ["Service Fee", formatMoney(pricing.serviceAmount ?? 0)],
    ["Convenience Fee", formatMoney(pricing.convenienceFee ?? 0)],
  ];
  if (Number(pricing.cancellationFee ?? 0) > 0) {
    rows.push(["Cancellation Fee", formatMoney(pricing.cancellationFee)]);
  }
  if (Number(pricing.distanceFee ?? 0) > 0) {
    rows.push([
      `Distance (${Number(pricing.distanceKm ?? 0).toFixed(1)} km)`,
      formatMoney(pricing.distanceFee),
    ]);
  }
  if (Number(pricing.gstAmount ?? 0) > 0) {
    rows.push(["GST (18%)", formatMoney(pricing.gstAmount)]);
  }
  rows.push([
    "Grand Total",
    formatMoney(pricing.totalAmount ?? pricing.grandTotal ?? 0),
  ]);
  return rows;
}

export function downloadPaymentReceipt(payment = {}) {
  const id = shortId(payment.id ?? payment.transactionId);
  return downloadDocument({
    filename: `receipt_${id}.html`,
    title: `Payment Receipt #${id.toUpperCase()}`,
    subtitle: `Generated ${formatDateTime(payment.created_at ?? payment.createdAt)}`,
    rows: [
      ["Status", text(payment.status, "unknown")],
      ["Amount", formatMoney(payment.amount)],
      ["Method", text(payment.method, "N/A")],
      ["Provider", text(payment.provider, "N/A")],
      ["Transaction", text(payment.transactionId ?? payment.transaction_id, "N/A")],
      ["Date", formatDateTime(payment.created_at ?? payment.createdAt)],
    ],
    notes: ["Thank you for choosing ClutchD."],
  });
}

export function downloadOrderReceipt(order = {}) {
  const id = shortId(order.id);
  const mechanic = order.assigned_mechanic ?? order.assignedMechanic ?? null;
  return downloadDocument({
    filename: `receipt_${id}.html`,
    title: `Order Receipt #${id.toUpperCase()}`,
    subtitle: `Generated ${formatDateTime(order.created_at ?? order.createdAt)}`,
    rows: [
      ["Order ID", text(order.id, id)],
      ["Service", text(order.issue_tag ?? order.issueTag, "Service")],
      ["Status", text(order.status, "unknown")],
      ["Date", formatDateTime(order.created_at ?? order.createdAt)],
      ["Amount", formatMoney(order.total_amount ?? order.totalAmount)],
      ["Mechanic", mechanic ? text(mechanic.name) : "N/A"],
      ["Description", text(order.description, "N/A")],
      ...pricingRows(order.pricing),
    ],
    notes: ["Thank you for choosing ClutchD."],
  });
}

export function buildJobInvoiceText(job = {}) {
  const id = shortId(job.id).toUpperCase();
  const pricing = job.pricing ?? {};
  return [
    `Invoice #${id}`,
    `Service: ${text(job.issueTag ?? job.issue_tag, "Service")}`,
    `Status: ${text(job.status, "unknown")}`,
    `Date: ${formatDateTime(job.createdAt ?? job.created_at)}`,
    `Description: ${text(job.description, "N/A")}`,
    "",
    "--- Pricing Breakdown ---",
    `Service Fee: ${formatMoney(pricing.serviceAmount ?? 0)}`,
    `Convenience Fee: ${formatMoney(pricing.convenienceFee ?? 0)}`,
    `Cancellation Fee: ${formatMoney(pricing.cancellationFee ?? 0)}`,
    `Distance (${Number(pricing.distanceKm ?? 0).toFixed(1)} km): ${formatMoney(pricing.distanceFee ?? 0)}`,
    `GST (18%): ${formatMoney(pricing.gstAmount ?? 0)}`,
    `Grand Total: ${formatMoney(pricing.totalAmount ?? 0)}`,
    "",
    "Thank you for choosing ClutchD!",
  ].join("\n");
}

export function downloadJobInvoice(job = {}) {
  const id = shortId(job.id);
  const mechanic = job.mechanic ?? job.assigned_mechanic ?? null;
  return downloadDocument({
    filename: `invoice_${id}.html`,
    title: `Invoice #${id.toUpperCase()}`,
    subtitle: `Generated ${formatDateTime(job.createdAt ?? job.created_at)}`,
    rows: [
      ["Job ID", text(job.id, id)],
      ["Service", text(job.issueTag ?? job.issue_tag, "Service")],
      ["Status", text(job.status, "unknown")],
      ["Date", formatDateTime(job.createdAt ?? job.created_at)],
      ["Mechanic", mechanic ? text(mechanic.name) : "N/A"],
      ["Description", text(job.description, "N/A")],
      ...pricingRows(job.pricing),
    ],
    notes: [
      "Service fee paid to your provider. Platform fees paid to ClutchD.",
      "Thank you for choosing ClutchD!",
    ],
  });
}
