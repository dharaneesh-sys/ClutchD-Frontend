# Session 1 Summary — App Polish: Edit Profile, Dark Mode, General Improvements & Full Audit

**Date:** 2026-07-13
**Plan:** [app-polish-edit-profile-dark-mode.md](./app-polish-edit-profile-dark-mode.md)

---

## What We Did

### Workstream 1 — Edit Profile Fix (Frontend + Backend) ✅

**Frontend** — `src/app/marketplace/profile/edit/page.js`
- Fixed GET field mapping: `p.name` → `p.full_name` (backend returns `full_name`)
- Fixed PUT payload key: `name:` → `full_name:`
- Fixed PUT response mapping: removed `res.data.user` indirection, maps `res.data` directly
- Added photo upload: FileReader → data URI → sent as `photo` in PUT body
- Fixed error handling: removed fake success toast, now shows real API error via `extractApiError()`
- Uses `updateUserData()` from authStore (already accepts partial profile objects)

**Backend** — `backend/app/api/v1/profile.py`, `schemas/profile.py`, `main.py`
- `ProfileUpdateRequest` schema: added optional `photo: str | None` field
- PUT `/me` handler: decodes base64 data URI, validates MIME type (jpeg/png/webp), size check (5MB max), saves to `uploads/profile_photos/{uuid}.{ext}`
- Static mount at `/uploads` in `main.py` for serving uploaded photos
- Directory auto-created on startup

### Workstream 2 — Dark Mode Icons ⚠️ (82% complete)

- Replaced **54 of 66** hardcoded `text-emerald-400`, `text-amber-400`, `fill-amber-400`, `fill-emerald-400`, `bg-emerald-400`, `bg-amber-400`, `border-emerald-400`, `border-amber-400` instances with CSS variable utility classes
- Covered 29+ files across dashboard, marketplace, admin, and UI components

**12 instances remaining** across 8 files (all status indicator dots — `bg-emerald-400`, `bg-amber-400`, `text-amber-400`, `border-emerald-400`):
| File | Count |
|------|-------|
| `src/components/ui/ChatWidget.js` | 2 |
| `src/components/ui/ConnectionIndicator.js` | 2 |
| `src/components/marketplace/OrderTimeline.js` | 2 |
| `src/app/marketplace/orders/page.js` | 2 |
| `src/app/marketplace/profile/page.js` | 1 |
| `src/app/marketplace/profile/settings/page.js` | 1 |
| `src/components/dashboard/ProviderList.jsx` | 1 |
| `src/components/subscription/PlanCard.js` | 1 |

### Workstream 3 — General Improvements ✅

**SplashScreen** — `src/components/ui/SplashScreen.js`
- Full-screen centered layout with Logo + spinner
- Reads `_isRestoring` from authStore; renders only during auth state hydration
- Wired into **5 pages**: customer/mechanic/garage/fleet dashboards + marketplace profile

**ErrorBoundary** — `src/components/ui/ErrorBoundary.js`
- React class-based error boundary
- Expandable error details (stack trace), "Try Again" button, custom fallback support via `fallback` prop
- Wraps app content in `src/app/layout.js`

**System Theme Detection** — `src/store/themeStore.js`
- Added `followSystemTheme()` action (respects OS `prefers-color-scheme`)
- Added `setTheme()` for explicit light/dark
- Reads system preference on init when no stored preference exists
- Migrates legacy `theme-storage` from older zustand persist format
- Note: `followSystemTheme()` is defined but not yet wired to any UI button

---

## Full App Audit — 3 Parallel Audits

### Audit 1: Dependencies & Security 🔴🟡🟢

**8 P0 (Must Fix):**
| # | Issue | File |
|---|-------|------|
| 1 | Render.com URL hardcoded in JSON-LD | `src/app/layout.js:86` |
| 2 | Google OAuth client ID leaked (tracked in git) | `googleauth.txt` |
| 3 | User data leaked to DOM attribute | `src/app/layout.js:67-70` |
| 4 | Capacitor cleartext HTTP enabled | `capacitor.config.js:9` |
| 5 | localhost fallback URLs in constants | `src/lib/constants.js:68,74` |
| 6 | Dockerfile fragile binary copy | `Dockerfile:36` |
| 7 | CSP allows unsafe-inline + unsafe-eval | `next.config.mjs:78` |
| 8 | JWT secret in `.env.docker` | `.env.docker:9` |

**8 P1 (Should Fix):** VAPID key missing, Firebase config silent in prod, 3x `dangerouslySetInnerHTML`, stale `render.yaml`, Docker compose hardcoded, `idb` as transitive dep, auth page no aria-labels, landing page no skip-link target, demo mode defaults to true in example.

**20 P2 (Nice to Have):** Unused deps (6 packages), dev deps in prod, dead components (ThemeToggle, ProfileFAB, PageTransition), dead utility function, SW unregister-on-load, 27 console.* calls, 1054-line CSS, 8 oversized files (500+ lines), empty catch blocks, unused @visx/gradient, env.example stale, etc.

### Audit 2: UX/UI & Edge Cases 🔴🟡🟢

**5 P0 (Critical):**
| # | Issue | Detail |
|---|-------|--------|
| 1 | Product deep-link fails | `getProductById()` searches local array — direct URLs show blank/shimmer forever |
| 2 | Auth guard flash | `useEffect`-based redirect shows partial content before redirect |
| 3 | Request queue dead code | `registerOnlineFlush()` never called; no per-request retry limit |
| 4 | Google OAuth popup blocker no fallback | `auth/popup-closed-by-user` silently swallowed, no toast |
| 5 | Fake i18n | Language selector writes to localStorage but no translation system reads it |

**9 P1 (Major):** No cache invalidation in offline cache, WS reconnection no jitter, NotificationBell silent catch, PushPermissionBanner no feedback after grant, Edit profile silent fallback on API error, warranty claims dual-write race, no server-side search, missing loading.js/error.js in fleet dashboard, back button ignores open modals.

**9 P2 (Minor):** Safety page shimmer for static content, WS console.warn for routine events, cart coupon client-side only, etc.

### Audit 3: PWA / Service Worker / Android / Build 🔴🟡🟢

**3 P0 (Critical):**
| # | Issue | Detail |
|---|-------|--------|
| 1 | FCM SW globals never injected | `firebase-messaging-sw.js` inits with `undefined` values — push notifications never work on web |
| 2 | No Android signing config | APK cannot be signed for Play Store or side-loading |
| 3 | `minifyEnabled false` in release | APK unminified, easily reverse-engineered |

**10 P1 (Important):** SW only pre-caches 2 assets, missing `activate` event, no SplashScreen plugin config, no deep-link config in Capacitor, `ACCESS_BACKGROUND_LOCATION` permission, Dockerfile misaligned for static export, `versionCode 1` hardcoded, no iOS PWA meta tags, missing `scope`/`orientation` in manifest, SW unregister-then-register creates gap.

**9 P2 (Polish):** Em dash in manifest, deployment strategy ambiguity, `render.yaml` stale, `android/` gitignored (fresh checkout can't build), `allowBackup=true`, contradictory cleartext+https config, JSON-LD URL hardcoded, `minSdkVersion 23`, offline fallback returns empty 504.

---

## Files Changed

### Frontend (ClutchD-App) — 50+ files
- `src/app/marketplace/profile/edit/page.js` — edit profile fix
- `src/components/ui/SplashScreen.js` — **new**: splash screen component
- `src/components/ui/ErrorBoundary.js` — **new**: error boundary component
- `src/store/themeStore.js` — system theme detection added
- `src/app/layout.js` — ErrorBoundary wrapper, SplashScreen import
- `src/app/dashboard/customer/page.js` — SplashScreen wired
- `src/app/dashboard/garage/page.js` — SplashScreen wired
- `src/app/dashboard/mechanic/page.js` — SplashScreen wired
- `src/app/dashboard/fleet/page.js` — SplashScreen wired
- `src/app/marketplace/profile/page.js` — SplashScreen wired
- 29+ files with hardcoded color replacements (see `git diff` for full list)

### Backend (ClutchD-Backend) — 3 files
- `backend/app/api/v1/profile.py` — PUT /me photo upload
- `backend/app/schemas/profile.py` — ProfileUpdateRequest updated
- `backend/app/main.py` — static mount + uploads directory

---

## Next Steps (In Order)

1. **Fix remaining 12 hardcoded colors** (8 files) — map to CSS var semantic classes
2. **Integrate P0 audit findings** — especially:
   - Fix product deep-link (add `fetchProduct(id)` to productStore)
   - Fix auth flash (render SplashScreen until `_isRestoring` false)
   - Fix queue dead code (register `registerOnlineFlush()` in Providers)
   - Remove `googleauth.txt` from git + add to `.gitignore`
   - Replace Render.com URL with env var
   - Add FCM SW global injection
3. **Integrate select P1 findings** — cache invalidation, WS jitter, idb dep
4. **Rebuild APK** — `npm run build:android`

---

## Stats

| Category | Count |
|----------|-------|
| Files modified | 50+ frontend + 3 backend |
| New components | 2 (SplashScreen, ErrorBoundary) |
| Hardcoded colors replaced | 54/66 (82%) |
| Audit findings total | 16 P0 + 27 P1 + 38 P2 = **81 findings** |
| LSP diagnostics | Clean on all checked files |
