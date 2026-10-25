import { cn } from "@/lib/utils";

const neutralVariant =
  "bg-[var(--color-badge-bg)] text-[var(--color-badge-text)] border-[color-mix(in_srgb,var(--primary)_35%,transparent)]";

const pendingVariant =
  "bg-[var(--pending-bg)] text-[var(--pending-text)] border-[color-mix(in_srgb,var(--pending)_40%,transparent)]";

export function Badge({ children, className, variant = "default" }) {
  const variants = {
    default: neutralVariant,
    glass: neutralVariant,
    success:
      "bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[color-mix(in_srgb,var(--success)_70%,var(--foreground))] border-[color-mix(in_srgb,var(--success)_35%,transparent)]",
    danger:
      "bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] text-[color-mix(in_srgb,var(--danger)_70%,var(--foreground))] border-[color-mix(in_srgb,var(--danger)_35%,transparent)]",
    info:
      "bg-[color-mix(in_srgb,var(--info)_14%,transparent)] text-[color-mix(in_srgb,var(--info)_70%,var(--foreground))] border-[color-mix(in_srgb,var(--info)_35%,transparent)]",
    pending: pendingVariant,
    warning: pendingVariant,
  };

  const variantClass = Object.hasOwn(variants, variant)
    ? variants[variant]
    : variants.default;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variantClass,
        className
      )}
    >
      {children}
    </span>
  );
}
