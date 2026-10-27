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
  MARKETPLACE_TABS,
  TAB_ALIASES,
  resolveTab,
} from "@/components/dashboard/DashboardTabBar";

beforeEach(() => {
  navMocks.push.mockClear();
});

describe("Nav matrix (plan: authoritative)", () => {
  it.each([
    ["customer", DASHBOARD_TABS, ["Service", "Schedule", "Vehicles", "History", "Store"]],
    ["marketplace", MARKETPLACE_TABS, ["Home", "Categories", "Search", "Cart", "Profile"]],
    ["mechanic", MECHANIC_TABS, ["Home", "Navigation", "Earnings", "History", "Support"]],
    ["garage", GARAGE_TABS, ["Home", "Jobs", "Analytics", "Garage", "Support"]],
    ["seller", SELLER_TABS, ["Dashboard", "Listings", "Sales", "Upload"]],
  ])("%s tabs are exactly the approved items", (_role, tabs, labels) => {
    expect(tabs.map((t) => t.label)).toEqual(labels);
    render(<DashboardTabBar tabs={tabs} active={tabs[0].key} onSelect={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(labels.length);
  });

  it("never renders a back arrow", () => {
    render(<DashboardTabBar active="request" onSelect={() => {}} />);
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
  });
});

describe("DashboardTabBar controlled mode", () => {
  it("marks the active tab with aria-current and the soft pill", () => {
    render(<DashboardTabBar active="schedule" onSelect={() => {}} />);
    const tab = screen.getByRole("button", { name: "Schedule" });
    expect(tab).toHaveAttribute("aria-current", "page");
    expect(tab.querySelector("span").className).toMatch(/var\(--surface-soft\)/);
    expect(screen.getByRole("button", { name: "Service" })).not.toHaveAttribute("aria-current");
  });

  it("selects in place via onSelect without navigating", () => {
    const onSelect = vi.fn();
    render(<DashboardTabBar active="request" onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("button", { name: "Vehicles" }));
    expect(onSelect).toHaveBeenCalledWith("vehicles");
    expect(navMocks.push).not.toHaveBeenCalled();
  });

  it("is a fixed glass bar with safe-area padding and ≥44px items", () => {
    const { container } = render(<DashboardTabBar active="request" onSelect={() => {}} />);
    const nav = container.querySelector('nav[aria-label="Dashboard"]');
    expect(nav.className).toMatch(/fixed/);
    expect(nav.className).toMatch(/var\(--glass-overlay-bg\)/);
    expect(nav.className).toMatch(/backdrop-blur/);
    expect(nav.className).toMatch(/safe-area-inset-bottom/);
    expect(nav.className).not.toMatch(/dark:/);
    expect(nav.style.boxShadow).toBe("var(--elevation-2)");
    for (const btn of screen.getAllByRole("button")) {
      expect(btn.className).toMatch(/min-h-\[44px\]/);
    }
  });

  it("renders a count badge when provided", () => {
    render(<DashboardTabBar tabs={GARAGE_TABS} active="dashboard" onSelect={() => {}} badges={{ jobs: 3 }} />);
    expect(screen.getByRole("button", { name: "Jobs" }).textContent).toContain("3");
  });
});

describe("DashboardTabBar link mode (deep links)", () => {
  it("deep-links to the customer dashboard tab", () => {
    render(<DashboardTabBar active="request" />);
    fireEvent.click(screen.getByRole("button", { name: "History" }));
    expect(navMocks.push).toHaveBeenCalledWith("/dashboard/customer?tab=history");
  });

  it("partner tabs push their explicit ?tab= paths", () => {
    render(<DashboardTabBar tabs={MECHANIC_TABS} />);
    fireEvent.click(screen.getByRole("button", { name: "Earnings" }));
    expect(navMocks.push).toHaveBeenCalledWith("/dashboard/mechanic?tab=earnings");
    for (const tab of [...MECHANIC_TABS, ...GARAGE_TABS, ...SELLER_TABS]) {
      expect(tab.path).toMatch(/^\/dashboard\//);
    }
  });

  it("resolveTab keeps legacy deep links working", () => {
    expect(resolveTab(MECHANIC_TABS, "jobs", TAB_ALIASES.mechanic)).toBe("home");
    expect(resolveTab(MECHANIC_TABS, "earnings", TAB_ALIASES.mechanic)).toBe("earnings");
    expect(resolveTab(MECHANIC_TABS, "bogus", TAB_ALIASES.mechanic)).toBe("home");
    expect(resolveTab(GARAGE_TABS, "analytics", TAB_ALIASES.garage)).toBe("analytics");
    expect(resolveTab(GARAGE_TABS, null, TAB_ALIASES.garage)).toBe("dashboard");
  });
});
