import { cn } from "@/lib/utils";

// Flat card surface. Legacy variant names are accepted so inherited call
// sites keep rendering a visible surface; task 6 migrates them to the final
// primitive API. Unknown variants resolve here instead of passing an
// arbitrary string through as a class.
const flatCard =
  "bg-[var(--surface)] border border-[var(--color-border-subtle)] shadow-[var(--elevation-1)]";

const variantClasses = {
  "glass-lux": flatCard,
  "glass-lux-interactive": flatCard,
  strong: flatCard,
  outlined: flatCard,
  flat: flatCard,
  glass: flatCard,
  elevated: flatCard,
  filled: flatCard,
};

export function GlassCard({ children, className, variant = "glass-lux", ...props }) {
  const variantClass = Object.hasOwn(variantClasses, variant)
    ? variantClasses[variant]
    : flatCard;

  return (
    <div
      className={cn(
        "relative rounded-2xl transition-all duration-200",
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
