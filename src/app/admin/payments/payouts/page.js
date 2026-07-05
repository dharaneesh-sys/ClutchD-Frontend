"use client";

import { PayoutLedger } from "@/components/admin/PayoutLedger";

export default function PayoutsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">
          Payouts
        </h2>
        <p className="text-text-muted">
          View and track all mechanic and garage payouts.
        </p>
      </div>
      <PayoutLedger />
    </div>
  );
}
