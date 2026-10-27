// G2 ONLY — real backend, real TEST_MECHANIC_* / TEST_GARAGE_* accounts.
// No interception. BLOCKED: real backend at G1. Run:
//   PILOT_REAL_BACKEND=1 TEST_MECHANIC_EMAIL=… TEST_MECHANIC_PASSWORD=… \
//   TEST_GARAGE_EMAIL=… TEST_GARAGE_PASSWORD=… \
//   npx playwright test e2e/pilot-partner.spec.js --project="Mobile Chrome"
import { test, expect } from '@playwright/test'

const enabled = process.env.PILOT_REAL_BACKEND === '1'

async function signIn(page, role, email, password) {
  await page.goto('/auth')
  await page.getByRole('button', { name: new RegExp(role, 'i') }).click()
  await page.getByLabel('Email Address').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /^Sign In$/ }).click()
  await expect(page).toHaveURL(new RegExp(`/dashboard/${role}`), { timeout: 30000 })
}

for (const role of ['mechanic', 'garage']) {
  const email = process.env[`TEST_${role.toUpperCase()}_EMAIL`]
  const password = process.env[`TEST_${role.toUpperCase()}_PASSWORD`]

  test.describe(`G2 ${role}: offer → advance → bill → complete`, () => {
    test.skip(!enabled, 'BLOCKED: real backend (set PILOT_REAL_BACKEND=1)')
    test.skip(!email || !password, `BLOCKED: TEST accounts (TEST_${role.toUpperCase()}_EMAIL/PASSWORD)`)

    test('home renders real stats and the 5-item nav', async ({ page }) => {
      const calls = []
      page.on('request', (r) => calls.push(`${r.method()} ${r.url()}`))
      await signIn(page, role, email, password)
      const nav = page.getByRole('navigation', { name: 'Dashboard' })
      await expect(nav.getByRole('button')).toHaveCount(5)
      if (role === 'garage') {
        await expect(page.getByRole('switch')).toHaveCount(0)
        await nav.getByRole('button', { name: 'Analytics' }).click()
        await expect(page.getByText('Not available in pilot')).toBeVisible()
      }
      expect(calls.some((c) => /POST .*\/jobs\/[^/]+\/assign/.test(c))).toBe(false)
    })

    test('accept the first real offer and advance it', async ({ page }) => {
      await signIn(page, role, email, password)
      if (role === 'garage') await page.getByRole('navigation', { name: 'Dashboard' }).getByRole('button', { name: 'Jobs' }).click()
      const accept = page.getByRole('button', { name: 'Accept' }).first()
      test.skip(!(await accept.isVisible({ timeout: 15000 }).catch(() => false)), 'BLOCKED: no pending TEST_ offer')
      const res = page.waitForResponse((r) => /\/offers\/.+\/accept/.test(r.url()))
      await accept.click()
      expect((await res).ok()).toBe(true)
      for (const [label, status] of [['Start navigation', 'en_route'], ['Start service', 'in_progress']]) {
        const patch = page.waitForResponse((r) => r.url().includes('/status') && r.request().method() === 'PATCH')
        await page.getByRole('button', { name: new RegExp(label) }).first().click()
        const p = await patch
        expect(p.ok()).toBe(true)
        expect(JSON.parse(p.request().postData() || '{}').status).toBe(status)
      }
      await page.getByRole('button', { name: /Bill customer/ }).first().click()
      await page.getByLabel(/Your service fee/).fill('100')
      await page.getByRole('button', { name: /Send bill/ }).click()
      await expect(page.getByTestId('invoice-sent')).toContainText('Awaiting payment')
    })
  })
}
