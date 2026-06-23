import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";

const DEMO_PRODUCTS = [
  {
    id: "prod-1",
    name: "Engine Oil 5W-30 (4L)",
    brand: "Shell",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 2199,
    rating: 4.5,
    image: "/images/products/engine-oil.jpg",
    category: "fluids",
    availability: true,
    deliveryTime: "2-3 days",
  },
  {
    id: "prod-2",
    name: "Brake Pad Set (Front)",
    brand: "Bosch",
    vendorId: "v-2",
    vendor: "Brake World",
    price: 1249,
    rating: 4.8,
    image: "/images/products/brake-pads.jpg",
    category: "brakes",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-3",
    name: "Air Filter",
    brand: "K&N",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 899,
    rating: 4.3,
    image: "/images/products/air-filter.jpg",
    category: "filters",
    availability: true,
    deliveryTime: "2-3 days",
  },
  {
    id: "prod-4",
    name: "Spark Plug Set (4 pcs)",
    brand: "NGK",
    vendorId: "v-3",
    vendor: "Spark Gears",
    price: 649,
    rating: 4.6,
    image: "/images/products/spark-plugs.jpg",
    category: "electrical",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-5",
    name: "Car Battery (60Ah)",
    brand: "Exide",
    vendorId: "v-4",
    vendor: "Battery Hub",
    price: 5499,
    rating: 4.7,
    image: "/images/products/car-battery.jpg",
    category: "electrical",
    availability: true,
    deliveryTime: "Same day",
  },
  {
    id: "prod-6",
    name: "Coolant Concentrate (5L)",
    brand: "Castrol",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 799,
    rating: 4.4,
    image: "/images/products/coolant.jpg",
    category: "fluids",
    availability: false,
    deliveryTime: "3-5 days",
  },
  {
    id: "prod-7",
    name: "Windshield Wiper Pair",
    brand: "Michelin",
    vendorId: "v-2",
    vendor: "Brake World",
    price: 449,
    rating: 4.2,
    image: "/images/products/wipers.jpg",
    category: "exterior",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-8",
    name: "LED Headlight Bulb (Pair)",
    brand: "Philips",
    vendorId: "v-3",
    vendor: "Spark Gears",
    price: 1599,
    rating: 4.9,
    image: "/images/products/led-bulb.jpg",
    category: "lighting",
    availability: true,
    deliveryTime: "2-3 days",
  },
];

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

      /**
       * Fetch products from the API.
       * Falls back to demo data when the API returns empty or fails.
       */
      fetchProducts: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.get("/products");
          const products = data?.products?.length ? data.products : DEMO_PRODUCTS;
          set({ products, isLoading: false });
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Failed to load products." : "Server unreachable.");
          // Use demo data as fallback
          set({ products: DEMO_PRODUCTS, isLoading: false, error: msg });
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
