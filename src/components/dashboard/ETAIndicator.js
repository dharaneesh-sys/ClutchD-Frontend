"use client";

import { useMemo } from "react";
import { Navigation, CheckCircle2 } from "lucide-react";
import { SERVICE_STATUS } from "@/lib/constants";
import { haversineDistance } from "@/store/trackingStore";

const SPEED_KMH = 30;

function formatETA(seconds) {
  if (seconds < 0) return "";
  if (seconds < 60) return "<1 min";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `~${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  if (rem === 0) return `~${hrs}h`;
  return `~${hrs}h ${rem}m`;
}

export function ETAIndicator({ mechanicLocation, userLocation, status }) {
  const info = useMemo(() => {
    if (
      !mechanicLocation ||
      !userLocation ||
      status !== SERVICE_STATUS.EN_ROUTE
    ) {
      return null;
    }
    const distanceKm = haversineDistance(
      userLocation[0],
      userLocation[1],
      mechanicLocation[0],
      mechanicLocation[1]
    );
    const etaSeconds = (distanceKm / SPEED_KMH) * 3600;
    return { distanceKm, etaSeconds };
  }, [mechanicLocation, userLocation, status]);

  // Only en_route has a real, location-derived ETA; the tracker already
  // names the other stages.
  if (status === SERVICE_STATUS.EN_ROUTE) {
    if (!info) return null;

    if (info.distanceKm < 0.1) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] text-sm"
        >
          <CheckCircle2 size={16} aria-hidden="true" className="shrink-0 text-[var(--success)]" />
          <span className="font-medium text-[var(--foreground)]">
            Mechanic has arrived
          </span>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--surface-card)] border border-[var(--border)] text-sm"
      >
        <span className="relative shrink-0 flex items-center justify-center w-6 h-6">
          <Navigation
            size={16}
            aria-hidden="true"
            className="text-[var(--primary-dark)] relative z-10"
          />
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[var(--surface-soft)] animate-ping motion-reduce:animate-none" />
        </span>
        <span className="text-[var(--foreground)]">
          Mechanic is{" "}
          <strong>{Number(info.distanceKm ?? 0).toFixed(1)} km</strong> away (
          {formatETA(info.etaSeconds)})
        </span>
      </div>
    );
  }

  return null;
}
