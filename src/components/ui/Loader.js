import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";

export function Loader({ size = 24, className }) {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 
        size={size} 
        className={`animate-spin text-icon-highlight drop-shadow-[0_0_8px_rgba(var(--color-icon-highlight-rgb),0.5)]`}
      />
    </div>
  );
}

export function FullPageLoader() {
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ${isLight ? "bg-yellow-50/80" : "bg-[#021a0f]/80"}`}>
      <div className="flex flex-col items-center space-y-4">
        <Loader size={48} />
        <p className="text-sm font-medium text-icon-highlight">Loading ClutchD...</p>
      </div>
    </div>
  );
}
