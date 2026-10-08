// Wave-2 Task 6 (cart + checkout commerce flow) — RED-first contract tests.
// DESIGN.md: D1 (grounded blue, token surfaces only, BAN list),
// D4 (cards rounded-2xl, controls rounded-xl), D5 (glass-lux pair only),
// D6 (hover-lift only, no glow), D7 (info rename + pending amber, no --warning),
// D8 (lucide only), D15 (M3 roles, tabular numerals on totals).
// Pricing/escrow logic + routes stay identical — behavior tests lock that.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }) => (
    <a href={typeof href === "string" ? href : href?.pathname || "#"} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

import { useCartStore } from "@/store/cartStore";
import { OrderTimeline } from "@/components/marketplace/OrderTimeline";

const cartPageDir = path.resolve(process.cwd(), "src/app/marketplace/cart");
const checkoutPageDir = path.resolve(process.cwd(), "src/app/marketplace/checkout");
const mpDir = path.resolve(process.cwd(), "src/components/marketplace");
const dashDir = path.resolve(process.cwd(), "src/components/dashboard");
const src = (dir, f) => fs.readFileSync(path.join(dir, f), "utf8");

describe("cart page commerce restyle (D1/D4/D5/D6/D15)", () => {
  const code = src(cartPageDir, "page.js");

  it("kills btn-glow + white CTA text: shared Button/EmptyState language only", () => {
    expect(code).not.toContain("btn-glow");
    expect(code).not.toMatch(/text-white/);
    expect(code).toContain("EmptyState");
  });

  it("kills glass-lux-strong + white surface hardcodes", () => {
    expect(code).not.toContain("glass-lux-strong");
    expect(code).not.toMatch(/border-white\/|bg-white\//);
  });

  it("kills raw red hues: danger token only", () => {
    expect(code).not.toMatch(/text-red-400|border-red-500/);
  });

  it("keeps pricing/coupon/cart logic + totals tabular identical", () => {
    expect(code).toContain("DELIVERY_FREE_THRESHOLD");
    expect(code).toContain("DELIVERY_CHARGE");
    expect(code).toContain("applyCoupon");
    expect(code).toContain("updateQuantity");
    expect(code).toContain("removeItem");
    expect(code).toContain("formatCurrency");
    expect(code).toContain("/marketplace/checkout");
    expect(code).toContain("tabular-nums");
  });
});

describe("checkout page commerce restyle (D1/D4/D5/D6/D15)", () => {
  const code = src(checkoutPageDir, "page.js");

  it("kills btn-glow + glass-lux-strong + white CTA text", () => {
    expect(code).not.toContain("btn-glow");
    expect(code).not.toContain("glass-lux-strong");
    expect(code).not.toMatch(/text-white/);
  });

  it("kills white surface hardcodes + raw red hues", () => {
    expect(code).not.toMatch(/border-white\/|bg-white\//);
    expect(code).not.toMatch(/text-red-400|border-red-500|focus:border-red-500/);
  });

  it("keeps address validation + placeOrder + shipping/payment flow identical", () => {
    expect(code).toContain("validateForm");
    expect(code).toContain("placeOrder");
    expect(code).toContain("shippingMethod");
    expect(code).toContain("pickupLocation");
    expect(code).toContain("PAYMENT_METHODS");
    expect(code).toContain("STORE_LOCATIONS");
    expect(code).toContain("tabular-nums");
  });
});

describe("OrderTimeline restyle (D1/D7/D11: rose killed, motion capped)", () => {
  const code = src(mpDir, "OrderTimeline.js");

  it("kills rose one-off hue + white hardcodes + custom pulse keyframes", () => {
    expect(code).not.toMatch(/rose-500|rose-400|rose-300/);
    expect(code).not.toMatch(/bg-white\/|border-white\//);
    expect(code).not.toContain("pulse-ring");
    expect(code).not.toContain("16, 185, 129");
    expect(code).not.toContain("<style jsx>");
  });

  it("keeps delivery/bopis flows + statusHistory + cancelled logic identical", () => {
    expect(code).toContain("ready_for_pickup");
    expect(code).toContain("picked_up");
    expect(code).toContain("statusHistory");
    expect(code).toContain("Order cancelled");
    expect(code).toContain('flowType = "delivery"');
  });

  it("renders cancelled banner with danger tokens, no rose in DOM", () => {
    const { container } = render(<OrderTimeline status="cancelled" flowType="delivery" />);
    expect(screen.getByText("Order cancelled")).toBeTruthy();
    expect(container.querySelector('[class*="rose"]')).toBeNull();
  });

  it("renders delivery steps with per-step labels", () => {
    render(<OrderTimeline status="shipped" flowType="delivery" />);
    expect(screen.getByText("Order Placed")).toBeTruthy();
    expect(screen.getByText("Shipped")).toBeTruthy();
    expect(screen.getByText("Delivered")).toBeTruthy();
  });
});

describe("SalesList restyle (D1/D7: status tokens, zero dark:)", () => {
  const code = src(mpDir, "SalesList.js");

  it("kills dark: branches + emerald/red/amber raw hues", () => {
    expect(code).not.toMatch(/dark:/);
    expect(code).not.toMatch(/emerald-|text-red-600|text-amber-600/);
  });

  it("maps statuses to D7 tokens, keeps sales data flow identical", () => {
    expect(code).toMatch(/text-success/);
    expect(code).toMatch(/text-pending/);
    expect(code).toMatch(/text-danger/);
    expect(code).toContain("fetchSellerSales");
    expect(code).toContain("formatCurrency");
    expect(code).toContain("No sales yet");
  });
});

describe("EscrowStatus restyle (D4/D7: info rename, danger tokens, card radii)", () => {
  const code = src(dashDir, "EscrowStatus.js");

  it("kills --warning usages + raw red + white hardcodes", () => {
    expect(code).not.toMatch(/bg-warning|text-warning|var\(--warning\)/);
    expect(code).not.toMatch(/red-400|red-500|red-300/);
    expect(code).not.toMatch(/bg-white\/|border-white\//);
  });

  it("uses rounded-2xl cards + keeps escrow state machine identical", () => {
    expect(code).toContain("rounded-2xl");
    expect(code).toContain("PAYMENT_ESCROW");
    expect(code).toContain("PAYMENT_RELEASED");
    expect(code).toContain("PAYMENT_DISPUTE");
    expect(code).toContain("onRelease");
    expect(code).toContain("onDispute");
  });
});

describe("PaymentModal commerce polish (D1/D15: tabular totals, no glow)", () => {
  const code = src(dashDir, "PaymentModal.js");

  it("grounds totals in tabular numerals, kills glow/hover-glow escapes", () => {
    expect(code).toMatch(/tabular-nums/);
    expect(code).not.toMatch(/btn-glow|hover-glow/);
  });

  it("keeps pricing breakdown + Razorpay verify + cash/QR flow identical", () => {
    expect(code).toContain("totalAmount");
    expect(code).toContain("GST_RATE");
    expect(code).toContain("/payments/verify");
    expect(code).toContain("handleCashPayment");
    expect(code).toContain("handleQRPayment");
  });
});

describe("cartStore pricing logic kept identical (regression guard)", () => {
  const product = { id: "p1", price: 100, name: "Brake Pad", image: null };
  const vendor = { id: "v1" };

  beforeEach(() => {
    useCartStore.setState({ items: [], couponCode: "", discount: 0, isLoading: false });
    if (typeof localStorage !== "undefined") localStorage.clear();
  });

  it("addItem appends at qty 1 and increments existing line", () => {
    useCartStore.getState().addItem(product, vendor);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    useCartStore.getState().addItem(product, vendor);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it("updateQuantity(0) removes the line; getTotal nets discount", () => {
    useCartStore.getState().addItem(product, vendor);
    useCartStore.getState().updateQuantity("p1", 3);
    expect(useCartStore.getState().getTotal()).toBe(300);
    useCartStore.setState({ discount: 50 });
    expect(useCartStore.getState().getTotal()).toBe(250);
    useCartStore.getState().updateQuantity("p1", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removeItem drops the line; getItemCount sums quantities", () => {
    useCartStore.getState().addItem(product, vendor);
    useCartStore.getState().addItem({ id: "p2", price: 49, name: "Bolt" }, vendor);
    useCartStore.getState().updateQuantity("p2", 2);
    expect(useCartStore.getState().getItemCount()).toBe(3);
    useCartStore.getState().removeItem("p1");
    expect(useCartStore.getState().items.map((i) => i.productId)).toEqual(["p2"]);
  });
});
