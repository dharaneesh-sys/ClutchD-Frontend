"use client";

import { useToastStore } from "@/store/toastStore";
import { Toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export function ToastProvider() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed z-[600] flex flex-col-reverse gap-3 pointer-events-none",
        // Phone: full-width bar parked above the BottomNav (h-16 + safe area)
        // so toasts are never under the nav or clipped by the screen edge.
        "left-3 right-3 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)]",
        // sm+ screens have no BottomNav: classic corner toast
        "sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md"
      )}
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