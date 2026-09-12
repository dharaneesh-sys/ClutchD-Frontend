import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import { toCamelCase } from "@/lib/utils";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

const initialState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
};

const norm = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";

function isAccessoriesLike(c) {
  return norm(c?.name).includes("accessor") || norm(c?.slug).includes("accessor");
}

function isSparePartsLike(c) {
  const n = norm(c?.name);
  const s = norm(c?.slug);
  return (
    n.includes("sparepart") ||
    s.includes("sparepart") ||
    n === "spares" ||
    s === "spares" ||
    n.includes("spare") ||
    s.includes("spare")
  );
}

/**
 * Reduce any backend category list to exactly 2 tiles:
 * Accessories (as-is) + Spare Parts (consolidated group of all non-accessory
 * items, since the backend seeds no dedicated "Spare Parts" category).
 * Backend ids are UUIDs — normalize routing id to slug so CategoryCard links
 * (`/marketplace/categories/[id]`) match product `category` slugs.
 */
function toTwoCategories(raw) {
  const list = (raw ?? []).map((c) => ({
    ...c,
    id: c.slug || c.id,
    slug: c.slug || c.id,
    productCount: c.productCount ?? c.product_count ?? 0,
  }));

  const accessories =
    list.find((c) => isAccessoriesLike(c)) ||
    list.find((c) => norm(c.name) === "accessories");

  const existingSpare = list.find((c) => isSparePartsLike(c));

  if (existingSpare) {
    // Backend already has a spare-parts-like category — keep it + accessories.
    const out = [];
    if (accessories) out.push(accessories);
    if (existingSpare.id !== accessories?.id) out.push(existingSpare);
    return out;
  }

  const nonAccessory = list.filter((c) => !isAccessoriesLike(c));
  const spareCount = nonAccessory.reduce(
    (sum, c) => sum + (Number(c.productCount) || 0),
    0,
  );

  const out = [];
  if (accessories) out.push(accessories);
  // Always synthesize the consolidated Spare Parts tile when the backend
  // has no dedicated one, so the UI shows exactly 2 tiles.
  out.push({
    id: "spare-parts",
    slug: "spare-parts",
    name: "Spare Parts",
    description:
      "Engine, brake, electrical, suspension, filters and other replacement parts",
    productCount: spareCount,
  });
  return out;
}

function fallbackTwoCategories() {
  return PRODUCT_CATEGORIES.map((cat) => ({
    id: cat.value,
    slug: cat.value,
    name: cat.label,
    description: cat.description,
  }));
}

export const useCategoryStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchCategories: async () => {
        set({ isLoading: true });

        try {
          const { data } = await api.get("/categories");
          const raw = toCamelCase(data?.categories ?? []);
          const categories =
            raw.length > 0 ? toTwoCategories(raw) : fallbackTwoCategories();
          set({ categories, isLoading: false });
        } catch {
          set({
            categories: fallbackTwoCategories(),
            isLoading: false,
            error: "Failed to load categories.",
          });
        }
      },

      /**
       * Set the selected category by id.
       * Pass null to deselect.
       */
      selectCategory: (id) => set({ selectedCategory: id }),

      /**
       * Get a category object by its id.
       */
      getCategoryById: (id) =>
        get().categories.find((c) => c.id === id) || null,
    }),
    { name: "category-store" },
  ),
);
