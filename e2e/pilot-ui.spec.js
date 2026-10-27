// G1 pilot UI checks — PUBLIC surfaces only, against the real static export.
// Data-independent: never intercepts API traffic and works whether the real
// backend is up or down. Authenticated shells are G2-only (no synthetic session).
//
//   NEXT_PUBLIC_BUILD_MODE=export npm run build
//   npx --yes serve@14 out -l 3000   (no --single: it rewrites every route to index.html)
//   npx playwright test e2e/pilot-ui.spec.js --project="Mobile Chrome"
import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const SHOTS = process.env.PILOT_SHOTS_DIR || path.join(process.env.HOME || '.', '.omo/evidence/pilot/screens')
fs.mkdirSync(SHOTS, { recursive: true })

// Network-level failures (server down / CORS on a real API) are logged by the
// browser as console errors; they are expected for a server-off G1 and are
// not app errors. Everything else fails the check.
const NETWORK_NOISE = /Failed to load resource|net::ERR_|ERR_NAME_NOT_RESOLVED|CORS|status of (4|5)\d\d/i

function watch(page) {
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error' && !NETWORK_NOISE.test(m.text())) errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  return errors
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true })
}

async function noHorizontalScroll(page) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
  expect(sw, 'horizontal scroll').toBeLessThanOrEqual(iw + 1)
}

async function minTarget(locator) {
  const box = await locator.boundingBox()
  expect(box, 'element visible').not.toBeNull()
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
}

const SYNTHETIC = /demo|sample user|lorem ipsum|John Doe|test@example|4\.5 hrs|₹1200\b/i

test.describe('G1 public surfaces', () => {
  test('landing: blue hero, Onest, CTA to /auth, no synthetic data', async ({ page }) => {
    const errors = watch(page)
    await page.goto('/')
    const cta = page.getByRole('link', { name: /Get Started/i })
    await expect(cta).toBeVisible()
    await minTarget(cta)
    const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
    expect(font).toMatch(/Onest/)
    await expect(page.locator('body')).not.toContainText(SYNTHETIC)
    await noHorizontalScroll(page)
    await shot(page, 'landing-light')
    await cta.click()
    await expect(page).toHaveURL(/\/auth/)
    expect(errors).toEqual([])
  })

  test('auth: five role chips, inline validation, real submit error, no prefill', async ({ page }) => {
    const errors = watch(page)
    await page.goto('/auth')
    for (const r of ['Customer', 'Mechanic', 'Garage', 'Seller', 'Fleet']) {
      await expect(page.getByRole('button', { name: new RegExp(r) })).toBeVisible()
    }
    await page.getByRole('button', { name: /Mechanic/ }).click()
    await expect(page.getByRole('button', { name: /Mechanic/ })).toHaveAttribute('aria-pressed', 'true')
    const email = page.getByLabel('Email Address')
    await expect(email).toHaveValue('')
    await expect(page.getByLabel('Password')).toHaveValue('')
    await expect(page.locator('input[type=tel], input[name*=otp i]')).toHaveCount(0)
    // Native browser validation must not pre-empt the designed inline errors.
    await expect(page.locator('form').first()).toHaveAttribute('novalidate', '')

    await email.fill('not-an-email')
    await page.getByLabel('Password').fill('secret123')
    await page.locator('form').first().evaluate((f) => f.requestSubmit())
    await expect(page.getByRole('alert').first()).toBeVisible()
    await shot(page, 'auth-validation')

    // Real submit: unknown account → real server answer (401/404) or, with the
    // server off, the real "Server unreachable" error. Never a fake success.
    await email.fill(`pilot-g1-${Date.now()}@invalid.clutchd.test`)
    await page.getByRole('button', { name: /^Sign In$/ }).click()
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 20000 })
    await expect(page).toHaveURL(/\/auth/)
    await shot(page, 'auth-submit-error')
    expect(errors).toEqual([])
  })

  test('authenticated dashboards redirect to /auth without a session', async ({ page }) => {
    for (const role of ['customer', 'mechanic', 'garage']) {
      await page.goto(`/dashboard/${role}`)
      await expect(page).toHaveURL(/\/auth/, { timeout: 15000 })
    }
  })

  test('marketplace: 5-item nav, overflow menu, no back on root, real states', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 1024, 'store bottom nav is mobile-only (lg:hidden) by design')
    const errors = watch(page)
    await page.goto('/marketplace')
    const nav = page.getByRole('navigation', { name: 'Store' })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('button')).toHaveCount(5)
    await expect(nav.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    for (const b of await nav.getByRole('button').all()) await minTarget(b)
    await expect(page.getByRole('button', { name: 'Go back' })).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(SYNTHETIC)
    await noHorizontalScroll(page)
    await shot(page, 'marketplace-home')

    await page.getByRole('button', { name: 'More options' }).click()
    await expect(page.getByRole('menuitem', { name: 'Emergency SOS' })).toBeVisible()
    await expect(page.getByText('Theme')).toBeVisible()
    await expect(page.getByText('Help & Support')).toBeVisible()
    await shot(page, 'marketplace-menu')
    await page.keyboard.press('Escape')

    for (const [label, url] of [['Categories', /categories/], ['Search', /search/], ['Cart', /cart/]]) {
      await nav.getByRole('button', { name: label }).click()
      await expect(page).toHaveURL(url)
      await expect(nav.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'page')
      await noHorizontalScroll(page)
      await shot(page, `marketplace-${label.toLowerCase()}`)
    }
    expect(errors).toEqual([])
  })

  test('detail screen has exactly one back arrow; unknown product is handled', async ({ page }) => {
    const errors = watch(page)
    await page.goto('/marketplace/product/id?id=does-not-exist')
    await expect(page.getByRole('button', { name: 'Go back' })).toHaveCount(1)
    await expect(page.locator('body')).toContainText(/not found|unavailable|couldn.t|try again/i, { timeout: 20000 })
    await shot(page, 'marketplace-product-missing')
    expect(errors).toEqual([])
  })

  test('404 page has a working Go home link', async ({ page }) => {
    await page.goto('/does-not-exist')
    const home = page.getByRole('link', { name: /Go home/i })
    await expect(home).toBeVisible()
    await minTarget(home)
    await home.click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('dark mode: tokens switch, no cream/white cards', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('clutchd_theme', 'dark'))
    await page.goto('/auth')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe('rgb(11, 18, 32)')
    const cardBg = await page.locator('.surface-card, [class*="bg-[var(--surface)]"]').first().evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(cardBg).not.toMatch(/rgb\(255, 255, 255\)|rgb\(255, 249, 235\)/)
    await shot(page, 'auth-dark')
    await page.goto('/')
    await shot(page, 'landing-dark')
  })

  test('reduced motion and 200% text keep the auth CTA reachable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/auth')
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    const submit = page.getByRole('button', { name: /^Sign In$/ })
    await submit.scrollIntoViewIfNeeded()
    await expect(submit).toBeVisible()
    await minTarget(submit)
    await shot(page, 'auth-200pct')
  })
})

// Responsive matrix for public routes.
const VIEWPORTS = [
  { w: 360, h: 800 }, { w: 390, h: 844 }, { w: 430, h: 932 }, { w: 1280, h: 800 }, { w: 844, h: 390 },
]
for (const vp of VIEWPORTS) {
  test(`matrix ${vp.w}x${vp.h}: no horizontal scroll on public routes`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: vp.h })
    for (const route of ['/', '/auth', '/marketplace']) {
      await page.goto(route)
      await page.waitForLoadState('networkidle').catch(() => {})
      await noHorizontalScroll(page)
      await page.screenshot({ path: path.join(SHOTS, `matrix${route.replace(/\//g, '-') || '-root'}-${vp.w}x${vp.h}.png`) })
    }
  })
}
