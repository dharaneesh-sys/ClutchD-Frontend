"use client";

import { ShieldCheck, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

/**
 * Derive the KYC status from a user object, tolerating cached profiles
 * from before the KYC feature (no kycStatus field).
 */
export function deriveKycStatus(user) {
  if (!user) return null;
  if (user.kycStatus) return user.kycStatus;
  // Legacy cache: infer from what we know
  if (user.verified) return "verified";
  if (user.aadhaarPhotoUrl || user.licensePhotoUrl) return "submitted";
  return "pending";
}

const KYC_CONFIG = {
  verified: {
    variant: "success",
    icon: ShieldCheck,
    label: "KYC Verified",
    title: "Your identity documents are verified.",
  },
  submitted: {
    variant: "warning",
    icon: Clock,
    label: "KYC Under Review",
    title: "Documents received — verification in progress.",
  },
  pending: {
    variant: "danger",
    icon: ShieldAlert,
    label: "KYC Not Submitted",
    title: "Submit your Aadhaar and license documents to get verified.",
  },
};

/**
 * Verification badge for mechanic/garage profiles.
 * Renders the real KYC state from the backend user payload —
 * never a hardcoded "Verified" label.
 */
export function KycBadge({ user, className }) {
  const status = deriveKycStatus(user);
  if (!status) return null;
  const cfg = KYC_CONFIG[status] || KYC_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span title={cfg.title} className="inline-flex">
      <Badge variant={cfg.variant} className={className}>
        <Icon size={12} className="mr-1" aria-hidden="true" />
        {cfg.label}
      </Badge>
    </span>
  );
}
