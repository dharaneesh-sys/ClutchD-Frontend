import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import { toCamelCase } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const INITIAL_FILTERS = {
  priceRange: null,
  brand: null,
  vendor: null,
  rating: null,
  availability: null,
  deliveryTime: null,
};

const SELLER_STORAGE_KEY = "seller-products";
const SELLER_ROLES = ["mechanic", "garage"];

/** Load seller listings from localStorage (SSR-safe). Persists across reloads. */
function loadSellerProducts() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SELLER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Persist seller listings to localStorage (best-effort). */
function persistSellerProducts(items) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage full or unavailable - listings stay in memory only
  }
}

/** Return the current user when they may sell, otherwise null. */
function getSellerUser() {
  const user = useAuthStore.getState().user;
  if (user && SELLER_ROLES.includes(user.role)) return user;
  return null;
}

const initialState = {
  sellerProducts: loadSellerProducts(),
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
       * Fetch products from the backend.
       * When params are provided, they are passed as query params to the API
       * so filtering/sorting happens server-side. Falls back to client-side
       * filtering if the API fails (e.g. server unreachable).
       *
       * Supported params: search, category, min_price, max_price, brand,
       * in_stock, sort_by, limit, offset.
       */
      fetchProducts: async (params = null) => {
        set({ isLoading: true, error: null });

        try {
          const queryString = params
            ? '?' + new URLSearchParams(
                Object.entries(params).filter(([_, v]) => v != null && v !== '')
              ).toString()
            : '';
          const { data } = await api.get(`/products${queryString}`);
          const products = toCamelCase(data?.products ?? []);
          const seller = get().sellerProducts;
          // Seller listings first so a new part is visible immediately.
          // Shape mirrors ProductResponse for future POST /api/marketplace/products.
          set({ products: [...seller, ...products], isLoading: false });
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Failed to load products." : "Server unreachable.");
          // Offline fallback (BACKEND_CONTRACTS rule): keep local seller listings visible.
          set({ products: [...get().sellerProducts], isLoading: false, error: msg });
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
      getProductById: (id) =>
        get().products.find((p) => p.id === id) ||
        get().sellerProducts.find((p) => p.id === id) ||
        null,

      /** Fetch a single product; deep-link fallback when local array is empty. Merges into products. */
      fetchProductById: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.get(`/products/${id}`);
          const product = toCamelCase(data);
          set((state) => ({
            products: state.products.some((p) => p.id === product.id)
              ? state.products
              : [...state.products, product],
            isLoading: false,
          }));
          return product;
        } catch (error) {
          const msg =
            error.response?.status === 404
              ? "Product not found."
              : error.response?.data?.detail ||
                (error.response ? "Failed to load product." : "Server unreachable.");
          set({ isLoading: false, error: msg });
          // Local fallback: a seller listing may exist without backend.
          const local = get().sellerProducts.find((p) => p.id === id) || null;
          if (local) {
            set((state) => ({
              products: state.products.some((p) => p.id === local.id)
                ? state.products
                : [local, ...state.products],
            }));
            return local;
          }
          return null;
        }
      },

      /**
       * Listings created by the current seller (mechanic|garage).
       * Persisted to localStorage; merged seller-first into products.
       */
      getMyListings: () => {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        return get().sellerProducts.filter((p) => p.vendorId === user.id);
      },

      /**
       * Add a seller listing. Role-guarded: mechanic|garage only.
       * Returns the created product, or null when blocked.
       * Shape mirrors ProductResponse for future POST /api/marketplace/products.
       */
      addSellerProduct: (data) => {
        const user = getSellerUser();
        if (!user) {
          useToastStore.getState().error("Only mechanics and garages can sell parts.");
          return null;
        }
        const now = new Date().toISOString();
        const product = {
          id: `seller-${Date.now()}`,
          name: data.name,
          description: data.description,
          brand: data.brand || "",
          vendor: user.garageName || user.shopName || user.businessName || user.name || "My Store",
          vendorId: user.id,
          price: Number(data.price),
          rating: 0,
          image: data.image || "",
          category: data.category || "",
          availability: data.availability !== false,
          deliveryTime: data.deliveryTime || "",
          createdAt: now,
          isSeller: true,
        };
        const next = [product, ...get().sellerProducts];
        persistSellerProducts(next);
        set({ sellerProducts: next, products: [product, ...get().products] });
        useToastStore.getState().success("Part listed successfully.");
        return product;
      },

      /**
       * Update one of the current seller's listings. Returns updated product or null.
       */
      updateSellerProduct: (id, patch) => {
        const user = getSellerUser();
        if (!user) {
          useToastStore.getState().error("Only mechanics and garages can sell parts.");
          return null;
        }
        const existing = get().sellerProducts.find((p) => p.id === id);
        if (!existing || existing.vendorId !== user.id) {
          useToastStore.getState().error("Listing not found.");
          return null;
        }
        const updated = {
          ...existing,
          ...patch,
          id: existing.id,
          vendorId: existing.vendorId,
          price: patch.price === undefined ? existing.price : Number(patch.price),
        };
        const next = get().sellerProducts.map((p) => (p.id === id ? updated : p));
        persistSellerProducts(next);
        set({
          sellerProducts: next,
          products: get().products.map((p) => (p.id === id ? updated : p)),
        });
        useToastStore.getState().success("Listing updated.");
        return updated;
      },

      /**
       * Delete one of the current seller's listings. Returns true on success.
       */
      removeSellerProduct: (id) => {
        const user = getSellerUser();
        if (!user) {
          useToastStore.getState().error("Only mechanics and garages can sell parts.");
          return false;
        }
        const existing = get().sellerProducts.find((p) => p.id === id);
        if (!existing || existing.vendorId !== user.id) {
          useToastStore.getState().error("Listing not found.");
          return false;
        }
        const next = get().sellerProducts.filter((p) => p.id !== id);
        persistSellerProducts(next);
        set({
          sellerProducts: next,
          products: get().products.filter((p) => p.id !== id),
        });
        useToastStore.getState().success("Listing removed.");
        return true;
      },

      /**
       * Manually toggle the loading state.
       */
      setLoading: (bool) => set({ isLoading: bool }),
    }),
    { name: "product-store" },
  ),
);
