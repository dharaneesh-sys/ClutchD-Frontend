import { create } from "zustand";
import { generateId } from "@/lib/utils";

export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
  WARNING: "warning",
};

const DEFAULT_DURATION = 5000;

export const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (type, message, options = {}) => {
    const id = generateId();
    const toast = {
      id,
      type,
      message,
      duration: options.duration ?? DEFAULT_DURATION,
      action: options.action,
      persistent: options.persistent ?? false,
      createdAt: Date.now(),
    };

    set((state) => ({ toasts: [...state.toasts, toast] }));

    if (!toast.persistent && toast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, toast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Convenience methods
  success: (message, options) => get().addToast(TOAST_TYPES.SUCCESS, message, options),
  error: (message, options) => get().addToast(TOAST_TYPES.ERROR, message, options),
  info: (message, options) => get().addToast(TOAST_TYPES.INFO, message, options),
warning: (message, options) => get().addToast(TOAST_TYPES.WARNING, message, options),
}));