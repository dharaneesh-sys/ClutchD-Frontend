// Wave-2 Task 6 (cart + checkout commerce flow) — e2e.
// Routes/pricing logic/escrow behavior identical; restyle is token-only.
// EmptyStates use shared Button language; zero .btn-glow escapes (D1.1).
import { test, expect } from "@playwright/test";

test.describe("cart + checkout commerce flow", () => {
  test("empty cart renders shared EmptyState with Start Shopping CTA", async ({ page }) => {
    await page.goto("/marketplace/cart");
    await expect(
      page.getByRole("heading", { name: "Your Cart is Empty" })
    ).toBeVisible();
    const cta = page.getByRole("button", { name: "Start Shopping" });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/marketplace$/);
  });

  test("cart screen carries zero btn-glow escapes (D1.1)", async ({ page }) => {
    await page.goto("/marketplace/cart");
    await expect(page.locator(".btn-glow")).toHaveCount(0);
  });

  test("empty checkout guards with back-to-cart route intact", async ({ page }) => {
    await page.goto("/marketplace/checkout");
    await expect(
      page.getByRole("heading", { name: "Nothing to Checkout" })
    ).toBeVisible();
    const back = page.getByRole("button", { name: "Back to Cart" });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page).toHaveURL(/\/marketplace\/cart$/);
  });

  test("checkout screen carries zero btn-glow escapes (D1.1)", async ({ page }) => {
    await page.goto("/marketplace/checkout");
    await expect(page.locator(".btn-glow")).toHaveCount(0);
  });
});
