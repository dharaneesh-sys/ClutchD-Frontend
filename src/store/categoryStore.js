import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";

/**
 * Convert snake_case keys to camelCase recursively.
 */
function toCamelCase(obj) {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamelCase(v),
      ])
    );
  }
  return obj;
}

const initialState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
};

export const useCategoryStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchCategories: async () => {
        set({ isLoading: true });

        try {
          const { data } = await api.get("/categories");
          const categories = toCamelCase(data?.categories ?? []);
          set({ categories, isLoading: false });
        } catch {
          set({ categories: [], isLoading: false, error: "Failed to load categories." });
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
