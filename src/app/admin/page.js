"use client";

import { AdminOverview } from "@/components/admin/AdminOverview";

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">Platform Overview</h2>
        <p className="type-body-2 text-text-muted">High-level metrics and urgent actions for ClutchD.</p>
      </div>
      
      <AdminOverview />
    </div>
  );
}
