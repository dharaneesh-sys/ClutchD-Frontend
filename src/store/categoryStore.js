import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";

const DEMO_CATEGORIES = [
  {
    id: "cat-1",
    name: "Engine Parts",
    description: "Engine components, gaskets, belts, and timing kits",
    image: "/images/categories/engine.jpg",
    productCount: 24,
  },
  {
    id: "cat-2",
    name: "Brakes & Suspension",
    description: "Brake pads, discs, shock absorbers, and struts",
    image: "/images/categories/brakes.jpg",
    productCount: 18,
  },
  {
    id: "cat-3",
    name: "Electrical & Lighting",
    description: "Batteries, spark plugs, bulbs, and wiring",
    image: "/images/categories/electrical.jpg",
    productCount: 32,
  },
  {
    id: "cat-4",
    name: "Fluids & Lubricants",
    description: "Engine oil, coolant, brake fluid, and greases",
    image: "/images/categories/fluids.jpg",
    productCount: 15,
  },
  {
    id: "cat-5",
    name: "Filters",
    description: "Air, oil, fuel, and cabin filters",
    image: "/images/categories/filters.jpg",
    productCount: 12,
  },
  {
    id: "cat-6",
    name: "Exterior & Body",
    description: "Wipers, mirrors, body panels, and trim",
    image: "/images/categories/exterior.jpg",
    productCount: 20,
  },
  {
    id: "cat-7",
    name: "Wheels & Tyres",
    description: "Tyres, alloys, rims, and wheel accessories",
    image: "/images/categories/tyres.jpg",
    productCount: 28,
  },
  {
    id: "cat-8",
    name: "Interior & Accessories",
    description: "Floor mats, seat covers, dash cams, and infotainment",
    image: "/images/categories/interior.jpg",
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
