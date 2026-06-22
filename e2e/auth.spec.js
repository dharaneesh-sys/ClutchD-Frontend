// @ts-check
import { test, expect } from '@playwright/test'

test.describe('Auth Page', () => {
  test('should render auth page with login/signup toggle', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('.page-enter', { timeout: 10000 })

    // Check the page loads with auth form visible
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Vehicle Service')

    // Check toggle button says "Sign Up" (meaning login view is default)
    const toggleButton = page.locator('button', { hasText: 'Sign Up' })
    await expect(toggleButton).toBeVisible()
  })

  test('should toggle between login and signup views', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('.page-enter', { timeout: 10000 })

    // Default is login view — toggle text says "Sign Up"
    const toggle = page.locator('button', { hasText: 'Sign Up' })
    await expect(toggle).toBeVisible()

    // Click toggle to switch to signup view
    await toggle.click()

    // Now the button text should say "Log In"
    const toggleLogin = page.locator('button', { hasText: 'Log In' })
    await expect(toggleLogin).toBeVisible()
  })

  test('should display feature cards on auth page', async ({ page }) => {
    await page.goto('/auth')
    await page.waitForSelector('.page-enter', { timeout: 10000 })

    // Feature cards should be visible
    const featureCards = page.locator('.glass-lux-interactive')
    await expect(featureCards.first()).toBeVisible()

    // Check specific feature text
    await expect(page.locator('text=24/7 Support')).toBeVisible()
    await expect(page.locator('text=Live Tracking')).toBeVisible()
    await expect(page.locator('text=Verified Pros')).toBeVisible()
    await expect(page.locator('text=Upfront Pricing')).toBeVisible()
  })
})
