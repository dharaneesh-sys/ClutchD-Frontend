import { cn } from "@/lib/utils";

/** Square shortcut tile: icon chip + label, optional count badge. ≥44px target. */
export function QuickActionTile({ icon: Icon, label, badge, onClick, disabled, className, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-2 rounded-2xl p-3",
        "border border-[var(--border)] bg-[var(--surface-card)] text-center transition-colors",
        "hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {Icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary-dark)]">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <span className="text-xs font-medium leading-tight text-[var(--foreground)]">{label}</span>
      {badge !== undefined && badge !== null && badge !== 0 && (
        <span
          className="absolute right-2 top-2 min-w-[20px] rounded-full bg-[var(--danger)] px-1.5 text-[11px] font-semibold leading-5 text-[var(--on-primary)]"
          aria-label={`${badge} new`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
