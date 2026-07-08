"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AreaChart, Area } from "@/components/charts/area-chart";
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export function EarningsChart() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await api.get("/providers/earnings?period=week");
        setData(res.data.earnings || []);
        setTotal(res.data.total || 0);
      } catch (e) {
        console.warn("Failed to fetch earnings", e);
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  return (
    <GlassCard variant="strong" className="p-6 h-full flex flex-col relative">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Earnings Overview</h2>
          <p className="text-sm text-text-muted">This week</p>
        </div>
        <div className="text-right">
          <p className="text-sm mb-0.5 text-text-muted">Total</p>
          <p className="text-2xl font-bold text-icon-highlight">₹{total}</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px] w-full mt-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin mb-2 text-icon-highlight" />
            <span className="text-text-dim">Loading data...</span>
          </div>
        ) : data.length === 0 ? (
          <span className="text-text-dim flex items-center justify-center h-full">No earnings this week</span>
        ) : (
          <AreaChart data={data} xDataKey="name" className="w-full h-full">
            <Area dataKey="earnings" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
          </AreaChart>
        )}
      </div>
    </GlassCard>
  );
}
