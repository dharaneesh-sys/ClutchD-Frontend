import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export const Select = forwardRef(
  ({ className, options = [], error, label, placeholder, ...props }, ref) => {
    const generatedId = useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={generatedId} className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={generatedId}
            className={cn(
              "appearance-none w-full min-h-[44px] rounded-xl border pl-4 pr-10 py-3 text-sm transition-colors",
              "border-[var(--border)] bg-[var(--surface-card)] text-[var(--foreground)]",
              "focus:border-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]",
              error && "border-[var(--danger)] focus:border-[var(--danger)] focus-visible:ring-[var(--danger)]",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${generatedId}-error` : undefined}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-[var(--surface-card)] text-[var(--text-muted)]">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                className="bg-[var(--surface-card)] text-[var(--foreground)]"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <ChevronDown size={18} />
          </div>
        </div>
        {error && (
          <p id={`${generatedId}-error`} role="alert" className="mt-1.5 text-xs font-medium text-[var(--danger)]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
