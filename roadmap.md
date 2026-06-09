# ClutchD — Roadmap

## Repository Map
- **Frontend:** `github.com/dharaneesh-sys/ClutchD-Frontend`
- **Backend:**  `github.com/dharaneesh-sys/ClutchD-Backend`
- **Deployed API:** `https://clutchd-api.onrender.com`

---

## Phase 1 — Finish Render Deployment

### Backend ✅ Already Deployed
- API at `https://clutchd-api.onrender.com`
- PostgreSQL + Redis on free tier
- PostGIS fallback active (haversine Python fallback)
- `render.yaml` defines web service, PostgreSQL, Redis (keyvalue)

### Frontend (Fix Blueprint Sync)
1. Push latest `main` (lockfile fixed in `53491f8`)
2. In Render Dashboard → Blueprint → Sync
3. Verify at `https://clutchd-app.onrender.com`

**If deploy fails:**
- Check build logs for memory issues
- Add to `render.yaml`: `NODE_OPTIONS=--max-old-space-size=2048`
- Ensure `package-lock.json` is in sync with `package.json` (`npm install` locally if needed)

---

## Phase 2 — Capacitor (Mobile App)

### 2a. `next.config.mjs` — Static export
```diff
+ output: "export",
+ images: { unoptimized: true },
- async headers() { ... }
```

### 2b. `src/app/page.js` — Client-side redirect
```diff
- import { redirect } from "next/navigation";
- export default function Home() { redirect("/auth"); }

+ "use client";
+ import { useEffect } from "react";
+ import { useRouter } from "next/navigation";
+ export default function Home() {
+   const router = useRouter();
+   useEffect(() => { router.replace("/auth"); }, []);
+   return null;
+ }
```

### 2c. `src/lib/constants.js` — Runtime API URL
Replace `NEXT_PUBLIC_API_URL` baking with runtime detection:
```js
function getApiBaseUrl() {
  if (typeof window !== "undefined" && window.location.hostname === "localhost")
    return "http://localhost:8000/api";
  return "https://clutchd-api.onrender.com/api";
}
export const API_BASE_URL = getApiBaseUrl();
```
Same pattern for `WS_URL` in `getDefaultWsUrl()` — default to `wss://clutchd-api.onrender.com/ws`.

### 2d. Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

### 2e. `capacitor.config.ts`
```ts
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.clutchd.app",
  appName: "ClutchD",
  webDir: "out",
  server: { androidScheme: "https" },
};
export default config;
```

### 2f. Build & Run
```bash
npx next build                      # builds out/
npx cap add android                 # creates android/
npx cap add ios                     # creates ios/
npx cap copy                        # copies out/ into native projects
npx cap open android                # Android Studio
npx cap open ios                    # Xcode
```

### 2g. Update Frontend `render.yaml`
```yaml
services:
  - type: web
    name: clutchd-app
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npx serve out -l $PORT
    envVars:
      - key: NEXT_PUBLIC_API_URL
        value: https://clutchd-api.onrender.com/api
      - key: NEXT_PUBLIC_WS_URL
        value: wss://clutchd-api.onrender.com/ws
```

### 2h. Google OAuth for Capacitor
- Add custom URL scheme in `capacitor.config.ts`:
  ```ts
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId: process.env.GOOGLE_CLIENT_ID,
    },
  }
  ```
- Add redirect URI in Google Cloud Console: `com.clutchd.app:/oauth2callback`

---

## Phase 3 — Increased Modularity

### 3a. Backend: Split `api/v1/admin.py` (837 lines)
Create `api/v1/admin/` directory:

| New File | Contents |
|----------|----------|
| `__init__.py` | Aggregate sub-routers |
| `users.py` | User CRUD, toggle active |
| `providers.py` | Mechanics + Garages verify/penalize |
| `jobs.py` | Job listing, force-assign |
| `disputes.py` | Dispute resolution |
| `analytics.py` | Dashboard stats + revenue |
| `payments.py` | Payment list, refunds |

**Pattern for `admin/__init__.py`:**
```python
from fastapi import APIRouter
from .users import router as users_router
from .providers import router as providers_router
from .jobs import router as jobs_router
from .disputes import router as disputes_router
from .analytics import router as analytics_router
from .payments import router as payments_router

router = APIRouter()
router.include_router(users_router)
router.include_router(providers_router)
router.include_router(jobs_router)
router.include_router(disputes_router)
router.include_router(analytics_router)
router.include_router(payments_router)
```

Update `api/v1/router.py` to import from `admin` package instead of `admin` module.

### 3b. Backend: Split `services/job_service.py` (475 lines)

| New File | Contents |
|----------|----------|
| `job_service.py` (stays) | Core state machine: create → assign → complete → cancel |
| `job_pricing.py` | Price calculation, distance fee, GST, convenience fee |
| `job_notifications.py` | WebSocket push + notification creation on status changes |

### 3c. Backend: Split `api/v1/payments.py` (398 lines)

| New File | Contents |
|----------|----------|
| `payments.py` (stays) | Payment create + verify core logic |
| `payments_razorpay.py` | Razorpay webhook handler, signature verification |
| `payments_stripe.py` | Stripe webhook handler, event processing |

### 3d. Frontend: Split `ServiceRequestPanel.js` (369 lines)
- Extract `LocationIndicator` (50 lines) → `components/dashboard/LocationIndicator.js`
- Keep form + status logic in `ServiceRequestPanel.js`

### 3e. Frontend: Split `LoginCard.js` (359 lines)
- Extract `OAuthSection.js` → `components/auth/OAuthSection.js`
- Keep email/password form in `LoginCard.js`

### Verification Steps
After each split:
- **Backend:** Restart with `docker compose up` → test a route from each new module
- **Frontend:** `npm run build` → confirm no compilation errors
- Check for broken imports → update all references

---

## Files Changed Summary

| File | Phase | Type |
|------|-------|------|
| `next.config.mjs` | 2a | Modify |
| `src/app/page.js` | 2b | Modify |
| `src/lib/constants.js` | 2c | Modify |
| `capacitor.config.ts` | 2e | New |
| `render.yaml` (frontend) | 2g | Modify |
| `package.json` | 2d | Modify |
| `backend/app/api/v1/admin/` (6+1 files) | 3a | New |
| `backend/app/api/v1/router.py` | 3a | Modify |
| `backend/app/services/job_pricing.py` | 3b | New |
| `backend/app/services/job_notifications.py` | 3b | New |
| `backend/app/services/job_service.py` | 3b | Modify |
| `backend/app/api/v1/payments_razorpay.py` | 3c | New |
| `backend/app/api/v1/payments_stripe.py` | 3c | New |
| `backend/app/api/v1/payments.py` | 3c | Modify |
| `src/components/dashboard/LocationIndicator.js` | 3d | New |
| `src/components/dashboard/ServiceRequestPanel.js` | 3d | Modify |
| `src/components/auth/OAuthSection.js` | 3e | New |
| `src/components/auth/LoginCard.js` | 3e | Modify |

---

## Execution Order
```
Phase 1 (Render sync) → Phase 2 (Capacitor) → Phase 3 (Modularity: 3a → 3b → 3c → 3d → 3e)
```
