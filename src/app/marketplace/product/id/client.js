'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Star,
  Package,
  ShoppingCart,
  Check,
  Car,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

import { ProductImage } from '@/components/marketplace/ProductImage';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { VehicleSelector } from '@/components/marketplace/VehicleSelector';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Shimmer, ShimmerCard } from '@/components/ui/Shimmer';
import { checkFitment } from '@/lib/fitment';


/* ──────────────────────────────────────────────────────────────
 *  Loading skeleton
 * ────────────────────────────────────────────────────────────── */

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4" aria-busy="true">
      <Shimmer className="h-5 w-36 rounded-lg" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Shimmer variant="image" className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Shimmer variant="title" className="w-3/4" />
          <Shimmer className="h-4 w-1/3 rounded-lg" />
          <Shimmer className="h-4 w-1/2 rounded-lg" />
          <Shimmer variant="text" />
          <Shimmer variant="text" className="w-2/3" />
          <div className="flex gap-2 pt-2">
            <Shimmer variant="badge" />
            <Shimmer variant="badge" />
          </div>
        </div>
      </div>
      <ShimmerCard lines={4} hasAvatar={false} hasActions={false} />
      <div className="space-y-4">
        <Shimmer className="h-6 w-44 rounded-lg" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-48 shrink-0">
              <ShimmerCard lines={2} hasAvatar={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 *  Main Page Component
 * ────────────────────────────────────────────────────────────── */

export default function ProductDetailClient({ id: idProp }) {
  const searchParams = useSearchParams();
  // Id comes from ?id= (static-export safe) with prop fallback for tests.
  const id = idProp || searchParams.get('id');

  const {
    products,
    isLoading,
    fetchProducts,
    getProductById,
    fetchProductById,
  } = useProductStore();

  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fitmentResult, setFitmentResult] = useState(null);
  const [fitmentLoading, setFitmentLoading] = useState(false);
  const [deepLinkAttempted, setDeepLinkAttempted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [registeredVehicles, setRegisteredVehicles] = useState([]);

  // Fetch products on mount if not already loaded
  useEffect(() => {
    if (products.length === 0 && !isLoading) {
      fetchProducts();
    }
  }, [products.length, isLoading, fetchProducts]);

  // Deep-link fallback: fetch single product if not in local list
  useEffect(() => {
    if (deepLinkAttempted) return;
    if (getProductById(id) !== null) return;
    if (isLoading) return;
    setDeepLinkAttempted(true);
    fetchProductById(id);
  }, [id, isLoading, deepLinkAttempted, getProductById, fetchProductById]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get("/vehicles").then((res) => {
      if (Array.isArray(res.data)) setRegisteredVehicles(res.data);
    }).catch(() => {});
  }, [isAuthenticated]);

  const initialVehicle = useMemo(() => {
    if (registeredVehicles.length === 0) return null;
    const v = registeredVehicles[0];
    return {
      make: (v.make || "").toLowerCase().replace(/\s+/g, "-"),
      model: (v.model || "").toLowerCase().replace(/\s+/g, "-"),
      year: String(v.year || ""),
      variant: "",
    };
  }, [registeredVehicles]);

  // Derive product from store
  const product = useMemo(
    () => getProductById(id),
    [id, getProductById],
  );

  // Related products (same category, excluding current)
  const relatedProducts = useMemo(
    () =>
      product
        ? products.filter(
            (p) => p.category === product.category && p.id !== product.id,
          )
        : [],
    [product, products],
  );

  // Fitment check handler
  const handleCheckFitment = useCallback(async () => {
    if (!selectedVehicle) return;
    setFitmentLoading(true);
    setFitmentResult(null);
    try {
      const result = await checkFitment(product, selectedVehicle);
      setFitmentResult(result);
    } catch {
      setFitmentResult({
        compatible: false,
        nonFittingParts: ["Unable to check compatibility. Please try again."],
        source: "error",
      });
    } finally {
      setFitmentLoading(false);
    }
  }, [product, selectedVehicle]);

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    if (addingToCart || !product) return;
    setAddingToCart(true);
    addItem(
      { id: product.id, price: product.price ?? 0, name: product.name, image: product.image },
      { id: product.vendorId || null, name: product.vendor || null },
    );
    setTimeout(() => setAddingToCart(false), 1500);
  }, [addingToCart, product, addItem]);

  /* ── Loading state ─────────────────────────────────────── */

  if (isLoading || (products.length === 0 && product === null)) {
    return <ProductDetailSkeleton />;
  }

  /* ── Not found state ───────────────────────────────────── */

  if (!product) {
    return (
      <div className="p-4">
        <EmptyState
          icon={Package}
          title="Product Not Found"
          description="We couldn't find a product with this ID. It may have been removed or the link may be incorrect."
          action={
            <Link href="/marketplace">
              <Button variant="primary">Browse Marketplace</Button>
            </Link>
          }
        />
      </div>
    );
  }

  /* ── Main Render ───────────────────────────────────────── */

  const hasRating = Number(product.rating ?? 0) > 0;

  return (
    <div className="mx-auto max-w-7xl animate-fade-in-up space-y-10 p-4">
      {/* ── Back Link ─────────────────────────────────────── */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={16} />
        Back to Marketplace
      </Link>

      {/* ── Product Hero ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl">
          <ProductImage
            src={product.image}
            alt={product.name}
            productName={product.name}
            className="aspect-square w-full"
          />
        </div>

        {/* Product info — hierarchy: name, brand, price, availability, rating, description, Add to Cart */}
        <div className="flex flex-col gap-5">
          {/* Category badge */}
          {product.category && (
            <Badge variant="glass" className="w-fit">
              {product.category}
            </Badge>
          )}

          {/* Brand */}
          <p className="text-sm font-semibold uppercase tracking-wider text-text-dim">
            {product.brand || product.vendor || "Product"}
          </p>

          {/* Product name */}
          <h1 className="text-2xl font-bold text-text-primary">
            {product.name}
          </h1>

          {/* Price */}
          <p className="text-3xl font-bold tracking-tight text-text-primary">
            {formatCurrency(product.price)}
          </p>

          {/* Availability + delivery time chips */}
          <div className="flex flex-wrap gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              product.availability
                ? "bg-primary/15 text-primary-light ring-1 ring-primary/20"
                : "bg-white/5 text-text-muted ring-1 ring-white/10"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                product.availability ? "bg-primary" : "bg-text-muted"
              )} />
              {product.availability ? "In Stock" : "Out of Stock"}
            </span>
            {product.deliveryTime && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-text-muted ring-1 ring-white/10">
                <Truck size={12} />
                {product.deliveryTime}
              </span>
            )}
          </div>

          {/* Rating — only if real */}
          {hasRating && (
            <div className="flex items-center gap-1.5">
              <Star size={16} className="fill-warning text-icon-highlight" />
              <span className="text-sm font-medium text-text-muted">
                {Number(product.rating).toFixed(1)}
              </span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-text-secondary">
              {product.description}
            </p>
          )}

          {/* Add to Cart */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="w-full sm:w-fit"
          >
            {addingToCart ? (
              <>
                <Check size={18} className="mr-2" />
                Added to Cart
              </>
            ) : (
              <>
                <ShoppingCart size={18} className="mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Vehicle Fitment ───────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Vehicle Compatibility
        </h2>
        <VehicleSelector onVehicleChange={setSelectedVehicle} initialVehicle={initialVehicle} />

        {selectedVehicle && (
          <div className="mt-4 flex flex-col gap-4">
            <Button
              variant="primary"
              size="lg"
              isLoading={fitmentLoading}
              disabled={fitmentLoading}
              onClick={handleCheckFitment}
              className="w-full sm:w-auto"
            >
              <Car size={18} className="mr-2" />
              Check Compatibility
            </Button>

            {fitmentResult && (
              <GlassCard
                variant="glass-lux"
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  fitmentResult.compatible
                    ? "border-success/30 bg-success/[0.04]"
                    : "border-red-500/30 bg-red-500/[0.04]",
                )}
              >
                <div className="flex items-start gap-4 p-5">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    fitmentResult.compatible
                      ? "bg-icon-highlight/15 text-icon-highlight"
                      : "bg-red-500/15 text-red-400",
                  )}>
                    {fitmentResult.compatible
                      ? <CheckCircle2 size={22} />
                      : <XCircle size={22} />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={cn(
                      "text-base font-semibold",
                      fitmentResult.compatible ? "text-success" : "text-red-300",
                    )}>
                      {fitmentResult.compatible ? "Compatible" : "Not Compatible"}
                    </h4>
                    {fitmentResult.compatible ? (
                      <p className="mt-1 text-sm text-text-muted">
                        This part is verified to fit your{" "}
                        <span className="font-medium text-text-primary">
                          {selectedVehicle.makeLabel} {selectedVehicle.modelLabel}
                        </span>.
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        {fitmentResult.nonFittingParts.map((msg, i) => (
                          <p key={i} className="flex items-start gap-2 text-sm text-text-muted">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-400" />
                            {msg}
                          </p>
                        ))}
                      </div>
                    )}
                    {fitmentResult.source === "demo" && (
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-warning/20 bg-warning/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-warning">
                        <AlertTriangle size={11} />
                        Demo check
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </section>

      {/* ── Product Details ────────────────────────────────── */}
      <GlassCard variant="glass-lux" className="p-6">
        <h2 className="mb-5 text-lg font-semibold text-text-primary">
          Product Details
        </h2>
        <dl className="divide-y divide-white/[0.06]">
          {product.brand && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-text-muted">Brand</dt>
              <dd className="text-right text-sm font-medium text-text-primary">
                {product.brand}
              </dd>
            </div>
          )}
          {product.vendor && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-text-muted">Sold by</dt>
              <dd className="text-right text-sm font-medium text-text-primary">
                {product.vendor}
              </dd>
            </div>
          )}
          {product.category && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-text-muted">Category</dt>
              <dd className="text-right text-sm font-medium text-text-primary">
                {product.category}
              </dd>
            </div>
          )}
          {product.availability !== undefined && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-text-muted">Availability</dt>
              <dd className="text-right text-sm font-medium text-text-primary">
                {product.availability ? "In Stock" : "Out of Stock"}
              </dd>
            </div>
          )}
          {hasRating && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-text-muted">Rating</dt>
              <dd className="text-right text-sm font-medium text-text-primary">
                {Number(product.rating).toFixed(1)} / 5
              </dd>
            </div>
          )}
          {product.createdAt && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-text-muted">Listed</dt>
              <dd className="text-right text-sm font-medium text-text-primary">
                {formatDate(product.createdAt)}
              </dd>
            </div>
          )}
        </dl>
      </GlassCard>

      {/* ── Related Products ──────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text-primary">
            Related Products
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {relatedProducts.map((rp) => (
              <div key={rp.id} className="w-48 shrink-0">
                <ProductCard product={rp} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Exported wrapper: useSearchParams requires a Suspense boundary during
 * static-export prerendering.
 */
export function ProductDetailWithParams(props) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailClient {...props} />
    </Suspense>
  );
}

