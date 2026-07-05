"use client";

import { CertificationPanel } from "@/components/admin/CertificationPanel";

export default function AdminCertificationsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-text-primary">
          Certifications
        </h2>
        <p className="text-text-muted">
          Review and verify mechanic certification documents and badges.
        </p>
      </div>

      <CertificationPanel />
    </div>
  );
}
