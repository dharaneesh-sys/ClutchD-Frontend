"use client";

import { GlassCard } from "../ui/GlassCard";
import { Badge } from "../ui/Badge";
import { useThemeStore } from "../../store/themeStore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, users: 240 },
  { name: 'Feb', revenue: 3000, users: 139 },
  { name: 'Mar', revenue: 2000, users: 980 },
  { name: 'Apr', revenue: 2780, users: 390 },
  { name: 'May', revenue: 1890, users: 480 },
  { name: 'Jun', revenue: 2390, users: 380 },
  { name: 'Jul', revenue: 3490, users: 430 },
];

export function AdminOverview() {
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const primaryColor = isLight ? "#d4a011" : "#10b981";
  const tickColor = isLight ? 'rgba(28,25,23,0.45)' : 'rgba(255,255,255,0.4)';
  const gridColor = isLight ? 'rgba(28,25,23,0.06)' : 'rgba(255,255,255,0.05)';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
         {[
           { label: "Total Users", val: "12,485", trend: "+12%" },
           { label: "Active Providers", val: "842", trend: "+5%" },
           { label: "Jobs Completed", val: "48,392", trend: "+18%" },
           { label: "Platform Revenue", val: "₹1.4Cr", trend: "+24%" },
         ].map((stat, i) => (
           <GlassCard key={i} className="p-5">
             <p className={`text-xs uppercase tracking-wider mb-2 ${isLight ? "text-stone-500" : "text-white/50"}`}>{stat.label}</p>
             <p className={`text-2xl font-bold mb-2 ${isLight ? "text-stone-900" : "text-white"}`}>{stat.val}</p>
             <p className={`text-xs font-medium ${isLight ? "text-green-600" : "text-emerald-400"}`}>{stat.trend} from last month</p>
           </GlassCard>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <GlassCard variant="strong" className="col-span-1 lg:col-span-2 p-6 h-[400px] flex flex-col">
            <h3 className={`font-semibold mb-6 ${isLight ? "text-stone-900" : "text-white"}`}>Platform Growth (Revenue & Users)</h3>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="adminColorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={isLight ? 0.15 : 0.3}/>
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="adminColorUsr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={isLight ? 0.15 : 0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{fill: tickColor, fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{fill: tickColor, fontSize: 12}} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{fill: tickColor, fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip 
                     contentStyle={{ 
                       backgroundColor: isLight ? '#fff' : '#18181b', 
                       borderColor: isLight ? '#e7e5e4' : 'rgba(255,255,255,0.1)', 
                       borderRadius: '10px', 
                       color: isLight ? '#1c1917' : '#fff',
                       boxShadow: isLight ? '0 8px 30px rgba(0,0,0,0.08)' : 'none'
                     }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke={primaryColor} fillOpacity={1} fill="url(#adminColorRev)" />
                  <Area yAxisId="right" type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#adminColorUsr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </GlassCard>

         <GlassCard className="col-span-1 p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-semibold ${isLight ? "text-stone-900" : "text-white"}`}>Pending KYC</h3>
              <Badge variant="warning">3 Awaiting</Badge>
            </div>
            
            <div className="flex-1 space-y-3">
               {["Raju Mechanic", "Speedy Garage", "Vikram Motors"].map((name, i) => (
                 <div key={i} className={`p-3 rounded-xl border flex items-center justify-between ${isLight ? "bg-stone-50 border-stone-200" : "bg-white/5 border-white/5"}`}>
                    <div>
                      <p className={`text-sm font-medium ${isLight ? "text-stone-800" : "text-white"}`}>{name}</p>
                      <p className={`text-[10px] ${isLight ? "text-stone-400" : "text-white/50"}`}>Submitted 2 hours ago</p>
                    </div>
                    <button className={`px-3 py-1 rounded text-xs border transition-colors ${isLight ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"}`}>
                      Review
                    </button>
                 </div>
               ))}
            </div>
            <button className={`w-full mt-4 py-2 text-sm transition-colors ${isLight ? "text-stone-400 hover:text-stone-600" : "text-white/50 hover:text-white"}`}>View All Actions →</button>
         </GlassCard>
      </div>
    </div>
  );
}
