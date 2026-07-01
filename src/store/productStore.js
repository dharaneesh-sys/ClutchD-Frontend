import { create } from "zustand";
import { devtools } from "zustand/middleware";
import api from "@/lib/api";

const DEMO_PRODUCTS = [
  // ── Engine Parts ──
  {
    id: "prod-001",
    name: "Engine Piston Ring Set",
    description: "High-quality piston ring set for 4-cylinder engines",
    brand: "Bosch",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 899,
    rating: 4.5,
    image: "/images/products/engine-piston.jpg",
    category: "engine-parts",
    availability: true,
    deliveryTime: "2-3 days",
  },
  {
    id: "prod-002",
    name: "Timing Belt Kit",
    description: "Complete timing belt kit with tensioner for reliable timing",
    brand: "MICO",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 1450,
    rating: 4.7,
    image: "/images/products/timing-belt.jpg",
    category: "engine-parts",
    availability: true,
    deliveryTime: "2-3 days",
  },
  {
    id: "prod-003",
    name: "Cylinder Head Gasket Set",
    description: "Premium cylinder head gasket set for superior engine sealing",
    brand: "TVS",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 2350,
    rating: 4.3,
    image: "/images/products/head-gasket.jpg",
    category: "engine-parts",
    availability: true,
    deliveryTime: "3-5 days",
  },

  // ── Brake Parts ──
  {
    id: "prod-004",
    name: "Brake Pad Set (Ceramic)",
    description: "Ceramic brake pads for quiet, low-dust stopping power",
    brand: "Bosch",
    vendorId: "v-2",
    vendor: "Brake World",
    price: 1299,
    rating: 4.8,
    image: "/images/products/brake-pads.jpg",
    category: "brake-parts",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-005",
    name: "Brake Disc Rotor (Vented)",
    description: "Vented brake disc rotor for improved heat dissipation",
    brand: "Valeo",
    vendorId: "v-2",
    vendor: "Brake World",
    price: 1899,
    rating: 4.6,
    image: "/images/products/brake-disc.jpg",
    category: "brake-parts",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-006",
    name: "Brake Caliper Assembly",
    description: "Complete brake caliper assembly with mounting hardware",
    brand: "Denso",
    vendorId: "v-2",
    vendor: "Brake World",
    price: 3499,
    rating: 4.4,
    image: "/images/products/brake-caliper.jpg",
    category: "brake-parts",
    availability: true,
    deliveryTime: "2-3 days",
  },

  // ── Electrical Components ──
  {
    id: "prod-007",
    name: "Spark Plug Iridium (Set of 4)",
    description: "Iridium spark plugs for better ignition and fuel efficiency",
    brand: "NGK",
    vendorId: "v-3",
    vendor: "Spark Gears",
    price: 599,
    rating: 4.6,
    image: "/images/products/spark-plugs.jpg",
    category: "electrical",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-008",
    name: "Battery 12V 40Ah (Maintenance Free)",
    description: "Maintenance-free 12V battery with long service life",
    brand: "MICO",
    vendorId: "v-4",
    vendor: "Battery Hub",
    price: 3899,
    rating: 4.7,
    image: "/images/products/car-battery.jpg",
    category: "electrical",
    availability: true,
    deliveryTime: "Same day",
  },
  {
    id: "prod-009",
    name: "Alternator Assembly 90A",
    description: "90-amp alternator assembly for reliable electrical charging",
    brand: "Denso",
    vendorId: "v-3",
    vendor: "Spark Gears",
    price: 5299,
    rating: 4.5,
    image: "/images/products/alternator.jpg",
    category: "electrical",
    availability: true,
    deliveryTime: "2-3 days",
  },

  // ── Suspension Parts ──
  {
    id: "prod-010",
    name: "Shock Absorber Set (Front Pair)",
    description: "Front pair shock absorbers for smooth ride control",
    brand: "Bosch",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 2799,
    rating: 4.3,
    image: "/images/products/shock-absorber.jpg",
    category: "suspension",
    availability: true,
    deliveryTime: "2-3 days",
  },
  {
    id: "prod-011",
    name: "Coil Spring Kit (Rear)",
    description: "Rear coil spring kit for improved load handling and stability",
    brand: "TVS",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 3599,
    rating: 4.4,
    image: "/images/products/coil-spring.jpg",
    category: "suspension",
    availability: true,
    deliveryTime: "3-5 days",
  },
  {
    id: "prod-016",
    name: "Suspension Control Arm (Front Lower)",
    description: "Front lower control arm with premium bushings installed",
    brand: "Bosch",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 4299,
    rating: 4.2,
    image: "/images/products/control-arm.jpg",
    category: "suspension",
    availability: true,
    deliveryTime: "2-3 days",
  },

  // ── Filters ──
  {
    id: "prod-012",
    name: "Oil Filter F-101",
    description: "High-flow oil filter with anti-drainback valve protection",
    brand: "MICO",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 299,
    rating: 4.5,
    image: "/images/products/oil-filter.jpg",
    category: "filters",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-013",
    name: "Air Filter Element (Panel Type)",
    description: "Panel-type air filter for optimal engine airflow filtration",
    brand: "Valeo",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 449,
    rating: 4.3,
    image: "/images/products/air-filter.jpg",
    category: "filters",
    availability: true,
    deliveryTime: "2-3 days",
  },
  {
    id: "prod-014",
    name: "Cabin Filter (Activated Carbon)",
    description: "Activated carbon cabin filter for fresh interior air quality",
    brand: "Valeo",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 549,
    rating: 4.4,
    image: "/images/products/cabin-filter.jpg",
    category: "filters",
    availability: true,
    deliveryTime: "2-3 days",
  },

  // ── Accessories ──
  {
    id: "prod-015",
    name: "Car Floor Mat Set (TPE)",
    description: "TPE floor mat set with anti-slip backing for all-weather use",
    brand: "TVS",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 1199,
    rating: 4.6,
    image: "/images/products/floor-mats.jpg",
    category: "accessories",
    availability: true,
    deliveryTime: "1-2 days",
  },
  {
    id: "prod-017",
    name: "Seat Cover Set (Leatherette)",
    description: "Leatherette seat cover set with universal fit for most cars",
    brand: "TVS",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 2499,
    rating: 4.5,
    image: "/images/products/seat-covers.jpg",
    category: "accessories",
    availability: true,
    deliveryTime: "2-3 days",
  },
  {
    id: "prod-018",
    name: "Windshield Sun Shade (Foldable)",
    description: "Foldable windshield sun shade protects interior from UV rays",
    brand: "TVS",
    vendorId: "v-1",
    vendor: "Auto Parts Co.",
    price: 449,
    rating: 4.2,
    image: "/images/products/sun-shade.jpg",
    category: "accessories",
    availability: true,
    deliveryTime: "1-2 days",
  },
];

const INITIAL_FILTERS = {
  priceRange: null,
  brand: null,
  vendor: null,
  rating: null,
  availability: null,
  deliveryTime: null,
};

const initialState = {
  products: [],
  filters: { ...INITIAL_FILTERS },
  searchQuery: "",
  isLoading: false,
  error: null,
};

export const useProductStore = create(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch products from the API.
       * Falls back to demo data when the API returns empty or fails.
       */
      fetchProducts: async () => {
        set({ isLoading: true, error: null });

        try {
          const { data } = await api.get("/products");
          const products = data?.products?.length ? data.products : DEMO_PRODUCTS;
          set({ products, isLoading: false });
        } catch (error) {
          const msg =
            error.response?.data?.detail ||
            (error.response ? "Failed to load products." : "Server unreachable.");
          // Use demo data as fallback
          set({ products: DEMO_PRODUCTS, isLoading: false, error: msg });
        }
      },

      /**
       * Set the search query string.
       */
      searchProducts: (query) => set({ searchQuery: query }),

      /**
       * Set a single filter value by name.
       * Pass null to clear that filter.
       */
      setFilter: (name, value) =>
        set((state) => ({
          filters: { ...state.filters, [name]: value },
        })),

      /**
       * Reset all filters and search query to defaults.
       */
      clearFilters: () =>
        set({ filters: { ...INITIAL_FILTERS }, searchQuery: "" }),

      /**
       * Find a product by its id from the current products array.
       * Returns the product object or null.
       */
      getProductById: (id) => get().products.find((p) => p.id === id) || null,

      /**
       * Manually toggle the loading state.
       */
      setLoading: (bool) => set({ isLoading: bool }),
    }),
    { name: "product-store" },
  ),
);
