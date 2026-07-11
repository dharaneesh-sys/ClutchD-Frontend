# ClutchD — Complete Reference

## 1. Project Overview

ClutchD is an on-demand mechanic platform with a **Next.js frontend** (PWA + Capacitor Android) and **FastAPI backend** (Render). Users can find mechanics, browse a marketplace, track service requests, and manage vehicles.

### Repositories
- **Frontend**: `ClutchD-App` (`main` → GitHub → auto-deploy to Vercel)
- **Backend**: `ClutchD-Backend` (`main` → GitHub → auto-deploy to Render)

### Live URLs
| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://clutchd-app.vercel.app` |
| Backend API | `https://clutchd-api.onrender.com/api` |
| Health check | `https://clutchd-api.onrender.com/health` |
| WebSocket | `wss://clutchd-api.onrender.com/ws` |
| API Docs | `https://clutchd-api.onrender.com/docs` |

---

## 2. Tech Stack

### Frontend (`ClutchD-App`)
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.3 | React framework (App Router) |
| React | 19.2.4 | UI library |
| Tailwind CSS | v4 | Styling |
| Zustand | 5.0.12 | State management (persisted) |
| Axios | 1.14.0 | HTTP client |
| Firebase | 12.15.0 | Push notifications + Google Auth |
| Capacitor | 8.4.1 | Android native wrapper |
| Zod | 4.3.6 | Form validation |
| Lucide React | 1.7.0 | Icons |
| Recharts | 3.8.1 | Charts (admin) |
| Leaflet/React-Leaflet | 1.9.4 | Maps |
| date-fns | 4.1.0 | Date formatting |

### Backend (`ClutchD-Backend`)
| Technology | Purpose |
|------------|---------|
| FastAPI | Async REST framework |
| PostgreSQL + PostGIS | Database + geography queries |
| Redis | Token blacklist, OAuth state, pricing cache (optional — degrades gracefully) |
| Celery | Background tasks (optional — skipped by default) |
| JWT + bcrypt | Authentication |
| Google ID Token | OAuth login |
| SlowAPI | Rate limiting |
| Stripe/Razorpay | Payments (optional) |

---

## 3. Environment Variables

### Frontend (`.env.local`)

```env
# Backend API
NEXT_PUBLIC_API_URL=https://clutchd-api.onrender.com/api
NEXT_PUBLIC_WS_URL=wss://clutchd-api.onrender.com/ws

# Demo mode (false = real backend)
NEXT_PUBLIC_DEMO_MODE=false

# Google OAuth (for GSI sign-in button)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=710446274779-8kn2hpj6bl7014gv19a63lipnehdedun.apps.googleusercontent.com

# Firebase (push notifications + Auth)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDV_ndlTW-n7-v1pLx5I9jV60YEWdFcF9o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=clutchd-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=clutchd-app
NEXT_PUBLIC_FIREBASE_SENDER_ID=198695262834
NEXT_PUBLIC_FIREBASE_APP_ID=1:198695262834:web:fb86eb23adfedc2b3180eb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=clutchd-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-28TWP03QPG

# Access token TTL (default: 15 min)
# NEXT_PUBLIC_ACCESS_TTL_MINUTES=15
```

### Backend (`render.yaml` / `.env`)
| Variable | Source | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | Render PostgreSQL | Async DB connection |
| `SYNC_DATABASE_URL` | Render PostgreSQL | Sync DB connection (Celery) |
| `REDIS_URL` | Render Redis | Token blacklist, OAuth state, rate limits |
| `JWT_SECRET_KEY` | Auto-generated | Token signing |
| `CORS_ORIGINS` | Config | Allowed origins |
| `GOOGLE_OAUTH_CLIENT_ID` | Config | Google ID token verification |
| `STRIPE_SECRET_KEY` | Optional | Stripe payments |
| `RAZORPAY_KEY_ID/SECRET` | Optional | Razorpay payments |

---

## 4. Authentication Flow

### 4.1 Email/Password Login

```
User → LoginCard → api.post("/auth/login", {email, password, role})
                                          ↓
                                   Backend validates
                                          ↓
                              Returns {token, user}  ← JWT stored via tokenStore
```

- Token stored via `setAccessToken(token)` → localStorage
- Bearer token attached to every request by `api.js` interceptor (line 66-71)
- Proactive refresh at 80% of TTL (default 15 min → refresh at ~12 min)

### 4.2 Google Sign-In (GSI)

```
User clicks Google button → GSI callback (resp.credential)
                                          ↓
              1. GET /auth/oauth/state ← gets CSRF state
              2. POST /auth/oauth/google {credential, state, role}
                                          ↓
  ┌─ If succeeds ────────────────────────────┐
  │  Backend verifies token with Google       │
  │  Creates/finds user, returns JWT          │
  └───────────────────────────────────────────┘
  ┌─ If fails (Redis down, CSRF) ─────────────┐
  │  Fallback: signInWithCredential()          │
  │  Uses same credential with Firebase Auth  │
  │  (No popup — direct credential exchange)   │
  │  Creates local session with Firebase UID   │
  └───────────────────────────────────────────┘
```

### 4.3 Demo Mode

Demo mode is controlled by TWO flags (both must be `false` for production):

| File | Logic | Current Value |
|------|-------|---------------|
| `src/lib/demo/demoFlag.js` | `DEMO_MODE = (NEXT_PUBLIC_DEMO_MODE === 'true')` | `false` |
| `src/lib/constants.js` | `DEMO_MODE = (NEXT_PUBLIC_DEMO_MODE !== "false")` | `false` |

**When DEMO_MODE activates** (in `api.js` interceptor):
```javascript
if (DEMO_MODE || isRuntimeDemo || isDemoEmailLogin) {
    // route via apiInterceptor.js → serves mock data
}
```

- `isRuntimeDemo`: `window.__DEMO_USER__` or `sessionStorage.demo_token` (only set by DemoModeProvider toggle)
- `isDemoEmailLogin`: login email ends with `@demo.com`

**Demo accounts** are real backend accounts but get intercepted by the frontend:
| Email | Password | Role |
|-------|----------|------|
| `customer@demo.com` | `demo123456` | customer |
| `mechanic@demo.com` | `demo123456` | mechanic |
| `garage@demo.com` | `demo123456` | garage |

### 4.4 Known Auth Issues (Fixed)

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| All protected endpoints return 401 | `is_token_blacklisted()` returned `True` when Redis was down (fail-closed) | Changed to `return False` when Redis unavailable (fail-open) |
| Google OAuth always fails | CSRF state check required Redis; state was generated but never stored when Redis down | Skip CSRF check when Redis unavailable |
| Firebase fallback opened double popup | `signInWithPopup` called after GSI already authenticated | Use `signInWithCredential` with existing token instead |

---

## 5. Key Files — Frontend

### 5.1 State Stores (`src/store/`)

| Store | File | Key Methods |
|-------|------|-------------|
| Auth | `authStore.js` | `login()`, `loginWithGoogle()`, `signup()`, `logout()`, `restoreSession()`, `firebaseSignIn()` |
| Products | `productStore.js` | `fetchProducts()`, `searchProducts()`, `setFilter()`, `getProductById()` |
| Categories | `categoryStore.js` | `fetchCategories()` |
| Cart | `cartStore.js` | Cart management |
| Orders | `orderStore.js` | `placeOrder()`, `fetchOrders()` |
| Service | `serviceStore.js` | Service request management |
| Notifications | `notificationStore.js` | `fetchNotifications()`, FCM handling |
| Tracking | `trackingStore.js` | Real-time mechanic location |
| Chat | `chatStore.js` | In-app messaging |
| Theme | `themeStore.js` | Dark/light mode |
| Toast | `toastStore.js` | Toast notifications |
| Subscription | `subscriptionStore.js` | Subscription plans |
| Fleet | `fleetStore.js` | Fleet management |

### 5.2 API Layer

| File | Purpose |
|------|---------|
| `src/lib/api.js` | Axios instance with auth interceptor, 401 refresh, 429 retry, demo routing |
| `src/lib/tokenStore.js` | JWT token persistence (localStorage) |
| `src/lib/navigation.js` | Auth redirect helper |
| `src/lib/constants.js` | API_BASE_URL, DEMO_MODE, PRODUCT_CATEGORIES, BRANDS |
| `src/lib/utils.js` | `cn()`, `formatCurrency()`, `formatDate()`, `getInitials()`, `toCamelCase()` |
| `src/lib/validators.js` | Zod schemas for login, signup |

### 5.3 Firebase

| File | Purpose |
|------|---------|
| `src/lib/push/firebase.js` | `initFirebase()`, `getMessagingInstance()` — singleton Firebase app |
| `src/lib/auth/firebaseAuth.js` | `signInWithGoogle()` (popup), `signInWithGoogleCredential()` (token exchange) |
| `src/lib/push/pushNotificationHandler.js` | FCM foreground/background handlers |

### 5.4 Demo Mode

| File | Purpose |
|------|---------|
| `src/lib/demo/demoFlag.js` | DEMO_MODE boolean from env |
| `src/lib/demo/apiInterceptor.js` | Routes API calls to mock data (771 lines — all mock endpoints) |
| `src/lib/demo/demoModeProvider.js` | React context provider; toggles demo, manages tour |
| `src/lib/demo/mockData.js` | MOCK_USERS, MOCK_MECHANICS, MOCK_GARAGES, MOCK_VEHICLES, etc. |
| `src/lib/demo/demoMode.js` | Legacy demo mode |

### 5.5 Auth Components

| Component | File | Purpose |
|-----------|------|---------|
| LoginCard | `src/components/auth/LoginCard.js` | Email/password form + Google GSI button |
| SignUpCard | `src/components/auth/SignUpCard.js` | Registration form |
| AuthInit | `src/components/ui/AuthInit.js` | Restores session on mount |

---

## 6. Key Files — Backend

### 6.1 API Router (`backend/app/api/v1/router.py`)

All routes are mounted under `/api`:

| Router | Prefix | Key Endpoints |
|--------|--------|---------------|
| `auth.py` | `/auth` | `POST /login`, `/signup`, `/logout`, `/refresh`, `/oauth/google`, `/oauth/state` |
| `service.py` | `/service` | `POST /request`, `PATCH /{id}/status`, `POST /{id}/complete` |
| `providers.py` | `/providers` | `GET /nearby`, `PATCH /availability`, `GET /earnings` |
| `jobs.py` | `/jobs` | `POST /create`, `POST /assign`, `GET /status/{id}` |
| `marketplace.py` | `/marketplace` | `GET /products`, `/products/top-products`, `/products/{id}` |
| `payments.py` | `/payments` | `POST /create`, `POST /verify` |
| `vehicles.py` | `/vehicles` | CRUD for user vehicles |
| `notifications.py` | `/notifications` | CRUD + mark-read |
| `admin.py` | `/admin` | Users, mechanics, garages, analytics, disputes, KYC |
| `profile.py` | `/profile` | `GET /me`, `PATCH /update` |
| `uploads.py` | `/uploads` | `POST /` (multipart) |

### 6.2 Security (`backend/app/core/security.py`)

| Function | Purpose |
|----------|---------|
| `hash_password()` | bcrypt hashing |
| `verify_password()` | bcrypt verification |
| `create_token()` | JWT creation (access + refresh) |
| `decode_token()` | JWT decode + validate |
| `is_token_blacklisted()` | Redis check — **fail-opens** when Redis down |
| `get_current_user()` | FastAPI dependency — extracts user from Bearer token |

### 6.3 Seed Accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `admin@21907.com` | `clutchD123` | admin | ✅ Verified — returns admin JWT |
| `admin@1907.com` | `clutchD123` | admin | ✅ Verified — backup admin |
| `customer@demo.com` | `demo123456` | customer | ✅ Verified — returns customer JWT |
| `mechanic@demo.com` | `demo123456` | mechanic | Verified, near Coimbatore |
| `garage@demo.com` | `demo123456` | garage | Verified |

### 6.3a Database (Neon PostgreSQL)

**Production DB** (Render backend connects via `DATABASE_URL`):
```
SYNC_DATABASE_URL=postgresql://neondb_owner:npg_nmbkBDWG9Vi8@ep-polished-hat-aohax5qp.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_nmbkBDWG9Vi8@ep-polished-hat-aohax5qp.c-2.ap-southeast-1.aws.neon.tech/neondb?ssl=require
```

**Bootstrap script:** `backend/scripts/bootstrap_db.py`  
**Seed script:** `backend/app/seed_admin_data.py`

Run bootstrap (creates tables + seeds admin/customer/mechanic/garage):
```bash
cd /home/dinusus/ClutchD-Backend
python -m backend.scripts.bootstrap_db
```

### 6.4 Known Redis-related Issues (All Fixed)

| File | Issue | Fix |
|------|-------|-----|
| `core/security.py` (line 129) | `is_token_blacklisted()` returned `True` when `get_redis()` returned `None` | Changed to `return False` (fail-open) |
| `core/redis_client.py` | `get_redis()` raised `ConnectionError` instead of returning `None` | Fixed to catch exception and return `None` |
| `api/v1/auth.py` (line 192) | OAuth CSRF state check failed when Redis was down (state generated but never stored) | Skip CSRF check when `get_redis()` returns `None` |

---

## 7. Dashboard Routes

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard/customer` | `marketplace/dashboard/customer/` | Customer dashboard with map, service history |
| `/dashboard/mechanic` | `marketplace/dashboard/mechanic/` | Mechanic job queue, earnings |
| `/dashboard/garage` | `marketplace/dashboard/garage/` | Garage management, team |
| `/dashboard/admin` | `marketplace/dashboard/admin/` | Platform-wide analytics, user management |
| `/marketplace` | `app/marketplace/` | Product listing, parts store |
| `/marketplace/product/[id]` | `app/marketplace/product/[id]/` | Product detail with fitment check |
| `/marketplace/cart` | `app/marketplace/cart/` | Shopping cart |
| `/marketplace/checkout` | `app/marketplace/checkout/` | Checkout flow |
| `/marketplace/search` | `app/marketplace/search/` | Product search |
| `/marketplace/profile/*` | `app/marketplace/profile/` | Account, orders, favorites, payments, settings, etc. |
| `/auth` | `app/auth/` | Login + signup |

---

## 8. Android Build (Capacitor)

### 8.1 Config (`capacitor.config.js`)
```js
appId: 'com.clutchd.app'
webDir: 'out'  // Next.js export output
androidScheme: 'https'
```

### 8.2 Build Steps
```bash
# Full APK build
npm run build                    # Next.js build + export → out/
npx cap sync android             # Sync web assets + plugins
cd android && ./gradlew assembleDebug  # Build APK
```

### 8.3 Quick Script
```bash
npm run build:android            # runs: build → cap copy → cap sync
```

### 8.4 APK Output
```
ClutchD-App/ClutchD-v1.1.apk  (~9.8 MB)
```

### 8.5 Installed Capacitor Plugins
| Plugin | Version | Purpose |
|--------|---------|---------|
| `@capacitor/android` | 8.4.1 | Android platform |
| `@capacitor/app` | 8.1.0 | App lifecycle |
| `@capacitor/push-notifications` | 8.1.1 | FCM push notifications |
| `@capacitor-firebase/authentication` | 8.3.0 | Native Firebase Auth (Google) |

### 8.6 Android Prerequisites
- Java 21+
- Node.js 22+ (via nvm: `nvm use 22`)
- Android SDK at `/opt/android-sdk` (API 35, build-tools 34/35)
- `android/local.properties` → `sdk.dir=/opt/android-sdk`

---

## 9. Marketplace / Parts Store

### 9.1 Product Data Flow
```
productStore.fetchProducts()
  → api.get("/products")           ← backend GET /api/products
  → toCamelCase(response.data.products)
  → stored in Zustand (products[])
```

### 9.2 Categories
```
categoryStore.fetchCategories()
  → api.get("/categories")         ← backend GET /api/categories
```

### 9.3 Key Marketplace Components
| Component | File | Purpose |
|-----------|------|---------|
| ProductCard | `components/marketplace/ProductCard.js` | Product grid tile |
| ProductImage | `components/marketplace/ProductImage.js` | Optimized image with fallback |
| CategoryIcon | `components/marketplace/CategoryIcon.js` | Category icon mapping |
| VendorComparisonTable | `components/marketplace/VendorComparisonTable.js` | Multi-vendor pricing |
| VehicleSelector | `components/marketplace/VehicleSelector.js` | Fitment vehicle picker |
| ProductReviews | `components/marketplace/ProductReviews.js` | Review display + form |

### 9.4 Products Backend Endpoints
| Endpoint | Response |
|----------|----------|
| `GET /api/products` | `{ products: [...] }` |
| `GET /api/products/top-products` | `{ products: [...] }` (top-rated) |
| `GET /api/products/{id}` | `{ id, name, brand, price, ... }` |
| `GET /api/marketplace/products/{id}/reviews` | `{ reviews: [...], averageRating }` |
| `POST /api/marketplace/products/{id}/reviews` | Add a review |

---

## 10. Known Gotchas & Patterns

### 10.1 `.toFixed()` Safety Pattern
Always wrap API response values with `Number()` to avoid `y.toFixed is not a function`:
```javascript
// ✅ SAFE
{Number(value ?? 0).toFixed(2)}
{Number(product.rating ?? 0).toFixed(1)}

// ❌ UNSAFE
{value.toFixed(2)}
{product.rating.toFixed(1)}
```

This was hardened across 14 files (ServiceHistory, PaymentModal, ServiceStatusTracker, VendorComparisonTable, ETAIndicator, VehicleList, JobMonitor, MechanicsManager, GaragesManager, GarageJobQueue, ServiceRequestPanel, etc.)

### 10.2 Firebase Auth — No Double Popup
When Google sign-in fails at the backend level, use `signInWithCredential(token)` instead of `signInWithPopup()`:
```javascript
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
const credential = GoogleAuthProvider.credential(googleIdToken);
const result = await signInWithCredential(auth, credential);
```

### 10.3 Demo Mode — User ID Check
- Firebase-signed-in users: `id` = Firebase UID (plain, no prefix)
- Demo users: `id` starts with `demo-` (`demo-cust-1`, `demo-mech-1`, etc.)
- The `isRuntimeDemo` check in `api.js` inspects `window.__DEMO_USER__` or `sessionStorage.demo_token` — neither is set by Firebase auth

### 10.4 Token Storage
```javascript
// tokenStore.js — access
getAccessToken()    // → localStorage["clutchd_access_token"]
setAccessToken(t)   // → localStorage["clutchd_access_token"] = t
clearAccessToken()  // → removes key
```

### 10.5 Response Interceptors
- **401**: Tries `/auth/refresh` → success = retry, failure = `navigateToAuth()`
- **Public endpoints** (`/products`, `/categories`, `/health`): 401 passes through silently
- **429**: Retries up to 3x with exponential backoff, then shows toast
- **Demo routing**: Checks `DEMO_MODE || isRuntimeDemo || isDemoEmailLogin` before real API call

### 10.6 WebSocket
```
wss://clutchd-api.onrender.com/ws?token=<JWT>
```
Used for real-time mechanic location tracking. Connection established on login, disconnected on logout.

---

## 11. Build Verification

```bash
# Frontend build
npm run build              # → out/ directory (static export)

# Android APK
npm run build:android      # build + cap sync
# OR manually:
npx cap sync android && cd android && ./gradlew assembleDebug

# Backend (local dev)
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Backend (Docker)
docker compose up --build
```

### 11.1 Testing Backend Endpoints
```bash
# Health
curl https://clutchd-api.onrender.com/health

# Login
curl -X POST https://clutchd-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@demo.com","password":"demo123456"}'

# Authenticated request
curl -H "Authorization: Bearer $TOKEN" \
  https://clutchd-api.onrender.com/api/profile/me
```

---

## 12. Quick Reference — Common Errors

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `401 Unauthorized` on all endpoints | Redis down + `is_token_blacklisted` fail-closed | Deployed fix (fail-open) — verify `security.py` line 131 returns `False` |
| `y.toFixed is not a function` | Missing `Number()` wrapper on API response | Use `Number(value ?? 0).toFixed()` |
| Firebase popup opens twice | `signInWithPopup` called after GSI already authenticated | Use `signInWithCredential(token)` instead |
| Demo data on real accounts | Component falls back to MOCK_* data when API fails | Remove mock fallbacks; only inject for `demo-` prefixed users |
| `Capacitor CLI requires Node >=22` | Using Node 20 from system PATH | Run `nvm use 22` before capacitor commands |
| `OAuth state not found` | Redis down when CSRF state was generated | Fixed — backend now skips CSRF check when Redis unavailable |
