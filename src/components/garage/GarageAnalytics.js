"use client";

import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

/** The backend has no garage analytics data yet; show that honestly. */
export function GarageAnalytics() {
  return (
    <EmptyState
      icon={BarChart3}
      title="Not available in pilot"
      description="Garage analytics will appear here once the backend reports them."
    />
  );
}
