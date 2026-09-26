"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { AreaChart, Area } from "@/components/charts/area-chart";
import { fetchAnalytics, fetchPendingKyc, fetchGrowthSeries } from "@/services/adminService";

export function AdminOverview() {
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [pendingKyc, setPendingKyc] = useState([]);
  // Real growth series; chart data derives from it with Date x values.
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, kycApps, growth] = await Promise.all([
        fetchAnalytics(),
        fetchPendingKyc(),
        fetchGrowthSeries().catch(() => []),
      ]);
      setStats(analyticsRes);
      setPendingKyc(kycApps);
      // The chart parses x values as Dates — month-name strings crash it
      // ("Invalid time value"). Feed real ISO dates from the backend.
      setChartData(
        growth.map((p) => ({
          date: new Date(p.date),
          month: p.month,
          revenue: Number(p.revenue) || 0,
          users: Number(p.users) || 0,
        })),
      );
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500">
        <p>{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm underline">Retry</button>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", val: stats?.totalUsers?.toLocaleString() || "0", trend: "—" },
    { label: "Active Providers", val: stats?.activeProviders?.toLocaleString() || "0", trend: "—" },
    { label: "Sellers", val: stats?.totalSellers?.toLocaleString() || "0", trend: "—" },
    { label: "Parts Listed", val: stats?.totalProducts?.toLocaleString() || "0", trend: "—" },
    { label: "Jobs Completed", val: stats?.jobsCompleted?.toLocaleString() || "0", trend: "—" },
    { label: "Platform Revenue", val: `₹${((stats?.totalRevenue || 0) / 100).toLocaleString("en-IN")}`, trend: "—" },
  ];

  const timeAgo = (submitted) => {
    if (!submitted || submitted === "—") return "—";
    const diff = Date.now() - new Date(submitted).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
         {statCards.map((stat, i) => (
           <GlassCard key={i} className="p-5">
             <p className={`text-xs uppercase tracking-wider mb-2 ${"text-text-muted"}`}>{stat.label}</p>
             <p className={`text-2xl font-bold mb-2 ${"text-text-primary"}`}>{stat.val}</p>
             <p className={`text-xs font-medium ${"text-icon-highlight"}`}>{stat.trend}</p>
           </GlassCard>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <GlassCard variant="strong" className="col-span-1 lg:col-span-2 p-6 h-[400px] flex flex-col">
            <h3 className={`font-semibold mb-6 ${"text-text-primary"}`}>Platform Growth (Revenue & Users)</h3>
              <div className="flex-1 w-full relative min-w-0 min-h-0">
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-text-muted">
                    Growth data unavailable right now.
                  </div>
                ) : (
                  <AreaChart data={chartData} xDataKey="date" className="w-full h-full">
                    <Area dataKey="revenue" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} yAxisId="left" />
                    <Area dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} yAxisId="right" />
                  </AreaChart>
                )}
              </div>
          </GlassCard>

         <GlassCard className="col-span-1 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-semibold ${"text-text-primary"}`}>Pending KYC</h3>
              <Badge variant="warning">{pendingKyc.length} Awaiting</Badge>
            </div>

            <div className="flex-1 space-y-3">
               {pendingKyc.length === 0 ? (
                 <p className={`text-sm ${"text-text-dim"}`}>No pending KYC applications.</p>
               ) : (
                 pendingKyc.slice(0, 5).map((app, i) => (
                   <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${"bg-bg-card border-border-subtle"}`}>
                      <div>
                        <p className={`text-sm font-medium ${"text-text-primary"}`}>{app.name}</p>
                        <p className={`text-[10px] ${"text-text-muted"}`}>Submitted {timeAgo(app.submitted)}</p>
                      </div>
                      <button
                        onClick={() => router.push("/admin/kyc")}
                        className={`px-3 py-1 rounded text-xs border transition-colors ${"bg-surface-soft text-icon-highlight border-border-subtle hover:bg-bg-card"}`}
                      >
                        Review
                      </button>
                   </div>
                 ))
               )}
            </div>
            <button
              onClick={() => router.push("/admin/kyc")}
              className={`w-full mt-4 py-2 text-sm transition-colors ${"text-text-muted hover:text-text-primary"}`}
            >
              View All Actions →
            </button>
         </GlassCard>
      </div>
    </div>
  );
}
