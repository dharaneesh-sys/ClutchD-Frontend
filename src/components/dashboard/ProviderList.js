"use client";

import { useTrackingStore } from "../../store/trackingStore";
import { useThemeStore } from "../../store/themeStore";
import { MapPin, Star, Wrench, Building2, Navigation } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "../../lib/utils";

export function ProviderList() {
  const { nearbyMechanics, nearbyGarages, isLoading, error } = useTrackingStore();
  const { theme } = useThemeStore();
  const isLight = theme === "light";

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-24 rounded-2xl ${isLight ? "bg-slate-100" : "bg-white/5"}`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const allProviders = [
    ...nearbyMechanics.map(m => ({ ...m, type: "mechanic" })),
    ...nearbyGarages.map(g => ({ ...g, type: "garage" }))
  ].sort((a, b) => a.distanceKm - b.distanceKm);

  if (allProviders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center opacity-60">
        <Navigation size={32} className="mb-4" />
        <p className="text-sm">No nearby professionals found in this area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      <h3 className={`px-2 text-sm font-semibold uppercase tracking-wider mb-4 ${isLight ? "text-slate-500" : "text-emerald-100/50"}`}>
        Nearby Professionals ({allProviders.length})
      </h3>
      
      {allProviders.map((provider) => (
        <GlassCard 
          key={`${provider.type}-${provider.id}`} 
          variant="flat"
          className={cn(
            "p-4 flex items-start gap-4 hover:scale-[1.02] transition-transform cursor-pointer group",
            isLight ? "hover:border-yellow-500/30" : "hover:border-emerald-500/30"
          )}
        >
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            provider.type === "mechanic" 
              ? (isLight ? "bg-blue-100 text-blue-600" : "bg-blue-500/20 text-blue-400")
              : (isLight ? "bg-purple-100 text-purple-600" : "bg-purple-500/20 text-purple-400")
          )}>
            {provider.type === "mechanic" ? <Wrench size={20} /> : <Building2 size={20} />}
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h4 className={cn("font-bold truncate", isLight ? "text-slate-900" : "text-white")}>
                {provider.name}
              </h4>
              <div className="flex items-center gap-1 text-sm font-medium text-amber-400 flex-shrink-0 ml-2">
                <Star size={14} fill="currentColor" />
                {provider.rating}
              </div>
            </div>
            
            <div className={`flex items-center gap-2 text-xs mb-2 ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>
              <MapPin size={12} />
              <span>{provider.distanceKm} km away</span>
              <span className="opacity-40">•</span>
              <span className="capitalize">{provider.type}</span>
            </div>
            
            {(provider.expertise || provider.services) && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(provider.expertise || provider.services).slice(0, 3).map((tag) => (
                  <span 
                    key={tag}
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      isLight 
                        ? "bg-slate-100 text-slate-600" 
                        : "bg-white/10 text-emerald-100/70"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
