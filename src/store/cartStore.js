import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";

const STORAGE_KEY = "clutchd_cart";

function loadPersistedItems() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (e) {
    console.warn("[cartStore] Failed to load persisted cart:", e);
  }
  return [];
}

function persistItems(items) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
}

const initialState = {
  items: loadPersistedItems(),
  couponCode: "",
  discount: 0,
  isLoading: false,
  backendEnabled: false,
};

export const useCartStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      /** Enable or disable backend sync. When enabled, mutations also call the API. */
      setBackendEnabled: (enabled) => set({ backendEnabled: enabled }),

      /**
       * Load cart items from the backend and merge with local state.
       * Items from the backend that don't exist locally are appended.
       * Items that exist locally keep local quantity (last-write-wins for qty).
       */
      fetchCart: async () => {
        const { backendEnabled } = get();
        if (!backendEnabled) return;
        set({ isLoading: true });
        try {
          const { data } = await api.get("/marketplace/cart");
          const remoteItems = data.map((item) => ({
            productId: item.productId || item.product_id,
            vendorId: item.vendorId || item.vendor_id || null,
            quantity: item.quantity,
            // Merge with local to pick up price/name/image
          }));
          set((state) => {
            const localMap = new Map(state.items.map((i) => [i.productId, i]));
            const merged = remoteItems.map((r) => ({
              ...(localMap.get(r.productId) || {}),
              ...r,
            }));
            const localIds = new Set(remoteItems.map((r) => r.productId));
            const localOnly = state.items.filter((i) => !localIds.has(i.productId));
            return { items: [...merged, ...localOnly], isLoading: false };
          });
          persistItems(get().items);
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: (product, vendor) => {
        const { items, backendEnabled } = get();
        const existing = items.find(
          (item) => item.productId === product.id && item.vendorId === vendor?.id,
        );

        if (existing) {
          set((state) => ({
            items: state.items.map((item) =>
              item.productId === product.id && item.vendorId === vendor?.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            ),
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              {
                productId: product.id,
                vendorId: vendor?.id || null,
                quantity: 1,
                price: product.price,
                name: product.name,
                image: product.image || null,
              },
            ],
          }));
        }
        persistItems(get().items);

        if (backendEnabled) {
          api.post("/marketplace/cart", {
            product_id: product.id,
            vendor_id: vendor?.id || null,
            quantity: existing ? existing.quantity + 1 : 1,
          }).catch(() => {}); // silent fallback
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
        persistItems(get().items);

        // Backend delete by productId — backend requires item_id, so we skip
        // for individual removes; full clearCart handles batch cleanup
      },

      updateQuantity: (productId, qty) => {
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((item) => item.productId !== productId) };
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity: qty } : item,
            ),
          };
        });
        persistItems(get().items);
      },

      /**
       * Apply a coupon code. Returns an object { success, message } so callers
       * can surface the exact validation error without catching exceptions.
       */
      applyCoupon: async (code) => {
        set({ isLoading: true, couponCode: "", discount: 0 });
        try {
          const { items } = get();
          const subtotal = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          const { data } = await api.post("/marketplace/offers/validate", {
            code,
            purchaseAmount: subtotal,
          });
          if (data.valid) {
            set({
              couponCode: data.code || code,
              discount: data.discountAmount || 0,
              isLoading: false,
            });
            return { success: true, message: data.message || "Coupon applied!" };
          }
          set({ isLoading: false });
          return { success: false, message: data.message || "Invalid coupon code" };
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Failed to validate coupon." : "Server unreachable.");
          set({ couponCode: "", discount: 0, isLoading: false });
          return { success: false, message: msg };
        }
      },

      removeCoupon: () => {
        set({ couponCode: "", discount: 0 });
      },

      clearCart: () => {
        set({ items: [], couponCode: "", discount: 0, isLoading: false });
        persistItems([]);

        const { backendEnabled } = get();
        if (backendEnabled) {
          api.delete("/marketplace/cart").catch(() => {});
        }
      },

      /**
       * Compute the total cart value including discounts.
       *
       * ⚠️ DANGER: Do NOT use this getter as a zustand store selector!
       *    Getter functions call `get()` internally and return a new number
       *    every time. Primitives (numbers) happen to compare correctly with
       *    Object.is, so using this as `useCartStore((s) => s.getTotal())`
       *    works today, but changing the return type to an object/array will
       *    trigger React 19 error #185 (infinite re-render loop).
       *    Use stable primitive selectors + useMemo instead (see ProviderList).
       */
      getTotal: () => {
        const { items, discount } = get();
        const subtotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );
        return Math.max(0, subtotal - discount);
      },

      /**
       * Return the total number of items in the cart (sum of quantities).
       *
       * ⚠️ Same DANGER as getTotal — see above.
       */
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    { name: "cart-store" },
  ),
);


// TODO(BACKEND_CONTRACTS §1 cart): flip setBackendEnabled(true) only after live verify of GET/POST/PATCH/DELETE /marketplace/cart.
