import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  info: "bg-[var(--surface-soft)] text-[var(--primary-dark)] border-[color-mix(in_srgb,var(--primary)_30%,transparent)]",
  pending: "bg-[var(--pending-soft)] text-[var(--pending-ink)] border-[color-mix(in_srgb,var(--pending)_35%,transparent)]",
  success:
    "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)] border-[color-mix(in_srgb,var(--success)_35%,transparent)]",
  danger:
    "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger-ink)] border-[color-mix(in_srgb,var(--danger)_35%,transparent)]",
  neutral: "bg-[var(--surface-soft)] text-[var(--text-muted)] border-[var(--border)]",
};

// Full status map (DESIGN.md §0). Labels are text so status never relies on colour.
export const STATUS_META = {
  searching: { label: "Finding a mechanic", tone: "info" },
  providers_notified: { label: "Finding a mechanic", tone: "info" },
  assigned: { label: "Assigned", tone: "info" },
  en_route: { label: "On the way", tone: "pending" },
  in_progress: { label: "In service", tone: "pending" },
  payment_pending: { label: "Awaiting payment", tone: "pending" },
  payment_escrow: { label: "Payment", tone: "pending" },
  payment_released: { label: "Payment", tone: "pending" },
  payment_dispute: { label: "Disputed", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export function statusMeta(status) {
  if (typeof status === "string" && Object.hasOwn(STATUS_META, status)) return STATUS_META[status];
  return { label: status ? String(status) : "—", tone: "neutral" };
}

export function StatusPill({ status, label, className }) {
  const meta = statusMeta(status);
  return (
    <span
      data-tone={meta.tone}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        TONE_CLASSES[meta.tone],
        className
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? meta.label}
    </span>
  );
}
