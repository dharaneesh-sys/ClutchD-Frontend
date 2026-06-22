import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const Button = forwardRef(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    const baseClass = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary:
        "bg-gradient-to-b from-primary via-primary to-primary-dark text-white " +
        "shadow-[0_10px_26px_rgba(var(--color-primary-rgb),0.25)] " +
        "ring-1 ring-primary/25 hover:ring-primary/35 " +
        "hover:shadow-[0_16px_40px_rgba(var(--color-primary-rgb),0.22)] hover-lift",
      secondary:
        "bg-gradient-to-b from-white/10 to-white/5 text-primary-light " +
        "border border-white/15 ring-1 ring-white/10 hover:bg-white/15 hover:border-white/25",
      tonal:
        "bg-primary/20 text-primary-light " +
        "hover:bg-primary/30 hover:text-primary " +
        "shadow-none",
      outline:
        "border-2 border-primary/70 text-primary-light " +
        "bg-transparent hover:bg-primary/10 hover:border-primary/80 " +
        "shadow-[0_0_0_1px_rgba(var(--color-primary-rgb),0.18)]",
      ghost: "hover:bg-white/10 text-primary-light border border-transparent hover:border-white/10",
      danger:
        "bg-gradient-to-b from-red-500 via-red-500 to-red-600 text-white " +
        "shadow-[0_10px_26px_rgba(239,68,68,0.22)] ring-1 ring-red-300/20 " +
        "hover:shadow-[0_16px_40px_rgba(239,68,68,0.20)] hover-lift",
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
