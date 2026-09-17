"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { VehicleManagerModal } from "@/components/dashboard/VehicleManagerModal";
import { cacheVehicleData, getCachedVehicles } from "@/lib/offline/offlineCache";
import {
  Car,
  Plus,
  Calendar,
  Wrench,
  Loader2,
  History,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  MapPin,
  Clock,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { formatIndianPlate } from "@/lib/plateFormatter";
import { Shimmer } from "@/components/ui/Shimmer";
import api from "@/lib/api";

/* ── Per-vehicle service job card ──────────────────────────────── */
function VehicleServiceJobCard({ job }) {
  const pricing = job.pricing;
  return (
    <GlassCard variant="strong" className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-sm text-text-primary truncate">
              {job.issueTag}
            </h4>
            <Badge
              variant={
                job.status === "completed"
                  ? "success"
                  : job.status === "cancelled"
                    ? "danger"
                    : "warning"
              }
            >
              {job.status.toUpperCase()}
            </Badge>
          </div>
          {job.description && (
            <p className="text-xs text-text-muted line-clamp-1 mb-1">
              {job.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-icon-highlight" />
              {job.createdAt
                ? formatDate(job.createdAt)
                : "Unknown"}
            </span>
            {job.mechanic && (
              <span className="flex items-center gap-1">
                <Wrench size={11} className="text-icon-highlight" />
                {job.mechanic.name}
              </span>
            )}
          </div>
        </div>
        {pricing?.totalAmount ? (
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-icon-highlight">
              ₹{Number(pricing.totalAmount || 0).toFixed(2)}
            </p>
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}

/* ── Single vehicle card ───────────────────────────────────────── */
function VehicleCard({
  vehicle,
  isSelected,
  lastServiceDate,
  onSelect,
}) {
  const statusIcon = (
    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
  );

  const statusText = lastServiceDate
    ? "Serviced recently"
    : "No service history yet";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative text-left w-full p-5 rounded-2xl border transition-all duration-200",
        "hover-lift active-press",
        isSelected
          ? "bg-surface-soft border-border-subtle shadow-[0_0_20px_rgba(234,179,8,0.15)]"
          : "bg-bg-card border-border-subtle hover:bg-surface-soft"
      )}
    >
      {/* Vehicle icon */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-surface-soft text-icon-highlight">
        <Car size={24} />
      </div>

      {/* Make / Model / Year */}
      <h3 className="text-lg font-bold text-text-primary mb-1">
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h3>

      {/* License plate */}
      {vehicle.license_plate && (
        <p className="text-xs font-mono text-text-muted mb-3 tracking-wider">
          {formatIndianPlate(vehicle.license_plate)}
        </p>
      )}

      {/* Stats */}
      <div className="space-y-2">
        {/* Last service */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <History size={13} className="text-icon-highlight shrink-0" />
          <span>
            {lastServiceDate
              ? `Last serviced ${formatDate(lastServiceDate)}`
              : "No service history"}
          </span>
        </div>

        {/* Maintenance status */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          {statusIcon}
          <span>{statusText}</span>
        </div>
      </div>

      {/* Selection dot */}
      {isSelected && (
        <span className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
      )}
    </button>
  );
}

/* ── Add-vehicle placeholder card ──────────────────────────────── */
function AddVehicleCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-5 rounded-2xl border-2 border-dashed border-border-subtle",
        "bg-bg-card hover:bg-surface-soft transition-all duration-200",
        "flex flex-col items-center justify-center min-h-[160px]",
        "hover-lift active-press group"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
          "bg-surface-soft group-hover:bg-bg-card transition-colors",
          "text-icon-highlight"
        )}
      >
        <Plus size={24} />
      </div>
      <p className="text-sm font-semibold text-text-muted group-hover:text-text-primary transition-colors">
        Add Vehicle
      </p>
    </button>
  );
}

/* ── Main VehicleList component ────────────────────────────────── */
export function VehicleList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);

  /* ── Fetch vehicles ─────────────────────────────────────────── */
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/vehicles");
      setVehicles(res.data);
      await cacheVehicleData(res.data);
    } catch {
      const cached = await getCachedVehicles();
      if (cached.length > 0) setVehicles(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch job history for all vehicles ─────────────────────── */
  const fetchJobHistory = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await api.get("/jobs/history");
      setAllJobs(res.data.jobs || []);
    } catch {
      // best effort — service history section will be empty
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchJobHistory();
  }, [fetchVehicles, fetchJobHistory]);

  /* ── Derived data ───────────────────────────────────────────── */
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId]
  );

  const vehicleJobs = useMemo(() => {
    if (!selectedVehicleId) return [];
    return allJobs
      .filter((j) => j.vehicleId === selectedVehicleId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [allJobs, selectedVehicleId]);

  const getLastServiceDate = useCallback(
    (vehicleId) => {
      const completed = allJobs.filter(
        (j) => j.vehicleId === vehicleId && j.status === "completed"
      );
      if (completed.length === 0) return null;
      return new Date(
        Math.max(...completed.map((j) => new Date(j.createdAt).getTime()))
      );
    },
    [allJobs]
  );

  /* ── Loading state ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border-subtle bg-bg-card space-y-4"
          >
            <Shimmer variant="avatar" className="w-12 h-12 rounded-xl" />
            <Shimmer variant="title" className="w-3/4" />
            <Shimmer variant="text" className="w-1/2" />
            <div className="space-y-2 pt-2">
              <Shimmer variant="text" className="w-full" />
              <Shimmer variant="text" className="w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty state ────────────────────────────────────────────── */
  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border bg-bg-card border-border-subtle">
        <Car size={36} className="mb-3 opacity-50 text-text-dim" />
        <h3 className="text-lg font-semibold mb-1 text-text-primary">
          No Vehicles Yet
        </h3>
        <p className="text-text-muted mb-5 text-sm">
          Add your first vehicle to track service history and maintenance.
        </p>
        <Button onClick={() => setIsVehicleModalOpen(true)}>
          <Plus size={16} className="mr-2" /> Add Vehicle
        </Button>
        <VehicleManagerModal
          isOpen={isVehicleModalOpen}
          onClose={() => setIsVehicleModalOpen(false)}
          onVehiclesChanged={fetchVehicles}
        />
      </div>
    );
  }

  /* ── Main render ────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Vehicle grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {vehicles.map((v) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            isSelected={selectedVehicleId === v.id}
            lastServiceDate={getLastServiceDate(v.id)}
            onSelect={() =>
              setSelectedVehicleId(
                selectedVehicleId === v.id ? null : v.id
              )
            }
          />
        ))}

        <AddVehicleCard onClick={() => setIsVehicleModalOpen(true)} />
      </div>

      {/* Per-vehicle service history */}
      {selectedVehicle && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">
              Service History
              <span className="text-text-muted font-normal text-sm ml-2">
                {selectedVehicle.year} {selectedVehicle.make}{" "}
                {selectedVehicle.model}
              </span>
            </h3>
            <span className="text-xs text-text-muted">
              {vehicleJobs.length}{" "}
              {vehicleJobs.length === 1 ? "service" : "services"}
            </span>
          </div>

          {jobsLoading ? (
            <div className="flex justify-center p-8">
              <Loader2
                size={24}
                className="animate-spin text-icon-highlight"
              />
            </div>
          ) : vehicleJobs.length > 0 ? (
            <div className="space-y-3">
              {vehicleJobs.map((job) => (
                <VehicleServiceJobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-xl border-border-subtle bg-bg-card">
              <Wrench size={32} className="mx-auto mb-2 text-text-dim" />
              <p className="text-text-muted text-sm">
                No service history for this vehicle yet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vehicle manager modal */}
      <VehicleManagerModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        onVehiclesChanged={fetchVehicles}
      />
    </div>
  );
}
