"use client";

import { useToastStore } from "@/store/toastStore";

export function useToast() {
  const { removeToast, clearToasts, success, error, info, warning } =
    useToastStore();

  const toastMethods = {
    success: (message, options) => success(message, options),
    error: (message, options) => error(message, options),
    info: (message, options) => info(message, options),
    warning: (message, options) => warning(message, options),
  };

  return {
    toast: toastMethods,
    dismiss: removeToast,
    dismissAll: clearToasts,
    clear: clearToasts,
    ...toastMethods,
  };
}