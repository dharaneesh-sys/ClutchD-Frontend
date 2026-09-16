"use client";

import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";

/**
 * Maps a category name to a CategoryIcon key for icon rendering.
 * Used as fallback when no explicit icon slug is provided.
 */
function resolveIconKey(name) {
  const map = {
    "engine parts": "engine-parts",
    "brake parts": "brake-parts",
    "brakes & suspension": "brake-parts",
    electrical: "electrical",
    "electrical & lighting": "electrical",
    "fluids & lubricants": null,
    fluids: null,
    filters: "filters",
    suspension: "suspension",
    "exterior & body": "accessories",
    "wheels & tyres": null,
    "interior & accessories": "accessories",
    accessories: "accessories",
    "spare parts": "spare-parts",
    "spare-parts": "spare-parts",
    spareparts: "spare-parts",
    spares: "spare-parts",
  };
  return map[name.toLowerCase()] ?? null;
}

/**
 * CategoryCard — a glass-lux tile with icon, name, and item count.
 *
 * @param {object}   category              - Category object from the store
 * @param {string}   category.id           - Unique identifier (slug or id)
 * @param {string}   category.name         - Display name
 * @param {number}   [category.productCount] - Number of products (optional)
 * @param {string}   [icon]                - Explicit icon slug (e.g. "engine-parts").
 *                                           When provided, bypasses name-based resolution.
 * @param {string}   [className]           - Additional wrapper classes
 */
export function CategoryCard({ category, icon, className }) {
  const iconKey = icon || resolveIconKey(category.name);
  const isAccessories = iconKey === "accessories" || iconKey === "spare-parts";

  return (
    <Link
      href={`/marketplace/categories/${category.id}`}
      className={cn(
        "glass-lux-interactive rounded-2xl p-3.5",
        "flex flex-col items-center gap-2.5 text-center",
        "hover:border-primary/30",
        "hover-lift active-press",
        className
      )}
    >
      {isAccessories ? (
        <span className="inline-flex items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 w-16 h-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/marketplace/spare-parts.jpg"
            alt="Spare Parts category"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </span>
      ) : (
        <CategoryIcon category={iconKey} size="md" />
      )}
      <span className="text-sm font-medium text-on-surface leading-snug break-words max-w-full">
        {category.name}
      </span>
      {category.productCount != null && (
        <span className="text-[0.6875rem] text-muted font-medium">
          {category.productCount} item{category.productCount !== 1 ? "s" : ""}
        </span>
      )}
    </Link>
  );
}
