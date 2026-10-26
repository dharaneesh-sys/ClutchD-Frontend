"use client";

import { SUBSCRIPTION_PLANS } from "@/lib/constants";

const STORAGE_KEY = "clutchd_subscription";

/**
 * Subscription service — real data only.
 *
 * The backend does not expose subscription create/cancel/status endpoints yet.
 * Until it does, paid operations fail with an explicit error instead of
 * fabricating a local subscription. The free plan remains a client-side default.
 */
export const subscriptionService = {
  /**
   * Activate a subscription.
   *
   * @param {string} planId - One of "free", "plus", "pro"
   * @returns {Promise<{success: boolean, subscription: Object|null}>}
   */
  createSubscription: async (planId) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      throw new Error(
        `Unknown plan: "${planId}". Valid plans: ${SUBSCRIPTION_PLANS.map((p) => p.id).join(", ")}`,
      );
    }

    if (plan.price === 0) {
      return {
        success: true,
        subscription: {
          id: null,
          planId: plan.id,
          planName: plan.name,
          status: "none",
          price: 0,
          period: plan.period,
          createdAt: null,
          activeUntil: null,
          autoRenew: false,
        },
      };
    }

    throw new Error(
      "Subscription billing is not available yet. Please try again once the payment service is online.",
    );
  },

  /**
   * Cancel an active subscription.
   *
   * @returns {Promise<{success: boolean, subscription: Object|null}>}
   */
  cancelSubscription: async () => {
    throw new Error(
      "Subscription cancellation is not available yet. Please try again once the payment service is online.",
    );
  },

  /**
   * Read the current subscription status.
   *
   * There is no backend subscription endpoint yet, so there is no real status
   * to return. Legacy locally-generated records are ignored.
   *
   * @returns {null}
   */
  getSubscriptionStatus: () => null,

  /**
   * Clear legacy local subscription records from older app versions.
   */
  resetSubscription: () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable — nothing to clear.
    }
  },
};
