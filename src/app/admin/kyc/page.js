"use client";

import { KYCApproval } from "@/components/admin/KYCApproval";

export default function KYCPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">KYC Verifications</h2>
        <p className="text-text-muted">Review and approve mechanic and garage onboarding applications.</p>
      </div>
      
      <KYCApproval />
    </div>
  );
}
