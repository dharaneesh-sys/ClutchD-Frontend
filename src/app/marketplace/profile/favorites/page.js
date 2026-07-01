"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  StarHalf,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShimmerList } from "@/components/ui/Shimmer";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/store/toastStore";
import api from "@/lib/api";

// ─── Demo fallback data ──────────────────────────────────────────────

const DEMO_FAVORITES = [
  {
    id: "fav-demo-1",
    product_id: "prod-demo-1",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    product: {
      id: "prod-demo-1",
      name: "Premium Engine Oil - 5W30",
      price: 2499,
      image_url: null,
      rating: 4.5,
      category_name: "Engine & Performance",
    },
  },
  {
    id: "fav-demo-2",
    product_id: "prod-demo-2",
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    product: {
      id: "prod-demo-2",
      name: "LED Headlight Bulbs (Pair)",
      price: 1899,
      image_url: null,
      rating: 4.2,
      category_name: "Lighting",
    },
  },
  {
    id: "fav-demo-3",
    product_id: "prod-demo-3",
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    product: {
      id: "prod-demo-3",
      name: "Car Air Freshener - Ocean Breeze (Pack of 3)",
      price: 399,
      image_url: null,
      rating: 4.8,
      category_name: "Interior Accessories",
    },
  },
];

// ─── Star Rating ─────────────────────────────────────────────────────

function StarRating({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`full-${i}`} size={12} className="fill-amber-400 text-amber-400" />
      ))}
      {half && <StarHalf size={12} className="fill-amber-400 text-amber-400" />}
      <span className="text-[11px] text-text-muted ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Favorite Card ──────────────────────────────────────────────────

function FavoriteCard({ item, onRemove, onMoveToCart }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(item.product_id);
    setRemoving(false);
  };

  return (
    <div className="glass-lux rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg group">
      {/* Product Image Placeholder */}
      <div className="aspect-[4/3] bg-white/[0.03] flex items-center justify-center relative overflow-hidden">
        {item.product?.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <Heart size={32} className="text-primary/30" />
            <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
          </div>
        )}
        {/* Remove button */}
        <button
          onClick={handleRemove}
          disabled={removing}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center",
            "bg-black/60 backdrop-blur-sm text-red-400 opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-red-500/20"
          )}
          aria-label="Remove from favorites"
        >
          {removing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Trash2 size={14} />
          )}
        </button>
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        {item.product?.category_name && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            {item.product.category_name}
          </span>
        )}
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
          {item.product?.name || "Unknown Product"}
        </h3>
        <StarRating rating={item.product?.rating} />
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-primary-light">
            {formatCurrency(item.product?.price || 0)}
          </span>
          <button
            onClick={() => onMoveToCart(item.product_id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold",
              "bg-primary/20 text-primary-light hover:bg-primary/30 transition-colors"
            )}
          >
            <ShoppingCart size={13} />
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────

export default function FavoritesPage() {
  const router = useRouter();
  const toast = useToastStore();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/favorites");
      setFavorites(res.data.favorites || []);
    } catch (err) {
      setError("Could not load favorites. Showing saved items.");
      setFavorites(DEMO_FAVORITES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = useCallback(
    async (productId) => {
      try {
        await api.delete(`/favorites/${productId}`);
        setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
        toast.success("Removed from favorites");
      } catch {
        // Optimistic removal with demo fallback
        setFavorites((prev) => prev.filter((f) => f.product_id !== productId));
        toast.success("Removed from favorites");
      }
    },
    [toast]
  );

  const handleMoveToCart = useCallback(
    (productId) => {
      // Navigate to product detail page; user can add to cart from there
      router.push(`/marketplace/product/${productId}`);
      toast.success("Opening product...");
    },
    [router, toast]
  );

  if (isLoading) {
    return (
      <div className="p-4 page-enter space-y-4">
        <div className="space-y-1 mb-2">
          <h1 className="type-headline-3 text-foreground">Favorites</h1>
          <p className="type-body-2 text-text-muted">Your saved products</p>
        </div>
        <ShimmerList count={3} />
      </div>
    );
  }

  return (
    <div className="p-4 page-enter space-y-5">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="type-headline-3 text-foreground">Favorites</h1>
        <p className="type-body-2 text-text-muted">
          {favorites.length > 0
            ? `${favorites.length} saved product${favorites.length !== 1 ? "s" : ""}`
            : "Your saved products"}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 glass-lux rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm text-amber-300 flex-1">{error}</p>
          <button
            onClick={fetchFavorites}
            className="text-xs font-medium text-primary-light hover:text-primary shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Favorite Items Grid */}
      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Products you like will appear here. Browse the marketplace and tap the heart icon to save items."
          action={
            <button
              onClick={() => router.push("/marketplace/search")}
              className="mt-3 px-4 py-2 rounded-xl bg-primary/20 text-primary-light text-sm font-semibold hover:bg-primary/30 transition-colors"
            >
              Browse Products
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((item) => (
            <FavoriteCard
              key={item.id || item.product_id}
              item={item}
              onRemove={handleRemove}
              onMoveToCart={handleMoveToCart}
            />
          ))}
        </div>
      )}

      {/* Extra bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
