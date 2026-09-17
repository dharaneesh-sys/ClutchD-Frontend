"use client";

import { useState, useMemo, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, Car, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatIndianPlate } from "@/lib/plateFormatter";

/**
 * Generate 30-minute time slots from 8:00 AM to 6:00 PM.
 */
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

/**
 * Get today's date as YYYY-MM-DD for the `min` attribute.
 */
function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ScheduleBookingModal({ isOpen, onClose, onSubmit, isLoading, vehicles = [] }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [notes, setNotes] = useState("");

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const isFormValid = selectedDate && selectedTime;

  const handleSubmit = useCallback(() => {
    if (!isFormValid || isLoading) return;
    const scheduledAt = `${selectedDate}T${selectedTime}:00`;
    onSubmit({
      scheduledAt,
      vehicleId: selectedVehicle || null,
      notes: notes.trim() || null,
    });
  }, [isFormValid, isLoading, selectedDate, selectedTime, selectedVehicle, notes, onSubmit]);

  const handleClose = useCallback(() => {
    setSelectedDate("");
    setSelectedTime("");
    setSelectedVehicle("");
    setNotes("");
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Service"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        {/* Vehicle Selector */}
        {vehicles.length > 0 && (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2.5">
              <Car size={14} className="text-icon-highlight" />
              Select Vehicle <span className="text-text-dim font-normal">(optional)</span>
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 text-sm transition-all bg-bg-card border-border-subtle text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
            >
              <option value="">Any vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model}
                  {v.license_plate ? ` (${formatIndianPlate(v.license_plate)})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Picker */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2.5">
            <Calendar size={14} className="text-icon-highlight" />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime("");
            }}
            min={getTodayString()}
            className="w-full rounded-xl border px-4 py-3 text-sm transition-all bg-bg-card border-border-subtle text-text-primary placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [color-scheme:dark]"
          />
        </div>

        {/* Time Slots Grid */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-3">
            <Clock size={14} className="text-icon-highlight" />
            Available Time Slots
          </label>
          {!selectedDate ? (
            <p className="text-sm text-text-dim py-6 text-center">
              Select a date to view available slots
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
              {timeSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setSelectedTime(slot.value)}
                  className={cn(
                    "relative px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150",
                    selectedTime === slot.value
                      ? "bg-surface-soft border-border-subtle text-text-primary shadow-[0_0_10px_rgba(30,41,182,0.15)]"
                      : "bg-bg-card border-border-subtle text-text-muted hover:bg-surface-soft hover:text-text-primary hover:border-border-subtle"
                  )}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-text-primary mb-2.5">
            <MessageSquare size={14} className="text-icon-highlight" />
            Notes <span className="text-text-dim font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific issues or requests?"
            rows={3}
            className="w-full rounded-xl border px-4 py-3 text-sm transition-all bg-bg-card border-border-subtle text-text-primary placeholder:text-text-dim focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid}
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Calendar size={18} className="mr-2" />
                Schedule Appointment
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
