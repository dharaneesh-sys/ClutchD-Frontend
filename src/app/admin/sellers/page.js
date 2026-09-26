"use client";

import { SellersManager } from "@/components/admin/SellersManager";

export default function SellersPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">Sellers</h2>
        <p className="text-text-muted">Manage all registered parts sellers on the platform.</p>
      </div>
      <SellersManager />
    </div>
  );
}
