"use client";

import { BackendHealth } from "@/lib/backendHealth";

const STORAGE_KEY = "clutchd_warranty_claims";

// ─── Claim Statuses ────────────────────────────────────────────────────────

export const CLAIM_STATUSES = {
  submitted: { label: "Submitted", color: "info" },
  under_review: { label: "Under Review", color: "warning" },
  approved: { label: "Approved", color: "success" },
  rejected: { label: "Rejected", color: "danger" },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

let _claimsCache = null;

function loadAll() {
  if (_claimsCache) return _claimsCache;
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _claimsCache = raw ? JSON.parse(raw) : [];
  } catch {
    _claimsCache = [];
  }
  return _claimsCache;
}

function persist(claims) {
  _claimsCache = claims;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }
}

function generateId() {
  return `wc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const WarrantyClaimsStore = {
  /** Get all claims for a given user. */
  getUserClaims: (userId) => {
    return loadAll().filter((c) => c.userId === userId);
  },

  /** Get a single claim by id. */
  getById: (id) => {
    return loadAll().find((c) => c.id === id) || null;
  },

  /** Get all claims (admin). */
  getAll: () => {
    return loadAll();
  },

  /**
   * Submit a new warranty claim.
   * Falls back to localStorage when backend is unavailable.
   */
  submit: ({ userId, userName, serviceId, serviceType, issueTag, description, photos = [] }) => {
    const serviceLabel = (() => {
      const labels = {
        flat_tire: "Flat Tire", engine_failure: "Engine Failure",
        battery_dead: "Dead Battery", overheating: "Overheating",
        brake_issue: "Brake Issue", oil_leak: "Oil Leak",
        electrical: "Electrical Problem", ac_not_working: "AC Not Working",
        transmission: "Transmission Issue", starting_issue: "Won't Start",
        noise: "Strange Noise", other: "Other",
      };
      return labels[issueTag] || issueTag || serviceType || "Service";
    })();

    const claim = {
      id: generateId(),
      userId,
      userName: userName || "Unknown",
      serviceId,
      serviceType: serviceType || "general",
      issueTag: issueTag || "other",
      serviceLabel,
      description,
      photos,
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNotes: "",
    };

    if (BackendHealth.isAvailable()) {
      // Backend is alive — POST to API
      // Using best-effort approach: try API, fall back to localStorage on failure
      const tryApi = async () => {
        try {
          const api = (await import("@/lib/api")).default;
          await api.post("/warranty/claims", claim);
        } catch {
          persist([...loadAll(), claim]);
        }
      };
      tryApi();
    }

    // Always persist locally for demo mode / offline resilience
    persist([...loadAll(), claim]);
    return claim;
  },

  /**
   * Update claim status (admin).
   */
  updateStatus: (claimId, status, adminNotes = "") => {
    const claims = loadAll();
    const idx = claims.findIndex((c) => c.id === claimId);
    if (idx === -1) return null;

    claims[idx] = {
      ...claims[idx],
      status,
      adminNotes: adminNotes || claims[idx].adminNotes,
      updatedAt: new Date().toISOString(),
    };
    persist(claims);
    return claims[idx];
  },
};
