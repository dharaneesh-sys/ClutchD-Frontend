// Wave-1 Task 4 (cards) — RED-first contract tests for ProductCard + GlassCard.
// DESIGN.md: D1 (grounded blue, no one-off hues), D3 (type scale),
// D4 (cards rounded-2xl), D5 (glass-lux pair only), D8 (lucide only),
// D11 (44px targets, focus-visible), D15.4.3 (cards map to glass pair).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";

const navMocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navMocks.push }),
  usePathname: () => "/marketplace",
}));
vi.mock("next/link", () => ({
  default: ({ href, children }) => <a href={typeof href === "string" ? href : href?.pathname || "#"}>{children}</a>,
}));
vi.mock("@/lib/api", () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

import { ProductCard } from "@/components/marketplace/ProductCard";
import { formatCurrency } from "@/lib/utils";

const mpDir = path.resolve(process.cwd(), "src/components/marketplace");
const uiDir = path.resolve(process.cwd(), "src/components/ui");
const src = (dir, f) => fs.readFileSync(path.join(dir, f), "utf8");

const product = {
  id: "p1",
  name: "Brake Pad Set",
  description: "Ceramic front brake pads",
  price: 1299,
  rating: 4.5,
  image: null,
  brand: "Bosch",
  availability: true,
  vendor: "AutoHub",
  vendorId: "v1",
};

beforeEach(() => {
  navMocks.push.mockClear();
});

describe("ProductCard render + behavior (API/nav frozen)", () => {
  it("renders name, formatted price, and rating", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByText("Brake Pad Set")).toBeTruthy();
    expect(screen.getByText(formatCurrency(1299))).toBeTruthy();
    expect(screen.getByText("4.5")).toBeTruthy();
  });

  it("renders nothing without a product", () => {
    const { container } = render(<ProductCard product={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("navigates to the product route on card click (target unchanged)", () => {
    const { container } = render(<ProductCard product={product} />);
    fireEvent.click(container.querySelector('[role="button"]'));
    expect(navMocks.push).toHaveBeenCalledWith("/marketplace/product/id?id=p1");
  });

  it("keeps equal-height flex discipline", () => {
    const { container } = render(<ProductCard product={product} />);
    expect(container.firstChild.className).toContain("flex-col");
    expect(container.firstChild.className).toContain("h-full");
  });
});

describe("ProductCard contract (D1/D3/D4/D5/D8/D11/D15)", () => {
  it("uses glass-lux-interactive pressable + rounded-2xl, keeps hover-lift/active-press", () => {
    const { container } = render(<ProductCard product={product} />);
    const cls = container.firstChild.className;
    expect(cls).toContain("glass-lux-interactive");
    expect(cls).toContain("rounded-2xl");
    expect(cls).toContain("hover-lift");
    expect(cls).toContain("active-press");
  });

  it("kills one-off hues: no purple, no warning token, no white/black hardcodes", () => {
    const code = src(mpDir, "ProductCard.js");
    expect(code).not.toMatch(/purple-/);
    expect(code).not.toMatch(/fill-warning|var\(--warning\)/);
    expect(code).not.toMatch(/#8b5cf6/);
    expect(code).not.toMatch(/text-white(?!\/)|bg-black\/|bg-white\//);
  });

  it("uses lucide icons only (Star/ShoppingCart/Check/Crown/Heart), no emoji, no inline svg", () => {
    const code = src(mpDir, "ProductCard.js");
    expect(code).toContain("lucide-react");
    expect(code).not.toContain("<svg");
  });
});

describe("GlassCard flat default (DESIGN.md §0)", () => {
  it("defaults to the flat card; legacy names are aliases, glass is the overlay", () => {
    const code = src(uiDir, "GlassCard.js");
    expect(code).toMatch(/variant\s*=\s*"card"/);
    expect(code).toContain('"glass-lux": flatCard');
    expect(code).toContain("glass: glassOverlay");
    expect(code).not.toMatch(/glass-strong|glass-lux-strong|surface-elevated|surface-filled|surface-outlined/);
  });
});
