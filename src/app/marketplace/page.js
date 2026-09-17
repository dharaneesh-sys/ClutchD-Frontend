"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, AlertTriangle, RefreshCw, ChevronRight, Plus } from "lucide-react";
import { useProductStore } from "@/store/productStore";
import { useCategoryStore } from "@/store/categoryStore";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { Shimmer } from "@/components/ui/Shimmer";
import { useAuthStore } from "@/store/authStore";
import { Modal } from "@/components/ui/Modal";
import { SellerProductForm } from "@/components/marketplace/SellerProductForm";

// ─── Loading Skeletons ──────────────────────────────────────────────────

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="glass-lux rounded-2xl p-3.5 flex flex-col items-center gap-2.5"
        >
          <Shimmer variant="avatar" className="!h-12 !w-12" />
          <Shimmer variant="text" className="!h-3.5 !w-16" />
          <Shimmer variant="text" className="!h-2.5 !w-10" />
        </div>
      ))}
    </div>
  );
}

function ProductRowSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="snap-start shrink-0 w-44">
          <div className="glass-lux rounded-2xl overflow-hidden">
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
        </div>
      ))}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function MarketplaceHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [sellOpen, setSellOpen] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const canSell = role === "seller" || role === "admin";

  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    fetchProducts,
  } = useProductStore();

  const {
    categories,
    isLoading: categoriesLoading,
    fetchCategories,
  } = useCategoryStore();

  // Derive a single status from store states
  const status = (() => {
    if (productsLoading || categoriesLoading) return "LOADING";
    if (productsError) return "ERROR";
    if (products.length > 0) return "SUCCESS_WITH_DATA";
    return "SUCCESS_EMPTY"; // API returned, catalog is genuinely empty
  })();

  const handleRetry = useCallback(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

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

  const displayedCategories = useMemo(() => {
    const norm = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
    const isAccessories = (c) =>
      norm(c?.name).includes("accessor") || norm(c?.slug).includes("accessor");
    const isSpare = (c) =>
      norm(c?.name).includes("spare") || norm(c?.slug).includes("spare");
    const list = categories.filter((c) => isAccessories(c) || isSpare(c));
    const hasAccessories = list.some((c) => isAccessories(c));
    const hasSpare = list.some((c) => isSpare(c));
    const out = [...list];
    if (!hasAccessories) {
      const fb = categories.find((c) => isAccessories(c));
      if (fb) out.push(fb);
    }
    if (!hasSpare) {
      const spareCount = categories
        .filter((c) => !isAccessories(c) && !isSpare(c))
        .reduce((sum, c) => sum + (Number(c.productCount) || 0), 0);
      const baseCount =
        spareCount ||
        categories
          .filter((c) => !isAccessories(c))
          .reduce((sum, c) => sum + (Number(c.productCount) || 0), 0);
      out.push({
        id: "spare-parts",
        slug: "spare-parts",
        name: "Spare Parts",
        productCount: baseCount,
      });
    }
    return out.filter((c) => isAccessories(c) || isSpare(c)).slice(0, 2);
  }, [categories]);

  return (
    <div className="space-y-5 p-4 pb-8 page-enter">
      {/* ── Error State ── */}
      {status === "ERROR" && (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <AlertTriangle size={32} className="text-[var(--primary-light)] mb-3" />
          <p className="text-base font-semibold text-foreground mb-1">Unable to load marketplace</p>
          <p className="text-sm text-muted mb-5">We couldn&apos;t reach the marketplace.</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* ── Header + Search ── */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="type-headline-3 text-foreground">Marketplace</h1>
            <p className="type-body-2 text-muted">
              Auto parts &amp; accessories for every need
            </p>
          </div>
          {canSell && (
            <button
              type="button"
              onClick={() => setSellOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Sell a part
            </button>
          )}
        </div>

        <form onSubmit={handleSearch} role="search">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories…"
              className="input-glass pl-9 pr-4 h-11 type-body-2 text-sm"
              aria-label="Search marketplace"
            />
          </div>
        </form>
      </div>

      {/* ── Categories ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="type-title-3 text-on-surface uppercase tracking-wide">Categories</h2>
          <Link
            href="/marketplace/categories"
            className="inline-flex items-center gap-0.5 text-[0.6875rem] font-semibold text-primary hover:text-primary-light transition-colors"
          >
            See all
            <ChevronRight size={14} />
          </Link>
        </div>

        {categoriesLoading ? (
          <CategoryGridSkeleton />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {categories.map((cat) => (
              <CategoryCard key={cat.id || cat.value} category={{...cat, id: cat.slug || cat.value || cat.id}} icon={cat.slug} />
            ))}
          </div>
        ) : status !== "ERROR" && (
          <div className="glass-lux rounded-2xl py-6 px-4 text-center">
            <p className="text-sm text-muted">No categories available.</p>
          </div>
        )}
      </section>

      {/* ── Featured Products ── */}
      {status !== "ERROR" && (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="type-title-3 text-on-surface uppercase tracking-wide">Featured Products</h2>
          <Link
            href="/marketplace/search"
            className="inline-flex items-center gap-0.5 text-[0.6875rem] font-semibold text-primary hover:text-primary-light transition-colors"
          >
            See all
            <ChevronRight size={14} />
          </Link>
        </div>

        {productsLoading ? (
          <ProductRowSkeleton />
        ) : featuredProducts.length > 0 ? (
          <div
            className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: "thin" }}
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="snap-start shrink-0 w-44">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-lux rounded-2xl py-8 px-4 text-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 bg-surface-soft text-icon-highlight">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <p className="text-sm font-semibold text-foreground mb-0.5">No products yet</p>
            <p className="text-xs text-muted">Check back soon for new auto parts and accessories.</p>
          </div>
        )}
      </section>
      )}
      {/* ── Sell Part modal (sellers only) ─────────────────────────── */}
      {canSell && (
        <Modal
          isOpen={sellOpen}
          onClose={() => setSellOpen(false)}
          title="Sell a part"
        >
          <SellerProductForm onSuccess={() => setSellOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
