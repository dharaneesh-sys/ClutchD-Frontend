"use client";

import { PaymentsManager } from "@/components/admin/PaymentsManager";

export default function PaymentsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">Payments</h2>
        <p className="type-body-2 text-text-muted">View and manage all financial transactions.</p>
      </div>
      <PaymentsManager />
    </div>
  );
}
