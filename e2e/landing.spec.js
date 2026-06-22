// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load homepage with correct title', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.page-enter', { timeout: 10000 })

    // Check page title contains "ClutchD"
    await expect(page).toHaveTitle(/ClutchD/)

    // Verify the main heading is visible
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Vehicle Service')
  })

  test('should display CTA buttons', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.page-enter', { timeout: 10000 })

    // Check "Get Started" CTA button
    const getStarted = page.locator('a', { hasText: 'Get Started' })
    await expect(getStarted).toBeVisible()
    await expect(getStarted).toBeEnabled()

    // Check "Sign In" link in nav
    const signInNav = page.locator('nav a', { hasText: 'Sign In' })
    await expect(signInNav).toBeVisible()

    // Check feature cards are rendered (4 features)
    const features = page.locator('h4')
    await expect(features.first()).toBeVisible()
  })

  test('should take landing page screenshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.page-enter', { timeout: 10000 })
    await page.waitForTimeout(500) // let animations settle

    await expect(page).toHaveScreenshot('landing-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})
