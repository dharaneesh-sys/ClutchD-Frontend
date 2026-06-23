import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.mock is hoisted above imports, so use vi.hoisted()
// ---------------------------------------------------------------------------
const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  default: {
    get: mockGet,
    post: mockPost,
  },
}));

// ---------------------------------------------------------------------------
// Import stores AFTER mocks (vi.mock hoists them)
// ---------------------------------------------------------------------------
import { useProductStore } from "@/store/productStore";
import { useCartStore } from "@/store/cartStore";
import { useOrderStore } from "@/store/orderStore";
import { useCategoryStore } from "@/store/categoryStore";

// ---------------------------------------------------------------------------
// Helpers: reset each store to its initial state
// ---------------------------------------------------------------------------
function resetProductStore() {
  useProductStore.setState({
    products: [],
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

function resetCartStore() {
  useCartStore.setState({
    items: [],
    couponCode: "",
    discount: 0,
    isLoading: false,
  });
}

function resetOrderStore() {
  useOrderStore.setState({
    orders: [],
    activeOrder: null,
    isLoading: false,
    error: null,
  });
}

function resetCategoryStore() {
  useCategoryStore.setState({
    categories: [],
    selectedCategory: null,
    isLoading: false,
  });
}

// ---------------------------------------------------------------------------
// Sample data helpers
// ---------------------------------------------------------------------------
const sampleProduct = {
  id: "prod-1",
  name: "Engine Oil 5W-30 (4L)",
  brand: "Shell",
  vendorId: "v-1",
  vendor: "Auto Parts Co.",
  price: 2199,
  rating: 4.5,
  image: "/images/products/engine-oil.jpg",
  category: "fluids",
  availability: true,
  deliveryTime: "2-3 days",
};

const sampleProduct2 = {
  id: "prod-2",
  name: "Brake Pad Set (Front)",
  brand: "Bosch",
  vendorId: "v-2",
  vendor: "Brake World",
  price: 1249,
  rating: 4.8,
  image: "/images/products/brake-pads.jpg",
  category: "brakes",
  availability: true,
  deliveryTime: "1-2 days",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("marketplaceStore", () => {
  beforeEach(() => {
    resetProductStore();
    resetCartStore();
    resetOrderStore();
    resetCategoryStore();
    vi.clearAllMocks();
  });

  // =========================================================================
  // productStore
  // =========================================================================
  describe("productStore", () => {
    // ── fetchProducts ───────────────────────────────────
    describe("fetchProducts", () => {
      it("fetches products from API and stores them", async () => {
        const apiProducts = [sampleProduct, sampleProduct2];
        mockGet.mockResolvedValueOnce({ data: { products: apiProducts } });

        await useProductStore.getState().fetchProducts();

        expect(mockGet).toHaveBeenCalledWith("/products");
        expect(useProductStore.getState().products).toEqual(apiProducts);
        expect(useProductStore.getState().isLoading).toBe(false);
        expect(useProductStore.getState().error).toBeNull();
      });

      it("falls back to DEMO_PRODUCTS when API returns empty list", async () => {
        mockGet.mockResolvedValueOnce({ data: { products: [] } });

        await useProductStore.getState().fetchProducts();

        const products = useProductStore.getState().products;
        expect(products.length).toBeGreaterThan(0);
        // Verify it's demo data by checking specific known products
        expect(products.find((p) => p.id === "prod-1")).toBeDefined();
        expect(useProductStore.getState().isLoading).toBe(false);
      });

      it("falls back to DEMO_PRODUCTS on API error and sets error state", async () => {
        mockGet.mockRejectedValueOnce({
          response: { data: { detail: "Server error" } },
        });

        await useProductStore.getState().fetchProducts();

        const products = useProductStore.getState().products;
        expect(products.length).toBeGreaterThan(0);
        expect(products.find((p) => p.id === "prod-1")).toBeDefined();
        expect(useProductStore.getState().isLoading).toBe(false);
        expect(useProductStore.getState().error).toBe("Server error");
      });

      it("sets network error when server is unreachable", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network Error"));

        await useProductStore.getState().fetchProducts();

        expect(useProductStore.getState().error).toBe(
          "Server unreachable.",
        );
        expect(useProductStore.getState().products.length).toBeGreaterThan(0);
      });
    });

    // ── setFilter ───────────────────────────────────────
    describe("setFilter", () => {
      it("sets a single filter value", () => {
        useProductStore.getState().setFilter("brand", "Bosch");

        expect(useProductStore.getState().filters.brand).toBe("Bosch");
      });

      it("preserves other filters when setting one", () => {
        useProductStore.getState().setFilter("brand", "Bosch");
        useProductStore.getState().setFilter("rating", 4.5);

        const filters = useProductStore.getState().filters;
        expect(filters.brand).toBe("Bosch");
        expect(filters.rating).toBe(4.5);
        expect(filters.priceRange).toBeNull();
        expect(filters.vendor).toBeNull();
      });

      it("clears a filter when passed null", () => {
        useProductStore.getState().setFilter("brand", "Bosch");
        useProductStore.getState().setFilter("brand", null);

        expect(useProductStore.getState().filters.brand).toBeNull();
      });

      it("can set priceRange filter", () => {
        useProductStore.getState().setFilter("priceRange", {
          min: 500,
          max: 2000,
        });

        expect(useProductStore.getState().filters.priceRange).toEqual({
          min: 500,
          max: 2000,
        });
      });
    });

    // ── clearFilters ────────────────────────────────────
    describe("clearFilters", () => {
      it("resets all filters to defaults", () => {
        useProductStore.getState().setFilter("brand", "Bosch");
        useProductStore.getState().setFilter("rating", 4.5);
        useProductStore.getState().searchProducts("oil");

        useProductStore.getState().clearFilters();

        const { filters, searchQuery } = useProductStore.getState();
        expect(filters.priceRange).toBeNull();
        expect(filters.brand).toBeNull();
        expect(filters.vendor).toBeNull();
        expect(filters.rating).toBeNull();
        expect(filters.availability).toBeNull();
        expect(filters.deliveryTime).toBeNull();
        expect(searchQuery).toBe("");
      });
    });

    // ── searchProducts ──────────────────────────────────
    describe("searchProducts", () => {
      it("updates the search query", () => {
        useProductStore.getState().searchProducts("engine oil");

        expect(useProductStore.getState().searchQuery).toBe("engine oil");
      });

      it("accepts empty string to clear search", () => {
        useProductStore.getState().searchProducts("engine oil");
        useProductStore.getState().searchProducts("");

        expect(useProductStore.getState().searchQuery).toBe("");
      });
    });

    // ── getProductById ──────────────────────────────────
    describe("getProductById", () => {
      it("returns the product when found", () => {
        useProductStore.setState({
          products: [sampleProduct, sampleProduct2],
        });

        const result = useProductStore.getState().getProductById("prod-1");

        expect(result).toEqual(sampleProduct);
      });

      it("returns null when product not found", () => {
        useProductStore.setState({ products: [sampleProduct] });

        const result = useProductStore
          .getState()
          .getProductById("non-existent");

        expect(result).toBeNull();
      });

      it("returns null when products array is empty", () => {
        const result = useProductStore
          .getState()
          .getProductById("prod-1");

        expect(result).toBeNull();
      });
    });

    // ── setLoading ──────────────────────────────────────
    describe("setLoading", () => {
      it("sets loading to true", () => {
        useProductStore.getState().setLoading(true);

        expect(useProductStore.getState().isLoading).toBe(true);
      });

      it("sets loading to false", () => {
        useProductStore.getState().setLoading(true);
        useProductStore.getState().setLoading(false);

        expect(useProductStore.getState().isLoading).toBe(false);
      });
    });
  });

  // =========================================================================
  // cartStore
  // =========================================================================
  describe("cartStore", () => {
    // ── addItem ─────────────────────────────────────────
    describe("addItem", () => {
      it("adds a new item to the cart", () => {
        useCartStore
          .getState()
          .addItem(
            { id: "prod-1", price: 2199, name: "Engine Oil", image: "/img.jpg" },
            { id: "v-1", name: "Auto Parts Co." },
          );

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(1);
        expect(items[0].productId).toBe("prod-1");
        expect(items[0].vendorId).toBe("v-1");
        expect(items[0].quantity).toBe(1);
        expect(items[0].price).toBe(2199);
        expect(items[0].name).toBe("Engine Oil");
        expect(items[0].image).toBe("/img.jpg");
      });

      it("increments quantity for same product+vendor combination", () => {
        const product = {
          id: "prod-1",
          price: 2199,
          name: "Engine Oil",
          image: "/img.jpg",
        };
        const vendor = { id: "v-1", name: "Auto Parts Co." };

        useCartStore.getState().addItem(product, vendor);
        useCartStore.getState().addItem(product, vendor);

        expect(useCartStore.getState().items).toHaveLength(1);
        expect(useCartStore.getState().items[0].quantity).toBe(2);
      });

      it("adds separate entries for same product from different vendors", () => {
        const product = {
          id: "prod-1",
          price: 2199,
          name: "Engine Oil",
          image: "/img.jpg",
        };

        useCartStore.getState().addItem(product, { id: "v-1" });
        useCartStore.getState().addItem(product, { id: "v-2" });

        expect(useCartStore.getState().items).toHaveLength(2);
        expect(useCartStore.getState().items[0].vendorId).toBe("v-1");
        expect(useCartStore.getState().items[1].vendorId).toBe("v-2");
      });

      it("handles null vendor gracefully", () => {
        useCartStore
          .getState()
          .addItem(
            { id: "prod-1", price: 2199, name: "Engine Oil" },
            null,
          );

        expect(useCartStore.getState().items[0].vendorId).toBeNull();
      });

      it("stores image as null when not provided", () => {
        useCartStore
          .getState()
          .addItem(
            { id: "prod-1", price: 2199, name: "Engine Oil" },
            { id: "v-1" },
          );

        expect(useCartStore.getState().items[0].image).toBeNull();
      });
    });

    // ── removeItem ──────────────────────────────────────
    describe("removeItem", () => {
      it("removes an item by productId", () => {
        useCartStore.setState({
          items: [
            {
              productId: "prod-1",
              vendorId: "v-1",
              quantity: 1,
              price: 2199,
              name: "Engine Oil",
            },
            {
              productId: "prod-2",
              vendorId: "v-2",
              quantity: 1,
              price: 1249,
              name: "Brake Pads",
            },
          ],
        });

        useCartStore.getState().removeItem("prod-1");

        expect(useCartStore.getState().items).toHaveLength(1);
        expect(useCartStore.getState().items[0].productId).toBe("prod-2");
      });

      it("does nothing when productId not in cart", () => {
        useCartStore.setState({
          items: [
            {
              productId: "prod-1",
              vendorId: "v-1",
              quantity: 1,
              price: 2199,
              name: "Engine Oil",
            },
          ],
        });

        useCartStore.getState().removeItem("non-existent");

        expect(useCartStore.getState().items).toHaveLength(1);
      });

      it("does not throw when cart is empty", () => {
        expect(() => {
          useCartStore.getState().removeItem("prod-1");
        }).not.toThrow();
      });
    });

    // ── updateQuantity ──────────────────────────────────
    describe("updateQuantity", () => {
      it("updates the quantity of an item", () => {
        useCartStore.setState({
          items: [
            {
              productId: "prod-1",
              vendorId: "v-1",
              quantity: 1,
              price: 2199,
              name: "Engine Oil",
            },
          ],
        });

        useCartStore.getState().updateQuantity("prod-1", 3);

        expect(useCartStore.getState().items[0].quantity).toBe(3);
      });

      it("removes item when quantity is 0", () => {
        useCartStore.setState({
          items: [
            {
              productId: "prod-1",
              vendorId: "v-1",
              quantity: 1,
              price: 2199,
              name: "Engine Oil",
            },
          ],
        });

        useCartStore.getState().updateQuantity("prod-1", 0);

        expect(useCartStore.getState().items).toHaveLength(0);
      });

      it("removes item when quantity is negative", () => {
        useCartStore.setState({
          items: [
            {
              productId: "prod-1",
              vendorId: "v-1",
              quantity: 1,
              price: 2199,
              name: "Engine Oil",
            },
          ],
        });

        useCartStore.getState().updateQuantity("prod-1", -1);

        expect(useCartStore.getState().items).toHaveLength(0);
      });

      it("does not affect other items when updating one", () => {
        useCartStore.setState({
          items: [
            {
              productId: "prod-1",
              vendorId: "v-1",
              quantity: 1,
              price: 2199,
              name: "Engine Oil",
            },
            {
              productId: "prod-2",
              vendorId: "v-2",
              quantity: 2,
              price: 1249,
              name: "Brake Pads",
            },
          ],
        });

        useCartStore.getState().updateQuantity("prod-1", 5);

        const items = useCartStore.getState().items;
        expect(items).toHaveLength(2);
        expect(items.find((i) => i.productId === "prod-1").quantity).toBe(5);
        expect(items.find((i) => i.productId === "prod-2").quantity).toBe(2);
      });
    });

    // ── applyCoupon ─────────────────────────────────────
    describe("applyCoupon", () => {
      it("stores the coupon code and resets discount to 0", () => {
        useCartStore.getState().applyCoupon("SAVE10");

        expect(useCartStore.getState().couponCode).toBe("SAVE10");
        expect(useCartStore.getState().discount).toBe(0);
      });

      it("overwrites previous coupon code", () => {
        useCartStore.getState().applyCoupon("SAVE10");
        useCartStore.getState().applyCoupon("NEWCODE");

        expect(useCartStore.getState().couponCode).toBe("NEWCODE");
      });
    });

    // ── getTotal ────────────────────────────────────────
    describe("getTotal", () => {
      it("returns 0 for empty cart", () => {
        const total = useCartStore.getState().getTotal();

        expect(total).toBe(0);
      });

      it("returns correct sum of all items", () => {
        useCartStore.setState({
          items: [
            { productId: "prod-1", price: 2199, quantity: 2 },
            { productId: "prod-2", price: 1249, quantity: 1 },
          ],
        });

        const total = useCartStore.getState().getTotal();

        expect(total).toBe(2199 * 2 + 1249);
      });

      it("accounts for discount in total", () => {
        useCartStore.setState({
          items: [{ productId: "prod-1", price: 1000, quantity: 1 }],
          discount: 100,
        });

        const total = useCartStore.getState().getTotal();

        expect(total).toBe(900);
      });

      it("returns 0 when discount exceeds subtotal", () => {
        useCartStore.setState({
          items: [{ productId: "prod-1", price: 1000, quantity: 1 }],
          discount: 2000,
        });

        const total = useCartStore.getState().getTotal();

        expect(total).toBe(0);
      });
    });

    // ── getItemCount ────────────────────────────────────
    describe("getItemCount", () => {
      it("returns total quantity of all items", () => {
        useCartStore.setState({
          items: [
            { productId: "prod-1", quantity: 2 },
            { productId: "prod-2", quantity: 3 },
          ],
        });

        const count = useCartStore.getState().getItemCount();

        expect(count).toBe(5);
      });

      it("returns 0 for empty cart", () => {
        expect(useCartStore.getState().getItemCount()).toBe(0);
      });

      it("handles single item correctly", () => {
        useCartStore.setState({
          items: [{ productId: "prod-1", quantity: 1 }],
        });

        expect(useCartStore.getState().getItemCount()).toBe(1);
      });
    });

    // ── clearCart ───────────────────────────────────────
    describe("clearCart", () => {
      it("empties the cart and resets coupon and discount", () => {
        useCartStore.setState({
          items: [
            {
              productId: "prod-1",
              vendorId: "v-1",
              quantity: 1,
              price: 2199,
              name: "Engine Oil",
            },
          ],
          couponCode: "SAVE10",
          discount: 100,
        });

        useCartStore.getState().clearCart();

        expect(useCartStore.getState().items).toHaveLength(0);
        expect(useCartStore.getState().couponCode).toBe("");
        expect(useCartStore.getState().discount).toBe(0);
        expect(useCartStore.getState().isLoading).toBe(false);
      });
    });
  });

  // =========================================================================
  // orderStore
  // =========================================================================
  describe("orderStore", () => {
    const sampleAddress = {
      street: "12, Cross Cut Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641012",
    };

    const samplePayment = { method: "upi", transactionId: "TXN-123" };

    const sampleCartItems = [
      {
        productId: "prod-1",
        vendorId: "v-1",
        quantity: 1,
        price: 2199,
        name: "Engine Oil",
        image: "/img.jpg",
      },
    ];

    // ── placeOrder ──────────────────────────────────────
    describe("placeOrder", () => {
      it("creates an order, posts to API, and clears the cart", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });

        // Pre-populate cart to verify it gets cleared
        useCartStore.getState().addItem(
          { id: "prod-1", price: 2199, name: "Engine Oil", image: "/img.jpg" },
          { id: "v-1" },
        );

        const result = await useOrderStore.getState().placeOrder(
          sampleCartItems,
          sampleAddress,
          samplePayment,
        );

        expect(mockPost).toHaveBeenCalledWith(
          "/orders",
          expect.objectContaining({
            items: [
              { productId: "prod-1", name: "Engine Oil", quantity: 1, price: 2199 },
            ],
            total: 2199,
            status: "confirmed",
            address: sampleAddress,
            payment: samplePayment,
          }),
        );
        expect(useOrderStore.getState().orders).toHaveLength(1);
        expect(useOrderStore.getState().orders[0].id).toContain("ord-");
        expect(useOrderStore.getState().orders[0].status).toBe("confirmed");
        expect(useOrderStore.getState().activeOrder).not.toBeNull();
        expect(useOrderStore.getState().activeOrder.id).toContain("ord-");
        expect(useOrderStore.getState().isLoading).toBe(false);
        expect(result).toEqual(
          expect.objectContaining({
            total: 2199,
            status: "confirmed",
          }),
        );
        // Cart should be cleared after placing order
        expect(useCartStore.getState().items).toHaveLength(0);
      });

      it("still creates order locally when API call fails", async () => {
        mockPost.mockRejectedValueOnce(new Error("Network error"));

        // Pre-populate cart
        useCartStore.getState().addItem(
          { id: "prod-1", price: 2199, name: "Engine Oil" },
          { id: "v-1" },
        );

        const result = await useOrderStore.getState().placeOrder(
          sampleCartItems,
          sampleAddress,
        );

        // Order should be created locally regardless of API failure
        expect(useOrderStore.getState().orders).toHaveLength(1);
        expect(useOrderStore.getState().orders[0].status).toBe("confirmed");
        expect(useOrderStore.getState().activeOrder).not.toBeNull();
        expect(result).toBeDefined();
        // Cart should still be cleared even when API fails
        expect(useCartStore.getState().items).toHaveLength(0);
      });

      it("creates order with default payment when not provided", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });

        const result = await useOrderStore.getState().placeOrder(
          sampleCartItems,
          sampleAddress,
          undefined,
        );

        expect(result.payment).toEqual({ method: "unknown" });
      });

      it("computes total correctly from cart items", async () => {
        mockPost.mockResolvedValueOnce({ data: {} });

        const multiItems = [
          { productId: "prod-1", name: "Engine Oil", quantity: 2, price: 2199 },
          { productId: "prod-2", name: "Brake Pads", quantity: 1, price: 1249 },
        ];

        const result = await useOrderStore.getState().placeOrder(
          multiItems,
          sampleAddress,
          samplePayment,
        );

        expect(result.total).toBe(2199 * 2 + 1249);
      });
    });

    // ── fetchOrderHistory ───────────────────────────────
    describe("fetchOrderHistory", () => {
      it("fetches orders from API and stores them", async () => {
        const apiOrders = [
          { id: "ord-1", items: [], total: 1000, status: "delivered" },
        ];
        mockGet.mockResolvedValueOnce({ data: { orders: apiOrders } });

        await useOrderStore.getState().fetchOrderHistory();

        expect(mockGet).toHaveBeenCalledWith("/orders");
        expect(useOrderStore.getState().orders).toEqual(apiOrders);
        expect(useOrderStore.getState().isLoading).toBe(false);
      });

      it("falls back to DEMO_ORDERS when API returns empty list", async () => {
        mockGet.mockResolvedValueOnce({ data: { orders: [] } });

        await useOrderStore.getState().fetchOrderHistory();

        const orders = useOrderStore.getState().orders;
        expect(orders.length).toBeGreaterThan(0);
        expect(orders.find((o) => o.id === "ord-1")).toBeDefined();
        expect(useOrderStore.getState().isLoading).toBe(false);
      });

      it("falls back to DEMO_ORDERS on API error and sets error state", async () => {
        mockGet.mockRejectedValueOnce({
          response: { data: { detail: "Server error" } },
        });

        await useOrderStore.getState().fetchOrderHistory();

        const orders = useOrderStore.getState().orders;
        expect(orders.length).toBeGreaterThan(0);
        expect(orders.find((o) => o.id === "ord-1")).toBeDefined();
        expect(useOrderStore.getState().isLoading).toBe(false);
        expect(useOrderStore.getState().error).toBe("Server error");
      });

      it("sets network error when server unreachable", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network Error"));

        await useOrderStore.getState().fetchOrderHistory();

        expect(useOrderStore.getState().error).toBe(
          "Server unreachable.",
        );
      });
    });

    // ── getOrderById ────────────────────────────────────
    describe("getOrderById", () => {
      it("returns order by id", () => {
        useOrderStore.setState({
          orders: [
            { id: "ord-1", total: 1000 },
            { id: "ord-2", total: 2000 },
          ],
        });

        const result = useOrderStore.getState().getOrderById("ord-2");

        expect(result).toEqual({ id: "ord-2", total: 2000 });
      });

      it("returns null when order not found", () => {
        useOrderStore.setState({ orders: [{ id: "ord-1" }] });

        const result = useOrderStore.getState().getOrderById("non-existent");

        expect(result).toBeNull();
      });

      it("returns null when orders array is empty", () => {
        const result = useOrderStore.getState().getOrderById("ord-1");

        expect(result).toBeNull();
      });
    });
  });

  // =========================================================================
  // categoryStore
  // =========================================================================
  describe("categoryStore", () => {
    // ── fetchCategories ─────────────────────────────────
    describe("fetchCategories", () => {
      it("fetches categories from API and stores them", async () => {
        const apiCategories = [
          { id: "cat-1", name: "Engine Parts", productCount: 24 },
        ];
        mockGet.mockResolvedValueOnce({ data: { categories: apiCategories } });

        await useCategoryStore.getState().fetchCategories();

        expect(mockGet).toHaveBeenCalledWith("/categories");
        expect(useCategoryStore.getState().categories).toEqual(apiCategories);
        expect(useCategoryStore.getState().isLoading).toBe(false);
      });

      it("falls back to DEMO_CATEGORIES when API returns empty list", async () => {
        mockGet.mockResolvedValueOnce({ data: { categories: [] } });

        await useCategoryStore.getState().fetchCategories();

        const categories = useCategoryStore.getState().categories;
        expect(categories.length).toBeGreaterThan(0);
        expect(categories.find((c) => c.id === "cat-1")).toBeDefined();
        expect(useCategoryStore.getState().isLoading).toBe(false);
      });

      it("falls back to DEMO_CATEGORIES on API error", async () => {
        mockGet.mockRejectedValueOnce(new Error("Network error"));

        await useCategoryStore.getState().fetchCategories();

        const categories = useCategoryStore.getState().categories;
        expect(categories.length).toBeGreaterThan(0);
        expect(categories.find((c) => c.id === "cat-1")).toBeDefined();
        expect(useCategoryStore.getState().isLoading).toBe(false);
      });

      it("sets isLoading during fetch and resets after", async () => {
        // Create a promise that won't resolve yet to check loading state
        let resolvePromise;
        const pendingPromise = new Promise((resolve) => {
          resolvePromise = resolve;
        });
        mockGet.mockReturnValueOnce(pendingPromise);

        const fetchPromise = useCategoryStore.getState().fetchCategories();

        // Should be loading while API is in flight
        expect(useCategoryStore.getState().isLoading).toBe(true);

        // Resolve the API call
        resolvePromise({ data: { categories: [{ id: "cat-1", name: "Engine Parts" }] } });
        await fetchPromise;

        expect(useCategoryStore.getState().isLoading).toBe(false);
      });
    });

    // ── selectCategory ──────────────────────────────────
    describe("selectCategory", () => {
      it("sets selectedCategory to the given id", () => {
        useCategoryStore.getState().selectCategory("cat-1");

        expect(useCategoryStore.getState().selectedCategory).toBe("cat-1");
      });

      it("deselects when passed null", () => {
        useCategoryStore.getState().selectCategory("cat-1");
        useCategoryStore.getState().selectCategory(null);

        expect(useCategoryStore.getState().selectedCategory).toBeNull();
      });

      it("can switch between categories", () => {
        useCategoryStore.getState().selectCategory("cat-1");
        useCategoryStore.getState().selectCategory("cat-2");

        expect(useCategoryStore.getState().selectedCategory).toBe("cat-2");
      });
    });

    // ── getCategoryById ─────────────────────────────────
    describe("getCategoryById", () => {
      it("returns category by id", () => {
        useCategoryStore.setState({
          categories: [
            { id: "cat-1", name: "Engine Parts" },
            { id: "cat-2", name: "Brakes & Suspension" },
          ],
        });

        const result = useCategoryStore.getState().getCategoryById("cat-2");

        expect(result).toEqual({ id: "cat-2", name: "Brakes & Suspension" });
      });

      it("returns null when not found", () => {
        useCategoryStore.setState({ categories: [{ id: "cat-1" }] });

        const result = useCategoryStore
          .getState()
          .getCategoryById("non-existent");

        expect(result).toBeNull();
      });

      it("returns null when categories array is empty", () => {
        const result = useCategoryStore.getState().getCategoryById("cat-1");

        expect(result).toBeNull();
      });
    });
  });
});
