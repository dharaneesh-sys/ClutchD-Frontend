"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  ShoppingBag,
  History,
  Calendar,
  Star,
  Building2,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

const DEMO_RECENT_SERVICES = [
  { id: "1", issueTag: "flat_tire", label: "Flat Tire Repair", date: "2026-06-28", status: "completed" },
  { id: "2", issueTag: "engine_failure", label: "Engine Diagnostics", date: "2026-06-15", status: "completed" },
  { id: "3", issueTag: "battery_dead", label: "Battery Replacement", date: "2026-05-30", status: "completed" },
];

const DEMO_FAVORITES = [
  { id: "fav-1", name: "Sharma Auto Works", type: "Garage", rating: 4.5, address: "Indiranagar, Bangalore" },
  { id: "fav-2", name: "Rajesh Mobile Mechanic", type: "Mechanic", rating: 4.8, address: "Koramangala, Bangalore" },
];

const APP_SHORTCUTS = [
  { icon: Wrench, label: "Request Service", path: "/dashboard/customer", color: "text-primary-light" },
  { icon: ShoppingBag, label: "Browse Parts", path: "/marketplace", color: "text-amber-400" },
  { icon: History, label: "Order History", path: "/marketplace/profile/orders", color: "text-blue-400" },
  { icon: Calendar, label: "Schedule Booking", path: "/dashboard/customer", color: "text-violet-400" },
];

export default function QuickActionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [recentServices, setRecentServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes] = await Promise.allSettled([
          api.get("/service/history"),
        ]);
        if (servicesRes.status === "fulfilled" && servicesRes.value?.data) {
          const items = Array.isArray(servicesRes.value.data) ? servicesRes.value.data : [];
          setRecentServices(items.slice(0, 3));
        } else {
          setRecentServices(DEMO_RECENT_SERVICES);
        }
      } catch {
        setRecentServices(DEMO_RECENT_SERVICES);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 space-y-5 animate-fade-in-up max-w-2xl">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-foreground">Quick Actions</h1>
        <p className="text-sm text-text-muted">Shortcuts and recent activity</p>
      </div>

      {/* App Shortcuts */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1 mb-3">
          App Shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {APP_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.label}
              onClick={() => router.push(shortcut.path)}
              className="glass-lux rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-white/[0.03] transition-colors text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                <shortcut.icon size={20} className={shortcut.color} />
              </div>
              <span className="text-xs font-medium text-foreground">
                {shortcut.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Favorites */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1 mb-3">
          Saved Providers
        </h2>
        <div className="space-y-2">
          {DEMO_FAVORITES.map((fav) => (
            <div
              key={fav.id}
              className="glass-lux rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/[0.12] flex items-center justify-center">
                <Building2 size={18} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {fav.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                    {fav.type}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                    <Star size={10} className="fill-current" />
                    {fav.rating}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5 truncate">{fav.address}</p>
              </div>
              <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
            </div>
          ))}
          <button
            onClick={() => router.push("/marketplace")}
            className="w-full text-xs font-medium text-primary-light hover:text-primary transition-colors py-2 text-center"
          >
            Browse more providers
          </button>
        </div>
      </div>

      {/* Recently Used Services */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-1 mb-3">
          Recent Services
        </h2>
        <div className="space-y-2">
          {recentServices.length === 0 ? (
            <p className="text-sm text-text-muted px-1">No recent services</p>
          ) : (
            recentServices.map((svc) => (
              <div
                key={svc.id}
                className="glass-lux rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/[0.1] flex items-center justify-center">
                  <Clock size={16} className="text-primary-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {svc.label || svc.issueTag}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{svc.date}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider",
                  svc.status === "completed"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                )}>
                  {svc.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
