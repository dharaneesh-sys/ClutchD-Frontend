import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Loader({ size = 24, className }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 
        size={size} 
        className="animate-spin text-icon-highlight drop-shadow-[0_0_8px_rgba(var(--color-icon-highlight-rgb),0.5)]"
      />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-[var(--background)]/80">
      <div className="flex flex-col items-center space-y-4">
        <Loader size={48} />
        <p className="text-sm font-medium text-icon-highlight">Loading ClutchD...</p>
      </div>
    </div>
  );
}
