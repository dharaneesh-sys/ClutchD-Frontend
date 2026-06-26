// Demo API Interceptor - Routes API calls to mock data when demo mode is active
import {
  MOCK_USERS,
  MOCK_MECHANICS,
  MOCK_GARAGES,
  MOCK_BOOKINGS,
  MOCK_PAYMENTS,
  MOCK_ADMIN_STATS,
  MOCK_VEHICLES,
  DEMO_SERVICE_STATUSES,
  MOCK_PRICE_ESTIMATES,
  createMockServiceRequest,
  MOCK_KYC_APPLICATIONS,
  MOCK_DISPUTES,
} from "@/lib/demo/mockData";
import {
  PRODUCT_CATEGORIES,
  BRANDS,
} from "@/lib/constants";
import { products } from "@/lib/demo/data/products";
import { vendors } from "@/lib/demo/data/vendors";
import { productVendors } from "@/lib/demo/data/productVendors";
import { offers } from "@/lib/demo/data/offers";
import { reviews as productReviews } from "@/lib/demo/data/reviews";

// Seed jobs that always appear in demo mode (so mechanic/garage dashboards are never empty)
const SEEDED_JOBS = [
  createMockServiceRequest({
    id: "demo-req-seeded-1",
    issueTag: "engine_failure",
    description: "Engine making a knocking sound when accelerating. Started this morning on the way to work.",
    requestType: "mechanic",
    createdAt: new Date(Date.now() - 600000).toISOString(),
  }),
  createMockServiceRequest({
    id: "demo-req-seeded-2",
    issueTag: "ac_not_working",
    description: "AC stopped blowing cold air. Hot air only from vents.",
    requestType: "garage",
    createdAt: new Date(Date.now() - 300000).toISOString(),
  }),
  createMockServiceRequest({
    id: "demo-req-seeded-3",
    issueTag: "flat_tire",
    description: "Rear left tyre is completely flat. Need roadside assistance.",
    requestType: "auto",
    createdAt: new Date(Date.now() - 900000).toISOString(),
  }),
];

// In-memory mutable state for demo progression
let demoState = {
  activeRequest: null,
  history: [...MOCK_BOOKINGS],
  notificationCount: 2,
  jobStatuses: {},
  marketplaceOrders: [],
};

export function resetDemoState() {
  demoState = {
    activeRequest: null,
    history: [...MOCK_BOOKINGS],
    notificationCount: 2,
    jobStatuses: {},
    marketplaceOrders: [],
  };
}

const delayMs = () => new Promise((r) => setTimeout(r, 80 + Math.random() * 120));

/**
 * Match a URL + method to a named route.
 * Strips the base URL so it works regardless of API_BASE_URL.
 */
function matchRoute(url, method) {
  const path = url.replace(/^https?:\/\/[^/]+(\/api)?/, "").split("?")[0];
  const m = method.toLowerCase();

  if (path.includes("/auth/login") && m === "post") return "auth_login";
  if (path.includes("/auth/signup") && m === "post") return "auth_signup";
  if (path.includes("/auth/refresh") && m === "post") return "auth_refresh";
  if (path.includes("/auth/forgot-password/request") && m === "post") return "forgot_request";
  if (path.includes("/auth/forgot-password/reset") && m === "post") return "forgot_reset";
  if (path.includes("/auth/google") && m === "post") return "auth_google";

  if (/\/service\/request\/?$/.test(path) && m === "post") return "create_request";
  if (/\/service\/request\/[^/]+\/status/.test(path) && m === "patch") return "update_status";
  if (/\/service\/request\/[^/]+\/complete/.test(path) && m === "post") return "complete_request";
  if (/\/service\/request\/[^/]+\/cancel/.test(path) && m === "post") return "cancel_request";
  if (/\/service\/request\/([\w-]+)\/finalize-price/.test(path) && m === "post") {
    const match = path.match(/\/service\/request\/([\w-]+)\/finalize-price/);
    return { route: "finalize_price", jobId: match ? match[1] : null };
  }

  if (path.includes("/jobs/incoming") && m === "get") return "jobs_incoming";
  if (/\/jobs\/status\/[\w-]+/.test(path) && m === "get") {
    // Extract the job ID from the path
    const match = path.match(/\/jobs\/status\/([\w-]+)/);
    return { route: "job_status", jobId: match ? match[1] : null };
  }

  if (path.includes("/mechanics/nearby") && m === "get") return "mechanics_nearby";
  if (path.includes("/mechanics") && m === "get") return "mechanics_list";

  if (path.includes("/garages/nearby") && m === "get") return "garages_nearby";
  if (path.includes("/garages") && m === "get") return "garages_list";

  if (path.includes("/notifications") && m === "get") return "notifications_list";
  if (/\/notifications\/[^/]+\/read/.test(path) && m === "post") return "notification_read";

  if (path.includes("/tracking/location") && m === "post") return "tracking_location";
  if (path.includes("/tracking") && m === "get") return "tracking";

  if (path.includes("/uploads") && m === "post") return "upload";

  if (/\/jobs\/[\w-]+/.test(path) && m === "delete") {
    const match = path.match(/\/jobs\/([\w-]+)/);
    return { route: "job_delete", jobId: match ? match[1] : null };
  }

  if (path.includes("/admin/analytics") && m === "get") return "admin_stats";
  if (path.includes("/admin/stats") && m === "get") return "admin_stats";
  if (path.includes("/admin/users") && m === "get") return "admin_users";
  if (path.includes("/admin/mechanics") && m === "get") return "admin_mechanics";
  if (path.includes("/admin/garages") && m === "get") return "admin_garages";
  if (path.includes("/admin/jobs") && m === "get") return "admin_jobs";
  if (path.includes("/admin/payments") && m === "get") return "admin_payments";
  if (path.includes("/payments/create") && m === "post") return "payment_create";
  if (path.includes("/payments/verify") && m === "post") return "payment_verify";
  if (path.includes("/admin/disputes") && m === "get") return "admin_disputes";
  if (path.includes("/admin/kyc") && m === "get") return "admin_kyc";

  if (path.includes("/vehicles") && m === "get") return "vehicles_list";
  if (path.includes("/vehicles") && m === "post") return "vehicle_create";

  if (path.includes("/service/history") && m === "get") return "service_history";
  if (path.includes("/bookings") && m === "get") return "bookings_list";

  if (path.includes("/profile") && m === "get") return "profile";
  if (path.includes("/profile") && m === "patch") return "profile_update";

  if (path.includes("/providers/earnings") && m === "get") return "providers_earnings";
  if (path.includes("/providers/availability") && m === "patch") return "providers_availability";
  if (path.includes("/providers/profile") && m === "patch") return "providers_profile";

  // ═══════════════════════════════════════════
  // Marketplace routes (ordered: specific → generic)
  // ═══════════════════════════════════════════

  // Product reviews (must match before single product)
  if (/\/marketplace\/products\/([\w-]+)\/reviews/.test(path) && m === "get") {
    const match = path.match(/\/marketplace\/products\/([\w-]+)\/reviews/);
    return { route: "product_reviews", productId: match ? match[1] : null };
  }
  if (/\/marketplace\/products\/([\w-]+)\/reviews/.test(path) && m === "post") {
    const match = path.match(/\/marketplace\/products\/([\w-]+)\/reviews/);
    return { route: "product_review_add", productId: match ? match[1] : null };
  }
  // Single product detail
  if (/\/marketplace\/products\/([\w-]+)/.test(path) && m === "get") {
    const match = path.match(/\/marketplace\/products\/([\w-]+)/);
    return { route: "product_detail", productId: match ? match[1] : null };
  }
  // Product list
  if (path.includes("/marketplace/products") && m === "get") return "products_list";

  // Single vendor detail (must match before vendor list)
  if (/\/marketplace\/vendors\/([\w-]+)/.test(path) && m === "get") {
    const match = path.match(/\/marketplace\/vendors\/([\w-]+)/);
    return { route: "vendor_detail", vendorId: match ? match[1] : null };
  }
  // Vendor list
  if (path.includes("/marketplace/vendors") && m === "get") return "vendors_list";

  // Categories and brands
  if (path.includes("/marketplace/categories") && m === "get") return "categories_list";
  if (path.includes("/marketplace/brands") && m === "get") return "brands_list";

  // Offers (validate must match before generic offers)
  if (path.includes("/marketplace/offers/validate") && m === "post") return "offer_validate";
  if (path.includes("/marketplace/offers") && m === "get") return "offers_list";

  // Orders (detail must match before generic orders)
  if (/\/marketplace\/orders\/([\w-]+)/.test(path) && m === "get") {
    const match = path.match(/\/marketplace\/orders\/([\w-]+)/);
    return { route: "order_detail", orderId: match ? match[1] : null };
  }
  if (path.includes("/marketplace/orders") && m === "post") return "order_create";
  if (path.includes("/marketplace/orders") && m === "get") return "orders_list";

  // ═══════════════════════════════════════════
  // End marketplace routes
  // ═══════════════════════════════════════════

  return null;
}

function handleRoute(routeDef, reqData) {
  const route = typeof routeDef === "object" ? routeDef.route : routeDef;
  const extra = typeof routeDef === "object" ? routeDef : {};
  const data = reqData || {};

  switch (route) {
    case "auth_login": {
      const role = data.role || "customer";
      const user = MOCK_USERS[role] || MOCK_USERS.customer;
      return { data: { token: "demo-jwt-token-12345", user } };
    }

    case "auth_signup": {
      const role = data.role || "customer";
      const base = MOCK_USERS[role] || MOCK_USERS.customer;
      return { data: { token: "demo-jwt-token-12345", user: { ...base, ...data } } };
    }

    case "auth_refresh":
      return { data: { token: "demo-jwt-token-12345" } };

    case "auth_google":
      return { data: { token: "demo-jwt-token-12345", user: MOCK_USERS.customer } };

    case "forgot_request":
    case "forgot_reset":
      return { data: { success: true, message: "Demo mode: operation simulated" } };

    case "create_request": {
      const issueTag = data.issueTag || "engine_failure";
      const estimate = MOCK_PRICE_ESTIMATES[issueTag] || { min: 200, max: 2000 };
      const newReq = {
        id: "demo-req-" + Date.now(),
        issueTag,
        description: data.description || "Service request created in demo mode.",
        requestType: data.requestType || "mechanic",
        status: "searching",
        customerLat: data.customerLat || 11.0208,
        customerLng: data.customerLng || 76.9558,
        mechanic: null,
        priceEstimate: estimate,
        pricing: null,
        mediaUrl: data.mediaUrl || null,
        createdAt: new Date().toISOString(),
      };
      demoState.activeRequest = newReq;
      return { data: newReq };
    }

    case "update_status": {
      if (demoState.activeRequest) {
        const newStatus = data?.status || DEMO_SERVICE_STATUSES[1];
        const statusIdx = DEMO_SERVICE_STATUSES.indexOf(newStatus);
        demoState.activeRequest = {
          ...demoState.activeRequest,
          status: newStatus,
          mechanic:
            statusIdx >= 1 ? MOCK_MECHANICS[0] : demoState.activeRequest.mechanic,
          pricing:
            newStatus === "payment_pending"
              ? {
                  totalAmount: 850,
                  serviceAmount: 570,
                  convenienceFee: 50,
                  cancellationFee: 0,
                  distanceKm: 3.2,
                  distanceFee: 100,
                  gstAmount: 130,
                }
              : demoState.activeRequest.pricing,
        };
      }
      return { data: { success: true } };
    }

    case "complete_request": {
      if (demoState.activeRequest) {
        const completed = {
          ...demoState.activeRequest,
          status: "completed",
          payment: data,
          completedAt: new Date().toISOString(),
        };
        demoState.history = [completed, ...demoState.history];
        demoState.activeRequest = null;
      }
      return { data: { success: true } };
    }

    case "cancel_request": {
      demoState.activeRequest = null;
      return { data: { success: true } };
    }

    case "finalize_price":
      return { data: { success: true, invoice: { id: "inv-" + Date.now(), amount: data?.serviceAmount || 0 } } };

    case "job_delete":
      return { data: { success: true } };

    case "jobs_incoming": {
      const jobs = [...SEEDED_JOBS];
      if (demoState.activeRequest) {
        jobs.push(demoState.activeRequest);
      }
      return { data: { jobs } };
    }

    case "job_status": {
      return {
        data: {
          id: extra.jobId || demoState.activeRequest?.id || "demo-request-1",
          status: demoState.activeRequest?.status || "idle",
          mechanic: demoState.activeRequest?.mechanic || null,
          pricing: demoState.activeRequest?.pricing || null,
        },
      };
    }

    case "mechanics_nearby":
    case "mechanics_list":
      return { data: MOCK_MECHANICS.filter((m) => m.available) };

    case "garages_nearby":
    case "garages_list":
      return { data: MOCK_GARAGES };

    case "notifications_list":
      return { data: { notifications: [], unreadCount: 0 } };

    case "notification_read":
      return { data: { success: true } };

    case "tracking":
      return {
        data: {
          mechanic: MOCK_MECHANICS[0],
          location: { lat: 11.0208, lon: 76.9558 },
        },
      };

    case "tracking_location":
      return { data: { success: true } };

    case "upload":
      return { data: { url: "https://demo.clutchd.in/uploads/demo-image.jpg" } };

    case "admin_stats":
      return { data: MOCK_ADMIN_STATS };

    case "admin_users":
      return { data: { users: [MOCK_USERS.customer, MOCK_USERS.mechanic, MOCK_USERS.garage], total: 3 } };

    case "admin_mechanics":
      return { data: { mechanics: MOCK_MECHANICS, total: MOCK_MECHANICS.length } };

    case "admin_garages":
      return { data: { garages: MOCK_GARAGES, total: MOCK_GARAGES.length } };

    case "admin_jobs":
      return { data: { jobs: demoState.history, total: demoState.history.length } };

    case "admin_payments":
      return { data: { payments: MOCK_PAYMENTS, total: MOCK_PAYMENTS.length } };

    case "payment_create":
      return {
        data: {
          order_id: "order_demo_" + Date.now(),
          amount: data?.amount || 85000,
          currency: "inr",
          key_id: "rzp_demo_key",
          payment_id: "pmt_demo_" + Date.now(),
        },
      };

    case "payment_verify":
      return { data: { ok: true, status: "captured" } };

    case "admin_disputes":
      return { data: { disputes: MOCK_DISPUTES, total: MOCK_DISPUTES.length } };

    case "admin_kyc":
      return { data: { applications: [...MOCK_KYC_APPLICATIONS], total: MOCK_KYC_APPLICATIONS.length } };

    case "vehicles_list":
      return { data: MOCK_VEHICLES };

    case "vehicle_create":
      return { data: { ...data, id: "demo-v-" + Date.now() } };

    case "bookings_list":
    case "service_history":
      return { data: demoState.history };

    case "profile":
      return { data: MOCK_USERS.customer };

    case "profile_update":
      return { data: { ...MOCK_USERS.customer, ...data } };

    case "providers_availability":
      return { data: { success: true, available: data?.available ?? true } };

    case "providers_profile":
      return { data: { success: true, user: { ...MOCK_USERS.mechanic, ...data } } };

    case "providers_earnings": {
      const period = data?.period || "week";
      const mockEarnings = {
        week: [
          { day: "Mon", amount: 120 },
          { day: "Tue", amount: 350 },
          { day: "Wed", amount: 200 },
          { day: "Thu", amount: 480 },
          { day: "Fri", amount: 150 },
          { day: "Sat", amount: 620 },
          { day: "Sun", amount: 290 },
        ],
        month: [
          { week: "W1", amount: 1850 },
          { week: "W2", amount: 2210 },
          { week: "W3", amount: 1680 },
          { week: "W4", amount: 2540 },
        ],
      };
      return {
        data: {
          earnings: mockEarnings[period] || mockEarnings.week,
          total: (mockEarnings[period] || mockEarnings.week).reduce((s, e) => s + e.amount, 0),
        },
      };
    }

    // ═══════════════════════════════════════════
    // Marketplace handlers
    // ═══════════════════════════════════════════

    case "products_list": {
      // Filtering helpers: params come from data (reqData / config.params)
      const {
        categoryId,
        priceRange,
        minPrice,
        maxPrice,
        brand,
        rating,
        search,
      } = data || {};

      // Compute effective min price per product from vendor offerings
      const getMinVendorPrice = (prodId) => {
        const pvs = productVendors.filter((pv) => pv.productId === prodId);
        return pvs.length > 0 ? Math.min(...pvs.map((pv) => pv.price)) : null;
      };

      let filtered = products.filter((p) => {
        // Category filter
        if (categoryId && p.categoryId !== categoryId) return false;

        // Brand filter
        if (brand && p.brand !== brand) return false;

        // Rating filter (minimum average review rating)
        if (rating) {
          const productRatings = productReviews.filter((r) => r.productId === p.id);
          const avgRating =
            productRatings.length > 0
              ? productRatings.reduce((sum, r) => sum + r.rating, 0) / productRatings.length
              : 0;
          if (avgRating < Number(rating)) return false;
        }

        // Search query across name, description, brand, partNumber
        if (search) {
          const q = search.toLowerCase();
          const matchSearch =
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            (p.partNumber && p.partNumber.toLowerCase().includes(q));
          if (!matchSearch) return false;
        }

        return true;
      });

      // Price range filter (applied after initial filtering, using vendor prices)
      if (priceRange || minPrice || maxPrice) {
        const min = Number(minPrice) || 0;
        const max = Number(maxPrice) || Infinity;

        // Handle predefined price range string
        if (priceRange) {
          if (priceRange === "2000+") {
            filtered = filtered.filter((p) => {
              const vp = getMinVendorPrice(p.id);
              return vp !== null && vp >= 2000;
            });
          } else {
            const [rMin, rMax] = priceRange.split("-").map(Number);
            filtered = filtered.filter((p) => {
              const vp = getMinVendorPrice(p.id);
              return vp !== null && vp >= rMin && vp <= rMax;
            });
          }
        } else {
          filtered = filtered.filter((p) => {
            const vp = getMinVendorPrice(p.id);
            return vp !== null && vp >= min && vp <= max;
          });
        }
      }

      // Annotate each product with its lowest vendor price for display
      const annotated = filtered.map((p) => ({
        ...p,
        displayPrice: getMinVendorPrice(p.id),
        vendorCount: productVendors.filter((pv) => pv.productId === p.id).length,
      }));

      return { data: { products: annotated, total: annotated.length } };
    }

    case "product_detail": {
      const product = products.find((p) => p.id === extra.productId);
      if (!product) {
        return { data: null, error: { message: "Product not found" } };
      }
      // Attach vendor pricing info
      const vendorPricing = productVendors
        .filter((pv) => pv.productId === product.id)
        .map((pv) => {
          const vendor = vendors.find((v) => v.id === pv.vendorId);
          return { ...pv, vendor };
        });
      const productRating = productReviews.filter((r) => r.productId === product.id);
      const avgRating =
        productRating.length > 0
          ? productRating.reduce((sum, r) => sum + r.rating, 0) / productRating.length
          : 0;
      return {
        data: {
          ...product,
          vendorPricing,
          rating: avgRating,
          reviewCount: productRating.length,
        },
      };
    }

    case "vendors_list": {
      return { data: { vendors, total: vendors.length } };
    }

    case "vendor_detail": {
      const vendor = vendors.find((v) => v.id === extra.vendorId);
      if (!vendor) {
        return { data: null, error: { message: "Vendor not found" } };
      }
      // Products this vendor sells
      const vendorProducts = productVendors
        .filter((pv) => pv.vendorId === vendor.id)
        .map((pv) => {
          const product = products.find((p) => p.id === pv.productId);
          return { ...pv, product };
        });
      return { data: { ...vendor, products: vendorProducts } };
    }

    case "categories_list": {
      return { data: { categories: PRODUCT_CATEGORIES } };
    }

    case "brands_list": {
      return { data: { brands: BRANDS } };
    }

    case "product_reviews": {
      const productReviewsForProduct = productReviews.filter(
        (r) => r.productId === extra.productId
      );
      const avgRating =
        productReviewsForProduct.length > 0
          ? productReviewsForProduct.reduce((sum, r) => sum + r.rating, 0) /
            productReviewsForProduct.length
          : 0;
      return {
        data: {
          reviews: productReviewsForProduct,
          total: productReviewsForProduct.length,
          averageRating: Math.round(avgRating * 10) / 10,
        },
      };
    }

    case "product_review_add": {
      const newReview = {
        id: "rev-demo-" + Date.now(),
        productId: extra.productId,
        userName: data.userName || "Demo User",
        rating: data.rating || 5,
        text: data.text || "Great product!",
        date: new Date().toISOString(),
        verified: false,
      };
      // Add to the reviews array (mutate for demo lifecycle)
      productReviews.push(newReview);
      return { data: newReview };
    }

    case "offers_list": {
      return { data: { offers, total: offers.length } };
    }

    case "offer_validate": {
      const { code, purchaseAmount } = data || {};
      const offer = offers.find(
        (o) => o.code.toLowerCase() === (code || "").toLowerCase()
      );
      if (!offer) {
        return { data: { valid: false, message: "Invalid coupon code" } };
      }
      const now = new Date();
      const validUntil = new Date(offer.validUntil);
      if (now > validUntil) {
        return { data: { valid: false, message: "Coupon has expired" } };
      }
      if ((purchaseAmount || 0) < offer.minPurchase) {
        return {
          data: {
            valid: false,
            message: `Minimum purchase of ₹${offer.minPurchase} required`,
            minPurchase: offer.minPurchase,
          },
        };
      }
      const discountAmount = Math.round((purchaseAmount * offer.discountPercent) / 100);
      return {
        data: {
          valid: true,
          offerId: offer.id,
          title: offer.title,
          discountPercent: offer.discountPercent,
          discountAmount,
          code: offer.code,
        },
      };
    }

    case "orders_list": {
      return { data: { orders: demoState.marketplaceOrders, total: demoState.marketplaceOrders.length } };
    }

    case "order_create": {
      const orderId = "order-demo-" + (demoState.marketplaceOrders.length + 1);
      const newOrder = {
        id: orderId,
        items: data.items || [],
        totalAmount: data.totalAmount || 0,
        subtotal: data.subtotal || 0,
        shippingCharge: data.shippingCharge || 0,
        discountAmount: data.discountAmount || 0,
        status: "pending",
        shippingAddress: data.shippingAddress || {},
        paymentMethod: data.paymentMethod || "cod",
        createdAt: new Date().toISOString(),
      };
      demoState.marketplaceOrders = [newOrder, ...demoState.marketplaceOrders];
      return { data: newOrder };
    }

    case "order_detail": {
      const order = demoState.marketplaceOrders.find(
        (o) => o.id === extra.orderId
      );
      if (!order) {
        return { data: null, error: { message: "Order not found" } };
      }
      return { data: order };
    }

    default:
      return { data: { success: true } };
  }
}

/**
 * Create a demo API handler that mimics axios interface.
 * The stores use `api.get()`, `api.post()`, `api.patch()` etc.
 */
export function createDemoApi() {
  async function request(method, url, data, config) {
    await delayMs();
    const routeDef = matchRoute(url, method);
    if (!routeDef) {
      return { data: {} };
    }
    return handleRoute(routeDef, data || config?.params);
  }

  return {
    get: (url, config) => request("get", url, null, config),
    post: (url, data, config) => request("post", url, data, config),
    patch: (url, data, config) => request("patch", url, data, config),
    put: (url, data, config) => request("put", url, data, config),
    delete: (url, config) => request("delete", url, null, config),
    interceptors: {
      request: { use: () => {}, eject: () => {} },
      response: { use: () => {}, eject: () => {} },
    },
    defaults: {},
  };
}

export function handleDemoApiRequest(method, url, data, config) {
  const routeDef = matchRoute(url, method);
  if (!routeDef) return null;
  return handleRoute(routeDef, data || config?.params);
}

const demoApi = createDemoApi();
export default demoApi;
