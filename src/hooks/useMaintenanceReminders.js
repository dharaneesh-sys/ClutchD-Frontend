"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getAllReminders, checkMaintenance } from "@/lib/maintenance/reminderEngine";
import { useToastStore } from "@/store/toastStore";
import { useNotificationStore } from "@/store/notificationStore";

/**
 * React hook that integrates the maintenance reminder engine with the
 * existing notification system (toast + notification badge).
 *
 * @param {Array<Object>} vehicles — array of vehicle objects
 * @param {Object}         [options]
 * @param {boolean}        [options.showToasts=true]     — show toasts for new overdues
 * @param {number}         [options.checkIntervalMs=0]   — auto-check interval (0 = no polling)
 * @returns {{
 *   reminders:  Array,
 *   overdueCount: number,
 *   dueSoonCount: number,
 *   refresh:    () => void,
 * }}
 */
export function useMaintenanceReminders(vehicles, options = {}) {
  const { showToasts = true, checkIntervalMs = 0 } = options;

  const [reminders, setReminders] = useState([]);
  const prevOverdueRef = useRef(new Set());

  const addToast = useToastStore((s) => s.addToast);
  const increment = useNotificationStore((s) => s.increment);

  const refresh = useCallback(() => {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      setReminders([]);
      return;
    }

    const data = getAllReminders(vehicles);
    setReminders(data);

    // ── Push overdue items as toasts (only once per service × vehicle) ──
    if (showToasts) {
      const currentOverdue = new Set();

      for (const entry of data) {
        const vehicleLabel = entry.vehicle.make && entry.vehicle.model
          ? `${entry.vehicle.make} ${entry.vehicle.model}`
          : `Vehicle #${entry.vehicle.id}`;

        for (const svc of entry.services) {
          if (svc.status === "overdue") {
            const key = `${entry.vehicle.id}::${svc.serviceId}`;
            currentOverdue.add(key);

            if (!prevOverdueRef.current.has(key)) {
              addToast(
                "warning",
                `${vehicleLabel} — ${svc.label} is overdue!`,
                { persistent: true, duration: 8000 },
              );
              increment();
            }
          } else if (svc.status === "due_soon") {
            const key = `${entry.vehicle.id}::${svc.serviceId}`;
            currentOverdue.add(key);

            if (!prevOverdueRef.current.has(key)) {
              let reason = "";
              if (svc.milesRemaining !== null && svc.milesRemaining <= 500) {
                reason = ` (${svc.milesRemaining} km remaining)`;
              } else if (svc.daysRemaining !== null && svc.daysRemaining <= 14) {
                reason = ` (${svc.daysRemaining} days remaining)`;
              }
              addToast(
                "info",
                `${vehicleLabel} — ${svc.label} due soon${reason}`,
                { duration: 6000 },
              );
            }
          }
        }
      }

      prevOverdueRef.current = currentOverdue;
    }
  }, [vehicles, showToasts, addToast, increment]);

  // Initial check and optional polling
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    refresh();

    if (checkIntervalMs > 0) {
      const id = setInterval(refresh, checkIntervalMs);
      return () => clearInterval(id);
    }
  }, [refresh, checkIntervalMs]);

  // Derived counts
  const overdueCount = reminders.reduce(
    (sum, entry) => sum + entry.services.filter((s) => s.status === "overdue").length,
    0,
  );
  const dueSoonCount = reminders.reduce(
    (sum, entry) => sum + entry.services.filter((s) => s.status === "due_soon").length,
    0,
  );

  return { reminders, overdueCount, dueSoonCount, refresh };
}
