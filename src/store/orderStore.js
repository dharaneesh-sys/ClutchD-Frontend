import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import { useNotificationStore } from "@/store/notificationStore";
import { ORDER_STATUSES } from "@/lib/constants";
import { toCamelCase } from "@/lib/utils";

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

        // Build local order object (camelCase for frontend consumption)
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

        // Send correct OrderCreate payload matching backend schema
        try {
          await api.post("/orders", {
            items: cartItems.map(({ productId, name, quantity, price }) => ({
              product_id: productId,
              name,
              quantity,
              price,
            })),
            address,
            payment: payment || { method: "unknown" },
          });
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
       * Update the status of an order locally and fire notifications.
       *
       * Shows a toast notification for the status transition and increments the
       * unread badge count in the notification store. Skips no-op transitions
       * (same status) to prevent duplicate notifications.
       *
       * @param {string} orderId
       * @param {string} newStatus
       * @returns {boolean} Whether the status was actually changed.
       */
      updateOrderStatus: (orderId, newStatus) => {
        const { orders, activeOrder } = get();
        const order = orders.find((o) => o.id === orderId);
        if (!order) return false;
        if (order.status === newStatus) return false;

        const label = ORDER_STATUSES[newStatus] || newStatus;
        const shortId = orderId.length > 10 ? orderId.slice(0, 8) : orderId;

        set({
          orders: orders.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o,
          ),
          activeOrder:
            activeOrder?.id === orderId
              ? { ...activeOrder, status: newStatus }
              : activeOrder,
        });

        const toast = useToastStore.getState();
        const msg = `Order #${shortId} is now ${label}`;
        if (newStatus === "delivered") {
          toast.success(msg);
        } else if (newStatus === "cancelled") {
          toast.warning(msg);
        } else {
          toast.info(msg);
        }

        useNotificationStore.getState().increment();

        return true;
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


// TODO(BACKEND_CONTRACTS §1 orders): wire POST/GET /orders + socket STATUS_UPDATE; keep local builder as offline fallback.
