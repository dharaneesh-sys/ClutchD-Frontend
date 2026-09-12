# ClutchD — Complete Reference

> **Updated:** 2026-07-24
> **Location:** `/home/dinusus/ClutchD/`

## 1. Project Overview

ClutchD is an on-demand mechanic platform with a **Next.js frontend** (PWA + Capacitor Android wrapper) and a **FastAPI backend** (Docker-deployed on a server behind Tailscale Funnel). Users can find mechanics, browse a marketplace for auto parts, track service requests, manage vehicles, and run fleet/garage operations.

### Repositories (local)
- **Frontend:** `~/ClutchD/ClutchD-App/` — Next.js 16 + Capacitor Android
- **Backend:** `~/ClutchD/ClutchD-Backend/` — FastAPI + PostgreSQL + Redis
- **Duplicate backend:** `~/ClutchD-Backend/` — identical copy (keep `ClutchD/ClutchD-Backend` as source of truth)

### Live URLs (Self-hosted via Tailscale Funnel)
| Service | URL |
|---------|-----|
| Frontend | `https://clutchd.tail14cfb9.ts.net` |
| Backend API | `https://clutchd.tail14cfb9.ts.net:8000/api` |
| Health check | `https://clutchd.tail14cfb9.ts.net:8000/health` |
| API Docs | `https://clutchd.tail14cfb9.ts.net:8000/docs` (Swagger) |

> **Previously used (deprecated):** Vercel (`clutchd-app.vercel.app`) and Render (`clutchd-api.onrender.com`) — retired in favor of self-hosted deployment.

---

## 2. Tech Stack

### Frontend (`ClutchD-App`)
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.2.3 | React framework (App Router, static export for Android) |
| React | 19.2.4 | UI library |
| Tailwind CSS | v4 | Utility-first styling (with `@theme` inline block) |
| Zustand | 5.0.12 | State management with `persist` middleware |
| Axios | 1.14.0 | HTTP client (interceptors for auth, retry, CORS) |
| Firebase | 12.15.0 | Push notifications + Google Auth fallback |
| Capacitor | 8.4.1 | Android native wrapper (PWA → APK) |
| Zod | 4.3.6 | Form/schema validation |
| Lucide React | 1.7.0 | Icon library |
| React Hook Form | 7.72.0 | Form state management |
| Recharts | 3.8.1 | Charts (admin analytics) |
| Leaflet / React-Leaflet | 1.9.4 | Maps (mechanic tracking) |
| Visx | 4.x | Fine-grained chart components (admin) |
| date-fns | 4.1.0 | Date formatting/parsing |
| Sentry | 10.x | Error monitoring |
| Motion | 12.x | Animation library (Framer Motion successor) |
| NumberFlow | 0.6.1 | Animated number counters |

### Backend (`ClutchD-Backend`)
| Technology | Purpose |
|------------|---------|
| FastAPI | Async REST framework (Pydantic v2) |
| PostgreSQL + PostGIS | Relational DB + spatial queries |
| Redis 7 | Token blacklist, OAuth state, rate limiting, Celery broker |
| Celery | Background tasks (disabled by default — opt-in) |
| JWT (python-jose) + bcrypt | Authentication |
| Google ID Token | OAuth login verification |
| SlowAPI | Rate limiting (deprecated — now uses Redis-backed limiter) |
| Stripe / Razorpay | Payments (auto-detected by available keys) |
| Alembic | Database migrations |
| SQLAlchemy (async) | ORM with asyncpg driver |
| GeoAlchemy2 | Spatial/GIS field types |

---

## 3. Project Structure

### Frontend Layout
```
ClutchD-App/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Login + Signup (LoginCard, SignUpCard)
│   │   ├── dashboard/          # Role-specific dashboards
│   │   │   ├── customer/       # Customer dashboard (map, tabs, SOS)
│   │   │   ├── mechanic/       # Mechanic job queue, earnings
│   │   │   ├── garage/         # Garage management, team
│   │   │   ├── fleet/          # Fleet management
│   │   │   └── admin/          # Platform analytics, user mgmt, KYC
│   │   ├── marketplace/        # Parts store product listing
│   │   │   ├── cart/           # Shopping cart
│   │   │   ├── categories/     # Category browsing + [id]
│   │   │   ├── checkout/       # Stripe/Razorpay checkout
│   │   │   ├── orders/         # Order history
│   │   │   ├── product/[id]/   # Product detail + fitment check
│   │   │   ├── search/         # Product search
│   │   │   └── profile/        # User profile (13 sub-pages)
│   │   │       ├── settings/   # ⭐ Logout button lives here
│   │   │       ├── account/    # Account details
│   │   │       ├── orders/     # Order history
│   │   │       ├── payments/   # Payment methods
│   │   │       ├── edit/       # Edit profile
│   │   │       ├── favorites/  # Saved products
│   │   │       ├── subscription/ # Plans
│   │   │       ├── refer/      # Referral program
│   │   │       ├── safety/     # Safety settings
│   │   │       ├── help/       # Help/FAQ
│   │   │       ├── care/       # Customer care
│   │   │       ├── clutchd-card/ # Virtual card
│   │   │       ├── quick-actions/ # Quick actions
│   │   │       ├── services/   # Service history
│   │   │       └── warranty/   # Warranty info
│   │   ├── layout.js           # Root layout (ThemeProvider + AuthInit)
│   │   └── globals.css         # CSS variables (1054 lines!)
│   ├── components/
│   │   ├── ui/                 # 38 reusable UI components
│   │   │   ├── DashboardShell.js  # ⭐ Main layout wrapper
│   │   │   ├── BottomNav.js       # ⭐ Mobile bottom navigation
│   │   │   ├── ThemeProvider.js   # Dark/light mode sync
│   │   │   ├── ThemeToggle.js     # Theme switch button
│   │   │   ├── AuthInit.js        # Session restoration
│   │   │   ├── Logo.js, Button.js, Input.js, Modal.js, etc.
│   │   │   ├── Toast.js / ToastProvider.js
│   │   │   ├── ChatBubble.js / ChatPanel.js / ChatWidget.js
│   │   │   ├── ConnectionIndicator.js
│   │   │   ├── NotificationBell.js
│   │   │   ├── SOSButton.js, SplashScreen.js
│   │   │   ├── MapView.js (likely)
│   │   │   └── ...
│   │   ├── marketplace/        # 9 marketplace components
│   │   │   ├── ProductCard.js, ProductImage.js
│   │   │   ├── CategoryCard.js, CategoryIcon.js
│   │   │   ├── ProductReviews.js, OrderTimeline.js
│   │   │   ├── SearchFilters.js, VehicleSelector.js
│   │   │   └── VendorComparisonTable.js
│   │   ├── auth/               # LoginCard, SignUpCard
│   │   ├── admin/              # Admin panel components
│   │   ├── fleet/              # Fleet management components
│   │   ├── service/            # Service request components
│   │   └── ...
│   ├── lib/                    # Core application logic
│   │   ├── api.js              # ⭐ Axios instance (interceptors, retry)
│   │   ├── tokenStore.js       # localStorage JWT management
│   │   ├── constants.js        # API_BASE_URL, DEMO_MODE, categories
│   │   ├── utils.js            # cn(), formatCurrency(), formatDate()
│   │   ├── validators.js       # Zod schemas
│   │   ├── navigation.js       # Auth redirect helper
│   │   ├── socket.js           # WebSocket connection
│   │   ├── auth/               # Firebase Auth helpers
│   │   ├── push/               # Push notification handlers
│   │   ├── demo/               # Demo mode (mock data, interceptor)
│   │   └── offline/            # Offline cache logic
│   ├── store/                  # 14 Zustand state stores
│   │   ├── authStore.js        # Auth, session, Google login
│   │   ├── themeStore.js       # Dark/light mode
│   │   ├── productStore.js     # Products + search
│   │   ├── categoryStore.js    # Categories
│   │   ├── cartStore.js        # Cart management
│   │   ├── orderStore.js       # Orders
│   │   ├── serviceStore.js     # Service requests
│   │   ├── notificationStore.js # Notifications + FCM
│   │   ├── trackingStore.js    # Mechanic location
│   │   ├── chatStore.js        # In-app messaging
│   │   ├── subscriptionStore.js # Plans
│   │   ├── fleetStore.js       # Fleet management
│   │   └── toastStore.js       # Toast notifications
│   └── hooks/                  # Custom React hooks
├── android/                    # Capacitor Android project
├── e2e/                        # Playwright end-to-end tests
├── __tests__/                  # Unit tests (Vitest)
├── capacitor.config.js         # Capacitor config
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies / scripts
└── AGENTS.md                   # AI agent instructions
```

### Backend Layout
```
ClutchD-Backend/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, static, WebSockets
│   │   ├── api/v1/              # Route handlers
│   │   │   ├── auth.py          # login, signup, logout, refresh, OAuth
│   │   │   ├── service.py       # Service request CRUD
│   │   │   ├── providers.py     # Nearby mechanics, availability
│   │   │   ├── jobs.py          # Job assignment, status
│   │   │   ├── marketplace.py   # Products, categories, reviews
│   │   │   ├── payments.py      # Stripe/Razorpay
│   │   │   ├── vehicles.py      # User vehicle CRUD
│   │   │   ├── notifications.py # Push notification endpoints
│   │   │   ├── profile.py       # GET/PATCH profile
│   │   │   ├── admin.py         # Users, KYC, disputes, analytics
│   │   │   └── uploads.py       # File uploads (multipart)
│   │   ├── core/                # Configuration & security
│   │   │   ├── config.py        # Settings, env loading
│   │   │   ├── security.py      # JWT create/decode, hash/verify, blacklist
│   │   │   ├── limiter.py       # Rate limiting (Redis-backed)
│   │   │   ├── redis_client.py  # Redis connection (fail-open on error)
│   │   │   └── dependencies.py  # FastAPI dependency injection
│   │   ├── db/                  # Database engine + session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic v2 request/response
│   │   ├── services/            # Business logic (auth, jobs, matching)
│   │   ├── tasks/               # Celery worker + tasks
│   │   └── ws/                  # WebSocket manager + handlers
│   ├── scripts/
│   │   ├── bootstrap_db.py      # Create tables + seed demo data
│   │   ├── makemigration.sh     # Auto-generate Alembic migration
│   │   └── migrate.sh           # Apply pending migrations
│   ├── migrations/              # Alembic (env.py, versions/)
│   ├── Dockerfile / Dockerfile.worker
│   └── requirements.txt
├── docker-compose.yml           # db + redis + api + worker
├── render.yaml                  # (deprecated — Render deployment)
└── Procfile                     # (deprecated)
```

---

## 4. Architecture & Data Flow

### 4.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                           │
├─────────────────────────────────────────────────────────┤
│ User → LoginCard                                         │
│   → api.post("/auth/login", {email, password, role})     │
│   → Backend validates email+password+bcrpyt              │
│   → Returns {token, user, refresh_token (httpOnly)}     │
│   → tokenStore.setAccessToken(token) → localStorage     │
│   → connectWebSocket(token)                             │
│   → scheduleProactiveRefresh() (80% of TTL)             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  GOOGLE OAUTH FLOW                      │
├─────────────────────────────────────────────────────────┤
│ User clicks Google GSI button                           │
│   → GSI callback receives credential token              │
│   → GET /auth/oauth/state ← get CSRF state from backend │
│   → POST /auth/oauth/google {credential, state, role}   │
│     ├─ On success: JWT returned, session established    │
│     └─ On failure (backend down, Redis down):           │
│        → signInWithCredential(credential) via Firebase  │
│        → local session with firebase-{uid} user ID     │
│        → "firebase-local-jwt-token" stored as token     │
└─────────────────────────────────────────────────────────┘
```

**Token lifecycle:**
- **Access token TTL:** 15 min (configurable via `NEXT_PUBLIC_ACCESS_TTL_MINUTES`)
- **Proactive refresh:** At 80% of TTL (~12 min) via `scheduleProactiveRefresh()` timer
- **401 interceptor:** If a request returns 401, the Axios interceptor tries `/auth/refresh` once. If that fails too → `navigateToAuth()`
- **Public endpoints** (`/products`, `/categories`, `/health`): 401 passes through silently (no redirect)
- **Refresh cookie:** httpOnly cookie set server-side on login, survives page reloads

### 4.2 Service Request Lifecycle

```
1. Customer selects service type + location
2. POST /service/request → creates job (status: "searching")
3. Backend finds nearby mechanics via PostGIS query
4. Mechanic receives notification → accepts/rejects
5. POST /jobs/assign → status: "accepted"
6. Mechanic en route → status: "en_route"
7. Mechanic arrives → status: "in_progress"
8. Mechanic completes → status: "completed"
9. Customer can rate/review
10. Payment processed (if applicable)
```

**Real-time tracking via WebSocket:**
```
wss://clutchd.tail14cfb9.ts.net:8000/ws?token=<JWT>
  └─ Mechanic location updates (latitude, longitude)
  └─ Job status changes
  └─ Chat messages
  
ws://host:8000/ws/tracking/{job_id}?token=...
  └─ Job-scoped location tracking channel
```

Connection established on login via `connectWebSocket(token)`, disconnected on logout via `disconnectWebSocket()`.

### 4.3 Marketplace Flow

```
productStore.fetchProducts()
  → api.get("/products")
  → toCamelCase(response.data.products)
  → stored in Zustand (products[])

categoryStore.fetchCategories()
  → api.get("/categories")
  → toCamelCase(response.data.categories)

Cart flow:
  → addItem(product, quantity) → cartStore
  → Checkout → POST /payments/create
  → POST /payments/verify
  → orderStore.fetchOrders()
```

---

## 5. UI Component Architecture

### 5.1 DashboardShell (`src/components/ui/DashboardShell.js`)

The primary layout wrapper for all dashboard views. Props:

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `children` | ReactNode | — | Main content |
| `title` | string | — | Dashboard title (desktop) |
| `subtitle` | string | — | Mode label (Customer/Provider/Business) |
| `user` | object | — | Current user for display |
| `mode` | string | `"customer"` | One of: customer, mechanic, garage |
| `sidebar` | array | — | Sidebar nav items `[{icon, label, onClick}]` |
| `onReferral` | fn | — | Referral link handler |
| `hideMobileMenu` | bool | `false` | Hide mobile hamburger menu |
| `hasBottomNav` | bool | `false` | Add bottom padding for BottomNav |
| `desktopSidebar` | bool | `false` | Enable desktop sidebar mode |

**Features:**
- Header with Logo, user info, mode indicator, NotificationBell, ConnectionIndicator
- Mode-specific avatar styling: yellow (customer), amber (garage), warning (mechanic)
- Mobile sidebar with nav items + Profile link + Referral link
- **Logout button removed** from header and mobile sidebar (only in profile settings)

### 5.2 BottomNav (`src/components/ui/BottomNav.js`)

Mobile-only bottom navigation (hidden on `lg:` breakpoint). Items:

| Label | Icon | Path | Purpose |
|-------|------|------|---------|
| Home | Home | `/marketplace` | Marketplace home |
| Categories | Grid3X3 | `/marketplace/categories` | Browse parts categories |
| Search | Search | `/marketplace/search` | Search products |
| Cart | ShoppingCart | `/marketplace/cart` | Cart with badge counter |
| Profile | User | `/marketplace/profile` | User profile |
| Menu | Settings | — | Popover with Theme toggle |

**Features:**
- Active state highlighting via `text-primary` / `text-text-muted` CSS variables
- Cart badge with `itemCount > 99 ? "99+"` truncation
- Settings popover with theme toggle (Sun/Moon icons)
- Outside click + Escape key to close popover
- `animate-scale-in` animation on popover
- Safe area padding: `pb-[env(safe-area-inset-bottom)]`

### 5.3 Dashboard Tab Bars

**Customer dashboard** — inline bottom tab bar:
| Tab | Icon | Action |
|-----|------|--------|
| Service | Wrench | `setActiveTab("request")` |
| Schedule | Calendar | `setActiveTab("schedule")` |
| Vehicles | Car | `setActiveTab("vehicles")` |
| Parts Store | ShoppingBag | `router.push("/marketplace")` |
| History | History | `setActiveTab("history")` |

**Mechanic dashboard** — desktop-only tab nav + sidebar:
| Tab | Icon | Action |
|-----|------|--------|
| Jobs | Briefcase | `setActiveTab("jobs")` |
| Navigation | MapPin | `setActiveTab("navigation")` |
| Earnings | DollarSign | `setActiveTab("earnings")` |
| Parts Store | ShoppingBag | `router.push("/marketplace")` |

**Garage dashboard** — mobile sidebar + desktop sections:
| Tab | Icon | Action |
|-----|------|--------|
| Dashboard | LayoutDashboard | Dashboard overview |
| Garage Profile | Users | Business profile |
| Analytics | BarChart3 | Analytics |
| Parts Store | ShoppingBag | `router.push("/marketplace")` |

---

## 6. Theme System (Dark/Light Mode)

### 6.1 Architecture

```
layout.js (inline script)
  → reads localStorage.clutchd_theme or prefers-color-scheme
  → sets data-theme attr + .dark class on <html> immediately (before paint)
  
↓

ThemeProvider.js (client component)
  → syncs zustand theme → DOM via useEffect
  → listens for system OS theme changes (when no explicit override)
  
↓

globals.css
  :root → light mode CSS variables
  [data-theme="dark"] → dark mode CSS variables
  @theme inline → registers all variables as Tailwind utilities
```

### 6.2 CSS Variable Strategy

Tailwind CSS v4 `@theme inline` block maps CSS custom properties to Tailwind utility classes:

```css
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-text-primary: var(--color-text-primary);
  --color-text-muted: var(--color-text-muted);
  --color-border-subtle: var(--color-border-subtle);
  --color-bg-card: var(--color-bg-card);
  --color-icon-highlight: var(--color-icon-highlight);
  /* ... 50+ variable mappings */
}
```

**Light mode key variables** (`:root`):
| Variable | Value | Tailwind class |
|----------|-------|---------------|
| `--primary` | `#b8860b` | `bg-primary` / `text-primary` |
| `--color-text-primary` | `#1c1917` (near-black) | `text-text-primary` |
| `--color-text-muted` | `rgba(80,80,80,0.75)` | `text-text-muted` |
| `--color-icon-highlight` | `#d4a011` (gold) | `text-icon-highlight` |
| `--surface` | `#fffbff` (warm white) | `bg-surface` |
| `--background` | `#faf8f3` | `bg-background` |

**Dark mode key variables** (`[data-theme="dark"]`):
| Variable | Value | Tailwind class |
|----------|-------|---------------|
| `--primary` | `#d4a011` (gold) | `bg-primary` |
| `--color-text-primary` | `#34d399` (emerald) | `text-text-primary` |
| `--color-text-muted` | `rgba(255,255,255,0.5)` | `text-text-muted` |
| `--color-icon-highlight` | `#10b981` (green) | `text-icon-highlight` |
| `--surface` | `#1c1c1f` (dark gray) | `bg-surface` |
| `--background` | `#09090b` (near-black) | `bg-background` |

### 6.3 Theme Store

```javascript
// src/store/themeStore.js
theme: getInitialTheme()  // localStorage → legacy migration → system preference → "light"
toggleTheme()             // dark ↔ light, persists to localStorage
setTheme(t)               // explicit set
followSystemTheme()       // clear localStorage override, follow OS
```

### 6.4 ThemeProvider Sync

The `ThemeProvider` component:
1. On mount, compares zustand `storeTheme` with `<html>` `data-theme` attribute
2. If they differ, sets `data-theme` + toggles `.dark` class
3. Listens for OS `prefers-color-scheme` changes (when no explicit localStorage override)
4. Uses `useSyncExternalStore` for snapshot-only DOM reading (no subscription)

### 6.5 Font System
- **Headings:** `Instrument Serif` (serif, weights 400 italic)
- **Body:** `Onest` (sans-serif, weights 300-800)
- Loaded via Google Fonts import in `globals.css`

---

## 7. State Management

All 14 Zustand stores with `persist` middleware:

| Store | File | Persisted Keys | Purpose |
|-------|------|----------------|---------|
| authStore | `store/authStore.js` | user, isAuthenticated, _hydrated | Login, logout, session restore, Google auth, Firebase fallback, Capacitor native auth |
| productStore | `store/productStore.js` | — | Fetch/search/filter products |
| categoryStore | `store/categoryStore.js` | — | Fetch product categories |
| cartStore | `store/cartStore.js` | items | Add/remove/clear cart items |
| orderStore | `store/orderStore.js` | — | Place orders, fetch history |
| serviceStore | `store/serviceStore.js` | — | Create/track service requests |
| notificationStore | `store/notificationStore.js` | — | FCM token, fetch/mark-read |
| trackingStore | `store/trackingStore.js` | — | Real-time mechanic location |
| chatStore | `store/chatStore.js` | — | In-app messaging |
| themeStore | `store/themeStore.js` | theme | Dark/light toggle, system follow |
| toastStore | `store/toastStore.js` | — | Toast notifications |
| subscriptionStore | `store/subscriptionStore.js` | — | Plan data |
| fleetStore | `store/fleetStore.js` | — | Fleet management |
| **New:** vehicleStore | — | — | User vehicles |

**Persistence details:**
- `authStore` uses Zustand `persist` middleware with `partialize` filter (only stores user id, role, auth status — not full user object)
- Custom `merge` function handles post-hydration state reconstruction
- `onRehydrateStorage` intentionally omits `setState` to prevent React 19 `flushSync` cascade bug

---

## 8. API Layer

### 8.1 Axios Instance (`src/lib/api.js`)

```javascript
const api = axios.create({
  baseURL: API_BASE_URL,    // from constants.js
  timeout: 30000,
  withCredentials: true,
  maxContentLength: 10MB,
  maxBodyLength: 10MB,
});
```

**Request interceptor:**
- Attaches `Bearer <token>` from `tokenStore.getAccessToken()`
- Adds `X-Requested-With: XMLHttpRequest` header for mutating methods (POST/PUT/PATCH/DELETE)

**Response interceptor (401 handling):**
```javascript
1. Check if it's a public endpoint (/products, /categories, /health) → pass through silently
2. Check if it's an auth page or auth request → pass through
3. Try /auth/refresh once → on success, retry original request with new token
4. On refresh failure → navigateToAuth()
```
- Queue management: if multiple requests fail 401 concurrently, only one refresh is attempted
- Pending requests queue waits for the refresh to complete, then retries with the new token

### 8.2 Token Store (`src/lib/tokenStore.js`)
```javascript
getAccessToken()    // → localStorage["clutchd_access_token"]
setAccessToken(t)   // → localStorage["clutchd_access_token"] = t
clearAccessToken()  // → removes key
```

### 8.3 API Endpoints (Backend)

All mounted under `/api`:

| Router | Prefix | Key Endpoints |
|--------|--------|---------------|
| `auth.py` | `/auth` | POST login, signup, logout, refresh, oauth/google, oauth/state |
| `service.py` | `/service` | POST request, PATCH status, POST complete/cancel |
| `providers.py` | `/providers` | GET nearby, PATCH availability, GET earnings |
| `jobs.py` | `/jobs` | POST create/assign, GET status/{id} |
| `marketplace.py` | `/marketplace` | GET products, products/top-products, products/{id} |
| `payments.py` | `/payments` | POST create, verify |
| `vehicles.py` | `/vehicles` | CRUD user vehicles |
| `notifications.py` | `/notifications` | CRUD + mark-read |
| `reviews.py` | — | POST reviews, GET ratings |
| `garage.py` | `/garage` | POST add-mechanic, GET mechanics |
| `admin.py` | `/admin` | Users, mechanics, garages, analytics, disputes, KYC |
| `profile.py` | `/profile` | GET /me, PATCH /update |
| `uploads.py` | `/uploads` | POST / (multipart) |

---

## 9. Database (PostgreSQL + PostGIS)

### 9.1 Production Database
```
Host: ep-polished-hat-aohax5qp.c-2.ap-southeast-1.aws.neon.tech (Neon)
Database: neondb
User: neondb_owner
```

### 9.2 Connection URLs
```env
# Async (SQLAlchemy)
DATABASE_URL=postgresql+asyncpg://neondb_owner:password@ep-polished-hat-aohax5qp.c-2.ap-southeast-1.aws.neon.tech/neondb?ssl=require

# Sync (Celery)
SYNC_DATABASE_URL=postgresql://neondb_owner:password@ep-polished-hat-aohax5qp.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

### 9.3 Local Docker Database (for development)
```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    ports: ["5434:5432"]
    env: { POSTGRES_USER: clutchd, POSTGRES_PASSWORD: clutchd, POSTGRES_DB: clutchd }
  redis:
    image: redis:7-alpine
    ports: ["6380:6379"]
```

### 9.4 Migrations
Managed via **Alembic** in `backend/migrations/`:
```bash
cd backend
bash scripts/makemigration.sh "description"  # Generate migration
bash scripts/migrate.sh                       # Apply pending
PYTHONPATH=. alembic downgrade -1             # Rollback one step
```

Key files:
- `migrations/env.py` — auto-reads `DATABASE_URL`
- `migrations/versions/` — generated migration files
- `scripts/bootstrap_db.py` — auto-stamps Alembic head on fresh DB creation

---

## 10. Deployment

### 10.1 Architecture (Current)
```
Internet → Tailscale Funnel → Server (192.168.1.35)
  ├─ :443  → nginx-proxy-manager → Tailscale Funnel
  ├─ :8000 → docker:api (FastAPI + healthcheck)
  ├─ :5434 → docker:db (PostgreSQL + PostGIS)
  └─ :6380 → docker:redis (Redis 7)
```

**Deploy details:**
- Server runs Docker Compose with 3 services (db, redis, api)
- Exposed via Tailscale Funnel at `https://clutchd.tail14cfb9.ts.net`
- Deploy via: `sshpass -p '1907' scp files && sshpass -p '1907' ssh commands`

**Docker Compose changes for production:**
- PostGIS on port 5434 (not default 5432)
- Redis on port 6380 (not default 6379)
- API on port 8001 (mapped to container 8000)
- Healthcheck with 30s interval, 3 retries
- CORS_ORIGINS set for Tailscale Funnel domain + Capacitor `https://localhost`

### 10.2 Frontend Build & Deploy

```bash
# Development
npm run dev                    # Next.js dev server on :3000

# Production build
npm run build                  # Static export → out/

# Android APK
npm run build:android          # build + cap copy + cap sync
# OR manually:
npx cap sync android && cd android && ./gradlew assembleDebug

# APK output
android/app/build/outputs/apk/debug/app-debug.apk
```

**Capacitor configuration:**
```javascript
appId: 'com.clutchd.app'
webDir: 'out'           // Next.js static export output
androidScheme: 'https'
plugins.FirebaseAuthentication: { skipNativeAuth: true, providers: ['google.com'] }
```

**Node.js requirement:** Capacitor CLI requires Node.js >=22. Use nvm:
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22
```

**Android SDK:** Installed at `/opt/android-sdk`, API 35, build-tools 34/35. Local properties in `android/local.properties` → `sdk.dir=/opt/android-sdk`.

**Installed Capacitor Plugins:**
- `@capacitor/android` (8.4.1) — Android platform
- `@capacitor/app` (8.1.0) — App lifecycle
- `@capacitor/push-notifications` (8.1.1) — FCM push
- `@capacitor-firebase/authentication` (8.3.0) — Native Firebase Auth (Google)

### 10.3 Backend (Docker)

```bash
cd ClutchD-Backend
docker compose up --build -d    # Start all services
docker compose logs -f api       # Watch API logs
docker compose restart api       # Restart API only

# Local dev (without Docker)
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Seed accounts** (auto-created by `bootstrap_db.py`):
| Email | Password | Role |
|-------|----------|------|
| `admin@21907.com` | `clutchD123` | admin |
| `admin@1907.com` | `clutchD123` | admin (backup) |
| `customer@demo.com` | `demo123456` | customer |
| `mechanic@demo.com` | `demo123456` | mechanic (verified, near Coimbatore) |
| `garage@demo.com` | `demo123456` | garage (verified) |

### 10.4 Deploy Command Reference
```bash
# Build + sync
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 && npm run build
npx cap sync android
cd android && ./gradlew assembleDebug

# Deploy to server
sshpass -p '1907' scp -o StrictHostKeyChecking=no <file> dinus@192.168.1.35:<path>
sshpass -p '1907' ssh -o StrictHostKeyChecking=no dinus@192.168.1.35 "<command>"

# Server commands
docker compose ps           # Check service status
docker compose logs api     # View API logs
docker compose restart api  # Restart API
```

---

## 11. Demo Mode Architecture

Demo mode is controlled by two separate flags (both must be `false` for production):

| File | Logic | Notes |
|------|-------|-------|
| `lib/demo/demoFlag.js` | `DEMO_MODE = (NEXT_PUBLIC_DEMO_MODE === 'true')` | Standard env check |
| `lib/constants.js` | `DEMO_MODE = (NEXT_PUBLIC_DEMO_MODE !== "false")` | Legacy: defaults to true |

**When DEMO_MODE is active**, the Axios response interceptor routes through `apiInterceptor.js` which serves mock data for all endpoints.

**Runtime triggers:**
- `isRuntimeDemo`: set via `window.__DEMO_USER__` or `sessionStorage.demo_token` (toggled by DemoModeProvider)
- `isDemoEmailLogin`: login email ends with `@demo.com`

**Demo accounts are real backend accounts** — only the frontend intercepts their API calls to serve mock data.

**Key files:**
| File | Lines | Purpose |
|------|-------|---------|
| `lib/demo/apiInterceptor.js` | 771 lines | All mock endpoint handlers |
| `lib/demo/mockData.js` | — | MOCK_USERS, MOCK_MECHANICS, MOCK_GARAGES, MOCK_VEHICLES, etc. |
| `lib/demo/demoModeProvider.js` | — | React context + toggle + tour |
| `lib/demo/demoFlag.js` | — | Boolean from env |
| `lib/demo/demoMode.js` | — | Legacy demo mode |

**User ID patterns:**
- Firebase-signed-in users: `id` = Firebase UID (no prefix)
- Demo users: `id` starts with `demo-` (`demo-cust-1`, `demo-mech-1`, etc.)
- Firebase-fallback users: `id` starts with `firebase-`

---

## 12. Payment Flow

Backend supports **two payment providers** (auto-detected by available environment keys):

### Stripe
```env
STRIPE_SECRET_KEY=sk_live_...
```
Flow: `POST /payments/create` → returns Stripe payment intent → frontend confirms with Stripe.js → `POST /payments/verify` → order confirmed.

### Razorpay
```env
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
```
Flow: `POST /payments/create` → returns Razorpay order → frontend opens Razorpay checkout → `POST /payments/verify` → order confirmed.

**Security:** In production, if no payment keys are set, the payment endpoint returns HTTP 503. The mock Razorpay client is restricted to `debug=True` mode only.

---

## 13. Rate Limiting

The backend uses a **Redis-backed rate limiter** (replaced SlowAPI):

```python
# backend/app/core/limiter.py
limiter = RedisLimiter(redis_client, rate="30/minute")
```

- Rate: 30 requests per minute per client IP (configurable)
- Falls back gracefully if Redis is unavailable (no rate limiting)
- Previously used SlowAPI in-memory limiter; migrated to Redis for consistency across API restarts

---

## 14. CORS Configuration

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://clutchd.tail14cfb9.ts.net",
    "https://clutchd.com",          # Future production domain
    "https://api.clutchd.com",       # Future API domain
    "capacitor://localhost",         # Capacitor WebView
    "https://localhost",             # Capacitor secure context
]
```

The Capacitor app uses `https://localhost` as its origin in Android WebView, so this must be in the allowed origins list.

---

## 15. Frontend UI Components (38 Total)

Located at `src/components/ui/`:

| Component | Purpose |
|-----------|---------|
| DashboardShell | Main layout wrapper (header, sidebar, mode indicator) |
| BottomNav | Mobile bottom navigation (6 items + theme popover) |
| ThemeProvider | Dark/light mode DOM sync |
| ThemeToggle | Theme switch button |
| AuthInit | Restores session on mount |
| Logo | ClutchD branding |
| Button | Reusable button with variants |
| Input | Form input with validation |
| Modal | Overlay dialog |
| Toast / ToastProvider | Toast notification system |
| NotificationBell | Bell icon with unread count |
| ConnectionIndicator | WebSocket connection status |
| ChatBubble / ChatPanel / ChatWidget | In-app messaging UI |
| SOSButton | Emergency service request button |
| SplashScreen | Loading splash screen |
| LoadingScreen / Loader / Shimmer / Skeleton | Loading states |
| GlassCard | Frosted glass card container |
| Badge | Status/count badge |
| StarRating | Star rating display + input |
| FileUpload | Multipart file upload |
| Select / MultiSelect | Dropdown + multi-select |
| ErrorBoundary / ErrorCard | Error UI |
| EmptyState | Empty data placeholder |
| ConfirmModal | Confirmation dialog |
| ProfileFAB | Floating action button for profile |
| PushInit / PushPermissionBanner | Push notification setup |
| ReferralPanel | Referral program UI |
| PageTransition | Page transition animations |
| BackButtonHandler | Android back button handling |

---

## 16. Marketplace Components

Located at `src/components/marketplace/`:

| Component | Purpose |
|-----------|---------|
| ProductCard | Product grid tile with image, price, rating |
| ProductImage | Optimized image with fallback placeholder |
| ProductReviews | Review list + add review form |
| CategoryCard | Category grid tile |
| CategoryIcon | Maps category slug to lucide icon |
| SearchFilters | Filter sidebar (brand, price, category, rating) |
| VehicleSelector | Fitment vehicle picker (make/model/year) |
| VendorComparisonTable | Multi-vendor price comparison |
| OrderTimeline | Order status timeline |

---

## 17. Push Notifications (Firebase Cloud Messaging)

**Architecture:**
```
Firebase Console → FCM → Capacitor Push Plugin → Android Notification
                        → Web Push API (browser)
```

**Key files:**
| File | Purpose |
|------|---------|
| `lib/push/firebase.js` | `initFirebase()` singleton, `getMessagingInstance()` |
| `lib/push/pushNotificationHandler.js` | Foreground + background FCM handlers |
| `lib/auth/firebaseAuth.js` | `signInWithGoogle()` popup, `signInWithGoogleCredential()` token exchange |
| `lib/auth/capacitorAuth.js` | Native Android Google sign-in |

**Firebase project:** `clutchd-app`

**Push notification flow:**
1. User grants permission → FCM token generated
2. Token sent to backend via `POST /notifications/register-token`
3. When a job is assigned/status-changed, backend sends FCM via Firebase Admin SDK
4. Foreground: shown as in-app toast/modal
5. Background: shown as Android system notification

---

## 18. Error Handling Patterns

### 18.1 `.toFixed()` Safety Pattern
Always wrap API response values with `Number()` to avoid `y.toFixed is not a function`:
```javascript
// ✅ SAFE
{Number(value ?? 0).toFixed(2)}
{Number(product.rating ?? 0).toFixed(1)}

// ❌ UNSAFE
{value.toFixed(2)}
{product.rating.toFixed(1)}
```
This was hardened across 14 files (ServiceHistory, PaymentModal, VendorComparisonTable, etc.)

### 18.2 Retry Pattern (429 Too Many Requests)
```javascript
// In api.js interceptor:
// Retries up to 3x with exponential backoff (500ms → 1s → 2s)
// Shows toast on final failure
```

### 18.3 Firebase Auth — No Double Popup
When Google sign-in fails at the backend level, use `signInWithCredential(token)` instead of `signInWithPopup()`:
```javascript
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
const credential = GoogleAuthProvider.credential(googleIdToken);
const result = await signInWithCredential(auth, credential);
```

### 18.4 Session Errors — No Forced Logout on Transient Errors
- The Axios interceptor only forces logout on explicit 401 or 403 responses
- 502/503/500 errors pass through silently (user stays logged in during server restart)
- `console.error` replaced with `console.warn` for connection errors to prevent Next.js dev overlay

---

## 19. Known Issues & Fixes

### 19.1 Fixed Issues

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| All API endpoints return 401 | `is_token_blacklisted()` returned `True` when Redis was down (fail-closed) | Changed to `return False` when Redis unavailable (fail-open) in `core/security.py` |
| Google OAuth always fails | CSRF state check required Redis; state was generated but never stored when Redis down | Skip CSRF check when `get_redis()` returns `None` in `auth.py` |
| Firebase fallback opens double popup | `signInWithPopup` called after GSI already authenticated | Use `signInWithCredential(existingToken)` instead |
| Rate limiter state lost on restart | SlowAPI stored rates in-memory | Migrated to Redis-backed limiter in `core/limiter.py` |
| Payment FK delete cascade missing | Payment records referenced user/service request with no ON DELETE CASCADE | Added `cascade="all, delete-orphan"` to payment model FKs |
| CORS blocking Capacitor WebView | Capacitor uses `https://localhost` origin, not in allowed origins | Added `capacitor://localhost` and `https://localhost` to `CORS_ORIGINS` |
| Parts Store icon appears green in dark mode | `--color-icon-highlight` changed from gold `#d4a011` (light) to green `#10b981` (dark) — inconsistent with other icons | Changed Parts Store tab to use `text-primary`/`text-text-muted` like all other tabs |
| React 19 max-update-depth crash (#185) | Zustand `onRehydrateStorage` → `setState` fires during React's render cycle | Custom `merge` function sets `_isRestoring=false` post-hydration; `onRehydrateStorage` intentionally omits `setState` |
| Demo data leaking into real accounts | Components fell back to MOCK_* data when API calls failed | Removed mock fallbacks; only inject for `demo-` prefixed users |
| Dev overlay blocking UI on connection errors | Next.js Turbopack intercepts `console.error` and shows full-screen error | Swapped `console.error` → `console.warn` for Axios/WebSocket connection errors |

### 19.2 Open Issues

| Issue | Status |
|-------|--------|
| Committed SQLite DB in `repo/backend/db.sqlite3` | Tracked in git — should be .gitignored |
| `ClutchD-Backend` duplicated in two directories | Both `~/ClutchD/ClutchD-Backend/` and `~/ClutchD-Backend/` exist |
| Duplicate `ui-ux-pro-max-skill` directories | Both `~/ui-ux-pro-max-skill/` and `~/ui-ux-pro-max-skill-2/` exist |
| 3 portfolio versions with no git history on v2/v3 | Only v1 has a repo; v2 and v3 are local only |
| Static JWT secret in docker-compose.yml | `JWT_SECRET_KEY` default is hardcoded — dev-only acceptable |

---

## 20. Development Quick Reference

### Commands

```bash
# Frontend
npm run dev              # Dev server :3000
npm run build            # Production build → out/
npm run build:android    # Full APK build pipeline
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright e2e tests
npm run lint             # ESLint

# Backend
cd backend/ && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
docker compose up --build -d    # Full stack
cd backend/ && bash scripts/bootstrap_db.py   # Create DB tables + seed
cd backend/ && bash scripts/migrate.sh        # Apply migrations

# Android
nvm use 22 && npx cap sync android && cd android && ./gradlew assembleDebug

# Deploy (via sshpass)
sshpass -p '1907' scp file dinus@192.168.1.35:/path
sshpass -p '1907' ssh dinus@192.168.1.35 "command"
```

### Testing Backend Endpoints

```bash
# Health
curl https://clutchd.tail14cfb9.ts.net:8000/health

# Login
curl -X POST https://clutchd.tail14cfb9.ts.net:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@demo.com","password":"demo123456"}'

# Authenticated request
curl -H "Authorization: Bearer $TOKEN" \
  https://clutchd.tail14cfb9.ts.net:8000/api/profile/me
```

### Environment Variables

**Frontend (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=https://clutchd.tail14cfb9.ts.net:8000/api
NEXT_PUBLIC_WS_URL=wss://clutchd.tail14cfb9.ts.net:8000/ws
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_GOOGLE_CLIENT_ID=710446274779-8kn2hpj6bl7014gv19a63lipnehdedun.apps.googleusercontent.com
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDV_ndlTW-n7-v1pLx5I9jV60YEWdFcF9o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=clutchd-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=clutchd-app
NEXT_PUBLIC_FIREBASE_SENDER_ID=198695262834
NEXT_PUBLIC_FIREBASE_APP_ID=1:198695262834:web:fb86eb23adfedc2b3180eb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=clutchd-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-28TWP03QPG
```

---

## 21. Changelog (Session History)

| Date | Change | Files |
|------|--------|-------|
| 2026-07-24 | Parts Store icon dark mode fix (text-icon-highlight → text-primary) | `dashboard/customer/page.js`, `dashboard/mechanic/page.js` |
| 2026-07-24 | Logout button removed from DashboardShell (moved to profile settings) | `components/ui/DashboardShell.js` |
| 2026-07-22 | Payment FK cascade added; CORS config for Capacitor; rate limiter changed to Redis | Backend `docker-compose.yml`, backend `core/limiter.py` |
| 2026-07-22 | All backend fixes deployed via sshpass; Docker containers rebuilt | Server deployment |
| 2026-07-22 | Redis fail-open fix for token blacklist + OAuth state | `core/security.py`, `core/redis_client.py`, `api/v1/auth.py` |
| — | .toFixed() safety hardened across 14 component files | ServiceHistory, PaymentModal, VendorComparisonTable, etc. |
| — | Auth session hardening, console.warn for connection errors | `lib/api.js`, `lib/socket.js` |
| — | Docker healthchecks + restart policies + .dockerignore | Various Docker/compose files |