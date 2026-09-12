"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api, { extractApiError } from "@/lib/api";
import { BackendHealth } from "@/lib/backendHealth";
import { enqueueRequest, registerOnlineFlush } from "@/lib/offline/requestQueue";
import { useToastStore } from "@/store/toastStore";

const SOS_RATE_LIMIT_MS = 12000;
const SOS_429_DEBOUNCE_MS = 15000;
const SOS_CONFIRM_WINDOW_MS = 5000;
const SOS_RESET_MS = 10000;
const SOS_MSG_MS = 5000;
const SOS_QUEUED_RESET_MS = 10000;
const SOS_GEO_TIMEOUT_MS = 3000;

/**
 * Shared SOS emergency logic (2-tap confirm, geolocation 3s fallback,
 * POST /service/sos, offline enqueueRequest, 12s rate-limit + 15s 429 debounce).
 * Toasts go through toastStore (rendered top-center) — never fixed bottom-left.
 */
export function useSOS() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | confirming | sent | queued
  const [errorMsg, setErrorMsg] = useState(null);
  const [queuedMsg, setQueuedMsg] = useState(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const lastSendRef = useRef(0);
  const last429Ref = useRef(0);
  const timersRef = useRef([]);

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const showError = useCallback(
    (msg, ms = SOS_MSG_MS) => {
      setErrorMsg(msg);
      try {
        useToastStore.getState().error(msg);
      } catch {
        // toastStore unavailable (SSR) — inline message still shows
      }
      later(() => setErrorMsg(null), ms);
    },
    [later],
  );

  // ── Lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = registerOnlineFlush();
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    const timers = timersRef.current;
    return () => {
      cleanup();
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      timers.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────
  const getLocation = useCallback(
    () =>
      new Promise((resolve) => {
        if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
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
          { timeout: SOS_GEO_TIMEOUT_MS },
        );
      }),
    [],
  );

  const queueSOS = useCallback(
    async (lat, lon) => {
      await enqueueRequest("SOS", { lat, lon });
      lastSendRef.current = Date.now();
      setStatus("queued");
      const msg = "SOS queued — will send when online";
      setQueuedMsg(msg);
      try {
        useToastStore.getState().warning(msg);
      } catch {
        // inline queued note still shows
      }
      later(() => {
        setStatus((prev) => (prev === "queued" ? "idle" : prev));
        setQueuedMsg(null);
      }, SOS_QUEUED_RESET_MS);
    },
    [later],
  );

  // ── Actions ──────────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    const now = Date.now();

    // Rate limit: backend allows 5 req/min → at least 12 s between sends
    if (now - lastSendRef.current < SOS_RATE_LIMIT_MS) {
      showError("Please wait before sending another SOS", 3000);
      setStatus("idle");
      return;
    }

    // 429 debounce: wait 15 s after a rate-limit response
    const msSince429 = now - last429Ref.current;
    if (msSince429 < SOS_429_DEBOUNCE_MS) {
      const remaining = Math.ceil((SOS_429_DEBOUNCE_MS - msSince429) / 1000);
      showError(`Please wait ${remaining}s before retrying`, 3000);
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
        try {
          useToastStore.getState().success("SOS sent — help is on the way");
        } catch {
          // inline sent state still shows
        }
        later(() => setStatus("idle"), SOS_RESET_MS);
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
      showError(extractApiError(e, "Failed to send SOS"));
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  }, [isOnline, getLocation, queueSOS, later, showError]);

  const handleSOS = useCallback(() => {
    if (status === "confirming") {
      handleConfirm();
    } else if (status === "idle") {
      setStatus("confirming");
      later(() => {
        setStatus((prev) => (prev === "confirming" ? "idle" : prev));
      }, SOS_CONFIRM_WINDOW_MS);
    }
  }, [status, handleConfirm, later]);

  const dismissMessages = useCallback(() => {
    setErrorMsg(null);
    setQueuedMsg(null);
  }, []);

  return {
    loading,
    status,
    errorMsg,
    queuedMsg,
    isOnline,
    handleSOS,
    handleConfirm,
    dismissMessages,
  };
}
