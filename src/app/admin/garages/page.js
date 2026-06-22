"use client";

import { GaragesManager } from "@/components/admin/GaragesManager";

export default function GaragesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">Garages</h2>
        <p className="text-text-muted">Manage all registered garages on the platform.</p>
      </div>
      <GaragesManager />
    </div>
  );
}
