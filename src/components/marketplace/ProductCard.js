"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star, ShoppingCart, Check, Crown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/marketplace/ProductImage";
import { useCartStore } from "@/store/cartStore";
import { useSubscriptionStore } from "@/store/subscriptionStore";
import api from "@/lib/api";

/**
 * Product card for marketplace search results.
 *
 * @param {Object} product - The product object from store
 * @param {string} product.id - Product ID
 * @param {string} product.name - Product name
 * @param {string} product.description - Short product description
 * @param {number} product.price - Price in rupees
 * @param {number} product.rating - Star rating (0-5)
 * @param {string} product.image - Image URL
 * @param {string} product.brand - Brand name
 * @param {boolean} product.availability - In stock flag
 * @param {string} product.vendor - Vendor/store name
 * @param {string} product.vendorId - Vendor/store ID
 * @param {string} className - Additional classes
 */
export function ProductCard({ product, className }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [fav, setFav] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const subscriptionPlanId = useSubscriptionStore((s) => s.planId);
  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const isProUser = subscriptionPlanId === "pro" && subscriptionStatus === "active";

  if (!product) return null;

  const {
    id,
    name,
    description,
    price,
    rating,
    image,
    brand,
    availability,
    vendor,
    vendorId,
  } = product;

  const safePrice = price ?? 0;

  const handleToggleFav = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (favBusy) return;
    setFavBusy(true);
    try {
      if (fav) {
        await api.delete(`/favorites/${id}`);
        setFav(false);
      } else {
        await api.post("/favorites", { product_id: id });
        setFav(true);
      }
    } catch {
      // stays as-is; favorites page shows honest load errors
    } finally {
      setFavBusy(false);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (adding) return;

    setAdding(true);
    addItem(
      { id, price: safePrice, name, image },
      { id: vendorId || null, name: vendor || null },
    );
    setTimeout(() => setAdding(false), 1500);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/marketplace/product/id?id=${id}`)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/marketplace/product/id?id=${id}`); }}}
      className={cn(
        "glass-lux-interactive group rounded-2xl overflow-hidden cursor-pointer",
        "hover-lift active-press",
        className
      )}
    >
      {/* Clickable image section */}
      <Link href={`/marketplace/product/id?id=${id}`}>
        <div className="relative">
          <ProductImage
            src={image}
            alt={name}
            productName={name}
            className="aspect-[4/3]"
          />

          {/* Availability badge */}
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide uppercase",
                availability
                  ? "bg-primary/20 text-primary-light"
                  : "bg-white/10 text-text-muted"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  availability ? "bg-primary" : "bg-text-muted"
                )}
              />
              {availability ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Favorite toggle */}
          <button
            type="button"
            onClick={handleToggleFav}
            disabled={favBusy}
            aria-label={fav ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-xl transition-all active:scale-95",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              fav ? "bg-primary/30 text-white" : "bg-black/30 text-white/80 hover:text-white"
            )}
          >
            <Heart size={15} className={fav ? "fill-current" : ""} />
          </button>
        </div>
      </Link>

      {/* Content section */}
      <div className="p-4 space-y-2.5">
        {/* Brand */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-text-dim">
            {brand || vendor || "Generic"}
          </span>
        </div>

        {/* Clickable product name */}
        <Link href={`/marketplace/product/id?id=${id}`}>
          <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary-light transition-colors">
            {name}
          </h3>
        </Link>

        {/* Short description */}
        {description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Rating — only if real */}
        {Number(rating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <Star size={12} className="fill-warning text-icon-highlight" />
            <span className="text-xs font-medium text-text-muted">
              {Number(rating).toFixed(1)}
            </span>
          </div>
        )}

        {/* Price + Add to Cart - stacked on narrow, prevents overlap */}
        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex flex-col shrink-0 min-w-0">
              <span className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {isProUser ? formatCurrency(Math.round(safePrice * 0.7)) : formatCurrency(safePrice)}
              </span>
              {isProUser && safePrice > 0 && (
                <span className="text-[0.625rem] font-medium text-text-dim line-through">
                  {formatCurrency(safePrice)}
                </span>
              )}
            </div>
            {isProUser && safePrice > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-wider text-purple-300 whitespace-nowrap shrink-0">
                <Crown size={8} />
                Pro -30%
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.6875rem] font-semibold transition-all duration-200 shrink-0 whitespace-nowrap w-full sm:w-auto",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              adding
                ? "bg-primary/20 text-primary-light cursor-default"
                : "bg-primary text-white hover:bg-primary-light active:scale-95"
            )}
          >
            {adding ? (
              <>
                <Check size={14} className="shrink-0" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart size={14} className="shrink-0" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
