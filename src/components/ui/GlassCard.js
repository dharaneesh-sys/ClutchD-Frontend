import { cn } from "@/lib/utils";

// Content surfaces are flat white cards (DESIGN.md §0). `variant="glass"`
// (alias `overlay`) is the one translucent surface and is reserved for bottom
// nav, sheets, map controls and the splash. Legacy and unknown variant names
// resolve to the flat card so inherited call sites keep a visible surface.
const flatCard =
  "bg-[var(--surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-card)]";

const interactiveCard =
  flatCard +
  " cursor-pointer hover:border-[var(--border-strong)] active:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

const glassOverlay =
  "bg-[var(--glass-overlay-bg)] border border-[var(--glass-overlay-border)] shadow-[var(--shadow-card)] backdrop-blur-[var(--glass-overlay-blur)]";

const variantClasses = {
  card: flatCard,
  flat: flatCard,
  interactive: interactiveCard,
  glass: glassOverlay,
  overlay: glassOverlay,
  // legacy names → flat
  "surface-card": flatCard,
  "surface-card-interactive": interactiveCard,
  strong: flatCard,
  outlined: flatCard,
  elevated: flatCard,
  filled: flatCard,
};

export function GlassCard({ children, className, variant = "card", ...props }) {
  const variantClass = Object.hasOwn(variantClasses, variant)
    ? variantClasses[variant]
    : flatCard;

  return (
    <div
      className={cn("relative rounded-2xl transition-colors duration-150", variantClass, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { GlassCard as Card };
