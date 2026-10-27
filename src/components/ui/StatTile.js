import { cn } from "@/lib/utils";

const TONES = {
  default: "bg-[var(--surface-soft)] text-[var(--primary-dark)]",
  success: "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]",
  pending: "bg-[var(--pending-soft)] text-[var(--pending-ink)]",
  danger: "bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger-ink)]",
};

/**
 * Flat stat tile. `value` renders as given; pass "—" (the default) when the
 * real value is unknown. Never pass invented numbers.
 */
export function StatTile({ label, value = "—", hint, icon: Icon, tone = "default", className }) {
  const toneClass = Object.hasOwn(TONES, tone) ? TONES[tone] : TONES.default;
  const shown = value === null || value === undefined || value === "" ? "—" : value;

  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {Icon && (
        <span className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", toneClass)}>
          <Icon size={18} aria-hidden="true" />
        </span>
      )}
      <p className="truncate text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold text-[var(--foreground)]">{shown}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}
