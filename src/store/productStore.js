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
// Dedicated seller role first-class; mechanic/garage keep their legacy selling ability.
export const SELLER_ROLES = ["seller", "mechanic", "garage"];

/** Load seller listings from localStorage (SSR-safe). Offline fallback only. */
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

/** Build a backend ProductCreate payload from form data. */
function toProductPayload(data) {
  return {
    name: data.name,
    price: Number(data.price),
    description: data.description || null,
    brand: data.brand || null,
    category: data.category || null,
    image: data.image || null,
    availability: data.availability !== false,
    delivery_time: data.deliveryTime || null,
  };
}

/** Local-only listing shape (used when the backend is unreachable). */
function localListing(user, data) {
  return {
    id: `seller-${Date.now()}`,
    name: data.name,
    description: data.description,
    brand: data.brand || "",
    vendor: user.storeName || user.garageName || user.name || "My Store",
    vendorId: user.id,
    price: Number(data.price),
    rating: 0,
    image: data.image || "",
    category: data.category || "",
    availability: data.availability !== false,
    deliveryTime: data.deliveryTime || "",
    createdAt: new Date().toISOString(),
    isSeller: true,
    localOnly: true,
  };
}

const SELLER_BLOCKED_MSG = "Only sellers, mechanics and garages can sell parts.";

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
       * Fetch the current seller's listings from the backend.
       * Falls back to local listings when the server is unreachable.
       */
      fetchMyListings: async () => {
        try {
          const { data } = await api.get("/products/my-listings");
          const listings = toCamelCase(data?.products ?? []);
          set({ sellerProducts: listings });
          persistSellerProducts(listings);
          return listings;
        } catch {
          // Offline fallback: keep whatever is cached locally.
          return get().sellerProducts;
        }
      },

      /**
       * Listings created by the current seller.
       * The cached set comes from /products/my-listings (already scoped to
       * the caller server-side) plus any localOnly offline entries.
       */
      getMyListings: () => {
        const user = useAuthStore.getState().user;
        if (!user) return [];
        return [...get().sellerProducts];
      },

      /**
       * Add a seller listing — persists to the backend (POST /products).
       * Falls back to a local-only listing when the server is unreachable.
       * Returns the created product, or null when blocked/failed.
       */
      addSellerProduct: async (data) => {
        const user = getSellerUser();
        if (!user) {
          useToastStore.getState().error(SELLER_BLOCKED_MSG);
          return null;
        }
        try {
          const { data: created } = await api.post("/products", toProductPayload(data));
          const product = { ...toCamelCase(created), isSeller: true };
          const next = [product, ...get().sellerProducts];
          persistSellerProducts(next);
          set({ sellerProducts: next, products: [product, ...get().products] });
          useToastStore.getState().success("Part listed successfully.");
          return product;
        } catch (error) {
          if (error.response) {
            const msg = error.response.data?.detail || "Could not list the part. Please try again.";
            useToastStore.getState().error(typeof msg === "string" ? msg : "Could not list the part. Please try again.");
            return null;
          }
          // Server unreachable — offline fallback keeps the listing locally.
          const product = localListing(user, data);
          const next = [product, ...get().sellerProducts];
          persistSellerProducts(next);
          set({ sellerProducts: next, products: [product, ...get().products] });
          useToastStore.getState().error("Offline — part saved on this device only and will not appear to others until synced.");
          return product;
        }
      },

      /**
       * Update one of the current seller's listings (PATCH /products/{id}).
       * Local-only listings are updated locally. Returns updated product or null.
       */
      updateSellerProduct: async (id, patch) => {
        const user = getSellerUser();
        if (!user) {
          useToastStore.getState().error(SELLER_BLOCKED_MSG);
          return null;
        }
        const existing = get().sellerProducts.find((p) => p.id === id);
        if (!existing) {
          useToastStore.getState().error("Listing not found.");
          return null;
        }
        // Ownership is enforced server-side (403); the caller check below is
        // only to avoid pointless calls for other sellers' cached rows.
        if (!existing.localOnly && existing.vendorId && existing.sellerUserId && existing.sellerUserId !== user.id) {
          useToastStore.getState().error("Not your listing.");
          return null;
        }
        const applyLocal = (prev) => ({
          ...prev,
          ...patch,
          id: prev.id,
          vendorId: prev.vendorId,
          price: patch.price === undefined ? prev.price : Number(patch.price),
        });
        if (existing.localOnly) {
          const updated = applyLocal(existing);
          const next = get().sellerProducts.map((p) => (p.id === id ? updated : p));
          persistSellerProducts(next);
          set({
            sellerProducts: next,
            products: get().products.map((p) => (p.id === id ? updated : p)),
          });
          useToastStore.getState().success("Listing updated.");
          return updated;
        }
        try {
          const payload = {};
          if (patch.name !== undefined) payload.name = patch.name;
          if (patch.price !== undefined) payload.price = Number(patch.price);
          if (patch.description !== undefined) payload.description = patch.description;
          if (patch.brand !== undefined) payload.brand = patch.brand;
          if (patch.image !== undefined) payload.image = patch.image;
          if (patch.category !== undefined) payload.category = patch.category;
          if (patch.availability !== undefined) payload.availability = patch.availability;
          if (patch.deliveryTime !== undefined) payload.delivery_time = patch.deliveryTime;
          const { data: updatedRaw } = await api.patch(`/products/${id}`, payload);
          const updated = { ...toCamelCase(updatedRaw), isSeller: true };
          const next = get().sellerProducts.map((p) => (p.id === id ? updated : p));
          persistSellerProducts(next);
          set({
            sellerProducts: next,
            products: get().products.map((p) => (p.id === id ? updated : p)),
          });
          useToastStore.getState().success("Listing updated.");
          return updated;
        } catch (error) {
          if (error.response) {
            const msg = error.response.data?.detail || "Could not update the listing.";
            useToastStore.getState().error(typeof msg === "string" ? msg : "Could not update the listing.");
            return null;
          }
          // Offline: apply locally so the UI stays consistent.
          const updated = applyLocal(existing);
          const next = get().sellerProducts.map((p) => (p.id === id ? updated : p));
          persistSellerProducts(next);
          set({
            sellerProducts: next,
            products: get().products.map((p) => (p.id === id ? updated : p)),
          });
          useToastStore.getState().error("Offline — change saved on this device only.");
          return updated;
        }
      },

      /**
       * Delete one of the current seller's listings (DELETE /products/{id}).
       * Returns true on success.
       */
      removeSellerProduct: async (id) => {
        const user = getSellerUser();
        if (!user) {
          useToastStore.getState().error(SELLER_BLOCKED_MSG);
          return false;
        }
        const existing = get().sellerProducts.find((p) => p.id === id);
        if (!existing) {
          useToastStore.getState().error("Listing not found.");
          return false;
        }
        if (!existing.localOnly && existing.sellerUserId && existing.sellerUserId !== user.id) {
          useToastStore.getState().error("Not your listing.");
          return false;
        }
        const dropLocal = () => {
          const next = get().sellerProducts.filter((p) => p.id !== id);
          persistSellerProducts(next);
          set({
            sellerProducts: next,
            products: get().products.filter((p) => p.id !== id),
          });
        };
        if (existing.localOnly) {
          dropLocal();
          useToastStore.getState().success("Listing removed.");
          return true;
        }
        try {
          await api.delete(`/products/${id}`);
          dropLocal();
          useToastStore.getState().success("Listing removed.");
          return true;
        } catch (error) {
          if (error.response) {
            const msg = error.response.data?.detail || "Could not remove the listing.";
            useToastStore.getState().error(typeof msg === "string" ? msg : "Could not remove the listing.");
            return false;
          }
          dropLocal();
          useToastStore.getState().error("Offline — listing hidden on this device.");
          return true;
        }
      },

      /**
       * Manually toggle the loading state.
       */
      setLoading: (bool) => set({ isLoading: bool }),
    }),
    { name: "product-store" },
  ),
);
