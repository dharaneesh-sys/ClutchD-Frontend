# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.js >> Landing Page >> should take landing page screenshot
- Location: e2e/landing.spec.js:36:7

# Error details

```
Error: A snapshot doesn't exist at /home/dinusus/ClutchD-App/e2e/landing.spec.js-snapshots/landing-page-chromium-linux.png, writing actual.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - navigation [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e8]: C
        - generic [ref=e9]: ClutchD
      - link "Sign In" [ref=e10] [cursor=pointer]:
        - /url: /auth
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e16]: Now live in Coimbatore
        - heading "Vehicle Service, On Demand." [level=1] [ref=e17]:
          - text: Vehicle Service,
          - text: On Demand.
        - paragraph [ref=e18]: Connect instantly with top-rated mechanics and premium garages nearby. Real-time tracking, transparent pricing, and trusted professionals.
        - generic [ref=e19]:
          - link "Get Started" [ref=e20] [cursor=pointer]:
            - /url: /auth
            - text: Get Started
            - img [ref=e21]
          - link "Sign In" [ref=e23] [cursor=pointer]:
            - /url: /auth
      - generic [ref=e25]:
        - generic [ref=e26]:
          - img [ref=e28]
          - heading "How it works" [level=3] [ref=e30]
          - paragraph [ref=e31]: Three steps to professional vehicle service
        - generic [ref=e32]:
          - generic [ref=e33] [cursor=pointer]:
            - generic [ref=e34]: "01"
            - generic [ref=e35]: Describe your issue and share your location
          - generic [ref=e36] [cursor=pointer]:
            - generic [ref=e37]: "02"
            - generic [ref=e38]: Get matched with verified mechanics nearby
          - generic [ref=e39] [cursor=pointer]:
            - generic [ref=e40]: "03"
            - generic [ref=e41]: Track arrival, approve pricing, and pay securely
    - generic [ref=e43]:
      - generic [ref=e44] [cursor=pointer]:
        - img [ref=e46]
        - heading "Instant Connect" [level=4] [ref=e48]
        - paragraph [ref=e49]: Get matched with nearby mechanics in seconds, not hours.
      - generic [ref=e50] [cursor=pointer]:
        - img [ref=e52]
        - heading "Live Tracking" [level=4] [ref=e55]
        - paragraph [ref=e56]: Watch your mechanic arrive in real-time on the map.
      - generic [ref=e57] [cursor=pointer]:
        - img [ref=e59]
        - heading "Verified Pros" [level=4] [ref=e61]
        - paragraph [ref=e62]: Every mechanic and garage is background-checked and rated.
      - generic [ref=e63] [cursor=pointer]:
        - img [ref=e65]
        - heading "24/7 Available" [level=4] [ref=e68]
        - paragraph [ref=e69]: Round-the-clock service for emergencies and scheduled repairs.
  - button "Open Next.js Dev Tools" [ref=e75] [cursor=pointer]:
    - img [ref=e76]
  - alert [ref=e79]
  - button "Switch to light mode" [ref=e80]:
    - img [ref=e81]
  - generic [ref=e89]:
    - generic [ref=e90]:
      - button "Toggle demo mode on" [ref=e91]
      - generic [ref=e93]: Demo Mode
    - button "Minimize demo toolbar" [ref=e95] [cursor=pointer]:
      - img [ref=e96]
```

# Test source

```ts
  1  | // @ts-check
  2  | import { test, expect } from '@playwright/test'
  3  | 
  4  | test.describe('Landing Page', () => {
  5  |   test('should load homepage with correct title', async ({ page }) => {
  6  |     await page.goto('/')
  7  |     await page.waitForSelector('.page-enter', { timeout: 10000 })
  8  | 
  9  |     // Check page title contains "ClutchD"
  10 |     await expect(page).toHaveTitle(/ClutchD/)
  11 | 
  12 |     // Verify the main heading is visible
  13 |     const heading = page.locator('h1')
  14 |     await expect(heading).toBeVisible()
  15 |     await expect(heading).toContainText('Vehicle Service')
  16 |   })
  17 | 
  18 |   test('should display CTA buttons', async ({ page }) => {
  19 |     await page.goto('/')
  20 |     await page.waitForSelector('.page-enter', { timeout: 10000 })
  21 | 
  22 |     // Check "Get Started" CTA button
  23 |     const getStarted = page.locator('a', { hasText: 'Get Started' })
  24 |     await expect(getStarted).toBeVisible()
  25 |     await expect(getStarted).toBeEnabled()
  26 | 
  27 |     // Check "Sign In" link in nav
  28 |     const signInNav = page.locator('nav a', { hasText: 'Sign In' })
  29 |     await expect(signInNav).toBeVisible()
  30 | 
  31 |     // Check feature cards are rendered (4 features)
  32 |     const features = page.locator('h4')
  33 |     await expect(features.first()).toBeVisible()
  34 |   })
  35 | 
  36 |   test('should take landing page screenshot', async ({ page }) => {
  37 |     await page.goto('/')
  38 |     await page.waitForSelector('.page-enter', { timeout: 10000 })
  39 |     await page.waitForTimeout(500) // let animations settle
  40 | 
> 41 |     await expect(page).toHaveScreenshot('landing-page.png', {
     |     ^ Error: A snapshot doesn't exist at /home/dinusus/ClutchD-App/e2e/landing.spec.js-snapshots/landing-page-chromium-linux.png, writing actual.
  42 |       fullPage: true,
  43 |       animations: 'disabled',
  44 |     })
  45 |   })
  46 | })
  47 | 
```