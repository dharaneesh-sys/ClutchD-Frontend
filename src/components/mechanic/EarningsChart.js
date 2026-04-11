"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from "../../lib/api";
import { useThemeStore } from "../../store/themeStore";
import { Loader2 } from "lucide-react";

export function EarningsChart() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  
  const primaryColor = isLight ? "#eab308" : "#10b981";

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
          <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>Earnings Overview</h2>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>This week</p>
        </div>
        <div className="text-right">
          <p className={`text-sm mb-0.5 ${isLight ? "text-slate-500" : "text-emerald-100/60"}`}>Total</p>
          <p className={`text-2xl font-bold ${isLight ? "text-yellow-600" : "text-emerald-400"}`}>₹{total}</p>
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px] w-full mt-4 flex items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center">
            <Loader2 size={32} className={`animate-spin mb-2 ${isLight ? "text-yellow-500" : "text-emerald-400"}`} />
            <span className={isLight ? "text-slate-400" : "text-white/40"}>Loading data...</span>
          </div>
        ) : data.length === 0 ? (
          <span className={isLight ? "text-slate-400" : "text-white/40"}>No earnings this week</span>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={isLight ? 0.2 : 0.3}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.05)"} vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{fill: isLight ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.4)', fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{fill: isLight ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.4)', fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#ffffff' : '#18181b', 
                  borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)', 
                  borderRadius: '8px', 
                  color: isLight ? '#0f172a' : '#fff',
                  boxShadow: isLight ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
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
