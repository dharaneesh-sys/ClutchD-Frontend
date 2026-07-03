"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from "lucide-react";

export function GarageAnalytics() {
  const getCSSVar = (name, fallback) => {
    if (typeof document === 'undefined') return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  };
  const primaryColor = getCSSVar('--primary', '#10b981');
  const barColor = getCSSVar('--primary', '#10b981');
  const tickColor = getCSSVar('--on-surface-variant', 'rgba(255,255,255,0.4)');
  const gridColor = getCSSVar('--outline-variant', 'rgba(255,255,255,0.05)');
  const tooltipBg = getCSSVar('--surface-container', '#18181b');
  const tooltipBorder = getCSSVar('--outline-variant', 'rgba(255,255,255,0.1)');
  const tooltipColor = getCSSVar('--on-surface', '#fff');
  const boxShadow = getCSSVar('--elevation-2', '0 2px 6px 2px rgba(0,0,0,0.15)');

  return (
    <GlassCard variant="strong" className="p-4 sm:p-6 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary">Garage Performance</h2>
          <p className="text-sm text-text-muted">Current Week</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 py-10 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-soft">
          <BarChart3 size={28} className="text-text-dim" />
        </div>
        <p className="text-base font-medium text-text-primary">No Analytics Yet</p>
        <p className="mt-1 max-w-xs text-sm text-text-muted">
          Complete garage jobs to see your weekly performance and revenue trends here.
        </p>
      </div>
    </GlassCard>
  );
}
