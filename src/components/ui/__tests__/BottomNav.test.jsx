// Wave-1 Task 3 (nav shell) — RED-first contract tests for BottomNav.
// DESIGN.md: D2 (light-first, zero dark-prefixed classes, toggle only in settings + Menu popover),
// D9.1 (6-item IA frozen, Menu popover w/ profile links + inline SOS + theme row),
// D15.4.1 (M3 nav-bar: active-indicator pill, badge role), D4 (popovers rounded-2xl),
// D5 (glass-lux only).
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const navMocks = vi.hoisted(() => ({
  push: vi.fn(),
  path: "/marketplace",
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navMocks.push }),
  usePathname: () => navMocks.path,
}));

const sosMocks = vi.hoisted(() => ({
  sos: {
    loading: false,
    status: "idle",
    errorMsg: null,
    queuedMsg: null,
    isOnline: true,
    handleSOS: vi.fn(),
    handleConfirm: vi.fn(),
    dismissMessages: vi.fn(),
  },
}));
vi.mock("@/components/ui/useSOS", () => ({
  useSOS: () => sosMocks.sos,
}));

import { BottomNav } from "@/components/ui/BottomNav";
import { useCartStore } from "@/store/cartStore";
import { themeStore } from "@/store/themeStore";

const ITEMS = ["Home", "Categories", "Search", "Cart", "Profile", "Menu"];

beforeEach(() => {
  navMocks.push.mockClear();
  sosMocks.sos.handleSOS.mockClear();
  sosMocks.sos.loading = false;
  sosMocks.sos.status = "idle";
  sosMocks.sos.queuedMsg = null;
  navMocks.path = "/marketplace";
  useCartStore.setState({ items: [] });
  themeStore.setState({ theme: "light" });
  document.documentElement.setAttribute("data-theme", "light");
});

describe("BottomNav IA (D9.1 frozen)", () => {
  it("renders all 6 nav items in order, no more, no fewer", () => {
    render(<BottomNav />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((b) => b.getAttribute("aria-label"));
    expect(labels).toEqual(ITEMS);
  });

  it("marks Home active via aria-current on /marketplace", () => {
    render(<BottomNav />);
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("button", { name: "Search" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks Search active on its route", () => {
    navMocks.path = "/marketplace/search";
    render(<BottomNav />);
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("navigates to the item path on tap (IA routes unchanged)", () => {
    render(<BottomNav />);
    fireEvent.click(screen.getByRole("button", { name: "Cart" }));
    expect(navMocks.push).toHaveBeenCalledWith("/marketplace/cart");
  });

  it("active destination carries the M3 active-indicator pill (D15.4.1)", () => {
    render(<BottomNav />);
    const home = screen.getByRole("button", { name: "Home" });
    const pill = home.querySelector(".bg-surface-soft.rounded-full");
    expect(pill).not.toBeNull();
  });
});

describe("BottomNav cart badge (M3 badge role, D15.4.1)", () => {
  it("shows the item count badge", () => {
    useCartStore.setState({
      items: [{ productId: "p1", quantity: 2, product: {}, vendor: {} }],
    });
    render(<BottomNav />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("caps the badge at 99+", () => {
    useCartStore.setState({
      items: [{ productId: "p1", quantity: 150, product: {}, vendor: {} }],
    });
    render(<BottomNav />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("hides the badge when the cart is empty", () => {
    render(<BottomNav />);
    const cart = screen.getByRole("button", { name: "Cart" });
    expect(cart.querySelector(".bg-danger")).toBeNull();
  });
});

describe("BottomNav Menu popover (D9.1 frozen behavior)", () => {
  function openMenu() {
    cleanup();
    render(<BottomNav />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
  }

  it("opens with profile links, inline SOS row, and theme row", () => {
    openMenu();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Emergency SOS" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("uses glass-lux + rounded-2xl (D4/D5), no dark-prefixed classes", () => {
    openMenu();
    const menu = screen.getByRole("button", { name: "Menu" });
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    expect(menu.getAttribute("aria-haspopup")).toBe("true");
    const panel = document.querySelector(".glass-lux.rounded-2xl");
    expect(panel).not.toBeNull();
    expect(panel.className).not.toMatch(/dark:/);
  });

  it("profile link navigates and closes the popover", () => {
    openMenu();
    fireEvent.click(screen.getByText("Orders"));
    expect(navMocks.push).toHaveBeenCalledWith(
      "/marketplace/profile/orders",
    );
    expect(screen.queryByText("My Profile")).toBeNull();
  });

  it("SOS row calls the inline 2-tap handler without an overlay", () => {
    openMenu();
    fireEvent.click(screen.getByRole("button", { name: "Emergency SOS" }));
    expect(sosMocks.sos.handleSOS).toHaveBeenCalledTimes(1);
    // Popover stays open — no overlay steals the second tap.
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("theme row toggles light/dark from the store (D2.5)", () => {
    openMenu();
    expect(screen.getByText("Light")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Theme").closest("button"));
    expect(themeStore.getState().theme).toBe("dark");
  });

  it("closes on Escape and on outside click (D9.4)", () => {
    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("My Profile")).toBeNull();
    openMenu();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("My Profile")).toBeNull();
  });
});
