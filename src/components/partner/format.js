import { ISSUE_TAGS } from "@/lib/constants";

/** ₹ amount or "—" when not a real number (never NaN, never a default). */
export function money(v, digits = 2) {
  const n = Number(v);
  return v === null || v === undefined || v === "" || !Number.isFinite(n) ? "—" : `₹${n.toFixed(digits)}`;
}

export function issueLabel(tag) {
  return ISSUE_TAGS.find((t) => t.value === tag)?.label || tag || "Service request";
}

export function timeLabel(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function realTotal(job) {
  const t = job?.pricing?.totalAmount;
  return t !== null && t !== undefined && Number.isFinite(Number(t)) ? Number(t) : null;
}
