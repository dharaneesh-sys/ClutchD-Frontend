# ClutchD — Feature Gap & Ultrawork Integration Plan

## TL;DR (For humans)

> **Quick Summary**: Close 14 feature gaps against competitor platforms (YourMechanic, Wrench, RepairSmith, AutoZone, AAA) and fix 4 critical code bugs in 5 parallel waves. ClutchD's unique advantage — combining a parts marketplace AND on-demand mechanic service — needs these features to ship as a production-ready dual-platform.
>
> **Deliverables**:
> - Wave 1: FCM push notifications, mechanic-customer chat (WebSocket), offline SOS, real-time ETA
> - Wave 2: Razorpay real payments (already integrated — env config + health gating), escrow payment flow, subscription plans, invoice PDF download from backend endpoint
> - Wave 3: VIN parts fitment, maintenance reminders, multi-vehicle dashboard, warranty management
> - Wave 4: BOPIS, order tracking, vendor price comparison, mechanic certification badges
> - Wave 5: Admin analytics (real backend for stats + mock charts), fleet services, payout management, 429 rate-limit handling, 4 critical bug fixes
>
> **Must NOT do**:
> - No backend FastAPI code changes (frontend-only repo; backend lives on separate Render service that is currently returning 503)
> - No Google Maps (Leaflet/OSM stays)
> - No app store submissions (Capacitor setup only)
> - No replacing existing working functionality
>
> **Estimated Effort**: XL (~44 tasks across 5 waves + final verification)
> **Parallel Execution**: YES — 5 waves with maximum parallelism within each wave
> **Critical Path**: Wave 1 → Wave 2 → Wave 3+4 (parallel) → Wave 5 → Final Verification
> **Execution Mode**: HIGH_ACCURACY — dual Momus + Oracle review completed

## Review Findings (Applied)

This plan has passed a dual high-accuracy review (Momus + Oracle). The following corrections from review are already applied:

| # | Finding | Correction |
|---|---------|------------|
| 1 | `.js` file extensions used throughout, but codebase uses `.js` | All references changed to `.js` |
| 2 | `EarningsSummary.js` doesn't exist (closest: `EarningsChart.js`) | References fixed |
| 3 | `DashboardCharts.js` doesn't exist (use `AdminOverview.js` instead) | Reference fixed |
| 4 | Task 42: `_checkInterval` typo already fixed in current code | Bug fix removed; only `toCamelCase` dedup remains |
| 5 | ~14 grouped tasks missing individual QA scenarios | QA policy updated: grouped tasks share QA with parent |
| 6 | Backend-dependent QA unexecutable when backend is 503 (Tasks 10, 11, 13, 33, 35-38) | Mock/demo fallback QA added |
| 7 | `npm install firebase` will bloat bundle (~300KB) | Changed to modular `firebase/messaging` only |
| 8 | `chatStore` with `Map` won't trigger Zustand reactivity | Changed to plain object `{ [jobId]: Message[] }` |
| 9 | jsPDF doesn't support CSS variables natively | Added `getComputedStyle` bridge to read var values |
| 10 | FCM push permission requests without user gesture | Moved permission prompt to toggle click only |
| 11 | Stripe/escrow/subscription features need backend for real use | Added `BackendHealth.isAvailable()` gating + demo fallback. **UPDATED**: Razorpay already integrated — gating only needed |
| 12 | QR pickup codes with UUID trivially forgeable | Changed to HMAC-signed tokens |

---

## Scope

### Current State
ClutchD is a Next.js 16.2.3 (App Router) + React 19 + Zustand 5 + Tailwind v4 frontend deployed (when running) on Render. Backend is a separate FastAPI service at `clutchd-api.onrender.com` currently returning 503 (not active). The app combines a **parts marketplace** (6 categories, search, cart, checkout, orders) with an **on-demand mechanic service** (WebSocket real-time tracking, GPS, role-based dashboards, SOS, vehicle management).

Two prior execution waves are complete: production-readiness (46 tasks: deploy config, Tailwind fix, theme refactor, demo mode gating, tests, PWA, mobile) and UI polish (23 tasks: logo, shared components, accessibility, CSS variables).

### What's In Scope
**Wave 1 — Safety & Engagement Foundation** (9 tasks):
- Firebase Cloud Messaging for web + mobile push notifications
- Firebase Auth Google sign-in for signup and login (works without backend)
- Job-scoped mechanic-customer chat with photo sharing (reuse WebSocket)
- Offline-first SOS with cached vehicle info + queued requests
- Real-time mechanic ETA display on customer dashboard

**Wave 2 — Revenue Engine** (7 tasks):
- Razorpay payment gateway configuration (already integrated — env vars + health gating only)
- Escrow payment flow for service bookings (hold → release on completion)
- Subscription/membership plans UI (monthly/yearly tiers)
- Invoice PDF download from backend endpoint (already implemented — fallback only)

**Wave 3 — User Retention** (9 tasks):
- VIN/license plate parts fitment verification on product pages
- Maintenance reminder scheduling engine (per-vehicle)
- Multi-vehicle dashboard with per-vehicle service history
- Warranty terms display + claims management UI

**Wave 4 — Marketplace Depth** (8 tasks):
- Buy Online Pick Up In Store (BOPIS) toggle on checkout
- Real-time order/delivery tracking (carrier-style status timeline)
- Vendor price comparison table on product detail pages
- Mechanic certification badges (ASE, manufacturer) on profiles

**Wave 5 — Admin Power & Code Polish** (11 tasks):
- Admin analytics dashboard (real backend for stat cards + mock data for trend charts)
- Fleet/B2B services onboarding flow
- Payout management for mechanics/garages
- 429 rate-limit handling (axios interceptor + exponential backoff + toast)
- Fix 4 critical code bugs:
  1. `PaymentModal.js` — nested setTimeout cleanup leak
  2. Duplicate `useToast` — reconcile hooks/useToast.js with ToastProvider.js
  3. `MultiSelect.js` — bounds check on `activeIndex`
  4. `toCamelCase` — extract to `@/lib/utils`, deduplicate 5 copies

### What's NOT In Scope (Guardrails)
- No backend FastAPI code changes (frontend-only repository)
- No Google Maps API (no budget; Leaflet/OSM works)
- No actual app store submission (Capacitor setup exists but no Apple/Google accounts)
- No AI/ML features (diagnostic tool is deferred)
- No replacing existing Leaflet/OSM or WebSocket infrastructure
- No breaking existing demo mode functionality
- No adding real-time multi-party video/AR features
- No Apple CarPlay / Android Auto integration
- No EV charging station locator

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Vitest + Playwright)
- **Automated tests**: Tests-After (new features get tests)
- **Framework**: Vitest (unit/integration) + Playwright (E2E)
- **Manual verification**: Agent-executed QA per todo (see each todo)

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.omo/evidence/clutchd-feature-gap/task-{N}-{scenario}.{ext}`.

- **Frontend/UI**: Playwright — navigate, interact, assert DOM, screenshot
- **Build**: Bash — `npm run build` verify exit code + output
- **Lint**: Bash — `npm run lint` verify clean
- **Tests**: Bash — `npx vitest run` verify pass
- **Code quality**: Bash — grep for removed patterns, verify no regression
- **Backend check**: Bash — `curl` to verify backend endpoints (currently 503 — note as risk)

### Backend Reality & Dependency Risk

**Backend explored at `~/ClutchD-Backend`** — this is a production-grade FastAPI service with PostgreSQL+PostGIS, Redis, Celery, Razorpay, WebSocket, and full auth. The deployed service at `clutchd-api.onrender.com` currently returns **503 Service Unavailable** (likely missing PostgreSQL/Redis env vars on free Render tier — code is complete).

**What the backend already provides** (confirmed by exploring the backend codebase):
| Feature | Endpoint | Status |
|---------|----------|--------|
| Auth (login, register, Google OAuth, forgot password) | `POST /auth/*` | ✅ Ready |
| Razorpay payments (create, verify, webhook, QR, cash) | `POST /payments/*` | ✅ Ready |
| Service requests (create, SOS) | `POST /service/*` | ✅ Ready |
| Vehicle CRUD | `POST/GET/PATCH/DELETE /vehicles` | ✅ Ready |
| Notifications (list, read, WebSocket broadcast) | `GET/PATCH /notifications` | ✅ Ready |
| Marketplace (products, categories, vendors, orders, cart, offers, reviews) | `GET/POST/PATCH/DELETE /marketplace/*` | ✅ Ready |
| Admin analytics (aggregate stats only) | `GET /admin/analytics` | ✅ Ready but **aggregate totals only** (no monthly time-series) |
| Admin payments + refunds | `GET /admin/payments`, `POST /admin/payments/{id}/refund` | ✅ Ready |
| Invoice PDF (reportlab — `GET /jobs/history/{id}/invoice`) | `GET /jobs/history/{job_id}/invoice` | ✅ Ready |
| Auto-payouts (server-side after payment capture) | `payout_service.py` | ✅ Ready (no frontend action needed) |
| Rate limiting (`slowapi` in-memory, IP-based) | 5-30 req/min per endpoint | ⚠️ Frontend has **no 429 handling** — gap to fix |
| Email sending | Not implemented | ❌ Not available |
| Fleet/B2B endpoints | Not implemented | ❌ Not available |
| Subscription endpoints | Not implemented | ❌ Not available |

**Frontend already consumes several endpoints correctly**: `PaymentModal.js` has Razorpay via `/payments/create` + `/payments/verify`; `ServiceHistory.js` downloads invoices via `/jobs/history/{jobId}/invoice`; `NotificationBell.js` fetches `/notifications`; `AdminOverview.js` calls `/admin/analytics`.

**Mitigation**: The plan uses fallback to demo/mock mode wherever backend is unreachable (503). Features where the backend has no endpoint are noted with "(requires backend)". All proposed changes respect the **no backend code changes** guardrail.

---

## Execution Strategy

```
Wave 1 (SAFETY & ENGAGEMENT — 9 parallel tasks):
├── Task 1: FCM — Install @capacitor/push-notifications + Firebase SDK
├── Task 2: FCM — Create push notification service (subscribe/unsubscribe/handle)
├── Task 3: FCM — Integrate push with notificationStore + settings page
├── Task 4: Firebase Auth — Google sign-in for signup + login (Firebase fallback, no backend needed)
├── Task 5: Mechanic-customer chat — Create chatStore (job-scoped, WebSocket)
├── Task 6: Mechanic-customer chat — Chat UI component with photo sharing
├── Task 7: Offline SOS — Cache vehicle/profile data in IndexedDB
├── Task 8: Offline SOS — Queue SOS requests when offline, flush on reconnect
├── Task 9: Real-time ETA — Add prominent ETA display on customer dashboard + map

Wave 2 (REVENUE ENGINE — 7 parallel tasks):
├── Task 10: Razorpay — Configure env vars + BackendHealth gate on existing PaymentModal flow
├── Task 11: Razorpay — Health-gate existing payment flow + demo fallback in PaymentModal
├── Task 12: Payment escrow — Escrow state machine (Razorpay payment status based, not Stripe)
├── Task 13: Subscription plans — Tier UI + pricing display components
├── Task 14: Subscription plans — Purchase flow (frontend-only mock; backend has no subscription API)
├── Task 15: Invoice PDF — Add fallback for backend invoice download endpoint
├── Task 16: Invoice PDF — Email via client-side mailto: link (no backend email service)

Wave 3 (USER RETENTION — 9 parallel tasks):
├── Task 17: VIN fitment — Vehicle selector component on product pages
├── Task 18: VIN fitment — "Check compatibility" UI + API integration
├── Task 19: Maintenance reminders — Service interval engine + notification scheduling
├── Task 20: Maintenance reminders — Dashboard maintenance alert banner
├── Task 21: Multi-vehicle dashboard — Vehicle list with service history per vehicle
├── Task 22: Multi-vehicle dashboard — Vehicle switching on service request flow
├── Task 23: Warranty — Display warranty terms on booking confirmation + receipt
├── Task 24: Warranty — Warranty claims UI in profile + admin panel
├── Task 25: Warranty — Warranty expiry tracking + renewal reminders

Wave 4 (MARKETPLACE DEPTH — 8 parallel tasks):
├── Task 26: BOPIS — Pickup location selector + toggle on checkout
├── Task 27: BOPIS — Order status flow for BOPIS orders
├── Task 28: Order tracking — Live order status timeline component
├── Task 29: Order tracking — Notification hooks for status transitions (backend notifications already integrated — verify + enhance)
├── Task 30: Vendor comparison — Price comparison table on product detail
├── Task 31: Vendor comparison — Filtering/sorting by vendor
├── Task 32: Certification badges — Mechanic profile badge display
├── Task 33: Certification badges — Admin verification workflow

Wave 5 (ADMIN & POLISH — 11 tasks, partially sequential):
├── Task 34: Admin analytics — Stat cards from backend endpoint + trend charts from mock data
├── Task 35: Admin analytics — Exportable reports
├── Task 36: Fleet/B2B — Fleet registration form + dashboard
├── Task 37: Fleet/B2B — Bulk booking scheduling
├── Task 38: Payout management — Payout ledger from admin payments endpoint
├── Task 39: Payout management — Payout schedule + status tracking
├── Task 40: 429 rate-limit handling — Axios interceptor with exponential backoff + toast
├── Task 41: Fix CRITICAL BUG 1 — PaymentModal timer leak
├── Task 42: Fix CRITICAL BUG 2 — Reconcile duplicate useToast
├── Task 43: Fix CRITICAL BUG 3 — MultiSelect bounds check
├── Task 44: Fix CRITICAL BUG 4 — toCamelCase dedup

Final Verification (4 parallel reviews):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality + build verification (quick)
├── Task F3: Real manual QA — Playwright end-to-end (unspecified-high)
└── Task F4: Scope fidelity + backend integration check (librarian)
```

---

## TODOs

### Wave 1 — Safety & Engagement Foundation

- [x] 1. **Install FCM dependencies for Capacitor web + mobile**

  **What to do**:
  1. Install Firebase JS SDK (modular — only messaging): `npm install firebase` then use `import { getMessaging, getToken, onMessage } from 'firebase/messaging'` (NOT the full `firebase` package — tree-shaking avoids ~300KB bundle bloat)
  2. Install Capacitor push plugin: `npm install @capacitor/push-notifications`
  3. Create `src/lib/push/firebase.js`:
     - Initialize Firebase app with config from env vars (`NEXT_PUBLIC_FIREBASE_API_KEY`, etc.)
     - Import only from `firebase/messaging`: `getMessaging()`, `getToken()`, `onMessage()`
  4. Create `src/lib/push/pushService.js`:
     - `registerForPush()` — request permission, get FCM token via Capacitor
     - `unregisterPush()` — remove token from server
     - `onPushReceived(handler)` — foreground message handler
     - `setupPushListeners()` — wire into Capacitor `PushNotifications` plugin
  5. Add env vars to `.env.local.example` and `render.yaml`:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
  6. Add firebase-messaging-sw.js to `public/` for web push service worker

  **Must NOT do**:
  - Don't add Firebase Analytics (not needed)
  - Don't replace existing WebSocket notification system (push complements it)
  - Don't commit Firebase secrets (use env vars)

  **Parallelization**: Wave 1, can run in parallel with Tasks 5-9
  **Blocks**: Tasks 2, 3

  **References**:
  - `src/lib/socket.js` — Existing WebSocket for comparison pattern
  - `src/store/notificationStore.js` — Existing notification state
  - `src/app/marketplace/profile/settings/page.js` — Has `push_notifications` toggle (no implementation)
  - `capacitor.config.js` — Capacitor config

  **Acceptance Criteria**:
  - [ ] `npm run build` succeeds
  - [ ] `firebase` and `@capacitor/push-notifications` in package.json
  - [ ] `src/lib/push/firebase.js` exports Firebase app instance
  - [ ] `src/lib/push/pushService.js` exports `registerForPush`, `unregisterPush`, `onPushReceived`
  - [ ] `public/firebase-messaging-sw.js` exists

  **QA Scenarios**:
  ```
  Scenario: FCM dependencies install correctly
    Tool: Bash
    Steps:
      1. Run `npm ls firebase @capacitor/push-notifications 2>&1 | head -5`
    Expected Result: Both packages appear in dependency tree
    Evidence: .omo/evidence/clutchd-feature-gap/task-1-fcm-deps.txt
  ```

  **Commit**: YES
  - Message: `feat(push): add FCM and Capacitor push dependencies`
  - Files: `package.json`, `src/lib/push/firebase.js`, `src/lib/push/pushService.js`, `public/firebase-messaging-sw.js`, `env.local.example`, `render.yaml`

- [x] 2. **FCM — Push notification integration with notificationStore + settings**

  **What to do**:
  1. Update `src/store/notificationStore.js`:
     - Add `pushToken: string | null`, `pushEnabled: boolean`
     - Add actions: `registerPushToken()`, `unregisterPushToken()`, `setPushEnabled(bool)`
     - On register: call pushService.registerForPush() → POST `/api/push/register` with token
  2. Update `src/app/marketplace/profile/settings/page.js`:
     - Wire the existing `push_notifications` toggle to `notificationStore.setPushEnabled()`
     - Add permission request on first toggle
  3. Update `src/app/layout.js`:
     - Add `useEffect` in root client component to register push on auth state change
     - Request permission after login (not on first visit)
  4. Create `src/components/ui/PushPermissionBanner.js`:
     - Browser-level push permission request with "Allow" / "Later" buttons
     - Shows once, dismissable

  **Must NOT do**:
  - Don't request push permission on page load (only after user action)
  - Don't block app usage on permission

  **Parallelization**: Wave 1
  **Blocked By**: Task 1

  **References**:
  - `src/store/notificationStore.js:1-30` — Current store
  - `src/app/marketplace/profile/settings/page.js` — Settings page with toggle
  - `src/app/layout.js:91-109` — Root layout
  - `src/lib/push/pushService.js` — Created in Task 1

  **Acceptance Criteria**:
  - [ ] `notificationStore` has `pushToken` and `pushEnabled` state
  - [ ] Settings page toggle calls `setPushEnabled` on the store
  - [ ] Push permission requested after login, not on first visit
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Push permission requested after login
    Tool: Playwright
    Steps:
      1. Navigate to /auth
      2. Login with demo credentials
      3. Check notificationStore pushEnabled state
    Expected Result: Push permission prompt appears after successful login
    Evidence: .omo/evidence/clutchd-feature-gap/task-2-push-permission.png
  ```

  **Commit**: YES
  - Message: `feat(push): integrate FCM with notificationStore and settings`
  - Files: `src/store/notificationStore.js`, `src/app/marketplace/profile/settings/page.js`, `src/app/layout.js`, `src/components/ui/PushPermissionBanner.js`

- [ ] 3. **FCM — Handle push notifications (foreground + background)**

  **What to do**:
  1. In `src/lib/push/pushService.js`:
     - Foreground handler: `onPushReceived` → map push data to toast notification (type, title, body)
     - Background handler: service worker `firebase-messaging-sw.js` handles clicks → deep-link to relevant page
  2. Create push notification types:
     - `NEW_JOB` → deep-link to `/dashboard/mechanic`
     - `JOB_ASSIGNED` → deep-link to `/dashboard/customer`
     - `STATUS_UPDATE` → deep-link to service request
     - `ORDER_SHIPPED` → deep-link to `/marketplace/orders`
     - `PAYMENT_RECEIVED` → deep-link to earnings
     - `MAINTENANCE_REMINDER` → deep-link to vehicle dashboard
  3. Integrate with existing toasts: when foreground push received, show via `toastStore`
  4. Handle push data payload: `{ type, title, body, deepLink, payload }`

  **Must NOT do**:
  - Don't override browser's native notification behavior
  - Don't send duplicate toasts (WS already handles in-app updates)

  **Parallelization**: Wave 1
  **Blocked By**: Tasks 1, 2

  **References**:
  - `src/store/toastStore.js` — Toast system
  - `src/components/ui/ToastProvider.js` — Toast display
  - `src/lib/socket.js:53-85` — Existing WS message handling pattern

  **Acceptance Criteria**:
  - [ ] Foreground push triggers toast notification
  - [ ] Background push creates browser notification
  - [ ] Notification click navigates to correct deep-link
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Foreground push shows toast
    Tool: Playwright + FCM emulator or manual test
    Steps:
      1. Open app while logged in
      2. Send test push via FCM console
    Expected Result: Toast notification appears with correct title/body
    Evidence: .omo/evidence/clutchd-feature-gap/task-3-foreground-push.png
  ```

  **Commit**: YES (groups with Tasks 1+2)
  - Message: `feat(push): foreground and background push handling`
  - Files: `src/lib/push/pushService.js`, `public/firebase-messaging-sw.js`, `src/store/toastStore.js`

- [x] 4. **Firebase Auth — Google sign-in for signup + login (backend-independent)**

  **Context**: Google OAuth is already implemented in both `LoginCard.js` and `SignUpCard.js` using Google Identity Services (`accounts.google.com/gsi/client`). But it calls `POST /auth/oauth/google` on the backend which returns 503. This task adds a Firebase Auth-based fallback path that works without the backend.

  **What to do**:
  1. Install Firebase Auth alongside existing FCM setup:
     - `npm install firebase` already done in Task 1 (but use modular import: `import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'`)
  2. Create `src/lib/auth/firebaseAuth.js`:
     ```js
     import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
     import { app } from '@/lib/push/firebase';  // Reuse Firebase app from Task 1

     const auth = getAuth(app);

     export async function signInWithGoogle() {
       const provider = new GoogleAuthProvider();
       provider.addScope('email');
       provider.addScope('profile');
       try {
         const result = await signInWithPopup(auth, provider);
         // Returns: { user: { uid, displayName, email, photoURL }, idToken: string }
         return result;
       } catch (error) {
         if (error.code === 'auth/popup-closed-by-user') return null;
         throw error;
       }
     }
     ```
  3. Update `src/store/authStore.js`:
     - Add `firebaseSignIn()` action:
       - Calls `signInWithGoogle()` from firebaseAuth
       - On success: creates authStore user object from Firebase user data
       - Falls through to **demo user** flow (similar to `setDemoUser`) when backend is 503
       - Generates a local JWT-like token for API calls (which will use demo interceptors)
     - Update `loginWithGoogle()` to try Firebase Auth first when backend is down:
       ```js
       loginWithGoogle: async (credential, role, oauthState) => {
         set({ isLoading: true, error: null });
         // Try backend first, fall back to Firebase Auth
         if (BackendHealth.isAvailable()) {
           // Real flow — POST /auth/oauth/google (existing code)
           ...
         } else {
           // Firebase Auth fallback — works entirely client-side
           try {
             const firebaseResult = await signInWithGoogle();
             if (!firebaseResult) { set({ isLoading: false }); return null; }
             const { user: firebaseUser } = firebaseResult;
             const clutchdUser = {
               id: 'firebase-' + firebaseUser.uid,
               name: firebaseUser.displayName || 'Google User',
               email: firebaseUser.email,
               avatar: firebaseUser.photoURL,
               role: role || 'customer',
               isGoogleUser: true,
             };
             set({ user: clutchdUser, isAuthenticated: true, _hydrated: true, isLoading: false });
             return clutchdUser;
           } catch (error) {
             set({ isLoading: false, error: 'Google sign-in failed. Please try again.' });
             return null;
           }
         }
       }
       ```
  4. Add `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` env vars to `.env.local.example` (already planned in Task 1)
  5. Update `SignUpCard.js`: The existing Google button already calls `loginWithGoogle` (line 19, 93). Since we updated `loginWithGoogle` to fallback to Firebase Auth, the signup button will now work without backend.
  6. Update `LoginCard.js`: Same — the existing Google button calls `loginWithGoogle(credential, role, oauthState)` which will now use Firebase Auth fallback.

  **Must NOT do**:
  - Don't remove the existing Google Identity Services code (it's the real OAuth flow when backend is available)
  - Don't require Firebase Auth for demo mode (existing demo credentials still work)
  - Don't send Firebase tokens to the backend (that would be a backend change)

  **Parallelization**: Wave 1, blocked by Task 1 (Firebase SDK), can run in parallel with Tasks 5-9

  **References**:
  - `src/components/auth/SignUpCard.js:58-121` — Existing Google OAuth on signup (already loads GSI script, renders button, calls loginWithGoogle)
  - `src/components/auth/LoginCard.js:46-110` — Existing Google OAuth on login (same pattern)
  - `src/store/authStore.js:181-213` — Existing loginWithGoogle action (needs Firebase fallback)
  - `src/lib/push/firebase.js` — Created in Task 1, Firebase app instance reused here

  **Acceptance Criteria**:
  - [ ] Google sign-in button works on both SignUpCard and LoginCard
  - [ ] When backend is 503, Firebase Auth popup appears and authenticates the user
  - [ ] Authenticated user can navigate dashboard (demo mode)
  - [ ] Existing demo login still works unchanged
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Google sign-in with Firebase fallback (backend 503)
    Tool: Playwright
    Steps:
      1. Navigate to /auth (signup tab)
      2. Click "Sign up with Google" button
      3. Complete Google OAuth in popup (or mock the Firebase response)
    Expected Result: User is created and redirected to dashboard
    Evidence: .omo/evidence/clutchd-feature-gap/task-4-google-signin.png

  Scenario: Existing Google Identity Services works when backend available
    Tool: Manual (requires running backend)
    Steps:
      1. Ensure backend is available
      2. Click Google sign-in on login page
    Expected Result: Backend OAuth flow is used (Firebase is fallback only)
  ```

  **Commit**: YES
  - Message: `feat(auth): add Firebase Auth Google sign-in with backend-independent fallback`
  - Files: `src/lib/auth/firebaseAuth.js`, `src/store/authStore.js`

- [x] 5. **Mechanic-customer chat — Create chatStore with WebSocket integration**

  **What to do**:
  1. Create `src/store/chatStore.js`:
     - State: `conversations: { [jobId]: Message[] }`, `activeConversation: jobId|null`, `unreadCount: number`
     - ⚠️ **Use plain object, NOT `Map`** — Zustand does not deeply proxy Map mutations, so `map.set()` won't trigger re-renders. Use a plain object `{ [jobId]: [...] }` and always create a new object on mutation: `set(state => ({ conversations: { ...state.conversations, [jobId]: newMessages } }))`.
     - Actions:
       - `openConversation(jobId)` — set active, mark read
       - `sendMessage(jobId, text, image?)` — send via WebSocket
       - `receiveMessage(jobId, message)` — called from socket.js onmessage
       - `markRead(jobId)` — mark all messages as read
       - `fetchHistory(jobId)` — GET `/api/chat/{jobId}/history`
     - Message shape: `{ id, jobId, senderId, senderRole, text, imageUrl?, createdAt }`
  2. Update `src/lib/socket.js`:
     - Add `CHAT_MESSAGE` message type handler → calls `chatStore.receiveMessage()`
     - Add `CHAT_READ` message type handler → marks messages as read
  3. Create `src/lib/chat/chatService.js`:
     - `sendChatMessage(jobId, text, image?)` — WS send + optimistic local update
     - `fetchChatHistory(jobId)` — API call

  **Must NOT do**:
  - Don't replace the existing support `ChatWidget` (that's for customer support, not mechanic chat)
  - Don't send images over WebSocket (upload first, send URL)

  **Parallelization**: Wave 1, can run in parallel with Tasks 1, 7, 8, 9
  **Blocks**: Task 6

  **References**:
  - `src/lib/socket.js:1-167` — Existing WebSocket infrastructure
  - `src/store/serviceStore.js` — Service request state (chat is scoped to a job)
  - `src/components/ui/ChatWidget.js` — Existing support chat (pattern reference)
  - `src/store/notificationStore.js` — For unread count

  **Acceptance Criteria**:
  - [ ] `src/store/chatStore.js` exists with all actions
  - [ ] `socket.js` handles `CHAT_MESSAGE` and `CHAT_READ` types
  - [ ] Chat messages persist and reload on conversation open
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Chat message sent via WebSocket
    Tool: Playwright
    Steps:
      1. Open service request detail
      2. Open chat for that job
      3. Type and send "Hello, I'm on my way"
    Expected Result: Message appears in chat, sent via WS
    Evidence: .omo/evidence/clutchd-feature-gap/task-4-chat-ws.txt
  ```

  **Commit**: YES
  - Message: `feat(chat): add job-scoped mechanic-customer chat store and WS integration`
  - Files: `src/store/chatStore.js`, `src/lib/socket.js`, `src/lib/chat/chatService.js`

- [x] 6. **Mechanic-customer chat — UI components with photo sharing**

  **What to do**:
  1. Create `src/components/ui/ChatPanel.js`:
     - Props: `{ jobId, otherUserName, otherUserRole, onClose }`
     - Components:
       - `ChatHeader` — user name, role badge, close button
       - `ChatMessages` — scrollable message list with avatars, timestamps
       - `ChatInput` — text input + image picker + send button
       - `ChatImage` — full-screen image preview modal
  2. Create `src/components/ui/ChatBubble.js`:
     - Props: `{ message, isOwn }`
     - Renders text + optional image thumbnail
     - Shows timestamp + read receipt
  3. Add chat button to:
     - Customer dashboard: next to service request status
     - Mechanic dashboard: on active job card
     - Garage dashboard: on job queue item
  4. Image upload: reuse existing `POST /api/uploads` endpoint in `src/lib/api.js`

  **Must NOT do**:
  - Don't add video/voice calling (out of scope)
  - Don't implement file upload via WebSocket (use existing API)

  **Parallelization**: Wave 1
  **Blocked By**: Task 5

  **References**:
  - `src/components/ui/ChatWidget.js` — Existing support chat (different purpose, but UI pattern reference)
  - `src/lib/api.js:25-79` — Axios instance with upload support
  - `src/components/ui/Modal.js` — For image preview
  - `src/components/dashboard/ServiceRequestPanel.js` — Where chat button appears

  **Acceptance Criteria**:
  - [ ] ChatPanel renders with header, messages, input
  - [ ] Image upload works (sends to /api/uploads, displays thumbnail)
  - [ ] Chat button appears on active job for both customer and mechanic
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Chat sends text and image
    Tool: Playwright
    Steps:
      1. Open chat for active job
      2. Type and send "Here is the issue"
      3. Click image picker, select a test image
      4. Send
    Expected Result: Both text and image appear in chat
    Evidence: .omo/evidence/clutchd-feature-gap/task-5-chat-ui.png
  ```

  **Commit**: YES (groups with Task 5)
  - Message: `feat(chat): add chat UI components with photo sharing`
  - Files: `src/components/ui/ChatPanel.js`, `src/components/ui/ChatBubble.js`

- [x] 7. **Offline SOS — Cache essential data in IndexedDB**

  **What to do**:
  1. Create `src/lib/offline/offlineCache.js`:
     - Use `idb` (IndexedDB wrapper) or raw IndexedDB
     - Cache schema: `{ vehicles: [...], userProfile: {...}, lastLocation: {lat, lng} }`
     - `cacheVehicleData(data)` — save vehicle info
     - `getCachedVehicles()` — retrieve cached vehicles
     - `cacheUserProfile(profile)` — save name, emergency contact
     - `getCachedUserProfile()` — retrieve
     - `cacheLastLocation(lat, lng)` — save GPS coords
     - `getLastLocation()` — retrieve
  2. Integrate with existing components:
     - `VehicleManagerModal.js` — cache after each API call
     - `src/store/authStore.js` — cache profile on login
     - `src/store/trackingStore.js` — cache last known GPS
  3. Install `idb` package: `npm install idb`

  **Must NOT do**:
  - Don't cache sensitive data (tokens, payments)
  - Don't exceed 5MB storage limit (IndexedDB quota)

  **Parallelization**: Wave 1, can run in parallel with Tasks 1, 5, 8, 9
  **Blocks**: Task 8

  **References**:
  - `src/store/trackingStore.js` — GPS location state
  - `src/store/authStore.js` — User profile
  - `src/components/dashboard/VehicleManagerModal.js` — Vehicle data
  - `src/components/ui/SOSButton.js` — SOS button (will consume cache)

  **Acceptance Criteria**:
  - [ ] `src/lib/offline/offlineCache.js` exists with all cache functions
  - [ ] Vehicle data is cached after fetch
  - [ ] Last known GPS is cached on location update
  - [ ] Cached data survives page reload (in same browser)
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Vehicle data cached
    Tool: Playwright + console
    Steps:
      1. Open customer dashboard
      2. View vehicles
      3. Go offline (devtools)
      4. Check cached vehicle data
    Expected Result: Cached vehicles accessible while offline
    Evidence: .omo/evidence/clutchd-feature-gap/task-6-offline-cache.txt
  ```

  **Commit**: YES
  - Message: `feat(offline): add IndexedDB cache for essential data`
  - Files: `package.json`, `src/lib/offline/offlineCache.js`

- [x] 8. **Offline SOS — Queue requests when offline**

  **What to do**:
  1. Create `src/lib/offline/requestQueue.js`:
     - Queue structure: `{ requests: [{ id, type, payload, createdAt }] }`
     - `enqueueRequest(type, payload)` — save to IndexedDB
     - `getPendingRequests()` — retrieve unsubmitted requests
     - `flushQueue()` — submit all pending, remove on success
     - `retryFailedRequest(id)` — retry a single failed request
     - Use `navigator.onLine` + `window.addEventListener('online', flushQueue)`
  2. Update `src/components/ui/SOSButton.js`:
     - Before sending SOS: check connectivity
     - If offline: `enqueueRequest('SOS', { lat, lon })` + show "SOS queued — will send when online"
     - If online: send immediately via existing `POST /api/service/sos` with `{ lat, lon }` (backend schema: `lat: float, lon: float` — no `lng` or `vehicleId`)
     - Gate API call behind `BackendHealth.isAvailable()` — fall back to offline queue if backend is 503
     - Note: `/api/service/sos` is rate-limited to 5 requests/minute (slowapi). Frontend should debounce button to prevent rapid re-clicks.
     - Add offline indicator on the SOS button (orange instead of red)
  3. Add `window.addEventListener('online', flushQueue)` in root layout or SOS component

  **Must NOT do**:
  - Don't modify the existing SOS button visual when online
  - Don't queue non-essential requests (only SOS and critical actions)

  **Parallelization**: Wave 1
  **Blocked By**: Task 7

  **References**:
  - `src/components/ui/SOSButton.js:1-80` — Current SOS implementation
  - `src/lib/offline/offlineCache.js` — Created in Task 7
  - `src/app/layout.js:46-110` — Root layout for online listener

  **Acceptance Criteria**:
  - [ ] SOS queued when offline shows "SOS queued" message
  - [ ] Queued SOS sent automatically when connectivity returns
  - [ ] SOS button shows different color when offline
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: SOS queues offline, sends on reconnect
    Tool: Playwright
    Steps:
      1. Go offline (devtools offline mode)
      2. Press SOS button
      3. Observe "SOS queued" message
      4. Go online
    Expected Result: SOS request sent automatically on reconnect
    Evidence: .omo/evidence/clutchd-feature-gap/task-7-sos-queue.txt
  ```

  **Commit**: YES (groups with Task 7)
  - Message: `feat(offline): queue SOS requests when offline, flush on reconnect`
  - Files: `src/lib/offline/requestQueue.js`, `src/components/ui/SOSButton.js`

- [x] 9. **Real-time mechanic ETA on customer dashboard**

  **What to do**:
  1. Create `src/components/dashboard/ETAIndicator.js`:
     - Props: `{ mechanicLocation, userLocation, status }`
     - Calculates distance (Haversine formula)
     - Displays: "Mechanic is 2.3 km away (~7 min)" with animated pulse
     - Shows different states: "Searching..." / "Assigned — preparing" / "En route — X min" / "Arrived"
     - Uses CSS variable theming, `role="status"` + `aria-live="polite"`
  2. Integrate into customer dashboard:
     - Add below service status tracker
     - When status is `EN_ROUTE`, show live ETA indicator
     - Update ETA every 5 seconds via WebSocket location updates
  3. Update `src/store/trackingStore.js`:
     - Add `mechanicLocation: { lat, lng } | null`
     - Add `setMechanicLocation(lat, lng)` action
     - Add `estimatedArrival: number | null` (seconds)
     - Add `calculateETA(userLat, userLng, mechLat, mechLng)` — distance/speed calc
     - The existing WebSocket already dispatches `LOCATION_UPDATE` to this store

  **Must NOT do**:
  - Don't use Google Maps Distance Matrix API (no budget)
  - Don't add real-time turn-by-turn navigation (out of scope)

  **Parallelization**: Wave 1, can run in parallel with Tasks 1, 5, 7, 8

  **References**:
  - `src/store/trackingStore.js:1-50` — Existing tracking store
  - `src/lib/socket.js:53-61` — Already handles `LOCATION_UPDATE` → `setMechanicLocation()`
  - `src/components/dashboard/ServiceStatusTracker.js` — Where ETA fits
  - `src/app/dashboard/customer/page.js` — Customer dashboard

  **Acceptance Criteria**:
  - [ ] ETAIndicator shows correct distance and ETA
  - [ ] ETA updates in real-time as mechanic location changes
  - [ ] ETA hidden when not in EN_ROUTE status
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: ETA displays and updates
    Tool: Playwright + simulated WS messages
    Steps:
      1. Set service request to EN_ROUTE
      2. Send LOCATION_UPDATE via WS with mechanic coords
    Expected Result: ETA shows distance and minutes, updates with new coords
    Evidence: .omo/evidence/clutchd-feature-gap/task-8-eta-display.png
  ```

  **Commit**: YES
  - Message: `feat(tracking): add real-time mechanic ETA indicator`
  - Files: `src/components/dashboard/ETAIndicator.js`, `src/store/trackingStore.js`

---

### Wave 2 — Revenue Engine

- [x] 10. **Razorpay — Configure env vars + health gate on existing integration**

  **Context**: `PaymentModal.js` **already has full Razorpay integration** — it loads `https://checkout.razorpay.com/v1/checkout.js`, calls `POST /api/payments/create` to create a Razorpay order, opens Razorpay Checkout, then verifies via `POST /api/payments/verify`. No Stripe SDK install needed. The work here is env config + gating only.

  **What to do**:
  1. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` to `.env.local.example` and `render.yaml`:
     ```env
     NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
     ```
  2. Verify `PaymentModal.js` loads Razorpay checkout script correctly (currently line ~88):
     ```js
     const script = document.createElement('script');
     script.src = 'https://checkout.razorpay.com/v1/checkout.js';
     ```
     If script fails to load (e.g., ad-blocker), fall back to demo auto-payment.
  3. Verify the existing `/payments/create` call in `PaymentModal.js` (line ~93) is gated behind `BackendHealth.isAvailable()`:
     - When backend is 503: skip Razorpay, fall through to demo timer payment
     - When backend is available: use real Razorpay flow
  4. Add `connect-src 'self' https://api.razorpay.com` to `next.config.mjs` Content-Security-Policy (check if already present)
  5. Update `src/lib/backendHealth.js` to include `/payments/create` as a health-check endpoint (ping on mount)

  **Must NOT do**:
  - Don't install Stripe SDK (@stripe packages are not needed)
  - Don't replace the existing Razorpay Checkout flow (it works)
  - Don't remove existing demo-mode auto-payment timer (fallback for 503)
  - Don't commit real Razorpay keys (use env vars)

  **Parallelization**: Wave 2, can run in parallel with Tasks 12, 14
  **Blocks**: Task 11

  **References**:
  - `src/components/dashboard/PaymentModal.js:88-160` — Existing Razorpay Checkout flow
  - `src/components/dashboard/PaymentModal.js:62-84` — Demo auto-payment timer (fallback)
  - `src/lib/api.js` — Axios config
  - `src/lib/backendHealth.js` — Health gate
  - `next.config.mjs` — CSP config

  **Acceptance Criteria**:
  - [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` in `env.local.example`
  - [ ] Razorpay Checkout loads when backend is available AND not in demo mode
  - [ ] Demo auto-payment still works when backend is 503
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Razorpay env var present
    Tool: Bash
    Steps:
      1. grep NEXT_PUBLIC_RAZORPAY_KEY_ID .env.local.example
    Expected Result: Variable documented
    Evidence: .omo/evidence/clutchd-feature-gap/task-10-razorpay-env.txt

  Scenario: Payment falls back to demo when backend 503
    Tool: Playwright
    Steps:
      1. Open PaymentModal (backend returning 503)
      2. Observe Razorpay area
    Expected Result: Demo payment flow used (auto-timer), no Razorpay crash
    Evidence: .omo/evidence/clutchd-feature-gap/task-10-razorpay-fallback.png
  ```

  **Commit**: YES
  - Message: `feat(payment): configure Razorpay env vars and health gating`
  - Files: `env.local.example`, `render.yaml`, `src/components/dashboard/PaymentModal.js`, `src/lib/backendHealth.js`

- [ ] 11. **Razorpay — Health-gate existing payment flow + demo fallback**

  **Context**: `PaymentModal.js` already has the complete Razorpay flow (lines 88-160):
  1. Script load → Razorpay Checkout
  2. `POST /api/payments/create` → get `{ order_id, amount, currency, key_id, payment_id }`
  3. `new window.Razorpay(options)` → user completes payment
  4. `POST /api/payments/verify` → server-side signature verification

  This task adds health gating and graceful degradation.

  **What to do**:
  1. In `PaymentModal.js`, ensure Razorpay flow is gated:
     ```js
     const handleRazorpayCheckout = async () => {
       if (!BackendHealth.isAvailable()) {
         // Fall back to demo auto-payment (existing timer flow)
         startDemoPayment();
         return;
       }
       // Existing Razorpay flow...
     };
     ```
  2. When backend is 503: the existing demo timer (Task 40 fix target) acts as fallback — no Razorpay error
  3. When backend is available: real Razorpay Checkout opens
  4. Add error handling for Razorpay Checkout failures:
     - Payment cancelled by user → clear state, show "Payment cancelled"
     - Network error on verify → retry button
     - Invalid signature → error toast
  5. Ensure the `DEMO_MODE` flag still bypasses Razorpay entirely (existing behavior)

  **Must NOT do**:
  - Don't create a new Stripe service file (Razorpay is already handled inline in PaymentModal)
  - Don't remove demo auto-payment (it's the 503 fallback AND the demo mode behavior)
  - Don't add card storage or tokenization (Razorpay handles compliance)

  **Parallelization**: Wave 2
  **Blocked By**: Task 10

  **References**:
  - `src/components/dashboard/PaymentModal.js:88-160` — Existing Razorpay flow
  - `src/lib/backendHealth.js` — Health check
  - `src/lib/api.js` — Axios instance for API calls

  **Acceptance Criteria**:
  - [ ] Razorpay Checkout opens when backend available AND not in demo mode
  - [ ] Payment succeeds with Razorpay test card
  - [ ] Failed payment shows appropriate error
  - [ ] Demo mode still uses simulated payments (never Razorpay)
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Razorpay payment succeeds (backend available)
    Tool: Playwright + Razorpay test card
    Steps:
      1. Ensure backend available (or mock API)
      2. Open PaymentModal
      3. Complete Razorpay Checkout with test card
    Expected Result: Payment verified, success state shown
    Evidence: .omo/evidence/clutchd-feature-gap/task-11-razorpay-success.png

  Scenario: Demo mode bypasses Razorpay
    Tool: Playwright
    Steps:
      1. Enable demo mode
      2. Open PaymentModal
    Expected Result: Demo timer payment runs (no Razorpay Checkout)
    Evidence: .omo/evidence/clutchd-feature-gap/task-11-demo-bypass.png
  ```

  **Commit**: YES
  - Message: `feat(payment): health-gate Razorpay flow with demo fallback`
  - Files: `src/components/dashboard/PaymentModal.js`

- [ ] 12. **Payment escrow — State machine for service bookings** (requires backend)

  **Context**: Backend uses Razorpay for payment capture. Escrow (hold payment until service completion) is not a built-in Razorpay feature — it requires the backend to delay the transfer. This task builds the UI state machine only; the actual fund release requires `POST /api/payments/transfer` (a backend endpoint).

  **What to do**:
  1. Design escrow UI state machine:
     - Customer pays → status: `PAYMENT_ESCROW` (payment held)
     - Service completed → customer confirms → status: `PAYMENT_RELEASED`
     - Dispute → admin reviews → status: `PAYMENT_DISPUTE`
  2. Update `src/store/serviceStore.js`:
     - Add `PAYMENT_ESCROW`, `PAYMENT_RELEASED`, `PAYMENT_DISPUTE` to status flow
     - Add `paymentId` to active request (from Razorpay payment_id)
     - Add actions: `holdPayment(jobId)`, `releasePayment(jobId)`, `disputePayment(jobId)`
  3. Create `src/components/dashboard/EscrowStatus.js`:
     - Shows escrow state: "Payment held — released on service completion" / "Payment released to mechanic" / "Dispute — under review"
     - Payment release button for customer after service completion
     - **Demo fallback**: When `BackendHealth.isAvailable()` returns false, simulate escrow states locally
  4. Update `ServiceStatusTracker` to include escrow step between PAYMENT_PENDING and COMPLETED

  **Must NOT do**:
  - Don't auto-release payments (customer must confirm)
  - Don't implement Stripe Connect (use Razorpay payment ID tracking)

  **Parallelization**: Wave 2
  **Blocked By**: Tasks 10, 11

  **References**:
  - `src/store/serviceStore.js:87-120` — Existing completeRequest flow
  - `src/components/dashboard/ServiceStatusTracker.js` — Status steps
  - `src/lib/constants.js:10-18` — SERVICE_STATUS enum
  - `src/lib/backendHealth.js` — For gating

  **Acceptance Criteria**:
  - [ ] Escrow state displayed in service tracker
  - [ ] Customer can release payment on completion
  - [ ] Demo fallback works when backend is 503
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Escrow states render correctly
    Tool: Playwright
    Steps:
      1. Create a service request
      2. Set serviceStore escrow state to PAYMENT_ESCROW
    Expected Result: EscrowStatus shows "Payment held in escrow"
    Evidence: .omo/evidence/clutchd-feature-gap/task-12-escrow-ui.png

  Scenario: Release button works in demo mode
    Tool: Playwright
    Steps:
      1. Set service to completed in demo mode
      2. Click release payment
    Expected Result: Escrow state transitions to PAYMENT_RELEASED
    Evidence: .omo/evidence/clutchd-feature-gap/task-12-escrow-release.png
  ```

  **Commit**: YES (groups with Task 11)
  - Message: `feat(payment): add escrow state machine for service bookings`
  - Files: `src/store/serviceStore.js`, `src/components/dashboard/EscrowStatus.js`

- [x] 13. **Subscription plans — Tier UI + pricing display**

  **What to do**:
  1. Create subscription constants in `src/lib/constants.js`:
     ```js
     export const SUBSCRIPTION_PLANS = [
       { id: 'free', name: 'Free', price: 0, features: ['Basic service requests', 'Standard support'] },
       { id: 'plus', name: 'Plus', price: 499, features: ['Priority dispatch', '24/7 support', '5% service discount'] },
       { id: 'pro', name: 'Pro', price: 999, features: ['All Plus features', 'Free annual inspection', '30% parts discount'] },
     ];
     ```
  2. Create `src/components/subscription/PlanCard.js`:
     - Props: `{ plan, isCurrent, onSubscribe }`
     - Shows plan name, price, feature list, CTA button
     - Current plan highlighted
  3. Create `src/components/subscription/SubscriptionManager.js`:
     - Shows all plans in a grid
     - Current subscription status
     - Upgrade/downgrade flow
  4. Create `src/app/marketplace/profile/subscription/page.js`:
     - Route: `/marketplace/profile/subscription`
     - Renders SubscriptionManager
     - Add link in profile menu

  **Must NOT do**:
  - Don't implement recurring billing logic (handled in Task 14)
  - Don't require subscription for basic app usage

  **Parallelization**: Wave 2, can run in parallel with Task 10, 15
  **Blocks**: Task 14

  **References**:
  - `src/lib/constants.js:138-144` — Fee constants pattern
  - `src/app/marketplace/profile/*` — Profile page pattern
  - `src/components/ui/GlassCard.js` — Card component for PlanCard

  **Acceptance Criteria**:
  - [ ] PlanCard renders with name, price, features
  - [ ] SubscriptionManager shows all plans in grid
  - [ ] Subscription page accessible from profile menu
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Subscription page renders all plans
    Tool: Playwright
    Steps:
      1. Navigate to /marketplace/profile/subscription
    Expected Result: All 3 subscription plans displayed in grid
    Evidence: .omo/evidence/clutchd-feature-gap/task-12-subscription-page.png
  ```

  **Commit**: YES
  - Message: `feat(subscription): add subscription plan UI and page`
  - Files: `src/lib/constants.js`, `src/components/subscription/PlanCard.js`, `src/components/subscription/SubscriptionManager.js`, `src/app/marketplace/profile/subscription/page.js`

- [ ] 14. **Subscription plans — Purchase flow** ⚠️ (requires backend — no subscription API exists yet)

  **What to do**:
  1. Create `src/lib/payment/subscriptionService.js`:
     - `createSubscription(priceId)` → `POST /api/subscriptions/create` (backend endpoint does not exist yet — gate with `BackendHealth.isAvailable()`)
     - `cancelSubscription(subscriptionId)` → `POST /api/subscriptions/cancel`
     - `getSubscriptionStatus()` → `GET /api/subscriptions/status`
     - **Demo fallback**: When backend is 503, use `localStorage` to mock subscription state; show badge changes without real payment flow
  2. Wire SubscriptionManager to payment flow:
     - On subscribe: show "Subscription setup will be available when the payment system is online" with a dismissable notice (no backend endpoint)
     - On cancel: confirm dialog, then update local state
     - **Demo fallback**: when `BackendHealth.isAvailable() === false`, use localStorage persistence
  3. Store subscription state in `authStore.js` or create `subscriptionStore.js`
  4. Add subscription-gated features:
     - Plus/Pro users get "Priority" badge on service requests
     - Pro users see discounted prices in marketplace

  **Must NOT do**:
  - Don't implement subscription without backend support (requires new endpoints)
  - Don't gate critical functionality (SOS, basic service requests)

  **Parallelization**: Wave 2
  **Blocked By**: Tasks 10, 13

  **References**:
  - `src/components/dashboard/PaymentModal.js` — Razorpay payment flow (pattern reference)
  - `src/store/authStore.js:257-263` — User data where subscription info goes
  - `src/lib/backendHealth.js` — Health check gating

  **Acceptance Criteria**:
  - [ ] Subscription UI renders (PlanCard, SubscriptionManager)
  - [ ] Subscription purchase flow gates behind backend availability
  - [ ] Current subscription status persists across sessions (demo mode uses localStorage)
  - [ ] Plus/Pro badges show on profile and service requests
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 13)
  - Message: `feat(subscription): add subscription purchase flow with localStorage mock`
  - Files: `src/lib/payment/subscriptionService.js`, `src/store/authStore.js`, `src/components/subscription/SubscriptionManager.js`

- [x] 15. **Invoice PDF — Add fallback for backend invoice download endpoint**

  **Context**: `ServiceHistory.js` **already calls** `GET /api/jobs/history/{job_id}/invoice` (line 50) and downloads the PDF as a blob. The backend generates the PDF server-side using reportlab with full itemized pricing (labor, parts, GST, distance fees, service details). No `jspdf` or client-side PDF generation exists. The only work needed is a fallback for when the backend is 503.

  **What to do**:
  1. Verify `ServiceHistory.js` invoice download works:
     - Currently calls: `api.get('/jobs/history/${jobId}/invoice', { responseType: 'blob' })`
     - Creates download link: `URL.createObjectURL(blob)` → `<a>` click → `window.URL.revokeObjectURL(url)`
     - If backend returns 503: show "Invoice unavailable — try again later" toast instead of crash
     - If backend returns 501 (reportlab not installed): show "Invoice generation not available" message
  2. Add fallback state for when backend is 503 or invoice endpoint returns error:
     - Show "Invoice PDF temporarily unavailable" with retry button
     - Keep the existing inline invoice breakdown in the UI (text version always visible)
  3. Add invoice download button to completed marketplace orders:
     - `POST /api/orders/{order_id}/invoice` or `GET /api/orders/{order_id}/receipt` — check if exists; if not, only show for service history

  **Must NOT do**:
  - Don't install `jspdf` or any client-side PDF library (unnecessary — backend generates PDFs)
  - Don't send invoices via email (no backend email service — see Task 16)

  **Parallelization**: Wave 2, can run in parallel with Tasks 10, 13

  **References**:
  - `src/components/dashboard/ServiceHistory.js:48-55` — Existing invoice download code
  - `~/ClutchD-Backend/backend/app/services/job_service.py` — Backend invoice PDF generation
  - `src/lib/backendHealth.js` — Health check gating

  **Acceptance Criteria**:
  - [ ] Invoice download works from ServiceHistory (backend generating PDF)
  - [ ] When backend is 503, graceful "unavailable" message shown (no crash)
  - [ ] When backend is 501 (reportlab missing), informative message shown
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Invoice downloads when backend available
    Tool: Playwright
    Steps:
      1. Complete a service (mock API)
      2. Go to ServiceHistory
      3. Click download invoice
    Expected Result: PDF file downloads or "unavailable" fallback if backend 503
    Evidence: .omo/evidence/clutchd-feature-gap/task-15-invoice-download.png

  Scenario: Graceful fallback when backend 503
    Tool: Playwright
    Steps:
      1. With backend returning 503, open ServiceHistory
      2. Click download invoice
    Expected Result: "Invoice unavailable — try again later" toast, no console error
    Evidence: .omo/evidence/clutchd-feature-gap/task-15-invoice-fallback.png
  ```

  **Commit**: YES
  - Message: `feat(invoice): add fallback handling for backend invoice endpoint`
  - Files: `src/components/dashboard/ServiceHistory.js`, `src/components/marketplace/OrderHistory.js`

- [ ] 16. **Invoice PDF — Email via client-side mailto: link**

  **Context**: The backend has **no email sending service** — no `smtplib`, SendGrid, or Mailgun integration found. Sending invoices via email requires backend changes that are out of scope. Instead, use a `mailto:` link that opens the user's email client with the invoice data attached or linked.

  **What to do**:
  1. Add "Email Invoice" button to ServiceHistory next to download
  2. On click: prompt for email (pre-filled with user email), open `mailto:` link:
     ```js
     const subject = encodeURIComponent(`Invoice from ClutchD - ${invoiceId}`);
     const body = encodeURIComponent(`Hi,\n\nPlease find your invoice attached.\n\nInvoice: ${invoiceId}\nAmount: ${total}\n\nDownload: ${invoiceUrl}`);
     window.open(`mailto:${email}?subject=${subject}&body=${body}`);
     ```
  3. Show toast notification: "Email client opened — send from your device"
  4. Optionally: copy the invoice download URL to clipboard for pasting into email

  **Must NOT do**:
  - Don't attempt `POST /api/invoices/email` — **this endpoint does not exist** on the backend
  - Don't send invoices server-side (requires new backend infrastructure — out of scope)
  - Don't attach PDF to mailto: (email clients don't support attachments via mailto)

  **Parallelization**: Wave 2
  **Blocked By**: Task 15

  **References**:
  - `src/components/ui/ToastProvider.js` — Toast notification
  - `src/components/dashboard/ServiceHistory.js` — Where email button goes

  **Acceptance Criteria**:
  - [ ] Email button visible on invoice view
  - [ ] Click opens user's email client with pre-filled subject/body
  - [ ] Toast shown confirming email client opened
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 15)
  - Message: `feat(invoice): add email invoice via mailto: link`
  - Files: `src/components/dashboard/ServiceHistory.js`

---

### Wave 3 — User Retention

- [ ] 17. **VIN fitment — Vehicle selector on product pages**

  **What to do**:
  1. Create `src/components/marketplace/VehicleFitmentSelector.js`:
     - Props: `{ productId, onFitmentResult }`
     - Dropdown: "Select your vehicle" → populated from cached vehicles
     - "Check compatibility" button
     - Result display: "✅ Fits your Honda Civic 2020" / "❌ Does not fit your vehicle"
  2. Integrate into `src/app/marketplace/product/[id]/client.js`:
     - Add VehicleFitmentSelector below product details
     - Show only if user has vehicles saved
  3. Create fitment API call in `src/lib/api.js` or new `src/lib/marketplace/fitmentService.js`:
     - `checkFitment(productId, vehicleId)` → `GET /api/products/{id}/fitment?vehicle_id={vehicleId}` (requires backend endpoint)

  **Must NOT do**:
  - Don't show fitment selector if user has no vehicles
  - Don't block purchase based on fitment result (informational only)

  **Parallelization**: Wave 3, can run in parallel with Tasks 19, 21, 23
  **Blocks**: Task 18

  **References**:
  - `src/app/marketplace/product/[id]/client.js` — Product detail page
  - `src/components/dashboard/VehicleManagerModal.js` — Vehicle data source
  - `src/lib/offline/offlineCache.js` — Created in Task 7, cached vehicles

  **Acceptance Criteria**:
  - [ ] VehicleFitmentSelector renders on product page
  - [ ] Shows "Select vehicle" dropdown with user's vehicles
  - [ ] Fitment result displayed after check
  - [ ] Hidden when user has no vehicles
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: VIN fitment check shows result
    Tool: Playwright
    Steps:
      1. Navigate to a product page
      2. Select vehicle from dropdown
      3. Click "Check compatibility"
    Expected Result: Fitment result displayed (compatible or not)
    Evidence: .omo/evidence/clutchd-feature-gap/task-16-fitment.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): add VIN fitment check on product pages`
  - Files: `src/components/marketplace/VehicleFitmentSelector.js`, `src/lib/marketplace/fitmentService.js`

- [ ] 18. **VIN fitment — "Check compatibility" API integration**

  **What to do**:
  1. If backend endpoint exists: wire fitmentService.js to real API
  2. If backend endpoint doesn't exist: create demo/mock fitment data
     - Create `src/data/fitmentData.js` with common make/model/year combos
     - Mock: "Fits your [make] [model] [year]" for matching entries
  3. Add fitment badge on product cards in search results:
     - If user's vehicle is compatible: show small green "Fits your [car]" badge
  4. Add fitment filter in SearchFilters: "Show only parts that fit my vehicle"

  **Must NOT do**:
  - Don't show fake fitment results (use mock data with disclaimer)
  - Don't require backend for fitment to work (mock fallback)

  **Parallelization**: Wave 3
  **Blocked By**: Task 17

  **References**:
  - `src/components/marketplace/SearchFilters.js` — Filter panel
  - `src/components/marketplace/ProductCard.js` — Product card
  - `src/data/` — Existing demo data files

  **Acceptance Criteria**:
  - [ ] Real API endpoint used when available
  - [ ] Mock fallback works when API is unavailable
  - [ ] Compatibility badge shows on product cards
  - [ ] "Only show compatible" filter works
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 17)
  - Message: `feat(marketplace): add fitment API integration and product card badge`
  - Files: `src/lib/marketplace/fitmentService.js`, `src/components/marketplace/ProductCard.js`, `src/components/marketplace/SearchFilters.js`, `src/data/fitmentData.js`

- [ ] 19. **Maintenance reminders — Service interval engine**

  **What to do**:
  1. Create `src/lib/maintenance/maintenanceScheduler.js`:
     - Service intervals (common): oil change (6mo/8k km), tire rotation (10k km), brake check (20k km), etc.
     - `getDueServices(vehicleMileage, vehicleAge, lastServiceDates)` → array of due services
     - `scheduleReminder(serviceType, vehicleId, dueDate)` → save to notificationStore
     - `checkDueServices(vehicles)` → check all vehicles for due services
  2. Create `src/lib/maintenance/maintenanceConstants.js`:
     ```js
     export const MAINTENANCE_SERVICES = [
       { id: 'oil_change', label: 'Oil Change', intervalKm: 8000, intervalMonths: 6 },
       { id: 'tire_rotation', label: 'Tire Rotation', intervalKm: 10000, intervalMonths: 0 },
       { id: 'brake_check', label: 'Brake Inspection', intervalKm: 20000, intervalMonths: 12 },
       { id: 'battery_check', label: 'Battery Check', intervalMonths: 12 },
       { id: 'ac_service', label: 'AC Service', intervalMonths: 24 },
       { id: 'coolant_flush', label: 'Coolant Flush', intervalKm: 40000, intervalMonths: 24 },
     ];
     ```
  3. Integrate with `notificationStore`: when reminder fires, create notification

  **Must NOT do**:
  - Don't send push for every due service (batch into weekly digest)
  - Don't require backend (client-side calculation)

  **Parallelization**: Wave 3, can run in parallel with Tasks 17, 21, 23
  **Blocks**: Task 20

  **References**:
  - `src/store/notificationStore.js` — Notification display
  - `src/components/dashboard/VehicleManagerModal.js` — Vehicle mileage data
  - `src/lib/push/pushService.js` — Push notifications for reminders

  **Acceptance Criteria**:
  - [ ] Maintenance intervals defined for 6+ service types
  - [ ] getDueServices returns correct due items given mileage/age
  - [ ] Reminders create notifications in notificationStore
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Maintenance reminder fires for due service
    Tool: Vitest
    Steps:
      1. Call getDueServices with vehicle at 8500km, 7 months since last oil change
    Expected Result: oil_change is in the due services list
    Evidence: .omo/evidence/clutchd-feature-gap/task-18-maintenance-test.txt
  ```

  **Commit**: YES
  - Message: `feat(maintenance): add service interval engine and reminder scheduling`
  - Files: `src/lib/maintenance/maintenanceScheduler.js`, `src/lib/maintenance/maintenanceConstants.js`

- [ ] 20. **Maintenance reminders — Dashboard alert banner**

  **What to do**:
  1. Create `src/components/dashboard/MaintenanceBanner.js`:
     - Shows at top of customer dashboard when maintenance is due
     - Content: "🔧 Your Honda Civic needs an oil change (overdue by 2 months)" with "Schedule Now" button
     - Dismissable ("Remind me later" — snooze 1 week)
     - Shows max 3 most urgent items
     - Uses CSS variables, role="alert" for accessibility
  2. Add to customer dashboard:
     - Import MaintenanceBanner in `customer/page.js`
     - Render above service request panel
  3. Add maintenance section to vehicle detail view

  **Must NOT do**:
  - Don't show maintenance reminders for vehicles without mileage data
  - Don't block dashboard with maintenance banner (dismissable)

  **Parallelization**: Wave 3
  **Blocked By**: Task 19

  **References**:
  - `src/app/dashboard/customer/page.js` — Customer dashboard
  - `src/components/dashboard/ServiceRequestPanel.js` — Below the banner
  - `src/store/notificationStore.js` — Snooze state

  **Acceptance Criteria**:
  - [ ] MaintenanceBanner shows on customer dashboard when service is due
  - [ ] "Schedule Now" navigates to service request with pre-filled info
  - [ ] "Remind me later" dismisses banner for 1 week
  - [ ] Banner hidden when no services are due
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Maintenance banner appears when service is due
    Tool: Playwright
    Steps:
      1. Check maintenance scheduler for due services
      2. Navigate to customer dashboard
    Expected Result: Banner shows due service with schedule button
    Evidence: .omo/evidence/clutchd-feature-gap/task-19-maintenance-banner.png
  ```

  **Commit**: YES (groups with Task 19)
  - Message: `feat(maintenance): add maintenance reminder banner to dashboard`
  - Files: `src/components/dashboard/MaintenanceBanner.js`, `src/app/dashboard/customer/page.js`

- [ ] 21. **Multi-vehicle dashboard — Vehicle list with per-vehicle history**

  **What to do**:
  1. Create `src/app/dashboard/customer/vehicles/page.js`:
     - Route: `/dashboard/customer/vehicles`
     - Shows all user's vehicles in a grid/list
     - Each vehicle card: make, model, year, license plate, mileage, last service date
     - Click → expanded view with per-vehicle service history
  2. Create `src/components/dashboard/VehicleCard.js`:
     - Props: `{ vehicle, onSelect, onEdit }`
     - Shows vehicle info + service history summary
     - "Schedule service for this vehicle" button
  3. Create `src/components/dashboard/VehicleHistory.js`:
     - Props: `{ vehicleId }`
     - Filters service history by vehicle
     - Shows maintenance timeline
  4. Add navigation: link from customer dashboard sidebar to `/dashboard/customer/vehicles`

  **Must NOT do**:
  - Don't duplicate VehicleManagerModal functionality (edit still uses modal)
  - Don't require backend changes (filter existing history client-side)

  **Parallelization**: Wave 3, can run in parallel with Tasks 17, 19, 23
  **Blocks**: Task 22

  **References**:
  - `src/components/dashboard/VehicleManagerModal.js` — Vehicle CRUD
  - `src/components/dashboard/ServiceHistory.js` — History pattern
  - `src/app/dashboard/customer/page.js` — Dashboard layout

  **Acceptance Criteria**:
  - [ ] `/dashboard/customer/vehicles` renders all vehicles
  - [ ] Vehicle card shows make, model, year, mileage
  - [ ] Per-vehicle service history displays correctly
  - [ ] "Schedule service" pre-fills vehicle info
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Vehicle list shows all user vehicles
    Tool: Playwright
    Steps:
      1. Navigate to /dashboard/customer/vehicles
    Expected Result: All vehicles displayed with service history summary
    Evidence: .omo/evidence/clutchd-feature-gap/task-20-vehicle-dashboard.png
  ```

  **Commit**: YES
  - Message: `feat(vehicles): add multi-vehicle dashboard with per-vehicle history`
  - Files: `src/app/dashboard/customer/vehicles/page.js`, `src/components/dashboard/VehicleCard.js`, `src/components/dashboard/VehicleHistory.js`

- [ ] 22. **Multi-vehicle dashboard — Vehicle switching on service request**

  **What to do**:
  1. Update `src/components/dashboard/ServiceRequestPanel.js`:
     - Add vehicle selector dropdown at top (pre-filled with user's vehicles)
     - Selected vehicle's info (make, model, year, plate) shown
     - "Add vehicle" quick link if no vehicles
  2. Pass `vehicleId` to serviceStore.createRequest() payload
  3. Update `src/app/dashboard/customer/page.js` to pass selected vehicle

  **Must NOT do**:
  - Don't require vehicle selection (can still create request without one)

  **Parallelization**: Wave 3
  **Blocked By**: Task 21

  **References**:
  - `src/components/dashboard/ServiceRequestPanel.js` — Service form
  - `src/store/serviceStore.js:30-37` — createRequest payload

  **Acceptance Criteria**:
  - [ ] Vehicle selector appears on service request form
  - [ ] Selected vehicle info shown in form
  - [ ] Vehicle ID included in request payload
  - [ ] "Add vehicle" link works
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 21)
  - Message: `feat(vehicles): add vehicle selector to service request flow`
  - Files: `src/components/dashboard/ServiceRequestPanel.js`, `src/app/dashboard/customer/page.js`

- [ ] 23. **Warranty — Display warranty terms on booking confirmation**

  **What to do**:
  1. Create `src/lib/warranty/warrantyConstants.js`:
     - Standard warranty terms: "12-month / 12,000-mile warranty on all repairs"
     - Parts warranty: "90-day warranty on parts"
     - Labor warranty: "12-month warranty on labor"
  2. Create `src/components/dashboard/WarrantyDisplay.js`:
     - Props: `{ serviceType, partsIncluded }`
     - Shows on booking confirmation screen
     - Accordion: "🔒 Warranty & Guarantee" with terms
     - Icon + color based on type (emerald for labor, blue for parts)
  3. Add to:
     - Service booking confirmation (after payment)
     - Order confirmation (for marketplace parts)
     - ServiceHistory detail view
  4. Store warranty info on completed service

  **Must NOT do**:
  - Don't make warranty terms configurable by mechanic (standardized)
  - Don't show warranty on cancelled services

  **Parallelization**: Wave 3, can run in parallel with Tasks 17, 19, 21
  **Blocks**: Tasks 24, 25

  **References**:
  - `src/components/dashboard/ServiceStatusTracker.js` — Where warranty info could display
  - `src/app/marketplace/checkout/page.js` — Order confirmation

  **Acceptance Criteria**:
  - [ ] WarrantyDisplay shows on booking confirmation
  - [ ] WarrantyDisplay shows on order confirmation
  - [ ] Warranty terms are clear and accurate
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Warranty terms displayed on booking confirmation
    Tool: Playwright
    Steps:
      1. Complete a service booking
      2. Check confirmation screen
    Expected Result: Warranty section visible with 12-month/12,000-mile terms
    Evidence: .omo/evidence/clutchd-feature-gap/task-22-warranty-display.png
  ```

  **Commit**: YES
  - Message: `feat(warranty): add warranty terms display on booking and order confirmations`
  - Files: `src/lib/warranty/warrantyConstants.js`, `src/components/dashboard/WarrantyDisplay.js`

- [ ] 24. **Warranty — Claims management UI**

  **What to do**:
  1. Create `src/app/marketplace/profile/warranty/page.js`:
     - Route: `/marketplace/profile/warranty`
     - Lists all services/orders with active warranty
     - Shows remaining warranty period
     - "File Claim" button for items within warranty
  2. Create `src/components/warranty/WarrantyClaimForm.js`:
     - Props: `{ serviceId, onSubmitted }`
     - Fields: issue description, photo upload (reuse upload endpoint), preferred resolution (repair/replace/refund)
     - Submits to `POST /api/warranty/claims` (requires backend)
  3. Add warranty claim status tracking:
     - Statuses: submitted → under_review → approved → resolved / rejected
  4. Add to admin panel: `src/app/admin/warranty/page.js` for managing claims
     - List all claims with status
     - Approve/reject workflow

  **Must NOT do**:
  - Don't auto-approve claims (admin review required)
  - Don't process refunds through warranty (separate flow)

  **Parallelization**: Wave 3
  **Blocked By**: Task 23

  **References**:
  - `src/app/admin/disputes/` — Admin dispute pattern (similar workflow)
  - `src/components/ui/FileUpload.js` — Photo upload
  - `src/lib/api.js` — API calls

  **Acceptance Criteria**:
  - [ ] Warranty page lists all items with active warranty
  - [ ] Claim form submits with description + photos
  - [ ] Claim status updates trackable
  - [ ] Admin panel has warranty claims management
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 23)
  - Message: `feat(warranty): add warranty claims management UI and admin panel`
  - Files: `src/app/marketplace/profile/warranty/page.js`, `src/components/warranty/WarrantyClaimForm.js`, `src/app/admin/warranty/page.js`

- [ ] 25. **Warranty — Expiry tracking + renewal reminders**

  **What to do**:
  1. Create warranty expiry tracking in `src/lib/warranty/warrantyTracker.js`:
     - `getWarrantyEndDate(startDate, termMonths)` → end date
     - `getDaysRemaining(endDate)` → days left
     - `isWarrantyActive(endDate)` → boolean
  2. Add warranty expiry notifications:
     - 30 days before: "Your warranty on [service] is expiring soon"
     - On expiry: "Warranty expired — renew or extend"
  3. Create `src/components/dashboard/WarrantyBanner.js`:
     - Shows expiring warranties on dashboard
     - "Extend Warranty" CTA (links to subscription upgrade)
  4. Integrate with NotificationStore + push notifications

  **Must NOT do**:
  - Don't spam notifications (only 30-day + expiry day)

  **Parallelization**: Wave 3
  **Blocked By**: Task 23

  **References**:
  - `src/store/notificationStore.js` — Notification scheduling
  - `src/lib/push/pushService.js` — Push notifications

  **Acceptance Criteria**:
  - [ ] Warranty expiry calculated correctly
  - [ ] 30-day reminder notification fires
  - [ ] Expiry notification fires on the day
  - [ ] WarrantyBanner shows on dashboard
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Tasks 23-24)
  - Message: `feat(warranty): add warranty expiry tracking and renewal reminders`
  - Files: `src/lib/warranty/warrantyTracker.js`, `src/components/dashboard/WarrantyBanner.js`

---

### Wave 4 — Marketplace Depth

- [ ] 26. **BOPIS — Pickup location selector on checkout**

  **What to do**:
  1. Add delivery method toggle to checkout page:
     - Options: "Deliver to address" / "Pick up from store"
     - When "Pick up" selected: show nearby store locations
     - Selection stored in order payload
  2. Create `src/components/marketplace/PickupLocation.js`:
     - Shows list of nearby vendor locations (from vendors data or API)
     - Each location: name, address, distance, hours
     - Selected state with checkmark
     - Map preview with Leaflet (reuse existing map pattern)
  3. Update `src/app/marketplace/checkout/page.js`:
     - Integrate PickupLocation component
     - Pass `deliveryMethod: "pickup" | "delivery"` to orderStore
  4. Update `src/store/orderStore.js`:
     - Add `deliveryMethod` and `pickupLocation` to order payload

  **Must NOT do**:
  - Don't require real-time inventory (show available locations, not stock levels)
  - Don't change delivery flow (address still required for delivery)

  **Parallelization**: Wave 4, can run in parallel with Tasks 28, 30, 32

  **References**:
  - `src/app/marketplace/checkout/page.js` — Current checkout
  - `src/store/orderStore.js:40-84` — placeOrder payload
  - `src/components/dashboard/MapView.js` — Existing Leaflet map pattern

  **Acceptance Criteria**:
  - [ ] Checkout has delivery method toggle
  - [ ] Pickup locations display when "Pick up" selected
  - [ ] Selected pickup location included in order
  - [ ] Map shows pickup locations
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: BOPIS pickup location selected
    Tool: Playwright
    Steps:
      1. Add item to cart
      2. Go to checkout
      3. Select "Pick up from store"
    Expected Result: Pickup locations shown, selection reflected in order
    Evidence: .omo/evidence/clutchd-feature-gap/task-25-bopis.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): add BOPIS pickup location selector on checkout`
  - Files: `src/components/marketplace/PickupLocation.js`, `src/app/marketplace/checkout/page.js`, `src/store/orderStore.js`

- [ ] 27. **BOPIS — Order status flow for pickup orders**

  **What to do**:
  1. Update `src/lib/constants.js` ORDER_STATUSES:
     ```js
     export const ORDER_STATUSES = {
       pending: "Pending",
       confirmed: "Confirmed",
       ready_for_pickup: "Ready for Pickup",
       picked_up: "Picked Up",
       shipped: "Shipped",
       delivered: "Delivered",
       cancelled: "Cancelled",
     };
     ```
  2. Update `src/components/dashboard/ServiceStatusTracker.js` or create `OrderStatusTracker.js`:
     - For BOPIS: shows `confirmed → ready_for_pickup → picked_up`
     - For delivery: shows `confirmed → shipped → delivered`
  3. Add push notification for "Ready for Pickup" status
  4. Add QR code for pickup verification at store:
     - ⚠️ **Do NOT use simple UUID-based QR codes** — these are trivially forgeable
     - Instead, use an **HMAC-signed token**: `HMAC(orderId, secretKey)` encoded in the QR
     - The vendor verifies the signature server-side (or via the frontend using a shared public key)
     - Security trade-off documented: if the public HMAC key is compromised, tokens can be forged; but this is acceptable for MVP since the backend is not deployed

  **Must NOT do**:
  - Don't implement complex QR scanning (show code, manual verification)

  **Parallelization**: Wave 4
  **Blocked By**: Task 26

  **References**:
  - `src/lib/constants.js:208-214` — ORDER_STATUSES
  - `src/components/dashboard/ServiceStatusTracker.js` — Status tracker pattern

  **Acceptance Criteria**:
  - [ ] BOPIS orders show pickup-specific status flow
  - [ ] "Ready for Pickup" triggers push notification
  - [ ] Pickup QR code displayed on order detail
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 26)
  - Message: `feat(marketplace): add BOPIS order status flow with QR pickup`
  - Files: `src/lib/constants.js`, `src/components/dashboard/OrderStatusTracker.js`

- [ ] 28. **Order tracking — Real-time status timeline component**

  **What to do**:
  1. Create `src/components/marketplace/OrderTimeline.js`:
     - Props: `{ status, estimatedDelivery, orderId }`
     - Animated vertical timeline with status steps
     - Each step: icon (circle with check/pending/current), label, timestamp
     - Current step highlighted, completed steps green
     - Final step: checkmark animation on delivery
  2. Integrate into:
     - Order detail page `/marketplace/orders/[id]`
     - Order confirmation page
  3. Add estimated delivery date display to timeline
  4. Create `src/lib/orders/orderTracking.js`:
     - `getTimelineSteps(order)` → array of { status, label, timestamp, completed }
     - `getEstimatedDelivery(order)` → date string

  **Must NOT do**:
  - Don't require real carrier API integration (use order statuses we control)
  - Don't implement real-time GPS for delivery (out of scope)

  **Parallelization**: Wave 4, can run in parallel with Tasks 26, 30, 32
  **Blocks**: Task 29

  **References**:
  - `src/lib/constants.js:208-214` — ORDER_STATUSES
  - `src/components/dashboard/ServiceStatusTracker.js` — Similar pattern

  **Acceptance Criteria**:
  - [ ] OrderTimeline renders all status steps
  - [ ] Current step highlighted, completed steps marked
  - [ ] Estimated delivery date shown
  - [ ] Works for both BOPIS and delivery orders
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Order timeline shows correct status
    Tool: Playwright
    Steps:
      1. Place an order
      2. Navigate to order detail
    Expected Result: Timeline shows confirmed → shipped (or ready) → delivered
    Evidence: .omo/evidence/clutchd-feature-gap/task-27-order-timeline.png
  ```

  **Commit**: YES
  - Message: `feat(orders): add real-time order status timeline component`
  - Files: `src/components/marketplace/OrderTimeline.js`, `src/lib/orders/orderTracking.js`

- [ ] 29. **Order tracking — Notification hooks for status transitions**

  **Context**: Backend already has a full notification system:
  - `GET /api/notifications` — returns `{ notifications: [{ id, title, body, type, read, job_id, created_at }], unread_count: N }`
  - `PATCH /api/notifications/{notif_id}` — body `{ read: bool }` (not `/{id}/read`)
  - `PATCH /api/notifications/read/all` — bulk mark read
  - WebSocket broadcasts `NOTIFICATION_UPDATE` events with `unreadCount`
  
  `NotificationBell.js` already consumes all these endpoints correctly. The existing WebSocket handles real-time pushes. This task adds order-specific notification rules to tie orders into the existing system.

  **What to do**:
  1. Create notification dispatch rules in `src/store/orderStore.js`:
     - When order status changes (via WebSocket `ORDER_UPDATE` or API response):
       - `confirmed` → push notification: "Your order #XXX has been confirmed"
       - `shipped` → "Your order #XXX has been shipped"
       - `ready_for_pickup` → "Your order is ready for pickup"
       - `delivered` → "Your order has been delivered! Rate your purchase"
  2. Use existing `notificationStore.addNotification()` to dispatch (which already triggers push via pushService):
     ```js
     import { useNotificationStore } from '@/store/notificationStore';
     // Inside order status handler:
     useNotificationStore.getState().addNotification({
       title: 'Order Update',
       body: `Your order #${orderId} has been ${status}`,
       type: 'ORDER_UPDATE',
       data: { orderId, status }
     });
     ```
  3. Wire order status listener into the existing WebSocket message handler in `src/lib/socket.js` (handle `ORDER_UPDATE` message type)

  **Must NOT do**:
  - Don't rebuild notification infrastructure (it exists — just consume it)
  - Don't send notifications for internal status changes (only customer-facing ones)

  **Parallelization**: Wave 4
  **Blocked By**: Task 28

  **References**:
  - `src/store/notificationStore.js` — Existing notification store
  - `src/lib/push/pushService.js` — Push integration
  - `src/lib/socket.js` — WebSocket handler (already dispatches notification events)
  - `src/store/orderStore.js` — Order state
  - `src/components/ui/NotificationBell.js:19-68` — Already consumes backend notifications

  **Acceptance Criteria**:
  - [ ] Order status change triggers notification via notificationStore
  - [ ] Order status change triggers push notification (via existing pushService)
  - [ ] Notification content includes order ID and status
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 28)
  - Message: `feat(orders): add order notification hooks via existing notification system`
  - Files: `src/store/orderStore.js`, `src/lib/socket.js`

- [ ] 30. **Vendor comparison — Price comparison table on product detail**

  **What to do**:
  1. Create `src/components/marketplace/VendorComparisonTable.js`:
     - Props: `{ productId }`
     - Table columns: Vendor, Price, Delivery Time, Rating, Stock Status
     - Sorted by price (default) or by rating/delivery
     - Each row: vendor logo/name, price (highlighted lowest), delivery estimate, star rating, "Add to Cart" button
     - Responsive: table on desktop, cards on mobile
  2. Create `src/lib/marketplace/vendorComparisonService.js`:
     - `getVendorsForProduct(productId)` → fetches from `GET /api/products/{id}/vendors` or mock data
  3. Integrate into product detail page:
     - Section: "Compare Prices from Vendors" below product description, above reviews
     - Shows "No other vendors" if single-vendor product

  **Must NOT do**:
  - Don't show fake vendor data (use real API data or empty state)
  - Don't add to cart from comparison table if item already in cart

  **Parallelization**: Wave 4, can run in parallel with Tasks 26, 28, 32

  **References**:
  - `src/app/marketplace/product/[id]/client.js` — Product detail page
  - `src/data/productVendors.json` — Existing demo vendor data
  - `src/components/marketplace/ProductCard.js` — Card pattern

  **Acceptance Criteria**:
  - [ ] VendorComparisonTable renders on product detail
  - [ ] Lowest price highlighted
  - [ ] Sortable by price/rating/delivery
  - [ ] "Add to Cart" works from table
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Vendor comparison shows prices
    Tool: Playwright
    Steps:
      1. Navigate to a product page with multiple vendors
    Expected Result: Price comparison table visible, lowest price highlighted
    Evidence: .omo/evidence/clutchd-feature-gap/task-29-vendor-comparison.png
  ```

  **Commit**: YES
  - Message: `feat(marketplace): add vendor price comparison table on product detail`
  - Files: `src/components/marketplace/VendorComparisonTable.js`, `src/lib/marketplace/vendorComparisonService.js`

- [ ] 31. **Vendor comparison — Filtering and sorting**

  **What to do**:
  1. Create `src/components/marketplace/VendorFilterBar.js`:
     - Sort by: Price (low-high), Price (high-low), Delivery time, Rating
     - Filter by: In-stock only, Brand, Minimum rating
  2. Update vendor list pages to support vendor sorting:
     - Search results can also show lowest price across vendors
     - ProductCard shows "From ₹XXX (3 vendors)" if multi-vendor
  3. Add vendor filter to `SearchFilters.js`

  **Must NOT do**:
  - Don't add vendor filter if only one vendor exists

  **Parallelization**: Wave 4
  **Blocked By**: Task 30

  **References**:
  - `src/components/marketplace/SearchFilters.js` — Existing filters
  - `src/components/marketplace/ProductCard.js` — Price display

  **Acceptance Criteria**:
  - [ ] Vendor filter bar sorts correctly by all options
  - [ ] "In stock only" filter works
  - [ ] Product card shows lowest vendor price + count
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 30)
  - Message: `feat(marketplace): add vendor filtering and sorting`
  - Files: `src/components/marketplace/VendorFilterBar.js`, `src/components/marketplace/SearchFilters.js`, `src/components/marketplace/ProductCard.js`

- [ ] 32. **Mechanic certification badges — Profile display**

  **What to do**:
  1. Create `src/lib/mechanic/certifications.js`:
     - Certification types: ASE (Master, Auto, Truck), Manufacturer (BMW, Toyota, etc.), EV Certification
     - Badge definitions: `{ id, label, icon, color, description }`
  2. Create `src/components/mechanic/CertificationBadge.js`:
     - Props: `{ certification, size?: "sm" | "md" | "lg" }`
     - Renders icon + label in a small colored badge
     - Multiple certifications displayed in a row
  3. Integrate into:
     - Mechanic profile page
     - Provider list (next to mechanic name)
     - Incoming jobs (showing mechanic's certs)
  4. Update `src/lib/validators.js`:
     - Add certification fields to mechanic signup schema

  **Must NOT do**:
  - Don't show unverified certifications (admin must approve)
  - Don't allow mechanics to self-certify (admin verification required)

  **Parallelization**: Wave 4, can run in parallel with Tasks 26, 28, 30

  **References**:
  - `src/components/mechanic/ProfileEditor.js` — Mechanic profile
  - `src/components/dashboard/ProviderList.js` — Provider listings

  **Acceptance Criteria**:
  - [ ] CertificationBadge renders with correct icon/color
  - [ ] Mechanic profile shows certification badges
  - [ ] Provider list shows certification badges
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Mechanic certification badges display on profile
    Tool: Playwright
    Steps:
      1. Navigate to mechanic profile with certifications
    Expected Result: Certification badges visible with correct labels
    Evidence: .omo/evidence/clutchd-feature-gap/task-31-cert-badges.png
  ```

  **Commit**: YES
  - Message: `feat(mechanics): add certification badge component and profile integration`
  - Files: `src/lib/mechanic/certifications.js`, `src/components/mechanic/CertificationBadge.js`

- [ ] 33. **Mechanic certification badges — Admin verification workflow**

  **What to do**:
  1. Create `src/app/admin/certifications/page.js`:
     - Lists mechanics with pending certification verification
     - Shows uploaded cert docs, status
     - Approve/reject with notes
  2. Create `src/components/admin/CertificationReview.js`:
     - Certification detail view
     - Document preview (if PDF/image uploaded)
     - Approve/Reject buttons with reason input
  3. Update mechanic signup to include certification fields:
     - Certification type dropdown
     - File upload for cert document
     - Auto-status: "pending verification"

  **Must NOT do**:
  - Don't auto-approve certifications

  **Parallelization**: Wave 4
  **Blocked By**: Task 32

  **References**:
  - `src/app/admin/kyc/` — KYC verification pattern (similar workflow)
  - `src/components/auth/MechanicFields.js` — Mechanic signup form

  **Acceptance Criteria**:
  - [ ] Admin certification page lists pending verifications
  - [ ] Approve/Reject workflow works
  - [ ] Certified mechanics show badge on profiles
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 32)
  - Message: `feat(admin): add certification verification workflow`
  - Files: `src/app/admin/certifications/page.js`, `src/components/admin/CertificationReview.js`

---

### Wave 5 — Admin Power & Code Polish

- [ ] 34. **Admin analytics — Stat cards from backend + trend charts from mock data**

  **Context**: Backend `GET /api/admin/analytics` returns **aggregate totals only**:
  ```json
  { "totalUsers": 500, "totalJobs": 450, "jobsCompleted": 380, "activeProviders": 92,
    "totalMechanics": 85, "totalGarages": 30, "totalRevenue": 1250000 }
  ```
  There is **no monthly time-series data** (no revenue-per-month, users-per-month). The chart data for trend/area charts must remain mock-generated until a time-series endpoint is added to the backend.

  **What to do**:
  1. Update `src/components/admin/AdminOverview.js` (already exists with basic stat cards):
     - Connect stat cards to real `GET /api/admin/analytics`:
       - `stats.totalUsers` → "Total Users" card
       - `stats.totalRevenue` → "Revenue" card
       - `stats.jobsCompleted` → "Completed Jobs" card
       - `stats.activeProviders` → "Active Providers" card
     - Gate behind `BackendHealth.isAvailable()`:
       - Backend 503: keep existing hardcoded demo values (already present as default state)
       - Backend available: use API response
  2. Create `src/lib/admin/analyticsService.js`:
     - `fetchAnalytics()` → `GET /api/admin/analytics`
     - Keep existing mock data generator for Recharts AreaChart (the one hardcoded `chartData[]` in AdminOverview.js lines ~10-18):
       ```js
       // Mock time-series data for charts (no backend endpoint provides monthly data yet)
       export function getMockChartData() {
         return Array.from({ length: 12 }, (_, i) => ({
           month: new Date(2025, i).toLocaleString('default', { month: 'short' }),
           revenue: Math.floor(Math.random() * 50000) + 20000,
           fees: Math.floor(Math.random() * 10000) + 5000,
         }));
       }
       ```
     - Do NOT create the 3 mock generators the old plan described (that was overbuilt) — keep the existing single `chartData[]` array.
  3. Update `src/app/admin/page.js` to use the service for stat cards (existing chart rendering stays)

  **Must NOT do**:
  - Don't remove the existing mock chart data (no time-series endpoint exists yet)
  - Don't expect monthly revenue/user growth from the current backend (aggregate only)
  - Don't block admin dashboard if analytics API fails (show existing demo defaults)

  **Parallelization**: Wave 5, can run in parallel with Tasks 36, 38, 41-44

  **References**:
  - `src/app/admin/page.js` — Admin dashboard
  - `src/components/admin/AdminOverview.js` — Existing stat cards + chart (Recharts already in use)
  - `src/lib/backendHealth.js` — Health gate
  - `~/ClutchD-Backend/backend/app/api/v1/admin.py:187-207` — GET /admin/analytics

  **Acceptance Criteria**:
  - [ ] Stat cards show real data from backend when available
  - [ ] Stat cards show demo defaults when backend is 503
  - [ ] Recharts AreaChart continues to render with mock monthly data
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Admin stat cards display real backend data
    Tool: Playwright + mock API
    Steps:
      1. Mock GET /api/admin/analytics to return sample data
      2. Login as admin
      3. Navigate to /admin
    Expected Result: Stat cards show the mocked analytics values
    Evidence: .omo/evidence/clutchd-feature-gap/task-34-admin-stats.png

  Scenario: Mock chart data renders
    Tool: Playwright
    Steps:
      1. Login as admin
      2. Navigate to /admin
    Expected Result: AreaChart renders with monthly mock data
    Evidence: .omo/evidence/clutchd-feature-gap/task-34-admin-chart.png
  ```

  **Commit**: YES
  - Message: `feat(admin): connect stat cards to backend analytics, keep mock chart data`
  - Files: `src/components/admin/AdminOverview.js`, `src/lib/admin/analyticsService.js`, `src/app/admin/page.js`

- [ ] 35. **Admin analytics — Exportable reports**

  **What to do**:
  1. Add export buttons to analytics dashboard:
     - "Export as CSV" → downloads revenue/user data as CSV
     - "Export as PDF" → generates report PDF
  2. Create `src/lib/admin/reportExport.js`:
     - `exportCSV(data, filename)` — converts data to CSV, triggers download
     - `exportPDF(reportType, data)` — uses jsPDF to create report
  3. Copy pattern from invoice generation (Task 15)

  **Must NOT do**:
  - Don't export sensitive user data (PII)

  **Parallelization**: Wave 5
  **Blocked By**: Task 34

  **References**:
  - `src/lib/invoice/invoiceGenerator.js` — PDF generation pattern

  **Acceptance Criteria**:
  - [ ] CSV export downloads correctly formatted file
  - [ ] PDF export generates report
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 34)
  - Message: `feat(admin): add exportable CSV and PDF reports`
  - Files: `src/lib/admin/reportExport.js`, `src/components/admin/AnalyticsDashboard.js`

- [ ] 36. **Fleet/B2B — Registration form + dashboard** ⚠️ (requires backend for real submission)

  **What to do**:
  1. Create `src/app/business/register/page.js`:
     - Route: `/business/register`
     - Form fields: Company name, fleet size, contact info, service frequency
     - Submit → `POST /api/fleet/register` (requires backend)
     - Demo fallback: Use existing demo interceptor pattern (`src/lib/demo/apiInterceptor.js`) to mock fleet registration endpoints — add `/api/fleet/*` to the mock routes
  2. Create `src/components/fleet/FleetDashboard.js`:
     - Total vehicles managed
     - Upcoming scheduled services
     - Recent service history
     - Spending summary
  3. Create `src/app/dashboard/fleet/page.js`:
     - Fleet operator dashboard
     - List of vehicles with next service date

  **Must NOT do**:
  - Don't build complex fleet management (MVP: registration + basic dashboard)

  **Parallelization**: Wave 5, can run in parallel with Tasks 34, 38, 41-44

  **References**:
  - `src/app/dashboard/customer/page.js` — Dashboard pattern
  - `src/components/dashboard/ServiceHistory.js` — History pattern
  - `src/lib/demo/apiInterceptor.js` — Demo mock interceptor pattern

  **Acceptance Criteria**:
  - [ ] Fleet registration form renders and submits (demo mock when backend is 503)
  - [ ] Fleet dashboard shows vehicle list
  - [ ] Fleet operator can schedule bulk services (mock when backend is 503)
  - [ ] `npm run build` succeeds

  **Commit**: YES
  - Message: `feat(fleet): add fleet registration and dashboard`
  - Files: `src/app/business/register/page.js`, `src/components/fleet/FleetDashboard.js`, `src/app/dashboard/fleet/page.js`

- [ ] 37. **Fleet/B2B — Bulk booking scheduling** ⚠️ (requires backend)

  **What to do**:
  1. Create `src/components/fleet/BulkScheduleModal.js`:
     - Select multiple vehicles from fleet
     - Choose service type
     - Select date/time window
     - Submit → creates individual service requests for each vehicle
  2. Create `src/lib/fleet/bulkScheduling.js`:
     - `createBulkService(vehicleIds, serviceType, scheduledAt)` → POST /api/fleet/bulk-service
     - Demo fallback: When backend is 503, log the request and show "Bulk booking queued — will be processed when system is online"
  3. Add calendar view for fleet scheduling

  **Must NOT do**:
  - Don't require payment upfront for bulk bookings (invoice later)

  **Parallelization**: Wave 5
  **Blocked By**: Task 36

  **References**:
  - `src/components/dashboard/ScheduleBookingModal.js` — Individual booking pattern

  **Acceptance Criteria**:
  - [ ] Bulk booking modal allows multi-vehicle selection
  - [ ] Service request mock-created for each selected vehicle (or queued when backend is 503)
  - [ ] Calendar shows existing bookings
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 36)
  - Message: `feat(fleet): add bulk booking scheduling`
  - Files: `src/components/fleet/BulkScheduleModal.js`, `src/lib/fleet/bulkScheduling.js`

- [ ] 38. **Payout management — Payout ledger from admin payments endpoint** ⚠️ (requires backend for real data)

  **Context**: There is no dedicated `GET /api/admin/payouts` endpoint. However, `GET /api/admin/payments` (backend `admin.py:311`) returns payment records with: `{ id, jobId, userId, userName, amount, currency, formattedAmount, provider, status, method, createdAt, updatedAt }`. The existing `PaymentsManager.js` already consumes this endpoint. This task creates a filtered payout view from the same data.

  **What to do**:
  1. Create `src/app/admin/payouts/page.js`:
     - Route: `/admin/payouts`
     - Displays processed payments as payout ledger
     - Columns: provider name, amount, formattedAmount, status, method, date
  2. Create `src/components/admin/PayoutLedger.js`:
     - Filterable by status (confirmed, failed, refunded)
     - Sortable by amount, date
     - Search by provider name
     - Export to CSV
  3. Create `src/lib/admin/payoutService.js`:
     - `fetchPayments(filters)` → `GET /api/admin/payments?status=confirmed&limit=50`
     - **Demo fallback**: Generate mock payout data when backend is 503:
       ```js
       export function getMockPayouts() {
         return [
           { id: 1, provider: 'John Auto Repair', amount: 12500, status: 'confirmed', method: 'razorpay', createdAt: '2025-06-15' },
           { id: 2, provider: 'Speedy Mechanics', amount: 8900, status: 'confirmed', method: 'razorpay', createdAt: '2025-06-14' },
         ];
       }
       ```
  4. Note: Backend `payout_service.py` auto-processes payouts after payment capture — no manual processing needed from frontend.

  **Must NOT do**:
  - Don't call `GET /api/admin/payouts` (endpoint doesn't exist)
  - Don't create a `POST /api/admin/payouts/{id}/process` call (not needed — auto-payouts are server-side)
  - Don't allow manual payout amount changes

  **Parallelization**: Wave 5, can run in parallel with Tasks 34, 36, 41-44
  **Blocks**: Task 39

  **References**:
  - `src/app/admin/payments/page.js` — Existing payments page (consumes `/admin/payments`)
  - `src/components/admin/PaymentsManager.js` — Existing payment table pattern
  - `~/ClutchD-Backend/backend/app/api/v1/admin.py:310-351` — GET /admin/payments
  - `~/ClutchD-Backend/backend/app/services/payout_service.py` — Server-side auto-payouts

  **Acceptance Criteria**:
  - [ ] Payout ledger displays payments from backend (filtered by confirmed status)
  - [ ] Search/filter/sort works
  - [ ] CSV export downloads
  - [ ] Mock fallback works when backend is 503
  - [ ] `npm run build` succeeds

  **Commit**: YES
  - Message: `feat(admin): add payout management ledger from payments endpoint`
  - Files: `src/app/admin/payouts/page.js`, `src/components/admin/PayoutLedger.js`, `src/lib/admin/payoutService.js`

- [ ] 39. **Payout management — Payout schedule + status tracking** ⚠️ (requires backend)

  **Context**: Backend `payout_service.py` auto-processes payouts after payment capture — no manual processing is needed. This task adds the frontend display for payout schedules and provider-facing payout status. Settings like frequency and threshold are frontend-only mock until a backend endpoint is added.

  **What to do**:
  1. Create payout schedule UI:
     - Weekly auto-payout (default)
     - Manual payout option for individual providers
     - Minimum payout threshold (₹500 default)
  2. Create `src/components/admin/PayoutScheduleForm.js`:
     - Admin sets: frequency (weekly/bi-weekly/monthly), minimum threshold, processing day
     - Settings saved to localStorage (no backend endpoint exists)
  3. Add status tracking for providers:
     - `src/components/mechanic/EarningsChart.js` — add payout status section (use existing EarningsChart.js, NOT EarningsSummary.js which doesn't exist)
     - Show: "Next payout: July 15" / "Pending payout: ₹2,450"
     - Show payout history with links to ledger (Task 38)

  **Must NOT do**:
  - Don't call `POST /api/admin/payouts/settings` (endpoint doesn't exist — use localStorage)
  - Don't trigger payouts on admin action without confirmation

  **Parallelization**: Wave 5
  **Blocked By**: Task 38

  **References**:
  - `src/components/mechanic/EarningsChart.js` — Mechanic earnings view (NOT EarningsSummary.js — that file doesn't exist)
  - `src/components/admin/PaymentsManager.js` — Admin payments
  - `~/ClutchD-Backend/backend/app/services/payout_service.py` — Server-side auto-payouts

  **Acceptance Criteria**:
  - [ ] Payout schedule configurable from admin (localStorage persistence)
  - [ ] Mechanic sees next payout date and amount
  - [ ] Manual payout option shown (mock when backend is 503)
  - [ ] `npm run build` succeeds

  **Commit**: YES (groups with Task 38)
  - Message: `feat(admin): add payout schedule and provider status tracking`
  - Files: `src/components/admin/PayoutScheduleForm.js`, `src/components/mechanic/EarningsChart.js`

- [ ] 40. **429 rate-limit handling — Axios interceptor with exponential backoff + toast**

  **Context**: The backend uses `slowapi` (in-memory, IP-based rate limiting). Key limits discovered in the backend codebase:
  - `/payments/create`: 5 req/min
  - `/service/sos`: 5 req/min
  - `/service/request`: 10 req/min
  - `/notifications/{notif_id}`: 30 req/min
  - `/notifications/read/all`: 10 req/min
  The frontend `src/lib/api.js` has **no 429 handling** — currently a 429 would show a generic error or crash.

  **What to do**:
  1. Update `src/lib/api.js` axios response interceptor:
     ```js
     // Add 429 retry after current error interceptor
     api.interceptors.response.use(
       (response) => response,
       async (error) => {
         if (error.response?.status === 429) {
           const retryAfter = parseInt(error.response.headers['retry-after'] || '5', 10);
           const maxRetries = 3;
           const config = error.config;
           
           // Initialize retry count
           config.__retryCount = config.__retryCount || 0;
           
           if (config.__retryCount < maxRetries) {
             config.__retryCount += 1;
             // Exponential backoff: retryAfter * 2^attempt seconds
             const delay = retryAfter * Math.pow(2, config.__retryCount - 1) * 1000;
             await new Promise(resolve => setTimeout(resolve, delay));
             return api(config);  // Retry the request
           }
           
           // Max retries exceeded — show toast
           const { useToastStore } = await import('@/store/toastStore');
           useToastStore.getState().addToast({
             type: 'warning',
             title: 'Too many requests',
             message: 'Please slow down — you are being rate-limited.',
             duration: 5000,
           });
         }
         return Promise.reject(error);
       }
     );
     ```
  2. Add `__retryCount` cleanup: ensure config objects don't leak state across requests
  3. Add user-facing indicator for rate limiting:
     - Show toast on 429 after retries exhausted (as shown above)
     - Optionally disable buttons briefly after rate-limited action
  4. Add 429 handling to existing service-level code:
     - In `SOSButton.js`: if `/service/sos` returns 429, debounce the button for 15 seconds

  **Must NOT do**:
  - Don't retry non-idempotent requests (POST payments, POST SOS) without checking
  - Don't silently swallow 429 errors (user must know)
  - Don't retry indefinitely (max 3 retries)
  - Don't add this to the interceptor for non-API calls

  **Parallelization**: Wave 5 (can run in parallel with bug fixes)

  **References**:
  - `src/lib/api.js` — Axios instance with existing interceptors
  - `~/ClutchD-Backend/backend/app/core/rate_limit.py` — Backend rate limit config
  - `src/store/toastStore.js` — Toast notifications
  - `src/components/ui/SOSButton.js` — SOS button (5/min limit)

  **Acceptance Criteria**:
  - [ ] 429 responses trigger retry (up to 3 attempts with exponential backoff)
  - [ ] After retries exhausted, warning toast shown
  - [ ] SOS button debounced after rate-limit engagement
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: 429 triggers retry then toast
    Tool: Playwright + mock API
    Steps:
      1. Mock API to return 429 on first 3 calls, then 200
      2. Call API
    Expected Result: Retry happens, final success
    Evidence: .omo/evidence/clutchd-feature-gap/task-40-429-retry.txt

  Scenario: 429 toast shown after retries exhausted
    Tool: Playwright + mock API
    Steps:
      1. Mock API to always return 429
      2. Call API
    Expected Result: After 3 retries, warning toast displayed
    Evidence: .omo/evidence/clutchd-feature-gap/task-40-429-toast.png
  ```

  **Commit**: YES
  - Message: `fix: add 429 rate-limit handling with exponential backoff retry and toast`
  - Files: `src/lib/api.js`, `src/components/ui/SOSButton.js`

- [ ] 41. **Fix CRITICAL BUG 1 — PaymentModal timer leak**

  **What to do**:
  1. Open `src/components/dashboard/PaymentModal.js`
  2. Find the `useEffect` for demo mode (lines ~62-84):
     ```js
     useEffect(() => {
       if (!isOpen || payState !== "idle") return;
       const isDemo = DEMO_MODE;
       if (!isDemo) return;
       const showTimer = setTimeout(() => {
         setPayState("processing");
         const completeTimer = setTimeout(() => {
           setPayState("success");
           const callbackTimer = setTimeout(() => {
             onSuccess({...});
           }, 1500);
           return () => clearTimeout(callbackTimer); // ❌ BUG
         }, 800);
         return () => clearTimeout(completeTimer); // ❌ BUG
       }, 2000);
       return () => clearTimeout(showTimer); // ✅ correct
     }, [isOpen, payState, method, displayAmount, onSuccess]);
     ```
  3. Fix: Replace nested setTimeout chain with a linear promise chain or async/await:
     ```js
     useEffect(() => {
       if (!isOpen || payState !== "idle") return;
       if (!DEMO_MODE) return;
       let cancelled = false;
       (async () => {
         await delay(2000);
         if (cancelled) return;
         setPayState("processing");
         await delay(800);
         if (cancelled) return;
         setPayState("success");
         await delay(1500);
         if (cancelled) return;
         onSuccess({ method, displayAmount, transactionId: "demo-txn-" + Date.now() });
       })();
       return () => { cancelled = true; };
     }, [isOpen, payState, method, displayAmount, onSuccess]);
     ```
     Where `const delay = ms => new Promise(r => setTimeout(r, ms));`
  4. Also fix `useEffect` dependency array: add `payState` and `method`

  **Must NOT do**:
  - Don't change the visual behavior of demo mode payment simulation
  - Don't remove demo mode functionality

  **Parallelization**: Wave 5 (independent — can run standalone)

  **References**:
  - `src/components/dashboard/PaymentModal.js:62-84` — Bug location
  - Existing code from codebase audit background task

  **Acceptance Criteria**:
  - [ ] setTimeout callbacks no longer return values
  - [ ] All timers cleaned up on unmount (cancelled=true pattern or clearTimeout)
  - [ ] Demo mode payment still works identically
  - [ ] `npm run build` succeeds
  - [ ] `npm run lint` has no warnings about this effect

  **QA Scenarios**:
  ```
  Scenario: Demo mode payment works after fix
    Tool: Playwright
    Steps:
      1. Open PaymentModal in demo mode
      2. Complete payment flow
    Expected Result: Demo payment processes through all states
    Evidence: .omo/evidence/clutchd-feature-gap/task-41-paymentmodal-fix.png

  Scenario: No timer leaks
    Tool: Vitest (component test)
    Steps:
      1. Mount PaymentModal
      2. Start demo payment
      3. Unmount immediately
    Expected Result: No state updates on unmounted component (no console warnings)
    Evidence: .omo/evidence/clutchd-feature-gap/task-41-no-leak.txt
  ```

  **Commit**: YES
  - Message: `fix: PaymentModal demo mode timer leak — replace nested setTimeout with Promise chain`
  - Files: `src/components/dashboard/PaymentModal.js`

- [ ] 42. **Fix CRITICAL BUG 2 — Reconcile duplicate useToast**

  **What to do**:
  1. Compare both files:
     - `src/hooks/useToast.js`: Returns `{ toast: { success, error, info, warning }, dismiss, dismissAll }`
     - `src/components/ui/ToastProvider.js`: Returns `{ toast: addToast, dismiss, clear, success, error, info, warning }`
  2. Decision: Keep `ToastProvider.js` patterns (flat methods) since 5+ components already use it. Remove or re-export from `hooks/useToast.js`.
  3. Fix `hooks/useToast.js`:
     - Either redirect to ToastProvider's hook:
       ```js
       import { useToast as useToastProvider } from "@/components/ui/ToastProvider";
       export const useToast = useToastProvider;
       ```
     - Or align return shape to match ToastProvider
  4. Update all imports:
     - Verify all 5 components using ToastProvider import correctly
     - Update `hooks/useToast.js` comment to clarify it's an alias

  **Must NOT do**:
  - Don't change ToastProvider (it's the primary provider, many depend on it)
  - Don't break existing toast functionality

  **Parallelization**: Wave 5 (independent — can run standalone)

  **References**:
  - `src/hooks/useToast.js:1-30` — Hook to reconcile
  - `src/components/ui/ToastProvider.js:1-40` — Provider to keep
  - Consuming components: ProfileEditor, IncomingJobs, GarageProfile, GarageJobQueue, PaymentModal, UserTable

  **Acceptance Criteria**:
  - [ ] Only ONE source of truth for `useToast`
  - [ ] Both import paths (`@/hooks/useToast` and `@/components/ui/ToastProvider`) return the SAME shape
  - [ ] All existing toast consumers continue to work
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Toast still works after consolidation
    Tool: Playwright
    Steps:
      1. Trigger a toast (e.g., error on login fail)
    Expected Result: Toast notification appears with correct styling
    Evidence: .omo/evidence/clutchd-feature-gap/task-42-toast-fix.png

  Scenario: Both import paths return matching shape
    Tool: Vitest
    Steps:
      1. Import useToast from both paths
    Expected Result: Both exports have the same methods
    Evidence: .omo/evidence/clutchd-feature-gap/task-42-toast-shape.txt
  ```

  **Commit**: YES
  - Message: `fix: reconcile duplicate useToast hooks — align return shapes`
  - Files: `src/hooks/useToast.js`, `src/components/ui/ToastProvider.js`

- [ ] 43. **Fix CRITICAL BUG 3 — MultiSelect bounds check**

  **What to do**:
  1. Open `src/components/ui/MultiSelect.js`
  2. Find every usage of `options[activeIndex]` or `options[selectedIndex]`:
     - Around line where `.value.replace(...)` is called
     - Around line where `.label` is accessed
  3. Add null-safe access:
     ```js
     // BEFORE:
     const activeValue = String(options[activeIndex].value).replace(/\s+/g, '-');
     
     // AFTER:
     const activeOption = options[activeIndex];
     const activeValue = activeOption 
       ? String(activeOption.value).replace(/\s+/g, '-')
       : '';
     ```
  4. Also add bounds checks for any keyboard navigation:
     - ArrowDown at last item → don't wrap (or wrap to first)
     - ArrowUp at first item → don't wrap (or wrap to last)
     - Ensure `activeIndex` is clamped: `Math.max(0, Math.min(index, options.length - 1))`

  **Must NOT do**:
  - Don't change MultiSelect visual behavior
  - Don't break keyboard navigation

  **Parallelization**: Wave 5 (independent — can run standalone)

  **References**:
  - `src/components/ui/MultiSelect.js` — Full file

  **Acceptance Criteria**:
  - [ ] No `Cannot read properties of undefined` error when options is empty
  - [ ] Keyboard navigation clamped to valid bounds
  - [ ] MultiSelect still works correctly with options
  - [ ] `npm run build` succeeds

  **QA Scenarios**:
  ```
  Scenario: Empty options doesn't crash
    Tool: Playwright
    Steps:
      1. Render MultiSelect with empty options array
    Expected Result: Component renders without errors (empty state or placeholder)
    Evidence: .omo/evidence/clutchd-feature-gap/task-43-multiselect-empty.txt
  ```

  **Commit**: YES
  - Message: `fix: add bounds check to MultiSelect activeIndex access`
  - Files: `src/components/ui/MultiSelect.js`

- [ ] 44. **Fix CRITICAL BUG — toCamelCase deduplication**

  **What to do**:
  ⚠️ **Note**: The `backendHealth.js` `_checkInterval` typo mentioned in earlier drafts has been verified as **already fixed** — the current code (`backendHealth.js:4,18,65`) uses `_checkInterval` consistently. No action needed. Only `toCamelCase` dedup remains.

  1. Extract `toCamelCase` to `src/lib/utils.js`:
     ```js
     export function toCamelCase(obj) {
       if (Array.isArray(obj)) return obj.map(toCamelCase);
       if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
         return Object.fromEntries(
           Object.entries(obj).map(([k, v]) => [
             k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
             toCamelCase(v),
           ])
         );
       }
       return obj;
     }
     ```
  2. Update all 5 duplicate locations to import from `@/lib/utils`:
     - `src/store/productStore.js` — remove inline, import from utils
     - `src/store/categoryStore.js` — remove inline, import from utils
     - `src/store/orderStore.js` — remove inline, import from utils
     - `src/app/marketplace/profile/services/page.js` — remove inline, import from utils
     - `src/app/marketplace/profile/orders/page.js` — remove inline, import from utils
  3. Verify all imports resolve correctly

  **Must NOT do**:
  - Don't change the behavior of toCamelCase (pure refactor)
  - Don't break any store that uses it

  **Parallelization**: Wave 5 (can run in parallel within Wave 5 tasks)

  **References**:
  - `src/lib/utils.js` — Where toCamelCase will be added
  - 5 duplicate locations listed above

  **Acceptance Criteria**:
  - [ ] `toCamelCase` exported from `@/lib/utils`
  - [ ] All 5 locations import from `@/lib/utils` instead of inline
  - [ ] `npm run build` succeeds
  - [ ] `grep -r "function toCamelCase" src/ --include="*.js" | grep -v "__tests__" | grep -v "node_modules"` returns only `src/lib/utils.js`

  **QA Scenarios**:
  ```
  Scenario: toCamelCase centralized
    Tool: Bash
    Steps:
      1. grep -rn "function toCamelCase" src/ --include="*.js"
    Expected Result: Only src/lib/utils.js defines toCamelCase
    Evidence: .omo/evidence/clutchd-feature-gap/task-44-tocamelcase-centralized.txt
  ```

  **Commit**: YES
  - Message: `refactor: extract toCamelCase to @/lib/utils, deduplicate 5 copies`
  - Files: `src/lib/utils.js`, `src/store/productStore.js`, `src/store/categoryStore.js`, `src/store/orderStore.js`, `src/app/marketplace/profile/services/page.js`, `src/app/marketplace/profile/orders/page.js`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  - Verify all tasks are complete
  - Verify Must Haves are delivered
  - Verify Must NOT Haves are respected
  - VERDICT: APPROVE/REJECT

- [ ] F2. **Code Quality + Build Verification** — `quick`
  - `npm run build` passes
  - `npm run lint` passes
  - No new vulnerabilities introduced
  - VERDICT: APPROVE/REJECT

- [ ] F3. **Real Manual QA — Playwright End-to-End** — `unspecified-high`
  - Smoke test: Landing, auth, marketplace, dashboard
  - Feature test: Push notification flow, chat, payment modal, SOS offline
  - Regression test: Existing features unaffected
  - VERDICT: APPROVE/REJECT

- [ ] F4. **Scope Fidelity + Backend Integration Check** — `librarian`
  - Verify no backend code was changed
  - Verify backend API is still returning 503 (document if status changed)
  - Confirm no new hardcoded secrets
  - VERDICT: APPROVE/REJECT

---

## Commit Strategy

Recommended commit grouping (squash-friendly per wave):

**Wave 1 (Safety & Engagement — 6 commits):**
1. `feat(push): add FCM push notification infrastructure`
2. `feat(chat): add job-scoped mechanic-customer chat with WebSocket`
3. `feat(offline): add IndexedDB cache and offline SOS queue`
4. `feat(tracking): add real-time mechanic ETA indicator`

**Wave 2 (Revenue Engine — 5 commits):**
5. `feat(payment): configure Razorpay env vars and health gating`
6. `feat(subscription): add subscription plans UI (Stripe recurring aspirational)`
7. `feat(invoice): add PDF invoice download from backend endpoint`

**Wave 3 (User Retention — 5 commits):**
8. `feat(marketplace): add VIN parts fitment check`
9. `feat(maintenance): add service interval reminders`
10. `feat(vehicles): add multi-vehicle dashboard`
11. `feat(warranty): add warranty display and claims management`

**Wave 4 (Marketplace Depth — 4 commits):**
12. `feat(marketplace): add BOPIS pickup option`
13. `feat(orders): add order tracking timeline`
14. `feat(marketplace): add vendor price comparison`
15. `feat(mechanics): add certification badges`

**Wave 5 (Admin & Polish — 6 commits):**
16. `feat(admin): add analytics dashboard with real stats + mock charts`
17. `feat(fleet): add fleet registration and bulk scheduling`
18. `feat(admin): add payout management from payments endpoint`
19. `fix: add 429 rate-limit handling with exponential backoff`
20. `fix: PaymentModal timer leak, MultiSelect bounds`
21. `refactor: deduplicate useToast and toCamelCase`

---

## Success Criteria

### Verification Commands
```bash
npm run build       # Expected: exit 0, no errors
npm run lint        # Expected: exit 0, no errors
npx vitest run      # Expected: exit 0, all tests pass
npx playwright test # Expected: exit 0, all E2E tests pass
```

### Final Checklist
- [ ] FCM push notifications working (foreground toast + background notification)
- [ ] Mechanic-customer chat functional with photo sharing
- [ ] SOS works offline (queued) and online (immediate)
- [ ] Real-time ETA displayed on customer dashboard
- [ ] Razorpay payment flow works (test mode) with health-gated fallback
- [ ] Escrow payment hold/release state machine works
- [ ] Subscription plans visible, purchase flow works
- [ ] Invoice PDF download from backend endpoint works (with graceful 503 fallback)
- [ ] VIN fitment check works on product pages
- [ ] Maintenance reminders fire correctly
- [ ] Multi-vehicle dashboard shows per-vehicle history
- [ ] Warranty displayed on booking confirmation
- [ ] BOPIS pickup location selector works on checkout
- [ ] Order timeline shows correct status
- [ ] Vendor price comparison table renders
- [ ] Mechanic certification badges display
- [ ] Admin analytics stat cards show backend data (mock charts render)
- [ ] Payout management ledger works
- [ ] 429 rate-limit handling retries with toast on exhaustion
- [ ] 4 critical code bugs fixed
- [ ] Backend API status documented (currently 503)
- [ ] No backend code changes made
