import { create } from "zustand";
import { registerForPush, unregisterPush } from "@/lib/push/pushService";
import api from "@/lib/api";

export const useNotificationStore = create((set, get) => ({
  // Existing
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  increment: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrement: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearAll: () => set({ unreadCount: 0 }),

  // Push notification state
  pushToken: null,
  pushEnabled: false,

  /**
   * Register the device for push notifications.
   * Requests browser permission, gets an FCM token, and POSTs it to the backend.
   * Sets pushToken and pushEnabled on success.
   */
  registerPushToken: async () => {
    const token = await registerForPush();
    if (!token) return false;

    try {
      await api.post("/api/push/register", { token });
      set({ pushToken: token, pushEnabled: true });
      return true;
    } catch (err) {
      console.error("[notificationStore] Failed to register push token with backend:", err);
      return false;
    }
  },

  /**
   * Unregister the device from push notifications.
   * Deletes the token from the backend and clears local state.
   */
  unregisterPushToken: async () => {
    const { pushToken } = get();
    if (!pushToken) return;

    try {
      await api.post("/api/push/unregister", { token: pushToken });
    } catch (err) {
      console.error("[notificationStore] Failed to unregister push token with backend:", err);
    }

    await unregisterPush(pushToken);
    set({ pushToken: null, pushEnabled: false });
  },

  /**
   * Enable or disable push notifications.
   * When enabling, requests permission and registers the token.
   * When disabling, unregisters the token.
   */
  setPushEnabled: async (enabled) => {
    if (enabled) {
      await get().registerPushToken();
    } else {
      await get().unregisterPushToken();
    }
  },
}));
