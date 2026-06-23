'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Truck,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  XCircle,
  Package,
} from 'lucide-react';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';
import { productVendors as allProductVendors } from '@/lib/demo/data/productVendors';
import { vendors as vendorData } from '@/lib/demo/data/vendors';
import { ProductImage } from '@/components/marketplace/ProductImage';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn, formatCurrency } from '@/lib/utils';
import { Shimmer, ShimmerCard } from '@/components/ui/Shimmer';

/* ──────────────────────────────────────────────────────────────
 *  Enhanced demo product details (store data is minimal)
 * ────────────────────────────────────────────────────────────── */

const PRODUCT_DETAILS = {
  'prod-1': {
    partNumber: 'SHELL-5W30-4L',
    description:
      'High-performance synthetic engine oil engineered for modern petrol and diesel engines. Provides exceptional protection against wear, sludge, and thermal breakdown while optimizing fuel efficiency across all driving conditions.',
    specs: [
      { label: 'Viscosity', value: '5W-30' },
      { label: 'Volume', value: '4 Litres' },
      { label: 'Type', value: 'Fully Synthetic' },
      { label: 'API Rating', value: 'SP / CF' },
      { label: 'ACEA Rating', value: 'C3' },
      { label: 'Suitable For', value: 'Petrol & Diesel' },
    ],
    features: [
      'Advanced synthetic formulation for superior engine protection',
      'Excellent thermal stability under extreme temperatures',
      'Reduces engine wear by up to 50 % compared to conventional oils',
      'Enhanced fuel economy performance for longer drives',
      'Meets latest API SP specifications',
      'Compatible with turbocharged and hybrid engines',
    ],
    warranty: '5 Years / 50,000 km',
    images: ['/images/products/engine-oil.jpg'],
  },
  'prod-2': {
    partNumber: 'BOSCH-BP-F-001',
    description:
      'Premium ceramic brake pad set for the front axle. Delivers consistent stopping power with minimal dust and noise. Engineered for both daily commuting and spirited driving.',
    specs: [
      { label: 'Position', value: 'Front Axle' },
      { label: 'Material', value: 'Ceramic Composite' },
      { label: 'Friction Rating', value: 'GG' },
      { label: 'Wear Indicator', value: 'Built-in' },
      { label: 'Quantity', value: '4 Pads (2 wheels)' },
      { label: 'Vehicle Fit', value: 'Most Sedans & SUVs' },
    ],
    features: [
      'Low-dust ceramic formulation keeps wheels cleaner',
      'Quiet braking with advanced shim technology',
      'Consistent performance across temperature range',
      'Built-in wear sensors for safety alerts',
      'ECE R90 certified for road use',
      'Includes premium stainless steel clips',
    ],
    warranty: '3 Years / 30,000 km',
    images: ['/images/products/brake-pads.jpg'],
  },
  'prod-3': {
    partNumber: 'KN-AF-101',
    description:
      'High-flow performance air filter designed to increase horsepower and acceleration. Washable and reusable, this filter provides superior filtration while allowing more airflow than standard disposable filters.',
    specs: [
      { label: 'Type', value: 'Panel Filter' },
      { label: 'Material', value: 'Cotton Gauze' },
      { label: 'Length', value: '265 mm' },
      { label: 'Width', value: '195 mm' },
      { label: 'Height', value: '38 mm' },
      { label: 'Reusable', value: 'Yes — Washable' },
    ],
    features: [
      'Increases airflow up to 50 % over standard filters',
      'Washable and reusable — no replacement needed',
      'Pleated cotton gauze for maximum filtration',
      'Backed by 10-year / 1,60,000 km warranty',
      'Simple 10-minute installation',
      'Designed for both performance and fuel economy',
    ],
    warranty: '10 Years / 1,60,000 km',
    images: ['/images/products/air-filter.jpg'],
  },
  'prod-4': {
    partNumber: 'NGK-SP-4PACK',
    description:
      'Premium iridium spark plug set engineered for maximum performance and longevity. Iridium centre electrode provides superior durability and a more focused spark for complete combustion.',
    specs: [
      { label: 'Type', value: 'Iridium' },
      { label: 'Qty', value: '4 Plugs' },
      { label: 'Thread Size', value: '14 mm' },
      { label: 'Reach', value: '19 mm' },
      { label: 'Gap', value: '1.1 mm (Pre-gapped)' },
      { label: 'Resistor', value: '5 kΩ Built-in' },
    ],
    features: [
      'Ultra-fine iridium centre electrode (0.4 mm)',
      'Longer service life — up to 1,00,000 km',
      'Improved throttle response and fuel efficiency',
      'Pre-gapped for accurate installation',
      'Triple-gasketed shell prevents leakage',
      'Corrosion-resistant plating',
    ],
    warranty: '4 Years / 80,000 km',
    images: ['/images/products/spark-plugs.jpg'],
  },
  'prod-5': {
    partNumber: 'EXIDE-60AH',
    description:
      'Maintenance-free automotive battery with 60 Ah capacity. Delivers reliable cold-cranking power and vibration resistance for demanding Indian road conditions. Backed by industry-leading warranty.',
    specs: [
      { label: 'Capacity', value: '60 Ah' },
      { label: 'CCA', value: '540 A' },
      { label: 'Voltage', value: '12 V' },
      { label: 'Terminal', value: 'T1 (Standard)' },
      { label: 'Type', value: 'Maintenance-Free' },
      { label: 'Weight', value: '14.5 kg' },
    ],
    features: [
      'Maintenance-free — no water topping required',
      'Calcium-calcium technology for longer life',
      'Vibration-resistant construction for Indian roads',
      'Spill-proof and leak-proof design',
      'Factory-charged — ready to install',
      'Includes 12-month roadside assistance',
    ],
    warranty: '3 Years (2+1)',
    images: ['/images/products/car-battery.jpg'],
  },
  'prod-6': {
    partNumber: 'CASTROL-COOL-5L',
    description:
      'Ready-to-use coolant concentrate formulated for modern aluminium engines. Provides superior protection against freezing, boiling, and corrosion while maintaining optimal engine temperature.',
    specs: [
      { label: 'Volume', value: '5 Litres' },
      { label: 'Type', value: 'Concentrate' },
      { label: 'Colour', value: 'Red' },
      { label: 'Base', value: 'Ethylene Glycol' },
      { label: 'Boiling Point', value: '108 °C (50:50 mix)' },
      { label: 'Freeze Point', value: '-36 °C (50:50 mix)' },
    ],
    features: [
      'Protection against freezing up to -36 °C',
      'Anti-boil protection up to 108 °C',
      'Corrosion inhibitors protect aluminium radiators',
      'Compatible with all major OEM specifications',
      'Prevents scale and deposit build-up',
      'Suitable for all petrol and diesel engines',
    ],
    warranty: '2 Years',
    images: ['/images/products/coolant.jpg'],
  },
  'prod-7': {
    partNumber: 'MICHELIN-WW-PAIR',
    description:
      'Premium beam-type windshield wipers with integrated spoiler. Deliver streak-free wiping performance in all weather conditions. The aerodynamic design reduces lift at high speeds.',
    specs: [
      { label: 'Type', value: 'Beam (Flat)' },
      { label: 'Length (Driver)', value: '26 inches' },
      { label: 'Length (Passenger)', value: '16 inches' },
      { label: 'Material', value: 'EDPM Rubber + Steel' },
      { label: 'Connector', value: 'Multi-adaptor (Hook / Pin)' },
      { label: 'Quantity', value: '2 Wipers (Pair)' },
    ],
    features: [
      'Beam-type design for uniform pressure across the blade',
      'Built-in spoiler reduces lift at highway speeds',
      'Dual rubber compound for streak-free wiping',
      'Weather-resistant EDPM rubber lasts longer',
      'Quick-install multi-adaptor fitting kit included',
      'Silent operation against the windshield',
    ],
    warranty: '1 Year',
    images: ['/images/products/wipers.jpg'],
  },
  'prod-8': {
    partNumber: 'PHILIPS-LED-PAIR',
    description:
      'Ultra-bright LED headlight bulbs that deliver a crisp white beam with three times the output of standard halogen bulbs. Fanless passive cooling ensures silent and reliable operation.',
    specs: [
      { label: 'Type', value: 'LED (Canbus-ready)' },
      { label: 'Socket', value: 'H4 / 9003' },
      { label: 'Lumens', value: '6,000 lm per bulb' },
      { label: 'Colour Temp', value: '6,000 K (Crystal White)' },
      { label: 'Power', value: '36 W per bulb' },
      { label: 'Cooling', value: 'Passive (Fanless)' },
    ],
    features: [
      '3× brighter than standard halogen bulbs',
      'Crystal white 6,000 K light for better visibility',
      'Canbus-ready — no error codes on most vehicles',
      'Fanless design for silent operation',
      'IP67 waterproof rating for all-weather use',
      'Plug-and-play installation fits stock housings',
    ],
    warranty: '5 Years',
    images: ['/images/products/led-bulb.jpg'],
  },
};

/* ──────────────────────────────────────────────────────────────
 *  Helpers
 * ────────────────────────────────────────────────────────────── */

/**
 * Convert a store product ID (prod-1) to the vendor data ID format (prod-001).
 */
function toVendorProductId(storeId) {
  const num = storeId.replace('prod-', '');
  return `prod-${String(Number(num)).padStart(3, '0')}`;
}

/**
 * Convert delivery days to a human-friendly string.
 */
function formatDelivery(days) {
  if (days === 0) return 'Same day';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * Determine stock status and return a config object for the Badge.
 */
function getStockConfig(stock) {
  if (stock === 0)
    return {
      label: 'Out of Stock',
      variant: 'danger',
      icon: XCircle,
    };
  if (stock <= 10)
    return {
      label: `Low Stock (${stock})`,
      variant: 'warning',
      icon: AlertTriangle,
    };
  return {
    label: `In Stock (${stock})`,
    variant: 'success',
    icon: CheckCircle2,
  };
}

/* ──────────────────────────────────────────────────────────────
 *  Sub-components
 * ────────────────────────────────────────────────────────────── */

/**
 * Loading skeleton shown while products are being fetched.
 */
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

      {/* Vendor table skeleton */}
      <div className="space-y-3">
        <Shimmer className="h-6 w-48 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-2xl p-4">
            <Shimmer className="h-4 w-32 rounded-lg" />
            <Shimmer className="h-4 w-20 flex-1 rounded-lg" />
            <Shimmer className="h-4 w-20 rounded-lg" />
            <Shimmer variant="badge" />
            <Shimmer variant="badge" />
            <Shimmer variant="button" />
          </div>
        ))}
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

/**
 * Stock status badge rendered inside the vendor table.
 */
function StockBadge({ stock }) {
  const config = getStockConfig(stock);
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1.5 whitespace-nowrap">
      <Icon size={12} />
      {config.label}
    </Badge>
  );
}

/**
 * Sort button for the vendor comparison table header.
 */
function SortButton({ label, active, direction, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium transition-colors',
        active ? 'text-primary-light' : 'text-text-muted hover:text-text-primary',
      )}
    >
      {label}
      {active && direction === 'asc' && <ChevronUp size={12} />}
      {active && direction === 'desc' && <ChevronDown size={12} />}
    </button>
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
  const addItem = useCartStore((s) => s.addItem);

  const [sortField, setSortField] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingVendorId, setAddingVendorId] = useState(null);

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

  // Enhanced details
  const details = useMemo(
    () => (product ? PRODUCT_DETAILS[product.id] : null),
    [product],
  );

  // Vendor pricing for this product
  const vendorProductId = useMemo(() => toVendorProductId(id), [id]);

  const vendorPricing = useMemo(
    () => allProductVendors.filter((pv) => pv.productId === vendorProductId),
    [vendorProductId],
  );

  // Merge vendor pricing with vendor info
  const vendorRows = useMemo(
    () =>
      vendorPricing
        .map((pv) => ({
          ...pv,
          vendor: vendorData.find((v) => v.id === pv.vendorId),
        }))
        .filter((row) => row.vendor),
    [vendorPricing],
  );

  // Sorted vendors
  const sortedVendors = useMemo(() => {
    const sorted = [...vendorRows];
    sorted.sort((a, b) => {
      if (sortField === 'price') {
        return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
      }
      if (sortField === 'delivery') {
        return sortOrder === 'asc'
          ? a.deliveryDays - b.deliveryDays
          : b.deliveryDays - a.deliveryDays;
      }
      return 0;
    });
    return sorted;
  }, [vendorRows, sortField, sortOrder]);

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

  // Image gallery sources
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (details?.images?.length) return details.images;
    return [product.image].filter(Boolean);
  }, [product, details]);

  // Toggle sort
  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    },
    [sortField],
  );

  // Add to cart from vendor row
  const handleAddToCart = useCallback(
    (vendorRow) => {
      if (!product) return;
      setAddingVendorId(vendorRow.vendorId);

      // Use setTimeout to let the UI update before the potentially blocking state update
      setTimeout(() => {
        addItem(
          {
            id: product.id,
            price: vendorRow.price,
            name: product.name,
            image: product.image,
          },
          { id: vendorRow.vendorId, name: vendorRow.vendor?.name || '' },
        );
        setAddingVendorId(null);
      }, 150);
    },
    [product, addItem],
  );

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
    <div className="mx-auto max-w-7xl animate-fade-in-up space-y-10 p-4 pb-24">
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
              {product.rating.toFixed(1)}
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

      {/* ── Vendor Comparison Table ───────────────────────── */}
      <GlassCard variant="glass-lux" className="overflow-hidden p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-text-primary">
            Compare Vendors
          </h2>

          {/* Sort controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-dim">Sort by</span>
            <SortButton
              label="Price"
              active={sortField === 'price'}
              direction={sortOrder}
              onClick={() => handleSort('price')}
            />
            <SortButton
              label="Delivery"
              active={sortField === 'delivery'}
              direction={sortOrder}
              onClick={() => handleSort('delivery')}
            />
          </div>
        </div>

        {/* Empty state — no vendors */}
        {vendorRows.length === 0 && (
          <div className="py-8 text-center">
            <Package size={32} className="mx-auto mb-2 text-text-dim" />
            <p className="text-sm text-text-muted">
              No vendor pricing available for this product.
            </p>
          </div>
        )}

        {/* Desktop table */}
        {sortedVendors.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                  <th className="pb-3 pr-4">Vendor</th>
                  <th className="pb-3 pr-4">Price</th>
                  <th className="pb-3 pr-4">Original Price</th>
                  <th className="pb-3 pr-4">Stock</th>
                  <th className="pb-3 pr-4">Delivery</th>
                  <th className="pb-3 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {sortedVendors.map((row) => (
                  <tr
                    key={row.vendorId}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    {/* Vendor name */}
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-text-dim">
                          {row.vendor?.name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'V'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {row.vendor?.name}
                          </p>
                          {row.vendor?.rating && (
                            <div className="mt-0.5 flex items-center gap-1">
                              <Star
                                size={10}
                                className="fill-amber-400 text-amber-400"
                              />
                              <span className="text-[11px] text-text-dim">
                                {row.vendor.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-4 pr-4">
                      <span className="text-base font-bold text-text-primary tabular-nums">
                        {formatCurrency(row.price)}
                      </span>
                    </td>

                    {/* Original price */}
                    <td className="py-4 pr-4">
                      {row.originalPrice ? (
                        <span className="text-sm text-text-dim line-through">
                          {formatCurrency(row.originalPrice)}
                        </span>
                      ) : (
                        <span className="text-sm text-text-dim">—</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-4 pr-4">
                      <StockBadge stock={row.stock} />
                    </td>

                    {/* Delivery */}
                    <td className="py-4 pr-4">
                      <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
                        <Truck size={14} />
                        {formatDelivery(row.deliveryDays)}
                      </span>
                    </td>

                    {/* Add to Cart */}
                    <td className="py-4 text-right">
                      <Button
                        size="sm"
                        variant={row.stock === 0 ? 'secondary' : 'primary'}
                        disabled={row.stock === 0}
                        isLoading={addingVendorId === row.vendorId}
                        onClick={() => handleAddToCart(row)}
                      >
                        <ShoppingCart size={14} className="mr-1" />
                        Add to Cart
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile vendor cards */}
        {sortedVendors.length > 0 && (
          <div className="space-y-3 md:hidden">
            {sortedVendors.map((row) => (
              <div
                key={row.vendorId}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
              >
                {/* Vendor header */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-xs font-bold text-text-dim">
                    {row.vendor?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'V'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {row.vendor?.name}
                    </p>
                    {row.vendor?.rating && (
                      <div className="flex items-center gap-1">
                        <Star
                          size={10}
                          className="fill-amber-400 text-amber-400"
                        />
                        <span className="text-[11px] text-text-dim">
                          {row.vendor.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing row */}
                <div className="mb-3 flex items-baseline gap-3">
                  <span className="text-xl font-bold text-text-primary tabular-nums">
                    {formatCurrency(row.price)}
                  </span>
                  {row.originalPrice && (
                    <span className="text-sm text-text-dim line-through">
                      {formatCurrency(row.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Stock + Delivery */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <StockBadge stock={row.stock} />
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <Truck size={12} />
                    {formatDelivery(row.deliveryDays)}
                  </span>
                </div>

                {/* Add to Cart */}
                <Button
                  className="w-full"
                  size="sm"
                  variant={row.stock === 0 ? 'secondary' : 'primary'}
                  disabled={row.stock === 0}
                  isLoading={addingVendorId === row.vendorId}
                  onClick={() => handleAddToCart(row)}
                >
                  <ShoppingCart size={14} className="mr-1" />
                  Add to Cart — {formatCurrency(row.price)}
                </Button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── Rating Summary + Reviews Link ──────────────────── */}
      <GlassCard variant="glass-lux" id="reviews" className="p-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {/* Big rating number */}
          <div className="flex shrink-0 flex-col items-center sm:items-start">
            <span className="text-4xl font-bold tracking-tight text-text-primary tabular-nums">
              {product.rating.toFixed(1)}
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
