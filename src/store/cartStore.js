import { create } from "zustand";
import { devtools } from "zustand/middleware";

const initialState = {
  items: [],
  couponCode: "",
  discount: 0,
  isLoading: false,
};

export const useCartStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Add a product to the cart.
       * If the product already exists (same productId + vendorId), increment the quantity.
       * Otherwise, append a new item entry.
       *
       * @param {Object} product - { id, price, name, image }
       * @param {Object} vendor  - { id, name }
       */
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
      },

      /**
       * Remove an item from the cart by productId.
       */
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),

      /**
       * Update the quantity of a cart item.
       * If qty is 0 or negative, the item is removed.
       */
      updateQuantity: (productId, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((item) => item.productId !== productId) };
          }
          return {
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity: qty } : item,
            ),
          };
        }),

      /**
       * Apply a coupon code.
       * In demo mode this is a no-op placeholder; real coupon validation
       * would happen against the backend.
       */
      applyCoupon: (code) => {
        set({ couponCode: code, discount: 0 });
      },

      /**
       * Clear all cart items, coupon, and discount.
       */
      clearCart: () => set({ ...initialState }),

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
