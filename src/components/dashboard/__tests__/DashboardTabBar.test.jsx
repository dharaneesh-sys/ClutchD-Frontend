// Wave-1 Task 3 (nav shell) — RED-first contract tests for DashboardTabBar.
// DESIGN.md: D9.2 (per-role TabBars + controlled/link modes + deep links frozen),
// D15.4.2 (M3 tabs: 3dp indicator + pill + aria-current), D4 (controls rounded-xl),
// D6 (elevation tokens, no shadow literals), D3 (type scale), zero dark-prefixed classes.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const navMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navMocks.push }),
}));

import {
  DashboardTabBar,
  DASHBOARD_TABS,
  MECHANIC_TABS,
  GARAGE_TABS,
  SELLER_TABS,
} from "@/components/dashboard/DashboardTabBar";

beforeEach(() => {
  navMocks.push.mockClear();
});

describe("DashboardTabBar controlled mode (D9.2)", () => {
  it("renders all 5 customer tabs with the frozen IA", () => {
    render(<DashboardTabBar active="request" onSelect={() => {}} />);
    expect(
      DASHBOARD_TABS.map((t) => t.label),
    ).toEqual(["Service", "Schedule", "Vehicles", "History", "Parts Store"]);
    for (const t of DASHBOARD_TABS) {
      expect(
        screen.getByRole("button", { name: t.label }),
      ).toBeInTheDocument();
    }
  });

  it("marks the active tab with aria-current + 3dp indicator + pill (D15.4.2)", () => {
    render(<DashboardTabBar active="schedule" onSelect={() => {}} />);
    const tab = screen.getByRole("button", { name: "Schedule" });
    expect(tab).toHaveAttribute("aria-current", "page");
    const indicator = tab.querySelector(".bg-primary.rounded-full");
    expect(indicator).not.toBeNull();
    expect(tab.className).toMatch(/bg-surface-soft/);
  });

  it("selects in place via onSelect without navigating", () => {
    const onSelect = vi.fn();
    render(<DashboardTabBar active="request" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Vehicles" }));
    expect(onSelect).toHaveBeenCalledWith("vehicles");
    expect(navMocks.push).not.toHaveBeenCalled();
  });

  it("tab buttons use rounded-xl + type scale + elevation token (D4/D6/D3)", () => {
    const { container } = render(
      <DashboardTabBar active="request" onSelect={() => {}} />,
    );
    const nav = container.querySelector('nav[aria-label="Dashboard"]');
    expect(nav).not.toBeNull();
    expect(nav.className).not.toMatch(/dark:/);
    expect(nav.className).not.toMatch(/0_-4px_20px/);
    expect(nav.style.boxShadow).toBe("var(--elevation-2)");
    const label = screen
      .getByRole("button", { name: "Service" })
      .querySelector("span");
    expect(label.className).toMatch(/type-label-2/);
  });
});

describe("DashboardTabBar link mode (D9.2 deep links frozen)", () => {
  it("deep-links to the customer dashboard tab", () => {
    render(<DashboardTabBar active="request" />);
    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(navMocks.push).toHaveBeenCalledWith(
      "/dashboard/customer?tab=history",
    );
  });

  it("mechanic tabs keep their explicit deep-link paths", () => {
    expect(MECHANIC_TABS.map((t) => t.key)).toEqual([
      "jobs",
      "navigation",
      "earnings",
      "store",
    ]);
    render(<DashboardTabBar active="jobs" tabs={MECHANIC_TABS} />);
    fireEvent.click(screen.getByRole("button", { name: "Earnings" }));
    expect(navMocks.push).toHaveBeenCalledWith(
      "/dashboard/mechanic?tab=earnings",
    );
  });

  it("garage and seller tab sets keep keys + paths", () => {
    expect(GARAGE_TABS.map((t) => t.key)).toEqual([
      "dashboard",
      "profile",
      "analytics",
      "store",
    ]);
    expect(SELLER_TABS.map((t) => t.key)).toEqual([
      "dashboard",
      "listings",
      "sales",
      "upload",
    ]);
    for (const tab of [...GARAGE_TABS, ...SELLER_TABS]) {
      // Parts Store tabs surface the primary commerce route (D10);
      // the rest deep-link back to their role dashboard.
      expect(tab.path).toMatch(tab.key === "store" ? /^\/marketplace$/ : /^\/dashboard\//);
    }
  });
});
