"use client";

import { BillingAdmin } from "@/components/admin/BillingAdmin";
import { BILLING_ENABLED } from "@/lib/billing";

export default function BillingPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">Rent &amp; Incentives</h2>
        <p className="type-body-2 text-text-muted">
          Set monthly garage rent and the incentive rate, confirm or waive rent. Accounting records only — no payouts.
        </p>
      </div>
      {BILLING_ENABLED ? <BillingAdmin /> : <p className="text-sm text-text-muted">Billing is not enabled in this build.</p>}
    </div>
  );
}
