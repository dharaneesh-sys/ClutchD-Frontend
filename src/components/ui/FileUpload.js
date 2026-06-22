import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, X } from "lucide-react";

export const FileUpload = forwardRef(
  ({ className, error, label, value, onChange, accept = "image/*", multiple = false, maxSizeMB = 5, ...props }, ref) => {
    const generatedId = useId();
    
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const maxBytes = maxSizeMB * 1024 * 1024;
        const files = Array.from(e.target.files);
        
        const oversized = files.find(f => f.size > maxBytes);
        if (oversized) {
          e.target.value = "";
          onChange(multiple ? [] : null);
          if (typeof window !== "undefined") {
            console.warn(`File "${oversized.name}" exceeds ${maxSizeMB}MB limit`);
          }
          return;
        }

        if (multiple) {
          onChange(files);
        } else {
          onChange(e.target.files[0]);
        }
      }
    };

    const clearFile = (e) => {
      e.preventDefault();
      onChange(multiple ? [] : null);
    };

    const getDisplayNames = () => {
      if (!value) return null;
      if (Array.isArray(value)) {
        if (value.length === 0) return null;
        return value.map(v => v.name || 'File').join(', ');
      }
      return value.name || 'File attached';
    };

    const hasFile = Array.isArray(value) ? value.length > 0 : !!value;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={generatedId} className="mb-2 block text-sm font-medium text-text-muted">
            {label}
          </label>
        )}
        
        {!hasFile ? (
          <div 
            className={cn(
              "relative flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border border-dashed px-4 py-6 text-center transition-all cursor-pointer",
              "border-border-subtle bg-surface-soft hover:bg-surface-mid hover:border-primary/50",
              error && "border-red-500/50 bg-red-500/5",
              className
            )}
          >
            <input
              id={generatedId}
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-invalid={!!error}
              aria-describedby={error ? `${generatedId}-error` : undefined}
              onChange={handleFileChange}
              accept={accept}
              multiple={multiple}
              ref={ref}
              {...props}
            />
            <UploadCloud size={32} className="mb-3 opacity-80 text-icon-highlight" />
            <p className="text-sm font-medium mb-1 text-text-primary">Click to upload or drag & drop</p>
            <p className="text-xs text-text-muted">PNG, JPG up to {maxSizeMB}MB</p>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full rounded-xl border px-4 py-3 border-primary/30 bg-primary/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <UploadCloud size={20} className="shrink-0 text-icon-highlight" />
              <span className="text-sm truncate text-text-primary">
                {getDisplayNames()}
              </span>
            </div>
            <button
              onClick={clearFile}
              className="p-1 rounded-md transition-colors shrink-0 ml-2 hover:bg-surface-soft text-text-muted hover:text-foreground"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {error && <p id={`${generatedId}-error`} className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";
