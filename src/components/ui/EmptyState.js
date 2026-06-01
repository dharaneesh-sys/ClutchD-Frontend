import { cn } from "../../lib/utils";
import { useThemeStore } from "../../store/themeStore";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border",
        isLight
          ? "bg-slate-50/80 border-slate-200"
          : "bg-black/20 border-white/5",
        className
      )}
    >
      {Icon && (
        <Icon
          size={48}
          className={`mb-4 opacity-40 ${
            isLight ? "text-slate-300" : "text-white/20"
          }`}
        />
      )}
      <h3
        className={`text-lg font-semibold mb-1 ${
          isLight ? "text-slate-800" : "text-white"
        }`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`text-sm max-w-sm ${
            isLight ? "text-slate-500" : "text-white/50"
          }`}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
