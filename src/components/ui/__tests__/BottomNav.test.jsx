// Task 19: marketplace shell — 5-item store nav + header overflow menu.
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

import { BottomNav, marketplaceTabFor } from "@/components/ui/BottomNav";
import { MarketplaceMenu } from "@/components/ui/MarketplaceMenu";
import { marketplaceShowsBack } from "@/lib/marketplaceNav";
import { useCartStore } from "@/store/cartStore";
import { themeStore } from "@/store/themeStore";

const ITEMS = ["Home", "Categories", "Search", "Cart", "Profile"];

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

describe("Marketplace BottomNav (plan nav matrix)", () => {
  it("renders exactly Home, Categories, Search, Cart, Profile", () => {
    render(<BottomNav />);
    expect(screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual(ITEMS);
    expect(screen.queryByRole("button", { name: "Menu" })).toBeNull();
  });

  it.each([
    ["/marketplace", "Home"],
    ["/marketplace/categories", "Categories"],
    ["/marketplace/categories/id", "Categories"],
    ["/marketplace/search", "Search"],
    ["/marketplace/cart", "Cart"],
    ["/marketplace/profile/orders", "Profile"],
  ])("%s marks %s active", (path, label) => {
    navMocks.path = path;
    render(<BottomNav />);
    expect(screen.getByRole("button", { name: label })).toHaveAttribute("aria-current", "page");
  });

  it("product/checkout pages mark no tab active", () => {
    expect(marketplaceTabFor("/marketplace/product/id")).toBeUndefined();
    expect(marketplaceTabFor("/marketplace/checkout")).toBeUndefined();
  });

  it("navigates to the item path on tap", () => {
    render(<BottomNav />);
    fireEvent.click(screen.getByRole("button", { name: "Cart" }));
    expect(navMocks.push).toHaveBeenCalledWith("/marketplace/cart");
  });

  it("shows the real cart count badge, capped at 99+, hidden when empty", () => {
    useCartStore.setState({ items: [{ id: "a", quantity: 2 }] });
    const { unmount } = render(<BottomNav />);
    expect(screen.getByRole("button", { name: "Cart" })).toHaveTextContent("2");
    unmount();
    useCartStore.setState({ items: [{ id: "a", quantity: 150 }] });
    const second = render(<BottomNav />);
    expect(screen.getByRole("button", { name: "Cart" })).toHaveTextContent("99+");
    second.unmount();
    useCartStore.setState({ items: [] });
    render(<BottomNav />);
    expect(screen.getByRole("button", { name: "Cart" }).textContent).toBe("Cart");
  });

  it("back arrow only on pushed/detail screens", () => {
    for (const p of ["/marketplace", "/marketplace/categories", "/marketplace/search", "/marketplace/cart", "/marketplace/profile"]) {
      expect(marketplaceShowsBack(p), p).toBe(false);
    }
    for (const p of ["/marketplace/categories/id", "/marketplace/product/id", "/marketplace/checkout"]) {
      expect(marketplaceShowsBack(p), p).toBe(true);
    }
  });
});

describe("Marketplace header overflow menu", () => {
  function openMenu() {
    cleanup();
    render(<MarketplaceMenu />);
    fireEvent.click(screen.getByRole("button", { name: "More options" }));
  }

  it("opens with profile links, help, inline SOS row and theme row", () => {
    openMenu();
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(screen.getByText("Help & Support")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Emergency SOS" })).toBeInTheDocument();
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("is a flat card, aria-expanded/haspopup, no dark-prefixed classes", () => {
    openMenu();
    const button = screen.getByRole("button", { name: "More options" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button).toHaveAttribute("aria-haspopup", "true");
    const panel = screen.getByRole("menu");
    expect(panel.className).toContain("bg-[var(--surface-card)]");
    expect(panel.className).not.toMatch(/dark:|backdrop-blur/);
  });

  it("links navigate and close the menu", () => {
    openMenu();
    fireEvent.click(screen.getByText("Orders"));
    expect(navMocks.push).toHaveBeenCalledWith("/marketplace/profile/orders");
    expect(screen.queryByText("My Profile")).toBeNull();
    openMenu();
    fireEvent.click(screen.getByText("Help & Support"));
    expect(navMocks.push).toHaveBeenCalledWith("/marketplace/profile/help");
  });

  it("SOS row calls the inline 2-tap handler and keeps the menu open", () => {
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "Emergency SOS" }));
    expect(sosMocks.sos.handleSOS).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("theme row toggles light/dark from the store", () => {
    openMenu();
    expect(screen.getByText("Light")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Theme").closest("button"));
    expect(themeStore.getState().theme).toBe("dark");
  });

  it("closes on Escape and on outside click", () => {
    openMenu();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("My Profile")).toBeNull();
    openMenu();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("My Profile")).toBeNull();
  });
});
