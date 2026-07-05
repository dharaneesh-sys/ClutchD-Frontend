"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2,
  Calendar,
  Clock,
  IndianRupee,
  Percent,
  Truck,
  Car,
  ArrowRight,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

const SERVICE_LABELS = {
  oil_change: "Oil Change",
  brake_inspection: "Brake Inspection",
  brake_repair: "Brake Repair",
  tire_rotation: "Tire Rotation",
  engine_diagnostic: "Engine Diagnostic",
  ac_service: "AC Service",
  general_service: "General Service",
  transmission_check: "Transmission Check",
  battery_check: "Battery & Electrical",
  full_inspection: "Full Inspection",
};

export function BookingConfirmation({ booking, onDismiss, onNewBooking }) {
  if (!booking) return null;

  const scheduledDate = new Date(booking.scheduledDate);

  return (
    <div className="space-y-6">
      {/* Success header */}
      <GlassCard variant="glass-lux" className="p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={40} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Bulk Booking Confirmed!
        </h2>
        <p className="text-text-muted max-w-md mx-auto">
          Your fleet service request has been submitted. We&apos;ll dispatch
          mechanics to service your vehicles on the scheduled date.
        </p>
      </GlassCard>

      {/* Booking reference */}
      <GlassCard variant="glass" className="p-5">
        <div className="flex items-center gap-3 mb-1">
          <FileText size={16} className="text-icon-highlight" />
          <span className="text-xs text-text-dim uppercase tracking-wider">Booking Reference</span>
        </div>
        <p className="text-lg font-mono font-bold text-text-primary tracking-wider">
          {booking.id}
        </p>
      </GlassCard>

      {/* Booking details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard variant="glass" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-icon-highlight" />
            <h4 className="text-sm font-semibold text-text-primary">Scheduled Date</h4>
          </div>
          <p className="text-lg font-bold text-text-primary">
            {format(scheduledDate, "EEEE, MMM d, yyyy")}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-text-muted">
            <Clock size={14} />
            {format(scheduledDate, "h:mm a")}
          </div>
        </GlassCard>

        <GlassCard variant="glass" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={16} className="text-icon-highlight" />
            <h4 className="text-sm font-semibold text-text-primary">Vehicles</h4>
          </div>
          <p className="text-lg font-bold text-text-primary">
            {booking.vehicleCount} vehicle{booking.vehicleCount !== 1 ? "s" : ""}
          </p>
          <p className="text-sm text-text-muted mt-1">
            {booking.vehicles.length} service{booking.vehicles.length !== 1 ? "s" : ""} scheduled
          </p>
        </GlassCard>
      </div>

      {/* Vehicle list */}
      <GlassCard variant="glass" className="p-5">
        <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
          <Car size={16} className="text-icon-highlight" />
          Vehicle Details
        </h4>
        <div className="space-y-2">
          {booking.vehicles.map((v) => (
            <div
              key={v.vehicleId}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface-soft"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Car size={16} className="text-text-dim shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {v.vehicleName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {SERVICE_LABELS[v.serviceType] || v.serviceType}
                  </p>
                </div>
              </div>
              <Badge variant="default" className="shrink-0 ml-2">
                {SERVICE_LABELS[v.serviceType] || v.serviceType}
              </Badge>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Pricing summary */}
      <GlassCard variant="glass-lux" className="p-5">
        <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
          <IndianRupee size={16} className="text-icon-highlight" />
          Pricing
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">Subtotal</span>
            <span className="text-text-primary tabular-nums">
              ₹{booking.pricing.subtotal.toLocaleString("en-IN")}
            </span>
          </div>
          {booking.pricing.discountPercent > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-green-400">
                <Percent size={14} />
                Bulk Discount ({booking.pricing.discountLabel})
              </span>
              <span className="text-green-400 font-medium tabular-nums">
                -₹{booking.pricing.discountAmount.toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <div className="h-px bg-border-subtle my-2" />
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-text-primary">Total</span>
            <span className="text-xl font-bold text-icon-highlight tabular-nums">
              ₹{booking.pricing.total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </GlassCard>

      {/* Status badge */}
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-text-muted">Status:</span>
        <Badge variant="success">{booking.status?.toUpperCase()}</Badge>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onNewBooking} className="flex-1" size="lg">
          <Truck size={18} className="mr-2" />
          New Booking
          <ArrowRight size={18} className="ml-2" />
        </Button>
        <Button onClick={onDismiss} variant="outline" className="flex-1" size="lg">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
