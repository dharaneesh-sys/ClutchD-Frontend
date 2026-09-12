"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { CategoryCard } from "@/components/marketplace/CategoryCard";

export default function CategoriesPage() {
  const categories = PRODUCT_CATEGORIES.map((cat) => ({
    id: cat.value,
    name: cat.label,
    productCount: null,
    description: cat.description,
    icon: cat.value, // pass the slug for direct icon resolution
  }));

  return (
    <div className="space-y-5 p-4 pb-8 page-enter">
      {/* Back + Header */}
      <div className="space-y-3">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Marketplace
        </Link>

        <div className="space-y-0.5">
          <h1 className="type-headline-3 text-foreground">Categories</h1>
          <p className="type-body-2 text-muted">
            Browse all {categories.length} product categories
          </p>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} icon={cat.icon} />
        ))}
      </div>
    </div>
  );
}
