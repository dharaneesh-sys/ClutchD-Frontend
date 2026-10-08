// Wave-2 Task 5 (marketplace browse, store-PRIMARY) — RED-first contract tests.
// DESIGN.md: D1 (grounded blue, token surfaces only), D3 (type scale),
// D4 (cards rounded-2xl, controls rounded-xl), D5 (glass-lux pair only),
// D7 (info rename + pending amber, no --warning), D8 (lucide only),
// D10 (store PRIMARY hierarchy), D11 (motion-4 cap, density-5),
// D15 (M3 roles, grounded-blue CTAs).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, className }) => (
    <a href={typeof href === "string" ? href : href?.pathname || "#"} className={className}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/api", () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { reviews: [] } }), post: vi.fn(), delete: vi.fn() },
}));

import { SearchFilters } from "@/components/marketplace/SearchFilters";
import { VendorComparisonTable } from "@/components/marketplace/VendorComparisonTable";
import { ProductReviews } from "@/components/marketplace/ProductReviews";

const appMp = path.resolve(process.cwd(), "src/app/marketplace");
const mpDir = path.resolve(process.cwd(), "src/components/marketplace");
const src = (dir, f) => fs.readFileSync(path.join(dir, f), "utf8");

const MOTIONS = ["page-enter", "modal-in", "backdrop-in", "fade-in-up", "scale-in"];
const distinctMotions = (code) => MOTIONS.filter((m) => code.includes(m));

describe("marketplace home store-PRIMARY (D1/D10/D11)", () => {
  const code = src(appMp, "page.js");

  it("kills legacy input-glass + white CTA text: token CTAs only", () => {
    expect(code).not.toContain("input-glass");
    expect(code).not.toMatch(/text-white/);
  });

  it("kills white/black surface hardcodes", () => {
    expect(code).not.toMatch(/bg-white\/|ring-white\/|bg-black\//);
  });

  it("keeps tileCounts single-source-of-truth + favorites heart + nav targets", () => {
    expect(code).toContain("tileCounts");
    expect(code).toContain("/marketplace/profile/favorites");
    expect(code).toContain("/marketplace/categories");
    expect(code).toContain("/marketplace/search");
    expect(code).toContain("CategoryCard");
    expect(code).toContain("ProductCard");
  });

  it("stays within motion-4 cap", () => {
    expect(distinctMotions(code).length).toBeLessThanOrEqual(4);
  });
});

describe("search page store-PRIMARY (D1/D5/D10/D11)", () => {
  const code = src(appMp, "search/page.js");

  it("kills glass-lux-strong + rose one-off hue + white hardcodes", () => {
    expect(code).not.toContain("glass-lux-strong");
    expect(code).not.toMatch(/rose-500|rose-400/);
    expect(code).not.toMatch(/bg-white\/|hover:bg-white\/|text-white/);
  });

  it("keeps dense product grid dominant + filter/sort data flow", () => {
    expect(code).toContain("grid-cols-2 md:grid-cols-3 xl:grid-cols-4");
    expect(code).toContain("SearchFilters");
    expect(code).toContain("matchesFilters");
    expect(code).toContain("sortProducts");
    expect(code).toContain("ProductCard");
  });

  it("stays within motion-4 cap", () => {
    expect(distinctMotions(code).length).toBeLessThanOrEqual(4);
  });
});

describe("SearchFilters contract (D1/D4/D7: filter logic outcomes kept)", () => {
  const code = src(mpDir, "SearchFilters.js");

  it("kills white/black surface hardcodes, keeps token surfaces", () => {
    expect(code).not.toMatch(/bg-white\/|hover:bg-white\/|bg-black\//);
    expect(code).not.toMatch(/text-white/);
  });

  it("active filter chips stay grounded-blue", () => {
    expect(code).toMatch(/bg-primary\/20 text-primary-light/);
  });

  it("renders categories + toggles selection without changing outcomes", () => {
    const onFilterChange = vi.fn();
    render(
      <SearchFilters
        filters={{ categories: null, priceRange: null, brand: null, availability: null }}
        onFilterChange={onFilterChange}
        onClear={vi.fn()}
        onMobileClose={null}
      />
    );
    expect(screen.getByText("Category")).toBeTruthy();
    expect(screen.getByText("Price Range")).toBeTruthy();
    const boxes = screen.getAllByText("Accessories");
    fireEvent.click(boxes[0]);
    expect(onFilterChange).toHaveBeenCalledWith("categories", expect.any(Array));
  });

  it("clear-all affordance kept when filters active", () => {
    const onClear = vi.fn();
    render(
      <SearchFilters
        filters={{ categories: ["accessories"], priceRange: null, brand: null, availability: null }}
        onFilterChange={vi.fn()}
        onClear={onClear}
        onMobileClose={null}
      />
    );
    fireEvent.click(screen.getByText("Clear all"));
    expect(onClear).toHaveBeenCalled();
  });
});

describe("categories screens store-PRIMARY (D1/D10)", () => {
  it("categories index kills white hardcodes, keeps CategoryCard tiles", () => {
    const code = src(appMp, "categories/page.js");
    expect(code).not.toMatch(/bg-white\/|text-white/);
    expect(code).toContain("CategoryCard");
    expect(code).toContain("/marketplace");
  });

  it("category detail kills white hardcodes, keeps grid + back nav + data flow", () => {
    const code = src(mpDir, "../../app/marketplace/categories/id/client.js");
    expect(code).not.toMatch(/bg-white\/5/);
    expect(code).toContain("ProductCard");
    expect(code).toContain("/marketplace/categories");
    expect(code).toContain("filteredProducts");
    expect(distinctMotions(code).length).toBeLessThanOrEqual(4);
  });
});

describe("VendorComparisonTable contract (D1/D5/D7: table kept, hues killed)", () => {
  const code = src(mpDir, "VendorComparisonTable.js");

  it("kills glass-lux-strong + white hardcodes + raw red text", () => {
    expect(code).not.toContain("glass-lux-strong");
    expect(code).not.toMatch(/bg-white\/|hover:bg-white\/|border-white\//);
    expect(code).not.toMatch(/text-red-400/);
  });

  it("best-price/rated highlights stay in blue family", () => {
    expect(code).toMatch(/text-icon-highlight/);
    expect(code).not.toMatch(/purple-|#8b5cf6/);
  });

  it("empty state kept for products without vendor pricing", () => {
    render(<VendorComparisonTable productId="p1" product={{ image: null }} />);
    expect(screen.getByText("Compare Vendor Pricing")).toBeTruthy();
    expect(screen.getByText(/No vendor pricing available/)).toBeTruthy();
  });
});

describe("ProductReviews contract (D1/D7/D8: review flow kept, hues killed)", () => {
  const code = src(mpDir, "ProductReviews.js");

  it("kills warning token + neon glow + green/red raw hues + white hardcodes", () => {
    expect(code).not.toMatch(/fill-warning|var\(--warning\)/);
    expect(code).not.toMatch(/drop-shadow-\[/);
    expect(code).not.toMatch(/green-500|green-400|red-500|red-400/);
    expect(code).not.toMatch(/fill-white\/10|text-white\/30|bg-white\/5/);
  });

  it("keeps review submit flow + empty state + verified affordance", () => {
    expect(code).toContain("Write a Review");
    expect(code).toContain("No reviews yet");
    expect(code).toContain("Verified");
    expect(code).toContain("handleSubmitReview");
  });

  it("renders empty state for products without reviews", async () => {
    render(<ProductReviews productId="p1" />);
    expect(await screen.findByText("No reviews yet")).toBeTruthy();
  });
});

describe("product detail store-PRIMARY (D1/D7/D10/D15)", () => {
  const code = src(mpDir, "../../app/marketplace/product/id/client.js");

  it("kills warning/red raw hues + white hardcodes, keeps grounded-blue CTAs", () => {
    expect(code).not.toMatch(/fill-warning|border-warning|bg-warning\/|text-warning/);
    expect(code).not.toMatch(/red-500|red-400|red-300/);
    expect(code).not.toMatch(/bg-white\/5|ring-white\/10/);
  });

  it("keeps fitment + cart + related data flow and back nav identical", () => {
    expect(code).toContain("VehicleSelector");
    expect(code).toContain("Add to Cart");
    expect(code).toContain("Related Products");
    expect(code).toContain("Back to Marketplace");
    expect(code).toContain("handleCheckFitment");
    expect(code).toContain("handleAddToCart");
  });

  it("VehicleSelector kills white hardcodes, keeps cascade + persistence", () => {
    const vcode = src(mpDir, "VehicleSelector.js");
    expect(vcode).not.toMatch(/bg-white\/|hover:bg-white\//);
    expect(vcode).toContain("clutchd-selected-vehicle");
    expect(vcode).toContain("onVehicleChange");
  });
});
