import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One list row: leading icon, title/subtitle, trailing slot, optional chevron.
 * With `onClick` it is a keyboard-activatable button (Enter/Space).
 */
export function ListRow({
  icon: Icon,
  leading,
  title,
  subtitle,
  trailing,
  chevron = false,
  onClick,
  className,
  ...props
}) {
  const interactive = typeof onClick === "function";
  const Tag = interactive ? "button" : "div";

  return (
    <Tag
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full min-h-[56px] items-center gap-3 px-4 py-3 text-left",
        interactive &&
          "transition-colors hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]",
        className
      )}
      {...props}
    >
      {leading ??
        (Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--primary-dark)]">
            <Icon size={18} aria-hidden="true" />
          </span>
        ))}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--foreground)]">{title}</span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{subtitle}</span>
        )}
      </span>
      {trailing && <span className="shrink-0 text-sm text-[var(--foreground)]">{trailing}</span>}
      {chevron && (
        <ChevronRight size={18} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
      )}
    </Tag>
  );
}
