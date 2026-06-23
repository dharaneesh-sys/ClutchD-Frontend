"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  ChevronDown,
  PackageSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProductStore } from "@/store/productStore";
import { SORT_OPTIONS } from "@/lib/constants";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { SearchFilters } from "@/components/marketplace/SearchFilters";
import { ShimmerCard } from "@/components/ui/Shimmer";
import { EmptyState } from "@/components/ui/EmptyState";

/* ────────────────────────────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────────────────────────────── */

function parsePriceRange(value) {
  if (!value) return null;
  const match = value.match(/^(\d+)(?:\-(\d+))?\+?$/);
  if (!match) return null;
  return {
    min: Number(match[1]),
    max: match[2] ? Number(match[2]) : Infinity,
  };
}

function matchesQuery(product, query) {
  if (!query?.trim()) return true;
  const q = query.toLowerCase();
  return (
    product.name?.toLowerCase().includes(q) ||
    product.brand?.toLowerCase().includes(q) ||
    product.vendor?.toLowerCase().includes(q)
  );
}

function matchesFilters(product, filters) {
  // Categories
  if (filters.categories?.length) {
    if (!filters.categories.includes(product.category)) return false;
  }

  // Price range
  if (filters.priceRange) {
    const range = parsePriceRange(filters.priceRange);
    if (range) {
      if (product.price < range.min || product.price > range.max) return false;
    }
  }

  // Brand
  if (filters.brand) {
    if (product.brand?.toLowerCase() !== filters.brand.toLowerCase()) return false;
  }

  // Rating (minimum)
  if (filters.rating) {
    if (product.rating < filters.rating) return false;
  }

  // Availability
  if (filters.availability) {
    if (!product.availability) return false;
  }

  // Delivery time
  if (filters.deliveryTime) {
    const normalizedFilter = filters.deliveryTime.replace(/-/g, " ");
    if (product.deliveryTime?.toLowerCase() !== normalizedFilter) return false;
  }

  return true;
}

function sortProducts(products, sortBy) {
  const sorted = [...products];
  switch (sortBy) {
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case "popularity":
      sorted.sort((a, b) => (b.rating * b.price) - (a.rating * a.price));
      break;
    default:
      break;
  }
  return sorted;
}

/* ────────────────────────────────────────────────────────────────────
 *  Loading Skeleton
 * ──────────────────────────────────────────────────────────────────── */

function SearchSkeleton() {
  return (
    <div className="p-4 space-y-6">
      {/* Search bar skeleton */}
      <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />

      {/* Sort bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
        <div className="h-9 w-44 bg-white/5 rounded-xl animate-pulse" />
      </div>

      {/* Results grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerCard key={i} lines={2} hasAvatar={false} hasActions={false} />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 *  Search Page Content (needs Suspense for useSearchParams)
 * ──────────────────────────────────────────────────────────────────── */

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState("popularity");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const debounceRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const {
    products,
    filters,
    isLoading,
    searchProducts,
    setFilter,
    clearFilters,
    fetchProducts,
  } = useProductStore();

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync initial query from URL → store
  useEffect(() => {
    if (initialQuery) {
      searchProducts(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search query updates → URL + store
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(localQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localQuery]);

  // Sync debounced query → store + URL
  useEffect(() => {
    searchProducts(debouncedQuery);
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    } else {
      params.delete("q");
    }
    router.replace(`/marketplace/search${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    });
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived: filtered + sorted results
  const results = useMemo(() => {
    const filtered = products.filter(
      (p) => matchesQuery(p, debouncedQuery) && matchesFilters(p, filters)
    );
    return sortProducts(filtered, sortBy);
  }, [products, debouncedQuery, filters, sortBy]);

  const handleFilterChange = useCallback(
    (name, value) => setFilter(name, value),
    [setFilter]
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    setLocalQuery("");
  }, [clearFilters]);

  const handleClearSearch = useCallback(() => {
    setLocalQuery("");
  }, []);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort";

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-dvh">
      {/* ─── Search Header ─────────────────────────────────── */}
      <div className="sticky top-0 z-30 glass-lux-strong rounded-none border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
            />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search products, brands, categories…"
              className={cn(
                "w-full rounded-2xl border border-border-subtle",
                "bg-white/5 pl-11 pr-10 py-3 text-sm text-foreground",
                "placeholder:text-text-dim",
                "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all"
              )}
              aria-label="Search products"
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors text-text-dim"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        {isLoading && products.length === 0 ? (
          <SearchSkeleton />
        ) : (
          <div className="flex gap-6">
            {/* Filters sidebar (desktop) + overlay (mobile) */}
            <SearchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
              isMobileOpen={mobileFilterOpen}
              onMobileClose={() => setMobileFilterOpen(false)}
            />

            {/* Results area */}
            <div className="flex-1 min-w-0">
              {/* Sort & results count bar */}
              <div className="flex items-center justify-between mb-5 gap-4">
                <p className="text-sm text-text-muted shrink-0">
                  <span className="text-foreground font-semibold">
                    {results.length}
                  </span>{" "}
                  of{" "}
                  <span className="text-foreground font-semibold">
                    {products.length}
                  </span>{" "}
                  results
                  {debouncedQuery && (
                    <span className="hidden sm:inline">
                      {" "}
                      for &ldquo;<span className="text-text-muted">{debouncedQuery}</span>&rdquo;
                    </span>
                  )}
                </p>

                <div className="flex items-center gap-2">
                  {/* Mobile filter toggle */}
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(true)}
                    className={cn(
                      "lg:hidden flex items-center gap-2 rounded-xl border border-border-subtle",
                      "px-3.5 py-2 text-xs font-medium text-text-muted",
                      "hover:bg-white/5 hover:text-foreground transition-colors"
                    )}
                  >
                    <SlidersHorizontal size={14} />
                    Filters
                    {Object.values(filters).some(
                      (v) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
                    ) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>

                  {/* Sort dropdown */}
                  <div className="relative" ref={sortDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowSortDropdown((v) => !v)}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border border-border-subtle",
                        "px-3.5 py-2 text-xs font-medium text-text-muted",
                        "hover:bg-white/5 hover:text-foreground transition-colors",
                        "min-w-[140px] justify-between"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <ArrowUpDown size={12} />
                        {currentSortLabel}
                      </span>
                      <ChevronDown
                        size={12}
                        className={cn(
                          "transition-transform",
                          showSortDropdown && "rotate-180"
                        )}
                      />
                    </button>

                    {showSortDropdown && (
                      <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[180px] glass-lux-strong rounded-xl overflow-hidden animate-scale-in">
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",
                              sortBy === option.value
                                ? "bg-primary/20 text-primary-light"
                                : "text-text-muted hover:bg-white/5 hover:text-foreground"
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results grid or empty state */}
              {results.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.map((product, i) => (
                    <div
                      key={product.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${(i % 8) * 50}ms` }}
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={PackageSearch}
                  title="No products found"
                  description={
                    debouncedQuery
                      ? `We couldn't find any products matching "${debouncedQuery}". Try adjusting your search or filters.`
                      : "No products match your current filters. Try broadening your criteria."
                  }
                  className="mt-8"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 *  Exported page (Suspense boundary for useSearchParams)
 * ──────────────────────────────────────────────────────────────────── */

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
