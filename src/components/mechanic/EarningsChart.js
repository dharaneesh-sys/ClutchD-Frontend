"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "@/lib/api";
import { Loader2 } from "lucide-react";

export function EarningsChart() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const getCSSVar = (name, fallback) => {
    if (typeof document === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  };
  
  const primaryColor = getCSSVar('--primary', '#10b981');
  const tickColor = getCSSVar('--on-surface-variant', 'rgba(255,255,255,0.4)');
  const gridColor = getCSSVar('--outline-variant', 'rgba(255,255,255,0.05)');
  const tooltipBg = getCSSVar('--surface-container', '#18181b');
  const tooltipBorder = getCSSVar('--outline-variant', 'rgba(255,255,255,0.1)');
  const tooltipColor = getCSSVar('--on-surface', '#fff');
  const boxShadow = getCSSVar('--elevation-2', '0 2px 6px 2px rgba(0,0,0,0.15)');

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
      
      <div className="flex-1 min-h-[200px] w-full mt-4 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 size={32} className="animate-spin mb-2 text-icon-highlight" />
            <span className="text-text-dim">Loading data...</span>
          </div>
        ) : data.length === 0 ? (
          <span className="text-text-dim">No earnings this week</span>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{fill: tickColor, fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{fill: tickColor, fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '8px', 
                  color: tooltipColor,
                  boxShadow: boxShadow,
                }}
                itemStyle={{ color: primaryColor }}
                formatter={(value) => [`₹${value}`, 'Earnings']}
              />
              <Area 
                type="monotone" 
                dataKey="earnings" 
                stroke={primaryColor} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}
