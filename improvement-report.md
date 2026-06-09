# ClutchD — Comprehensive Improvement Report

**Generated:** 2026-06-07  
**Scope:** Full-stack analysis of ClutchD (FastAPI backend + Next.js frontend)  
**Repos:** `dharaneesh-sys/ClutchD-Frontend`, `dharaneesh-sys/ClutchD-Backend`

---

## Table of Contents

1. [Architecture & Code Organization](#1-architecture--code-organization)
2. [Code Quality](#2-code-quality)
3. [Security](#3-security)
4. [Performance](#4-performance)
5. [UI/UX](#5-uiux)
6. [Testing & QA](#6-testing--qa)
7. [Dependencies & Configuration](#7-dependencies--configuration)
8. [DevOps & Deployment](#8-devops--deployment)
9. [Documentation](#9-documentation)
10. [Feature Gaps](#10-feature-gaps)
11. [Prioritized Action Plan](#11-prioritized-action-plan)

---

## 1. Architecture & Code Organization

### Backend (FastAPI) ✅ Strengths

| Layer | Structure | Notes |
|-------|-----------|-------|
| `api/v1/` | 15 route modules | RESTful, well-named endpoints |
| `core/` | Config, security, limiter, redis | Clean separation |
| `models/` | 12 SQLAlchemy models | Good ORM usage |
| `schemas/` | 7 Pydantic schemas | Proper validation |
| `services/` | 5 service modules | Good business logic separation |
| `tasks/` | Celery worker | Background job processing |
| `ws/` | WebSocket manager | Real-time communication |

### Frontend (Next.js) ✅ Strengths

| Layer | Structure | Notes |
|-------|-----------|-------|
| `app/` | App Router with grouped routes | Clean page organization |
| `components/` | Feature-grouped directories | UI, auth, dashboard, admin, etc. |
| `lib/` | API client, socket, utils | Good abstraction |
| `store/` | 5 Zustand stores | Decentralized state management |
| `services/` | Admin service | API call abstraction |

### 🔴 Issues Found

#### C-B1: Backend `admin.py` (837 lines) — Too Large
- **File:** `backend/app/api/v1/admin.py` (837 lines)
- **Problem:** Contains 15+ unrelated endpoints (users, mechanics, garages, jobs, disputes, payments, pricing, KYC, analytics). Violates Single Responsibility Principle.
- **Fix:** Split into `admin/` package with sub-modules:
  - `admin/users.py` — user CRUD + status toggle
  - `admin/providers.py` — mechanic/garage verify + penalize
  - `admin/jobs.py` — job listing + force-assign + track
  - `admin/disputes.py` — dispute CRUD + refund + message
  - `admin/analytics.py` — dashboard stats
  - `admin/payments.py` — payment list + refund

#### C-B2: Backend `job_service.py` (475 lines) — Too Large
- **File:** `backend/app/services/job_service.py` (475 lines)
- **Problem:** Mixes job lifecycle, pricing calculation, and notification logic in one module.
- **Fix:** Split into:
  - `job_service.py` (core) — state machine, create, assign, cancel, delete
  - `job_pricing.py` — fee calculation, GST, distance fee
  - `job_notifications.py` — WS push + notification creation

#### C-B3: Backend `payments.py` (398 lines) — Too Large
- **File:** `backend/app/api/v1/payments.py` (398 lines)
- **Problem:** Mixes Razorpay order creation, webhook handling, QR code generation, mock client, and Stripe integration.
- **Fix:** Split into:
  - `payments.py` (core) — create order, verify
  - `payments_razorpay.py` — Razorpay webhook handler
  - `payments_stripe.py` — Stripe webhook handler (adds missing integration)

#### C-B4: No Service-Repository Layer Separation
- **Where:** All services
- **Problem:** Business logic directly uses SQLAlchemy `select()` queries. There's no repository pattern or data access abstraction — services are coupled to ORM.
- **Severity:** Medium
- **Fix:** Introduce repository modules per entity (e.g., `repositories/user_repo.py`) that encapsulate query logic. Services depend on repositories, not raw queries.

#### C-F5: Theme Store Imported in Every Component
- **Where:** All UI components (Input.js, Button.js, GlassCard.js, Select.js, etc.)
- **Pattern:**
  ```javascript
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  ```
- **Problem:** Every atomic UI component subscribes to the theme store, causing unnecessary re-renders across the entire tree on theme change. There are 19+ UI components all doing this.
- **Fix:** Use CSS custom properties (CSS variables) for theming instead of JS-based conditional classes. Already partially set up in `globals.css` — need to migrate component-level `isLight` ternary patterns to pure CSS. Alternative: create a single `useTheme` hook that sets a `data-theme` attribute on `<html>`, and use CSS-only theming with `[data-theme="light"]` selectors.

#### C-F6: Frontend `lib/api.js` — Global Interceptor Complexity
- **File:** `src/lib/api.js` (123 lines)
- **Problem:** The token refresh interceptor uses mutable module-level state (`isRefreshing`, `pendingRequests` array) which is fragile in concurrent scenarios and not testable.
- **Fix:** Use a proper token refresh queue utility class instead of module-level closures.

#### C-F7: WebSocket Token in URL Query Parameter
- **File:** `src/lib/socket.js` line 33
  ```javascript
  const url = token ? `${WS_URL}?token=${token}` : WS_URL;
  ```
- **Problem:** Auth token exposed in URL. Browsers log URLs in history, server logs, referrer headers, etc. This leaks the JWT.
- **Fix:** Authenticate WebSocket via a short-lived one-time token or authenticate after connection via a protocol-level auth message, not the URL.

#### C-B8: Hardcoded Constants in Modules
- **File:** `backend/app/services/job_service.py` lines 335-340
  ```python
  CONVENIENCE_FEE = 40.0
  CANCELLATION_FEE = 30.0
  DAY_RATE_PER_KM = 1.0
  NIGHT_RATE_PER_KM = 2.0
  GST_RATE = 0.18
  PLATFORM_UPI = "amdevanand206@oksbi"
  ```
- **Problem:** Business-critical fees hardcoded in a service module. Cannot be changed without code deployment. The UPI ID should be per-provider (already in `provider_upi_id` field) but the fallback `PLATFORM_UPI` is hardcoded.
- **Fix:** Move to database config table or env vars.

#### C-B9: Duplicate Raw SQL Queries
- **Files:** `backend/app/services/matching.py`, `backend/app/api/v1/admin.py`
- **Problem:** Mix of SQLAlchemy ORM and raw SQL `text()` queries. Raw SQL bypasses ORM benefits (type checking, schema migrations, dialect abstraction).
- **Fix:** Prefer SQLAlchemy ORM or `select()` expressions. Only use raw SQL for PostGIS-specific functions.

#### C-B10: No Migration for Provider UPI/Coordinates Fields
- **Files:** Models reference `provider_upi_id`, `lat`, `lon` fields
- **Problem:** If these fields were added recently via SQL scripts (not Alembic migrations), they won't exist in fresh DB setups.
- **Fix:** Ensure all schema changes have Alembic migration revisions.

---

## 2. Code Quality

### Backend Issues

| # | Issue | File | Line | Severity |
|---|-------|------|------|----------|
| 1 | Bare `except: pass` silences errors | `job_service.py` | 229 | High |
| 2 | `except:` without specific exception type | `ws/manager.py` | — | Medium |
| 3 | `print()` statements in production code | Various | — | Low |
| 4 | Missing return type annotations on functions | Several service files | — | Medium |
| 5 | String formatting in SQL queries (`f"...{tag}"`) | `matching.py` | 73-81 | **Critical** |
| 6 | Imports inside function bodies (late imports) | `main.py`, `job_service.py` | Multiple | Low |
| 7 | `# type: ignore` or suppressed type errors | Various | — | Medium |
| 8 | No pre-commit hooks for linting/formatting | — | — | Low |

#### 🔴 Critical: SQL Injection Risk via String Formatting

**File:** `backend/app/services/matching.py` lines 73-81
```python
q = text("""
    SELECT ... FROM mechanics
    WHERE verified = true AND available = true
    {tag_filter}
    LIMIT :maxrows
""".format(
    tag_filter="AND expertise && ARRAY[CAST(:tag AS VARCHAR)]" if issue_tag else ""
))
```

**Problem:** `issue_tag` is concatenated into the SQL string via Python's `.format()`. While the value is only `"AND expertise && ARRAY[CAST(:tag AS VARCHAR)]"` or `""`, this pattern is dangerous and brittle — a future code change could pass user input through this path. The `tag_filter` value is static, but the pattern itself invites injection.

**Fix:** Use `:tag_filter` as a parameterized binding and build the query with SQLAlchemy expressions, or at minimum use a conditional parameter that can't be user-influenced.

#### Frontend Issues

| # | Issue | File | Line | Severity |
|---|-------|------|------|----------|
| 1 | `console.log` / `console.warn` in production | Multiple files | — | Low |
| 2 | `dangerouslySetInnerHTML` in `layout.js` | `src/app/layout.js` | 29 | Medium |
| 3 | `eslint-disable` comment for exhaustive-deps | `customer/page.js` | 74 | Low |
| 4 | Empty catch blocks `catch {}` | Multiple files | — | Medium |
| 5 | Mixed CSS class patterns (Tailwind + custom CSS var) | Multiple files | — | Low |
| 6 | `// eslint-disable-line` instead of fixing deps | `customer/page.js` | 74 | Low |
| 7 | Module-level mutable state in `socket.js`, `api.js` | Both files | — | Medium |
| 8 | No PropTypes or TypeScript (JS-only project) | All files | — | Low |

#### 🔴 Critical: Module-Level Mutable State

**File:** `src/lib/api.js` lines 36-42
```javascript
let isRefreshing = false;
let pendingRequests = [];
```
**File:** `src/lib/socket.js` lines 5-8
```javascript
let wsInstance = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
```

**Problem:** Module-level mutable state in ES modules creates global singletons that can't be reset between tests, cause cross-request pollution in SSR, and create race conditions. The `isRefreshing` + `pendingRequests` pattern is particularly fragile — if a refresh fails midway, `isRefreshing` remains `true` permanently, starving all subsequent requests.

**Fix:** Extract into a class with instance lifecycle, or use Zustand store for shared state.

---

## 3. Security

### 🔴 Critical Findings

### S-1: JWT Token in Memory (XSS Vulnerable)
**Files:** `src/lib/tokenStore.js`, `src/lib/api.js`
**Pattern:** Access token stored in a module-level JavaScript variable:
```javascript
let token = null;
export function setAccessToken(newToken) { token = newToken; }
export function getAccessToken() { return token; }
```
**Risk:** If any XSS vulnerability exists (even from a third-party script), the in-memory JWT is readable via the JavaScript context. Since tokens have 15-minute expiry (configurable), the window is limited but real.

**Recommendation:** Use httpOnly + Secure + SameSite=Strict cookies for the access token. The refresh token already uses httpOnly cookies (`set_refresh_cookie` in `token.py`). Move access token to a cookie too.

### S-2: WebSocket Token via URL Query Parameter
**File:** `src/lib/socket.js` line 33
```javascript
const url = token ? `${WS_URL}?token=${token}` : WS_URL;
```
**Risk:** JWT token leaked in:
- Browser URL history
- Network tab (visible to any page script)
- Server access logs
- Referrer headers
- WebSocket handshake logs

**Recommendation:** Authenticate WebSocket connections after opening the connection by sending an `{"type": "auth", "token": "..."}` message.

### S-3: Inline Script with `dangerouslySetInnerHTML`
**File:** `src/app/layout.js` lines 28-41
```javascript
<script dangerouslySetInnerHTML={{ __html: `... localStorage.getItem('clutchd_theme') ...` }} />
```
**Risk:** Bypasses CSP hash/nonce protections. An attacker who injects content before this script can execute arbitrary JS.

**Recommendation:** Remove the inline theme script. Use a `<link>`-based approach or a nonce-based CSP. Next.js App Router supports route-specific CSP headers.

### S-4: Weak Default JWT Secret
**File:** `backend/app/core/config.py` line 20
```python
jwt_secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
```
**Risk:** The code in `security.py` *does* check for this and raises `RuntimeError` in production. However, the check only matches exact string + its SHA-256 hash. A similar but different weak secret would pass through.

**Recommendation:** The `_check_secret()` function is good — add length/entropy validation: at minimum 32 bytes (64 hex chars), or better 256 bits.

### S-5: Authentication in `/ws` Endpoint Has Stale Token Check
**File:** `backend/app/main.py` lines 135-155
```python
async def _authenticate_ws(websocket, token):
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        await websocket.close(code=4401)
```
**Risk:** Token is only validated for signature and expiry. No blacklist check (like `is_token_blacklisted`). A revoked token can still authenticate WebSocket until its natural expiry.

**Recommendation:** Add `jti` (JWT ID) claim to tokens, and check against Redis blacklist in `_authenticate_ws`.

### Medium Security Findings

| # | Issue | File | Line | Recommendation |
|---|-------|------|------|----------------|
| 6 | CORS allows all headers/ methods | `main.py` | 52-56 | Restrict to known methods only |
| 7 | Rate limiting minimal (15-30 req/min) | Multiple routes | — | Add stricter per-endpoint limits |
| 8 | No Redis auth configured | `config.py` | 17 | Add `redis_password` usage |
| 9 | Missing security headers: CSP, HSTS | `main.py` | 78-88 | Add CSP with nonce, HSTS |
| 10 | File uploads served without auth check | `main.py` | 75 | Mount with auth middleware |
| 11 | SlowAPI limiter not applied to WebSocket | `main.py` | 158-229 | Add manual WS rate limiting (per-IP) |
| 12 | No privacy policy / terms of service API | — | — | Required for Google OAuth compliance |

---

## 4. Performance

### Backend Performance

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| P-1 | Fallback matching loads 2000 rows into memory | High | `_MAX_FALLBACK_ROWS = 2000` in `matching.py`. If PostGIS is unavailable, every mechanic/garage query fetches up to 2000 rows and sorts in Python. |
| P-2 | N+1 pattern in `admin.py` endpoints | Medium | `list_mechanics` (line 212) fetches all mechanics, then loops to count jobs per mechanic with individual queries (lines 222-233). |
| P-3 | N+1 pattern in `list_garages` | Medium | Same pattern as mechanics (lines 261-282). |
| P-4 | Multiple DB round-trips in WebSocket handler | Medium | `main.py` lines 197-225: Each mechanic location update does 3+ DB queries synchronously inside a WebSocket connection handler. |
| P-5 | No database connection pooling tuning | Low | Default `asyncpg` pool settings may not be optimal for concurrent traffic. |
| P-6 | No query caching layer | Low | Redis is used for token blacklisting but not for query result caching. |

### Frontend Performance

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| P-7 | No image optimization | High | `next.config.mjs` has no `images` configuration. All images served unoptimized. |
| P-8 | No bundle analysis run | Medium | `@next/bundle-analyzer` is configured in `next.config.mjs` but disabled by default (only runs with `ANALYZE=true`). |
| P-9 | Recharts bundle size | Medium | Recharts (included for admin dashboard) is ~350KB+ minified. Consider lazy-loading the admin route. |
| P-10 | Framer Motion bundle size | Medium | Framer Motion (included in auth page) is ~150KB+. Consider using CSS animations for simpler transitions. |
| P-11 | Theme store re-renders | Medium | Every UI component subscribes to theme store. A theme toggle triggers re-render of every Input, Button, Card, etc. |
| P-12 | No SSR for auth/marketing page | Low | Auth page is fully client-side rendered despite using `"use client"` unnecessarily in some areas. |
| P-13 | No resource hints (preload/preconnect) | Low | No `<link rel="preconnect">` for API server or Google OAuth. |

### Recommended Performance Actions

**High Priority:**
1. Reduce fallback matching row limit from 2000 to 200, or add pagination
2. Fix N+1 queries in admin endpoints with proper `GROUP BY` joined queries
3. Enable image optimization in Next.js config
4. Add bundle analysis step in CI

**Medium Priority:**
5. Lazy-load admin route components (separate bundle)
6. Replace Framer Motion with CSS animations for simple transitions
7. Migrate theme to CSS custom properties (eliminates JS re-render)
8. Add preconnect hints for API domain

---

## 5. UI/UX

### ✅ What's Working Well

- **Responsive design:** Mobile-first with appropriate breakpoints (`sm:`, `lg:`, `xl:`)
- **Dark/light theme toggle:** Full support via `ThemeProvider` and CSS variables
- **Role-based dashboards:** Separate views for customers, mechanics, garages, and admin
- **Loading states:** Per-page loading.js for each route
- **Error states:** error.js per route + ErrorBoundary component
- **404 page:** Custom not-found.js
- **Global error handler:** global-error.js catches root errors
- **Empty states:** EmptyState component used consistently
- **Glass-card design system:** Consistent visual language with GlassCard, Button, Input, Select
- **Animation:** Smooth Framer Motion transitions on auth page
- **Authentication UX:** Google OAuth + Email/Password + role selection
- **Live map:** Real-time mechanic tracking with Leaflet

### 🔴 UI/UX Issues

| # | Issue | Location | Priority | Details |
|---|-------|----------|----------|---------|
| UX-1 | No global toast/notification system | All pages | **High** | Success messages, errors, and status changes rely on browser alerts or raw error text. No Snackbar/Toast component exists. `notificationStore.js` is set up but only tracks unread count — no display component for notifications. |
| UX-2 | No confirmation on critical actions | All pages | **High** | Canceling a service request, logging out, submitting payment — no confirmation dialogs appear (except a `ConfirmModal` component exists but may not be wired everywhere). |
| UX-3 | Payment UX not fully connected | Customer dashboard | **High** | `PaymentModal` exists but the payment flow between Razorpay QR, UPI, and "payment_pending" → "completed" transition may have gaps. Payment amounts are hardcoded fallback (line 53: `const [paymentAmount, setPaymentAmount] = useState(1200)`). |
| UX-4 | WebSocket connection state not shown to user | Customer dashboard | **Medium** | `getConnectionState()` exists in `socket.js` but nowhere in the UI shows "reconnecting..." or "connection lost" state. The user sees stale data without knowing. |
| UX-5 | GPS permission denied UX could be better | ServiceRequestPanel | **Medium** | Shows "Enter location manually" option, but the manual address search uses Nominatim (free tier) with no rate-limit handling or graceful degradation. |
| UX-6 | No onboarding/welcome flow | Auth pages | **Medium** | After signup, user is redirected to dashboard with no guidance on how to create a first service request or set up their profile. |
| UX-7 | History view is lazily loaded | Dashboard | **Low** | `ServiceHistory` is dynamically imported (line 32), meaning there's a loading flash when switching to the "History" tab. |
| UX-8 | No push notifications for mobile PWA | — | **Medium** | The app has no PWA manifest, no service worker, and no push notification support. Notifications are in-app only. |
| UX-9 | No offline state indication | — | **Low** | If the network drops, there's no visual indicator. Polling silently stops. |
| UX-10 | Admin analytics is a placeholder | Admin | **Low** | The admin analytics endpoint exists but returns limited data (just counts). No charts are rendered for revenue trends, user growth, etc. |
| UX-11 | Admin `/pricing` endpoints are stubs | Admin | **Low** | `GET /api/admin/pricing` returns `[]`, `POST /api/admin/pricing` returns `{"ok": true}` — no actual pricing logic exists. |
| UX-12 | No loading skeleton for maps | Customer dashboard | **Low** | MapView has a loading state but it's just an `animate-pulse` div. A proper map-shaped skeleton would be better. |

### UX Recommendations by Priority

**Immediate (High):**
1. Build a Toast/Snackbar notification component using `notificationStore.js`
2. Wire up `ConfirmModal` to all destructive actions (cancel request, logout, refund)
3. Show WebSocket connection state indicator with "reconnecting..." UX

**Next (Medium):**
4. Build onboarding tooltip/walkthrough for first-time users
5. Add loading skeleton for ServiceHistory tab
6. Implement PWA manifest + service worker for installability

**Future (Low):**
7. Implement admin analytics charts with Recharts
8. Add offline detection banner
9. Implement real admin pricing CRUD

---

## 6. Testing & QA

### Current State
- **No test files found** in either repo
- Deleted test files suggest tests existed but were removed: `test_db.py`, `test_job_service.py`, `test_patch.py`, `test_patch2.py`
- No `pytest.ini`, `jest.config.js`, or `vitest.config.js` found
- No CI/CD test runner configuration
- No `conftest.py` for pytest fixtures
- No testing dependencies in `package.json` or `requirements.txt`

### 🔴 Critical: Zero Test Coverage

This is the single biggest risk in the codebase. For a marketplace app handling payments, user data, and real-time location tracking:

| Area | Risk Level | Impact if Untested |
|------|-----------|-------------------|
| Authentication & Authorization | **Critical** | Users could access each other's data, impersonate admins |
| Payment Processing | **Critical** | Financial loss, failed refunds, double charges |
| Job Lifecycle (state machine) | **High** | Incorrect transitions, data corruption |
| WebSocket Real-time Updates | **High** | Stale location data, missed notifications |
| Matching Algorithm | **High** | Wrong providers assigned, poor search results |
| Dispute Resolution | **Medium** | Incorrect refunds, provider penalties |
| Admin Operations | **Medium** | User status changes not persisted |

### Recommended Testing Setup

**Backend (pytest):**
```python
# conftest.py
- Test DB (SQLite or test Postgres container)
- Test client fixture (httpx.AsyncClient with FastAPI)
- Auth token fixtures
- Mock Redis
- Test user/mechanic/garage fixtures
```

**Test files needed (in priority order):**
1. `tests/test_auth.py` — login, signup, refresh, OAuth, rate limits
2. `tests/test_job_lifecycle.py` — create → assign → en_route → in_progress → payment_pending → complete
3. `tests/test_payments.py` — create order, verify, webhook, refund
4. `tests/test_matching.py` — nearest mechanics/garages, fallback, scoring
5. `tests/test_api_security.py` — unauthorized access, role permissions, token expiry
6. `tests/test_websocket.py` — connect, auth, location update, disconnect
7. `tests/test_admin.py` — user CRUD, verify mechanics, disputes

**Frontend (Vitest + React Testing Library + Playwright):**
1. Component tests for each UI component
2. Integration tests for auth flow
3. E2E tests for critical paths: signup → login → request service → pay → review

---

## 7. Dependencies & Configuration

### Backend (`requirements.txt`)

| Dependency | Version | Status | Notes |
|-----------|---------|--------|-------|
| fastapi | 0.115.6 | ✅ Current | — |
| uvicorn | 0.32.1 | ✅ Current | — |
| sqlalchemy | 2.0.40+ | ✅ Current | — |
| asyncpg | 0.30.0 | ✅ Current | — |
| alembic | 1.14.0 | ✅ Current | — |
| geoalchemy2 | 0.16.0 | ⚠️ | Only needed if PostGIS is re-enabled |
| python-jose | 3.3.0 | ⚠️ | `python-jose` is unmaintained. Recommend `PyJWT`. |
| passlib | 1.7.4 | ⚠️ | Pinned bcrypt due to compatibility |
| slowapi | 0.1.9 | ✅ Current | — |
| authlib | 1.4.0 | ✅ Current | — |
| stripe | 11.4.1 | ✅ Current | — |
| razorpay | 1.4.2 | ✅ Current | — |
| httpx | 0.28.1 | ✅ Current | — |
| celery | 5.4.0 | ⚠️ | Not used on Render free tier (worker removed) |
| redis | 5.2.1 | ✅ Current | — |

**Issues:**
1. `python-jose` is deprecated/unmaintained — migrate to `PyJWT`
2. `celery` is installed but unused on Render free plan (worker removed)
3. `geoalchemy2` is unused since PostGIS fallback uses raw SQL
4. `bcrypt` version pinned to `<4.1` due to passlib compatibility issue
5. No dev/test dependencies (pytest, httpx mocking, etc.)

### Frontend (`package.json`)

| Dependency | Version | Status | Notes |
|-----------|---------|--------|-------|
| next | 16.2.3 | ✅ Current | Cutting-edge |
| react | 19.2.4 | ✅ Current | — |
| zustand | 5.0.12 | ✅ Current | — |
| zod | 4.3.6 | ✅ Current | — |
| react-hook-form | 7.72.0 | ✅ Current | — |
| axios | 1.14.0 | ✅ Current | — |
| leaflet | 1.9.4 | ✅ Current | — |
| react-leaflet | 5.0.0 | ✅ Current | — |
| framer-motion | 12.38.0 | ✅ Current | Consider CSS alternatives |
| recharts | 3.8.1 | ✅ Current | Lazy-load admin only |
| lucide-react | 1.7.0 | ✅ Current | Optimized imports |
| date-fns | 4.1.0 | ✅ Current | — |
| @next/bundle-analyzer | 15.3.2 | ⚠️ | Version mismatch (Next.js is 16.x) |
| tailwindcss | 4 | ✅ Current | — |

**Issues:**
1. `@next/bundle-analyzer@15.3.2` is for Next.js 15, but app uses Next.js 16.2.3 — possible incompatibility.
2. No testing dependencies (Vitest, Playwright, React Testing Library)
3. No PWA/service worker setup
4. `eslint-config-next@16.2.3` — good, matches Next.js version

### Configuration Issues

| # | Issue | Details |
|---|-------|---------|
| CF-1 | No `.prettierrc` or `.editorconfig` | Formatting consistency not enforced |
| CF-2 | No pre-commit hooks | Linting/formatting not automated |
| CF-3 | No `.env.example` in backend root | `backend/.env.example` exists but root level is missing |
| CF-4 | Environment validation missing | No validation that critical env vars are set on startup |
| CF-5 | `cors_origins` as comma-separated string | Works but fragile; array would be better |
| CF-6 | No CSP in security headers | Backend sets security headers but no Content-Security-Policy |

---

## 8. DevOps & Deployment

### ✅ Current Setup
- **Backend:** Deployed on Render (web service + PostgreSQL + Redis, all free tier)
- **Frontend:** Render Blueprint configured, deployment pending
- **Containerization:** Docker + Docker Compose for local dev
- **Database migrations:** Alembic configured
- **Caching:** Redis server running
- **Rate limiting:** SlowAPI + per-endpoint limiters

### 🔴 Issues

| # | Issue | Priority | Details |
|---|-------|----------|---------|
| D-1 | No CI pipeline | **High** | No GitHub Actions or other CI. Every deploy is manual via Render. No test runner, no lint check, no build validation. |
| D-2 | No staging/ production environments | **High** | Single environment. Any deploy goes directly to production. Render supports preview environments from Blueprint but not configured. |
| D-3 | No health monitoring or uptime alerts | **Medium** | Only `/health` endpoint exists. No external monitoring (UptimeRobot, BetterStack, etc.) for when the backend goes down. |
| D-4 | No error tracking (Sentry, etc.) | **Medium** | Errors are logged to console. No centralized error collection. Production issues are invisible unless someone checks Render logs. |
| D-5 | No automated database backups | **Medium** | Render free tier has no automatic DB backup. Manual backup needed. |
| D-6 | No Docker image versioning | **Low** | Docker images are built fresh on each deploy. No tag strategy. |
| D-7 | Worker disabled on free tier | **Low** | `retry_job_assignment` Celery task never runs. Jobs that fail to auto-assign are never retried. |
| D-8 | No log aggregation | **Low** | No centralized logging. Each service logs independently. |
| D-9 | No uptime SLAs on free tier | **Low** | Render free tier services spin down after inactivity. API may be cold-started on first request. |

### DevOps Recommendations

**Immediate:**
1. Add GitHub Actions workflow for test + lint on PR
2. Set up external monitoring (UptimeRobot free tier)
3. Add Sentry or similar error tracking (free tier available)
4. Configure Render preview environments for PR-based staging

**Short-term:**
5. Automate DB backups via cron job to cloud storage
6. Set up log drain to a log management service
7. Add cache headers for static assets via Render CDN
8. Implement a keep-alive ping to prevent Render free-tier cold starts

**Medium-term:**
9. Set up staging environment (separate Render Blueprint branch)
10. Implement feature flags for gradual rollouts

---

## 9. Documentation

### ✅ What Exists
- `AGENTS.md` — AI agent instructions for Next.js
- `CLAUDE.md` — AI assistant config
- `README.md` — Basic project info
- `SEPARATION_PLAN.md` — Repo separation plan
- `.env.example` files — Environment variable templates

### 🔴 Gaps

| # | Gap | Priority | Details |
|---|-----|----------|---------|
| DOC-1 | No API documentation | **High** | No Swagger/OpenAPI endpoint documentation exposed (FastAPI auto-generates but may not be configured for production). No Postman collection or API docs. |
| DOC-2 | No architecture documentation | **Medium** | No system architecture diagram, data flow documentation, or ER diagram. New developers have to read all code to understand the system. |
| DOC-3 | No deployment guide | **Medium** | No step-by-step guide for deploying the app from scratch. The `.env.example` files exist but the full workflow (Docker → Render → DB migration) isn't documented. |
| DOC-4 | No contributing guide | **Low** | No `CONTRIBUTING.md` with coding standards, PR process, or development setup instructions. |
| DOC-5 | No changelog | **Low** | No `CHANGELOG.md` to track version history and changes. |
| DOC-6 | No mobile app build guide | **Low** | When Capacitor is implemented, there'll be no guide for building Android/iOS APKs. |
| DOC-7 | Inline doc gaps | **Medium** | Several backend routes lack docstrings. Complex logic in `matching.py` and `job_service.py` has minimal comments. |

---

## 10. Feature Gaps

Beyond code quality and testing, here are missing features expected in a production marketplace app:

| # | Missing Feature | User Impact | Effort |
|---|----------------|-------------|--------|
| F-1 | **In-app chat** between customer and mechanic | Customers and mechanics can't communicate during service. Current workaround: phone calls (not supported). | High |
| F-2 | **Push notifications** (mobile + web) | Users only see notifications when they're in the app. No out-of-app alerts for job updates. | Medium |
| F-3 | **SMS/Email notifications** | No email or SMS for critical events (job assigned, payment received). The `Notification` table exists but only serves in-app notifications. | Medium |
| F-4 | **Provider availability toggle** | Mechanics/garages can be active/inactive in DB (`available` field) but there's no UI for providers to toggle availability. | Low |
| F-5 | **Customer support ticket system** | Disputes exist but there's no direct customer support channel. Admin messaging is manual per-dispute. | Medium |
| F-6 | **Multi-language support** | App is English-only. India has 22+ official languages; adding i18n would expand the market significantly. | High |
| F-7 | **Invoice/Receipt generation** | `reportlab` is in requirements but no PDF invoice generation is wired up. | Low |
| F-8 | **Referral/reward system** | No referral codes, loyalty points, or first-service discount. | Low |
| F-9 | **Service scheduling** | Currently instant-only. No option to schedule a service for later. | Medium |
| F-10 | **Multiple vehicles per user** | `Vehicle` model exists but integration with service requests is minimal. | Low |
| F-11 | **Admin email verification** | No email verification flow. Users can sign up with any email. | Medium |
| F-12 | **Forgot password flow** | Backend has `/auth/forgot-password` and `/auth/reset-password` routes, but frontend may not have the UI wired up. | Medium |

---

## 11. Prioritized Action Plan

### Phase 0 — Critical Fixes (Do First)
| Priority | Item | Type | Effort |
|----------|------|------|--------|
| P0-C1 | SQL injection via string formatting in `matching.py` | Security | 1h |
| P0-C2 | JWT token in URL for WebSocket | Security | 2h |
| P0-C3 | Add httpOnly cookie for access token (replace in-memory) | Security | 4h |
| P0-C4 | Fix N+1 queries in admin endpoints | Performance | 2h |
| P0-C5 | Reduce fallback matching row limit (2000→200) | Performance | 30min |

### Phase 1 — Testing Infrastructure
| Priority | Item | Effort |
|----------|------|--------|
| P1-1 | Set up pytest + pytest-asyncio with test DB fixture | 4h |
| P1-2 | Write auth tests (login, signup, refresh, OAuth) | 4h |
| P1-3 | Write job lifecycle tests (state machine transitions) | 6h |
| P1-4 | Write payment tests (create order, verify, webhook, refund) | 6h |
| P1-5 | Set up Vitest + React Testing Library for frontend | 2h |
| P1-6 | Write critical path E2E test with Playwright | 8h |

### Phase 2 — Code Quality & Architecture
| Priority | Item | Effort |
|----------|------|--------|
| P2-1 | Split `admin.py` into `admin/` package | 4h |
| P2-2 | Split `job_service.py` (pricing, notifications extracted) | 3h |
| P2-3 | Split `payments.py` (razorpay, stripe separated) | 4h |
| P2-4 | Move hardcoded fee constants to DB/config | 3h |
| P2-5 | Migrate theme from JS to CSS custom properties | 6h |
| P2-6 | Replace `python-jose` with `PyJWT` | 2h |
| P2-7 | Refactor `api.js` interceptor to class-based | 2h |

### Phase 3 — UX Improvements
| Priority | Item | Effort |
|----------|------|--------|
| P3-1 | Build Toast notification component | 3h |
| P3-2 | Wire up ConfirmModal to destructive actions | 2h |
| P3-3 | Add WebSocket connection state indicator | 2h |
| P3-4 | Implement PWA manifest + service worker | 4h |
| P3-5 | Add offline detection + reconnection UX | 3h |

### Phase 4 — DevOps & Monitoring
| Priority | Item | Effort |
|----------|------|--------|
| P4-1 | Set up GitHub Actions CI (lint + test) | 3h |
| P4-2 | Add Sentry error tracking | 2h |
| P4-3 | Set up external uptime monitoring | 1h |
| P4-4 | Add automated DB backup strategy | 2h |
| P4-5 | Enable Render preview environments | 1h |

### Phase 5 — Features
| Priority | Item | Effort |
|----------|------|--------|
| P5-1 | Forgot password UI flow | 4h |
| P5-2 | Provider availability toggle UI | 3h |
| P5-3 | In-app notification toast (uses existing store) | 4h |
| P5-4 | Multi-language support (i18n) | 10h |
| P5-5 | Push notifications (Firebase Cloud Messaging) | 8h |

---

## Summary

```
Strengths:  10 | Issues: 45+ | Critical: 6 | High Priority: 12 | Medium: 18 | Low: 9+

Phase 0 (Critical):  5 items  ~ 10h
Phase 1 (Testing):   6 items  ~ 30h
Phase 2 (Code Qual): 7 items  ~ 24h
Phase 3 (UX):        5 items  ~ 14h
Phase 4 (DevOps):    5 items  ~ 9h
Phase 5 (Features):  5 items  ~ 29h
Total: ~33 items, ~116h
```

The biggest blockers to production readiness are **(1) zero test coverage**, **(2) the WebSocket token-in-URL vulnerability**, and **(3) the SQL injection-prone string formatting in matching.py**. Everything else is incremental polish.
