import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockPatch = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: {
    get: mockGet,
    post: mockPost,
    patch: mockPatch,
    delete: mockDelete,
  },
}));

import { useProductStore } from "@/store/productStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const SELLER = { id: "sel-1", role: "seller", name: "Parts Bazaar", storeName: "Parts Bazaar" };
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
  image: "/static/uploads/pad.png",
};

const backendProduct = {
  id: "prod-1",
  name: draft.name,
  description: draft.description,
  brand: draft.brand,
  vendor: "Parts Bazaar",
  vendorId: "11111111-1111-1111-1111-111111111111",
  price: 1249,
  rating: 0,
  image: draft.image,
  category: draft.category,
  availability: true,
  deliveryTime: "2-3 days",
  createdAt: "2026-09-13T00:00:00Z",
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

function err(status, detail) {
  const e = new Error(detail || "error");
  e.response = { status, data: { detail } };
  return e;
}

describe("sellerProducts (backend-backed)", () => {
  beforeEach(() => {
    resetAll();
    vi.clearAllMocks();
  });

  describe("role guard", () => {
    it("blocks customers with a toast and returns null", async () => {
      useAuthStore.setState({ user: CUSTOMER });

      const result = await useProductStore.getState().addSellerProduct(draft);

      expect(result).toBeNull();
      expect(mockPost).not.toHaveBeenCalled();
      expect(useProductStore.getState().sellerProducts).toHaveLength(0);
      const errors = useToastStore.getState().toasts.filter((t) => t.type === "error");
      expect(errors.length).toBeGreaterThan(0);
    });

    it("blocks unauthenticated users", async () => {
      await expect(useProductStore.getState().addSellerProduct(draft)).resolves.toBeNull();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("allows the dedicated seller role", async () => {
      useAuthStore.setState({ user: SELLER });
      mockPost.mockResolvedValueOnce({ data: backendProduct });

      const created = await useProductStore.getState().addSellerProduct(draft);

      expect(created.id).toBe(backendProduct.id);
      expect(mockPost).toHaveBeenCalledWith("/products", expect.objectContaining({ name: draft.name, price: 1249 }));
    });
  });

  describe("addSellerProduct", () => {
    it("posts to the backend and lists immediately for sellers", async () => {
      useAuthStore.setState({ user: SELLER });
      mockPost.mockResolvedValueOnce({ data: backendProduct });

      const product = await useProductStore.getState().addSellerProduct(draft);

      expect(product.isSeller).toBe(true);
      expect(useProductStore.getState().sellerProducts[0]).toEqual(product);
      expect(useProductStore.getState().products[0]).toEqual(product);
      expect(useProductStore.getState().getProductById(product.id)).toEqual(product);
    });

    it("blocks legacy mechanic and garage roles from selling", async () => {
      useAuthStore.setState({ user: MECHANIC });
      await expect(useProductStore.getState().addSellerProduct(draft)).resolves.toBeNull();
      expect(mockPost).not.toHaveBeenCalled();

      useAuthStore.setState({ user: GARAGE });
      await expect(useProductStore.getState().addSellerProduct(draft)).resolves.toBeNull();
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("shows a backend error and does not list when the API rejects", async () => {
      useAuthStore.setState({ user: SELLER });
      mockPost.mockRejectedValueOnce(err(422, "Unknown category"));

      const product = await useProductStore.getState().addSellerProduct(draft);

      expect(product).toBeNull();
      expect(useProductStore.getState().sellerProducts).toHaveLength(0);
      const errors = useToastStore.getState().toasts.filter((t) => t.type === "error");
      expect(errors.some((t) => String(t.message).includes("Unknown category"))).toBe(true);
    });

    it("falls back to a local-only listing when the server is unreachable", async () => {
      useAuthStore.setState({ user: SELLER });
      mockPost.mockRejectedValueOnce(new Error("Network Error"));

      const product = await useProductStore.getState().addSellerProduct(draft);

      expect(product.localOnly).toBe(true);
      expect(useProductStore.getState().sellerProducts).toHaveLength(1);
      expect(JSON.parse(window.localStorage.getItem("seller-products"))).toHaveLength(1);
    });
  });

  describe("updateSellerProduct", () => {
    it("patches the backend and updates the store", async () => {
      useAuthStore.setState({ user: SELLER });
      useProductStore.setState({ sellerProducts: [backendProduct] });
      mockPatch.mockResolvedValueOnce({ data: { ...backendProduct, price: 999 } });

      const updated = await useProductStore.getState().updateSellerProduct(backendProduct.id, { price: 999 });

      expect(updated.price).toBe(999);
      expect(mockPatch).toHaveBeenCalledWith(`/products/${backendProduct.id}`, { price: 999 });
      expect(useProductStore.getState().getProductById(backendProduct.id).price).toBe(999);
    });

    it("rejects a cached row owned by another user before calling the API", async () => {
      useAuthStore.setState({ user: SELLER });
      useProductStore.setState({
        sellerProducts: [{ ...backendProduct, sellerUserId: "someone-else" }],
      });

      const updated = await useProductStore.getState().updateSellerProduct(backendProduct.id, { price: 1 });

      expect(updated).toBeNull();
      expect(mockPatch).not.toHaveBeenCalled();
    });

    it("updates localOnly listings without calling the API", async () => {
      useAuthStore.setState({ user: SELLER });
      const local = { ...backendProduct, id: "seller-123", localOnly: true };
      useProductStore.setState({ sellerProducts: [local] });

      const updated = await useProductStore.getState().updateSellerProduct(local.id, { price: 5 });

      expect(updated.price).toBe(5);
      expect(mockPatch).not.toHaveBeenCalled();
    });
  });

  describe("removeSellerProduct", () => {
    it("deletes via the API and removes from store + storage", async () => {
      useAuthStore.setState({ user: SELLER });
      useProductStore.setState({ sellerProducts: [backendProduct], products: [backendProduct] });
      mockDelete.mockResolvedValueOnce({ data: undefined });

      const ok = await useProductStore.getState().removeSellerProduct(backendProduct.id);

      expect(ok).toBe(true);
      expect(mockDelete).toHaveBeenCalledWith(`/products/${backendProduct.id}`);
      expect(useProductStore.getState().sellerProducts).toHaveLength(0);
      expect(useProductStore.getState().products).toHaveLength(0);
    });

    it("removes localOnly listings without the API", async () => {
      useAuthStore.setState({ user: SELLER });
      const local = { ...backendProduct, id: "seller-9", localOnly: true };
      useProductStore.setState({ sellerProducts: [local] });

      const ok = await useProductStore.getState().removeSellerProduct(local.id);

      expect(ok).toBe(true);
      expect(mockDelete).not.toHaveBeenCalled();
      expect(useProductStore.getState().sellerProducts).toHaveLength(0);
    });
  });

  describe("getMyListings / fetchMyListings", () => {
    it("returns cached listings plus localOnly entries", () => {
      useAuthStore.setState({ user: SELLER });
      useProductStore.setState({
        sellerProducts: [backendProduct, { ...backendProduct, id: "seller-77", localOnly: true }],
      });

      const mine = useProductStore.getState().getMyListings();
      expect(mine).toHaveLength(2);
      expect(mine.some((p) => p.localOnly)).toBe(true);
    });

    it("fetches listings from the backend", async () => {
      useAuthStore.setState({ user: SELLER });
      mockGet.mockResolvedValueOnce({ data: { products: [backendProduct] } });

      const listings = await useProductStore.getState().fetchMyListings();

      expect(mockGet).toHaveBeenCalledWith("/products/my-listings");
      expect(listings).toHaveLength(1);
      expect(useProductStore.getState().sellerProducts).toHaveLength(1);
      expect(JSON.parse(window.localStorage.getItem("seller-products"))).toHaveLength(1);
    });
  });

  describe("fetchProducts merge", () => {
    it("merges seller listings first on success", async () => {
      useAuthStore.setState({ user: SELLER });
      useProductStore.setState({ sellerProducts: [backendProduct] });
      mockGet.mockResolvedValueOnce({
        data: { products: [{ id: "prod-9", name: "Engine Oil" }] },
      });

      await useProductStore.getState().fetchProducts();

      const products = useProductStore.getState().products;
      expect(products[0].id).toBe(backendProduct.id);
      expect(products).toHaveLength(2);
    });
  });
});
