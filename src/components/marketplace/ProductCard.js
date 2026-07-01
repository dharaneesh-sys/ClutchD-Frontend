"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Truck, Clock, ShoppingCart, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { ProductImage } from "@/components/marketplace/ProductImage";
import { useCartStore } from "@/store/cartStore";

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
 * @param {string} product.deliveryTime - Estimated delivery time
 * @param {string} product.vendor - Vendor/store name
 * @param {string} product.vendorId - Vendor/store ID
 * @param {string} className - Additional classes
 */
export function ProductCard({ product, className }) {
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

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
    deliveryTime,
    vendor,
    vendorId,
  } = product;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (adding) return;

    setAdding(true);
    addItem(
      { id, price, name, image },
      { id: vendorId, name: vendor },
    );
    setTimeout(() => setAdding(false), 1500);
  };

  return (
    <div
      className={cn(
        "glass-lux-interactive group rounded-2xl overflow-hidden",
        "hover-lift active-press",
        className
      )}
    >
      {/* Clickable image section */}
      <Link href={`/marketplace/product/${id}`}>
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

          {/* Delivery time */}
          {deliveryTime && (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-sm px-2 py-1 text-[0.625rem] font-medium text-text-muted">
                <Clock size={10} className="shrink-0" />
                {deliveryTime}
              </span>
            </div>
          )}
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
        <Link href={`/marketplace/product/${id}`}>
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

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-text-muted">
            {rating.toFixed(1)}
          </span>
        </div>

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold tracking-tight text-foreground">
            {formatCurrency(price)}
          </span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.6875rem] font-semibold transition-all duration-200",
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
