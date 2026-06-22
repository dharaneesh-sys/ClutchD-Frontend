# ClutchD — Production Readiness & Expansion Plan

## TL;DR

> **Quick Summary**: Deploy ClutchD from this repo to Render, fix Tailwind v4 production bugs, add test infra, refactor demo mode to compile-time gating, build a Capacitor APK, and layer priority-ordered features — all in one dependency-sequenced plan.
>
> **Deliverables**:
> - Render-deployed app from this repo (standalone build, <150MB Docker image)
> - Tailwind v4 template-literal classes fixed (CSS variables approach)
> - Theme system refactored: zero `isLight` ternaries, pure CSS variable theming
> - Demo mode: compile-time gated via `NEXT_PUBLIC_DEMO_MODE` env var
> - Test suite: Vitest (unit) + Playwright (E2E)
> - Capacitor-ready Android project (`capacitor.config.ts`, `android/`)
> - PWA manifest + service worker
> - Production features: CSP hardening, CI lint+test, bundle-analyzer fix
> - Low-priority major features: chat, i18n, booking, referral (Wave 5)
>
> **Estimated Effort**: XL (46 implementation tasks across 9 waves + final verification)
> **Parallel Execution**: YES — 9 waves with maximum parallelism (8 parallel, 1 sequential final)
> **Critical Path**: Task 1 (standalone config) → Task 3 (CSS vars) → Task 9 (ThemeProvider) → Task 39 (marketplace layout) → Task F1-F4 (verification)
> **Execution Mode**: HIGH_ACCURACY — Momus-reviewed and approved ✅

---

## Context

### Original Request
Thoroughly search the ClutchD-App and backend, then make a comprehensive plan for:
1. Every minor feature making the app production-ready
2. New major features for expansion
3. Google Maps API assessment (RESULT: out of scope — no budget, keep Leaflet)
4. Improve demo mode (make easily removable for production)
5. Steps for APK/mobile installable (Capacitor)
6. Fix the render pipeline (OOM build failure)

### Interview Summary
**Key Discussions**:
- Render build fails with OOM/timeout on free tier (512MB RAM)
- Google Maps: No budget — keep Leaflet/OSM entirely
- Backend at clutchd-api.onrender.com is NOT deployed (failed)
- Mobile: Capacitor (native Android APK) is the priority
- Tailwind v4 template-literal classes don't render in production — BLOCKING BUG
- Theme refactor (isLight → CSS vars): Include (fixes production bug + reduces re-renders)
- Major features (chat, i18n, booking, referral): Include as low-priority items
- Test strategy: Tests After (Vitest + Playwright)
- Error monitoring: Deferred to low priority
- **Product Marketplace App added (user expansion request)**: Full spare parts marketplace with multi-vendor comparison, search, filters, cart, checkout, reviews — integrated as Wave 6

**Research Findings**:
- 55+ files use `isLight` pattern + `useThemeStore()` for conditional classes
- Tailwind v4 JIT cannot resolve `` `text-${x}-${y}` `` template-literal classes → they silently fail in production
- Demo mode is deeply coupled: wraps entire app in `layout.js`, intercepts axios in `api.js`
- `@next/bundle-analyzer` v15 mismatched with Next.js 16
- AuthInit has dead migration code (`clutchd_token_migrated`)
- Toast store lives in `lib/stores/` not `store/`
- Dockerfile lacks `output: 'standalone'` → Docker image ~500MB
- No test infra, no PWA, no mobile setup

### Metis Review
**Identified Gaps** (addressed):
- Google Maps budget: User confirmed no budget, removed from plan
- Backend readiness: User confirmed backend is NOT deployed, plan treats as frontend-only
- Theme refactor scope: User confirmed INCLUDE
- Tailwind v4 bug severity: Confirmed BLOCKING, added as Wave 1 priority
- Capacitor vs PWA path: User confirmed Capacitor FIRST
- Major features scope: User confirmed INCLUDE as lower priority

---

## Work Objectives

### Core Objective
Deploy ClutchD from this repo to Render, fix the OOM build failure, refactor demo mode to compile-time gating, fix Tailwind v4 production bugs, add test infrastructure (Vitest+Playwright), build Capacitor APK for Android, and layer priority-ordered features — all in one dependency-ordered plan with deploy success as the first milestone.

### Concrete Deliverables
- `next.config.mjs` with `output: 'standalone'` and fixed bundle-analyzer
- Dockerfile with standalone output (image < 150MB)
- All 55+ `isLight` ternaries replaced with CSS-only theming
- Demo mode gated by `NEXT_PUBLIC_DEMO_MODE` env var (zero demo code in production bundle)
- Vitest test suite (stores, utils, validators) + Playwright smoke tests
- `capacitor.config.ts`, `android/` directory, build scripts
- PWA manifest + service worker
- CI pipeline with lint + test steps
- Major feature scaffolds: chat, i18n, booking, referral
- **Product Marketplace MVP**: Home screen, search, filters, product detail with vendor comparison, cart, checkout, reviews

### Definition of Done
- [ ] `curl https://clutchd-app.onrender.com` returns HTTP 200
- [ ] `grep -r "isLight" src/` returns empty
- [ ] `grep -r "__DEMO_MODE__" .next/standalone/` returns empty when `NEXT_PUBLIC_DEMO_MODE=false`
- [ ] `npx vitest run --reporter=verbose` passes all tests
- [ ] `npx playwright test` passes all E2E tests
- [ ] `npx next build` succeeds with `output: 'standalone'`
- [ ] `ls android/` exists with Gradle project
- [ ] `curl https://clutchd-app.onrender.com/manifest.json` returns valid manifest
- [ ] Navigate to `/marketplace` — home screen renders with categories, featured products, offers
- [ ] Search "brake" at `/marketplace/search?q=brake` — returns results with vendor info
- [ ] Product detail at `/marketplace/product/p-1` — shows vendor comparison table
- [ ] Full cart-to-checkout-to-order flow works end-to-end

### Must Have
- Render deploy succeeds from this repo
- Tailwind v4 template-literal classes fixed (production bug)
- Demo mode fully removable via build-time env var
- Zero `isLight` ternaries in components
- Test infrastructure installed and passing
- Capacitor Android project scaffolded
- All existing demo functionality preserved when enabled
- CSP updated (remove unsafe-eval if possible)
- **Marketplace MVP**: Home screen with categories, search with filters, product detail with vendor comparison, cart-to-checkout flow, customer reviews

### Must NOT Have (Guardrails)
- No Google Maps integration (no budget)
- No backend code changes (frontend-only repo)
- No actual app store submission (setup only — no app store accounts)
- No premature abstraction or over-engineering
- No breaking changes to existing demo mode functionality
- No modification of backend API contracts
- No adding features that require backend endpoints without verifying they exist
- No removal of Leaflet/OSM (it works, keep it)
- **Marketplace**: No real payment processing — demo/simulated only. No server-side search — all client-side filtering on demo data. No address autocomplete. No real backend dependency.

---

## Verification Strategy (MANDATORY)

### Momus Review (High Accuracy)
- **Commit strategy alignment**: FIX APPLIED ✅
- **All file references**: VERIFIED ✅ (40+ files, all exist with correct line ranges)
- **Task coverage**: 46/46 tasks — all have acceptance criteria + QA scenarios
- **Verdict**: OKAY ✅ (Momus approved)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO (setting up from scratch)
- **Automated tests**: YES (Tests-After)
- **Framework**: Vitest (unit) + Playwright (E2E)
- **Tools**: `vitest`, `@playwright/test`, `@testing-library/react`

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.omo/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Playwright — navigate, interact, assert DOM, screenshot
- **Build**: Bash — `npm run build` verify exit code + output checks
- **Lint**: Bash — `npx lint` verify clean
- **Tests**: Bash — `npx vitest run` verify pass
- **Bundles**: Bash — check bundle contents for demo code or env var presence

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (FOUNDATION — 8 parallel tasks):
├── Task 1: next.config.mjs — standalone output + fix bundle-analyzer
├── Task 2: Dockerfile — standalone optimization + .dockerignore
├── Task 3: globals.css — CSS variable theming system (base for Tailwind fix)
├── Task 4: render.yaml — add missing env vars + memory config
├── Task 5: AuthInit cleanup — remove dead migration code
├── Task 6: Toast store — relocate from lib/stores/ to store/
├── Task 7: .env.example + env validation
├── Task 8: package.json — install Vitest + Playwright

Wave 2A (THEME REFACTOR — 6 parallel tasks after Wave 1):
├── Task 9: ThemeProvider — pure CSS variable theming, remove JS-based theme
├── Task 10: Refactor ui/ components (Button, Input, Select, Modal, etc.) — remove isLight
├── Task 11: Refactor DashboardShell + dashboard pages — remove isLight
├── Task 12: Refactor auth components — remove isLight
├── Task 13: Refactor admin components — remove isLight
├── Task 14: Refactor dashboard components (MapView, ServiceRequestPanel, etc.) — remove isLight

Wave 2B (DEMO MODE GATING — 3 parallel tasks after Wave 2A):
├── Task 15: Demo mode — compile-time flag system (next.config.mjs env var)
├── Task 16: Demo mode — refactor layout.js + api.js to conditional import
├── Task 17: Demo mode — verify tree-shaking (zero bytes in production bundle)

Wave 3 (INFRASTRUCTURE — 7 parallel tasks after Wave 2):
├── Task 18: Vitest setup + initial tests (stores, utils, validators)
├── Task 19: Playwright setup + config + CI integration
├── Task 20: PWA manifest + service worker
├── Task 21: CSP hardening + security headers review
├── Task 22: CI pipeline — add lint + test steps to GitHub Actions
├── Task 23: Error monitoring setup (Sentry)
├── Task 24: SEO — sitemap.xml, robots.txt, structured data

Wave 4 (MOBILE — 5 parallel tasks after Wave 3):
├── Task 25: Capacitor — install + init config
├── Task 26: next.config.mjs — export mode conditional for Capacitor build
├── Task 27: Capacitor — add Android platform
├── Task 28: Build script — npm run build:android
├── Task 29: Capacitor — fix WebSocket URL for Capacitor protocol

Wave 5 (MAJOR FEATURES — 5 parallel tasks after Wave 4):
├── Task 30: Real-time chat scaffold (WebSocket-based basic chat UI)
├── Task 31: i18n infrastructure (next-intl or similar)
├── Task 32: Schedule booking feature scaffold
├── Task 33: Referral system scaffold
├── Task 34: Enhanced Leaflet map (clustering, better markers)

Wave 6A (MARKETPLACE FOUNDATION — 5 parallel tasks after Wave 5):
├── Task 35: Marketplace stores (Zustand — product, cart, order, category)
├── Task 36: Marketplace constants + filter options
├── Task 37: Marketplace demo data + API interceptor extension
├── Task 38: Bottom navigation component (Home, Categories, Search, Cart, Profile)
├── Task 45: Marketplace asset placeholders (category icons, product image fallbacks)

Wave 6B (MARKETPLACE UI — 7 tasks after Wave 6A, partially sequential):
├── Task 39: Marketplace route group layout + routing (blocks 40-44, 46)
├── Task 40: Marketplace home screen (categories grid, featured products, offers)
├── Task 41: Search bar + filter panel + search results page
├── Task 42: Product detail page with vendor comparison table
├── Task 43: Cart screen + checkout flow + order confirmation
├── Task 44: Customer reviews section + review submission
└── Task 46: Product listing tests + demo mode QA

Wave FINAL (VERIFICATION — 4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA — Playwright end-to-end (unspecified-high)
├── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 3 → Task 9 → Task 15 → Task 18 → Task 25 → Task 35 → Task 39 → Task 41 → Task F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 8 (Wave 1, Wave 2A)
```

---

## TODOs

- [x] 1. **next.config.mjs — Add standalone output + fix bundle-analyzer version**

  **What to do**:
  - Add `output: 'standalone'` to nextConfig (for Render/Docker)
  - Add `images: { unoptimized: true }` for static export compatibility
  - Fix `@next/bundle-analyzer` import: update from `^15.3.2` to match Next.js 16 (use `next` bundle-analyzer or remove the conditional)
  - Add env var for demo mode: `NEXT_PUBLIC_DEMO_MODE` with default `true`
  - Add env var for build mode: `NEXT_PUBLIC_BUILD_MODE` to switch between `standalone` and `export`

  **Must NOT do**:
  - Don't remove existing security headers
  - Don't break CSP (only add env var references)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file config change, well-defined task
  - **Skills**: None needed

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-8)
  - **Blocks**: 3, 9, 25, 26
  - **Blocked By**: None (start immediately)

  **References**:
  - `next.config.mjs:1-38` — Current config to modify
  - `next-steps.md:102-104` — Already documents need for `output: 'standalone'`
  - `roadmap.md:34-38` — Already documents static export pattern

  **Acceptance Criteria**:
  - [ ] `next.config.mjs` has `output: 'standalone'` when `NEXT_PUBLIC_BUILD_MODE !== 'export'`
  - [ ] `npm run build` succeeds
  - [ ] `ANALYZE=true npm run build` works (no bundle-analyzer crash)
  - [ ] `grep -r "output.*standalone" next.config.mjs` matches

  **QA Scenarios**:
  ```
  Scenario: Build succeeds with standalone output
    Tool: Bash
    Steps:
      1. Run `npm run build`
    Expected Result: Exit code 0, output contains "Creating an optimized production build"
    Evidence: .omo/evidence/task-1-build-success.txt

  Scenario: Bundle analyzer version is compatible
    Tool: Bash
    Steps:
      1. Run `ANALYZE=true npm run build 2>&1 || true` (may fail gracefully if analyzer broken)
    Expected Result: No crash due to version mismatch (or analyzer cleanly removed)
    Evidence: .omo/evidence/task-1-analyzer-check.txt
  ```

  **Commit**: YES
  - Message: `build(config): add standalone output, fix bundle-analyzer compat`
  - Files: `next.config.mjs`, `package.json`

- [x] 2. **Dockerfile — Optimize for standalone output + add .dockerignore**

  **What to do**:
  - After `next.config.mjs` has `output: 'standalone'`, update Dockerfile:
    - Copy `.next/standalone/` instead of `.next/` + full `node_modules`
    - Copy `public/` and `.next/static/` into the standalone directory
    - Update `CMD` to use `server.js` from standalone
  - Create `.dockerignore` (node_modules, .git, .next, etc.)

  **Must NOT do**:
  - Don't change the multi-stage build pattern
  - Don't remove existing security precautions

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file config + one new file

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3-8)
  - **Blocks**: None directly (but deploy depends on it)
  - **Blocked By**: Task 1 (needs standalone output config)

  **References**:
  - `Dockerfile:1-48` — Current Dockerfile
  - `next-steps.md:102-104` — Documents need for standalone

  **Acceptance Criteria**:
  - [ ] Docker image build succeeds
  - [ ] Docker image size < 200MB (verify with `docker images`)
  - [ ] `docker compose up` starts app on port 3000

  **QA Scenarios**:
  ```
  Scenario: Docker build succeeds
    Tool: Bash
    Steps:
      1. Run `docker build -t clutchd-app . 2>&1`
    Expected Result: Exit code 0, image created
    Evidence: .omo/evidence/task-2-docker-build.txt

  Scenario: Docker image is optimized
    Tool: Bash
    Steps:
      1. Run `docker images clutchd-app --format "{{.Size}}"`
    Expected Result: Size < 200MB
    Evidence: .omo/evidence/task-2-docker-size.txt
  ```

  **Commit**: YES
  - Message: `build(docker): optimize with standalone output, add .dockerignore`
  - Files: `Dockerfile`, `.dockerignore`

- [x] 3. **globals.css — Add CSS variable theming infrastructure**

  **What to do**:
  - Add `data-theme` attribute-based theming to globals.css (`[data-theme="light"]` selectors alongside `.light`)
  - Ensure ALL CSS variable definitions work with either `.light` class or `[data-theme="light"]` attribute
  - Add CSS-only utility classes for text/background colors (no JS required)
  - Verify no CSS variable is duplicated across both selectors

  **Must NOT do**:
  - Don't remove existing `.light` class support (migration period)
  - Don't change existing component styles

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: CSS infrastructure, design system tokens

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-2, 4-8)
  - **Blocks**: 9 (ThemeProvider refactor), 10-14 (component refactors)
  - **Blocked By**: None

  **References**:
  - `src/app/globals.css:1-618` — Full current CSS
  - `src/components/ui/ThemeProvider.js:1-12` — Current theme provider

  **Acceptance Criteria**:
  - [ ] `[data-theme="light"]` selectors mirror `.light` class exactly
  - [ ] CSS variable definitions compile without error
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: CSS builds without errors
    Tool: Bash
    Steps:
      1. Run `npm run build 2>&1 | grep -i "css\|style\|error" | head -20`
    Expected Result: No CSS-related errors
    Evidence: .omo/evidence/task-3-css-build.txt
  ```

  **Commit**: YES (groups with Task 9)
  - Message: `refactor(theme): add data-theme CSS infrastructure`
  - Files: `src/app/globals.css`

- [x] 4. **render.yaml — Add missing env vars + memory config**

  **What to do**:
  - Add `NEXT_PUBLIC_DEMO_MODE` env var (default `false` for production)
  - Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` placeholder
  - Add `NEXT_PUBLIC_ACCESS_TTL_MINUTES` default
  - Keep existing `NODE_OPTIONS=--max-old-space-size=2048` (already present)
  - Verify build command is correct: `npm ci && npm run build`

  **Must NOT do**:
  - Don't remove existing env vars
  - Don't add secrets in plaintext

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple config file update

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: F1 (deploy verification)
  - **Blocked By**: Task 1 (needs to know env var names)

  **References**:
  - `render.yaml:1-17` — Current config
  - `env.local.example:1-16` — All env vars used

  **Acceptance Criteria**:
  - [ ] `render.yaml` includes all env vars from `env.local.example`
  - [ ] `NEXT_PUBLIC_DEMO_MODE=false` for production

  **Commit**: YES (groups with Task 1)
  - Message: `chore(render): add missing env vars`
  - Files: `render.yaml`

- [x] 5. **AuthInit.js — Remove dead migration code**

  **What to do**:
  - Remove the `clutchd_token_migrated` localStorage migration logic
  - Keep the demo-user skip check (still needed)
  - Simplify `AuthInit` to just call `checkAuth()` with the demo-user skip
  - Remove `MIGRATION_KEY` constant

  **Must NOT do**:
  - Don't break the demo user skip logic (lines 17-19)
  - Don't remove the `checkAuth()` call

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file cleanup, well-understood dead code

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/components/ui/AuthInit.js:1-25` — Current file with dead code

  **Acceptance Criteria**:
  - [ ] No references to `clutchd_token_migrated` in codebase
  - [ ] `grep -r "MIGRATION_KEY" src/` returns empty
  - [ ] Auth still initializes correctly (demo mode skip + checkAuth)

  **Commit**: YES
  - Message: `chore(cleanup): remove dead AuthInit migration code`
  - Files: `src/components/ui/AuthInit.js`

- [x] 6. **Toast store — Relocate from lib/stores/ to store/**

  **What to do**:
  - Move `src/lib/stores/toastStore.js` → `src/store/toastStore.js`
  - Update `ToastProvider.js` import to use new path
  - Remove old `src/lib/stores/` directory
  - Update any other references to the old path

  **Must NOT do**:
  - Don't change toast store logic
  - Don't break ToastProvider functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file move + import update

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/lib/stores/toastStore.js:1-30` — Current toast store
  - `src/components/ui/ToastProvider.js` — Importer
  - `src/store/` — Existing stores for pattern reference

  **Acceptance Criteria**:
  - [ ] `src/store/toastStore.js` exists
  - [ ] `src/lib/stores/` no longer exists (or is empty)
  - [ ] `npm run build` succeeds
  - [ ] Toast functionality works (verify via Playwright if possible)

  **Commit**: YES
  - Message: `refactor(stores): relocate toastStore to store/ directory`
  - Files: `src/store/toastStore.js`, `src/components/ui/ToastProvider.js`

- [x] 7. **Environment variable validation + .env.example update**

  **What to do**:
  - Update `env.local.example` to include ALL env vars used in the app
  - Create lightweight env validation at build time (fail fast if required vars missing)
  - Document each env var with clear description and examples

  **Must NOT do**:
  - Don't add sensitive/secret values to the example file
  - Don't create complex validation library

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation + simple validation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `env.local.example:1-16` — Current example file
  - `src/lib/constants.js:55-68` — Where env vars are read
  - `src/lib/api.js` — API_BASE_URL usage
  - `src/lib/socket.js` — WS_URL usage
  - `src/store/authStore.js:10` — ACCESS_TTL_MINUTES usage

  **Acceptance Criteria**:
  - [ ] `env.local.example` lists all env vars with descriptions
  - [ ] Build-time validation catches missing critical vars

  **Commit**: YES (groups with Task 1)
  - Message: `chore(env): update env docs and add build-time validation`
  - Files: `env.local.example`, `src/lib/constants.js`

- [x] 8. **package.json — Install Vitest + Playwright dependencies**

  **What to do**:
  - Add `vitest` as devDependency
  - Add `@playwright/test` as devDependency
  - Add `@testing-library/react` as devDependency
  - Add test scripts: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`
  - Create basic `vitest.config.js` or configure in package.json
  - Create basic Playwright config (`playwright.config.js`)

  **Must NOT do**:
  - Don't remove existing dependencies
  - Don't change existing scripts
  - Don't install unnecessary testing libraries

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Dependency installation + basic config files

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 18 (Vitest test writing), 19 (Playwright test writing)
  - **Blocked By**: None

  **References**:
  - `package.json:1-35` — Current dependencies and scripts

  **Acceptance Criteria**:
  - [ ] `npx vitest --version` succeeds
  - [ ] `npx playwright --version` succeeds
  - [ ] `npm test` runs (even if no tests exist yet, should pass)
  - [ ] `npm run test:e2e` runs Playwright (should pass even without tests)

  **Commit**: YES
  - Message: `test: add vitest + playwright dependencies`
  - Files: `package.json`, `vitest.config.js`, `playwright.config.js`

- [x] 9. **ThemeProvider — Switch to pure CSS variable theming, remove JS-based isLight**

  **What to do**:
  - Refactor `ThemeProvider.js` to set `data-theme` attribute on `<html>` instead of toggling class
  - Remove `useThemeStore` from ThemeProvider (use simple react state + localStorage)
  - Ensure theme is read from localStorage on init (already works via inline script in layout.js)
  - Update `themeStore.js` to work with the new approach
  - Verify `ThemeToggle.js` still works correctly
  - Test both light and dark mode render correctly

  **Must NOT do**:
  - Don't remove the inline script in `layout.js` (prevents flash)
  - Don't break theme persistence

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Theming infrastructure, design system work

  **Parallelization**:
  - **Can Run In Parallel**: YES (within Wave 2)
  - **Parallel Group**: Wave 2 (with Tasks 10-17)
  - **Blocks**: None directly (enables component refactors)
  - **Blocked By**: Task 3 (CSS variable infrastructure)

  **References**:
  - `src/components/ui/ThemeProvider.js:1-12` — Current provider
  - `src/components/ui/ThemeToggle.js:1-30` — Theme toggle button
  - `src/store/themeStore.js:1-15` — Current theme store
  - `src/app/layout.js:48-61` — Inline script for theme
  - `src/app/globals.css:63-122` — Light theme CSS variables

  **Acceptance Criteria**:
  - [ ] Theme switch works (dark ↔ light) via ThemeToggle
  - [ ] Theme persists across page refresh
  - [ ] No flash of wrong theme on page load
  - [ ] `data-theme` attribute on `<html>` reflects current theme
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Theme toggle works with data-theme attribute
    Tool: Playwright
    Steps:
      1. Navigate to /
      2. Click theme toggle button
      3. Check html[data-theme] attribute
    Expected Result: data-theme toggles between "dark" and "light"
    Evidence: .omo/evidence/task-9-theme-toggle.txt
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `refactor(theme): switch to data-theme CSS variable approach`
  - Files: `src/components/ui/ThemeProvider.js`, `src/store/themeStore.js`, `src/components/ui/ThemeToggle.js`

- [x] 10. **Refactor ui/ components — Remove isLight ternaries (Batch 1: core components)**

  **What to do**:
  - Refactor these ui components to use CSS variables instead of `isLight`:
    - `Button.js`, `Input.js`, `Select.js`, `Modal.js`, `GlassCard.js`
  - For each: remove `const { theme } = useThemeStore()` and `const isLight = theme === "light"`
  - Replace conditional class strings with CSS variable-based classes
  - Use existing `--foreground`, `--surface`, `--on-surface-variant`, etc. CSS variables
  - For template-literal Tailwind classes like `` `text-${config.color}-600` ``, replace with hardcoded CSS variable classes

  **Must NOT do**:
  - Don't change component behavior or layout
  - Don't remove Tailwind entirely (only dynamic class patterns)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component refactoring, design system

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 11-17)
  - **Blocks**: None
  - **Blocked By**: Task 3 (CSS variable infrastructure), Task 9 (ThemeProvider)

  **References**:
  - `src/components/ui/Button.js` — has `isLight` pattern
  - `src/components/ui/Input.js` — has `isLight` pattern
  - `src/components/ui/Select.js` — has `isLight` pattern
  - `src/components/ui/Modal.js` — has `isLight` pattern
  - `src/components/ui/GlassCard.js` — has `isLight` pattern
  - `src/app/globals.css` — CSS variable definitions to use

  **Acceptance Criteria**:
  - [ ] `grep -r "useThemeStore" src/components/ui/Button.js` returns empty
  - [ ] `grep -r "isLight" src/components/ui/Button.js src/components/ui/Input.js src/components/ui/Select.js src/components/ui/Modal.js src/components/ui/GlassCard.js` returns empty
  - [ ] All 5 components render correctly in both dark and light mode
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Components render in dark mode
    Tool: Playwright
    Steps:
      1. Navigate to /auth (where buttons/inputs/selects are visible)
      2. Verify all components are visible and styled
      3. Take screenshot
    Expected Result: Components render with correct dark theme styling
    Evidence: .omo/evidence/task-10-ui-dark.png
  ```

  **Commit**: YES (groups with Tasks 11-14)
  - Message: `refactor(theme): remove isLight from ui/ core components`
  - Files: `src/components/ui/Button.js`, `src/components/ui/Input.js`, `src/components/ui/Select.js`, `src/components/ui/Modal.js`, `src/components/ui/GlassCard.js`

- [x] 11. **Refactor DashboardShell + dashboard pages — Remove isLight (Batch 2)**

  **What to do**:
  - Refactor `DashboardShell.js` to use CSS variables instead of isLight template-literal classes
  - The critical fix: replace `` `text-${config.color}-${shade}` `` patterns with CSS variable-based equivalents
  - Refactor: `src/components/ui/DashboardShell.js`, `src/app/dashboard/customer/page.js`, `src/app/dashboard/garage/page.js`, `src/app/dashboard/mechanic/page.js`
  - For each dashboard page: remove `useThemeStore()` import + `isLight` variable
  - Replace with CSS variable classes or hardcoded theme-aware classes

  **Must NOT do**:
  - Don't change dashboard layout or functionality
  - Don't break sidebar navigation

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Dashboard UI, theme refactoring

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 9

  **References**:
  - `src/components/ui/DashboardShell.js:1-209` — Current with template-literal classes
  - `src/app/dashboard/customer/page.js:44-45` — isLight usage
  - `src/app/dashboard/garage/page.js:20-21` — isLight usage
  - `src/app/dashboard/mechanic/page.js:32-33` — isLight usage

  **Acceptance Criteria**:
  - [ ] `grep -r "isLight" src/components/ui/DashboardShell.js` returns empty
  - [ ] `grep -r "isLight" src/app/dashboard/` returns empty
  - [ ] All dashboards render correctly in both theme modes

  **Commit**: YES (groups with Tasks 10, 12-14)
  - Message: `refactor(theme): remove isLight from DashboardShell + dashboard pages`
  - Files: `src/components/ui/DashboardShell.js`, `src/app/dashboard/customer/page.js`, `src/app/dashboard/garage/page.js`, `src/app/dashboard/mechanic/page.js`

- [x] 12. **Refactor auth components — Remove isLight (Batch 3)**

  **What to do**:
  - Refactor: `src/app/auth/page.js`, `src/components/auth/LoginCard.js`, `src/components/auth/SignUpCard.js`
  - Remove all `useThemeStore()` imports and `isLight` ternaries
  - Replace with CSS variable-based classes

  **Must NOT do**:
  - Don't change auth flow or form validation
  - Don't remove Google OAuth button

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Auth UI refactoring

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 9

  **References**:
  - `src/app/auth/page.js:11-12` — isLight usage
  - `src/components/auth/LoginCard.js` — isLight usage (check for imports)

  **Acceptance Criteria**:
  - [ ] `grep -r "isLight" src/app/auth/` returns empty
  - [ ] `grep -r "isLight" src/components/auth/` returns empty
  - [ ] Auth page renders correctly in both themes

  **Commit**: YES (groups with Tasks 10-11, 13-14)
  - Message: `refactor(theme): remove isLight from auth components`
  - Files: `src/app/auth/page.js`, `src/components/auth/LoginCard.js`, `src/components/auth/SignUpCard.js`

- [x] 13. **Refactor admin components — Remove isLight (Batch 4)**

  **What to do**:
  - Refactor admin layout and page components to remove `useThemeStore()` + `isLight`
  - Files to check: `src/app/admin/layout.js`, `src/app/admin/page.js`, all `admin/*/page.js`
  - Admin sub-components: `AdminOverview.js`, `Sidebar.js`, etc.
  - Replace with CSS variable-based styling

  **Must NOT do**:
  - Don't change admin functionality
  - Don't break admin sidebar layout

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Admin panel UI refactoring

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 9

  **References**:
  - `src/app/admin/layout.js` — Check for isLight patterns
  - `src/components/admin/` — All admin components

  **Acceptance Criteria**:
  - [ ] `grep -r "isLight" src/app/admin/` returns empty (if was present)
  - [ ] `grep -r "isLight" src/components/admin/` returns empty (if was present)
  - [ ] Admin pages render correctly in both themes

  **Commit**: YES (groups with Tasks 10-12, 14)
  - Message: `refactor(theme): remove isLight from admin components`
  - Files: `src/app/admin/` (as needed), `src/components/admin/` (as needed)

- [x] 14. **Refactor remaining dashboard + misc components — Remove isLight (Batch 5)**

  **What to do**:
  - Check and refactor: `MapView.js`, `ServiceRequestPanel.js`, `ServiceStatusTracker.js`, `PaymentModal.js`, `ReviewModal.js`, `ProviderList.js`, `ServiceHistory.js`, `ConnectionIndicator.js`, `NotificationBell.js`, `SOSButton.js`
  - Remove `useThemeStore()` imports and `isLight` ternaries
  - Replace with CSS variable classes or hardcoded theme-aware styling

  **Must NOT do**:
  - Don't change component behavior
  - Don't break map rendering or payment flow

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Dashboard/map UI components

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 9

  **References**:
  - `src/components/dashboard/MapView.js:31-32` — isLight usage
  - `src/components/ui/ConnectionIndicator.js:33-34` — isLight usage
  - `src/components/dashboard/` — all dashboard components

  **Acceptance Criteria**:
  - [ ] `grep -r "isLight" src/components/dashboard/` returns empty
  - [ ] `grep -r "isLight" src/components/ui/ConnectionIndicator.js` returns empty
  - [ ] `grep -r "isLight" src/components/ui/NotificationBell.js` returns empty
  - [ ] Map renders correctly in both themes

  **Commit**: YES (groups with Tasks 10-13)
  - Message: `refactor(theme): remove isLight from dashboard + misc components`
  - Files: `src/components/dashboard/` (as needed), `src/components/ui/ConnectionIndicator.js`

- [x] 15. **Demo mode — Create compile-time flag system**

  **What to do**:
  - Add `NEXT_PUBLIC_DEMO_MODE` to build-time env vars in `next.config.mjs` with React replacement
  - Create a centralized demo flag: `src/lib/demo/demoFlag.js`:
    ```js
    export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    export const DEMO_USER_ONLY = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    ```
  - This allows tree-shaking: when `NEXT_PUBLIC_DEMO_MODE=false`, all `if (DEMO_MODE)` branches are dead code eliminated by the bundler
  - Add `define` or `publicRuntimeConfig` in next.config.mjs to replace the env var at build time
  - Actually, simplest approach: use `process.env.NEXT_PUBLIC_DEMO_MODE` directly in components. Next.js replaces these at build time for client components via `NEXT_PUBLIC_` prefix.

  **Must NOT do**:
  - Don't remove existing demo functionality
  - Don't break demo mode when enabled

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Config + single utility file

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 16, 17
  - **Blocked By**: Task 1 (next.config.mjs changes)

  **References**:
  - `next.config.mjs` — Where env vars are configured
  - `src/lib/demo/demoMode.js` — Where `__DEMO_MODE__` is currently used
  - `src/lib/demo/apiInterceptor.js` — Where demo intercepts API

  **Acceptance Criteria**:
  - [ ] `src/lib/demo/demoFlag.js` exists with `DEMO_MODE` export
  - [ ] When `NEXT_PUBLIC_DEMO_MODE=false`, `DEMO_MODE` is `false`
  - [ ] When `NEXT_PUBLIC_DEMO_MODE=true`, `DEMO_MODE` is `true`

  **Commit**: YES (groups with Tasks 16-17)
  - Message: `feat(demo): add compile-time demo mode flag`
  - Files: `src/lib/demo/demoFlag.js`, `next.config.mjs`

- [x] 16. **Demo mode — Refactor layout.js and api.js for conditional imports**

  **What to do**:
  - Refactor `src/app/layout.js`:
    - Wrap `DemoModeProvider` and `DemoToolbar` in conditional: `{DEMO_MODE && <DemoModeProvider>...</DemoModeProvider>}`
    - When `DEMO_MODE=false`, these imports are tree-shaken
  - Refactor `src/lib/api.js`:
    - Remove the dynamic `import("./demo/apiInterceptor")` from the request interceptor
    - Instead, use a static import with build-time conditional:
      ```js
      if (DEMO_MODE) {
        const { handleDemoApiRequest } = require("./demo/apiInterceptor");
        // ...
      }
      ```
  - Use `DEMO_MODE` from `demoFlag.js` for all conditional checks
  - Replace `window.__DEMO_MODE__` references with `DEMO_MODE` import

  **Must NOT do**:
  - Don't break the axios interceptor flow
  - Don't remove demo mode functionality when enabled

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex refactoring with build-time conditional logic

  **Parallelization**:
  - **Can Run In Parallel**: YES (with other Wave 2 tasks)
  - **Parallel Group**: Wave 2
  - **Blocks**: 17
  - **Blocked By**: 15 (demo flag system)

  **References**:
  - `src/app/layout.js:7-8,68,74` — DemoModeProvider + DemoToolbar imports
  - `src/lib/api.js:6,21-40` — Dynamic import of demo interceptor
  - `src/lib/demo/demoFlag.js` — New compile-time flag

  **Acceptance Criteria**:
  - [ ] When `NEXT_PUBLIC_DEMO_MODE=false`, `DemoModeProvider` is not in the component tree
  - [ ] When `NEXT_PUBLIC_DEMO_MODE=false`, demo interceptor is never imported
  - [ ] When `NEXT_PUBLIC_DEMO_MODE=true`, all demo functionality works
  - [ ] `npm run build` succeeds with both true and false

  **QA Scenarios**:
  ```
  Scenario: Demo mode is tree-shaken from production build
    Tool: Bash
    Steps:
      1. NEXT_PUBLIC_DEMO_MODE=false npm run build
      2. grep -r "demoMode\|DemoModeProvider\|__DEMO_MODE__" .next/standalone/ || true
    Expected Result: No demo code references in production bundle
    Evidence: .omo/evidence/task-16-tree-shake.txt

  Scenario: Demo mode works when enabled
    Tool: Playwright
    Steps:
      1. NEXT_PUBLIC_DEMO_MODE=true npm run dev (or use build with true)
      2. Navigate to /
      3. Verify DemoToolbar is visible
    Expected Result: Demo toolbar appears, demo functionality works
    Evidence: .omo/evidence/task-16-demo-enabled.png
  ```

  **Commit**: YES (groups with Tasks 15, 17)
  - Message: `refactor(demo): gate demo mode with build-time conditional imports`
  - Files: `src/app/layout.js`, `src/lib/api.js`, `src/lib/demo/demoFlag.js`

- [ ] 17. **Demo mode — Verify tree-shaking (zero bytes in production bundle)**

  **What to do**:
  - Build with `NEXT_PUBLIC_DEMO_MODE=false` and verify zero demo code reaches the bundle
  - Check all files that reference `__DEMO_MODE__` or demo-specific code
  - Replace remaining `window.__DEMO_MODE__` references with `DEMO_MODE` import
  - Check: `src/components/ui/DemoToolbar.js`, `src/lib/demo/demoMode.js`, `src/lib/socket.js`
  - Update `authStore.js` `setDemoUser` to respect `DEMO_MODE` flag
  - Update `tokenStore.js` demo token logic to respect flag
  - Verify no console errors about missing demo code in production build

  **Must NOT do**:
  - Don't break demo mode when enabled

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Verification + final cleanup

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: None
  - **Blocked By**: 15, 16

  **References**:
  - `src/components/ui/DemoToolbar.js:49-59` — window.__DEMO_MODE__ usage
  - `src/lib/demo/demoMode.js:83-86` — window.__DEMO_MODE__ setting
  - `src/store/authStore.js:179-185` — setDemoUser method
  - `src/lib/tokenStore.js:25-33` — demo token handling

  **Acceptance Criteria**:
  - [ ] `grep -r "window.__DEMO_MODE__" src/` returns empty
  - [ ] When `NEXT_PUBLIC_DEMO_MODE=false`, built output has no demo code (verify via bundle inspection)
  - [ ] When `NEXT_PUBLIC_DEMO_MODE=true`, all demo features work

  **QA Scenarios**:
  ```
  Scenario: No window.__DEMO_MODE__ globals remain
    Tool: Bash
    Steps:
      1. grep -rn "__DEMO_MODE__" src/
    Expected Result: Zero matches
    Evidence: .omo/evidence/task-17-no-globals.txt
  ```

  **Commit**: YES (groups with Tasks 15-16)
  - Message: `refactor(demo): eliminate window.__DEMO_MODE__ globals, verify tree-shake`
  - Files: As needed from grep results

- [ ] 18. **Vitest setup + initial tests (stores, utils, validators)**

  **What to do**:
  - Configure `vitest.config.js` (or inline in vite config)
  - Write tests for:
    - `src/lib/utils.js` — formatCurrency, formatDate, estimatePrice, generateId
    - `src/lib/validators.js` — loginSchema, customerSignupSchema, serviceRequestSchema
    - `src/store/authStore.js` — login, logout, setDemoUser (partial testing)
    - `src/store/serviceStore.js` — createRequest, updateRequestStatus (with mocked API)
    - `src/lib/constants.js` — exports, constants
  - Use `vi.mock()` for axios/api mocking
  - Ensure test files co-located: `src/lib/__tests__/utils.test.js`, `src/store/__tests__/authStore.test.js`
  - Add `"test": "vitest run"` to package.json scripts

  **Must NOT do**:
  - Don't test components that require DOM (reserved for Playwright)
  - Don't write integration tests in Vitest (reserved for Playwright)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Test writing, multiple files

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 19-24)
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 8 (Vitest installed)

  **References**:
  - `src/lib/utils.js:1-70` — Functions to test
  - `src/lib/validators.js:1-86` — Zod schemas to test
  - `src/store/authStore.js:1-205` — Store to test
  - `src/store/serviceStore.js:1-141` — Store to test
  - `src/lib/constants.js:1-86` — Constants to test

  **Acceptance Criteria**:
  - [ ] `npx vitest run --reporter=verbose` passes all tests
  - [ ] Each tested module has >70% line coverage
  - [ ] Test files exist at: `src/lib/__tests__/utils.test.js`, `src/lib/__tests__/validators.test.js`, `src/store/__tests__/authStore.test.js`

  **QA Scenarios**:
  ```
  Scenario: All Vitest tests pass
    Tool: Bash
    Steps:
      1. Run `npx vitest run --reporter=verbose`
    Expected Result: Exit code 0, all tests pass
    Evidence: .omo/evidence/task-18-vitest-run.txt
  ```

  **Commit**: YES
  - Message: `test: add vitest tests for utils, validators, and stores`
  - Files: `vitest.config.js`, `src/lib/__tests__/*`, `src/store/__tests__/*`

- [ ] 19. **Playwright setup + config + CI integration**

  **What to do**:
  - Configure `playwright.config.js` with:
    - Base URL: `http://localhost:3000`
    - Projects: chromium (desktop), Mobile Chrome (Galaxy S8)
    - Test directory: `e2e/`
  - Install Playwright browsers: `npx playwright install chromium`
  - Create initial smoke tests:
    - `e2e/landing.spec.js` — Homepage loads, title correct, CTA buttons visible
    - `e2e/auth.spec.js` — Auth page renders login/signup toggle
    - `e2e/demo-mode.spec.js` — Demo mode toggle works, role selector works
  - Add `"test:e2e": "playwright test"` to package.json scripts

  **Must NOT do**:
  - Don't test features that require real backend
  - Don't install unnecessary browser engines

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E test infrastructure

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 8 (Playwright installed)

  **References**:
  - Standard Playwright config patterns
  - `src/app/page.js` — Landing page for smoke test
  - `src/app/auth/page.js` — Auth page for smoke test

  **Acceptance Criteria**:
  - [ ] `npx playwright test` passes all smoke tests
  - [ ] Tests run in CI without browser sandbox issues
  - [ ] Test reports generated

  **QA Scenarios**:
  ```
  Scenario: Playwright smoke tests pass
    Tool: Bash
    Steps:
      1. Run `npx playwright test --reporter=list`
    Expected Result: Exit code 0, all smoke tests pass
    Evidence: .omo/evidence/task-19-playwright-run.txt
  ```

  **Commit**: YES (groups with Task 22)
  - Message: `test: add playwright e2e smoke tests`
  - Files: `playwright.config.js`, `e2e/*.spec.js`

- [ ] 20. **PWA manifest + service worker**

  **What to do**:
  - Create `public/manifest.json`:
    ```json
    {
      "name": "ClutchD",
      "short_name": "ClutchD",
      "description": "On-Demand Mechanic Platform",
      "start_url": "/",
      "display": "standalone",
      "background_color": "#09090b",
      "theme_color": "#10b981",
      "icons": [
        { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" },
        { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
      ]
    }
    ```
  - Create PWA icons (192x192, 512x512) from favicon or generate
  - Add `<link rel="manifest" href="/manifest.json">` to `layout.js`
  - Create `public/sw.js` (basic service worker for caching static assets)
  - Register service worker in layout.js or a separate init script
  - Add theme-color meta tag (already in layout.js)

  **Must NOT do**:
  - Don't implement complex caching strategies (offline-first is out of scope)
  - Don't cache API responses

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Static files + manifest

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `public/favicon.svg` — For icon generation
  - `src/app/layout.js:35-42` — Existing viewport/theme-color meta

  **Acceptance Criteria**:
  - [ ] `public/manifest.json` exists and is valid JSON
  - [ ] `public/sw.js` exists
  - [ ] `curl /manifest.json` returns valid manifest
  - [ ] Lighthouse PWA checklist: installable

  **QA Scenarios**:
  ```
  Scenario: Manifest is served correctly
    Tool: Bash (curl)
    Steps:
      1. Start dev server
      2. curl http://localhost:3000/manifest.json
    Expected Result: Valid JSON with correct fields
    Evidence: .omo/evidence/task-20-manifest.json
  ```

  **Commit**: YES
  - Message: `feat(pwa): add manifest.json and service worker`
  - Files: `public/manifest.json`, `public/sw.js`, `public/icon-192.png`, `public/icon-512.png`, `src/app/layout.js`

- [ ] 21. **CSP hardening + security headers review**

  **What to do**:
  - Review and tighten `next.config.mjs` CSP headers:
    - Try to remove `'unsafe-inline'` from `script-src` (use nonce or hash if possible)
    - Try to remove `'unsafe-eval'` from `script-src` (React dev mode needs it, production may not)
    - Keep Google OAuth domains (`https://accounts.google.com`)
    - Add Razorpay domains if needed for production
    - Review `connect-src` for completeness
    - Add `frame-ancestors 'none'` (clickjacking protection)
  - Add `Strict-Transport-Security` header (HSTS)
  - Add `X-Content-Type-Options: nosniff` (already present ✓)
  - Add `Referrer-Policy` (already present ✓)

  **Must NOT do**:
  - Don't break Google OAuth functionality
  - Don't break Razorpay checkout

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Security headers config update

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None (but deploy depends on it)
  - **Blocked By**: None

  **References**:
  - `next.config.mjs:7-27` — Current CSP config
  - `src/lib/constants.js:55-68` — API/WS URLs that need to be in CSP

  **Acceptance Criteria**:
  - [ ] CSP headers tighten (no `unsafe-inline`/`unsafe-eval` if possible)
  - [ ] HSTS header added
  - [ ] `curl -I https://clutchd-app.onrender.com` shows security headers
  - [ ] App functions correctly with tightened CSP (no console errors)

  **QA Scenarios**:
  ```
  Scenario: Security headers present
    Tool: Bash (curl)
    Steps:
      1. Start dev server
      2. curl -I http://localhost:3000
    Expected Result: Security headers (CSP, HSTS, X-Frame-Options, etc.) present
    Evidence: .omo/evidence/task-21-security-headers.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `security: tighten CSP, add HSTS and frame-ancestors`
  - Files: `next.config.mjs`

- [ ] 22. **CI pipeline — Add lint + test steps to GitHub Actions**

  **What to do**:
  - Update `.github/workflows/ci.yml`:
    - Add `lint` step: `npm run lint`
    - Add `test` step: `npm test` (vitest)
    - Add `test:e2e` step: `npm run test:e2e` (with Playwright)
    - Add Playwright browser installation: `npx playwright install --with-deps chromium`
    - Keep existing `build` step
  - Ensure CI fails on lint errors or test failures

  **Must NOT do**:
  - Don't create a separate deploy workflow (Render handles deploy from git)
  - Don't add unnecessary tools

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CI config update

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: Task 14 (test infra must exist first)

  **References**:
  - `.github/workflows/ci.yml:1-22` — Current CI config

  **Acceptance Criteria**:
  - [ ] CI workflow includes lint, test, and build steps
  - [ ] CI workflow passes on this branch

  **Commit**: YES (groups with Task 19)
  - Message: `ci: add lint, test, and e2e steps to workflow`
  - Files: `.github/workflows/ci.yml`

- [ ] 23. **Error monitoring setup (Sentry)**

  **What to do**:
  - Install `@sentry/nextjs` package
  - Follow Sentry onboarding wizard for Next.js App Router
  - Configure `sentry.client.config.js` and `sentry.server.config.js` (if needed)
  - Add `SENTRY_DSN` to env vars
  - Verify error capture works with a test error
  - **Note**: This is a lower-priority item. If time is limited, add the scaffolding but defer DSN configuration.

  **Must NOT do**:
  - Don't block other tasks on Sentry setup
  - Don't commit actual DSN (use env var)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: SDK installation + config

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - Sentry Next.js docs
  - `env.local.example` — Add SENTRY_DSN

  **Acceptance Criteria**:
  - [ ] `@sentry/nextjs` installed
  - [ ] Sentry config files created
  - [ ] `npm run build` succeeds with Sentry

  **Commit**: YES
  - Message: `feat(monitoring): add Sentry error tracking scaffolding`
  - Files: `package.json`, `sentry.client.config.js` (or similar)

- [ ] 24. **SEO — sitemap.xml, robots.txt, structured data**

  **What to do**:
  - Create `public/robots.txt`:
    ```
    User-agent: *
    Allow: /
    Sitemap: https://clutchd-app.onrender.com/sitemap.xml
    ```
  - Create `public/sitemap.xml` with all 16 static page routes
  - Add structured data (JSON-LD) to landing page:
    - Organization schema
    - LocalBusiness schema (on-demand mechanic service)
  - Add OpenGraph meta tags (already present in layout.js ✓)

  **Must NOT do**:
  - Don't create dynamic sitemap generation (static is fine for 16 pages)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: SEO content, structured data

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/app/layout.js:11-33` — Existing metadata
  - `src/app/page.js` — Landing page for structured data
  - All route pages for sitemap

  **Acceptance Criteria**:
  - [ ] `public/robots.txt` exists and is valid
  - [ ] `public/sitemap.xml` exists, valid XML, lists all 16 routes
  - [ ] JSON-LD structured data on landing page

  **Commit**: YES
  - Message: `feat(seo): add sitemap, robots.txt, and structured data`
  - Files: `public/robots.txt`, `public/sitemap.xml`, `src/app/page.js`

- [ ] 25. **Capacitor — Install + init config**

  **What to do**:
  - Install Capacitor packages: `npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios`
  - Create `capacitor.config.js`:
    ```js
    import { CapacitorConfig } from '@capacitor/cli';

    const config: CapacitorConfig = {
      appId: 'com.clutchd.app',
      appName: 'ClutchD',
      webDir: 'out',
      server: {
        androidScheme: 'https',
        cleartext: true,
      },
    };
    export default config;
    ```
  - Add `npx cap init` as setup script

  **Must NOT do**:
  - Don't add iOS platform yet (only Android for now)
  - Don't commit native platform directories to git (add android/ios to .gitignore)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Package installation + config file

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential within Wave 4)
  - **Parallel Group**: Wave 4 (first task)
  - **Blocks**: 26, 27, 28
  - **Blocked By**: Task 8 (package.json), potentially Task 1 (build config)

  **References**:
  - `roadmap.md:66-92` — Existing Capacitor setup documentation
  - `package.json` — For adding deps

  **Acceptance Criteria**:
  - [ ] `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` installed
  - [ ] `capacitor.config.js` exists with correct config
  - [ ] `npx cap --version` succeeds

  **Commit**: YES (groups with Tasks 26-29)
  - Message: `feat(mobile): add Capacitor for Android APK`
  - Files: `capacitor.config.js`, `package.json`, `.gitignore`

- [ ] 26. **next.config.mjs — Static export mode for Capacitor build**

  **What to do**:
  - Add build-mode switching logic to next.config.mjs:
    - When `NEXT_PUBLIC_BUILD_MODE=export`: set `output: 'export'`, `images: { unoptimized: true }`
    - When `NEXT_PUBLIC_BUILD_MODE=standalone` (default): set `output: 'standalone'`
  - Remove `async headers()` when in export mode (headers only work with standalone/Node.js)
  - Create build script: `npm run build:android` that sets `NEXT_PUBLIC_BUILD_MODE=export` and runs `next build`

  **Must NOT do**:
  - Don't break the standalone build for Render deploy
  - Don't remove security headers from standalone mode

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Config logic + build scripts

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 27, 28)
  - **Parallel Group**: Wave 4
  - **Blocks**: 28 (build script needs export mode)
  - **Blocked By**: Task 25 (Capacitor init)

  **References**:
  - `next.config.mjs:1-38` — Current config
  - `roadmap.md:34-38` — Documents static export need for Capacitor

  **Acceptance Criteria**:
  - [ ] `NEXT_PUBLIC_BUILD_MODE=export npm run build` produces `out/` directory
  - [ ] `NEXT_PUBLIC_BUILD_MODE=standalone npm run build` produces `.next/standalone/`
  - [ ] `npm run build:android` script works

  **Commit**: YES (groups with Tasks 25, 27-29)
  - Message: `build(config): add build-mode switching for Capacitor export`
  - Files: `next.config.mjs`, `package.json`

- [ ] 27. **Capacitor — Add Android platform**

  **What to do**:
  - Run: `npx cap add android`
  - Wait: This creates `android/` directory with Gradle project
  - Verify: `ls android/app/src/main/AndroidManifest.xml` exists
  - Add `android/` to `.gitignore` (or commit — user preference)
  - Add `npx cap copy` and `npx cap sync` scripts to package.json

  **Must NOT do**:
  - Don't add iOS (out of scope for now)
  - Don't modify android/ files manually (let Capacitor manage them)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CLI command execution

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 25 (Capacitor init)

  **References**:
  - `roadmap.md:86-88` — Documents `npx cap add android`

  **Acceptance Criteria**:
  - [ ] `android/` directory exists with `build.gradle`
  - [ ] `npx cap sync android` succeeds

  **Commit**: YES (groups with Tasks 25-26, 28-29)
  - Message: `feat(mobile): add Capacitor Android platform`
  - Files: `package.json`, `.gitignore`

- [ ] 28. **Build script — npm run build:android**

  **What to do**:
  - Add to `package.json` scripts:
    ```json
    "build:android": "NEXT_PUBLIC_BUILD_MODE=export next build && npx cap copy && npx cap sync android"
    ```
  - Note: For Windows compatibility, also add a cross-platform version using `cross-env` if needed
  - Verify the full build pipeline works: next build → copy → sync

  **Must NOT do**:
  - Don't include `npx cap open android` (opens Android Studio — can't run in CLI)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Script addition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Tasks 25, 26, 27

  **References**:
  - `package.json:5-11` — Existing scripts

  **Acceptance Criteria**:
  - [ ] `npm run build:android` produces `out/` directory with static export
  - [ ] `npx cap copy android` copies files correctly
  - [ ] `npx cap sync android` succeeds

  **Commit**: YES (groups with Tasks 25-27, 29)
  - Message: `build(scripts): add build:android script for Capacitor`
  - Files: `package.json`

- [ ] 29. **Capacitor — Fix WebSocket URL for Capacitor protocol**

  **What to do**:
  - Update `src/lib/constants.js` `getDefaultWsUrl()` function:
    - Capacitor apps use `capacitor://` or `https://` scheme, not `http://` or `ws://`
    - Detect Capacitor runtime: check `window.Capacitor` or `window.__CAPACITOR__`
    - When in Capacitor, always use `wss://` (secure WebSocket)
    - When in Capacitor, hostname should be the backend host, not `window.location.hostname`
  - Update `src/lib/socket.js` for Capacitor WebSocket behavior

  **Must NOT do**:
  - Don't break WebSocket in browser mode

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: URL logic fix

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: None
  - **Blocked By**: Task 25

  **References**:
  - `src/lib/constants.js:57-68` — getDefaultWsUrl()
  - `src/lib/socket.js:33-38` — WebSocket URL usage

  **Acceptance Criteria**:
  - [ ] WebSocket URL correctly uses `wss://` in Capacitor mode
  - [ ] No regression in browser WebSocket connection

  **Commit**: YES (groups with Tasks 25-28)
  - Message: `fix(mobile): handle WebSocket URL in Capacitor context`
  - Files: `src/lib/constants.js`, `src/lib/socket.js`

- [ ] 30. **Real-time chat scaffold (WebSocket-based basic chat UI)**

  **What to do**:
  - Create basic chat UI component: `src/components/ui/ChatWidget.js`
  - Simple floating chat bubble that opens a chat panel
  - Chat panel shows messages, input field, send button
  - Integrate with existing WebSocket infrastructure in `src/lib/socket.js`
  - Read STATUS_UPDATE and NOTIFICATION_UPDATE message types for chat events
  - Style with existing glass-lux design system
  - **Note**: This is a scaffold — the real backend WebSocket chat protocol will need backend support. This creates the frontend UI only.

  **Must NOT do**:
  - Don't create a real-time chat backend
  - Don't replace existing notification system

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component creation + WebSocket integration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 31-34)
  - **Parallel Group**: Wave 5 (low priority)
  - **Blocks**: None
  - **Blocked By**: Tasks 16, 17 (demo mode flag — needed for conditional display)

  **References**:
  - `src/lib/socket.js:1-166` — Existing WebSocket infrastructure
  - `src/components/ui/` — Existing UI components for styling pattern
  - `src/lib/demo/mockData.js` — For demo mode mock messages

  **Acceptance Criteria**:
  - [ ] ChatWidget renders in all dashboards (when feature flag is on)
  - [ ] Chat messages display in a scrollable list
  - [ ] Input field accepts text and sends via WebSocket
  - [ ] Styled consistently with glass-lux design system

  **Commit**: YES
  - Message: `feat(chat): add real-time chat widget scaffold`
  - Files: `src/components/ui/ChatWidget.js`

- [ ] 31. **i18n infrastructure (next-intl setup)**

  **What to do**:
  - Install `next-intl` package
  - Create locale config: `src/lib/i18n/config.js`
  - Create translation files: `messages/en.json`, messages/ta.json (Tamil — local language for Coimbatore)
  - Add locale detection (browser language preference)
  - Wrap app with `NextIntlClientProvider`
  - Create `useTranslations` wrapper hook
  - Translate landing page as proof of concept
  - **Note**: Scaffold only — full translation of all pages is a separate effort

  **Must NOT do**:
  - Don't translate every page (only landing page as PoC)
  - Don't change routing structure (no /en/ prefix unless needed)

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: i18n infrastructure, translations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (low priority)
  - **Blocks**: None
  - **Blocked By**: None (can start anytime)

  **References**:
  - next-intl documentation
  - `src/app/layout.js` — Where providers are added
  - `src/app/page.js` — Landing page for PoC translations

  **Acceptance Criteria**:
  - [ ] `next-intl` installed and configured
  - [ ] English + Tamil locale files exist
  - [ ] Landing page shows translated content when locale changes
  - [ ] Build succeeds

  **Commit**: YES
  - Message: `feat(i18n): add next-intl with English and Tamil support`
  - Files: `src/lib/i18n/*`, `messages/*.json`, `src/app/layout.js`

- [ ] 32. **Schedule booking feature scaffold**

  **What to do**:
  - Create `src/components/dashboard/ScheduleBookingModal.js`
  - Schedule picker: date picker + time slot selector
  - Future booking list view
  - Integrate with existing `serviceStore.js` for creating scheduled requests
  - Add "Schedule" tab to customer dashboard alongside "Request" tab
  - **Note**: Backend needs to support `scheduledAt` field in service request creation

  **Must NOT do**:
  - Don't create a calendar date picker from scratch (use existing Input/Modal)
  - Don't implement complex recurrence logic

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: New feature UI + store integration

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (low priority)
  - **Blocks**: None
  - **Blocked By**: None (can start after Wave 1)

  **References**:
  - `src/components/dashboard/ServiceRequestPanel.js` — Pattern for service request forms
  - `src/store/serviceStore.js` — Store for creating requests
  - `src/components/ui/Modal.js` — Modal component to reuse

  **Acceptance Criteria**:
  - [ ] ScheduleBookingModal renders with date picker
  - [ ] User can select date/time and submit
  - [ ] Scheduled request is created via serviceStore
  - [ ] Build succeeds

  **Commit**: YES
  - Message: `feat(booking): add schedule booking feature scaffold`
  - Files: `src/components/dashboard/ScheduleBookingModal.js`

- [ ] 33. **Referral system scaffold**

  **What to do**:
  - Create `src/components/ui/ReferralPanel.js`
  - Referral code display (unique code per user)
  - Share functionality (copy link, share via navigator.share)
  - Referral stats (total referrals, rewards earned)
  - Add referral section to dashboard shell sidebar
  - **Note**: Backend needs referral endpoint for code generation and tracking

  **Must NOT do**:
  - Don't create a full referral backend
  - Don't implement reward distribution

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: New feature UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (low priority)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/components/ui/DashboardShell.js` — Where sidebar lives
  - `src/store/authStore.js` — For current user info
  - `src/lib/constants.js` — For config

  **Acceptance Criteria**:
  - [ ] ReferralPanel renders with referral code display
  - [ ] Copy-to-clipboard works
  - [ ] Share functionality works (or degrades gracefully)
  - [ ] Build succeeds

  **Commit**: YES
  - Message: `feat(referral): add referral system scaffold`
  - Files: `src/components/ui/ReferralPanel.js`

- [ ] 34. **Enhanced Leaflet map (clustering, better markers)**

  **What to do**:
  - Install `react-leaflet-cluster` or implement basic marker clustering
  - Improve marker icons: use SVG-based custom markers instead of relying on raw.githubusercontent.com (CSP concern)
  - Add "My Location" button overlay on map
  - Add map legend showing what different markers mean
  - Improve popup styling for providers
  - **Note**: Since Google Maps is out of scope, improve the Leaflet experience

  **Must NOT do**:
  - Don't replace Leaflet with any other map provider
  - Don't remove the raw.githubusercontent.com markers until replacement is ready

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Map UX improvements

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (low priority)
  - **Blocks**: None
  - **Blocked By**: Task 3 (CSS infrastructure for marker styling)

  **References**:
  - `src/components/dashboard/MapView.js:1-145` — Current map implementation
  - `src/app/globals.css:453-476` — Leaflet CSS overrides
  - `CSP in next.config.mjs:22` — raw.githubusercontent.com in script-src (for markers)

  **Acceptance Criteria**:
  - [ ] Markers cluster when zoomed out (multiple providers in same area)
  - [ ] "My Location" button recenters map to user location
  - [ ] Popup shows provider details (name, rating, expertise)
  - [ ] Map loads without relying on external CDN resources (CSP-safe)

  **Commit**: YES
  - Message: `feat(map): add marker clustering, My Location, improved popups`
  - Files: `src/components/dashboard/MapView.js`, `src/app/globals.css`

---

- [ ] 35. **Marketplace stores — Create Zustand stores for product listing (product, cart, order, category)**

  **What to do**:
  - Create `src/store/productStore.js` — Zustand store with:
    - `products: []` — all products (flat list)
    - `categories: []` — product categories
    - `filters: { priceRange, brand, vendor, rating, availability, deliveryTime }`
    - `searchQuery: ''`
    - `isLoading, error`
    - Actions: `fetchProducts()`, `searchProducts(query)`, `setFilter(name, value)`, `clearFilters()`, `getProductById(id)`
  - Create `src/store/cartStore.js` — Zustand store with:
    - `items: [{ productId, vendorId, quantity, price }]`
    - `couponCode: ''`
    - Actions: `addItem(product, vendor)`, `removeItem(productId)`, `updateQuantity(productId, qty)`, `applyCoupon(code)`, `clearCart()`, `getTotal()`, `getItemCount()`
  - Create `src/store/orderStore.js` — Zustand store with:
    - `orders: []`
    - `activeOrder: null`
    - Actions: `placeOrder(cartItems, address, payment)`, `fetchOrderHistory()`, `getOrderById(id)`
  - Create `src/store/categoryStore.js` — Zustand store with:
    - `categories: []`
    - `selectedCategory: null`
    - Actions: `fetchCategories()`, `selectCategory(id)`
  - Follow the same Zustand pattern as `serviceStore.js`, `authStore.js`
  - All stores should be demo-mode compatible (check `window.__DEMO_MODE__` or use store defaults)

  **Must NOT do**:
  - Don't add real backend HTTP calls — use the demo interceptor pattern for data
  - Don't add persistence (no localStorage sync) unless explicitly needed

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Creating 4 interconnected Zustand stores with consistent patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6A (foundation)
  - **Blocks**: Tasks 37, 40, 41, 42, 43, 44, 45
  - **Blocked By**: None (independent foundation — can start after Wave 1)

  **References**:
  - `src/store/serviceStore.js:1-141` — Zustand store pattern (create, set, get, async actions, error handling)
  - `src/store/authStore.js` — Auth store pattern (token management, user state)
  - `src/store/trackingStore.js` — Real-time state pattern
  - `src/lib/demo/apiInterceptor.js` — Demo API mock pattern

  **Acceptance Criteria**:
  - [ ] `productStore.js` created with products state + all filter/search actions
  - [ ] `cartStore.js` created with add/remove/quantity/total actions
  - [ ] `orderStore.js` created with placeOrder/fetchHistory actions
  - [ ] `categoryStore.js` created with categories + selection actions
  - [ ] All stores exportable via `import { useProductStore } from '@/store/productStore'`

  **QA Scenarios**:
  ```
  Scenario: Store exports and basic operations work
    Tool: Bash (node REPL)
    Preconditions: Stores created in src/store/
    Steps:
      1. Run: node -e "const { create } = require('zustand'); console.log('Zustand available')"
      2. Verify store files exist: ls src/store/productStore.js src/store/cartStore.js src/store/orderStore.js src/store/categoryStore.js
    Expected Result: All 4 store files exist
    Evidence: .omo/evidence/task-35-stores-exist.txt

  Scenario: Store structure validation
    Tool: Bash (bun test)
    Preconditions: Store files created
    Steps:
      1. Write a quick validation script that tests store structure
      2. bun test src/store/__tests__/stores.test.js
    Expected Result: All stores have expected actions and initial state
    Evidence: .omo/evidence/task-35-stores-valid.txt
  ```

  **Commit**: YES (Group with 36, 37)
  - Message: `feat(marketplace): create Zustand stores, constants, and demo data for product listing`
  - Files: `src/store/productStore.js`, `src/store/cartStore.js`, `src/store/orderStore.js`, `src/store/categoryStore.js`

- [ ] 36. **Marketplace constants + filter options**

  **What to do**:
  - Add to `src/lib/constants.js`:
    - `PRODUCT_CATEGORIES` — array of { value, label, icon } matching the spec:
      - Engine Parts, Brake Parts, Electrical Components, Suspension Parts, Filters, Accessories
    - `PRICE_RANGES` — `[{ value: '0-500', label: '₹0 - ₹500' }, { value: '500-1000', label: '₹500 - ₹1000' }, { value: '1000+', label: '₹1000+' }]`
    - `BRANDS` — Bosch, Valeo, NGK, Denso
    - `DELIVERY_TIMES` — Same Day, 1 Day, 2-3 Days
    - `SORT_OPTIONS` — Price Low-High, Price High-Low, Rating, Popularity

  **Must NOT do**:
  - Don't hardcode product data in constants — use demo data for that

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple data definition additions to constants.js

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6A (with Task 35)
  - **Blocks**: Tasks 37, 40, 42
  - **Blocked By**: None

  **References**:
  - `src/lib/constants.js:1-86` — Existing constant patterns

  **Acceptance Criteria**:
  - [ ] PRODUCT_CATEGORIES has 6+ categories with value, label, icon
  - [ ] PRICE_RANGES has 3 ranges
  - [ ] BRANDS has 4+ entries
  - [ ] DELIVERY_TIMES has 3 options
  - [ ] All imports work: `import { PRODUCT_CATEGORIES } from '@/lib/constants'`

  **Commit**: YES (Group with 35, 37)
  - Message: (grouped with 35)
  - Files: `src/lib/constants.js`

- [ ] 37. **Marketplace demo data + API interceptor extension**

  **What to do**:
  - Create `src/lib/demo/data/products.js` — mock product catalog with:
    - 12+ products across all 6 categories (Engine Parts, Brake Parts, Electrical Components, etc.)
    - Each product: id, name, description, categoryId, brand, partNumber, images[], specs[], features[], warranty
  - Create `src/lib/demo/data/vendors.js` — mock vendors with:
    - 4+ vendors (Vendor A, B, C, D)
    - Each: id, name, rating, contactDetails
  - Create `src/lib/demo/data/productVendors.js` — pricing per vendor:
    - Each product has 3-4 vendor listings with different prices, stock, delivery days
  - Create `src/lib/demo/data/offers.js` — mock offers/coupons:
    - Several offers with discount %, title, start/end dates
  - Create `src/lib/demo/data/reviews.js` — mock reviews:
    - 3-5 reviews per product with user name, rating, text, date
  - Extend `src/lib/demo/apiInterceptor.js` — add handlers for:
    - GET `/marketplace/products` → return products list (with filters applied)
    - GET `/marketplace/products/:id` → return single product with vendor data
    - GET `/marketplace/categories` → return categories
    - GET `/marketplace/search?q=` → return filtered results
    - POST `/marketplace/orders` → create order and return confirmation
    - GET `/marketplace/orders` → return order history
    - POST `/marketplace/cart/apply-coupon` → validate coupon
    - GET `/marketplace/reviews/:productId` → return reviews
    - POST `/marketplace/reviews` → submit review

  **Must NOT do**:
  - Don't modify the existing non-marketplace demo interceptor handlers

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Creating structured mock data and extending the API interceptor

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6A (with Tasks 35, 36)
  - **Blocks**: Tasks 40, 41, 42, 43, 44, 45
  - **Blocked By**: Tasks 15-17 (demo flag system), Task 35 (stores), Task 36 (constants)

  **References**:
  - `src/lib/demo/apiInterceptor.js` — Existing API interceptor (550+ lines, patterns for handling routes)
  - `src/lib/demo/demoMode.js` — Demo mode context and global flag
  - `src/lib/demo/data/` (will be new) — Mock data directory

  **Acceptance Criteria**:
  - [ ] 12+ products across 6 categories with full data
  - [ ] 4+ vendors with realistic names and ratings
  - [ ] Each product linked to 3-4 vendors with different prices
  - [ ] All marketplace API endpoints handled in interceptor
  - [ ] Demo mode shows marketplace data without backend calls

  **QA Scenarios**:
  ```
  Scenario: Marketplace demo data loads correctly in demo mode
    Tool: Bash (node)
    Preconditions: Demo data files created
    Steps:
      1. node -e "const p = require('./src/lib/demo/data/products'); console.log(p.length + ' products')"
      2. node -e "const v = require('./src/lib/demo/data/vendors'); console.log(v.length + ' vendors')"
    Expected Result: 12+ products and 4+ vendors loaded
    Evidence: .omo/evidence/task-37-demo-data.txt
  ```

  **Commit**: YES (Group with 35, 36)
  - Message: (grouped with 35)
  - Files: `src/lib/demo/data/products.js`, `src/lib/demo/data/vendors.js`, `src/lib/demo/data/productVendors.js`, `src/lib/demo/data/offers.js`, `src/lib/demo/data/reviews.js`, `src/lib/demo/apiInterceptor.js`

- [ ] 38. **Bottom navigation component**

  **What to do**:
  - Create `src/components/ui/BottomNav.js` — persistent bottom navigation bar:
    - 5 tabs: Home, Categories, Search, Cart (with badge count), Profile
    - Use `lucide-react` icons (Home, Grid3X3, Search, ShoppingCart, User)
    - Cart icon shows item count badge from `cartStore`
    - Active tab highlighted with primary color
    - Uses `next/navigation` `useRouter` + `usePathname` for active state
    - Fixed position at bottom of viewport (`fixed bottom-0`)
    - Glass-morphism styling matching app theme
    - Safe area padding for mobile devices (`pb-safe` or `pb-[env(safe-area-inset-bottom)]`)
  - Handle back-button and navigation correctly

  **Must NOT do**:
  - Don't add the bottom nav to non-marketplace pages (auth, landing, admin)
  - Don't make it dismissable — it's persistent in marketplace

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with glass-morphism styling, responsive design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6A (with Tasks 35, 36, 37)
  - **Blocks**: Task 39 (marketplace layout needs BottomNav)
  - **Blocked By**: Task 9 (CSS variable theme)

  **References**:
  - `src/app/globals.css` — CSS variable theme (glass-lux classes)
  - `lucide-react` icons — already a dependency
  - `src/components/ui/DashboardShell.js` — Existing shell pattern

  **Acceptance Criteria**:
  - [ ] BottomNav renders 5 tabs with correct icons
  - [ ] Active tab reflects current route
  - [ ] Cart badge shows correct item count
  - [ ] Clicking a tab navigates to correct route
  - [ ] Styled consistently with app theme
  - [ ] Safe area padding for mobile devices

  **QA Scenarios**:
  ```
  Scenario: Bottom navigation renders and navigates
    Tool: Playwright
    Preconditions: BottomNav component created, dev server running
    Steps:
      1. Navigate to /marketplace
      2. Verify BottomNav is visible at bottom of viewport
      3. Click "Categories" tab
      4. Verify URL changes to /marketplace/categories
      5. Click "Home" tab
      6. Verify URL changes to /marketplace
    Expected Result: BottomNav renders at bottom, tabs navigate correctly
    Evidence: .omo/evidence/task-38-bottomnav.png

  Scenario: Cart badge shows count
    Tool: Playwright
    Preconditions: BottomNav rendered
    Steps:
      1. Check cart badge is initially hidden or shows "0"
      2. Add item to cart (via store)
      3. Verify cart badge shows item count
    Expected Result: Cart badge updates with item count
    Evidence: .omo/evidence/task-38-cart-badge.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): add BottomNav component with 5 tabs and cart badge`
  - Files: `src/components/ui/BottomNav.js`

---

- [ ] 39. **Marketplace route group layout + routing**

  **What to do**:
  - Create `src/app/marketplace/layout.js` — marketplace layout with:
    - BottomNav component (from Task 38)
    - Content area above bottom nav with proper padding
    - Wraps children in a page wrapper
  - Create `src/app/marketplace/page.js` — marketplace home screen (delegates to Task 41)
  - Create `src/app/marketplace/categories/page.js` — categories listing
  - Create `src/app/marketplace/categories/[id]/page.js` — products in category
  - Create `src/app/marketplace/search/page.js` — search results page (delegates to Task 42)
  - Create `src/app/marketplace/product/[id]/page.js` — product detail (delegates to Task 43)
  - Create `src/app/marketplace/cart/page.js` — cart screen (delegates to Task 44)
  - Create `src/app/marketplace/checkout/page.js` — checkout page
  - Create `src/app/marketplace/orders/page.js` — order history
  - Create `src/app/marketplace/profile/page.js` — user profile stub
  - All pages use `"use client"` and follow existing dashboard page patterns
  - Each page initially renders a simple loading/skeleton state while data loads

  **Must NOT do**:
  - Don't implement full page content here — just routing, layout shell, and page stubs
  - Don't modify existing routes outside `/marketplace`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Route group creation with layout shell, following existing Next.js App Router patterns

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6B (UI — sequentially after Task 38)
  - **Blocks**: Tasks 40, 41, 42, 43, 44, 45
  - **Blocked By**: Task 38 (BottomNav component)

  **References**:
  - `src/app/dashboard/customer/page.js` — Existing page pattern ("use client", dynamic imports, store usage)
  - `src/app/dashboard/customer/layout.js` (if exists) or `src/app/layout.js` — Layout pattern
  - `src/components/ui/DashboardShell.js` — Shell component pattern

  **Acceptance Criteria**:
  - [ ] `src/app/marketplace/layout.js` renders content area + BottomNav
  - [ ] All route stubs created: home, categories, categories/[id], search, product/[id], cart, checkout, orders, profile
  - [ ] Navigating to `/marketplace` shows layout with BottomNav
  - [ ] Navigating to `/marketplace/cart` shows layout with BottomNav
  - [ ] No 404s for any marketplace route

  **QA Scenarios**:
  ```
  Scenario: All marketplace routes resolve without 404
    Tool: Bash (curl)
    Preconditions: Dev server running on localhost:3000
    Steps:
      1. curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/marketplace
      2. curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/marketplace/categories
      3. curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/marketplace/search
      4. curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/marketplace/cart
      5. curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/marketplace/checkout
      6. curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/marketplace/orders
      7. curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/marketplace/product/test-1
    Expected Result: All return HTTP 200
    Evidence: .omo/evidence/task-39-routes.txt

  Scenario: BottomNav visible on marketplace pages
    Tool: Playwright
    Preconditions: BottomNav created, marketplace layout created
    Steps:
      1. Navigate to /marketplace
      2. Check BottomNav component is rendered
      3. Check all 5 tabs (Home, Categories, Search, Cart, Profile) are visible
    Expected Result: BottomNav renders with all 5 tabs
    Evidence: .omo/evidence/task-39-bottomnav-visible.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): create route group layout with 9 route stubs and BottomNav integration`
  - Files: `src/app/marketplace/layout.js`, `src/app/marketplace/page.js`, `src/app/marketplace/categories/page.js`, `src/app/marketplace/categories/[id]/page.js`, `src/app/marketplace/search/page.js`, `src/app/marketplace/product/[id]/page.js`, `src/app/marketplace/cart/page.js`, `src/app/marketplace/checkout/page.js`, `src/app/marketplace/orders/page.js`, `src/app/marketplace/profile/page.js`

- [ ] 40. **Marketplace home screen — categories grid, featured products, offers section**

  **What to do**:
  - Implement `src/app/marketplace/page.js` with:
    - **Categories Section**: 6 grid cards (Engine Parts, Brake Parts, Electrical Components, Suspension Parts, Filters, Accessories) with icons and names
    - **Featured Products**: Horizontal scrollable row of product cards showing image, name, price, vendor, rating
    - **Offers Section**: Highlighted banner/cards with discounts, coupons, seasonal offers
    - Pull data from `productStore` / `categoryStore` (which use demo data from Task 37)
    - Search bar at top that navigates to `/marketplace/search?q=...`
    - Use `lucide-react` icons for category grid (Wrench, Disc, Zap, etc.)
    - Skeleton loading states while data "loads" (even in demo mode, show brief loading)
  - Create `src/components/marketplace/ProductCard.js` — reusable product card:
    - Image, name, price, vendor name, rating stars
    - Links to `/marketplace/product/[id]`
    - Glass-morphism styling consistent with app theme
  - Create `src/components/marketplace/CategoryCard.js` — reusable category card with icon

  **Must NOT do**:
  - Don't add real payment or checkout on home screen
  - Don't rely on real backend — use demo data from stores

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI-heavy feature with product cards, category grid, offers layout

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6B (UI)
  - **Blocks**: Integration testing
  - **Blocked By**: Tasks 35 (stores), 38 (BottomNav), 39 (layout), 37 (demo data)

  **References**:
  - `src/app/page.js:30-145` — Landing page pattern (feature cards, styling)
  - `src/app/globals.css` — Glass-lux classes, CSS variables
  - `src/components/dashboard/ProviderList.js` — List rendering pattern

  **Acceptance Criteria**:
  - [ ] Categories grid shows 6 categories with icons
  - [ ] Clicking a category navigates to `/marketplace/categories/[id]`
  - [ ] Featured products section shows product cards with image, name, price, vendor, rating
  - [ ] Offers section displays discount banners/cards
  - [ ] Search bar at top navigates to search page with query param
  - [ ] ProductCard links to product detail page
  - [ ] Styled consistently with glass-morphism theme
  - [ ] Loading skeleton shows briefly on page load

  **QA Scenarios**:
  ```
  Scenario: Marketplace home screen renders all sections
    Tool: Playwright
    Preconditions: Dev server running, demo mode enabled
    Steps:
      1. Navigate to /marketplace
      2. Wait for page to fully render
      3. Check categories grid shows 6 category cards
      4. Check featured products section shows product cards
      5. Check offers section renders
      6. Click first category card — verify URL changes to /marketplace/categories/[id]
      7. Click first product card — verify URL changes to /marketplace/product/[id]
    Expected Result: All sections render, clicks navigate correctly
    Evidence: .omo/evidence/task-40-home-screen.png

  Scenario: Search bar navigates to search page
    Tool: Playwright
    Preconditions: Home screen rendered
    Steps:
      1. Type "brake pad" in search bar
      2. Press Enter
      3. Verify URL contains /marketplace/search?q=brake+pad
    Expected Result: Search navigates correctly with query param
    Evidence: .omo/evidence/task-40-search-nav.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): implement home screen with categories grid, featured products, offers section`
  - Files: `src/app/marketplace/page.js`, `src/components/marketplace/ProductCard.js`, `src/components/marketplace/CategoryCard.js`

- [ ] 41. **Search bar + filter panel + search results page**

  **What to do**:
  - Implement `src/app/marketplace/search/page.js` with:
    - Prominent search bar at top (pre-filled from URL `?q=` param)
    - Real-time search results as user types (debounced 300ms)
    - Each result shows: Product Image, Name, Brand, Vendor, Price, Discount badge, Availability, Rating
  - Create `src/components/marketplace/FilterPanel.js` — slide-in or collapsible filter panel:
    - **Price**: Radio buttons for ₹0-₹500, ₹500-₹1000, ₹1000+
    - **Brand**: Checkboxes for Bosch, Valeo, NGK, Denso
    - **Vendor**: Checkboxes for Vendor A, B, C, D
    - **Rating**: Radio buttons for 4★ & above, 3★ & above
    - **Availability**: Toggle for In Stock / Out of Stock
    - **Delivery Time**: Radio buttons for Same Day, 1 Day, 2-3 Days
    - "Clear All" button to reset filters
    - Active filter count badge on filter toggle button
  - Create `src/components/marketplace/SearchResultCard.js` — individual result card
  - Create `src/components/marketplace/SearchBar.js` — reusable search bar with icon
  - All filter state managed via `productStore.setFilter()` / `productStore.clearFilters()`
  - Results update in real-time as filters change

  **Must NOT do**:
  - Don't implement server-side search — all filtering is client-side on demo data
  - Don't add pagination for MVP (show all filtered results)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI with filter panel, search results, real-time updates

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6B (UI)
  - **Blocks**: Integration testing
  - **Blocked By**: Tasks 35 (stores), 39 (layout), 36 (constants), 37 (demo data)

  **References**:
  - `src/components/dashboard/ProviderList.js` — List rendering with state management
  - `src/lib/constants.js` — Filter option constants

  **Acceptance Criteria**:
  - [ ] Search bar pre-fills from URL query param
  - [ ] Typing in search bar updates results (debounced)
  - [ ] Each result card shows image, name, brand, vendor, price, discount, availability, rating
  - [ ] Filter panel has all 6 filter sections (Price, Brand, Vendor, Rating, Availability, Delivery)
  - [ ] Applying filters narrows results
  - [ ] "Clear All" resets all filters
  - [ ] Active filter count badge shows on filter toggle
  - [ ] Filter panel can be toggled open/closed

  **QA Scenarios**:
  ```
  Scenario: Search returns filtered results
    Tool: Playwright
    Preconditions: Dev server running, demo mode enabled
    Steps:
      1. Navigate to /marketplace/search
      2. Type "brake" in search bar
      3. Wait 500ms for debounce
      4. Verify search results show brake-related products
      5. Apply "Price: ₹500-₹1000" filter
      6. Verify results narrow to items in that price range
      7. Click "Clear All"
      8. Verify all results show again
    Expected Result: Search + filters work correctly, narrowing and clearing results
    Evidence: .omo/evidence/task-41-search-filters.png

  Scenario: Empty search state
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to /marketplace/search
      2. Type "zzzznonexistentproduct"
      3. Verify "No results found" message displays
    Expected Result: Empty state shows appropriate message
    Evidence: .omo/evidence/task-41-empty-search.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): implement search with debounced results, filter panel with 6 filter types`
  - Files: `src/app/marketplace/search/page.js`, `src/components/marketplace/FilterPanel.js`, `src/components/marketplace/SearchResultCard.js`, `src/components/marketplace/SearchBar.js`

---

- [ ] 42. **Product detail page with vendor comparison table**

  **What to do**:
  - Implement `src/app/marketplace/product/[id]/page.js` with:
    - **Product Images**: Gallery with main image + thumbnails (from demo data)
    - **Product Info**: Name, Brand, Part Number, Description, Features list, Specifications table, Warranty info
    - **Price + Discount**: Current lowest price across vendors, discount badge
    - **Stock Status**: In Stock / Out of Stock indicator
    - **Vendor Comparison Table**: Table showing all vendors selling this product:
      | Vendor | Price | Delivery | Rating | Add to Cart |
    - **"Add to Cart" button** for each vendor row
    - **Delivery Estimation**: "Delivered by: Tomorrow, 8 PM" based on selected vendor
    - **Breadcrumb navigation**: Home > Category > Product Name
  - Create `src/components/marketplace/VendorComparisonTable.js` — vendor comparison table
  - Create `src/components/marketplace/ProductImageGallery.js` — image gallery with zoom

  **Must NOT do**:
  - Don't add Google Places autocomplete for location
  - Don't make vendor table editable inline

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex product detail page with image gallery, vendor table, delivery info

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6B (UI)
  - **Blocks**: None
  - **Blocked By**: Tasks 35 (stores), 39 (layout), 37 (demo data)

  **References**:
  - `src/components/dashboard/ProviderList.js` — List/table rendering pattern
  - `src/components/ui/DashboardShell.js` — Shell/section patterns

  **Acceptance Criteria**:
  - [ ] Product page shows image gallery with thumbnails
  - [ ] Product info section shows name, brand, part number, description, features, specs, warranty
  - [ ] Vendor comparison table shows all vendors with Price, Delivery, Rating columns
  - [ ] "Add to Cart" button appears per vendor row
  - [ ] Clicking "Add to Cart" adds item to cart store with selected vendor
  - [ ] Delivery estimate shows based on selected vendor's delivery days
  - [ ] Breadcrumb shows Home > Category > Product Name

  **QA Scenarios**:
  ```
  Scenario: Product detail page renders with all sections
    Tool: Playwright
    Preconditions: Dev server running, demo data loaded
    Steps:
      1. Navigate to /marketplace/product/p-1
      2. Verify image gallery shows product image
      3. Verify product name, brand, description are visible
      4. Verify vendor comparison table renders with 3-4 vendors
      5. Each vendor row: Price, Delivery, Rating, Add to Cart button
      6. Click "Add to Cart" on Vendor A row
      7. Verify cart badge count increments in BottomNav
    Expected Result: Product page fully functional, add to cart works
    Evidence: .omo/evidence/task-42-product-detail.png

  Scenario: 404 for invalid product
    Tool: Playwright
    Steps:
      1. Navigate to /marketplace/product/nonexistent
    Expected Result: "Product not found" error state
    Evidence: .omo/evidence/task-42-product-not-found.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): product detail page with vendor comparison table, image gallery, delivery`
  - Files: `src/app/marketplace/product/[id]/page.js`, `src/components/marketplace/VendorComparisonTable.js`, `src/components/marketplace/ProductImageGallery.js`

- [ ] 43. **Cart screen + checkout flow + order confirmation**

  **What to do**:
  - Implement `src/app/marketplace/cart/page.js`:
    - Cart items with image, name, vendor, quantity selector, unit price, total, remove
    - Coupon code input + "Apply" with validation
    - Price summary: subtotal, discount, delivery, GST, total
    - "Proceed to Checkout" button → `/marketplace/checkout`
    - Empty cart state with "Browse Products" CTA
  - Implement `src/app/marketplace/checkout/page.js`:
    - Address form: name, phone, address, pincode, city
    - Order summary: items, quantities, prices
    - Payment method: UPI / Card / COD
    - "Place Order" → calls `orderStore.placeOrder()`
    - Order confirmation with order ID, items, delivery estimate
  - Implement `src/app/marketplace/orders/page.js`:
    - Order history with status badges
    - Click order → expanded items view
  - Create `src/components/marketplace/CartItem.js`, `PriceSummary.js`, `OrderCard.js`

  **Must NOT do**:
  - Don't process real payments — use demo/simulated
  - Don't add address autocomplete

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Multi-page checkout flow with forms, cart, order management

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6B (UI)
  - **Blocked By**: Tasks 35 (stores), 39 (layout), 37 (demo data)

  **References**:
  - `src/store/serviceStore.js` — Zustand async action pattern (for orderStore)
  - `src/components/dashboard/PaymentModal.js` — Payment flow pattern

  **Acceptance Criteria**:
  - [ ] Cart shows items with image, name, vendor, price, quantity selector
  - [ ] Quantity change updates total
  - [ ] Coupon validates and applies discount
  - [ ] Price summary shows subtotal, discount, delivery, GST, total
  - [ ] Checkout has address form + payment selection
  - [ ] "Place Order" creates order and shows confirmation
  - [ ] Order history page lists past orders
  - [ ] Empty cart shows CTA to browse products

  **QA Scenarios**:
  ```
  Scenario: Full cart-to-order flow
    Tool: Playwright
    Preconditions: Dev server running, demo mode
    Steps:
      1. Add product to cart from product detail page
      2. Navigate to /marketplace/cart
      3. Verify cart shows item; increase qty to 2 → total updates
      4. Apply coupon "SAVE10" → discount applies
      5. Click "Proceed to Checkout"
      6. Fill address form (name, phone, address, pincode)
      7. Select COD payment
      8. Click "Place Order"
      9. Verify order confirmation with order ID
    Expected Result: Cart-to-order flow works end-to-end
    Evidence: .omo/evidence/task-43-checkout-flow.png

  Scenario: Empty cart state
    Tool: Playwright
    Steps:
      1. Navigate to /marketplace/cart (empty)
      2. Verify "Your cart is empty" + "Browse Products" CTA
    Expected Result: Empty cart shows CTA
    Evidence: .omo/evidence/task-43-empty-cart.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): cart page, checkout flow, order confirmation, order history`
  - Files: `src/app/marketplace/cart/page.js`, `src/app/marketplace/checkout/page.js`, `src/app/marketplace/orders/page.js`, `src/components/marketplace/CartItem.js`, `src/components/marketplace/PriceSummary.js`, `src/components/marketplace/OrderCard.js`

- [ ] 44. **Customer reviews section + review submission**

  **What to do**:
  - Reviews section inside `src/app/marketplace/product/[id]/page.js`:
    - Summary: overall rating, count, rating breakdown bar chart
    - Review list: user name, stars, text, date
    - "Write a Review" button → opens review modal
  - Create `src/components/marketplace/ReviewList.js` — review list with summary
  - Create `src/components/marketplace/ReviewForm.js` — star selector, text area, submit
  - Create `src/components/marketplace/RatingStars.js` — reusable star component (display + input modes)
  - Reviews from `src/lib/demo/data/reviews.js` (Task 37)
  - New reviews submitted via demo interceptor added to in-memory store
  - Success toast after submission

  **Must NOT do**:
  - Don't persist reviews across reloads (in-memory for demo)
  - Don't require auth — use current user from authStore

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Star ratings, review form modal, rating breakdown

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6B (UI)
  - **Blocked By**: Tasks 35 (stores), 37 (demo data), 42 (product page)

  **References**:
  - `src/components/dashboard/ReviewModal.js` — Existing review modal pattern
  - `src/lib/demo/data/reviews.js` — Demo review data

  **Acceptance Criteria**:
  - [ ] Summary shows overall rating, count, rating breakdown
  - [ ] Review list shows user name, stars, text, date
  - [ ] "Write a Review" opens review form
  - [ ] Star selector works (click to select)
  - [ ] Submitting shows success toast
  - [ ] New review appears in list after submission
  - [ ] RatingStars works in display + input modes

  **QA Scenarios**:
  ```
  Scenario: Reviews display and submission
    Tool: Playwright
    Preconditions: On product detail page for "p-1"
    Steps:
      1. Scroll to reviews section
      2. Verify summary shows rating and count
      3. Verify existing reviews listed with stars, text, date
      4. Click "Write a Review"
      5. Select 5 stars, type "Great product!", submit
      6. Verify success toast + new review in list
    Expected Result: Reviews display and submission work
    Evidence: .omo/evidence/task-44-reviews.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): customer reviews with star ratings, summary, submission form`
  - Files: `src/components/marketplace/ReviewList.js`, `src/components/marketplace/ReviewForm.js`, `src/components/marketplace/RatingStars.js`

- [ ] 45. **Marketplace asset placeholders (images, icons)**

  **What to do**:
  - Create `src/components/marketplace/ProductImage.js` — smart image component:
    - Shows actual image or placeholder SVG on error
    - First-letter fallback with product name
    - Rounded corners, consistent aspect ratio
  - Create `src/components/marketplace/CategoryIcon.js` — maps category names to lucide-react icons:
    - Engine Parts → Wrench, Brake Parts → Disc, Electrical → Zap, Suspension → Route, Filters → Filter, Accessories → Package
    - Wrapped in consistent colored circle
  - Create `public/images/marketplace/product-placeholder.svg`
  - All images have descriptive alt text for accessibility

  **Must NOT do**:
  - Don't use external CDN images (CSP concern)
  - Don't import large assets

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Placeholder images, fallback handling, icon mapping

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6A (foundation)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `lucide-react` — Already available
  - `src/app/globals.css` — Theme colors

  **Acceptance Criteria**:
  - [ ] ProductImage shows actual image or placeholder on error
  - [ ] CategoryIcon returns correct icon per category
  - [ ] Placeholder SVG at public/images/marketplace/product-placeholder.svg
  - [ ] All images have alt text

  **QA Scenarios**:
  ```
  Scenario: Placeholder renders when image missing
    Tool: Playwright
    Steps:
      1. Navigate to marketplace home
      2. Verify product cards without images show placeholders
    Expected Result: No broken images, placeholders display
    Evidence: .omo/evidence/task-45-placeholders.png
  ```

  **Commit**: YES (Group with 46)
  - Message: `feat(marketplace): placeholder assets, product image fallback, category icons`
  - Files: `src/components/marketplace/ProductImage.js`, `src/components/marketplace/CategoryIcon.js`, `public/images/marketplace/product-placeholder.svg`

- [ ] 46. **Product listing tests + demo mode verification**

  **What to do**:
  - Create `src/store/__tests__/marketplace.test.js` — unit tests:
    - productStore: search, filter by price/brand/vendor/rating, clear filters
    - cartStore: addItem, removeItem, updateQuantity, getTotal, applyCoupon
    - orderStore: placeOrder (mock), fetchOrderHistory
    - categoryStore: selectCategory, listCategories
  - Create `src/components/marketplace/__tests__/ProductCard.test.js`:
    - Renders product info correctly
    - Click navigates to product detail
  - Create `src/components/marketplace/__tests__/RatingStars.test.js`:
    - Display mode renders correct stars
    - Input mode allows rating selection
  - Playwright check: All marketplace pages render in demo mode without errors

  **Must NOT do**:
  - Don't test real API endpoints — use mock data
  - Don't add E2E tests requiring backend

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive test creation for stores, components, demo mode

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 6B (after tasks 40-44)
  - **Blocked By**: Tasks 35 (stores), 37 (demo data), 40-44 (UI screens), 18 (Vitest)

  **References**:
  - Vitest config from Task 18
  - Playwright config from Task 19

  **Acceptance Criteria**:
  - [ ] Store tests pass: productStore add, remove, update, total
  - [ ] Store tests pass: productStore search, filter, clear
  - [ ] Store tests pass: orderStore placeOrder, fetchHistory
  - [ ] ProductCard renders and navigates on click
  - [ ] RatingStars display mode renders correctly
  - [ ] RatingStars input mode allows selection
  - [ ] All marketplace pages render in demo mode

  **QA Scenarios**:
  ```
  Scenario: All marketplace tests pass
    Tool: Bash
    Steps:
      1. npx vitest run src/store/__tests__/marketplace.test.js
      2. npx vitest run src/components/marketplace/__tests__/
    Expected Result: All tests pass
    Evidence: .omo/evidence/task-46-marketplace-tests.txt
  ```

  **Commit**: YES (Group with 45)
  - Message: `test(marketplace): unit tests for stores, components, demo mode verification`
  - Files: `src/store/__tests__/marketplace.test.js`, `src/components/marketplace/__tests__/ProductCard.test.js`, `src/components/marketplace/__tests__/RatingStars.test.js`

---

## Final Verification Wave (MANDATORY)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback → fix → re-run → present again → wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.omo/evidence/`. Compare deliverables against plan.
  - Verify all 46 tasks completed with evidence
  - Check Must Have: standalone output, CSS vars theme, demo mode gating, Tailwind v4 fix, Leaflet enhancements
  - Check Must NOT Have: no Google Maps, no Google Places autocomplete, no backend dependency
  - **Output**: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run the build, lint, and test commands from the plan's "Success Criteria" section. Review all changed files for:
  - Type suppressions (`@ts-ignore`, `@ts-expect-error`)
  - Empty catches (`catch {}`, `catch(e) {}`)
  - Debug logging in production (`console.log`, `console.warn`)
  - Commented-out code blocks
  - Unused imports or variables
  - AI slop: excessive comments, over-abstraction, generic names (`data`, `result`, `item`, `temp`), premature abstractions
  - Check `next.config.mjs` for correctness of standalone/build-mode switching
  - Check CSS for no regressions in existing selectors
  - **Output**: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state (`git stash`, `npm ci`, `npm run build`). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation):
  - Demo mode: app loads without backend, shows mock data, all navigation works
  - Production mode: app builds with `standalone` output, `NEXT_PUBLIC_DEMO_MODE=false` tree-shakes demo code
  - Theme: toggle between light/dark, CSS variables apply correctly across all pages
  - Map: markers render, clustering works, My Location button functions
  - Mobile: Capacitor APK builds, app opens on device
  - Test edge cases: empty state, invalid input, rapid theme toggling
  - Save to `.omo/evidence/final-qa/`
  - **Output**: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (`git log`/`git diff`). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no scope creep). Check "Must NOT do" compliance. Detect cross-task contamination (Task N touching Task M's files). Flag unaccounted changes.
  - Verify no Google Maps code was added accidentally
  - Verify no backend-reliant code runs without demo flag
  - Verify theme refactor didn't introduce new JS-only theme toggling
  - **Output**: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

> Roll-up commits aggregating related tasks into atomic, reviewable chunks.
> Each commit preserves a working build state.
> Order respects task dependencies.

| Commit | Tasks Included | Message | Scope |
|--------|---------------|---------|-------|
| 1 | 1, 2, 4 | `chore(config): standalone output, Dockerfile, Render yaml` | Build configs |
| 2 | 3, 9 | `refactor(theme): CSS variable theming infrastructure + pure CSS ThemeProvider` | Theme foundation |
| 3 | 5, 6, 7 | `chore(cleanup): AuthInit dead code removal, Toast relocation, env validation` | Code cleanup |
| 4 | 8, 18, 19 | `feat(test): Vitest + Playwright infrastructure, initial tests, CI integration` | Test infrastructure |
| 5 | 10, 11, 12, 13, 14 | `refactor(theme): remove isLight ternaries from 58+ files (all components)` | Theme refactor batch |
| 6 | 15, 16, 17 | `refactor(demo): compile-time gated demo mode via NEXT_PUBLIC_DEMO_MODE` | Demo mode gating |
| 7 | 20, 21, 22, 23, 24 | `feat(deploy): PWA manifest, CSP hardening, CI pipeline, Sentry, SEO` | Production infrastructure |
| 8 | 25, 26, 27, 28, 29 | `feat(mobile): Capacitor Android APK setup, export mode, build scripts` | Mobile (Capacitor) |
| 9 | 30, 31, 32, 33, 34 | `feat(features): chat, i18n, booking, referral scaffolds, Leaflet map enhancement` | Major features |
| 10 | 35, 36, 37 | `feat(marketplace): Zustand stores, constants, demo data, API interceptor` | Marketplace foundation |
| 11 | 38, 39, 45 | `feat(marketplace): BottomNav, route group layout, placeholder assets, icons` | Marketplace layout |
| 12 | 40, 41 | `feat(marketplace): home screen, search bar, filter panel, search results` | Marketplace home/search |
| 13 | 42, 43, 44 | `feat(marketplace): product detail, vendor comparison, cart, checkout, reviews` | Marketplace UX |
| 14 | 46 | `test(marketplace): unit tests for stores, components, demo mode QA` | Marketplace tests |

> **Pre-commit verification pattern for EVERY commit:**
> ```bash
> npm run build     # Must succeed
> npm run lint      # Must pass (or pre-existing warnings only)
> ```

---

## Success Criteria

### Verification Commands
```bash
# Build verification
npm run build                                             # Expected: Build completes successfully (all modes)

# Production standalone build
NEXT_PUBLIC_DEMO_MODE=false npm run build                  # Expected: Build outputs .next/standalone/

# Demo mode build
NEXT_PUBLIC_DEMO_MODE=true npm run build                   # Expected: Build succeeds, no backend errors

# Lint
npm run lint                                               # Expected: No errors

# Tests
npm run test                                               # Expected: All tests pass
npm run test:e2e                                           # Expected: All E2E tests pass

# Theme verification
# Open app in browser, toggle theme — CSS variables apply globally

# Demo mode verification
# Open app with NEXT_PUBLIC_DEMO_MODE=true — app loads with mock data, no backend calls

# Mobile
cd mobile && npx cap copy && npx cap sync                  # Expected: Gradle sync succeeds
cd mobile && npx cap open android                          # Expected: Android Studio opens

# Marketplace verification
curl http://localhost:3000/marketplace                     # Expected: HTTP 200, home screen renders
curl http://localhost:3000/marketplace/search?q=brake       # Expected: HTTP 200, search results
curl http://localhost:3000/marketplace/product/p-1          # Expected: HTTP 200, product detail
curl http://localhost:3000/marketplace/cart                 # Expected: HTTP 200, cart page
# Bundle size
npx next build && head -30 .next/build-manifest.json       # Expected: reasonable bundle sizes
```

### Final Checklist
- [ ] All "Must Have" items present and verified
- [ ] All "Must NOT Have" items absent (verified by code search)
- [ ] `npm run build` succeeds in both demo and production modes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run test:e2e` passes
- [ ] Theme toggle works across all pages via CSS variables
- [ ] Demo mode operates without backend
- [ ] Production build outputs standalone artifact
- [ ] Capacitor APK builds successfully (or dev build verified)
- [ ] All evidence files present in `.omo/evidence/`
- [ ] Marketplace home screen renders at `/marketplace` with categories, featured products, offers
- [ ] Search with filters works at `/marketplace/search?q=...`
- [ ] Product detail page at `/marketplace/product/[id]` shows vendor comparison table
- [ ] Full cart-to-checkout-to-order flow works end-to-end
- [ ] Customer reviews display and submission work on product detail page
