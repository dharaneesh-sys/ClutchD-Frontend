import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: {
    get: mockGet,
    post: vi.fn(),
  },
}));

import { useProductStore } from "@/store/productStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const MECHANIC = { id: "mech-1", role: "mechanic", name: "Manny" };
const GARAGE = { id: "gar-1", role: "garage", name: "Joe", garageName: "Joe Motors" };
const CUSTOMER = { id: "cus-1", role: "customer", name: "Cathy" };

const draft = {
  name: "Brake Pad Set",
  price: 1249,
  brand: "Bosch",
  category: "brakes",
  description: "Front brake pads, fits Swift 2018+",
  availability: true,
  deliveryTime: "2-3 days",
  image: "data:image/png;base64,abc",
};

function resetAll() {
  window.localStorage.clear();
  useToastStore.getState().clearToasts();
  useAuthStore.setState({ user: null });
  useProductStore.setState({
    products: [],
    sellerProducts: [],
    filters: {
      priceRange: null,
      brand: null,
      vendor: null,
      rating: null,
      availability: null,
      deliveryTime: null,
    },
    searchQuery: "",
    isLoading: false,
    error: null,
  });
}

describe("sellerProducts", () => {
  beforeEach(() => {
    resetAll();
    vi.clearAllMocks();
  });

  describe("role guard", () => {
    it("blocks customers with a toast and returns null", () => {
      useAuthStore.setState({ user: CUSTOMER });

      const result = useProductStore.getState().addSellerProduct(draft);

      expect(result).toBeNull();
      expect(useProductStore.getState().sellerProducts).toHaveLength(0);
      const errors = useToastStore.getState().toasts.filter((t) => t.type === "error");
      expect(errors.length).toBeGreaterThan(0);
    });

    it("blocks update and remove for customers", () => {
      useAuthStore.setState({ user: MECHANIC });
      const created = useProductStore.getState().addSellerProduct(draft);
      expect(created).not.toBeNull();

      useAuthStore.setState({ user: CUSTOMER });
      expect(useProductStore.getState().updateSellerProduct(created.id, { price: 1 })).toBeNull();
      expect(useProductStore.getState().removeSellerProduct(created.id)).toBe(false);
      expect(useProductStore.getState().sellerProducts).toHaveLength(1);
    });

    it("blocks unauthenticated users", () => {
      expect(useProductStore.getState().addSellerProduct(draft)).toBeNull();
    });
  });

  describe("addSellerProduct", () => {
    it("creates a ProductResponse-shaped listing for mechanics", () => {
      useAuthStore.setState({ user: MECHANIC });

      const product = useProductStore.getState().addSellerProduct(draft);

      expect(product.id).toMatch(/^seller-/);
      expect(product.name).toBe(draft.name);
      expect(product.description).toBe(draft.description);
      expect(product.price).toBe(1249);
      expect(product.rating).toBe(0);
      expect(product.vendor).toBe("Manny");
      expect(product.vendorId).toBe("mech-1");
      expect(product.isSeller).toBe(true);
      expect(typeof product.createdAt).toBe("string");
    });

    it("derives vendor from garage name for garages", () => {
      useAuthStore.setState({ user: GARAGE });

      const product = useProductStore.getState().addSellerProduct(draft);

      expect(product.vendor).toBe("Joe Motors");
      expect(product.vendorId).toBe("gar-1");
    });

    it("appears first in the marketplace products list", () => {
      useAuthStore.setState({ user: MECHANIC });

      const product = useProductStore.getState().addSellerProduct(draft);

      expect(useProductStore.getState().products[0]).toEqual(product);
      expect(useProductStore.getState().getProductById(product.id)).toEqual(product);
    });

    it("persists listings to localStorage", () => {
      useAuthStore.setState({ user: MECHANIC });

      const product = useProductStore.getState().addSellerProduct(draft);

      const raw = window.localStorage.getItem("seller-products");
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw)).toEqual([product]);
    });
  });

  describe("updateSellerProduct", () => {
    it("updates fields and toggles stock", () => {
      useAuthStore.setState({ user: MECHANIC });
      const created = useProductStore.getState().addSellerProduct(draft);

      const updated = useProductStore
        .getState()
        .updateSellerProduct(created.id, { price: 999, availability: false });

      expect(updated.price).toBe(999);
      expect(updated.availability).toBe(false);
      expect(useProductStore.getState().getProductById(created.id).availability).toBe(false);
    });

    it("returns null for another seller's listing", () => {
      useAuthStore.setState({ user: MECHANIC });
      const created = useProductStore.getState().addSellerProduct(draft);

      useAuthStore.setState({ user: GARAGE });
      expect(useProductStore.getState().updateSellerProduct(created.id, { price: 1 })).toBeNull();
    });
  });

  describe("removeSellerProduct", () => {
    it("removes the listing from store and storage", () => {
      useAuthStore.setState({ user: MECHANIC });
      const created = useProductStore.getState().addSellerProduct(draft);

      expect(useProductStore.getState().removeSellerProduct(created.id)).toBe(true);
      expect(useProductStore.getState().sellerProducts).toHaveLength(0);
      expect(useProductStore.getState().products).toHaveLength(0);
      expect(JSON.parse(window.localStorage.getItem("seller-products"))).toEqual([]);
    });
  });

  describe("getMyListings", () => {
    it("returns only the current seller's listings", () => {
      useAuthStore.setState({ user: MECHANIC });
      useProductStore.getState().addSellerProduct(draft);
      useAuthStore.setState({ user: GARAGE });
      useProductStore.getState().addSellerProduct({ ...draft, name: "Clutch Plate Kit" });

      useAuthStore.setState({ user: MECHANIC });
      const mine = useProductStore.getState().getMyListings();
      expect(mine).toHaveLength(1);
      expect(mine[0].vendorId).toBe("mech-1");
    });
  });

  describe("fetchProducts merge", () => {
    it("merges seller listings first on success", async () => {
      useAuthStore.setState({ user: MECHANIC });
      const mine = useProductStore.getState().addSellerProduct(draft);
      useProductStore.setState({ products: [] });
      mockGet.mockResolvedValueOnce({
        data: { products: [{ id: "prod-1", name: "Engine Oil" }] },
      });

      await useProductStore.getState().fetchProducts();

      const products = useProductStore.getState().products;
      expect(products[0]).toEqual(mine);
      expect(products).toHaveLength(2);
    });
  });
});
