// Deterministic mock data for ClutchD Demo/Investor Mode
// All data is fixed (no Math.random) for reproducible tours

export const MOCK_USERS = {
  customer: {
    id: "demo-cust-1",
    email: "demo@clutchd.in",
    name: "Arun Kumar",
    phone: "+91 98765 43210",
    role: "customer",
    avatar: null,
    isVerified: true,
    createdAt: "2025-01-15T08:30:00Z",
  },
  mechanic: {
    id: "demo-mech-1",
    email: "mechanic@clutchd.in",
    name: "Rajesh M.",
    phone: "+91 98765 43211",
    role: "mechanic",
    expertise: ["engine", "electrical", "brakes", "diagnostics"],
    rating: 4.8,
    totalJobs: 347,
    isVerified: true,
    isAvailable: true,
    lat: 11.0208,
    lon: 76.9558,
    createdAt: "2024-06-01T10:00:00Z",
  },
  garage: {
    id: "demo-garage-1",
    email: "garage@clutchd.in",
    name: "Priya Auto Works",
    phone: "+91 98765 43212",
    role: "garage",
    businessName: "Priya Auto Works",
    address: "12, Cross Cut Road, Gandhipuram, Coimbatore",
    rating: 4.6,
    totalJobs: 892,
    isVerified: true,
    lat: 11.0188,
    lon: 76.9658,
    createdAt: "2024-03-15T09:00:00Z",
  },
  admin: {
    id: "demo-admin-1",
    email: "admin@clutchd.in",
    name: "Admin",
    role: "admin",
  },
};

export const MOCK_VEHICLES = [
  { id: "v1", make: "Maruti", model: "Swift", year: 2020, color: "Red", plate: "TN 38 AB 1234", type: "hatchback" },
  { id: "v2", make: "Hyundai", model: "i20", year: 2022, color: "Blue", plate: "TN 38 CD 5678", type: "hatchback" },
  { id: "v3", make: "Toyota", model: "Fortuner", year: 2023, color: "White", plate: "TN 38 EF 9012", type: "suv" },
  { id: "v4", make: "Honda", model: "Activa", year: 2021, color: "Black", plate: "TN 38 GH 3456", type: "scooter" },
];

export const MOCK_MECHANICS = [
  { id: "mech-1", full_name: "Rajesh M.", phone: "+919876543211", expertise: ["engine", "electrical", "diagnostics"], rating: 4.8, totalJobs: 347, verified: true, available: true, lat: 11.0208, lon: 76.9558, image: null, vehicleType: "car" },
  { id: "mech-2", full_name: "Suresh K.", phone: "+919876543212", expertise: ["tires", "brakes", "suspension"], rating: 4.6, totalJobs: 281, verified: true, available: true, lat: 11.014, lon: 76.962, image: null, vehicleType: "car" },
  { id: "mech-3", full_name: "Dinesh R.", phone: "+919876543213", expertise: ["ac", "electrical", "battery"], rating: 4.9, totalJobs: 512, verified: true, available: true, lat: 11.024, lon: 76.95, image: null, vehicleType: "car" },
  { id: "mech-4", full_name: "Vijay M.", phone: "+919876543214", expertise: ["engine", "transmission", "exhaust"], rating: 4.5, totalJobs: 198, verified: true, available: false, lat: 11.01, lon: 76.97, image: null, vehicleType: "car" },
  { id: "mech-5", full_name: "Karthik S.", phone: "+919876543215", expertise: ["bodywork", "diagnostics", "engine"], rating: 4.7, totalJobs: 423, verified: true, available: true, lat: 11.03, lon: 76.945, image: null, vehicleType: "car" },
];

export const MOCK_GARAGES = [
  { id: "garage-1", business_name: "Priya Auto Works", owner_name: "Priya S.", phone: "+919876543221", address: "12, Cross Cut Road, Gandhipuram", lat: 11.0188, lon: 76.9658, rating: 4.6, totalJobs: 892, verified: true, expertise: ["engine", "transmission", "bodywork", "ac", "electrical"], image: null },
  { id: "garage-2", business_name: "Kumar's Garage", owner_name: "Kumar R.", phone: "+919876543222", address: "45, Sathyamangalam Road, Peelamedu", lat: 11.024, lon: 76.993, rating: 4.4, totalJobs: 654, verified: true, expertise: ["engine", "brakes", "suspension", "tires", "oil"], image: null },
  { id: "garage-3", business_name: "Green Drive Service", owner_name: "Anita M.", phone: "+919876543223", address: "78, Avinashi Road, Hope College", lat: 11.03, lon: 76.972, rating: 4.8, totalJobs: 1023, verified: true, expertise: ["engine", "electrical", "diagnostics", "ac", "battery"], image: null },
];

export const DEMO_SERVICE_STATUSES = ["searching", "assigned", "en_route", "in_progress", "payment_pending", "completed"];

export const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "info", title: "Welcome to Demo Mode", message: "You're viewing ClutchD in demo mode. All data is simulated.", read: false, createdAt: new Date().toISOString() },
  { id: "n2", type: "success", title: "Mechanic Found", message: "Rajesh M. has been assigned to your service request", read: false, createdAt: new Date(Date.now() - 60000).toISOString() },
];

export const MOCK_BOOKINGS = [
  { id: "bk-1", userId: "demo-cust-1", mechanicId: "mech-1", garageId: null, serviceType: "engine_diagnostic", status: "completed", scheduledAt: "2025-06-01T10:00:00Z", amount: 450, createdAt: "2025-05-31T12:00:00Z" },
  { id: "bk-2", userId: "demo-cust-1", mechanicId: "mech-3", garageId: null, serviceType: "ac_service", status: "completed", scheduledAt: "2025-05-28T14:00:00Z", amount: 1200, createdAt: "2025-05-27T09:00:00Z" },
];

export const MOCK_PAYMENTS = [
  { id: "pay-1", jobId: "bk-1", amount: 450, method: "upi", status: "completed", transactionId: "TXN-DEMO-001", paidAt: "2025-06-01T11:30:00Z" },
  { id: "pay-2", jobId: "bk-2", amount: 1200, method: "card", status: "completed", transactionId: "TXN-DEMO-002", paidAt: "2025-05-28T15:00:00Z" },
];

export const MOCK_ADMIN_STATS = {
  totalUsers: 12453,
  totalMechanics: 847,
  totalGarages: 312,
  totalJobs: 28943,
  activeJobs: 47,
  revenue: 2894500,
  growthPercent: 12.5,
  recentTransactions: MOCK_PAYMENTS,
};

export function createMockServiceRequest(overrides = {}) {
  return {
    id: overrides.id || "demo-request-1",
    issueTag: "engine_failure",
    description: "Engine making a knocking sound when accelerating. Started this morning on the way to work.",
    requestType: "mechanic",
    status: "searching",
    customerLat: 11.0208,
    customerLng: 76.9558,
    mechanic: null,
    priceEstimate: { min: 500, max: 1500 },
    pricing: null,
    mediaUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export const MOCK_ISSUE_TAGS = [
  { value: "flat_tire", label: "Flat Tire" },
  { value: "engine_failure", label: "Engine Failure" },
  { value: "battery_dead", label: "Dead Battery" },
  { value: "overheating", label: "Overheating" },
  { value: "brake_issue", label: "Brake Issue" },
  { value: "oil_leak", label: "Oil Leak" },
  { value: "electrical", label: "Electrical Problem" },
  { value: "ac_not_working", label: "AC Not Working" },
  { value: "transmission", label: "Transmission Issue" },
  { value: "starting_issue", label: "Won't Start" },
  { value: "noise", label: "Strange Noise" },
  { value: "other", label: "Other" },
];

export const MOCK_PRICE_ESTIMATES = {
  flat_tire: { min: 200, max: 500 },
  engine_failure: { min: 500, max: 3000 },
  battery_dead: { min: 300, max: 1500 },
  overheating: { min: 400, max: 2000 },
  brake_issue: { min: 300, max: 2500 },
  oil_leak: { min: 200, max: 1000 },
  electrical: { min: 500, max: 3000 },
  ac_not_working: { min: 500, max: 3500 },
  transmission: { min: 1000, max: 5000 },
  starting_issue: { min: 300, max: 1500 },
  noise: { min: 200, max: 1000 },
  other: { min: 200, max: 2000 },
};
