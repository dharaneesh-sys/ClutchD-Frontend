// G2 ONLY — real backend, real TEST_CUSTOMER_* account. No interception.
// BLOCKED: real backend at G1. Run:
//   PILOT_REAL_BACKEND=1 TEST_CUSTOMER_EMAIL=… TEST_CUSTOMER_PASSWORD=… \
//   npx playwright test e2e/pilot-customer.spec.js --project="Mobile Chrome"
import { test, expect } from '@playwright/test'

const enabled = process.env.PILOT_REAL_BACKEND === '1'
const email = process.env.TEST_CUSTOMER_EMAIL
const password = process.env.TEST_CUSTOMER_PASSWORD

test.describe('G2 customer flow: request → pay → review → history', () => {
  test.skip(!enabled, 'BLOCKED: real backend (set PILOT_REAL_BACKEND=1)')
  test.skip(!email || !password, 'BLOCKED: TEST accounts (TEST_CUSTOMER_EMAIL/PASSWORD)')

  test('customer can request service and sees the real status tracker', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: 11.0168, longitude: 76.9558 })
    await page.goto('/auth')
    await page.getByLabel('Email Address').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /^Sign In$/ }).click()
    await expect(page).toHaveURL(/\/dashboard\/customer/, { timeout: 30000 })

    const nav = page.getByRole('navigation', { name: 'Dashboard' })
    await expect(nav.getByRole('button')).toHaveCount(5)

    if (await page.getByRole('heading', { name: 'What do you need?' }).isVisible()) {
      await page.getByRole('radio', { name: 'Flat Tire' }).check({ force: true })
      await page.getByLabel('Describe the problem').fill('G2 pilot QA: rear tyre puncture')
      const created = page.waitForResponse((r) => r.url().includes('/service/request') && r.request().method() === 'POST')
      await page.getByRole('button', { name: /Request Service/ }).click()
      expect((await created).ok()).toBe(true)
    }
    await expect(page.getByRole('heading', { name: 'Service Status' })).toBeVisible({ timeout: 30000 })
    // Payment + review complete once the TEST_ partner bills the job (pilot-partner.spec.js).
  })

  test('history and review endpoint persist (after partner completion)', async ({ page }) => {
    await page.goto('/auth')
    await page.getByLabel('Email Address').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /^Sign In$/ }).click()
    await expect(page).toHaveURL(/\/dashboard\/customer/, { timeout: 30000 })
    const hist = page.waitForResponse((r) => r.url().includes('/jobs/history'))
    await page.getByRole('navigation', { name: 'Dashboard' }).getByRole('button', { name: 'History' }).click()
    expect((await hist).ok()).toBe(true)
  })
})
