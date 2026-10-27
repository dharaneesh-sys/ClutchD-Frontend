import { cn } from "@/lib/utils";

/** Section title with an optional trailing action (e.g. "See all"). */
export function SectionHeader({ title, action, as: Heading = "h2", className }) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <Heading className="text-base font-semibold text-[var(--foreground)]">{title}</Heading>
      {action && <div className="shrink-0 text-sm font-medium text-[var(--primary-dark)]">{action}</div>}
    </div>
  );
}
