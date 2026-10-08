import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseClass = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary:
        "bg-gradient-to-b from-[var(--primary-light)] via-[var(--primary)] to-[var(--primary-dark)] text-[var(--background)] " +
        "shadow-[0_10px_26px_rgba(var(--color-primary-rgb),0.25)] " +
        "ring-1 ring-primary/25 hover:ring-primary/35 " +
        "hover:shadow-[0_16px_40px_rgba(var(--color-primary-rgb),0.22)] hover-lift",
      secondary:
        "bg-[var(--surface-container)] text-[var(--primary)] " +
        "border border-[var(--color-border-subtle)] hover:bg-[var(--surface-container-high)]",
      tonal:
        "bg-[var(--color-surface-soft)] text-[var(--primary)] " +
        "hover:bg-[var(--color-surface-mid)] " +
        "shadow-none",
      outline:
        "border-2 border-[var(--primary)] text-[var(--primary)] " +
        "bg-transparent hover:bg-[var(--color-surface-soft)] " +
        "shadow-none",
      ghost:
        "text-[var(--primary)] border border-transparent " +
        "hover:bg-[var(--color-surface-soft)] hover:border-[var(--color-border-subtle)]",
      danger:
        "bg-[var(--danger)] text-white " +
        "shadow-[0_10px_26px_color-mix(in_srgb,var(--danger)_30%,transparent)] ring-1 ring-danger/25 " +
        "hover:brightness-110 hover-lift",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(baseClass, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
