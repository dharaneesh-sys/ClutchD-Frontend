"use client";

// ─── Certification Statuses ────────────────────────────────────────────────

export const CERT_STATUSES = {
  pending: { label: "Pending", color: "warning" },
  verified: { label: "Verified", color: "success" },
  rejected: { label: "Rejected", color: "danger" },
};

// ─── Storage Key ───────────────────────────────────────────────────────────

const STORAGE_KEY = "clutchd_certifications";
const SEED_FLAG_KEY = "clutchd_certifications_seeded";

// ─── Seed Data ─────────────────────────────────────────────────────────────

const SEED_CERTIFICATIONS = [
  {
    id: "cert-demo-1",
    mechanicId: "mech-1",
    mechanicName: "Rajesh M.",
    badgeName: "ASE Master Technician",
    issuer: "National Institute for Automotive Service Excellence",
    documentType: "Certificate",
    documentUrl: null,
    status: "pending",
    submittedAt: "2026-06-20T09:30:00Z",
    reviewedAt: null,
    adminNotes: "",
  },
  {
    id: "cert-demo-2",
    mechanicId: "mech-1",
    mechanicName: "Rajesh M.",
    badgeName: "Advanced Engine Diagnostics",
    issuer: "Bosch Automotive Training",
    documentType: "Training Completion",
    documentUrl: null,
    status: "pending",
    submittedAt: "2026-06-22T14:00:00Z",
    reviewedAt: null,
    adminNotes: "",
  },
  {
    id: "cert-demo-3",
    mechanicId: "mech-2",
    mechanicName: "Suresh K.",
    badgeName: "Tire & Suspension Specialist",
    issuer: "Continental Automotive",
    documentType: "Certificate",
    documentUrl: null,
    status: "verified",
    submittedAt: "2026-06-15T11:00:00Z",
    reviewedAt: "2026-06-18T10:00:00Z",
    adminNotes: "Documents verified — matches our records.",
  },
  {
    id: "cert-demo-4",
    mechanicId: "mech-2",
    mechanicName: "Suresh K.",
    badgeName: "Brake Systems Expert",
    issuer: "Brembo Academy",
    documentType: "License",
    documentUrl: null,
    status: "pending",
    submittedAt: "2026-06-25T08:45:00Z",
    reviewedAt: null,
    adminNotes: "",
  },
  {
    id: "cert-demo-5",
    mechanicId: "mech-3",
    mechanicName: "Dinesh R.",
    badgeName: "HVAC & AC Systems Certification",
    issuer: "Denso Technical Institute",
    documentType: "Certificate",
    documentUrl: null,
    status: "verified",
    submittedAt: "2026-06-10T16:20:00Z",
    reviewedAt: "2026-06-12T09:15:00Z",
    adminNotes: "Approved.",
  },
  {
    id: "cert-demo-6",
    mechanicId: "mech-3",
    mechanicName: "Dinesh R.",
    badgeName: "Battery & Electrical Systems",
    issuer: "Exide Training Center",
    documentType: "Training Completion",
    documentUrl: null,
    status: "rejected",
    submittedAt: "2026-06-23T10:00:00Z",
    reviewedAt: "2026-06-26T14:30:00Z",
    adminNotes: "Document illegible — please resubmit a clearer copy.",
  },
  {
    id: "cert-demo-7",
    mechanicId: "mech-4",
    mechanicName: "Vijay M.",
    badgeName: "Transmission Rebuild Specialist",
    issuer: "ZF Services",
    documentType: "Certificate",
    documentUrl: null,
    status: "pending",
    submittedAt: "2026-06-27T12:10:00Z",
    reviewedAt: null,
    adminNotes: "",
  },
  {
    id: "cert-demo-8",
    mechanicId: "mech-5",
    mechanicName: "Karthik S.",
    badgeName: "Collision Repair & Bodywork",
    issuer: "3M Automotive Aftermarket",
    documentType: "Certificate",
    documentUrl: null,
    status: "pending",
    submittedAt: "2026-06-28T09:30:00Z",
    reviewedAt: null,
    adminNotes: "",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

let _cache = null;

function loadAll() {
  if (_cache) return _cache;
  if (typeof window === "undefined") return [];

  try {
    // Seed data on first load
    const alreadySeeded = localStorage.getItem(SEED_FLAG_KEY);
    if (!alreadySeeded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CERTIFICATIONS));
      localStorage.setItem(SEED_FLAG_KEY, "true");
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    _cache = raw ? JSON.parse(raw) : [];
  } catch {
    _cache = [];
  }
  return _cache;
}

function persist(certifications) {
  _cache = certifications;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(certifications));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }
}

function generateId() {
  return `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const CertificationStore = {
  /** Get all certifications (admin). */
  getAll: () => {
    return loadAll();
  },

  /** Get certifications for a specific mechanic. */
  getByMechanicId: (mechanicId) => {
    return loadAll().filter((c) => c.mechanicId === mechanicId);
  },

  /** Get a single certification by id. */
  getById: (id) => {
    return loadAll().find((c) => c.id === id) || null;
  },

  /**
   * Update certification status (admin approve/reject).
   * Returns the updated certification or null if not found.
   */
  updateStatus: (certId, status, adminNotes = "") => {
    const certs = loadAll();
    const idx = certs.findIndex((c) => c.id === certId);
    if (idx === -1) return null;

    certs[idx] = {
      ...certs[idx],
      status,
      adminNotes: adminNotes || certs[idx].adminNotes,
      reviewedAt: new Date().toISOString(),
    };
    persist(certs);
    return certs[idx];
  },
};
