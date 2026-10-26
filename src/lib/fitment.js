import { BackendHealth } from "@/lib/backendHealth";
import api from "@/lib/api";

/**
 * Check whether a product fits a selected vehicle.
 *
 * Calls the real backend fitment API. If the backend is unreachable or the
 * request fails, returns an "unavailable" result — never a fabricated match.
 *
 * @param {Object} product   Full product object (must have id)
 * @param {Object} vehicle   Selected vehicle from VehicleSelector
 * @returns {Promise<{compatible: boolean|null, nonFittingParts: string[], source: string}>}
 */
export async function checkFitment(product, vehicle) {
  if (!product || !vehicle?.make) {
    return {
      compatible: false,
      nonFittingParts: ["No vehicle selected. Please select a vehicle first."],
      source: "error",
    };
  }

  if (BackendHealth.isAvailable() === false) {
    return {
      compatible: null,
      nonFittingParts: [
        "Compatibility check unavailable. Please try again when online.",
      ],
      source: "unavailable",
    };
  }

  try {
    const { data } = await api.get(
      `/marketplace/products/${product.id}/fitment`,
      { params: { make: vehicle.make, model: vehicle.model, year: vehicle.year } },
    );
    if (data.compatible !== undefined) {
      return {
        compatible: data.compatible,
        nonFittingParts: data.non_fitting_parts ?? [],
        source: "api",
      };
    }
    return {
      compatible: null,
      nonFittingParts: [
        "Compatibility check unavailable. Please try again later.",
      ],
      source: "unavailable",
    };
  } catch {
    return {
      compatible: null,
      nonFittingParts: [
        "Compatibility check unavailable. Please try again when online.",
      ],
      source: "unavailable",
    };
  }
}
