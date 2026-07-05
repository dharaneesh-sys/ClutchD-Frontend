/**
 * Admin dashboard mock data — persisted in localStorage for offline/demo mode.
 * Used when BackendHealth.isAvailable() is false or when the API returns a 503.
 */

const STATS_KEY = "clutchd_admin_mock_stats";
const DAILY_JOBS_KEY = "clutchd_admin_mock_daily_jobs";
const WEEKLY_REVENUE_KEY = "clutchd_admin_mock_weekly_revenue";
const MONTHLY_TRENDS_KEY = "clutchd_admin_mock_monthly_trends";

// ─── Initial data ───────────────────────────────────────────────────────────

const INITIAL_STATS = {
  totalUsers: 2847,
  totalJobs: 15432,
  revenue: 4823500, // in paise (₹48,235)
  activeMechanics: 186,
  totalUsersTrend: "+12.5",
  totalJobsTrend: "+8.3",
  revenueTrend: "+15.7",
  activeMechanicsTrend: "+5.2",
};

const INITIAL_DAILY_JOBS = [
  { label: "Mon", value: 28 },
  { label: "Tue", value: 35 },
  { label: "Wed", value: 42 },
  { label: "Thu", value: 31 },
  { label: "Fri", value: 48 },
  { label: "Sat", value: 56 },
  { label: "Sun", value: 22 },
];

const INITIAL_WEEKLY_REVENUE = [
  { label: "W1", value: 82500 },
  { label: "W2", value: 94000 },
  { label: "W3", value: 78500 },
  { label: "W4", value: 112000 },
  { label: "W5", value: 98500 },
];

const INITIAL_MONTHLY_TRENDS = [
  { label: "Jan", jobs: 185, revenue: 620000 },
  { label: "Feb", jobs: 220, revenue: 740000 },
  { label: "Mar", jobs: 198, revenue: 685000 },
  { label: "Apr", jobs: 265, revenue: 890000 },
  { label: "May", jobs: 242, revenue: 815000 },
  { label: "Jun", jobs: 290, revenue: 960000 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getOrInit(key, initial) {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
    localStorage.setItem(key, JSON.stringify(initial));
  } catch {
    // localStorage unavailable — return initial
  }
  return initial;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export function getMockAdminStats() {
  return getOrInit(STATS_KEY, INITIAL_STATS);
}

export function getMockDailyJobs() {
  return getOrInit(DAILY_JOBS_KEY, INITIAL_DAILY_JOBS);
}

export function getMockWeeklyRevenue() {
  return getOrInit(WEEKLY_REVENUE_KEY, INITIAL_WEEKLY_REVENUE);
}

export function getMockMonthlyTrends() {
  return getOrInit(MONTHLY_TRENDS_KEY, INITIAL_MONTHLY_TRENDS);
}

export function refreshMockAdminData() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(INITIAL_STATS));
    localStorage.setItem(DAILY_JOBS_KEY, JSON.stringify(INITIAL_DAILY_JOBS));
    localStorage.setItem(WEEKLY_REVENUE_KEY, JSON.stringify(INITIAL_WEEKLY_REVENUE));
    localStorage.setItem(MONTHLY_TRENDS_KEY, JSON.stringify(INITIAL_MONTHLY_TRENDS));
  } catch {
    // silently fail
  }
}
