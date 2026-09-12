import { BackendHealth } from "@/lib/backendHealth";
import api from "@/lib/api";

/**
 * Check whether a product fits a selected vehicle.
 *
 * Tries the real backend API first. Falls back to a local heuristic
 * only when the backend is unreachable.
 *
 * @param {Object} product   Full product object (must have id)
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

  const backendAvailable = BackendHealth.isAvailable();

  if (backendAvailable === true) {
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
    } catch {
      // API call failed — fall through to demo
    }
  }

  // Fallback: universal products match everything
  return {
    compatible: true,
    nonFittingParts: [],
    source: "demo",
  };
}
