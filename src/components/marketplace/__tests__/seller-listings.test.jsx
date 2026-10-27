// Wave-4 Task 10 (customer + seller dashboards + upload) — RED-first tests.
// DESIGN.md: D1 (grounded blue, token surfaces only), D4 (cards rounded-2xl,
// controls rounded-xl), D5 (glass-lux pair only), D7 (info rename + pending
// amber, no --warning), D8 (lucide only, no emoji), D9 (tab IA + upload route
// frozen), D15 (M3 roles, token CTAs). Routes/data/upload logic identical.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard/seller",
}));
const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("@/lib/api", () => ({ default: apiMocks }));

import { MyListings } from "@/components/marketplace/MyListings";
import { SellerProductForm } from "@/components/marketplace/SellerProductForm";
import { useProductStore } from "@/store/productStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";

const dashDir = path.resolve(process.cwd(), "src/components/dashboard");
const mpDir = path.resolve(process.cwd(), "src/components/marketplace");
const appDashSeller = path.resolve(process.cwd(), "src/app/dashboard/seller");
const appDashCustomer = path.resolve(process.cwd(), "src/app/dashboard/customer");
const src = (dir, f) => fs.readFileSync(path.join(dir, f), "utf8");

const SELLER = { id: "sel-1", role: "seller", name: "Parts Bazaar" };
const LISTING = {
  id: "prod-1",
  name: "Brake Pad Set",
  price: 1249,
  brand: "Bosch",
  category: "brakes",
  description: "Front brake pads, fits Swift 2018+",
  availability: true,
  deliveryTime: "2-3 days",
  image: "/static/uploads/pad.png",
};

function resetStores() {
  window.localStorage.clear();
  useToastStore.getState().clearToasts();
  useAuthStore.setState({ user: SELLER, isAuthenticated: true });
  useProductStore.setState({ products: [], sellerProducts: [], sellerSales: [] });
}

beforeEach(() => {
  resetStores();
  vi.clearAllMocks();
  apiMocks.get.mockResolvedValue({ data: { products: [] } });
  apiMocks.post.mockResolvedValue({ data: LISTING });
});

describe("MyListings render + behavior (routes/data frozen)", () => {
  it("surfaces store listings first: name, price, stock badge per listing", async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [LISTING] } });
    render(<MyListings />);
    expect(await screen.findByText("Brake Pad Set")).toBeTruthy();
    expect(screen.getByText("In Stock")).toBeTruthy();
  });

  it("shows Out of Stock for unavailable listings", async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [{ ...LISTING, availability: false }] } });
    render(<MyListings />);
    expect(await screen.findByText("Out of Stock")).toBeTruthy();
  });

  it("exposes edit / stock-toggle / delete actions with stable aria-labels", async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [LISTING] } });
    render(<MyListings />);
    await screen.findByText("Brake Pad Set");
    expect(screen.getByLabelText("Edit Brake Pad Set")).toBeTruthy();
    expect(screen.getByLabelText("Toggle stock for Brake Pad Set")).toBeTruthy();
    expect(screen.getByLabelText("Delete Brake Pad Set")).toBeTruthy();
  });

  it("empty state offers the Sell action when onAddNew is wired", async () => {
    const onAddNew = vi.fn();
    render(<MyListings onAddNew={onAddNew} />);
    expect(await screen.findByText("No listings yet")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sell a part" }));
    expect(onAddNew).toHaveBeenCalledTimes(1);
  });

  it("delete flow asks for confirmation with the listing name", async () => {
    apiMocks.get.mockResolvedValue({ data: { products: [LISTING] } });
    render(<MyListings />);
    await screen.findByText("Brake Pad Set");
    fireEvent.click(screen.getByLabelText("Delete Brake Pad Set"));
    expect(await screen.findByText("Remove listing?")).toBeTruthy();
    expect(screen.getByText(/will be removed from the marketplace/)).toBeTruthy();
  });
});

describe("SellerProductForm validation (upload logic frozen)", () => {
  it("renders the required field chrome: name, price, description, photo", () => {
    render(<SellerProductForm />);
    expect(screen.getByText("Part name *")).toBeTruthy();
    expect(screen.getByText("Price (₹) *")).toBeTruthy();
    expect(screen.getByText("Description *")).toBeTruthy();
    expect(screen.getByText("Part photo *")).toBeTruthy();
    expect(screen.getByRole("button", { name: "List part for sale" })).toBeTruthy();
  });

  it("rejects an empty submit with field errors (name, price, description, photo)", async () => {
    render(<SellerProductForm />);
    fireEvent.click(screen.getByRole("button", { name: "List part for sale" }));
    expect(await screen.findByText("Enter a part name (min 3 chars)")).toBeTruthy();
    expect(await screen.findByText("Describe the part (min 10 chars)")).toBeTruthy();
    expect(await screen.findByText("Upload a photo of the part")).toBeTruthy();
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it("rejects a zero price without calling the API", async () => {
    render(<SellerProductForm />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Brake Pad Set (Front)"), {
      target: { value: "Brake Pad Set" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. 1249"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "List part for sale" }));
    await waitFor(() => expect(apiMocks.post).not.toHaveBeenCalled());
    expect(await screen.findByText("Enter a price greater than 0")).toBeTruthy();
  });

  it("blocks non-seller roles with a toast and no API call", async () => {
    // Offline photo path (readAsDataURL) keeps the test hermetic: no canvas,
    // no /uploads POST — the picked photo becomes a data URL, the form
    // validates, and the role guard fires before any API call.
    Object.defineProperty(window.navigator, "onLine", { value: false, configurable: true });
    try {
      useAuthStore.setState({ user: { id: "cus-1", role: "customer", name: "Cathy" } });
      const { container } = render(<SellerProductForm />);
      fireEvent.change(screen.getByPlaceholderText("e.g. Brake Pad Set (Front)"), {
        target: { value: "Brake Pad Set" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. 1249"), {
        target: { value: "1249" },
      });
      fireEvent.change(screen.getByPlaceholderText(/Condition, fitment/), {
        target: { value: "Front brake pads, fits Swift 2018 and later" },
      });
      const file = new File(["fake-image-bytes"], "part.png", { type: "image/png" });
      fireEvent.change(container.querySelector('input[type="file"]'), {
        target: { files: [file] },
      });
      expect(await screen.findByText("part.png")).toBeTruthy();
      // Wait for the offline data-URL upload to populate the image field —
      // submitting earlier trips the required-photo validation instead.
      expect(await screen.findByAltText("Part preview")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "List part for sale" }));
      await waitFor(() => {
        const errors = useToastStore.getState().toasts.filter((t) => t.type === "error");
        expect(errors.length).toBeGreaterThan(0);
      });
      expect(apiMocks.post).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window.navigator, "onLine", { value: true, configurable: true });
    }
  });

  it("edit mode keeps the Save-changes label and prefilled values", () => {
    render(<SellerProductForm initialProduct={LISTING} onSuccess={() => {}} />);
    expect(screen.getByRole("button", { name: "Save changes" })).toBeTruthy();
    expect(screen.getByDisplayValue("Brake Pad Set")).toBeTruthy();
  });
});

describe("MyListings contract (D1/D4/D5/D7/D15)", () => {
  it("kills white surface hardcodes + red one-off hues: token badges only", () => {
    const code = src(mpDir, "MyListings.js");
    expect(code).not.toMatch(/bg-white\/10/);
    expect(code).not.toMatch(/hover:bg-white\/10/);
    expect(code).not.toMatch(/red-400|red-500/);
  });

  it("keeps glass-lux card + rounded-2xl + shared stock language", () => {
    const code = src(mpDir, "MyListings.js");
    expect(code).toContain("glass-lux rounded-2xl");
    expect(code).toContain("In Stock");
    expect(code).toContain("Out of Stock");
    expect(code).toContain("SellerProductForm");
  });
});

describe("SellerProductForm contract (D1/D4/D5/D15)", () => {
  it("renders field errors in the danger token, never red-500 literals", () => {
    const code = src(mpDir, "SellerProductForm.js");
    expect(code).not.toMatch(/text-red-500/);
    expect(code).toContain("glass-lux rounded-2xl");
    expect(code).toContain("accent-[var(--primary)]");
  });

  it("keeps upload/business logic identical: backend-first upload, category fallback, submit lock", () => {
    const code = src(mpDir, "SellerProductForm.js");
    expect(code).toContain('api.post("/uploads"');
    expect(code).toContain("spare-parts");
    expect(code).toContain("submitLock");
    expect(code).toContain("addSellerProduct");
    expect(code).toContain("updateSellerProduct");
  });
});

describe("seller dashboard page contract (D1/D4/D8/D9/D15)", () => {
  it("kills the welcome emoji (D8 lucide-only) + white CTA text (token CTAs)", () => {
    const code = src(appDashSeller, "page.js");
    expect(code).not.toContain("👋");
    expect(code).not.toMatch(/text-white/);
  });

  it("surfaces store listings first: Recent listings + View all + MyListings + upload entry", () => {
    const code = src(appDashSeller, "page.js");
    expect(code).toContain("Recent listings");
    expect(code).toContain("View all");
    expect(code).toContain("MyListings");
    expect(code).toContain("/dashboard/seller/upload");
    expect(code).toContain("SalesList");
  });

  it("keeps tabs/routes/data flow identical", () => {
    const code = src(appDashSeller, "page.js");
    expect(code).toContain('VALID_TABS = ["dashboard", "listings", "sales"]');
    expect(code).toContain("fetchMyListings");
    expect(code).toContain("fetchSellerSales");
    expect(code).toContain('router.push("/marketplace")');
  });
});

describe("seller upload page contract (D9 routes frozen)", () => {
  it("keeps back-nav, listing count, SellerProductForm success-redirect identical", () => {
    const code = src(appDashSeller, "upload/page.js");
    expect(code).toContain('fallback="/dashboard/seller"');
    expect(code).toContain("SellerProductForm");
    expect(code).toContain('router.push("/dashboard/seller")');
    expect(code).toContain("listing");
    expect(code).toContain('router.push("/marketplace")');
  });
});

describe("customer dashboard contract (D1/D2/D5/D7)", () => {
  it("kills stone/zinc skeletons, dark: branches, hardcoded brand hex", () => {
    const code = src(appDashCustomer, "page.js");
    expect(code).not.toMatch(/stone-|zinc-/);
    expect(code).not.toMatch(/dark:/);
    expect(code).not.toMatch(/\[#[0-9A-Fa-f]{6}\]/);
  });

  it("kills red one-off hues on the chat FAB (danger token only)", () => {
    const code = src(appDashCustomer, "page.js");
    expect(code).not.toMatch(/red-500|red-400/);
  });

  it("keeps tabs/routes/data flow identical", () => {
    const code = src(appDashCustomer, "page.js");
    expect(code).toContain("DashboardTabBar");
    expect(code).toContain("ServiceStatusTracker");
    expect(code).toContain("VehicleList");
    expect(code).toContain("ServiceHistory");
    expect(code).toContain("restoreActiveRequest");
  });
});

describe("VehicleList contract (D1/D5/D7/D15)", () => {
  it("kills legacy strong variant, green one-off, glow shadows, warning badge", () => {
    const code = src(dashDir, "VehicleList.js");
    expect(code).not.toContain('variant="strong"');
    expect(code).not.toMatch(/text-green-400/);
    expect(code).not.toMatch(/shadow-\[0_0_/);
    expect(code).not.toMatch(/"warning"/);
  });

  it("keeps vehicle/data flow identical", () => {
    const code = src(dashDir, "VehicleList.js");
    expect(code).toContain('api.get("/vehicles")');
    expect(code).toContain('api.get("/jobs/history")');
    expect(code).toContain("VehicleManagerModal");
  });
});

describe("ServiceHistory contract (D1/D5/D7/D15)", () => {
  it("kills legacy strong variant, red literals, primary-strong fill", () => {
    const code = src(dashDir, "ServiceHistory.js");
    expect(code).not.toContain('variant="strong"');
    expect(code).not.toMatch(/text-red-500|border-red-500|bg-red-500|red-400|red-50|red-200/);
    expect(code).not.toContain("bg-primary-strong");
  });

  it("keeps history/data flow identical", () => {
    const code = src(dashDir, "ServiceHistory.js");
    expect(code).toContain('api.get("/jobs/history")');
    expect(code).toContain("PaymentModal");
    expect(code).toContain("downloadJobInvoice");
    expect(code).toContain("WarrantyTerms");
  });
});

describe("ServiceStatusTracker contract (D1/D5/D7/D15)", () => {
  it("kills legacy strong variant, emerald glow, ghost tokens, red literals", () => {
    const code = src(dashDir, "ServiceStatusTracker.js");
    expect(code).not.toContain('variant="strong"');
    expect(code).not.toMatch(/bg-primary-strong|text-primary-text/);
    expect(code).not.toMatch(/16,185,129/);
    expect(code).not.toMatch(/red-400|red-300/);
  });

  it("keeps status/progress/data flow identical", () => {
    const code = src(dashDir, "ServiceStatusTracker.js");
    expect(code).toContain("EscrowStatus");
    expect(code).toContain("WarrantyTerms");
    expect(code).toContain("currentStepIdx");
    expect(code).toContain("onReleasePayment");
  });
});
