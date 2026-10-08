"use client";

import { KYCApproval } from "@/components/admin/KYCApproval";

export default function KYCPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">KYC Verifications</h2>
        <p className="type-body-2 text-text-muted">Review and approve mechanic and garage onboarding applications.</p>
      </div>
      
      <KYCApproval />
    </div>
  );
}
