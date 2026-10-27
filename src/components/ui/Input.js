import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(
  ({ className, type = "text", error, label, icon: Icon, ...props }, ref) => {
    const generatedId = useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={generatedId} className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
              <Icon size={18} />
            </div>
          )}
          <input
            id={generatedId}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? `${generatedId}-error` : undefined}
            className={cn(
              "w-full min-h-[44px] rounded-xl border",
              "px-4 py-3 text-sm transition-colors",
              "border-[var(--border)] bg-[var(--surface-card)] text-[var(--foreground)] placeholder:text-[var(--text-muted)]",
              "focus:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]",
              Icon && "pl-10",
              error && "border-[var(--danger)] focus:border-[var(--danger)] focus-visible:ring-[var(--danger)]",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p id={`${generatedId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-[var(--danger)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
