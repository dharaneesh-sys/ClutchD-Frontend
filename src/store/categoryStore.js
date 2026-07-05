import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import { toCamelCase } from "@/lib/utils";

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
