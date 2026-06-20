import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/store/themeStore";

export const Input = forwardRef(
  ({ className, type = "text", error, label, icon: Icon, ...props }, ref) => {
    const { theme } = useThemeStore();
    const isLight = theme === "light";
    const generatedId = useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={generatedId} className="mb-2 block text-sm font-medium text-text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim">
              <Icon size={18} />
            </div>
          )}
          <input
            id={generatedId}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? `${generatedId}-error` : undefined}
            className={cn(
              "w-full rounded-2xl border",
              "px-4 py-3 text-sm transition-all",
              isLight
                ? cn(
                    "border-border-subtle bg-white text-text-primary placeholder:text-text-dim",
                    "shadow-[inset_0_1px_0_rgba(0,0,0,0.02)]",
                    "focus:border-yellow-500 focus:bg-white focus:outline-none",
                    "focus:ring-1 focus:ring-yellow-500/30"
                   )
                 : cn(
                    "border-border-subtle bg-gradient-to-b from-white/08 to-white/03",
                    "text-text-primary placeholder:text-text-dim",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                    "focus:border-primary focus:bg-white/08 focus:outline-none",
                    "focus:ring-1 focus:ring-primary/30"
                   ),
              Icon && "pl-10",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p id={`${generatedId}-error`} className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
