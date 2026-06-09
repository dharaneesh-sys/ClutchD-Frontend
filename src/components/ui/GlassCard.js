import { cn } from "../../lib/utils";

const variantClasses = {
  glass: "glass",
  "glass-strong": "glass-strong",
  "glass-interactive": "glass glass-hover",
  "glass-lux": "glass-lux",
  "glass-lux-strong": "glass-lux-strong",
  "glass-lux-interactive": "glass-lux-interactive hover-lift",
  elevated: "surface-elevated",
  filled: "surface-filled",
  outlined: "surface-outlined",
};

export function GlassCard({ children, className, variant = "glass", animateBorder = false, ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl transition-all duration-200",
        variantClasses[variant] || variantClasses.glass,
        animateBorder && "glass-lux-border-animated",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
