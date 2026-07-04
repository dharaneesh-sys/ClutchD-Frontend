'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  CheckCircle2,
  Truck,
  Clock,
  Star,
  Package,
  XCircle,
  Car,
  AlertTriangle,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';

import { ProductImage } from '@/components/marketplace/ProductImage';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { VehicleSelector } from '@/components/marketplace/VehicleSelector';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatCurrency } from '@/lib/utils';
import { Shimmer, ShimmerCard } from '@/components/ui/Shimmer';
import { checkFitment } from '@/lib/fitment';



/* ──────────────────────────────────────────────────────────────
 *  Loading skeleton
 * ────────────────────────────────────────────────────────────── */

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4" aria-busy="true">
      {/* Back button shimmer */}
      <Shimmer className="h-5 w-36 rounded-lg" />

      {/* Hero section */}
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
            <Shimmer variant="badge" />
          </div>
        </div>
      </div>

      {/* Specs & Features */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ShimmerCard lines={6} hasAvatar={false} hasActions={false} />
        <ShimmerCard lines={6} hasAvatar={false} hasActions={false} />
      </div>

      {/* Related products skeleton */}
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

export default function ProductDetailClient({ id }) {
  const {
    products,
    isLoading,
    fetchProducts,
    getProductById,
  } = useProductStore();


  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [fitmentResult, setFitmentResult] = useState(null);
  const [fitmentLoading, setFitmentLoading] = useState(false);

  // Fetch products on mount if not already loaded
  useEffect(() => {
    if (products.length === 0 && !isLoading) {
      fetchProducts();
    }
  }, [products.length, isLoading, fetchProducts]);

  // Derive product from store
  const product = useMemo(
    () => getProductById(id),
    [id, getProductById, products],
  );

  // Product description — sourced from product data or API
  const details = null;

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

  // Image gallery — uses product image from the store
  const galleryImages = useMemo(() => {
    if (!product) return [];
    return [product.image].filter(Boolean);
  }, [product]);

  // ── Fitment check handler ──────────────────────────────────
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
        {/* Gallery */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl">
            <ProductImage
              src={galleryImages[selectedImage]}
              alt={product.name}
              productName={product.name}
              className="aspect-square w-full"
            />
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-2">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'w-16 h-16 overflow-hidden rounded-xl border-2 transition-all',
                    i === selectedImage
                      ? 'border-primary ring-1 ring-primary/30'
                      : 'border-transparent opacity-60 hover:opacity-100',
                  )}
                >
                  <ProductImage
                    src={img}
                    alt={`${product.name} view ${i + 1}`}
                    productName={product.name}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {/* Brand + Part Number */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {product.name}
              </h1>
              <p className="mt-0.5 text-base text-text-muted">
                {product.brand}
              </p>
            </div>
            <Badge variant="glass" className="shrink-0">
              {product.category}
            </Badge>
          </div>

          {/* Part number */}
          {details?.partNumber && (
            <p className="text-xs text-text-dim">
              Part #: <span className="font-mono">{details.partNumber}</span>
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2">
            <StarRating rating={product.rating} size={16} />
            <span className="text-sm text-text-muted">
              {Number(product.rating).toFixed(1)}
            </span>
            <Link
              href="#reviews"
              className="text-xs text-primary-light underline-offset-2 hover:underline"
            >
              See reviews
            </Link>
          </div>

          {/* Original store price */}
          <p className="text-2xl font-bold text-text-primary">
            {formatCurrency(product.price)}
          </p>

          {/* Description */}
          {details?.description && (
            <p className="text-sm leading-relaxed text-text-secondary">
              {details.description}
            </p>
          )}

          {/* Quick info chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-text-muted">
              <Clock size={12} />
              {product.deliveryTime || 'N/A'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-text-muted">
              <Truck size={12} />
              {product.availability ? 'In Stock' : 'Out of Stock'}
            </span>
            {details?.warranty && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-text-muted">
                <Shield size={12} />
                {details.warranty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Vehicle Fitment ───────────────────────────────── */}
      <VehicleSelector
        onVehicleChange={setSelectedVehicle}
      />

      {/* ── Check Compatibility ────────────────────────────── */}
      {selectedVehicle && (
        <div className="flex flex-col gap-4">
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

          {/* ── Fitment result ──────────────────────────────── */}
          {fitmentResult && (
            <GlassCard
              variant="glass-lux"
              className={cn(
                "overflow-hidden transition-all duration-300",
                fitmentResult.compatible
                  ? "border-emerald-500/30 bg-emerald-500/[0.04]"
                  : "border-red-500/30 bg-red-500/[0.04]",
              )}
            >
              <div className="flex items-start gap-4 p-5">
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    fitmentResult.compatible
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400",
                  )}
                >
                  {fitmentResult.compatible ? (
                    <CheckCircle2 size={22} />
                  ) : (
                    <XCircle size={22} />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h4
                    className={cn(
                      "text-base font-semibold",
                      fitmentResult.compatible
                        ? "text-emerald-300"
                        : "text-red-300",
                    )}
                  >
                    {fitmentResult.compatible
                      ? "Compatible"
                      : "Not Compatible"}
                  </h4>

                  {fitmentResult.compatible ? (
                    <p className="mt-1 text-sm text-text-muted">
                      This part is verified to fit your{" "}
                      <span className="font-medium text-text-primary">
                        {selectedVehicle.makeLabel} {selectedVehicle.modelLabel}
                      </span>
                      .
                    </p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {fitmentResult.nonFittingParts.map((msg, i) => (
                        <p
                          key={i}
                          className="flex items-start gap-2 text-sm text-text-muted"
                        >
                          <AlertTriangle
                            size={14}
                            className="mt-0.5 shrink-0 text-red-400"
                          />
                          {msg}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Source badge */}
                  {fitmentResult.source === "demo" && (
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[0.6875rem] font-medium text-amber-400">
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

      {/* ── Specs & Features ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Specifications */}
        <GlassCard variant="glass-lux" className="p-6">
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Specifications
          </h2>
          {details?.specs?.length > 0 ? (
            <dl className="divide-y divide-white/[0.06]">
              {details.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <dt className="text-sm text-text-muted">{spec.label}</dt>
                  <dd className="text-right text-sm font-medium text-text-primary">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-text-dim">
              No specifications available.
            </p>
          )}
        </GlassCard>

        {/* Features + Warranty */}
        <GlassCard variant="glass-lux" className="p-6">
          <h2 className="mb-5 text-lg font-semibold text-text-primary">
            Features
          </h2>
          {details?.features?.length > 0 ? (
            <ul className="space-y-3">
              {details.features.map((feat, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-text-secondary"
                >
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />
                  {feat}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-dim">No features listed.</p>
          )}

          {/* Warranty callout */}
          {details?.warranty && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <Shield size={20} className="shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Warranty
                </p>
                <p className="text-xs text-text-muted">{details.warranty}</p>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ── Vendor Pricing ────────────────────────────────── */}
      <GlassCard variant="glass-lux" className="p-6">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Vendor Pricing
        </h2>
        <p className="text-sm text-text-muted">
          Compare prices from multiple vendors. Vendor pricing will be available
          soon.
        </p>
      </GlassCard>

      {/* ── Rating Summary + Reviews Link ──────────────────── */}
      <GlassCard variant="glass-lux" id="reviews" className="p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {/* Big rating number */}
          <div className="flex shrink-0 flex-col items-center sm:items-start">
            <span className="text-4xl font-bold tracking-tight text-text-primary tabular-nums">
              {Number(product.rating).toFixed(1)}
            </span>
            <StarRating rating={product.rating} size={16} />
            <span className="mt-0.5 text-xs text-text-dim">
              {product.rating} average rating
            </span>
          </div>

          {/* Divider */}
          <div className="hidden h-12 w-px bg-white/[0.06] sm:block" />

          {/* Reviews CTA */}
          <div>
            <p className="text-sm text-text-secondary">
              Share your experience with this product and help other customers
              make informed decisions.
            </p>
            <Link
              href={`/marketplace/product/${id}/reviews`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-light transition-colors hover:text-primary"
            >
              <Star size={14} />
              Read & Write Reviews
            </Link>
          </div>
        </div>
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
