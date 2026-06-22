import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export const Select = forwardRef(
  ({ className, options = [], error, label, placeholder, ...props }, ref) => {
    const generatedId = useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={generatedId} className="mb-2 block text-sm font-medium text-text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={generatedId}
            className={cn(
              "appearance-none w-full rounded-xl border pl-4 pr-10 py-3 text-sm transition-all",
              "border-border-subtle bg-surface text-text-primary",
              "focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${generatedId}-error` : undefined}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-surface text-text-dim">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                className="bg-surface text-text-primary"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-dim">
            <ChevronDown size={18} />
          </div>
        </div>
        {error && (
          <p id={`${generatedId}-error`} className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
