"use client";

import { PayoutManager } from "@/components/admin/PayoutManager";

export default function PayoutsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">
          Payout Management
        </h2>
        <p className="type-body-2 text-text-muted">
          Configure payout schedules, view upcoming payments, and manage
          mechanic payouts.
        </p>
      </div>
      <PayoutManager />
    </div>
  );
}
