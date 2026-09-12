# ClutchD-App — Persistent Login + Date/Plate Formatting + SOS Menu Move

**Branch:** `clutchd-app-hardening` (dirty — 70+M / 100+?? files, see `git status --short`)
**Date:** 2026-09-11
**Skills:** ai-project-manager (plan) + prompt-master (prompts)
**Planning docs:** No `SPEC.md`/`ROADMAP.md`/`TASKS.md` at root or `docs/`. Source of truth used: `docs/BACKEND_CONTRACTS.md` + `AGENTS.md` + code. This file is the plan. Do NOT invent SPEC requirements.

## 0. Ground truth (verified)

**Auth today** (`src/store/authStore.js`, `src/lib/tokenStore.js`, `src/lib/api.js`):
- Access token: memory + `localStorage clutchd_access_token / clutchd_token_expires_at`. `setAccessToken(newToken)` called WITHOUT `ttlMs` in login / google / restore / refresh paths → `tokenExpiresAt=0` = never expires client-side. Server TTL assumed 15 min (`NEXT_PUBLIC_ACCESS_TTL_MINUTES`).
- Refresh: httpOnly cookie (`withCredentials:true`), `restoreSession()` on `AuthInit` → `POST /auth/refresh`. Demo (`demo-*`) + Firebase (`firebase-*`) users skip refresh. Network error keeps cached user; 401/403 clears.
- Proactive refresh at 80% TTL (12 min default) + `api.js` 401 refresh-and-retry queue.
- `checkAuth()` is legacy duplicate of `restoreSession()`.
- Backend contracts: `/auth/login, /signup, /oauth/google, /refresh, /logout, /forgot-password/*` (see `docs/BACKEND_CONTRACTS.md §1`). Rule: Firebase stays explicit fallback, never silent local login. Keep offline fallback behind `BackendHealth`.

**Formatting today** (`src/lib/utils.js`, `src/lib/plateFormatter.js`):
- Canonical date: `formatDate` → `en-IN {day:numeric, month:short, year:numeric}`, `formatTime` → `en-IN {hour:2-digit, minute:2-digit}`, fallback `—`. Canonical plate: `formatIndianPlate` → `TN 38 AB 1234`, `canonicalPlate` → `TN38AB1234`.
- Drift: `ScheduledAppointments.js`, `VehicleList.js`, `ServiceHistory.js` use `date-fns MMM d, yyyy h:mm a`; `chart-formatters.js` uses `en-US`; `product/[id]/client.js:444` + `FleetDashboard:170` raw `toLocaleDateString()`; raw plates in `ScheduleBookingModal.js:89 (${v.license_plate})`, `FleetBookingPanel:173`, `ServiceStatusTracker:251,295`, `FleetDashboard:94,123`, `fleetStore.js:149,206,227`.

**SOS today** (`src/components/ui/SOSButton.js` only used in `src/app/dashboard/customer/page.js:449`):
- `fixed bottom-24 left-6 z-[100]`, expands `w-14 → w-48` on confirming/sent/queued. Error/queued toasts `fixed bottom-28 left-6 z-[100]`. Sits above bottom tab bar (`z-40`), covers map/panels left-bottom.
- Logic: 2-tap confirm (5s), geolocation 3s fallback 0,0, `POST /service/sos`, offline `enqueueRequest SOS`, 12s rate-limit + 15s 429 debounce.
- Move targets: `BottomNav.js` Menu popover (`fixed bottom-0 z-40 lg:hidden`, `z-[9999]` popover), `ProfileMenu.js` Support & Safety section, `marketplace/profile/safety/page.js` info destination. `DashboardShell.js` drawer disabled on customer page (`hideMobileMenu`).

## 1. Missing / decisions / risks

- No SPEC/ROADMAP/TASKS — scope locked to your 3 requests only. No new auth providers, no backend changes, no i18n locale change (stay `en-IN`).
- Decision needed: prompt target tool (Claude Code vs Cursor vs other) — asked separately. Plan below is tool-agnostic.
- Risks: (a) dirty tree — stash/commit before work or diff will be unreadable; (b) `tokenStore` expiry change can log users out if TTL mismatched — keep server TTL as source; (c) SOS move must NOT lose one-tap emergency access — menu adds one tap, keep confirm flow; (d) Capacitor export stub + offline queue must keep working.
- Dependencies: backend `/auth/refresh` + `/service/sos` must be live to fully verify; otherwise verify against mocks + unit tests.

## 2. Phase plan (reviewable, one phase at a time)

### Phase 1 — Persistent login (real)
**Scope:** `src/store/authStore.js`, `src/lib/tokenStore.js`, `src/components/ui/AuthInit.js`, `src/app/layout.js`, tests `src/store/__tests__/authStore.test.js`.
**Do:**
- Pass `ttlMs = ACCESS_TTL_MS` to every `setAccessToken()` (login, google, restore, proactive refresh). Enforce expiry in `getAccessToken()` (already does).
- Unify `checkAuth()` → delegate to `restoreSession()` (remove duplicate refresh logic).
- Narrow bypass: only `demo-*` skips refresh; `firebase-*` attempts refresh, falls back to cached user on 401 with explicit toast (per BACKEND_CONTRACTS: Firebase explicit fallback only).
- Add `rememberMe` (LoginCard checkbox, default true): when false, skip `persist` partialize of user + clear on window close (sessionStorage only). When true, current localStorage behavior.
- Refresh-failure UX: on 401/403 during restore → clear + redirect to `/auth` with `?expired=1`; LoginCard shows "Session expired, please log in again".
**Acceptance:** reload with backend on → stays logged in; reload with backend off → stays on cached user; expired refresh → clean logout + message; no `setAccessToken` call without ttlMs (`rg setAccessToken`).
**Validation auto:** `npm run test -- authStore`, `npx eslint src/store/authStore.js src/lib/tokenStore.js`, `npm run build`.
**Validation manual:** login → reload → still in dashboard; kill backend → reload → cached; expire cookie → expired message.
**Rollback:** revert authStore/tokenStore only. **Pause after phase.**

### Phase 2 — Date + plate formatting
**Scope:** replace raw formats with `formatDate/formatTime` + `formatIndianPlate/canonicalPlate`; files: `ScheduledAppointments.js`, `VehicleList.js`, `ServiceHistory.js`, `OrderTimeline.js` (keep), `ScheduleBookingModal.js:89`, `FleetBookingPanel`, `ServiceStatusTracker`, `FleetDashboard`, `fleetStore.js`, `product/[id]/client.js:444`, `chart-formatters.js` (leave charts en-US, document why).
**Do:**
- Dates: `format(parseISO(x), ...)` → `formatDate(x) + ' · ' + formatTime(x)` where time needed; keep `en-IN`.
- Plates: every display `v.plate / license_plate` → `formatIndianPlate(...)` with `font-mono tracking-wider`; every input onBlur → `canonicalPlate(...)` (follow `VehicleManagerModal.js:56` precedent).
- Add `formatDateTime(date)` helper in `utils.js` if needed (date + time combo).
**Acceptance:** `rg "MMM d|license_plate\}|\b(v\.plate|vehicle\.plate)" src --glob '!*test*'` returns only chart + canonical input lines; plates render `TN 38 AB 1234`; dates `en-IN`.
**Validation auto:** `npm run test -- utils validators`, `npx eslint` on touched files, `npm run test:e2e -- mechanic-finding` (vehicle displays).
**Validation manual:** customer/fleet dashboards show grouped plates + IN dates.
**Rollback:** revert display files only. **Pause after phase.**

### Phase 3 — SOS to menu
**Scope:** `src/components/ui/SOSButton.js` (extract logic), `src/app/dashboard/customer/page.js:449` (remove overlay), `src/components/ui/BottomNav.js` (Menu popover SOS item), `src/components/profile/ProfileMenu.js` (Support & Safety SOS item), optional `src/app/marketplace/profile/safety/page.js` (link target).
**Do:**
- Extract `useSOS()` hook (or `triggerSOS()` util) from `SOSButton.js` preserving: 2-tap confirm, geolocation, `POST /service/sos`, offline queue, 12s/15s guards, toasts.
- Remove `<SOSButton/>` fixed overlay from customer page. No `fixed bottom-24 left-6 z-[100]` overlays remain (`rg "bottom-24 left-6"` = 0).
- Add SOS in: (a) BottomNav Menu popover (red row, `AlertTriangle`, confirm inline or modal), (b) ProfileMenu Support & Safety (Emergency SOS row → same confirm modal or safety page with trigger). Both call shared hook. Keep `safety/page.js` as info + trigger.
- Toasts render in normal flow (top-center or via toastStore), never fixed bottom-left.
**Acceptance:** customer dashboard has no floating red button; SOS reachable in ≤2 taps from menu on mobile + desktop; offline queue + rate-limit preserved; map/panels unobstructed.
**Validation auto:** `npx eslint` touched files, `npm run build`, `npm run test:e2e -- landing button-smoke` (no overlay covering buttons).
**Validation manual:** mobile 375px + desktop 1440px: open Menu → SOS → confirm → sent/queued toast; offline → queued.
**Rollback:** revert 4 files above. **Pause after phase.**

## 3. Global gates
- Before start: `git stash -u` or commit on `clutchd-app-hardening`; record `git status --short`.
- After each phase: diff review (`git diff --stat`), diagnostics clean, build 0, tests pass or pre-existing failures noted.
- Never: remove `initDemoFleet` seeds, flip `cartStore.backendEnabled`, delete localStorage mocks, or change email-disabled edit-profile (per BACKEND_CONTRACTS §3).
- Final: changed files list + checks run + skipped + residual risk. Hand to `pr-readiness` only when you ask to merge.
