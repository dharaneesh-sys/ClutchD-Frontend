// Wave-4 Task 10 (customer + seller dashboards + upload) — flow test.
// Seller dashboard surfaces store listings first; upload route + back-nav +
// shared card/button/status language identical. No backend needed: a demo
// seller session (demo- prefix skips refresh) renders both pages offline.
import { test, expect } from "@playwright/test";

const DEMO_SELLER_STORAGE = {
  state: {
    userId: "demo-seller-1",
    userRole: "seller",
    isAuthenticated: true,
    _hydrated: true,
    rememberMe: true,
    user: {
      id: "demo-seller-1",
      role: "seller",
      name: "Demo Seller",
      email: null,
      phone: null,
    },
  },
  version: 0,
};

async function asDemoSeller(page) {
  await page.addInitScript((storage) => {
    window.localStorage.setItem("auth-storage", JSON.stringify(storage));
  }, DEMO_SELLER_STORAGE);
}

// The Next.js dev-tools overlay (<nextjs-portal>) is dev-build-only chrome
// that can intercept clicks meant for page controls.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const install = () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      (document.head || document.documentElement).appendChild(style);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
    else install();
  });
});

test.describe("signed-out access renders no seller chrome (routes frozen)", () => {
  test("signed-out /dashboard/seller shows no dashboard content", async ({ page }) => {
    await page.goto("/dashboard/seller");
    await expect(page).toHaveURL(/\/dashboard\/seller/);
    await expect(page.getByRole("heading", { name: "Seller Dashboard" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Upload a part" })).toHaveCount(0);
  });

  test("signed-out /dashboard/seller/upload shows no product form", async ({ page }) => {
    await page.goto("/dashboard/seller/upload");
    await expect(page).toHaveURL(/\/dashboard\/seller\/upload/);
    await expect(page.getByRole("button", { name: "List part for sale" })).toHaveCount(0);
    await expect(page.getByText("Part name *")).toHaveCount(0);
  });
});

test.describe("seller dashboard surfaces listings first (store-first)", () => {
  test.beforeEach(async ({ page }) => {
    await asDemoSeller(page);
  });

  test("welcome has no emoji, recent listings + view-all + upload entry render", async ({ page }) => {
    await page.goto("/dashboard/seller");
    // Shell title is desktop-only (hidden lg:flex); anchor on the Welcome heading instead.
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 20000 });

    const welcome = page.getByRole("heading", { name: /Welcome/ });
    await expect(welcome).toBeVisible({ timeout: 10000 });
    await expect(welcome).not.toContainText("👋");

    await expect(page.getByRole("heading", { name: "Recent listings" })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "View all" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload a part" }).first()).toBeVisible();
  });

  test("upload CTAs use token styling, never white hardcodes", async ({ page }) => {
    await page.goto("/dashboard/seller");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 20000 });
    const cta = page.getByRole("button", { name: "Upload a part" }).first();
    await expect(cta).toBeVisible({ timeout: 10000 });
    const cls = (await cta.getAttribute("class")) || "";
    expect(cls).not.toContain("text-white");
  });

  test("listings tab keeps the upload entry + empty state", async ({ page }) => {
    // Sidebar tabs live behind the mobile menu (DashboardShell); shrink the
    // viewport so the Open-menu button is visible.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard/seller");
    await expect(page.getByRole("heading", { name: /Welcome/ })).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("button", { name: "My Listings" }).click();
    await expect(page.getByText("No listings yet")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: "Upload a part" }).first()).toBeVisible();
  });
});

test.describe("seller upload page (upload route frozen)", () => {
  test.beforeEach(async ({ page }) => {
    await asDemoSeller(page);
  });

  test("renders header, back nav, live count, and the full product form", async ({ page }) => {
    await page.goto("/dashboard/seller/upload");
    await expect(page.getByRole("heading", { name: "Upload a part" })).toBeVisible({ timeout: 20000 });

    await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open Parts Store" })).toBeVisible();
    await expect(page.getByText(/listing(s)? live/)).toBeVisible();

    await expect(page.getByText("Part name *")).toBeVisible();
    await expect(page.getByText("Price (₹) *")).toBeVisible();
    await expect(page.getByText("Description *")).toBeVisible();
    await expect(page.getByText("Part photo *")).toBeVisible();
    await expect(page.getByRole("button", { name: "List part for sale" })).toBeVisible();
  });

  test("back button returns to the seller dashboard", async ({ page }) => {
    await page.goto("/dashboard/seller/upload");
    await expect(page.getByRole("heading", { name: "Upload a part" })).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/dashboard\/seller$/, { timeout: 10000 });
  });

  test("empty submit surfaces field errors without leaving the page", async ({ page }) => {
    await page.goto("/dashboard/seller/upload");
    await expect(page.getByRole("button", { name: "List part for sale" })).toBeVisible({ timeout: 20000 });
    await page.getByRole("button", { name: "List part for sale" }).click();
    await expect(page.getByText("Enter a part name (min 3 chars)").first()).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/seller\/upload/);
  });
});
