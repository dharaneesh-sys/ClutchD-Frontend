"use client";

import { useState, useMemo } from "react";
import { useFleetStore } from "@/store/fleetStore";
import { FLEET_SERVICE_TYPES, BULK_DISCOUNT_TIERS } from "@/lib/constants";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Truck,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Percent,
  Car,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIndianPlate } from "@/lib/plateFormatter";

function generateTimeSlots() {
  const slots = [];
  for (let hour = 8; hour <= 17; hour++) {
    for (const min of [0, 30]) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const displayMin = min === 0 ? "00" : "30";
      const ampm = hour >= 12 ? "PM" : "AM";
      const value = `${hour.toString().padStart(2, "0")}:${displayMin}`;
      const label = `${displayHour}:${displayMin} ${ampm}`;
      slots.push({ value, label });
    }
  }
  return slots;
}

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const SERVICE_ICONS = {
  oil_change: "🛢️",
  brake_inspection: "🔧",
  brake_repair: "🔩",
  tire_rotation: "🔄",
  engine_diagnostic: "🔍",
  ac_service: "❄️",
  general_service: "🔧",
  transmission_check: "⚙️",
  battery_check: "🔋",
  full_inspection: "📋",
};

export function FleetBookingPanel() {
  const {
    vehicles,
    selectedVehicleIds,
    selectedDate,
    selectedTime,
    vehicleServices,
    toggleVehicle,
    selectAllVehicles,
    deselectAll,
    setVehicleService,
    setSelectedDate,
    setSelectedTime,
    getPricingBreakdown,
    submitBooking,
  } = useFleetStore();

  const [showServicePicker, setShowServicePicker] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const pricing = useMemo(() => getPricingBreakdown(), [getPricingBreakdown]);

  const handleSubmit = () => {
    setError(null);
    if (selectedVehicleIds.length === 0) {
      setError("Select at least one vehicle");
      return;
    }
    if (!selectedDate) {
      setError("Select a service date");
      return;
    }
    if (!selectedTime) {
      setError("Select a time slot");
      return;
    }
    setSubmitting(true);
    try {
      const booking = submitBooking();
      if (!booking) {
        setError("Failed to create booking. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const allSelected = vehicles.length > 0 && selectedVehicleIds.length === vehicles.length;

  return (
    <div className="space-y-6">
      {/* Step 1: Vehicle Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Truck size={20} className="text-icon-highlight" />
            Select Vehicles
            <Badge variant="default" className="ml-1">
              {selectedVehicleIds.length} selected
            </Badge>
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={allSelected ? deselectAll : selectAllVehicles}
              className="text-xs font-medium text-icon-highlight hover:text-primary transition-colors flex items-center gap-1"
            >
              {allSelected ? (
                <><Square size={12} /> Deselect All</>
              ) : (
                <><CheckSquare size={12} /> Select All</>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {vehicles.map((v) => {
            const isSelected = selectedVehicleIds.includes(v.id);
            return (
              <div
                key={v.id}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isSelected
                    ? "bg-surface-soft border-border-subtle shadow-[0_0_16px_rgba(30,41,182,0.12)]"
                    : "bg-bg-card border-border-subtle hover:bg-surface-soft"
                )}
              >
                {/* Vehicle selection toggle */}
                <button
                  type="button"
                  onClick={() => toggleVehicle(v.id)}
                  className="w-full p-4 text-left flex items-start gap-3"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border-subtle bg-transparent"
                    )}
                  >
                    {isSelected && <CheckSquare size={14} className="text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-text-muted font-mono tracking-wider mt-0.5">{formatIndianPlate(v.plate)}</p>
                    <span className="inline-block text-[10px] text-text-dim mt-1 capitalize">
                      {v.type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <Car size={20} className="text-text-dim shrink-0" />
                </button>

                {/* Service type picker (only when selected) */}
                {isSelected && (
                  <div className="px-4 pb-3">
                    <div className="h-px bg-border-subtle/50 mb-2" />
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setShowServicePicker(
                            showServicePicker === v.id ? null : v.id
                          )
                        }
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs border border-border-subtle bg-bg-card hover:bg-surface-soft transition-colors"
                      >
                        <span className="flex items-center gap-1.5 text-text-muted">
                          {SERVICE_ICONS[vehicleServices[v.id]] || "🔧"}
                          <span className="text-text-primary font-medium">
                            {FLEET_SERVICE_TYPES.find(
                              (s) => s.value === (vehicleServices[v.id] || "general_service")
                            )?.label || "General Service"}
                          </span>
                        </span>
                        {showServicePicker === v.id ? (
                          <ChevronUp size={14} className="text-text-dim" />
                        ) : (
                          <ChevronDown size={14} className="text-text-dim" />
                        )}
                      </button>

                      {showServicePicker === v.id && (
                        <div className="absolute z-10 mt-1 left-0 right-0 bg-surface border border-border-subtle rounded-xl shadow-xl p-2 space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                          {FLEET_SERVICE_TYPES.map((svc) => {
                            const isActive = vehicleServices[v.id] === svc.value;
                            return (
                              <button
                                key={svc.value}
                                type="button"
                                onClick={() => {
                                  setVehicleService(v.id, svc.value);
                                  setShowServicePicker(null);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                                  isActive
                                    ? "bg-primary/15 text-primary font-semibold"
                                    : "text-text-muted hover:bg-surface-soft hover:text-text-primary"
                                )}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{SERVICE_ICONS[svc.value] || "🔧"}</span>
                                  {svc.label}
                                </span>
                                <span className="tabular-nums opacity-70">
                                  ₹{svc.basePrice.toLocaleString("en-IN")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Date & Time */}
      <GlassCard variant="glass" className="p-5">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-icon-highlight" />
          Schedule Date & Time
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Date */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2.5">
              <Calendar size={14} className="text-icon-highlight" />
              Service Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (selectedTime) setSelectedTime("");
              }}
              min={getTodayString()}
              className="w-full rounded-xl border px-4 py-3 text-sm transition-all bg-bg-card border-border-subtle text-text-primary placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark]"
            />
          </div>

          {/* Time slots */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2.5">
              <Clock size={14} className="text-icon-highlight" />
              Time Slot
            </label>
            {!selectedDate ? (
              <p className="text-sm text-text-dim py-3 text-center border border-dashed rounded-xl border-border-subtle">
                Select a date first
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setSelectedTime(slot.value)}
                    className={cn(
                      "px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-150",
                      selectedTime === slot.value
                        ? "bg-surface-soft border-border-subtle text-text-primary shadow-[0_0_10px_rgba(30,41,182,0.15)]"
                        : "bg-bg-card border-border-subtle text-text-muted hover:bg-surface-soft hover:text-text-primary"
                    )}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Step 3: Pricing */}
      <GlassCard variant="glass-lux" className="p-5">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <IndianRupee size={20} className="text-icon-highlight" />
          Pricing Summary
        </h3>

        {!pricing ? (
          <p className="text-sm text-text-dim py-4 text-center">
            Select vehicles to see pricing
          </p>
        ) : (
          <div className="space-y-4">
            {/* Line items per vehicle */}
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {pricing.lineItems.map((item) => (
                <div
                  key={item.vehicleId}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs">{SERVICE_ICONS[item.serviceType] || "🔧"}</span>
                    <span className="text-text-primary truncate">{item.vehicleName}</span>
                  </div>
                  <span className="text-text-muted tabular-nums shrink-0 ml-2">
                    ₹{item.price.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="h-px bg-border-subtle" />

            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Subtotal ({pricing.count} vehicle{pricing.count !== 1 ? "s" : ""})</span>
              <span className="text-text-primary font-medium tabular-nums">
                ₹{pricing.subtotal.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Discount */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-text-muted">
                <Percent size={14} className="text-green-400" />
                Bulk Discount
                {pricing.effectiveDiscountPercent > 0 && (
                  <Badge variant="success" className="text-[10px]">
                    {pricing.effectiveLabel}
                  </Badge>
                )}
              </span>
              {pricing.effectiveDiscountPercent > 0 ? (
                <span className="text-green-400 font-medium tabular-nums">
                  -₹{pricing.discountAmount.toLocaleString("en-IN")}
                </span>
              ) : (
                <span className="text-text-dim text-xs">
                  {pricing.count < 5 ? "Add 5+ for 10% off" : "—"}
                </span>
              )}
            </div>

            {/* Bracket indicator for next tier */}
            {pricing.effectiveDiscountPercent < 20 && (
              <div className="flex flex-wrap gap-1.5">
                {BULK_DISCOUNT_TIERS.filter((t) => t.minVehicles > 0 && t.discountPercent > pricing.effectiveDiscountPercent).map(
                  (tier) => (
                    <span
                      key={tier.minVehicles}
                      className="text-[10px] text-text-dim bg-surface-soft px-2 py-1 rounded-lg"
                    >
                      {tier.minVehicles}+ vehicles → {tier.discountPercent}% off
                    </span>
                  )
                )}
              </div>
            )}

            <div className="h-px bg-border-subtle" />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-text-primary">Total</span>
              <span className="text-xl font-bold text-icon-highlight tabular-nums">
                ₹{pricing.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        isLoading={submitting}
        className="w-full"
        size="lg"
        disabled={selectedVehicleIds.length === 0 || !selectedDate || !selectedTime}
      >
        <Zap size={18} className="mr-2" />
        {selectedVehicleIds.length === 0
          ? "Select Vehicles to Continue"
          : !selectedDate || !selectedTime
            ? "Select Date & Time"
            : `Book Fleet Service — ₹${(pricing?.total || 0).toLocaleString("en-IN")}`}
      </Button>
    </div>
  );
}
