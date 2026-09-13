"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Car,
  History,
  Percent,
  Shield,
  Clock,
  Wrench,
  Building2,
  ChevronRight,
  Calendar,
  DollarSign,
  AlertCircle,
  Zap,
  MessageSquare,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { cn, formatDate } from "@/lib/utils";
import { formatIndianPlate } from "@/lib/plateFormatter";
import {
  getFleetRegistration,
  getFleetVehicles,
  getFleetServiceHistory,
  initDemoFleet,
  getFleetTier,
} from "@/lib/fleet/fleetStorage";

const VEHICLE_TYPE_LABELS = {
  light_truck: "Light Truck",
  suv: "SUV",
  sedan: "Sedan",
  hatchback: "Hatchback",
  scooter: "Scooter",
  heavy_truck: "Heavy Truck",
  bus: "Bus",
};

const TIER_COLORS = {
  platinum: { badge: "info", text: "text-blue-300", bg: "bg-blue-500/10" },
  gold: { badge: "primary", text: "text-emerald-300", bg: "bg-emerald-500/10" },
  silver: { badge: "default", text: "text-primary-light", bg: "bg-primary/10" },
  bronze: { badge: "glass", text: "text-text-muted", bg: "bg-white/5" },
};

function StatCard({ icon: Icon, label, value, sub, className }) {
  return (
    <GlassCard variant="glass-lux" className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground truncate">{value}</p>
          {sub && (
            <p className="text-xs text-text-dim">{sub}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={20} className="text-primary-light" />
        </div>
      </div>
    </GlassCard>
  );
}

function VehicleCard({ vehicle }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor =
    vehicle.status === "active"
      ? "bg-green-500"
      : vehicle.status === "maintenance"
        ? "bg-emerald-500"
        : "bg-red-500";

  const typeLabel = VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type || "Vehicle";
  const detailsId = `vehicle-details-${vehicle.id}`;

  return (
    <GlassCard variant="glass-lux-interactive" className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-surface-soft flex items-center justify-center shrink-0">
            <Car size={20} className="text-text-muted" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {vehicle.make} {vehicle.model}
            </p>
            <p className="text-xs text-text-muted font-mono tracking-wider">{formatIndianPlate(vehicle.plate)}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-text-dim">{typeLabel} • {vehicle.year}</span>
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium",
                vehicle.status === "active" ? "text-green-400" :
                vehicle.status === "maintenance" ? "text-primary-light" : "text-red-400"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusColor)} />
                {vehicle.status}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={expanded ? `Collapse details for ${vehicle.make} ${vehicle.model}` : `Expand details for ${vehicle.make} ${vehicle.model}`}
          className="p-1.5 -m-1.5 rounded-lg text-text-dim hover:text-foreground hover:bg-surface-soft transition-colors shrink-0"
        >
          <ChevronRight size={16} className={cn("transition-transform", expanded && "rotate-90")} />
        </button>
      </div>
      {expanded && (
        <div id={detailsId} className="mt-3 pt-3 border-t border-border-subtle/50 grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-dim">Plate</p>
            <p className="font-medium font-mono tracking-wider text-foreground mt-0.5">{formatIndianPlate(vehicle.plate)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-dim">Type</p>
            <p className="font-medium text-foreground mt-0.5">{typeLabel}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-dim">Year</p>
            <p className="font-medium text-foreground mt-0.5">{vehicle.year}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-dim">Status</p>
            <p className="font-medium text-foreground mt-0.5 capitalize">{vehicle.status}</p>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function ServiceRow({ entry, onChat }) {
  const statusVariant =
    entry.status === "completed" ? "success" :
    entry.status === "in_progress" ? "warning" : "glass";

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-soft transition-colors">
      <div className="w-9 h-9 rounded-lg bg-surface-soft flex items-center justify-center shrink-0">
        <Wrench size={16} className="text-text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {entry.vehicleName}
            </p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
              {entry.description}
            </p>
          </div>
          <Badge variant={statusVariant} className="shrink-0">
            {entry.status === "completed" ? "Done" : entry.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-text-dim">
          <span className="flex items-center gap-1">
            <Calendar size={10} />
            {formatDate(entry.date)}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign size={10} />
            ₹{entry.amount?.toLocaleString()}
          </span>
          <span className="truncate">{entry.providerName}</span>
        </div>
          {onChat && (
            <button
              type="button"
              onClick={() => onChat(entry.id, entry.providerName)}
              aria-label={`Chat about service ${entry.id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-light hover:text-primary transition-colors"
            >
              <MessageSquare size={14} className="mr-1" /> Chat
            </button>
          )}
      </div>
    </div>
  );
}

/**
 * Fleet/B2B dashboard showing fleet vehicles, service history, and bulk discounts.
 */
export function FleetDashboard({ onRegisterNew, onStartBooking, onChat }) {
  const [fleet, setFleet] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);

  // Load data from localStorage
  useEffect(() => {
    const data = getFleetRegistration() || initDemoFleet();
    /* eslint-disable react-hooks/set-state-in-effect */
    setFleet(data);
    setVehicles(getFleetVehicles());
    setServiceHistory(getFleetServiceHistory());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const tierInfo = useMemo(() => {
    if (!fleet) return { name: "bronze", discountRate: 5, label: "Bronze" };
    return getFleetTier(fleet.totalSpent || 0);
  }, [fleet]);

  const tierColor = TIER_COLORS[tierInfo.name] || TIER_COLORS.bronze;

  const activeVehicles = useMemo(
    () => vehicles.filter((v) => v.status === "active"),
    [vehicles]
  );

  const recentServices = useMemo(
    () => [...serviceHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10),
    [serviceHistory]
  );

  if (!fleet) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Fleet Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="type-headline-3 text-foreground">{fleet.companyName}</h1>
            <Badge variant={tierColor.badge} className={cn(tierColor.text)}>
              {tierInfo.label} Tier
            </Badge>
          </div>
          <p className="type-body-2 text-muted mt-1">
            Fleet Account • {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} • Priority Dispatch Active
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onStartBooking && (
            <Button variant="primary" size="sm" onClick={onStartBooking}>
              <Zap size={16} className="mr-1.5" />
              Bulk Booking
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRegisterNew}>
            <Building2 size={16} className="mr-1.5" />
            New Registration
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Truck}
          label="Total Vehicles"
          value={vehicles.length}
          sub={`${activeVehicles.length} active`}
        />
        <StatCard
          icon={History}
          label="Services Completed"
          value={fleet.totalJobsCompleted || serviceHistory.length}
        />
        <StatCard
          icon={DollarSign}
          label="Total Spent"
          value={`₹${(fleet.totalSpent || 0).toLocaleString()}`}
        />
        <StatCard
          icon={Percent}
          label="Bulk Discount"
          value={`${tierInfo.discountRate}%`}
          sub={fleet.priorityDispatch ? "Priority dispatch" : "Standard dispatch"}
        />
      </div>

      {/* Tier Progress */}
      {tierInfo.name !== "platinum" && (
        <GlassCard variant="glass-lux" className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary-light" />
              <span className="text-sm font-semibold text-foreground">Next Tier</span>
            </div>
            <span className="text-xs text-text-muted">
              ₹{((fleet.totalSpent || 0)).toLocaleString()} / ₹{tierInfo.name === "gold" ? "500,000" : tierInfo.name === "silver" ? "200,000" : "100,000"}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-soft overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tierColor.bg.replace("/10", "/40")
              )}
              style={{
                width: `${
                  Math.min(
                    ((fleet.totalSpent || 0) /
                      (tierInfo.name === "gold"
                        ? 500000
                        : tierInfo.name === "silver"
                          ? 200000
                          : 100000)) *
                      100,
                    100
                  )
                }%`,
              }}
            />
          </div>
          <p className="text-[11px] text-text-dim mt-2">
            {tierInfo.name === "gold"
              ? "Spend ₹5,00,000+ to reach Platinum tier (20% discount)"
              : tierInfo.name === "silver"
                ? "Spend ₹2,00,000+ to reach Gold tier (15% discount)"
                : "Spend ₹1,00,000+ to reach Silver tier (10% discount)"}
          </p>
        </GlassCard>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Vehicles */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Car size={18} className="text-primary-light" />
              Fleet Vehicles
            </h2>
            <Badge variant="glass">{vehicles.length} total</Badge>
          </div>

          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Car}
              title="No vehicles registered"
              description="Add vehicles to your fleet to get started."
            />
          )}
        </div>

        {/* Sidebar: Service History + Discount Info */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Bulk Discount Card */}
          <GlassCard variant="glass-lux" className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Percent size={16} className="text-primary-light" />
              <h3 className="text-sm font-bold text-foreground">Volume Discounts</h3>
            </div>
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle/50">
                <span>Current discount</span>
                <span className="font-semibold text-primary-light">{tierInfo.discountRate}%</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle/50">
                <span>Priority dispatch</span>
                <span className="font-semibold text-green-400 flex items-center gap-1">
                  <Shield size={12} />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle/50">
                <span>Service booking discount</span>
                <span className="font-semibold text-foreground">
                  {tierInfo.discountRate}% off parts
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Recent Service History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock size={16} className="text-primary-light" />
                Recent Services
              </h3>
              <Badge variant="glass">{serviceHistory.length} total</Badge>
            </div>

            {recentServices.length > 0 ? (
              <GlassCard variant="glass-lux" className="divide-y divide-border-subtle/50">
                {recentServices.map((entry) => (
                  <ServiceRow key={entry.id} entry={entry} onChat={onChat} />
                ))}
              </GlassCard>
            ) : (
              <EmptyState
                icon={Wrench}
                title="No service history"
                description="Your fleet service records will appear here."
              />
            )}
          </div>
        </div>
      </div>

      {/* Priority Dispatch Banner */}
      <GlassCard variant="glass" className="p-4 sm:p-5 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-primary-light" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Fleet Priority Dispatch</p>
            <p className="text-xs text-text-muted leading-relaxed">
              As a fleet customer, your service requests are automatically flagged for priority.
              When you book a service through the dashboard, you&apos;ll be matched with the nearest
              available mechanic or garage ahead of regular customers. Volume discounts apply
              automatically based on your tier.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
