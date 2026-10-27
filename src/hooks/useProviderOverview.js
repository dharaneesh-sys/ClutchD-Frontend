"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";

const HISTORY_LIMIT = 100; // backend max per page

/** UTC calendar date (the earnings endpoint groups by DB date). */
const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * One fetch round per dashboard for the partner home: earnings (week),
 * active jobs and history. Every value is real or null (rendered as "—").
 */
export function useProviderOverview() {
  const [state, setState] = useState({
    loading: true,
    earnings: null, // { data: [{name, earnings, date}], total }
    activeJobs: null, // []
    history: null, // []
    errors: {},
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const [e, a, h] = await Promise.allSettled([
      api.get("/providers/earnings", { params: { period: "week" } }),
      api.get("/jobs/incoming"),
      api.get("/jobs/history", { params: { limit: HISTORY_LIMIT } }),
    ]);
    setState({
      loading: false,
      earnings:
        e.status === "fulfilled"
          ? { data: Array.isArray(e.value.data?.earnings) ? e.value.data.earnings : [], total: e.value.data?.total ?? null }
          : null,
      activeJobs: a.status === "fulfilled" ? a.value.data?.jobs ?? [] : null,
      history: h.status === "fulfilled" ? h.value.data?.jobs ?? [] : null,
      errors: {
        earnings: e.status === "rejected",
        activeJobs: a.status === "rejected",
        history: h.status === "rejected",
      },
    });
  }, []);

  useEffect(() => {
    // Deferred like the dashboards' other bootstrap effects (React 19 #185).
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, [load]);

  return { ...state, reload: load, ...deriveStats(state) };
}

export function deriveStats({ earnings, activeJobs, history }) {
  let todayEarnings = null;
  if (earnings) {
    const entry = earnings.data.find((d) => d.date === todayKey());
    todayEarnings = entry ? Number(entry.earnings) : 0; // fetched and nothing today = real 0
  }
  let completedCount = null;
  let completedCapped = false;
  if (history) {
    completedCount = history.filter((j) => j.status === "completed").length;
    completedCapped = history.length >= HISTORY_LIMIT;
  }
  const activeCount = activeJobs ? activeJobs.length : null;
  return { todayEarnings, completedCount, completedCapped, activeCount };
}
