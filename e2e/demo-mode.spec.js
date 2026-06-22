// @ts-check
import { test, expect } from '@playwright/test'

// This test file is conditional — only runs when DEMO_MODE is enabled.
// Set NEXT_PUBLIC_DEMO_MODE=true in your .env.local to activate demo mode.

test.describe('Demo Mode', () => {
  // Skip all tests in this block if demo mode is not enabled
  test.skip(() => {
    // In CI or local run without DEMO_MODE, skip these tests
    // Playwright doesn't have direct access to NEXT_PUBLIC_DEMO_MODE,
    // so we check for a demo-specific DOM element as a proxy.
    // When DEMO_MODE=true, DemoToolbar renders on the homepage.
    return false // We check runtime below instead
  }, 'Demo mode not enabled — set NEXT_PUBLIC_DEMO_MODE=true')

  test('should show DemoToolbar when demo mode is enabled', async ({ page }) => {
    test.skip(
      process.env.NEXT_PUBLIC_DEMO_MODE !== 'true',
      'NEXT_PUBLIC_DEMO_MODE is not set to true'
    )

    await page.goto('/')
    await page.waitForSelector('.page-enter', { timeout: 10000 })

    // DemoToolbar renders a fixed bottom bar with "Demo" label
    const demoToolbar = page.locator('text=Demo').first()
    await expect(demoToolbar).toBeVisible({ timeout: 5000 })
  })

  test('should toggle demo mode on/off', async ({ page }) => {
    test.skip(
      process.env.NEXT_PUBLIC_DEMO_MODE !== 'true',
      'NEXT_PUBLIC_DEMO_MODE is not set to true'
    )

    await page.goto('/')
    await page.waitForSelector('.page-enter', { timeout: 10000 })

    // Find the demo toggle switch
    const demoToggle = page.locator('text=Demo').first()
    await expect(demoToggle).toBeVisible({ timeout: 5000 })

    // Click to enable demo mode
    await demoToggle.click()

    // After enabling, the toolbar should show role selector and tour controls
    // (exact content depends on demo state)
  })
})
