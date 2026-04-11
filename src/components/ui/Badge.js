import { cn } from "../../lib/utils";
import { useThemeStore } from "../../store/themeStore";

export function Badge({ children, className, variant = "default" }) {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  const darkVariants = {
    default:
      "bg-gradient-to-b from-emerald-500/25 to-emerald-500/10 text-emerald-300 border-emerald-500/35",
    success:
      "bg-gradient-to-b from-green-500/25 to-green-500/10 text-green-300 border-green-500/35",
    warning:
      "bg-gradient-to-b from-amber-500/25 to-amber-500/10 text-amber-300 border-amber-500/35",
    danger:
      "bg-gradient-to-b from-red-500/25 to-red-500/10 text-red-300 border-red-500/35",
    info:
      "bg-gradient-to-b from-blue-500/25 to-blue-500/10 text-blue-300 border-blue-500/35",
    glass: "bg-gradient-to-b from-white/15 to-white/5 text-white/90 border-white/25",
  };

  const lightVariants = {
    default:
      "bg-amber-50 text-amber-800 border-amber-200",
    success:
      "bg-green-50 text-green-700 border-green-200",
    warning:
      "bg-orange-50 text-orange-700 border-orange-200",
    danger:
      "bg-red-50 text-red-700 border-red-200",
    info:
      "bg-blue-50 text-blue-700 border-blue-200",
    glass: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const variants = isLight ? lightVariants : darkVariants;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        isLight
          ? "shadow-none"
          : "backdrop-blur-xl shadow-[0_10px_30px_rgba(var(--color-black-rgb),0.25)]",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
