import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import api, { extractApiError } from "@/lib/api";

export function SOSButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSOS = () => {
    if (status === "idle") {
      setStatus("confirming");
      setTimeout(() => {
        setStatus((prev) => (prev === "confirming" ? "idle" : prev));
      }, 5000);
    } else if (status === "confirming") {
      sendSOS();
    }
  };

  const sendSOS = async () => {
    setLoading(true);
    try {
      let lat = 0, lon = 0;
      await new Promise((resolve) => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => { lat = pos.coords.latitude; lon = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 3000 }
          );
        } else resolve();
      });

      await api.post("/service/sos", { lat, lon });
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 10000);
    } catch (e) {
      setErrorMsg(extractApiError(e, "Failed to send SOS"));
      setTimeout(() => setErrorMsg(null), 5000);
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {errorMsg && (
        <div className="fixed bottom-24 left-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-xl bg-red-500/10 border-red-500/30 text-red-400">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}
      <button
        onClick={handleSOS}
        disabled={loading || status === "sent"}
        className={`fixed bottom-6 left-6 z-[100] transition-all flex items-center justify-center shadow-red-500/30 overflow-hidden ${
          status === "confirming"
            ? "w-48 h-14 rounded-xl bg-red-600 hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.5)] cursor-pointer"
            : status === "sent"
              ? "w-48 h-14 rounded-xl bg-success shadow-[0_0_20px_rgba(34,197,94,0.5)] cursor-default"
              : "w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)] cursor-pointer"
        }`}
      >
        <div className="flex items-center justify-center gap-2 text-white font-bold whitespace-nowrap px-4">
          {loading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span>Sending...</span>
            </>
          ) : status === "sent" ? (
            <span>Help En Route!</span>
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
    </>
  );
}
