// Mock product-vendor pricing for marketplace demo
// Each product linked to 3-4 vendors with different prices, stock, and delivery days

export const productVendors = [
  // prod-001: Engine Piston Ring Set
  { productId: "prod-001", vendorId: "ven-001", price: 899, originalPrice: 999, stock: 25, deliveryDays: 2 },
  { productId: "prod-001", vendorId: "ven-002", price: 949, originalPrice: null, stock: 50, deliveryDays: 1 },
  { productId: "prod-001", vendorId: "ven-003", price: 849, originalPrice: 1049, stock: 12, deliveryDays: 3 },
  { productId: "prod-001", vendorId: "ven-005", price: 919, originalPrice: null, stock: 30, deliveryDays: 2 },

  // prod-002: Timing Belt Kit
  { productId: "prod-002", vendorId: "ven-001", price: 1450, originalPrice: 1599, stock: 15, deliveryDays: 2 },
  { productId: "prod-002", vendorId: "ven-003", price: 1399, originalPrice: null, stock: 8, deliveryDays: 3 },
  { productId: "prod-002", vendorId: "ven-004", price: 1499, originalPrice: 1649, stock: 20, deliveryDays: 4 },
  { productId: "prod-002", vendorId: "ven-005", price: 1425, originalPrice: null, stock: 18, deliveryDays: 1 },

  // prod-003: Cylinder Head Gasket Set
  { productId: "prod-003", vendorId: "ven-002", price: 2350, originalPrice: 2599, stock: 5, deliveryDays: 2 },
  { productId: "prod-003", vendorId: "ven-003", price: 2199, originalPrice: null, stock: 10, deliveryDays: 3 },
  { productId: "prod-003", vendorId: "ven-005", price: 2399, originalPrice: 2699, stock: 7, deliveryDays: 2 },
  { productId: "prod-003", vendorId: "ven-001", price: 2299, originalPrice: null, stock: 4, deliveryDays: 3 },

  // prod-004: Brake Pad Set (Ceramic)
  { productId: "prod-004", vendorId: "ven-001", price: 1299, originalPrice: 1499, stock: 40, deliveryDays: 1 },
  { productId: "prod-004", vendorId: "ven-002", price: 1199, originalPrice: null, stock: 60, deliveryDays: 1 },
  { productId: "prod-004", vendorId: "ven-003", price: 1349, originalPrice: 1499, stock: 25, deliveryDays: 2 },
  { productId: "prod-004", vendorId: "ven-004", price: 1249, originalPrice: null, stock: 35, deliveryDays: 3 },

  // prod-005: Brake Disc Rotor (Vented)
  { productId: "prod-005", vendorId: "ven-001", price: 1899, originalPrice: 2199, stock: 18, deliveryDays: 2 },
  { productId: "prod-005", vendorId: "ven-002", price: 1799, originalPrice: null, stock: 22, deliveryDays: 1 },
  { productId: "prod-005", vendorId: "ven-003", price: 1949, originalPrice: 2199, stock: 10, deliveryDays: 3 },
  { productId: "prod-005", vendorId: "ven-005", price: 1849, originalPrice: null, stock: 14, deliveryDays: 2 },

  // prod-006: Brake Caliper Assembly
  { productId: "prod-006", vendorId: "ven-002", price: 3499, originalPrice: 3899, stock: 8, deliveryDays: 2 },
  { productId: "prod-006", vendorId: "ven-003", price: 3299, originalPrice: null, stock: 6, deliveryDays: 3 },
  { productId: "prod-006", vendorId: "ven-004", price: 3599, originalPrice: 3999, stock: 4, deliveryDays: 4 },
  { productId: "prod-006", vendorId: "ven-005", price: 3399, originalPrice: null, stock: 7, deliveryDays: 2 },

  // prod-007: Spark Plug Iridium
  { productId: "prod-007", vendorId: "ven-001", price: 599, originalPrice: 699, stock: 100, deliveryDays: 1 },
  { productId: "prod-007", vendorId: "ven-002", price: 549, originalPrice: null, stock: 150, deliveryDays: 1 },
  { productId: "prod-007", vendorId: "ven-003", price: 624, originalPrice: 699, stock: 80, deliveryDays: 2 },
  { productId: "prod-007", vendorId: "ven-005", price: 579, originalPrice: null, stock: 90, deliveryDays: 1 },

  // prod-008: Battery 12V 40Ah
  { productId: "prod-008", vendorId: "ven-001", price: 3899, originalPrice: 4299, stock: 12, deliveryDays: 1 },
  { productId: "prod-008", vendorId: "ven-002", price: 3999, originalPrice: null, stock: 20, deliveryDays: 1 },
  { productId: "prod-008", vendorId: "ven-003", price: 3749, originalPrice: 4299, stock: 8, deliveryDays: 2 },
  { productId: "prod-008", vendorId: "ven-004", price: 4099, originalPrice: 4499, stock: 15, deliveryDays: 3 },

  // prod-009: Alternator Assembly 90A
  { productId: "prod-009", vendorId: "ven-002", price: 5299, originalPrice: 5899, stock: 5, deliveryDays: 2 },
  { productId: "prod-009", vendorId: "ven-003", price: 5099, originalPrice: null, stock: 7, deliveryDays: 3 },
  { productId: "prod-009", vendorId: "ven-005", price: 5399, originalPrice: 5899, stock: 3, deliveryDays: 2 },
  { productId: "prod-009", vendorId: "ven-001", price: 5199, originalPrice: null, stock: 4, deliveryDays: 3 },

  // prod-010: Shock Absorber Set (Front Pair)
  { productId: "prod-010", vendorId: "ven-001", price: 2799, originalPrice: 3199, stock: 10, deliveryDays: 2 },
  { productId: "prod-010", vendorId: "ven-003", price: 2649, originalPrice: null, stock: 6, deliveryDays: 3 },
  { productId: "prod-010", vendorId: "ven-004", price: 2899, originalPrice: 3199, stock: 14, deliveryDays: 4 },
  { productId: "prod-010", vendorId: "ven-005", price: 2749, originalPrice: null, stock: 8, deliveryDays: 2 },

  // prod-011: Coil Spring Kit (Rear)
  { productId: "prod-011", vendorId: "ven-002", price: 3599, originalPrice: 3899, stock: 7, deliveryDays: 2 },
  { productId: "prod-011", vendorId: "ven-003", price: 3399, originalPrice: null, stock: 5, deliveryDays: 3 },
  { productId: "prod-011", vendorId: "ven-005", price: 3499, originalPrice: 3899, stock: 9, deliveryDays: 2 },
  { productId: "prod-011", vendorId: "ven-001", price: 3699, originalPrice: null, stock: 4, deliveryDays: 3 },

  // prod-012: Oil Filter F-101
  { productId: "prod-012", vendorId: "ven-001", price: 299, originalPrice: 349, stock: 200, deliveryDays: 1 },
  { productId: "prod-012", vendorId: "ven-002", price: 279, originalPrice: null, stock: 300, deliveryDays: 1 },
  { productId: "prod-012", vendorId: "ven-003", price: 319, originalPrice: 349, stock: 150, deliveryDays: 1 },
  { productId: "prod-012", vendorId: "ven-004", price: 289, originalPrice: null, stock: 180, deliveryDays: 2 },

  // prod-013: Air Filter Element (Panel Type)
  { productId: "prod-013", vendorId: "ven-001", price: 449, originalPrice: 499, stock: 80, deliveryDays: 1 },
  { productId: "prod-013", vendorId: "ven-002", price: 429, originalPrice: null, stock: 120, deliveryDays: 1 },
  { productId: "prod-013", vendorId: "ven-003", price: 469, originalPrice: 519, stock: 60, deliveryDays: 2 },
  { productId: "prod-013", vendorId: "ven-005", price: 439, originalPrice: null, stock: 75, deliveryDays: 1 },

  // prod-014: Cabin Filter Activated Carbon
  { productId: "prod-014", vendorId: "ven-001", price: 549, originalPrice: 649, stock: 55, deliveryDays: 1 },
  { productId: "prod-014", vendorId: "ven-002", price: 519, originalPrice: null, stock: 85, deliveryDays: 1 },
  { productId: "prod-014", vendorId: "ven-003", price: 574, originalPrice: 649, stock: 40, deliveryDays: 2 },
  { productId: "prod-014", vendorId: "ven-004", price: 539, originalPrice: null, stock: 60, deliveryDays: 2 },

  // prod-015: Car Floor Mat Set (TPE)
  { productId: "prod-015", vendorId: "ven-001", price: 1199, originalPrice: 1399, stock: 30, deliveryDays: 2 },
  { productId: "prod-015", vendorId: "ven-002", price: 1099, originalPrice: null, stock: 45, deliveryDays: 1 },
  { productId: "prod-015", vendorId: "ven-003", price: 1249, originalPrice: 1399, stock: 20, deliveryDays: 3 },
  { productId: "prod-015", vendorId: "ven-005", price: 1149, originalPrice: null, stock: 35, deliveryDays: 2 },
];
