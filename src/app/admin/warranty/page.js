"use client";

import { WarrantyPanel } from "@/components/admin/WarrantyPanel";

export default function AdminWarrantyPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">
          Warranty Claims
        </h2>
        <p className="text-text-muted">
          Review and manage customer warranty claims for completed services.
        </p>
      </div>

      <WarrantyPanel />
    </div>
  );
}
