import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";

const DEMO_CATEGORIES = [
  {
    id: "engine-parts",
    name: "Engine Parts",
    description: "Pistons, rings, gaskets, timing belts, and other engine components",
    image: "/images/categories/engine.jpg",
    productCount: 24,
  },
  {
    id: "brake-parts",
    name: "Brake Parts",
    description: "Brake pads, discs, calipers, and brake fluid",
    image: "/images/categories/brakes.jpg",
    productCount: 18,
  },
  {
    id: "electrical",
    name: "Electrical Components",
    description: "Spark plugs, batteries, alternators, and wiring harnesses",
    image: "/images/categories/electrical.jpg",
    productCount: 32,
  },
  {
    id: "suspension",
    name: "Suspension Parts",
    description: "Shock absorbers, struts, springs, and bushings",
    image: "/images/categories/suspension.jpg",
    productCount: 15,
  },
  {
    id: "filters",
    name: "Filters",
    description: "Oil filters, air filters, fuel filters, and cabin filters",
    image: "/images/categories/filters.jpg",
    productCount: 12,
  },
  {
    id: "accessories",
    name: "Accessories",
    description: "Car care products, floor mats, covers, and interior accessories",
    image: "/images/categories/accessories.jpg",
    productCount: 35,
  },
];

const initialState = {
  categories: [],
  selectedCategory: null,
  isLoading: false,
};

export const useCategoryStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch categories from the API.
       * Falls back to demo categories when the API returns empty or fails.
       */
      fetchCategories: async () => {
        set({ isLoading: true });

        try {
          const { data } = await api.get("/categories");
          const categories = data?.categories?.length ? data.categories : DEMO_CATEGORIES;
          set({ categories, isLoading: false });
        } catch {
          // Populate from demo data on failure
          set({ categories: DEMO_CATEGORIES, isLoading: false });
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
