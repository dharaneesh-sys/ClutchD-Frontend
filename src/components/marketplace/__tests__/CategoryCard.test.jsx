// Wave-1 Task 4 (cards) — RED-first contract tests for CategoryCard + CategoryIcon.
// DESIGN.md: D1 (grounded blue, token surfaces), D3 (title-3/label-2 type),
// D4 (cards rounded-2xl), D5 (surface-card-interactive pressable),
// D8 (lucide-react ONLY — no inline SVG icon sets).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, className }) => (
    <a href={typeof href === "string" ? href : href?.pathname || "#"} className={className}>
      {children}
    </a>
  ),
}));

import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { CategoryIcon } from "@/components/marketplace/CategoryIcon";

const mpDir = path.resolve(process.cwd(), "src/components/marketplace");
const src = (f) => fs.readFileSync(path.join(mpDir, f), "utf8");

describe("CategoryCard render + nav (target unchanged)", () => {
  it("renders name + item count and links to the category route", () => {
    render(<CategoryCard category={{ id: "c1", name: "Spare Parts", productCount: 12 }} />);
    expect(screen.getByText("Spare Parts")).toBeTruthy();
    expect(screen.getByText("12 items")).toBeTruthy();
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/marketplace/categories/id?id=c1");
  });

  it("singularizes a single item", () => {
    render(<CategoryCard category={{ id: "c2", name: "Filters", productCount: 1 }} />);
    expect(screen.getByText("1 item")).toBeTruthy();
  });
});

describe("CategoryCard icon (D8 lucide only)", () => {
  it("renders a lucide icon for a mapped category", () => {
    const { container } = render(
      <CategoryCard category={{ id: "c3", name: "Engine Parts" }} icon="engine-parts" />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("CategoryIcon fallback is lucide — no inline SVG icon set", () => {
    const code = src("CategoryIcon.js");
    expect(code).toContain("lucide-react");
    expect(code).not.toContain("<svg");
    expect(code).not.toContain("<circle");
    const { container } = render(<CategoryIcon category="no-such-category" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

describe("CategoryCard contract (D1/D3/D4/D5)", () => {
  it("uses surface-card-interactive + rounded-2xl with press feedback", () => {
    render(<CategoryCard category={{ id: "c1", name: "Spare Parts", productCount: 3 }} />);
    const cls = screen.getByRole("link").className;
    expect(cls).toContain("surface-card-interactive");
    expect(cls).toContain("rounded-2xl");
    expect(cls).toContain("active-press");
  });

  it("uses sanctioned type steps for name + count", () => {
    const code = src("CategoryCard.js");
    expect(code).toMatch(/type-title-3|type-body-2/);
    expect(code).toMatch(/type-label-2/);
  });

  it("kills one-off hues: token surfaces only, no white/black hardcodes", () => {
    for (const f of ["CategoryCard.js", "CategoryIcon.js", "ProductImage.js"]) {
      expect(src(f)).not.toMatch(/bg-white\/|ring-white\/|text-white|bg-black\//);
    }
  });
});
