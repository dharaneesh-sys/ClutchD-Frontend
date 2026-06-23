"use client";

import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "@/lib/utils";

/**
 * Maps a category name to a CategoryIcon key for icon rendering.
 * Falls back gracefully if no match is found (CategoryIcon handles this).
 * @param {string} name
 * @returns {string|null}
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
  };
  return map[name.toLowerCase()] ?? null;
}

/**
 * CategoryCard — a glass-lux tile with icon, name, and item count.
 *
 * @param {object}   category         - Category object from the store
 * @param {string}   category.id      - Unique identifier
 * @param {string}   category.name    - Display name
 * @param {number}   [category.productCount] - Number of products (optional)
 * @param {string}   [className]      - Additional wrapper classes
 */
export function CategoryCard({ category, className }) {
  const iconKey = resolveIconKey(category.name);

  return (
    <Link
      href={`/marketplace/categories/${category.id}`}
      className={cn(
        "glass-lux-interactive rounded-2xl p-4",
        "flex flex-col items-center gap-3 text-center",
        "hover:border-emerald-500/30",
        "hover-lift active-press",
        className
      )}
    >
      <CategoryIcon category={iconKey} size="lg" />
      <span className="text-sm font-medium text-on-surface leading-tight">
        {category.name}
      </span>
      {category.productCount != null && (
        <span className="text-[11px] text-muted font-medium">
          {category.productCount} items
        </span>
      )}
    </Link>
  );
}
