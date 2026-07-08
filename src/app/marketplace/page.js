"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useProductStore } from "@/store/productStore";
import { useCategoryStore } from "@/store/categoryStore";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ShimmerCard } from "@/components/ui/Shimmer";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Loading Skeletons ──────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="glass-lux rounded-2xl p-4 flex flex-col items-center gap-3"
        >
          <Skeleton variant="avatar" className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  );
}

function ProductRowSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-44">
          <ShimmerCard hasAvatar={false} hasActions={false} lines={2} className="rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function MarketplaceHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const {
    products,
    isLoading: productsLoading,
    fetchProducts,
  } = useProductStore();

  const {
    categories,
    isLoading: categoriesLoading,
    fetchCategories,
  } = useCategoryStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (q) {
        router.push(`/marketplace/search?q=${encodeURIComponent(q)}`);
      }
    },
    [searchQuery, router]
  );

  const featuredProducts = products.slice(0, 6);

  return (
    <div className="space-y-7 p-4 page-enter">
      {/* ── Header ── */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">Marketplace</h1>
        <p className="type-body-2 text-muted">
          Auto parts & accessories for every need
        </p>
      </div>

      {/* ── Search Bar ── */}
      <form onSubmit={handleSearch} role="search">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, brands, categories…"
            className="input-glass pl-10 pr-4 h-12 type-body-2"
            aria-label="Search marketplace"
          />
        </div>
      </form>

      {/* ── Categories ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="type-title-1 text-on-surface">Categories</h2>
          <span className="text-[11px] text-muted font-medium">
            {categories.length} total
          </span>
        </div>

        {categoriesLoading ? (
          <CategoryGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.id || cat.value} category={{...cat, id: cat.slug || cat.value || cat.id}} />
            ))}
          </div>
        )}
      </section>

      {/* ── Featured Products ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="type-title-1 text-on-surface">Featured Products</h2>
          {!productsLoading && products.length > 0 && (
            <span className="text-[11px] text-muted font-medium">
              {products.length} available
            </span>
          )}
        </div>

        {productsLoading ? (
          <ProductRowSkeleton />
        ) : featuredProducts.length > 0 ? (
          <div
            className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "thin" }}
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="snap-start shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-lux rounded-2xl p-6 text-center">
            <p className="text-sm text-muted">No products available yet.</p>
          </div>
        )}
      </section>


    </div>
  );
}
