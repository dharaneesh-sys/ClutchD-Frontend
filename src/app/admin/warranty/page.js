"use client";

import { WarrantyPanel } from "@/components/admin/WarrantyPanel";

export default function AdminWarrantyPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">
          Warranty Claims
        </h2>
        <p className="type-body-2 text-text-muted">
          Review and manage customer warranty claims for completed services.
        </p>
      </div>

      <WarrantyPanel />
    </div>
  );
}
