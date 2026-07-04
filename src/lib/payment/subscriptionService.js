"use client";

import { BackendHealth } from "@/lib/backendHealth";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

// ─── Storage keys ────────────────────────────────────────────────────────────
const STORAGE_KEY = "clutchd_subscription";

// ─── In-memory fallback when localStorage is unavailable ────────────────────
let _memoryState = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadSubscription() {
  const storage = getStorage();
  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Corrupt data — ignore
    }
  }
  return _memoryState;
}

function saveSubscription(data) {
  _memoryState = data;
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Quota exceeded or private mode — in-memory only
    }
  }
}

function clearSubscription() {
  _memoryState = null;
  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

/**
 * Simulate a realistic delay for the mock subscription flow.
 * @param {number} [ms=1200]
 */
function delay(ms = 1200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a fake subscription ID that looks realistic.
 */
function generateSubscriptionId() {
  const prefix = "sub_";
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}${ts}${rand}`;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Subscription service — provides create/cancel/status operations.
 *
 * - When `BackendHealth.isAvailable()` is `true`, operations would normally
 *   call the payment API. Since the backend has no subscription API yet, they
 *   **always** fall through to the localStorage mock.
 * - When backend is `false` or `null` (unchecked), the mock is used with a
 *   dismissable notice.
 * - All subscription data is persisted to localStorage for demo mode.
 */
export const subscriptionService = {
  /**
   * Create (activate) a subscription for the given plan.
   *
   * @param {string} planId - One of "free", "plus", "pro"
   * @returns {Promise<{success: boolean, subscription: Object, backendAvailable: boolean}>}
   */
  createSubscription: async (planId) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new Error(`Unknown plan: "${planId}". Valid plans: ${SUBSCRIPTION_PLANS.map((p) => p.id).join(", ")}`);
    }

    const backendAvailable = BackendHealth.isAvailable();

    // If backend IS available, we *would* call the API here.
    // For now the endpoint doesn't exist, so we always use the mock.
    if (backendAvailable) {
      // Future: const res = await api.post("/subscription/create", { plan_id: planId });
      // return res.data;
      // For now, fall through to mock.
    }

    // ── Mock / localStorage path ──────────────────────────────────────
    await delay();

    const now = new Date();
    const activeUntil = new Date(now);
    if (plan.period === "month") {
      activeUntil.setMonth(activeUntil.getMonth() + 1);
    } else if (plan.period === "year") {
      activeUntil.setFullYear(activeUntil.getFullYear() + 1);
    }

    const subscription = {
      id: generateSubscriptionId(),
      planId: plan.id,
      planName: plan.name,
      status: "active",
      price: plan.price,
      period: plan.period,
      createdAt: now.toISOString(),
      activeUntil: activeUntil.toISOString(),
      autoRenew: plan.price > 0,
    };

    saveSubscription(subscription);

    return {
      success: true,
      subscription,
      backendAvailable,
    };
  },

  /**
   * Cancel an active subscription.
   *
   * @param {string} subscriptionId
   * @returns {Promise<{success: boolean, subscription: Object|null, backendAvailable: boolean}>}
   */
  cancelSubscription: async (subscriptionId) => {
    const backendAvailable = BackendHealth.isAvailable();

    if (backendAvailable) {
      // Future: const res = await api.post(`/subscription/${subscriptionId}/cancel`);
      // return res.data;
    }

    // ── Mock / localStorage path ──────────────────────────────────────
    await delay(800);

    const current = loadSubscription();
    if (!current || current.id !== subscriptionId) {
      // If nothing stored locally, treat cancel as a no-op success
      // (the subscription was already gone or never existed)
      return {
        success: true,
        subscription: null,
        backendAvailable,
      };
    }

    // Move to "free" plan
    const cancelled = {
      ...current,
      planId: "free",
      planName: "Free",
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      activeUntil: current.activeUntil,
      autoRenew: false,
    };

    saveSubscription(cancelled);

    return {
      success: true,
      subscription: cancelled,
      backendAvailable,
    };
  },

  /**
   * Read the current subscription status from localStorage.
   *
   * @returns {Object|null} The stored subscription object, or null if none exists.
   */
  getSubscriptionStatus: () => {
    const stored = loadSubscription();
    if (!stored) return null;

    // Validate: if activeUntil has passed, mark as expired
    if (stored.status === "active" && stored.activeUntil) {
      const expiry = new Date(stored.activeUntil);
      if (expiry < new Date()) {
        stored.status = "expired";
        saveSubscription(stored);
      }
    }

    return stored;
  },

  /**
   * Clear all local subscription data.
   */
  resetSubscription: () => {
    clearSubscription();
  },
};
