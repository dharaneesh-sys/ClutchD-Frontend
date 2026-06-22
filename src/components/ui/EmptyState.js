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
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border",
        "bg-surface-container-low border-border-subtle",
        className
      )}
    >
      {Icon && (
        <Icon
          size={48}
          className="mb-4 opacity-40 text-text-dim"
        />
      )}
      <h3 className="text-lg font-semibold mb-1 text-foreground">
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-sm text-text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
