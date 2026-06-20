import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

export function MultiSelect({ options = [], value = [], onChange, label, error, placeholder = "Select options..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const listboxId = "multi-select-listbox";

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (e, optionValue) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedLabels = value.map(
    (v) => options.find((opt) => opt.value === v)?.label || v
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || activeIndex < 0 || !options[activeIndex]) return;
    const id = `multi-select-option-${String(options[activeIndex].value).replace(/\s/g, "-")}`;
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex, options]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < options.length) {
          toggleOption(options[activeIndex].value);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-text-muted">
          {label}
        </label>
      )}
      
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `multi-select-option-${String(options[activeIndex]?.value).replace(/\s/g, "-")}` : undefined}
        tabIndex={0}
        className={cn(
          "min-h-[48px] w-full rounded-xl border px-4 py-2 text-sm",
          "transition-all cursor-pointer flex flex-wrap gap-2 items-center",
          isLight
            ? "border-border-subtle bg-white text-text-primary focus-within:border-yellow-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-yellow-500/20"
            : "border-border-subtle bg-bg-card text-text-primary focus-within:border-primary focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-primary/20",
          error && "border-red-500/50"
        )}
        onClick={() => {
          const willOpen = !isOpen;
          setIsOpen(willOpen);
          if (willOpen) setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
      >
        {value.length === 0 ? (
          <span className="text-text-dim truncate">{placeholder}</span>
        ) : (
          selectedLabels.map((lbl, idx) => (
            <span 
              key={idx} 
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${isLight ? "bg-yellow-500/15 text-icon-highlight border-yellow-500/25" : "bg-primary/20 text-primary-light border-primary/30"}`}
            >
              {lbl}
              <button
                type="button"
                aria-label={`Remove ${lbl}`}
                onClick={(e) => removeOption(e, value[idx])}
                className={`focus:outline-none ${isLight ? "hover:text-yellow-900" : "hover:text-primary-light"}`}
              >
                <X size={14} />
              </button>
            </span>
          ))
        )}
        
        <div className="ml-auto text-text-dim">
          <ChevronDown size={18} />
        </div>
      </div>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-20 mt-2 w-full rounded-xl border shadow-xl max-h-60 overflow-auto ${isLight ? "border-border-subtle bg-white" : "border-border-subtle bg-[#064e3b]"}`}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`multi-select-option-${String(option.value).replace(/\s/g, "-")}`}
              role="option"
              aria-selected={value.includes(option.value)}
              onClick={() => {
                toggleOption(option.value);
                triggerRef.current?.focus();
              }}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer text-sm transition-colors text-text-primary hover:bg-surface-soft ${index === activeIndex ? "bg-surface-soft" : ""}`}
            >
              <span>{option.label}</span>
              {value.includes(option.value) && (
                <Check size={16} className="text-icon-highlight" />
              )}
            </div>
          ))}
        </div>
      )}
      
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
