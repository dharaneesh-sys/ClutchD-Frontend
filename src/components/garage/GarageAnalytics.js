"use client";

import { GlassCard } from "../ui/GlassCard";
import { useThemeStore } from "../../store/themeStore";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { name: 'Mon', revenue: 15000 },
  { name: 'Tue', revenue: 22000 },
  { name: 'Wed', revenue: 18000 },
  { name: 'Thu', revenue: 35000 },
  { name: 'Fri', revenue: 42000 },
  { name: 'Sat', revenue: 58000 },
  { name: 'Sun', revenue: 45000 },
];

const jobsData = [
  { name: 'Mon', jobs: 8 },
  { name: 'Tue', jobs: 12 },
  { name: 'Wed', jobs: 10 },
  { name: 'Thu', jobs: 18 },
  { name: 'Fri', jobs: 24 },
  { name: 'Sat', jobs: 32 },
  { name: 'Sun', jobs: 25 },
];

export function GarageAnalytics() {
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const primaryColor = isLight ? "#d4a011" : "#10b981";
  const barColor = isLight ? "#6366f1" : "#3b82f6";
  const tickColor = isLight ? 'rgba(28,25,23,0.45)' : 'rgba(255,255,255,0.4)';
  const gridColor = isLight ? 'rgba(28,25,23,0.06)' : 'rgba(255,255,255,0.05)';

  return (
    <GlassCard variant="strong" className="p-4 sm:p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-stone-900" : "text-white"}`}>Garage Performance</h2>
          <p className={`text-sm ${isLight ? "text-stone-500" : "text-emerald-100/60"}`}>Current Week</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={`p-4 rounded-xl border ${isLight ? "bg-amber-50 border-amber-200" : "bg-black/20 border-white/5"}`}>
          <p className={`text-xs uppercase tracking-wider mb-1 ${isLight ? "text-stone-500" : "text-emerald-100/60"}`}>Total Revenue</p>
          <p className={`text-3xl font-bold ${isLight ? "text-amber-700" : "text-emerald-400"}`}>₹2.35L</p>
          <p className={`text-xs mt-2 font-medium ${isLight ? "text-green-600" : "text-green-400"}`}>↑ 12% vs last week</p>
        </div>
        <div className={`p-4 rounded-xl border ${isLight ? "bg-stone-50 border-stone-200" : "bg-black/20 border-white/5"}`}>
          <p className={`text-xs uppercase tracking-wider mb-1 ${isLight ? "text-stone-500" : "text-emerald-100/60"}`}>Completed Jobs</p>
          <p className={`text-3xl font-bold ${isLight ? "text-stone-900" : "text-white"}`}>129</p>
          <p className={`text-xs mt-2 font-medium ${isLight ? "text-green-600" : "text-green-400"}`}>↑ 5% vs last week</p>
        </div>
      </div>
      
      <h3 className={`text-sm font-medium mb-4 ${isLight ? "text-stone-700" : "text-white"}`}>Revenue Trends</h3>
      <div className="flex-1 min-h-[150px] w-full mb-6 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="garageColorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={primaryColor} stopOpacity={isLight ? 0.15 : 0.3}/>
                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={{fill: tickColor, fontSize: 10}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: tickColor, fontSize: 10}} axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isLight ? '#fff' : '#18181b', 
                borderColor: isLight ? '#e7e5e4' : 'rgba(255,255,255,0.1)',
                borderRadius: '10px', 
                color: isLight ? '#1c1917' : '#fff',
                boxShadow: isLight ? '0 8px 30px rgba(0,0,0,0.08)' : 'none'
              }}
              itemStyle={{ color: primaryColor }}
            />
            <Area type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#garageColorRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <h3 className={`text-sm font-medium mb-4 ${isLight ? "text-stone-700" : "text-white"}`}>Daily Job Volume</h3>
      <div className="flex-1 min-h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={jobsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="name" tick={{fill: tickColor, fontSize: 10}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: tickColor, fontSize: 10}} axisLine={false} tickLine={false} />
            <Tooltip 
              cursor={{fill: isLight ? 'rgba(28,25,23,0.03)' : 'rgba(255,255,255,0.05)'}}
              contentStyle={{ 
                backgroundColor: isLight ? '#fff' : '#18181b', 
                borderColor: isLight ? '#e7e5e4' : 'rgba(255,255,255,0.1)', 
                borderRadius: '10px', 
                color: isLight ? '#1c1917' : '#fff',
                boxShadow: isLight ? '0 8px 30px rgba(0,0,0,0.08)' : 'none'
              }}
              itemStyle={{ color: barColor }}
            />
            <Bar dataKey="jobs" fill={barColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
