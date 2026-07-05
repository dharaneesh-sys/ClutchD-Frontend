"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search,
  Star,
  Clock,
  ArrowUpDown,
  ChevronDown,
  Trophy,
  Award,
  CheckCircle2,
  ShoppingCart,
  Shield,
  AlertTriangle,
  Store,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/useToast";
import { vendors } from "@/lib/demo/data/vendors";
import { productVendors } from "@/lib/demo/data/productVendors";

const SORT_OPTIONS = [
  { value: "price-asc", label: "Price: Low to High" },
  { value: "rating", label: "Vendor Rating" },
  { value: "delivery", label: "Delivery Time" },
];

/**
 * Vendor comparison table — compares vendor pricing, ratings, and delivery
 * for a given product. Supports sorting, vendor name search, and highlights
 * for best price and best rating. Each vendor row includes an "Add to Cart"
 * button that integrates with the cart store.
 *
 * When the `product` prop is provided along with `productId`, the table
 * falls back to inline demo vendor data (AutoZone India, CarParts.in,
 * Mechanikart, Boodmo) if no entries exist in the database.
 *
 * @param {{ productId: string, product?: object }} props
 */
export function VendorComparisonTable({ productId, product }) {
  const [vendorSearch, setVendorSearch] = useState("");
  const [sortBy, setSortBy] = useState("price-asc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const sortDropdownRef = useRef(null);
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToast();

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Demo fallback vendors when no database entries exist
  const DEMO_FALLBACK_VENDORS = [
    {
      id: 'v-demo-autozone',
      vendorId: 'v-demo-autozone',
      name: 'AutoZone India',
      rating: 4.5,
      reviewCount: 128,
      deliveryTime: '2-3 business days',
      deliveryDays: 2,
      stock: 25,
      price: product ? Math.round(Number(product.price) * 0.95 / 10) * 10 - 1 : 0,
      originalPrice: product ? Math.round(Number(product.price) * 1.08 / 10) * 10 - 1 : 0,
      assured: true,
      inStock: true,
    },
    {
      id: 'v-demo-carparts',
      vendorId: 'v-demo-carparts',
      name: 'CarParts.in',
      rating: 4.2,
      reviewCount: 94,
      deliveryTime: '3-5 business days',
      deliveryDays: 4,
      stock: 50,
      price: product ? Math.round(Number(product.price) * 0.92 / 10) * 10 - 1 : 0,
      originalPrice: null,
      assured: false,
      inStock: true,
    },
    {
      id: 'v-demo-mechanikart',
      vendorId: 'v-demo-mechanikart',
      name: 'Mechanikart',
      rating: 4.7,
      reviewCount: 203,
      deliveryTime: '1-2 business days',
      deliveryDays: 1,
      stock: 15,
      price: product ? Math.round(Number(product.price) * 1.02 / 10) * 10 - 1 : 0,
      originalPrice: null,
      assured: true,
      inStock: true,
    },
    {
      id: 'v-demo-boodmo',
      vendorId: 'v-demo-boodmo',
      name: 'Boodmo',
      rating: 4.0,
      reviewCount: 67,
      deliveryTime: '4-6 business days',
      deliveryDays: 5,
      stock: 0,
      price: product ? Math.round(Number(product.price) * 0.85 / 10) * 10 - 1 : 0,
      originalPrice: product ? Math.round(Number(product.price) * 0.95 / 10) * 10 - 1 : 0,
      assured: false,
      inStock: false,
    },
  ];

  // Join productVendors with vendors data; fall back to demo data if none found
  const vendorEntries = useMemo(() => {
    if (!productId) return [];

    const dbEntries = productVendors
      .filter((pv) => pv.productId === productId)
      .map((pv) => {
        const vendor = vendors.find((v) => v.id === pv.vendorId);
        return { ...pv, vendor };
      })
      .filter((entry) => entry.vendor);

    // If no DB entries and we have a product, show demo fallback data
    if (dbEntries.length === 0 && product) {
      return DEMO_FALLBACK_VENDORS.map((v) => ({
        ...v,
        vendor: {
          id: v.vendorId,
          name: v.name,
          rating: v.rating,
          reviewCount: v.reviewCount,
        },
        _isDemo: true,
      }));
    }

    return dbEntries;
  }, [productId, product]);

  /* ── Add to cart handler ─────────────────────────────────── */
  const handleAddToCart = useCallback(
    (entry) => {
      setAddingTo(entry.vendorId);

      setTimeout(() => {
        addItem(
          {
            id: productId,
            name: entry.vendor?.name || entry.name,
            price: entry.price,
            image: product?.image || null,
          },
          { id: entry.vendorId, name: entry.vendor?.name || entry.name },
        );
        setAddingTo(null);
        toast.success(`Added to cart — ${entry.vendor?.name || entry.name}`, {
          duration: 3000,
        });
      }, 300);
    },
    [productId, product, addItem, toast],
  );

  // Filter by vendor name
  const filtered = useMemo(() => {
    if (!vendorSearch.trim()) return vendorEntries;
    const q = vendorSearch.toLowerCase();
    return vendorEntries.filter((e) =>
      e.vendor.name.toLowerCase().includes(q),
    );
  }, [vendorEntries, vendorSearch]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "price-asc":
        arr.sort((a, b) => a.price - b.price);
        break;
      case "rating":
        arr.sort((a, b) => b.vendor.rating - a.vendor.rating);
        break;
      case "delivery":
        arr.sort((a, b) => a.deliveryDays - b.deliveryDays);
        break;
      default:
        break;
    }
    return arr;
  }, [filtered, sortBy]);

  // Highlight values
  const bestPrice = sorted.length > 0
    ? Math.min(...sorted.map((e) => e.price))
    : null;
  const bestRating = sorted.length > 0
    ? Math.max(...sorted.map((e) => e.vendor.rating))
    : null;

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort";

  if (vendorEntries.length === 0) {
    return (
      <GlassCard variant="glass-lux" className="p-6">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Compare Vendor Pricing
        </h2>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Store size={36} className="text-text-dim" />
          <p className="text-sm text-text-muted">
            No vendor pricing available for this product yet.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard variant="glass-lux" className="p-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-text-primary">
          Compare Vendor Pricing
          <span className="ml-2 text-sm font-normal text-text-dim">
            ({vendorEntries.length} vendor{vendorEntries.length !== 1 ? "s" : ""})
          </span>
        </h2>
      </div>

      {/* ── Controls bar: search + sort ────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        {/* Vendor name search */}
        <div className="relative flex-1 w-full">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none"
          />
          <input
            type="text"
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendor..."
            className={cn(
              "w-full rounded-lg border border-border-subtle bg-white/5",
              "pl-9 pr-3 py-2 text-xs text-foreground",
              "placeholder:text-text-dim",
              "focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20",
              "transition-all",
            )}
            aria-label="Search vendors"
          />
          {vendorSearch && (
            <button
              type="button"
              onClick={() => setVendorSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-dim hover:text-foreground transition-colors"
              aria-label="Clear vendor search"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="relative shrink-0" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={() => setSortMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border-subtle",
              "px-3 py-2 text-xs font-medium text-text-muted",
              "hover:bg-white/5 hover:text-foreground transition-colors",
              "min-w-[150px] justify-between",
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
                sortMenuOpen && "rotate-180",
              )}
            />
          </button>

          {sortMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-20 min-w-[190px] glass-lux-strong rounded-xl overflow-hidden animate-scale-in">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSortBy(option.value);
                    setSortMenuOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",
                    sortBy === option.value
                      ? "bg-primary/20 text-primary-light"
                      : "text-text-muted hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Empty filter result ────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-text-dim">
            No vendors match your search.
          </p>
          <button
            type="button"
            onClick={() => setVendorSearch("")}
            className="mt-2 text-xs font-medium text-primary-light hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          {/* ── Demo mode badge ──────────────────────────────── */}
          {sorted.length > 0 && sorted[0]._isDemo && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2">
              <AlertTriangle size={12} className="shrink-0 text-amber-400" />
              <p className="text-xs text-text-muted">
                Demo pricing shown. Connect to backend for live vendor prices.
              </p>
            </div>
          )}

          {/* ── Desktop table ──────────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                    Vendor
                  </th>
                  <th className="text-right px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                    Price
                  </th>
                  <th className="text-center px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                    Rating
                  </th>
                  <th className="text-center px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                    Delivery
                  </th>
                  <th className="text-center px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                    Stock
                  </th>
                  <th className="text-right px-6 py-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-text-muted">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sorted.map((entry) => {
                  const isBestPrice = entry.price === bestPrice;
                  const isBestRating = entry.vendor.rating === bestRating;

                  return (
                    <tr
                      key={entry.vendorId}
                      className={cn(
                        "transition-colors hover:bg-white/[0.03]",
                        isBestPrice && "bg-emerald-500/[0.04]",
                        isBestRating && "bg-amber-500/[0.04]",
                      )}
                    >
                      {/* Vendor name + badges */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {entry.vendor.name}
                          </span>
                          {isBestPrice && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wider text-emerald-400">
                              <Trophy size={8} />
                              Best Price
                            </span>
                          )}
                          {isBestRating && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wider text-amber-400">
                              <Award size={8} />
                              Best Rated
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            isBestPrice
                              ? "text-emerald-400"
                              : "text-foreground",
                          )}
                        >
                          {formatCurrency(entry.price)}
                        </span>
                        {entry.originalPrice && (
                          <span className="ml-1.5 text-[0.6875rem] text-text-dim line-through">
                            {formatCurrency(entry.originalPrice)}
                          </span>
                        )}
                      </td>

                      {/* Vendor rating */}
                      <td className="px-6 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Star
                            size={11}
                            className={
                              isBestRating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-amber-400/50 text-amber-400/50"
                            }
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isBestRating
                                ? "text-amber-400"
                                : "text-text-muted",
                            )}
                          >
                            {Number(entry.vendor.rating || 0).toFixed(1)}
                          </span>
                        </div>
                        {entry.vendor.reviewCount > 0 && (
                          <span className="text-[0.625rem] text-text-dim">
                            ({entry.vendor.reviewCount})
                          </span>
                        )}
                      </td>

                      {/* Delivery time */}
                      <td className="px-6 py-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                          <Clock size={10} />
                          {entry.deliveryDays === 1
                            ? "1 day"
                            : `${entry.deliveryDays} days`}
                        </span>
                      </td>

                  {/* Stock */}
                        <td className="px-6 py-3.5 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium",
                              entry.stock > 0
                                ? "text-emerald-400"
                                : "text-red-400",
                            )}
                          >
                            {entry.stock > 0 ? (
                              <>
                                <CheckCircle2 size={10} />
                                {entry.stock} in stock
                              </>
                            ) : (
                              "Out of stock"
                            )}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-3.5 text-right whitespace-nowrap">
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={addingTo === entry.vendorId}
                            disabled={entry.stock <= 0 || addingTo === entry.vendorId}
                            onClick={() => handleAddToCart(entry)}
                          >
                            <ShoppingCart size={14} className="mr-1.5" />
                            Add to Cart
                          </Button>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Legend ────────────────────────────────────────── */}
          <div className="mt-4 hidden md:flex items-center gap-4 text-[0.6875rem] text-text-dim">
            <span className="inline-flex items-center gap-1">
              <Trophy size={10} className="text-emerald-400" />
              Best Price
            </span>
            <span className="inline-flex items-center gap-1">
              <Award size={10} className="text-amber-400" />
              Best Rated
            </span>
          </div>

          {/* ── Mobile card layout ────────────────────────────── */}
          <div className="mt-4 space-y-3 md:hidden">
            {sorted.map((entry) => {
              const isBestPrice = entry.price === bestPrice;
              const isBestRating = entry.vendor.rating === bestRating;
              const isAdding = addingTo === entry.vendorId;

              return (
                <div
                  key={entry.vendorId}
                  className={cn(
                    "rounded-xl border border-white/[0.06] bg-white/[0.03] p-4",
                    "transition-colors hover:bg-white/[0.05]",
                    isBestPrice && "border-emerald-500/20",
                  )}
                >
                  {/* Row 1: Vendor name + badges */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary-light">
                        <Store size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.vendor.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Star
                            size={10}
                            className={cn(
                              isBestRating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-amber-400/50 text-amber-400/50",
                            )}
                          />
                          <span className={cn(
                            "text-[0.6875rem]",
                            isBestRating ? "text-amber-400 font-medium" : "text-text-muted",
                          )}>
                            {Number(entry.vendor.rating || 0).toFixed(1)}
                          </span>
                          {entry.vendor.reviewCount > 0 && (
                            <span className="text-[0.625rem] text-text-dim">
                              ({entry.vendor.reviewCount})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {isBestPrice && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wider text-emerald-400">
                          <Trophy size={8} />
                          Best Price
                        </span>
                      )}
                      {isBestRating && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wider text-amber-400">
                          <Award size={8} />
                          Best Rated
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Price, delivery, stock details */}
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[0.6875rem] text-text-dim">Price</p>
                      <p className={cn(
                        "text-sm font-bold",
                        isBestPrice ? "text-emerald-400" : "text-foreground",
                      )}>
                        {formatCurrency(entry.price)}
                      </p>
                      {entry.originalPrice && (
                        <span className="text-[0.625rem] text-text-dim line-through">
                          {formatCurrency(entry.originalPrice)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[0.6875rem] text-text-dim">Delivery</p>
                      <p className="inline-flex items-center gap-1 text-xs text-text-muted">
                        <Clock size={10} />
                        {entry.deliveryDays === 1
                          ? "1 day"
                          : `${entry.deliveryDays} days`}
                      </p>
                    </div>
                    <div>
                      <p className="text-[0.6875rem] text-text-dim">Stock</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium",
                          entry.stock > 0 ? "text-emerald-400" : "text-red-400",
                        )}
                      >
                        {entry.stock > 0 ? (
                          <>
                            <CheckCircle2 size={10} />
                            {entry.stock} in stock
                          </>
                        ) : (
                          "Out of stock"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Add to cart */}
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    isLoading={isAdding}
                    disabled={entry.stock <= 0 || isAdding}
                    onClick={() => handleAddToCart(entry)}
                  >
                    <ShoppingCart size={14} className="mr-1.5" />
                    Add to Cart — {formatCurrency(entry.price)}
                  </Button>
                </div>
              );
            })}

            {/* Mobile legend */}
            {sorted.length > 0 && (
              <div className="flex items-center gap-4 text-[0.6875rem] text-text-dim pt-1">
                <span className="inline-flex items-center gap-1">
                  <Trophy size={10} className="text-emerald-400" />
                  Best Price
                </span>
                <span className="inline-flex items-center gap-1">
                  <Award size={10} className="text-amber-400" />
                  Best Rated
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </GlassCard>
  );
}
