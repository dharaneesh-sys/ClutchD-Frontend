import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 px-6 text-center rounded-2xl border",
        "bg-[var(--surface-card)] border-[var(--border)]",
        className
      )}
    >
      {Icon && (
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--primary-dark)]">
          <Icon size={26} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold mb-1 text-[var(--foreground)]">
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm text-[var(--text-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
