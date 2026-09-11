import { create } from "zustand";
import { persist } from "zustand/middleware";
import { subscriptionService } from "@/lib/payment/subscriptionService";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

/**
 * Subscription store — manages the user's subscription plan state.
 *
 * On initialisation (hydration), it reads persisted subscription data
 * and also syncs from the subscription service's localStorage (the
 * service owns the source-of-truth for demo mode). This keeps the
 * store and the service in agreement.
 */
export const useSubscriptionStore = create(
  persist(
    (set, get) => ({
      /** Current plan id — "free", "plus", or "pro" */
      planId: "free",
      /** Subscription status — "active", "cancelled", "expired", or "none" */
      status: "none",
      /** ISO date string when the current subscription period ends */
      activeUntil: null,
      /** Subscription id from the service (null for free/no subscription) */
      subscriptionId: null,
      /** True while an async subscribe/cancel operation is in flight */
      isSubscribing: false,
      /** True while a cancel operation is in flight */
      isCancelling: false,
      /** Last backend availability snapshot from the last operation */
      backendAvailable: true,
      /** Error message from the last failed operation */
      error: null,

      /**
       * Hydrate from the subscription service's persisted data.
       * Call this on app startup (e.g. in AuthInit or a layout effect).
       */
      hydrateFromService: () => {
        const stored = subscriptionService.getSubscriptionStatus();
        if (stored) {
          set({
            planId: stored.planId || "free",
            status: stored.status || "active",
            activeUntil: stored.activeUntil || null,
            subscriptionId: stored.id || null,
          });
        } else {
          // No stored subscription — default to free
          set({ planId: "free", status: "none", activeUntil: null, subscriptionId: null });
        }
      },

      /**
       * Subscribe to a new plan.
       *
       * @param {string} planId - "plus" or "pro"
       * @returns {Promise<boolean>} true on success
       */
      subscribe: async (planId) => {
        set({ isSubscribing: true, error: null });

        try {
          const result = await subscriptionService.createSubscription(planId);

          if (result.success) {
            const sub = result.subscription;
            set({
              planId: sub.planId,
              status: sub.status,
              activeUntil: sub.activeUntil,
              subscriptionId: sub.id,
              isSubscribing: false,
              backendAvailable: result.backendAvailable,
              error: null,
            });
            return true;
          }

          set({ isSubscribing: false, error: "Subscription failed. Please try again." });
          return false;
        } catch (err) {
          set({
            isSubscribing: false,
            error: err.message || "An unexpected error occurred.",
          });
          return false;
        }
      },

      /**
       * Cancel the current subscription (reverts to Free plan).
       *
       * @returns {Promise<boolean>} true on success
       */
      cancel: async () => {
        const { subscriptionId } = get();
        if (!subscriptionId) {
          // No active subscription to cancel — just reset to free
          set({ planId: "free", status: "none", activeUntil: null, subscriptionId: null });
          return true;
        }

        set({ isCancelling: true, error: null });

        try {
          const result = await subscriptionService.cancelSubscription(subscriptionId);

          if (result.success) {
            set({
              planId: "free",
              status: "cancelled",
              activeUntil: null,
              subscriptionId: null,
              isCancelling: false,
              backendAvailable: result.backendAvailable,
              error: null,
            });
            return true;
          }

          set({ isCancelling: false, error: "Failed to cancel subscription." });
          return false;
        } catch (err) {
          set({
            isCancelling: false,
            error: err.message || "An unexpected error occurred.",
          });
          return false;
        }
      },

      /**
       * Snapshot whether the current plan is a paid tier.
       */
      isPaidUser: () => {
        const { planId } = get();
        return planId === "plus" || planId === "pro";
      },

      /**
       * Snapshot whether the current plan is Pro.
       */
      isProUser: () => {
        const { planId } = get();
        return planId === "pro";
      },

      /**
       * Get the current plan definition from SUBSCRIPTION_PLANS.
       */
      currentPlan: () => {
        const { planId } = get();
        return SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[0];
      },

      /**
       * Clear subscription state (logout).
       */
      clear: () => {
        subscriptionService.resetSubscription();
        set({
          planId: "free",
          status: "none",
          activeUntil: null,
          subscriptionId: null,
          isSubscribing: false,
          isCancelling: false,
          error: null,
        });
      },
    }),
    {
      name: "clutchd-subscription-store",
      partialize: (state) => ({
        planId: state.planId,
        status: state.status,
        activeUntil: state.activeUntil,
        subscriptionId: state.subscriptionId,
      }),
    }
  )
);


// TODO(BACKEND_CONTRACTS §2 subscriptions): wire POST /subscriptions/create|/cancel + GET /subscriptions/status via subscriptionService.
