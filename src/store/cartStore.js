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
};

export const useCartStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      addItem: (product, vendor) => {
        const existing = get().items.find(
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
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
        persistItems(get().items);
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
          } else {
            set({ isLoading: false });
            throw new Error(data.message || "Invalid coupon code");
          }
        } catch (error) {
          set({ couponCode: "", discount: 0, isLoading: false });
          throw error;
        }
      },

      removeCoupon: () => {
        set({ couponCode: "", discount: 0 });
      },

      clearCart: () => {
        set({ items: [], couponCode: "", discount: 0, isLoading: false });
        persistItems([]);
      },

      /**
       * Compute the total cart value including discounts.
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
       */
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    { name: "cart-store" },
  ),
);
