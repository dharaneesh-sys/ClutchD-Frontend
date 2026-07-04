/**
 * VIN fitment check — "Check Compatibility" on product pages.
 *
 * Flow:
 *  1. Gate the real API call behind BackendHealth.isAvailable()
 *  2. If backend is reachable → call GET /marketplace/products/{id}/fitment
 *  3. If backend is unreachable / call fails → run a client-side demo check
 *     using the product's specs.compatibility field
 */

import { BackendHealth } from "@/lib/backendHealth";
import api from "@/lib/api";

/**
 * Check whether a product fits a selected vehicle.
 *
 * @param {Object} product   Full product object (must have id and specs)
 * @param {Object} vehicle   Selected vehicle from VehicleSelector
 * @returns {Promise<{compatible: boolean, nonFittingParts: string[], source: string}>}
 */
export async function checkFitment(product, vehicle) {
  if (!product || !vehicle?.make) {
    return {
      compatible: false,
      nonFittingParts: ["No vehicle selected. Please select a vehicle first."],
      source: "error",
    };
  }

  // ── Gate: only call real API when backend is confirmed reachable ──
  const backendAvailable = BackendHealth.isAvailable();

  if (backendAvailable === true) {
    try {
      const { data } = await api.get(
        `/marketplace/products/${product.id}/fitment`,
        { params: { vehicle_id: `${vehicle.make}-${vehicle.model}` } },
      );
      return {
        compatible: data.compatible ?? true,
        nonFittingParts: data.nonFittingParts ?? [],
        source: "api",
      };
    } catch {
      // API call failed (404, 503, network, etc.) → fall through to demo
    }
  }

  // ── Demo fallback — client-side compatibility guess ──────────────
  return demoFitmentCheck(product, vehicle);
}

/**
 * Client-side compatibility check that reads the product's
 * specs.compatibility field.
 *
 * "Universal" items (e.g. floor mats, sun shades) match everything.
 * Otherwise checks if the selected make or model appears in the
 * compatibility text.
 */
function demoFitmentCheck(product, vehicle) {
  const compat = (product.specs?.compatibility || "").toLowerCase().trim();
  const make = vehicle.makeLabel?.toLowerCase().trim() || "";
  const model = vehicle.modelLabel?.toLowerCase().trim() || "";
  const vehicleLabel = `${vehicle.makeLabel} ${vehicle.modelLabel} (${vehicle.year})`;

  // ── Universal fitment ──────────────────────────────────────────────
  if (
    !compat ||
    compat.includes("universal") ||
    compat.includes("universal fit") ||
    compat.includes("all vehicles")
  ) {
    return {
      compatible: true,
      nonFittingParts: [],
      source: "demo",
    };
  }

  // ── Check make / model against the compatibility text ──────────────
  const makeFound = make && compat.includes(make);
  const modelFound = model && compat.includes(model);

  if (makeFound || modelFound) {
    return {
      compatible: true,
      nonFittingParts: [],
      source: "demo",
    };
  }

  // ── Not compatible — build a helpful message ───────────────────────
  const nonFittingParts = [`${product.name} is not verified for ${vehicleLabel}`];

  return {
    compatible: false,
    nonFittingParts,
    source: "demo",
  };
}
