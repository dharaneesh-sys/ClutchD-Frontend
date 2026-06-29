"use client";

import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { CategoryCard } from "@/components/marketplace/CategoryCard";

export default function CategoriesPage() {
  const categories = PRODUCT_CATEGORIES.map((cat) => ({
    id: cat.value,
    name: cat.label,
  }));

  return (
    <div className="p-4 page-enter">
      {/* Header */}
      <div className="space-y-1 mb-7">
        <h1 className="type-headline-3 text-foreground">Categories</h1>
        <p className="type-body-2 text-muted">
          Browse all {categories.length} product categories
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  );
}
