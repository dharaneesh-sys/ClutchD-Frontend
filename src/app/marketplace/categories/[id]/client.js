"use client";

import { useEffect, useMemo } from "react";
import { PackageSearch, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useProductStore } from "@/store/productStore";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShimmerCard } from "@/components/ui/Shimmer";

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Determines whether a product's category matches the target category id.
 * Handles both exact matches and fuzzy prefix-based matches (e.g. "brakes"
 * matches "brake-parts" and vice versa) to accommodate differences between
 * product store demo data and PRODUCT_CATEGORIES slugs.
 */
function categoryMatches(productCategory, targetId) {
  const normalize = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  const a = normalize(productCategory);
  const b = normalize(targetId);
  if (a === b) return true;
  // Compare first N chars (max 5) for partial / prefix matches
  const minLen = Math.min(a.length, b.length, 5);
  return a.substring(0, minLen) === b.substring(0, minLen);
}

// ─── Loading Skeleton ─────────────────────────────────────────────────

function CategoryProductsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link skeleton */}
      <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerCard
            key={i}
            lines={2}
            hasAvatar={false}
            hasActions={false}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function CategoryProductsClient({ id }) {
  const { products, isLoading, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Look up the category metadata from constants
  const categoryMeta = useMemo(
    () => PRODUCT_CATEGORIES.find((c) => c.value === id),
    [id],
  );

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!id) return [];
    return products.filter((p) => categoryMatches(p.category, id));
  }, [products, id]);

  const displayName = categoryMeta?.label || id;
  const displayDescription = categoryMeta?.description || "Explore products in this category";

  return (
    <div className="p-4 page-enter">
      {/* Back navigation */}
      <Link
        href="/marketplace/categories"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft size={14} />
        All Categories
      </Link>

      {isLoading && products.length === 0 ? (
        <CategoryProductsSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="space-y-1 mb-7">
            <h1 className="type-headline-3 text-foreground">{displayName}</h1>
            <p className="type-body-2 text-muted">{displayDescription}</p>
          </div>

          {/* Product count */}
          <p className="text-sm text-text-muted mb-5">
            <span className="text-foreground font-semibold">
              {filteredProducts.length}
            </span>{" "}
            product{filteredProducts.length !== 1 ? "s" : ""} in this category
          </p>

          {/* Product grid or empty state */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredProducts.map((product, i) => (
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
              description={`We couldn't find any products in the "${displayName}" category. Check back later for new arrivals.`}
            />
          )}
        </>
      )}
    </div>
  );
}
