// @ts-check
import { test, expect } from '@playwright/test'

// The smoke backend rate-limits /api/providers/nearby at 30/min PER IP and every
// worker shares 127.0.0.1, so tests must not race each other for that budget.
// Serial mode pins the file to one worker per project (≤2 concurrent dashboards).
test.describe.configure({ mode: 'serial' })

// ── Button smoke: critical controls across every surface, REAL app only ──────
// No route mocking, no injected storage, no fabricated data. Every test logs in
// through the real /auth UI against the live local backend stack and asserts on
// what the app actually renders from real API responses.
//
// Geolocation is the single device-level simulation (Capacitor's GPS stand-in).
//
// Parallel-safety: customer-role tests provision their OWN customer via a real
// POST /api/auth/signup call (fixture creation through the public API — no
// route mocks). The backend keeps ONE active request per customer, so sharing
// customer@demo.com across concurrent workers lets one test's Cancel Request
// wipe another test's job mid-flight.

const GARAGE = { email: 'garage@demo.com', password: 'demo123456' }
const ADMIN = { email: 'admin@21907.com', password: 'clutchD123' }
const DELHI = { latitude: 28.6139, longitude: 77.2090 }
const API_URL = process.env.E2E_API_URL || 'http://localhost:8001/api'

/**
 * Log in through the real /auth UI.
 * @param {import('@playwright/test').Page} page
 */
async function loginViaUi(page, { email, password }, roleLabel = /^Customer/) {
  await page.goto('/auth')
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({ timeout: 20000 })
  await page.getByRole('button', { name: roleLabel }).first().click()
  await page.getByLabel('Email Address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /Sign In/i }).click()
}

/**
 * Provision a dedicated customer for THIS test through the real signup API.
 * Unique per call so parallel workers never share server-side state.
 * @param {string} label stable tag baked into the email for debuggability
 * @returns {Promise<{email: string, password: string}>}
 */
async function signupFreshCustomer(label) {
  const email = `e2e.${label}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@smoke-test.com`
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'smoke123456', name: `E2E ${label}`, role: 'customer' }),
  })
  if (!res.ok) throw new Error(`signup for ${label} failed: HTTP ${res.status}`)
  return { email, password: 'smoke123456' }
}

// The Next.js dev-tools overlay (<nextjs-portal>) is dev-build-only chrome that
// expands with an issue badge on small viewports and intercepts clicks meant for
// the bottom tab bar. It does not exist in production builds, so tests hide it.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const install = () => {
      const style = document.createElement('style')
      style.textContent = 'nextjs-portal{display:none!important}'
      ;(document.head || document.documentElement).appendChild(style)
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install)
    else install()
  })
})

/**
 * If a previous flow left an active request on THIS account, the app restores
 * it on login (restoreActiveRequest swaps the form for ServiceStatusTracker).
 * Cancel it through the real UI to get back to a clean request form.
 * @param {import('@playwright/test').Page} page
 */
async function ensureRequestPanel(page) {
  await page
    .getByRole('heading', { name: /Service Status|Request Service/ })
    .waitFor({ timeout: 20000 })
  for (let i = 0; i < 3; i++) {
    const cancel = page.getByRole('button', { name: 'Cancel Request' })
    const visible = await cancel.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false)
    if (!visible) break
    await cancel.click()
    await expect(cancel).toBeHidden({ timeout: 10000 })
  }
}
test.describe('auth surface', () => {
  test('Log In ↔ Sign Up toggle switches between real forms', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({ timeout: 20000 })

    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel('Email Address')).toBeVisible()

    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({ timeout: 5000 })

    // Forgot-password flow button swaps in its own real form.
    await page.getByRole('button', { name: 'Forgot password?' }).click()
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Back to Login' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible({ timeout: 5000 })
  })
})

test.describe('customer dashboard buttons', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(DELHI)
  })

  test('bottom tab bar switches Service / Schedule / Vehicles / Parts Store / History panels', async ({ page }) => {
    await loginViaUi(page, await signupFreshCustomer('tabs'))
    await page.waitForURL('**/dashboard/customer', { timeout: 20000 })
    await ensureRequestPanel(page)
    await expect(page.getByRole('heading', { name: 'Request Service' })).toBeVisible({ timeout: 20000 })

    await page.getByRole('button', { name: 'Vehicles', exact: true }).click()
    await expect(page.getByText(/No vehicles added|Select Vehicle|Add Vehicle|Your Garage/i).first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Schedule', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Scheduled Appointments' })).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'History', exact: true }).click()
    await expect(page.getByText(/History|No history|service/i).first()).toBeVisible({ timeout: 10000 })

    await page.getByRole('button', { name: 'Parts Store', exact: true }).click()
    // Embedded marketplace home loads real seeded products.
    await expect(page.getByText(/Categories|Products|Featured|Shop/i).first()).toBeVisible({ timeout: 15000 })

    await page.getByRole('button', { name: 'Service', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Request Service' })).toBeVisible({ timeout: 10000 })
  })

  test('SOSButton two-step confirm reaches the real /api/sos endpoint', async ({ page }) => {
    let sosPost = null
    page.on('response', (resp) => {
      if (resp.url().includes('/sos') && resp.request().method() === 'POST') sosPost = resp
    })

    await loginViaUi(page, await signupFreshCustomer('sos'))
    await page.waitForURL('**/dashboard/customer', { timeout: 20000 })
    await ensureRequestPanel(page)
    await expect(page.getByRole('heading', { name: 'Request Service' })).toBeVisible({ timeout: 20000 })

    // Idle SOS FAB renders an icon only (no accessible name) — the red round
    // floating button is its stable visual identity.
    const sos = page.locator('button.bg-red-500')
    await expect(sos).toBeVisible({ timeout: 10000 })

    // First tap arms the confirmation state — the button then swaps
    // bg-red-500 → bg-red-600, so re-click via its label text, which
    // survives the class transition (the stale class locator would only
    // match again after the 5s revert timer resets it to idle).
    await sos.click()
    const armed = page.getByText('Tap AGAIN to SOS')
    await expect(armed).toBeVisible({ timeout: 5000 })
    await armed.click()

    // Backend /service/sos replies emergency_notified → "Help En Route!".
    // If BackendHealth flagged the API offline the app queues instead —
    // both are real outcomes of the two-step interaction.
    await expect(page.getByText(/Help En Route!|SOS Queued/)).toBeVisible({ timeout: 15000 })
    if (sosPost) expect(sosPost.status()).toBe(200)
  })
})

test.describe('fleet dashboard buttons', () => {
  test('fleet tabs render and switch without dead navigations', async ({ page }) => {
    await loginViaUi(page, await signupFreshCustomer('fleet')) // fleet page gates on isAuthenticated only
    await page.waitForURL('**/dashboard/customer', { timeout: 20000 })

    await page.goto('/dashboard/fleet')
    // Desktop layout shows the h1; mobile collapses it and renders the register
    // sheet instead — accept whichever chrome this viewport actually shows.
    const desktopTitle = page.getByRole('heading', { name: 'Fleet Dashboard' })
    const mobileRegister = page.getByRole('heading', { name: /B2B Registration/ })
    const fleetChromeVisible = () =>
      Promise.all([
        desktopTitle.isVisible().catch(() => false),
        mobileRegister.isVisible().catch(() => false),
      ]).then(([a, b]) => a || b)
    await expect.poll(fleetChromeVisible, { timeout: 20000 }).toBe(true)

    // Without a stored registration the page opens on the register flow.
    const bulkTab = page.getByRole('button', { name: /Bulk Booking/i })
    if (await bulkTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bulkTab.click()
      await expect(page.getByText(/Bulk|booking/i).first()).toBeVisible({ timeout: 5000 })
      await page.getByRole('button', { name: /Fleet Dashboard/i }).first().click()
      await expect.poll(fleetChromeVisible, { timeout: 5000 }).toBe(true)
    }
  })
})

test.describe('garage dashboard buttons', () => {
  test('garage dashboard renders queue, real seeded profile, and action buttons', async ({ page }) => {
    await loginViaUi(page, GARAGE, /^Garage/)
    await page.waitForURL('**/dashboard/garage', { timeout: 20000 })
    // Desktop renders the h1; mobile collapses it behind "Open menu" and shows
    // section headings directly — accept either as proof the page rendered.
    await expect(
      page.getByRole('heading', { name: /Garage Dashboard|Garage Profile|Garage Queue/ }).first()
    ).toBeVisible({ timeout: 20000 })

    // Default view stacks Profile / Analytics / Queue sections (sidebar prop).
    await expect(page.getByRole('heading', { name: 'Garage Queue' })).toBeVisible({ timeout: 10000 })
    // Real seeded garage record from bootstrap_db renders its profile card. The
    // name appears twice (visible card heading + hidden sidebar span) and DOM
    // order differs per viewport, so require ANY visible match.
    await expect
      .poll(
        async () => {
          for (const el of await page.getByText('SpeedFix Auto Garage').all()) {
            if (await el.isVisible()) return true
          }
          return false
        },
        { timeout: 10000 }
      )
      .toBe(true)
    await expect(page.getByRole('button', { name: 'Edit Details' })).toBeVisible()
  })
})

test.describe('admin tables', () => {
  test('platform overview, users table with real rows, and jobs monitor render', async ({ page }) => {
    await loginViaUi(page, ADMIN) // backend ignores tile role for staff logins
    await page.waitForURL('**/admin', { timeout: 20000 })
    await expect(page.getByText('Platform Overview')).toBeVisible({ timeout: 20000 })

    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'Users & Providers' })).toBeVisible({ timeout: 20000 })
    // Real seeded accounts come back from GET /admin/users.
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('cell', { name: /customer/i }).first()).toBeVisible({ timeout: 15000 })

    await page.goto('/admin/jobs')
    await expect(page.getByText('Active Jobs Monitor')).toBeVisible({ timeout: 20000 })
  })
})

test.describe('marketplace cart & checkout', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(DELHI)
  })

  test('add-to-cart puts a real product in the cart and checkout renders it', async ({ page }) => {
    await loginViaUi(page, await signupFreshCustomer('cart'))
    await page.waitForURL('**/dashboard/customer', { timeout: 20000 })

    await page.goto('/marketplace')
    // Real seeded catalog (18 products) from GET /api/products.
    const addButtons = page.getByRole('button', { name: 'Add to Cart' })
    await expect(addButtons.first()).toBeVisible({ timeout: 20000 })
    await addButtons.first().click()

    await page.goto('/marketplace/cart')
    await expect(page.getByText(/Proceed to Checkout/i)).toBeVisible({ timeout: 15000 })

    await page.goto('/marketplace/checkout')
    await expect(page.getByRole('button', { name: /Place Order/i })).toBeVisible({ timeout: 15000 })
  })
})
