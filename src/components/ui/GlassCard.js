import { cn } from "@/lib/utils";

const variantClasses = {
  glass: "glass",
  "glass-strong": "glass-strong",
  "glass-interactive": "glass glass-hover",
  "glass-lux": "glass-lux",
  "glass-lux-strong": "glass-lux-strong",
  "glass-lux-interactive": "glass-lux-interactive",
  elevated: "surface-elevated",
  filled: "surface-filled",
  outlined: "surface-outlined",
};

export function GlassCard({ children, className, variant = "glass", ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl transition-all duration-200",
        variantClasses[variant] || variantClasses.glass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
