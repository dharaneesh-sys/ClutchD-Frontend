"use client";

import { useMemo } from "react";
import { Navigation, MapPin, Search, CheckCircle2 } from "lucide-react";
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

  if (status === SERVICE_STATUS.SEARCHING) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border-subtle text-sm text-text-muted"
      >
        <Search size={16} className="shrink-0 text-icon-highlight animate-pulse" />
        <span>Searching for a mechanic...</span>
      </div>
    );
  }

  if (status === SERVICE_STATUS.ASSIGNED) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border-subtle text-sm text-text-muted"
      >
        <MapPin size={16} className="shrink-0 text-icon-highlight" />
        <span>Mechanic assigned — preparing</span>
      </div>
    );
  }

  if (status === SERVICE_STATUS.EN_ROUTE) {
    if (!info) return null;

    if (info.distanceKm < 0.1) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border-subtle text-sm"
        >
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <span className="font-medium text-text-primary">
            Mechanic has arrived
          </span>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-card border border-border-subtle text-sm"
      >
        <span className="relative shrink-0 flex items-center justify-center w-6 h-6">
          <Navigation
            size={16}
            className="text-icon-highlight relative z-10"
          />
          <span className="absolute inset-0 rounded-full bg-icon-highlight/15 animate-ping" />
        </span>
        <span className="text-text-primary">
          Mechanic is{" "}
          <strong>{Number(info.distanceKm ?? 0).toFixed(1)} km</strong> away (
          {formatETA(info.etaSeconds)})
        </span>
      </div>
    );
  }

  return null;
}
