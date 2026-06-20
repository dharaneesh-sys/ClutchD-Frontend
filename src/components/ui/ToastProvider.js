"use client";

import { useToastStore } from "@/lib/stores/toastStore";
import { Toast } from "@/components/ui/Toast";

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[600] flex flex-col-reverse gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={removeToast}
          className="pointer-events-auto"
        />
      ))}
    </div>
  );
}

export function useToast() {
  const { addToast, removeToast, clearToasts, success, error, info, warning } = useToastStore();

  return {
    toast: addToast,
    dismiss: removeToast,
    clear: clearToasts,
    success,
    error,
    info,
    warning,
  };
}