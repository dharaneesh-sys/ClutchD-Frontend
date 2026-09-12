"use client";

import { useEffect, useMemo } from "react";
import { PackageSearch, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useProductStore } from "@/store/productStore";
import { useCategoryStore } from "@/store/categoryStore";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/marketplace/CategoryIcon";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Shimmer } from "@/components/ui/Shimmer";

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Determines whether a product's category matches the target category id.
 * Handles both exact matches and fuzzy prefix-based matches (e.g. "brakes"
 * matches "brake-parts" and vice versa) to accommodate differences between
 * product store demo data and PRODUCT_CATEGORIES slugs.
 */
function normalizeCat(s) {
  return s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
}

function categoryMatches(productCategory, targetId) {
  const a = normalizeCat(productCategory);
  const b = normalizeCat(targetId);
  if (a === b) return true;
  // Compare first N chars (max 5) for partial / prefix matches
  const minLen = Math.min(a.length, b.length, 5);
  return a.substring(0, minLen) === b.substring(0, minLen);
}

function isSparePartsTarget(targetId) {
  const n = normalizeCat(targetId);
  return n.includes("spare") || n === "spares";
}

function isAccessoriesProduct(productCategory) {
  return normalizeCat(productCategory).includes("accessor");
}

// ─── Loading Skeleton ─────────────────────────────────────────────────

function CategoryProductsSkeleton() {
  return (
    <div className="space-y-5">
      {/* Back link skeleton */}
      <div className="h-3.5 w-24 bg-white/5 rounded animate-pulse" />

      {/* Title skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-white/5 shrink-0 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
          <div className="h-3.5 w-32 bg-white/5 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-lux rounded-2xl overflow-hidden">
            <Shimmer variant="image" className="!h-32 !w-full !rounded-none" />
            <div className="p-3.5 space-y-2.5">
              <Shimmer variant="text" className="!h-2.5 !w-14" />
              <Shimmer variant="text" className="!h-4 !w-32" />
              <Shimmer variant="text" className="!h-3 !w-24" />
              <div className="flex justify-between items-center pt-1">
                <Shimmer variant="text" className="!h-5 !w-16" />
                <Shimmer variant="button" className="!h-7 !w-20 !rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function CategoryProductsClient({ id }) {
  const { products, isLoading, fetchProducts } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Look up the category from the API first, then fall back to constants
  const apiCategory = useMemo(
    () => categories.find((c) => c.slug === id || c.id === id),
    [categories, id],
  );
  const constCategory = useMemo(
    () => PRODUCT_CATEGORIES.find((c) => c.value === id),
    [id],
  );

  // Filter products by category (Spare Parts = all non-accessory products,
  // since the backend seeds no dedicated spare-parts category)
  const filteredProducts = useMemo(() => {
    if (!id) return [];
    if (isSparePartsTarget(id)) {
      return products.filter((p) => {
        const pc = p.category ?? p.categoryId;
        return pc && !isAccessoriesProduct(pc);
      });
    }
    return products.filter((p) =>
      categoryMatches(p.category ?? p.categoryId, id),
    );
  }, [products, id]);

  const displayName = apiCategory?.name || constCategory?.label || id;
  const displayDescription = apiCategory?.description || constCategory?.description || "Explore products in this category";

  return (
    <div className="space-y-5 p-4 pb-8 page-enter">
      {/* Back navigation */}
      <Link
        href="/marketplace/categories"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        All Categories
      </Link>

      {isLoading && products.length === 0 ? (
        <CategoryProductsSkeleton />
      ) : (
        <>
          {/* Header with icon */}
          <div className="flex items-start gap-3">
            <CategoryIcon category={id} size="md" />
            <div className="space-y-0.5 min-w-0">
              <h1 className="type-headline-3 text-foreground break-words">{displayName}</h1>
              <p className="type-body-2 text-muted">{displayDescription}</p>
            </div>
          </div>

          {/* Product count */}
          <p className="text-sm text-muted">
            <span className="text-foreground font-semibold">
              {filteredProducts.length}
            </span>{" "}
            product{filteredProducts.length !== 1 ? "s" : ""}
          </p>

          {/* Product grid or empty state */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
