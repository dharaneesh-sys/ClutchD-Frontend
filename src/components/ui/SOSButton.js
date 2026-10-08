"use client";

import { AlertTriangle, Loader2, X, WifiOff } from "lucide-react";
import { useSOS } from "@/components/ui/useSOS";
import { cn } from "@/lib/utils";

/**
 * Thin SOS wrapper around useSOS — inline in flow, never overlaid.
 * Toasts render top-center via toastStore; inline notes render in flow.
 */
export function SOSButton({ className }) {
  const {
    loading,
    status,
    errorMsg,
    queuedMsg,
    handleSOS,
    dismissMessages,
  } = useSOS();

  const isDisabled = loading || status === "sent" || status === "queued";

  let buttonStyle =
    "w-14 h-14 rounded-full bg-danger hover:brightness-110";
  if (status === "confirming") {
    buttonStyle =
      "w-48 h-14 rounded-xl bg-danger hover:brightness-110 cursor-pointer";
  } else if (status === "sent") {
    buttonStyle =
      "w-48 h-14 rounded-xl bg-success cursor-default";
  } else if (status === "queued") {
    buttonStyle =
      "w-48 h-14 rounded-xl bg-pending cursor-default";
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-xl bg-danger/10 border-danger/30 text-danger">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={dismissMessages}
            className="ml-2 opacity-60 hover:opacity-100"
            aria-label="Dismiss SOS error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {queuedMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-xl bg-pending/10 border-pending/30 text-pending">
          <WifiOff size={14} />
          <span>{queuedMsg}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleSOS}
        disabled={isDisabled}
        className={cn(
          "transition-all flex items-center justify-center overflow-hidden",
          buttonStyle,
        )}
      >
        <div className="flex items-center justify-center gap-2 text-white font-bold whitespace-nowrap px-4">
          {loading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : status === "sent" ? (
            <span>Help En Route!</span>
          ) : status === "queued" ? (
            <>
              <WifiOff size={20} />
              <span>SOS Queued</span>
            </>
          ) : status === "confirming" ? (
            <>
              <AlertTriangle size={20} className="animate-pulse" />
              <span>Tap AGAIN to SOS</span>
            </>
          ) : (
            <AlertTriangle size={24} />
          )}
        </div>
      </button>
    </div>
  );
}
