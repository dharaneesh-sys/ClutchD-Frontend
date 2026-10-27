import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

// Flat-blue buttons (DESIGN.md §0). Solid fills only: no gradient, glow or ring.
const baseClass =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-dark)]",
  secondary:
    "bg-[var(--surface-card)] text-[var(--primary-dark)] border border-[var(--border)] hover:bg-[var(--color-surface-soft)]",
  tonal: "bg-[var(--color-surface-soft)] text-[var(--primary-dark)] hover:bg-[var(--color-surface-mid)]",
  outline:
    "border border-[var(--primary)] text-[var(--primary-dark)] bg-transparent hover:bg-[var(--color-surface-soft)]",
  ghost: "text-[var(--primary-dark)] bg-transparent hover:bg-[var(--color-surface-soft)]",
  danger: "bg-[var(--danger)] text-[var(--on-primary)] hover:opacity-90",
};

const sizes = {
  sm: "min-h-[44px] h-11 px-4 text-sm",
  md: "min-h-[44px] h-12 px-6 text-sm",
  lg: "min-h-[44px] h-14 px-8 text-base",
  icon: "h-11 w-11",
};

export const Button = forwardRef(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const variantClass = Object.hasOwn(variants, variant) ? variants[variant] : variants.primary;
    const sizeClass = Object.hasOwn(sizes, size) ? sizes[size] : sizes.md;

    return (
      <button
        ref={ref}
        className={cn(baseClass, variantClass, sizeClass, className)}
        disabled={isLoading || props.disabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
