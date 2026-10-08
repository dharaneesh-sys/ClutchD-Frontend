// Wave-2 Task 5 (marketplace browse, store-PRIMARY) — flow test.
// Store PRIMARY: home search + CategoryCard tiles + dense grid dominate;
// nav targets (/marketplace/search, /marketplace/categories,
// /marketplace/categories/id, /marketplace/product/id) identical.
import { test, expect } from "@playwright/test";

test.describe("marketplace browse flow (store-PRIMARY)", () => {
  test("home renders store chrome: search, tiles, featured grid, favorites", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page.getByRole("heading", { name: "Marketplace" })).toBeVisible();
    await expect(page.getByLabel("Search marketplace")).toBeVisible();
    await expect(page.getByLabel("My favorites")).toHaveAttribute(
      "href",
      "/marketplace/profile/favorites"
    );
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Featured Products" })).toBeVisible();
  });

  test("search submit routes to /marketplace/search with query", async ({ page }) => {
    await page.goto("/marketplace");
    await page.getByLabel("Search marketplace").fill("brake");
    await page.getByLabel("Search marketplace").press("Enter");
    await expect(page).toHaveURL(/\/marketplace\/search\?q=brake/);
    await expect(page.getByLabel("Search products")).toBeVisible();
  });

  test("categories index links tiles to detail route", async ({ page }) => {
    await page.goto("/marketplace/categories");
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
    const tiles = page.locator('a[href*="/marketplace/categories/id"]');
    await expect(tiles.first()).toBeVisible();
    await tiles.first().click();
    await expect(page).toHaveURL(/\/marketplace\/categories\/id\?id=/);
  });

  test("product detail resolves without crashing (detail, not-found, or loading)", async ({ page }) => {
    await page.goto("/marketplace/product/id?id=does-not-exist");
    await expect(
      page
        .getByText("Product Not Found")
        .or(page.getByText("Back to Marketplace"))
        .or(page.locator('[aria-busy="true"]'))
    ).toBeVisible();
  });
});
