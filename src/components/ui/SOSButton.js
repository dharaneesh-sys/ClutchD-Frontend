"use client";

import { AlertTriangle, Loader2, X, WifiOff } from "lucide-react";
import { useSOS } from "@/components/ui/useSOS";
import { cn } from "@/lib/utils";

/**
 * Thin SOS wrapper around useSOS — no fixed positioning.
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
    "w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
  if (status === "confirming") {
    buttonStyle =
      "w-48 h-14 rounded-xl bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.5)] cursor-pointer";
  } else if (status === "sent") {
    buttonStyle =
      "w-48 h-14 rounded-xl bg-success shadow-[0_0_20px_rgba(34,197,94,0.5)] cursor-default";
  } else if (status === "queued") {
    buttonStyle =
      "w-48 h-14 rounded-xl bg-orange-600 shadow-[0_0_20px_rgba(251,146,60,0.5)] cursor-default";
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      {errorMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-xl bg-red-500/10 border-red-500/30 text-red-400">
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
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-xl bg-orange-500/10 border-orange-500/30 text-orange-400">
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
