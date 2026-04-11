# ClutchD — Full-Featured Production Hardening Plan

Comprehensive upgrade plan to transform ClutchD from MVP to a production-ready, feature-complete on-demand mechanic platform. Based on deep analysis of every file in the codebase and research of competitor apps (Urban Company, MechBuddy, GoMechanic).

---

## Current State Assessment

| Area | Status | Critical Gaps |
|---|---|---|
| **Payments** | Razorpay/Stripe endpoints exist but frontend uses **simulated** `setTimeout` — never calls backend | No real payment flow |
| **Customer Dashboard** | Auto-advances through statuses via **hardcoded `setTimeout`** timers instead of WebSocket events | Fake demo loop |
| **Garage Queue** | 100% **MOCK_JOBS** hardcoded array — never calls backend | Dead UI |
| **Earnings Chart** | Hardcoded `const data = [...]` — no API | Fake data |
| **Availability Toggle** | Local `useState` only — never persists to backend | Non-functional |
| **GarageProfile** | Hardcoded `"SpeedFix Auto Garage"` / `"Suresh Patel"` / `"4.5 (850+ jobs)"` | Fake data |
| **Profile Save** | Both ProfileEditor and GarageProfile "Save" buttons — **do nothing** | Non-functional |
| **Notifications** | None — user must keep the app open to see status updates | Missing feature |
| **Vehicle Management** | No concept of user vehicles — requests are generic | Missing feature |
| **Service History** | No view of past jobs or invoices | Missing feature |
| **Chat** | Phone/Message buttons in ServiceStatusTracker — **do nothing** | Dead buttons |
| **SOS / Emergency** | No roadside emergency feature | Missing feature |

---

## Phase 1: Real Payment Gateway Integration (Razorpay + UPI + GPay + QR)

> [!IMPORTANT]
> The PaymentModal currently **simulates** payment with `await new Promise(r => setTimeout(r, 2000))` and never calls the backend. This is the highest priority fix — money must actually flow.

### Supported Payment Methods

| Method | How It Works | Implementation |
|---|---|---|
| **Google Pay** | Razorpay Checkout auto-detects GPay on device and shows it as a primary option. On web, uses the Web Payments Request API. | Razorpay Checkout JS handles this natively — pass `method: { upi: true, gpay: true }` in options |
| **UPI Intent (PhonePe, Paytm, BHIM)** | Razorpay shows "Pay via UPI app" → deep-links to installed UPI app → user enters PIN → callback | Built into Razorpay Checkout; user picks their UPI app |
| **UPI Collect (Enter VPA)** | User enters their UPI ID (e.g. `user@okaxis`) → gets a collect request on their UPI app | Built into Razorpay Checkout standard flow |
| **QR Code** | Backend generates a dynamic Razorpay QR code via `POST /v1/payments/qr_codes` API → frontend displays it → any UPI app can scan | Custom backend endpoint + frontend QR display |
| **Credit/Debit Card** | Standard Razorpay card flow with 3D Secure | Built into Razorpay Checkout |
| **Cash on Service** | Mechanic confirms cash received → backend marks payment as `manual/cash` | Custom flow, no gateway needed |

### Backend Changes

#### [MODIFY] [config.py](file:///home/dinusus/ClutchD-App/backend/backend/app/core/config.py)
- Add `razorpay_webhook_secret: str | None = None` for webhook signature verification

#### [MODIFY] [payments.py](file:///home/dinusus/ClutchD-App/backend/backend/app/api/v1/payments.py)
- Add `POST /payments/webhook` endpoint for Razorpay async callbacks (`payment.captured`, `payment.failed`)
- Verify webhook signature with `razorpay_webhook_secret`
- Mark job completed on `payment.captured` event
- Add `GET /payments/history` — paginated payment history for the user
- Add `POST /payments/qr` — generates a dynamic Razorpay QR code for a specific job/amount:
  ```python
  qr = razorpay_client.qrcode.create({
      "type": "upi_qr",
      "name": f"ClutchD Job #{job_id_short}",
      "usage": "single_use",
      "fixed_amount": True,
      "payment_amount": amount_in_paise,
      "close_by": unix_timestamp_15min_from_now,
      "notes": {"job_id": str(job_id)}
  })
  # Returns: qr["image_url"] — a live QR code image URL
  ```
- Add `GET /payments/qr/{qr_id}/status` — poll QR payment status (paid/expired)
- Add `POST /payments/cash` — mark payment as cash (mechanic-only, requires job assignment verification)

#### [MODIFY] [schemas/payment.py](file:///home/dinusus/ClutchD-App/backend/backend/app/schemas/payment.py)
- Add `RazorpayCheckoutResponse` schema with `order_id`, `key_id`, `amount`, `currency`
- Add `QRCodeResponse` schema with `qr_id`, `image_url`, `amount`, `expires_at`
- Add `PaymentHistoryResponse` schema with pagination
- Add `CashPaymentRequest` schema with `job_id`

### Frontend Changes

#### [MODIFY] [PaymentModal.js](file:///home/dinusus/ClutchD-App/src/components/dashboard/PaymentModal.js)
- **Remove** `setTimeout` simulation entirely
- **5 payment method tabs:**
  1. **Google Pay / UPI Apps** — Opens Razorpay Checkout with `method.upi = true`. GPay, PhonePe, Paytm show automatically based on device.
  2. **Scan QR Code** — Calls `POST /api/payments/qr` → displays the returned `image_url` as a live QR code → polls `GET /api/payments/qr/{id}/status` every 3s until paid or expired
  3. **Enter UPI ID** — User types VPA (e.g. `name@upi`) → Razorpay sends collect request
  4. **Card** — Standard Razorpay card form (embedded or redirect)
  5. **Cash** — "Confirm cash payment" button (only shown to mechanic side after service completion)
- **Flow:**
  - **Step 1:** Call `POST /api/payments/create` with `provider: "razorpay"` → get `order_id`
  - **Step 2 (UPI/GPay/Card):** Open Razorpay Checkout JS SDK with the `order_id`
  - **Step 2 (QR):** Call `POST /api/payments/qr` → show QR image → poll status
  - **Step 3:** On success callback, call `POST /api/payments/verify` with signature
- Show payment status (pending → processing → success/failed) with animated states
- Add Razorpay branding footer for trust

#### [MODIFY] [constants.js](file:///home/dinusus/ClutchD-App/src/lib/constants.js)
- Update `PAYMENT_METHODS` to:
  ```js
  export const PAYMENT_METHODS = [
    { value: "upi", label: "Google Pay / UPI", icon: "Smartphone", desc: "GPay, PhonePe, Paytm, BHIM" },
    { value: "qr", label: "Scan QR Code", icon: "QrCode", desc: "Scan with any UPI app" },
    { value: "card", label: "Card Payment", icon: "CreditCard", desc: "Visa, Mastercard, RuPay" },
    { value: "cash", label: "Cash", icon: "Banknote", desc: "Pay the mechanic directly" },
  ];
  ```

---

## Phase 2: Fix Customer Dashboard — Real-Time Events Instead of Fake Timers

> [!WARNING]
> The customer dashboard currently auto-advances through all statuses in ~7 seconds using chained `setTimeout` calls (lines 51-78 of customer/page.js). This creates a completely fake demo experience.

#### [MODIFY] [customer/page.js](file:///home/dinusus/ClutchD-App/src/app/dashboard/customer/page.js)
- **Delete the entire `useEffect` block** (lines 51-79) that chains `setTimeout` for status auto-advance
- Status changes should come from **WebSocket `STATUS_UPDATE` events** (already wired in socket.js)
- Add polling fallback: `GET /api/jobs/status/{job_id}` every 30s if WebSocket disconnected
- Add reconnect indicator in the UI when WebSocket is disconnected

#### [MODIFY] [socket.js](file:///home/dinusus/ClutchD-App/src/lib/socket.js)
- Add `sendMechanicLocation(lat, lon)` helper for the mechanic dashboard to push GPS
- Export `getConnectionState()` for UI indicators

---

## Phase 3: Vehicle Management System

Competitor apps (GoMechanic, Urban Company) let users save multiple vehicles. This improves UX and enables targeted service suggestions.

### Backend

#### [NEW] `backend/app/models/vehicle.py`
```python
class Vehicle(Base):
    __tablename__ = "vehicles"
    id, user_id, make, model, year, registration_number,
    fuel_type, color, vin, is_primary, created_at
```

#### [NEW] `backend/app/api/v1/vehicles.py`
- `GET /vehicles` — list user's vehicles
- `POST /vehicles` — add a vehicle
- `PATCH /vehicles/{id}` — update vehicle
- `DELETE /vehicles/{id}` — remove vehicle

#### [MODIFY] [job.py model](file:///home/dinusus/ClutchD-App/backend/backend/app/models/job.py)
- Add `vehicle_id` FK so jobs are linked to a specific vehicle

### Frontend

#### [NEW] `src/components/dashboard/VehicleSelector.js`
- Dropdown/card selector in ServiceRequestPanel to pick which vehicle needs service
- "Add Vehicle" inline form with make/model/year/reg fields
- Visual car cards (icon based on fuel type — Electric, Diesel, Petrol)

#### [MODIFY] [ServiceRequestPanel.js](file:///home/dinusus/ClutchD-App/src/components/dashboard/ServiceRequestPanel.js)
- Add VehicleSelector before issue selection
- Pass `vehicle_id` in the service request payload

---

## Phase 4: Service History & Invoices

### Backend

#### [NEW] `backend/app/api/v1/history.py`
- `GET /history` — paginated list of past jobs with payment, review, mechanic info
- `GET /history/{job_id}/invoice` — generate PDF invoice (via `weasyprint` or similar)

### Frontend

#### [NEW] `src/components/dashboard/ServiceHistory.js`
- Tab on customer dashboard showing past services
- Each entry shows: date, issue, mechanic name, cost, rating given
- "Download Invoice" button per entry
- Filter by date range, status

#### [MODIFY] [customer/page.js](file:///home/dinusus/ClutchD-App/src/app/dashboard/customer/page.js)
- Add tab navigation: "Request Service" | "History"

---

## Phase 5: Notifications (Push + In-App)

### Backend

#### [NEW] `backend/app/models/notification.py`
- `Notification` model: `id, user_id, title, body, type, read, data_json, created_at`

#### [NEW] `backend/app/api/v1/notifications.py`
- `GET /notifications` — paginated list
- `PATCH /notifications/{id}/read` — mark as read
- `POST /notifications/register-device` — save FCM token for push

#### [MODIFY] [ws/manager.py](file:///home/dinusus/ClutchD-App/backend/backend/app/ws/manager.py)
- When pushing status updates, also create a `Notification` DB row
- If user is offline (no WebSocket), queue for push via FCM

### Frontend

#### [NEW] `src/components/ui/NotificationBell.js`
- Bell icon in header with unread count badge
- Dropdown panel showing recent notifications
- Click notification → navigate to relevant job/page

#### [NEW] `src/store/notificationStore.js`
- Zustand store for notifications with `unreadCount`, `fetchNotifications()`, `markRead()`

---

## Phase 6: SOS Emergency Button

Feature from competitor apps (MechBuddy, RSA apps) — one-tap roadside emergency.

### Backend

#### [NEW] `backend/app/api/v1/sos.py`
- `POST /sos` — creates an urgent priority job with auto-location
- Broadcasts to ALL available mechanics within 10km radius
- Sends push notification to nearby mechanics
- Creates a special "emergency" job type with no price negotiation

### Frontend

#### [NEW] `src/components/dashboard/SOSButton.js`
- Floating red circular button on customer dashboard
- Tap → confirmation modal → sends SOS with current GPS
- Animated distress pulse while waiting

---

## Phase 7: Security Hardening (OWASP API Top 10)

> [!CAUTION]
> Multiple critical security gaps identified. These MUST be fixed before any production deployment.

### 7.1 — JWT Token Security

#### [MODIFY] [security.py](file:///home/dinusus/ClutchD-App/backend/backend/app/core/security.py)
| Issue | Fix |
|---|---|
| JWT secret is `"change-me-in-production"` in config.py | Fail-fast: raise `RuntimeError` if default secret detected in non-debug mode |
| Tokens expire in **7 days** — way too long | Reduce to **15 minutes** access token + add refresh token flow |
| No token revocation | Add `token_blacklist` Redis set; check on every request |
| No `iss`/`aud` claims | Add issuer and audience validation |

#### [NEW] `backend/app/api/v1/token.py`
- `POST /auth/refresh` — issue new access token from refresh token
- Refresh tokens stored in `httpOnly` secure cookie (not localStorage)
- Refresh tokens expire in 7 days

### 7.2 — BOLA/IDOR Prevention (OWASP API1)

> [!IMPORTANT]
> The `payments.py` verify endpoint checks `job.user_id != user.id` but the `admin.py` endpoints don't verify that the admin is actually an admin before executing sensitive operations like deleting users.

#### [MODIFY] [admin.py](file:///home/dinusus/ClutchD-App/backend/backend/app/api/v1/admin.py)
- Add `require_admin` dependency to ALL admin routes
- Ensure every resource access uses the authenticated user's ID, never trust client-provided IDs alone

#### [MODIFY] [jobs.py](file:///home/dinusus/ClutchD-App/backend/backend/app/api/v1/jobs.py)
- The `/jobs/assign` endpoint checks `user.role not in (UserRole.admin.value,)` but this allows garage owners through. Tighten to explicit admin-only check.

### 7.3 — Input Validation & Injection Prevention

#### [MODIFY] Multiple files
- Add `max_length` constraints on ALL string schema fields (prevent memory bomb via giant strings)
- Add `Field(ge=0, le=500000)` on amount fields (prevent negative payments)
- Validate lat/lon ranges: `-90 ≤ lat ≤ 90`, `-180 ≤ lon ≤ 180`
- Add `bleach` or regex sanitization on `description` and `comment` fields (prevent stored XSS)

### 7.4 — Rate Limiting Enhancement

#### [MODIFY] [main.py](file:///home/dinusus/ClutchD-App/backend/backend/app/main.py)
- Add per-endpoint rate limits (not just auth):
  - Service requests: 5/minute
  - File uploads: 3/minute
  - Payment creation: 5/minute
  - SOS: 1/minute

### 7.5 — Security Headers

#### [MODIFY] [main.py](file:///home/dinusus/ClutchD-App/backend/backend/app/main.py)
- Add middleware for security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000`
  - `X-XSS-Protection: 1; mode=block`
  - `Content-Security-Policy: default-src 'self'`

### 7.6 — Frontend Security

#### [MODIFY] [api.js](file:///home/dinusus/ClutchD-App/src/lib/api.js)
- Move token from `localStorage` to `httpOnly` cookie (prevents XSS token theft)
- Add CSRF token header on all mutation requests

#### [MODIFY] [authStore.js](file:///home/dinusus/ClutchD-App/src/store/authStore.js)
- Never store the raw JWT in Zustand persist (it's saved to localStorage unencrypted)
- On logout, clear all stores, not just auth

### 7.7 — Database Security

#### [MODIFY] [session.py](file:///home/dinusus/ClutchD-App/backend/backend/app/db/session.py)
- Add `statement_timeout` to prevent long-running queries from locking the DB
- Add `connect_args={"options": "-c statement_timeout=30000"}` (30s timeout)

### 7.8 — Error Information Leakage

#### [MODIFY] [main.py](file:///home/dinusus/ClutchD-App/backend/backend/app/main.py)
- Add a global exception handler that catches unhandled exceptions and returns `500` with generic message in production (instead of full traceback)
- Log the full error server-side but never expose it to the client

---

## Phase 8: Connect Remaining Dead UI Components

### 8.1 — Garage Job Queue (Mock → Real)
#### [MODIFY] [GarageJobQueue.js](file:///home/dinusus/ClutchD-App/src/components/garage/GarageJobQueue.js)
- Remove `MOCK_GARAGE_JOBS` entirely
- Call `GET /api/jobs/incoming` (already built in Phase 1 of hardening)
- `handleAssign` calls real backend `PATCH /api/service/request/{id}/status`

### 8.2 — GarageProfile (Hardcoded → Real Data)
#### [MODIFY] [GarageProfile.js](file:///home/dinusus/ClutchD-App/src/components/garage/GarageProfile.js)
- Remove all hardcoded fallbacks (`"SpeedFix Auto Garage"`, `"Suresh Patel"`, `"4.5 (850+ jobs)"`)
- Read from `user` store object (backend `user_to_frontend_dict` returns garage data)
- "Save" button → `PATCH /api/garage/profile` (needs new backend endpoint)

### 8.3 — Availability Toggle (State → Backend)
#### [MODIFY] [AvailabilityToggle.js](file:///home/dinusus/ClutchD-App/src/components/mechanic/AvailabilityToggle.js)
- On toggle → `PATCH /api/providers/availability` with `{ available: true/false }`
- Backend updates `mechanics.available` column
- Load initial state from `user.available` property

### 8.4 — Earnings Chart (Mock → Real)
#### [MODIFY] [EarningsChart.js](file:///home/dinusus/ClutchD-App/src/components/mechanic/EarningsChart.js)
- Replace `const data = [{ name: 'Mon', earnings: 1200 }, ...]` with API call
- New backend: `GET /api/jobs/earnings?period=week` (aggregates payments for mechanic's completed jobs)

### 8.5 — Profile Save (Noop → Real)
#### [MODIFY] [ProfileEditor.js](file:///home/dinusus/ClutchD-App/src/components/mechanic/ProfileEditor.js)
- "Save Changes" → `PATCH /api/providers/profile` with form data
- Show toast on success/error

---

## Open Questions

> [!IMPORTANT]
> **Payment Provider:** Do you already have a Razorpay merchant account with API keys? If not, I'll implement the flow with test mode keys and a config placeholder. Alternatively, do you prefer Cashfree or PhonePe PG?

> [!IMPORTANT]
> **Push Notifications:** For Firebase Cloud Messaging, do you have a Firebase project set up? This requires a `google-services.json` / `GoogleService-Info.plist` for the mobile app.

> [!IMPORTANT]
> **Priority Order:** Shall I implement all 8 phases sequentially, or would you prefer to prioritize certain phases? My recommendation:
> 1. Phase 7 (Security) + Phase 2 (Fix fake timers) — **Must do first**
> 2. Phase 1 (Payments) + Phase 8 (Dead UI) — **Must do second** 
> 3. Phase 3-6 (New features) — **After core works**

---

## Verification Plan

### Automated
- Backend: Run `pytest` with test cases for each endpoint (auth, payments, jobs, reviews)
- Frontend: Build with `npm run build` — zero errors/warnings
- Security: Run `bandit` (Python static analysis) and `npm audit` on dependencies

### Manual
- Complete user journey test: Customer login → Request service → Real-time tracking → Payment → Review
- Mechanic login → See incoming jobs → Accept → Navigate → Complete
- Garage login → See queue → Dispatch to mechanic → Track progress
- Admin login → KYC approval → Dispute resolution → User management
