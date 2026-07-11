"use client";

import { useToastStore } from "@/store/toastStore";
import { Toast } from "@/components/ui/Toast";

export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

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
  const addToast = useToastStore((s) => s.addToast);
  const removeToast = useToastStore((s) => s.removeToast);
  const clearToasts = useToastStore((s) => s.clearToasts);
  const success = useToastStore((s) => s.success);
  const error = useToastStore((s) => s.error);
  const info = useToastStore((s) => s.info);
  const warning = useToastStore((s) => s.warning);

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