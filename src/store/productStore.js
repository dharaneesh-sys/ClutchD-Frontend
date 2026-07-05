import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import { toCamelCase } from "@/lib/utils";

const INITIAL_FILTERS = {
  priceRange: null,
  brand: null,
  vendor: null,
  rating: null,
  availability: null,
  deliveryTime: null,
};

const initialState = {
  products: [],
  filters: { ...INITIAL_FILTERS },
  searchQuery: "",
  isLoading: false,
  error: null,
};

export const useProductStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      fetchProducts: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.get("/products");
          const products = toCamelCase(data?.products ?? []);
          set({ products, isLoading: false });
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Failed to load products." : "Server unreachable.");
          set({ products: [], isLoading: false, error: msg });
        }
      },

      /**
       * Set the search query string.
       */
      searchProducts: (query) => set({ searchQuery: query }),

      /**
       * Set a single filter value by name.
       * Pass null to clear that filter.
       */
      setFilter: (name, value) =>
        set((state) => ({
          filters: { ...state.filters, [name]: value },
        })),

      /**
       * Reset all filters and search query to defaults.
       */
      clearFilters: () =>
        set({ filters: { ...INITIAL_FILTERS }, searchQuery: "" }),

      /**
       * Find a product by its id from the current products array.
       * Returns the product object or null.
       */
      getProductById: (id) => get().products.find((p) => p.id === id) || null,

      /**
       * Manually toggle the loading state.
       */
      setLoading: (bool) => set({ isLoading: bool }),
    }),
    { name: "product-store" },
  ),
);
