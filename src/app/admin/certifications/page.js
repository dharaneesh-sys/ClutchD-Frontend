"use client";

import { CertificationPanel } from "@/components/admin/CertificationPanel";

export default function AdminCertificationsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="type-headline-3 mb-2 text-text-primary">
          Certifications
        </h2>
        <p className="type-body-2 text-text-muted">
          Review and verify mechanic certification documents and badges.
        </p>
      </div>

      <CertificationPanel />
    </div>
  );
}
