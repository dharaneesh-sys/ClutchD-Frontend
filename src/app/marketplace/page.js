"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Percent, Tag } from "lucide-react";
import { useProductStore } from "@/store/productStore";
import { useCategoryStore } from "@/store/categoryStore";
import { offers } from "@/lib/demo/data/offers";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ShimmerCard } from "@/components/ui/Shimmer";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatCurrency } from "@/lib/utils";

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

// ─── Offer Card ─────────────────────────────────────────────────────────

function OfferCard({ offer, index }) {
  const gradients = [
    "from-emerald-500/20 via-emerald-600/10 to-emerald-700/20",
    "from-sky-500/20 via-sky-600/10 to-sky-700/20",
    "from-amber-500/20 via-amber-600/10 to-amber-700/20",
    "from-violet-500/20 via-violet-600/10 to-violet-700/20",
    "from-rose-500/20 via-rose-600/10 to-rose-700/20",
  ];

  const badgeGradients = [
    "from-emerald-500/30 to-emerald-600/40",
    "from-sky-500/30 to-sky-600/40",
    "from-amber-500/30 to-amber-600/40",
    "from-violet-500/30 to-violet-600/40",
    "from-rose-500/30 to-rose-600/40",
  ];

  const g = index % gradients.length;

  return (
    <div
      className={cn(
        "glass-lux-interactive rounded-2xl p-4",
        "flex items-center gap-4",
        `bg-gradient-to-br ${gradients[g]}`,
        "hover:border-white/15"
      )}
    >
      {/* Discount Badge */}
      <div
        className={cn(
          "flex-shrink-0 w-16 h-16 rounded-xl",
          `bg-gradient-to-br ${badgeGradients[g]}`,
          "flex items-center justify-center",
          "ring-1 ring-white/10"
        )}
      >
        <div className="text-center">
          <span className="text-xl font-bold text-primary block leading-none">
            {offer.discountPercent}%
          </span>
          <span className="text-[8px] text-muted font-medium uppercase tracking-wider">
            OFF
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-on-surface">
          {offer.title}
        </h3>
        <p className="text-xs text-muted mt-0.5 line-clamp-2">
          {offer.description}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wider">
            <Tag size={10} />
            {offer.code}
          </span>
          {offer.minPurchase > 0 && (
            <span className="text-[10px] text-muted">
              Min. {formatCurrency(offer.minPurchase)}
            </span>
          )}
        </div>
      </div>
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
              <CategoryCard key={cat.id} category={cat} />
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

      {/* ── Special Offers ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Percent size={18} className="text-primary" />
          <h2 className="type-title-1 text-on-surface">Special Offers</h2>
        </div>

        <div className="space-y-3">
          {offers.map((offer, i) => (
            <OfferCard key={offer.id} offer={offer} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
