"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatIndianPlate } from "@/lib/plateFormatter";
import { formatDate, formatTime } from "@/lib/utils";
import api from "@/lib/api";

export function ScheduledAppointments({ onBook }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchAppointments = async () => {
      try {
        const res = await api.get("/jobs/history");
        if (cancelled) return;
        const all = res.data.jobs || [];
        // Jobs with a scheduledAt date that are not yet completed/cancelled
        const upcoming = all.filter(
          (j) =>
            j.scheduledAt &&
            j.status !== "completed" &&
            j.status !== "cancelled"
        );
        // Sort by scheduledAt ascending
        upcoming.sort(
          (a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)
        );
        setAppointments(upcoming);
      } catch {
        // Endpoint may not exist — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAppointments();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <GlassCard variant="flat" className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Scheduled Appointments
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.slice(0, 3).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border-subtle bg-bg-card"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-surface-soft text-primary shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">
                    {apt.issueTag || "Service Appointment"}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatDate(apt.scheduledAt)} · {formatTime(apt.scheduledAt)}
                  </p>
                  {apt.vehicle?.license_plate && (
                    <p className="text-[10px] font-mono text-text-dim mt-0.5">
                      {formatIndianPlate(apt.vehicle.license_plate)}
                    </p>
                  )}
                </div>
                <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {apt.status === "assigned" ? "Confirmed" : apt.status}
                </span>
              </div>
            ))}
            {appointments.length > 3 && (
              <p className="text-xs text-center text-text-muted pt-1">
                +{appointments.length - 3} more
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-surface-soft text-text-dim">
              <Calendar size={22} />
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">
              No upcoming appointments
            </p>
            <p className="text-xs text-text-muted mb-5">
              Book a time slot and we&apos;ll dispatch a professional.
            </p>
            <Button size="sm" onClick={onBook}>
              <Calendar size={14} className="mr-1.5" />
              Book Appointment
            </Button>
          </div>
        )}
      </GlassCard>

      {appointments.length > 0 && (
        <div className="mt-3 text-center">
          <Button size="sm" variant="outline" onClick={onBook}>
            <Calendar size={14} className="mr-1.5" />
            Book Another
          </Button>
        </div>
      )}
    </>
  );
}
