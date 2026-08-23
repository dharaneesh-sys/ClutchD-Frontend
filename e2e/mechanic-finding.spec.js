// @ts-check
import { test, expect } from '@playwright/test'

// The smoke backend rate-limits /api/providers/nearby at 30/min PER IP and every
// worker shares 127.0.0.1, so tests must not race each other for that budget.
// Serial mode pins the file to one worker per project (≤2 concurrent dashboards).
test.describe.configure({ mode: 'serial' })

// ── Real-flow E2E: discovery → request → schedule → dispatch → chat ──────────
// NO route mocking, NO fabricated payloads. Every assertion runs against what
// the REAL backend (uvicorn + seeded SQLite smoke DB) actually returns.
//
// Geolocation here is DEVICE-level simulation only (the same role Capacitor's
// native GPS plays on a real phone). All app data — providers, jobs, offers,
// tokens — comes from live HTTP calls to the local API.
//
// Seeded accounts come from ClutchD-Backend/scripts/bootstrap_db.py plus the
// Delhi tire providers added by the smoke rig seed (/tmp/opencode/clutchd_smoke).
//
// Parallel-safety: every customer-flow test provisions its OWN customer via a
// real POST /api/auth/signup call (fixture creation through the public API —
// no route mocks). The backend keeps ONE active request per customer, so tests
// sharing customer@demo.com cancel each other's jobs mid-flight once workers
// run concurrently (restoreActiveRequest swaps the panel under them).

const DELHI_MECHANIC = { email: 'delhi.mech@smoketest.com', password: 'smoke123456' }
const DELHI = { latitude: 28.6139, longitude: 77.2090 }
const API_URL = process.env.E2E_API_URL || 'http://localhost:8001/api'

/**
 * Log in through the real /auth UI. `roleLabel` picks the role tile on the card.
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
 * The seeded customer is shared by every test, so a job created by an earlier
 * test is legitimately restored by the app on the next login
 * (restoreActiveRequest swaps the request form for ServiceStatusTracker).
 * Cancel it through the real UI to get back to a clean request form.
 * @param {import('@playwright/test').Page} page
 */
async function ensureRequestPanel(page) {
  // Let the dashboard settle into either state (restored tracker or form).
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
  await expect(page.getByRole('heading', { name: 'Request Service' })).toBeVisible({ timeout: 15000 })
}

async function loginAsCustomerAtDelhi(page, creds) {
  await loginViaUi(page, creds)
  await page.waitForURL('**/dashboard/customer', { timeout: 20000 })
  await ensureRequestPanel(page)
  // ProviderList renders from the live /providers/nearby store data. Bursts of
  // dashboard mounts can trip the backend's 30/min-per-IP nearby limit (429),
  // and the app then shows an error toast instead of the list. A bounded reload
  // retry re-mounts the map and re-fetches once the fixed window rolls over.
  const pros = page.getByText(/Nearby Professionals \(\d+\)/)
  for (let attempt = 0; attempt < 3; attempt++) {
    const visible = await pros.waitFor({ state: 'visible', timeout: 25000 }).then(() => true).catch(() => false)
    if (visible) return
    await page.reload()
  }
  await expect(pros).toBeVisible({ timeout: 25000 })
}

test.describe('customer discovery → request → schedule (real backend)', () => {
  test.beforeEach(async ({ context }) => {
    test.setTimeout(90000) // headroom for the rate-limit reload retry in loginAsCustomerAtDelhi
    // Device-level GPS simulation (Chromium context), like Capacitor on a phone.
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(DELHI)
  })

  test('real login via /auth UI lands the customer on their dashboard', async ({ page }) => {
    // The app keeps the backend-issued JWT in memory (httpOnly refresh cookie
    // backs sessions), so prove the real login by catching an authenticated
    // API call that carries the Bearer token.
    const authedReq = page.waitForRequest(
      (r) => r.url().includes('/api/vehicles') && !!r.headers()['authorization']
    )
    await loginViaUi(page, await signupFreshCustomer('login'))
    await page.waitForURL('**/dashboard/customer', { timeout: 20000 })
    await expect(page.getByText(/Service Status|Request Service/)).toBeVisible({ timeout: 20000 })

    const req = await authedReq
    expect(req.headers()['authorization']).toMatch(/^Bearer eyJ/) // real JWT from /api/auth/login
  })

  test('ProviderList renders exactly what GET /api/providers/nearby returns', async ({ page }) => {
    const nearbyPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/providers/nearby') &&
        r.url().includes('lat=28.6') && // the GPS-driven call, not the default-center one
        r.request().method() === 'GET' &&
        r.status() === 200
    )
    await loginViaUi(page, await signupFreshCustomer('nearby'))
    await page.waitForURL('**/dashboard/customer', { timeout: 20000 })
    await ensureRequestPanel(page)

    const resp = await nearbyPromise
    const data = await resp.json()

    expect(data.mechanics.length).toBeGreaterThan(0)
    // The UI mirrors the live response — no fixtures involved.
    for (const mech of data.mechanics) {
      await expect(page.getByText(mech.name).first()).toBeVisible({ timeout: 10000 })
    }
    for (const garage of data.garages) {
      await expect(page.getByText(garage.name).first()).toBeVisible({ timeout: 10000 })
    }
    // Distance lines rendered from the backend haversine result.
    await expect(page.getByText(/km away/).first()).toBeVisible()
  })

  test('provider preference filter narrows to mechanics then garages then all', async ({ page }) => {
    await loginAsCustomerAtDelhi(page, await signupFreshCustomer('filter'))
    // Seed guarantees one mechanic + one garage near Delhi coords.
    await expect(page.getByText('Nearby Professionals (2)')).toBeVisible({ timeout: 15000 })

    await page.locator('label', { hasText: 'Mechanic' }).click()
    await expect(page.getByText('Nearby Professionals (1)')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Mechanics', { exact: true })).toBeVisible() // filter badge
    await expect(page.getByText('Delhi Tire Works (Mechanic)')).toBeVisible()
    await expect(page.getByText('Delhi Tire Point')).toBeHidden()

    await page.locator('label', { hasText: 'Garage' }).click()
    await expect(page.getByText('Nearby Professionals (1)')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Garages', { exact: true })).toBeVisible()
    await expect(page.getByText('Delhi Tire Point')).toBeVisible()
    await expect(page.getByText('Delhi Tire Works (Mechanic)')).toBeHidden()

    await page.locator('label', { hasText: 'Fastest' }).click()
    await expect(page.getByText('Nearby Professionals (2)')).toBeVisible({ timeout: 5000 })
  })

  test('ScheduleBookingModal submits {scheduledAt, vehicleId, notes} and books a real job', async ({ page }) => {
    await loginAsCustomerAtDelhi(page, await signupFreshCustomer('schedule'))

    await page.getByRole('button', { name: 'Schedule', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Scheduled Appointments' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /Book Appointment/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByText('Schedule Service')).toBeVisible()

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const dateStr = [
      tomorrow.getFullYear(),
      String(tomorrow.getMonth() + 1).padStart(2, '0'),
      String(tomorrow.getDate()).padStart(2, '0'),
    ].join('-')
    await dialog.locator('input[type="date"]').fill(dateStr)
    await dialog.getByRole('button', { name: '10:00 AM' }).click()
    await dialog
      .getByPlaceholder('Any specific issues or requests?')
      .fill('Please check the spare tire condition as well')

    const postPromise = page.waitForResponse(
      (r) => r.url().includes('/service/request') && r.request().method() === 'POST'
    )
    await dialog.getByRole('button', { name: /Schedule Appointment/i }).click()
    const resp = await postPromise

    expect(resp.status()).toBe(200)
    const job = await resp.json()
    // Exact payload contract produced by ScheduleBookingModal + customer page.
    expect(job.scheduledAt).toBe(`${dateStr}T10:00:00`)
    expect(job.vehicleId).toBeNull()
    expect(job.description).toContain('spare tire condition')
    // Scheduled jobs stay "searching" until due time (dispatch is gated).
    expect(job.status).toBe('searching')

    await expect(dialog).toBeHidden({ timeout: 10000 })
  })

  test('Find Help Now creates a real dispatched job via POST /api/service/request', async ({ page }) => {
    await loginAsCustomerAtDelhi(page, await signupFreshCustomer('dispatch'))

    await page.getByLabel('What seems to be the issue?').selectOption('flat_tire')
    await page
      .getByPlaceholder(/knocking sound/)
      .fill('Flat tire near India Gate, need urgent roadside help')

    const postPromise = page.waitForResponse(
      (r) => r.url().includes('/service/request') && r.request().method() === 'POST'
    )
    await page.getByRole('button', { name: /Find Help Now/i }).click()
    const resp = await postPromise

    expect(resp.status()).toBe(200)
    const job = await resp.json()
    expect(job.issueTag).toBe('flat_tire')
    // Real dispatch: backend notified matching providers immediately.
    expect(job.status).toBe('providers_notified')
    expect(job.customerLocation.lat).toBeCloseTo(DELHI.latitude, 2)
    expect(job.customerLocation.lng).toBeCloseTo(DELHI.longitude, 2)

    // Once the job exists the panel is replaced by the live status tracker.
    await expect(page.getByRole('heading', { name: 'Service Status' })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: 'Cancel Request' })).toBeVisible()
  })
})

test.describe('location guard (device GPS denied)', () => {
  // No geolocation permission granted in this describe — Chromium denies it.
  test('submitting without a pickup location warns and does NOT create a job', async ({ page }) => {
    let jobPostFired = false
    page.on('request', (req) => {
      // exact creation endpoint only — subresource POSTs like /cancel don't count
      if (req.url().endsWith('/service/request') && req.method() === 'POST') jobPostFired = true
    })

    await loginViaUi(page, await signupFreshCustomer('guard'))
    await page.waitForURL('**/dashboard/customer', { timeout: 20000 })
    await ensureRequestPanel(page)

    await expect(page.getByText('Location access was denied.')).toBeVisible({ timeout: 15000 })

    await page.getByLabel('What seems to be the issue?').selectOption('flat_tire')
    await page.getByPlaceholder(/knocking sound/).fill('Guard check: no pickup location set yet')

    await page.getByRole('button', { name: /Find Help Now/i }).click()

    // Guard toast from ServiceRequestPanel; no request is sent.
    await expect(page.getByText(/Set your pickup location first/)).toBeVisible({ timeout: 5000 })
    expect(jobPostFired).toBe(false)
  })
})

test.describe('dispatch → acceptance → chat (two real sessions)', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation(DELHI)
  })

  test('accepted offer assigns the mechanic and enables customer chat', async ({ browser }) => {
    test.setTimeout(120000) // two full UI logins + dispatch + acceptance + chat
    // ── Customer session: create an immediate request at Delhi ──────────────
    const custCtx = await browser.newContext()
    await custCtx.grantPermissions(['geolocation'])
    await custCtx.setGeolocation(DELHI)
    const custPage = await custCtx.newPage()

    const cust = await signupFreshCustomer('chat')

    await loginAsCustomerAtDelhi(custPage, cust)
    await custPage.getByLabel('What seems to be the issue?').selectOption('flat_tire')
    await custPage
      .getByPlaceholder(/knocking sound/)
      .fill(`Chat flow test [${cust.email}]: flat tire at Connaught Place roundabout`)

    const postPromise = custPage.waitForResponse(
      (r) => r.url().includes('/service/request') && r.request().method() === 'POST'
    )
    await custPage.getByRole('button', { name: /Find Help Now/i }).click()
    const job = await (await postPromise).json()
    expect(job.status).toBe('providers_notified')

    // ── Mechanic session: separate context, real login, accept the offer ────
    const mechCtx = await browser.newContext()
    const mechPage = await mechCtx.newPage()
    await loginViaUi(mechPage, DELHI_MECHANIC, /^Mechanic/)
    await mechPage.waitForURL('**/dashboard/mechanic', { timeout: 20000 })

    // Scope to THIS test's offer card — earlier tests may leave other pending
    // offers in the shared seeded mechanic's queue. :not(:has(...)) keeps only
    // leaf cards so ancestor containers can't duplicate the match.
    const offerCard = mechPage
      .locator('div.p-4.rounded-xl:not(:has(div.p-4.rounded-xl))')
      .filter({ hasText: cust.email }) // unique token — both projects run this test against the same mechanic queue
    const acceptBtn = offerCard.getByRole('button', { name: /Accept Job/i })
    await expect(acceptBtn).toBeVisible({ timeout: 20000 })
    await acceptBtn.click()

    // ── Customer sees the assignment (WS push or ≤15s polling fallback) ─────
    const chatFab = custPage.getByRole('button', { name: 'Chat with mechanic' })
    await expect(chatFab).toBeVisible({ timeout: 30000 })
    await chatFab.click()

    const chatDialog = custPage.getByRole('dialog', { name: /Chat with / })
    await expect(chatDialog).toBeVisible({ timeout: 10000 })
    // Chat header shows the assigned provider's real name from the backend.
    await expect(chatDialog.getByText('Delhi Tire Works (Mechanic)')).toBeVisible()

    await mechCtx.close()
    await custCtx.close()
  })
})
