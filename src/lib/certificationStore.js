"use client";

// ─── Certification Statuses ────────────────────────────────────────────────

export const CERT_STATUSES = {
  pending: { label: "Pending", color: "warning" },
  verified: { label: "Verified", color: "success" },
  rejected: { label: "Rejected", color: "danger" },
};

// ─── Storage Key ───────────────────────────────────────────────────────────

const STORAGE_KEY = "clutchd_certifications";

// ─── Helpers ───────────────────────────────────────────────────────────────

let _cache = null;

function loadAll() {
  if (_cache) return _cache;
  if (typeof window === "undefined") return [];

  try {
    // Purge any legacy demo rows from older app versions.
    try {
      const rawNow = localStorage.getItem(STORAGE_KEY);
      if (rawNow && rawNow.includes("cert-demo-")) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("clutchd_certifications_seeded");
      }
    } catch {}

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


// TODO(BACKEND_CONTRACTS §2 certifications): wire GET /mechanic/certifications + POST /admin/certifications/{id}/verify.
