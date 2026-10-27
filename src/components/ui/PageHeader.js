import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Screen header. Pass `onBack` only on pushed/detail screens — top-level tabs
 * never render a back arrow (DESIGN.md §0 nav rules).
 */
export function PageHeader({ title, subtitle, onBack, action, className }) {
  return (
    <header className={cn("flex items-center gap-3", className)}>
      {typeof onBack === "function" && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--foreground)] hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold text-[var(--foreground)]">{title}</h1>
        {subtitle && <p className="truncate text-sm text-[var(--text-muted)]">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
