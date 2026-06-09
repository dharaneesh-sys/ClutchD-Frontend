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
} from "./mockData";

// In-memory mutable state for demo progression
let demoState = {
  activeRequest: null,
  history: [...MOCK_BOOKINGS],
  notificationCount: 2,
  jobStatuses: {},
};

export function resetDemoState() {
  demoState = {
    activeRequest: null,
    history: [...MOCK_BOOKINGS],
    notificationCount: 2,
    jobStatuses: {},
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

  if (path.includes("/admin/stats") && m === "get") return "admin_stats";
  if (path.includes("/admin/users") && m === "get") return "admin_users";
  if (path.includes("/admin/mechanics") && m === "get") return "admin_mechanics";
  if (path.includes("/admin/garages") && m === "get") return "admin_garages";
  if (path.includes("/admin/jobs") && m === "get") return "admin_jobs";
  if (path.includes("/admin/payments") && m === "get") return "admin_payments";
  if (path.includes("/admin/disputes") && m === "get") return "admin_disputes";
  if (path.includes("/admin/kyc") && m === "get") return "admin_kyc";

  if (path.includes("/vehicles") && m === "get") return "vehicles_list";
  if (path.includes("/vehicles") && m === "post") return "vehicle_create";

  if (path.includes("/service/history") && m === "get") return "service_history";
  if (path.includes("/bookings") && m === "get") return "bookings_list";

  if (path.includes("/profile") && m === "get") return "profile";
  if (path.includes("/profile") && m === "patch") return "profile_update";

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
              ? { totalAmount: 850, partsCost: 350, laborCost: 500, tax: 0 }
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

    case "jobs_incoming": {
      return { data: { jobs: demoState.activeRequest ? [demoState.activeRequest] : [] } };
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

    case "admin_disputes":
      return { data: { disputes: [], total: 0 } };

    case "admin_kyc":
      return { data: { pending: [], total: 0 } };

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

    default:
      console.warn("[Demo API] Unhandled route:", route);
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
      console.warn("[Demo API] No route match:", method, url);
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

const demoApi = createDemoApi();
export default demoApi;
