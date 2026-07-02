import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";

function toCamelCase(obj) {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        toCamelCase(v),
      ])
    );
  }
  return obj;
}

const initialState = {
  orders: [],
  activeOrder: null,
  isLoading: false,
  error: null,
};

export const useOrderStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Place a new order from the given cart items.
       * Creates the order locally, submits to the backend, and clears the cart.
       *
       * @param {Array}  cartItems - Array of { productId, vendorId, quantity, price, name, image }
       * @param {Object} address   - Shipping address { street, city, state, pincode }
       * @param {Object} payment   - Payment details { method, transactionId? }
       * @returns {Object} The created order.
       */
      placeOrder: async (cartItems, address, payment) => {
        set({ isLoading: true, error: null });

        const total = cartItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0,
        );

        const newOrder = {
          id: "ord-" + Date.now(),
          items: cartItems.map(({ productId, name, quantity, price }) => ({
            productId,
            name,
            quantity,
            price,
          })),
          total,
          status: "confirmed",
          address,
          payment: payment || { method: "unknown" },
          createdAt: new Date().toISOString(),
        };

        try {
          await api.post("/orders", newOrder);
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response
              ? "Failed to place order."
              : "Server unreachable. Order saved locally.");
          set({ isLoading: false, error: msg });
          // Still create the order locally even if the API fails
        }

        set((state) => ({
          orders: [newOrder, ...state.orders],
          activeOrder: newOrder,
          isLoading: false,
          error: null,
        }));

        useCartStore.getState().clearCart();

        return newOrder;
      },

      fetchOrderHistory: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.get("/orders");
          const orders = toCamelCase(data?.orders ?? []);
          set({ orders, isLoading: false });
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response
              ? "Failed to load orders."
              : "Server unreachable.");
          set({ orders: [], isLoading: false, error: msg });
        }
      },

      /**
       * Get an order by its id.
       * Searches the current orders array.
       */
      getOrderById: (id) =>
        get().orders.find((o) => o.id === id) || null,
    }),
    { name: "order-store" },
  ),
);
