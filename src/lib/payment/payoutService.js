"use client";

import api from "@/lib/api";
import { BackendHealth } from "@/lib/backendHealth";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE = {
  frequency: "weekly", // "weekly" | "bi-weekly" | "monthly"
  payoutDay: 5, // 0=Sunday ... 5=Friday (default Friday for weekly)
  payoutDate: 1, // Day of month for monthly (1-28)
  minThreshold: 500, // Minimum ₹500 to trigger payout
};

const FREQUENCY_LABELS = {
  weekly: "Every Friday",
  "bi-weekly": "Every other Friday",
  monthly: "1st of every month",
};

// ─── Storage keys ──────────────────────────────────────────────────────────────

const SCHEDULE_KEY = "clutchd_payout_schedule";
const LEDGER_KEY = "clutchd_payout_ledger";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadItem(key) {
  const storage = getStorage();
  if (storage) {
    try {
      const raw = storage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      // Corrupt data
    }
  }
  return null;
}

function saveItem(key, data) {
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(key, JSON.stringify(data));
    } catch {
      // Quota exceeded
    }
  }
}

/**
 * Compute the next N payout dates based on the schedule configuration.
 */
function computeUpcomingDates(schedule, count = 5) {
  const now = new Date();
  const dates = [];
  const current = new Date(now);

  // Normalise to start of day
  current.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    let next;

    switch (schedule.frequency) {
      case "weekly": {
        // Find the next occurrence of payoutDay (0=Sun .. 6=Sat)
        const dayOfWeek = schedule.payoutDay ?? 5; // default Friday
        const diff = (dayOfWeek - current.getDay() + 7) % 7;
        next = new Date(current);
        next.setDate(current.getDate() + (diff === 0 && dates.length === 0 ? 7 : diff || 7));
        break;
      }
      case "bi-weekly": {
        const baseDay = schedule.payoutDay ?? 5;
        const diff = (baseDay - current.getDay() + 7) % 7;
        next = new Date(current);
        next.setDate(current.getDate() + (diff === 0 && dates.length === 0 ? 7 : diff || 7));
        // If this isn't the first, ensure 14-day gap from the previous
        if (dates.length > 0) {
          const prev = new Date(dates[dates.length - 1]);
          prev.setDate(prev.getDate() + 14);
          if (next < prev) next = prev;
        }
        break;
      }
      case "monthly": {
        const targetDay = schedule.payoutDate ?? 1;
        next = new Date(current.getFullYear(), current.getMonth(), targetDay);
        if (next <= current || (dates.length > 0 && next <= new Date(dates[dates.length - 1]))) {
          next = new Date(current.getFullYear(), current.getMonth() + 1, targetDay);
        }
        break;
      }
      default:
        next = new Date(current);
        next.setDate(next.getDate() + 7);
    }

    dates.push(next.toISOString().split("T")[0]);
    current.setTime(next.getTime() + 86400000); // move past this date
  }

  return dates;
}

/**
 * Format a date string (YYYY-MM-DD) to locale display.
 */
function formatPayoutDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const payoutService = {
  /**
   * Payout frequency options for admin configuration.
   */
  FREQUENCY_OPTIONS: [
    { value: "weekly", label: "Weekly" },
    { value: "bi-weekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
  ],

  FREQUENCY_LABELS,

  /**
   * Read the current payout schedule from localStorage.
   * Returns the default schedule if nothing is saved.
   */
  getSchedule: () => {
    return loadItem(SCHEDULE_KEY) || { ...DEFAULT_SCHEDULE };
  },

  /**
   * Save a new payout schedule configuration.
   * Attempts to sync with backend; falls back to localStorage.
   *
   * @param {Object} schedule - { frequency, payoutDay?, payoutDate?, minThreshold }
   * @returns {Promise<{ success: boolean, schedule: Object, backendAvailable: boolean }>}
   */
  updateSchedule: async (schedule) => {
    const merged = { ...DEFAULT_SCHEDULE, ...schedule };
    saveItem(SCHEDULE_KEY, merged);

    const backendAvailable = BackendHealth.isAvailable();
    if (backendAvailable) {
      try {
        await api.put("/admin/payouts/schedule", merged);
      } catch {
        // Backend 503 or unavailable — silently use localStorage
      }
    }

    return { success: true, schedule: merged, backendAvailable };
  },

  /**
   * Fetch the payout ledger for all providers (mechanics + garages).
   *
   * Real data only: GET /admin/payouts computes the ledger from jobs and
   * captured payments. If the backend is unreachable the caller sees the
   * error — no demo rows are ever fabricated.
   *
   * @returns {Promise<Array<Object>>}
   */
  getMechanicPayouts: async () => {
    const res = await api.get("/admin/payouts");
    const payouts = res.data.payouts || res.data || [];
    saveItem(LEDGER_KEY, payouts);
    return payouts;
  },

  /**
   * Calculate upcoming payout dates based on the current schedule.
   *
   * @param {number} [count=5]
   * @returns {Array<{ date: string, label: string }>}
   */
  getUpcomingDates: (count = 5) => {
    const schedule = payoutService.getSchedule();
    const dates = computeUpcomingDates(schedule, count);
    return dates.map((d) => ({
      date: d,
      label: formatPayoutDate(d),
    }));
  },

  /**
   * Get estimated payout for each mechanic given the schedule.
   * Merges ledger data with upcoming date predictions.
   *
   * @param {Array} ledger - Mechanic payout ledger from getMechanicPayouts()
   * @param {number} [upcomingCount=3]
   * @returns {Array<Object>}
   */
  getEstimatedPayouts: (ledger, upcomingCount = 3) => {
    const schedule = payoutService.getSchedule();
    const upcomingDates = computeUpcomingDates(schedule, upcomingCount);

    return ledger.map((entry) => {
      // Estimate the next payout date based on whether amount meets threshold
      const meetsThreshold = entry.pendingAmount >= schedule.minThreshold;
      const nextPayoutDate = meetsThreshold ? upcomingDates[0] : null;

      return {
        ...entry,
        meetsThreshold,
        minThreshold: schedule.minThreshold,
        nextPayoutDate,
        nextPayoutLabel: nextPayoutDate ? formatPayoutDate(nextPayoutDate) : "Below threshold",
        estimatedAmount: meetsThreshold ? entry.pendingAmount : 0,
      };
    });
  },

  /**
   * Trigger a manual payout for a specific mechanic.
   *
   * Backend-only: POST /admin/payouts/manual records the real payout.
   * Errors propagate to the caller — no mock transactions.
   *
   * @param {string} mechanicId
   * @param {number} amount - Amount in rupees
   * @param {string} [note]
   * @returns {Promise<{ success: boolean, payout: Object, backendAvailable: boolean }>}
   */
  triggerManualPayout: async (mechanicId, amount, note = "") => {
    try {
      const res = await api.post("/admin/payouts/manual", {
        mechanic_id: mechanicId,
        amount,
        note,
      });
      const payout = res.data.payout || res.data;
      return { success: true, payout, backendAvailable: true };
    } catch (err) {
      throw new Error(
        err?.response?.data?.detail ||
          "Payout could not be recorded (backend unreachable)",
      );
    }
  },

  /**
   * Get a visual label for the schedule configuration.
   */
  getScheduleLabel: () => {
    const schedule = payoutService.getSchedule();
    return FREQUENCY_LABELS[schedule.frequency] || "Every Friday";
  },

  /**
   * Reset all stored payout data (for testing).
   */
  reset: () => {
    const storage = getStorage();
    if (storage) {
      try {
        storage.removeItem(SCHEDULE_KEY);
        storage.removeItem(LEDGER_KEY);
      } catch {
        // ignore
      }
    }
  },
};


// TODO(BACKEND_CONTRACTS §2 payouts): wire GET /admin/payouts + POST /admin/payouts/manual + PUT /admin/payouts/schedule; keep mock only as 503 fallback.
