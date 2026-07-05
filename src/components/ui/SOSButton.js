import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Loader2, X, WifiOff } from "lucide-react";
import api, { extractApiError } from "@/lib/api";
import { BackendHealth } from "@/lib/backendHealth";
import { enqueueRequest, registerOnlineFlush } from "@/lib/offline/requestQueue";

export function SOSButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | confirming | sent | queued
  const [errorMsg, setErrorMsg] = useState(null);
  const [queuedMsg, setQueuedMsg] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const lastSendRef = useRef(0);
  const last429Ref = useRef(0);
  const SOS_429_DEBOUNCE_MS = 15000;

  // ── Lifecycle ────────────────────────────────────────────────

  useEffect(() => {
    const cleanup = registerOnlineFlush();

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      cleanup();
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────

  const getLocation = () =>
    new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        resolve({ lat: 0, lon: 0 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        () => resolve({ lat: 0, lon: 0 }),
        { timeout: 3000 },
      );
    });

  const queueSOS = async (lat, lon) => {
    await enqueueRequest("SOS", { lat, lon });
    lastSendRef.current = Date.now();
    setStatus("queued");
    setQueuedMsg("SOS queued — will send when online");
    setTimeout(() => {
      setStatus((prev) => (prev === "queued" ? "idle" : prev));
      setQueuedMsg(null);
    }, 10000);
  };

  // ── Actions ──────────────────────────────────────────────────

  const handleSOS = () => {
    if (status === "confirming") {
      handleConfirm();
    } else if (status === "idle") {
      setStatus("confirming");
      setTimeout(() => {
        setStatus((prev) => (prev === "confirming" ? "idle" : prev));
      }, 5000);
    }
  };

  const handleConfirm = async () => {
    const now = Date.now();

    // Rate limit: backend allows 5 req/min → at least 12 s between sends
    if (now - lastSendRef.current < 12000) {
      setErrorMsg("Please wait before sending another SOS");
      setTimeout(() => setErrorMsg(null), 3000);
      setStatus("idle");
      return;
    }

    // 429 debounce: wait 15 s after a rate-limit response
    const msSince429 = now - last429Ref.current;
    if (msSince429 < SOS_429_DEBOUNCE_MS) {
      const remaining = Math.ceil((SOS_429_DEBOUNCE_MS - msSince429) / 1000);
      setErrorMsg(`Please wait ${remaining}s before retrying`);
      setTimeout(() => setErrorMsg(null), 3000);
      setStatus("idle");
      return;
    }

    setLoading(true);

    let lat = 0;
    let lon = 0;

    try {
      const pos = await getLocation();
      lat = pos.lat;
      lon = pos.lon;

      // Offline or backend confirmed down → queue immediately
      if (!isOnline || BackendHealth.isAvailable() === false) {
        await queueSOS(lat, lon);
        return;
      }

      // Try the real API call
      try {
        await api.post("/service/sos", { lat, lon });
        lastSendRef.current = Date.now();
        setStatus("sent");
        setTimeout(() => setStatus("idle"), 10000);
      } catch (e) {
        // 429 rate-limited → track debounce, fall through to outer handler
        if (e?.response?.status === 429) {
          last429Ref.current = Date.now();
          throw e;
        }
        // 503 / network error → queue for later delivery
        if (!e?.response || e?.response?.status === 503) {
          await queueSOS(lat, lon);
        } else {
          throw e; // Let the outer handler show a real error
        }
      }
    } catch (e) {
      setErrorMsg(extractApiError(e, "Failed to send SOS"));
      setTimeout(() => setErrorMsg(null), 5000);
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────

  const isDisabled = loading || status === "sent" || status === "queued";

  let buttonStyle = "w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]";
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
    <>
      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-24 left-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-xl bg-red-500/10 border-red-500/30 text-red-400">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Queued notification toast */}
      {queuedMsg && (
        <div className="fixed bottom-24 left-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium backdrop-blur-xl bg-orange-500/10 border-orange-500/30 text-orange-400">
          <WifiOff size={14} />
          <span>{queuedMsg}</span>
        </div>
      )}

      <button
        onClick={handleSOS}
        disabled={isDisabled}
        className={`fixed bottom-6 left-6 z-[100] transition-all flex items-center justify-center overflow-hidden ${buttonStyle}`}
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
    </>
  );
}
