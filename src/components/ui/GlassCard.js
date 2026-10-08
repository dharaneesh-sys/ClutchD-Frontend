import { cn } from "@/lib/utils";

// D5: exactly two sanctioned variants. Unknown strings pass through as-is
// (one-release escape hatch for not-yet-migrated callers); unknown
// variants resolve to glass-lux via the lookup fallback below.
const variantClasses = {
  "glass-lux": "glass-lux",
  "glass-lux-interactive": "glass-lux-interactive",
};

export function GlassCard({ children, className, variant = "glass-lux", ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl transition-all duration-200",
        variantClasses[variant] || variant || variantClasses["glass-lux"],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
