"use client";

import { MechanicsManager } from "@/components/admin/MechanicsManager";

export default function MechanicsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">Mechanics</h2>
        <p className="text-text-muted">Manage all registered mechanics on the platform.</p>
      </div>
      <MechanicsManager />
    </div>
  );
}
