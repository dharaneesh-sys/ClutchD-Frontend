"use client";

import { useMemo } from "react";
import { useTrackingStore } from "@/store/trackingStore";
import { MapPin, Star, Wrench, Building2, Navigation, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function ProviderList() {
  const isLoading = useTrackingStore((s) => s.isLoading);
  const error = useTrackingStore((s) => s.error);
  // Select stable primitives/arrays instead of a getter function.
  // A getter function that returns new array/object references every call
  // violates React 19's useSyncExternalStore caching requirement ("The result
  // of getSnapshot should be cached to avoid an infinite loop") and triggers
  // error #185 (Maximum update depth exceeded). getFilteredProviders() was
  // removed from trackingStore.js for this reason. Using primitive selectors
  // + useMemo gives a stable reference when data hasn't changed.
  const nearbyMechanics = useTrackingStore((s) => s.nearbyMechanics);
  const nearbyGarages = useTrackingStore((s) => s.nearbyGarages);
  const providerFilter = useTrackingStore((s) => s.providerFilter);
  const fetchNearbyProviders = useTrackingStore((s) => s.fetchNearbyProviders);

  const allProviders = useMemo(() => {
    const all = [
      ...nearbyMechanics.map((m) => ({ ...m, type: "mechanic" })),
      ...nearbyGarages.map((g) => ({ ...g, type: "garage" })),
    ].sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

    if (providerFilter === "all") return all;
    return all.filter((p) => p.type === providerFilter);
  }, [nearbyMechanics, nearbyGarages, providerFilter]);

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading nearby professionals">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-1/2" />
              <Skeleton className="w-1/3 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] p-6 text-center">
        <AlertTriangle size={24} aria-hidden="true" className="text-[var(--danger)]" />
        <p className="text-sm text-[var(--danger-ink)]">{error}</p>
        <Button type="button" variant="outline" size="sm" onClick={() => fetchNearbyProviders()}>
          Retry
        </Button>
      </div>
    );
  }

  if (allProviders.length === 0) {
    return (
      <EmptyState
        icon={Navigation}
        title="No providers nearby right now"
        description="We'll match you with the nearest available professional when you request service."
      />
    );
  }

  const filterLabels = { all: "All", mechanic: "Mechanics", garage: "Garages" };
  const formatDistance = (p) => {
    const km = Number(p.distanceKm ?? p.distance);
    return Number.isFinite(km) ? `${km.toFixed(1)} km away` : "—";
  };

  return (
    <section aria-labelledby="nearby-heading" className="space-y-3 pb-4">
      <div className="flex items-center justify-between">
        <h3 id="nearby-heading" className="text-base font-semibold text-[var(--foreground)]">
          Nearby professionals ({allProviders.length})
        </h3>
        {providerFilter !== "all" && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-soft)] text-[var(--primary-dark)]">
            {filterLabels[providerFilter]}
          </span>
        )}
      </div>

      {allProviders.map((provider) => {
        const tags = provider.expertise || provider.services;
        return (
          <GlassCard key={`${provider.type}-${provider.id}`} className="p-4 flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--surface-soft)] text-[var(--primary-dark)]">
              {provider.type === "mechanic" ? <Wrench size={20} aria-hidden="true" /> : <Building2 size={20} aria-hidden="true" />}
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-semibold truncate text-[var(--foreground)]">{provider.name || "—"}</h4>
                <div className="flex items-center gap-1 text-sm font-medium flex-shrink-0 text-[var(--foreground)]">
                  {provider.rating != null ? (
                    <>
                      <Star size={14} aria-hidden="true" className="fill-[var(--pending)] text-[var(--pending)]" />
                      <span aria-label={`Rating ${provider.rating}`}>{provider.rating}</span>
                    </>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">New</span>
                  )}
                </div>
              </div>

              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <MapPin size={12} aria-hidden="true" />
                <span>{formatDistance(provider)}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{provider.type}</span>
              </div>

              {Array.isArray(tags) && tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--surface-soft)] text-[var(--primary-dark)]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        );
      })}
    </section>
  );
}
