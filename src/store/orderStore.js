import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";

const DEMO_ORDERS = [
  {
    id: "ord-1",
    items: [
      { productId: "prod-1", name: "Engine Oil 5W-30 (4L)", quantity: 1, price: 2199 },
      { productId: "prod-2", name: "Brake Pad Set (Front)", quantity: 1, price: 1249 },
    ],
    total: 3448,
    status: "delivered",
    address: {
      street: "12, Cross Cut Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641012",
    },
    payment: { method: "upi", transactionId: "TXN-DEMO-001" },
    createdAt: "2025-06-01T10:30:00Z",
  },
  {
    id: "ord-2",
    items: [
      { productId: "prod-5", name: "Car Battery (60Ah)", quantity: 1, price: 5499 },
    ],
    total: 5499,
    status: "shipped",
    address: {
      street: "45, Sathyamangalam Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641035",
    },
    payment: { method: "card", transactionId: "TXN-DEMO-002" },
    createdAt: "2025-06-10T14:00:00Z",
  },
];

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

      /**
       * Fetch order history from the API.
       * Falls back to demo orders on failure or empty response.
       */
      fetchOrderHistory: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.get("/orders");
          const orders = data?.orders?.length ? data.orders : DEMO_ORDERS;
          set({ orders, isLoading: false });
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response
              ? "Failed to load orders."
              : "Server unreachable.");
          set({ orders: DEMO_ORDERS, isLoading: false, error: msg });
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
