// Partner billing is built behind a build-time flag (default off) so the
// screens only ship once the backend has BILLING_ENABLED and is migrated.
export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/** Integer paise → "₹499.00"; "—" for anything that is not a real number. */
export function rupees(paise) {
  const n = Number(paise);
  return paise === null || paise === undefined || !Number.isFinite(n) ? "—" : `₹${(n / 100).toFixed(2)}`;
}

/** 500 bps → "5%". */
export function pct(bps) {
  const n = Number(bps);
  return Number.isFinite(n) ? `${+(n / 100).toFixed(2)}%` : "—";
}

export const INVOICE_STATUS = {
  issued: { label: "Due", tone: "pending" },
  overdue: { label: "Overdue", tone: "danger" },
  payment_pending: { label: "Awaiting confirmation", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  waived: { label: "Waived", tone: "neutral" },
};

export const ONBOARDING_LABELS = {
  profile: "Profile",
  garage_details: "Garage details",
  services: "Services",
  location: "Location",
  kyc_review: "KYC review",
  done: "Done",
};
export const ONBOARDING_STEPS = Object.keys(ONBOARDING_LABELS);
