"use client";

import { useCallback } from "react";
import { X, RotateCcw, Star, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORIES, PRICE_RANGES, BRANDS, DELIVERY_TIMES } from "@/lib/constants";

function StarGroup({ value, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const active = value === star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(active ? null : star)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "bg-primary/20 text-primary-light"
                : "text-text-muted hover:bg-white/5 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className={cn(
                    i < star
                      ? "fill-amber-400 text-amber-400"
                      : "fill-white/10 text-white/30"
                  )}
                />
              ))}
            </div>
            <span className="text-[0.625rem] text-text-dim">& up</span>
          </button>
        );
      })}
    </div>
  );
}

function FilterSection({ title, children, defaultOpen = true }) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-border-subtle last:border-0"
    >
      <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-text-muted select-none hover:text-foreground transition-colors list-none [&::-webkit-details-marker]:hidden">
        {title}
        <svg
          width={12}
          height={12}
          viewBox="0 0 12 12"
          fill="none"
          className="text-text-dim transition-transform group-open:rotate-180"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-5 pb-4 space-y-1">
        {children}
      </div>
    </details>
  );
}

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label
      onClick={onChange}
      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/5 transition-colors group"
    >
      <div
        className={cn(
          "flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
          checked
            ? "bg-primary border-primary"
            : "border-white/20 group-hover:border-white/40"
        )}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-xs font-medium text-text-muted group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-all text-left",
        active
          ? "bg-primary/20 text-primary-light ring-1 ring-primary/30"
          : "text-text-muted hover:bg-white/5 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

/**
 * Search filter panel — category, price, brand, rating, availability, delivery.
 *
 * @param {Object}   props
 * @param {Object}   props.filters          - Current filter state
 * @param {Function} props.onFilterChange   - (name, value) => void
 * @param {Function} props.onClear          - () => void
 * @param {boolean}  props.isMobileOpen     - Show mobile overlay
 * @param {Function} props.onMobileClose    - () => void
 * @param {string}   props.className        - Additional classes
 */
export function SearchFilters({
  filters = {},
  onFilterChange,
  onClear,
  isMobileOpen = false,
  onMobileClose,
  className,
}) {
  const handleCategory = useCallback(
    (catValue) => {
      const current = filters.categories || [];
      const next = current.includes(catValue)
        ? current.filter((c) => c !== catValue)
        : [...current, catValue];
      onFilterChange("categories", next.length ? next : null);
    },
    [filters.categories, onFilterChange]
  );

  const setFilter = useCallback(
    (name, value) => onFilterChange(name, value),
    [onFilterChange]
  );

  const hasAnyFilter = Object.values(filters).some(
    (v) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
  );

  const content = (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Filter size={14} className="text-primary" />
          Filters
        </h2>
        <div className="flex items-center gap-2">
          {hasAnyFilter && (
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1 text-[0.6875rem] font-medium text-text-muted hover:text-primary-light transition-colors"
            >
              <RotateCcw size={11} />
              Clear all
            </button>
          )}
          {onMobileClose && (
            <button
              type="button"
              onClick={onMobileClose}
              className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors text-text-dim"
              aria-label="Close filters"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable filters */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Category */}
        <FilterSection title="Category">
          {PRODUCT_CATEGORIES.map((cat) => (
            <FilterCheckbox
              key={cat.value}
              label={cat.label}
              checked={filters.categories?.includes(cat.value)}
              onChange={() => handleCategory(cat.value)}
            />
          ))}
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range">
          {PRICE_RANGES.map((range) => (
            <FilterChip
              key={range.value}
              label={range.label}
              active={filters.priceRange === range.value}
              onClick={() =>
                setFilter(
                  "priceRange",
                  filters.priceRange === range.value ? null : range.value
                )
              }
            />
          ))}
        </FilterSection>

        {/* Brand */}
        <FilterSection title="Brand">
          {BRANDS.map((brand) => (
            <FilterChip
              key={brand.value}
              label={brand.label}
              active={filters.brand?.toLowerCase() === brand.value}
              onClick={() =>
                setFilter(
                  "brand",
                  filters.brand?.toLowerCase() === brand.value ? null : brand.label
                )
              }
            />
          ))}
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Minimum Rating">
          <StarGroup
            value={filters.rating}
            onChange={(v) => setFilter("rating", v)}
          />
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability">
          <label className="flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer hover:bg-white/5 transition-colors">
            <span className="text-xs font-medium text-text-muted">In stock only</span>
            <div
              className={cn(
                "relative w-9 h-5 rounded-full transition-colors",
                filters.availability ? "bg-primary" : "bg-white/10"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                  filters.availability && "translate-x-4"
                )}
              />
              <input
                type="checkbox"
                checked={!!filters.availability}
                onChange={(e) =>
                  setFilter("availability", e.target.checked || null)
                }
                className="sr-only"
              />
            </div>
          </label>
        </FilterSection>

        {/* Delivery Time */}
        <FilterSection title="Delivery Time">
          {DELIVERY_TIMES.map((dt) => (
            <FilterChip
              key={dt.value}
              label={dt.label}
              active={filters.deliveryTime === dt.value}
              onClick={() =>
                setFilter(
                  "deliveryTime",
                  filters.deliveryTime === dt.value ? null : dt.value
                )
              }
            />
          ))}
        </FilterSection>
      </div>

      {/* Apply button on mobile */}
      {onMobileClose && (
        <div className="p-4 border-t border-border-subtle lg:hidden">
          <button
            type="button"
            onClick={onMobileClose}
            className="w-full rounded-xl bg-primary text-white font-semibold text-sm py-3 hover:bg-primary-dark transition-colors"
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 glass-lux rounded-2xl overflow-hidden h-fit max-h-[calc(100vh-12rem)] sticky top-24">
        {content}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] flex flex-col glass-lux-strong rounded-t-2xl overflow-hidden animate-fade-in-up">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
