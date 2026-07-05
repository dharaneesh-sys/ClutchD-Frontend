"use client";

import { useEffect, useRef, useCallback } from "react";
import { useOrderStore } from "@/store/orderStore";

const DEMO_STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"];
const DEMO_INTERVAL_MS = 6000;
const DEMO_START_DELAY_MS = 3000;

/**
 * Subscribe to order status transitions and optionally run a demo
 * simulation that cycles an existing order through a realistic status
 * flow: pending → confirmed → shipped → delivered.
 *
 * The actual toast + unread-badge notification lives in
 * `orderStore.updateOrderStatus()`, so this hook only needs to call
 * that method — duplicate detection and side effects are handled there.
 *
 * @param {Object}        options
 * @param {boolean}       [options.demo=false]  Start demo simulation.
 * @param {string|number} [options.demoOrderId]  Specific order to simulate.
 *        Defaults to the first order in the store.
 */
export function useOrderStatusNotifications({ demo = false, demoOrderId } = {}) {
  const demoRef = useRef(null);

  const runDemo = useCallback(() => {
    const state = useOrderStore.getState();
    const targetId =
      demoOrderId || state.orders[0]?.id;
    if (!targetId) return;

    let step = 0;
    const timers = [];

    const tick = () => {
      if (step >= DEMO_STATUS_FLOW.length) return;
      const nextStatus = DEMO_STATUS_FLOW[step];

      // Read fresh state each tick to get the latest order status
      const s = useOrderStore.getState();
      const order = s.orders.find((o) => o.id === targetId);
      if (!order) return;

      // Only advance if the order is at the expected previous status
      // (or at its current one if step === 0 — any status is fine)
      if (step === 0 || order.status === DEMO_STATUS_FLOW[step - 1]) {
        s.updateOrderStatus(targetId, nextStatus);
      }

      step++;
      if (step < DEMO_STATUS_FLOW.length) {
        const t = setTimeout(tick, DEMO_INTERVAL_MS);
        timers.push(t);
      }
    };

    const startT = setTimeout(tick, DEMO_START_DELAY_MS);
    timers.push(startT);

    return () => timers.forEach(clearTimeout);
  }, [demoOrderId]);

  useEffect(() => {
    if (!demo) return;
    const cleanup = runDemo();
    demoRef.current = cleanup;
    return () => {
      if (demoRef.current) {
        demoRef.current();
        demoRef.current = null;
      }
    };
  }, [demo, runDemo]);
}
