"use client";

import { useToastStore } from "@/lib/stores/toastStore";

export function useToast() {
  const { addToast, removeToast, clearToasts, success, error, info, warning } =
    useToastStore();

  return {
    toast: {
      success: (message, options) => success(message, options),
      error: (message, options) => error(message, options),
      info: (message, options) => info(message, options),
      warning: (message, options) => warning(message, options),
    },
    dismiss: removeToast,
    dismissAll: clearToasts,
  };
}