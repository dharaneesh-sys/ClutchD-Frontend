import { cn } from "../../lib/utils";
import { useThemeStore } from "../../store/themeStore";

export function GlassCard({ children, className, variant = "normal", ...props }) {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <div
      className={cn(
        "relative rounded-2xl transition-colors",
        isLight
          ? cn(
              "border border-stone-200/70 bg-white/85 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]",
              variant === "strong" && "bg-white/95 border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_32px_rgba(0,0,0,0.05)]",
              variant === "interactive" && "bg-white/85 hover:bg-white hover:border-amber-400/30 hover:shadow-[0_8px_30px_rgba(212,160,17,0.06)] transition-all"
            )
          : cn(
              "backdrop-blur-xl border border-white/10 bg-gradient-to-b from-white/08 to-white/0 shadow-[0_10px_40px_rgba(0,0,0,0.35)]",
              variant === "strong" && "bg-gradient-to-b from-white/12 to-white/0 border-white/15 shadow-[0_20px_70px_rgba(0,0,0,0.55)]",
              variant === "interactive" && "bg-gradient-to-b from-white/08 to-white/0 hover:bg-white/10 hover:border-emerald-400/30 hover:shadow-[0_18px_55px_rgba(16,185,129,0.12)] hover:shadow-emerald-500/10 transition-all"
            ),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
