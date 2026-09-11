# Backend Contracts — Mock-to-Real Wiring Prep

Date: 2026-09-11. Backend OFF during drafting; all EXIST paths verified
against local `/home/dinusus/ClutchD-Backend/backend/app/api/v1/*.py`.
NEW = no local backend route; needs backend work before wiring.

Migration rule (all items): keep the current local implementation as the
offline fallback behind existing `BackendHealth.isAvailable()` gates.
Do NOT flip `cartStore.backendEnabled`, do NOT remove `initDemoFleet`
seeds, do NOT delete localStorage mocks until the wired path is verified
against the live server.

## 1. EXISTS — wire when backend is on (no backend changes needed)

| Frontend mock | Contract | Notes |
|---|---|---|
| cartStore local cart (`backendEnabled=false`) | `GET/POST/PATCH/DELETE /marketplace/cart`, `DELETE /marketplace/cart` (marketplace.py:518-658) | Flip `setBackendEnabled(true)` only after live verify |
| orderStore `ord-*` local + DEMO timer (useOrderStatusNotifications) | `POST/GET /orders` (marketplace.py:406,464), `POST /marketplace/offers/validate` (:365), socket `STATUS_UPDATE` replaces DEMO_STATUS_FLOW | Keep local order builder as offline fallback |
| fitment.js `source:demo` | `GET /marketplace/products/{id}/fitment` (marketplace.py:219) | Keep demo fallback when `BackendHealth !== true` |
| ServiceHistory/orders invoice 501 branches | `GET /jobs/history/{job_id}/invoice` → PDF (jobs.py:227-322) | Client-side HTML receipt (src/lib/documentDownload.js) stays as offline fallback; 404 still shows inline breakdown |
| help page Demo-mode ticket toast | `POST/GET /tickets` (tickets.py:21,59) | Surface real error instead of success toast when down |
| favorites demo fallback | favorites routes exist (favorites.py) | Same error-surfacing rule |
| auth demo-/firebase- bypass | `/auth/login, /signup, /oauth/google, /refresh` (auth.py) | Firebase stays explicit fallback, never silent local login |

## 2. NEW — backend endpoints required first

| Frontend mock | Proposed contract | Payload / response |
|---|---|---|
| certificationStore (SEED + localStorage) | `GET /mechanic/certifications`, `POST /admin/certifications/{id}/verify` | verify: `{status: verified\|rejected}` → updated cert |
| warrantyClaimsStore (local-first) | `POST /warranty/claims`, `GET /warranty/claims?userId=` | claim: `{productId, orderId, reason, photos[]}` → `{id, status}` |
| fleet (fleetStorage + fleetStore 100% local) | `POST /fleet/register`, `GET/POST /fleet/vehicles`, `GET/POST /fleet/bookings` | mirror local shapes (fv-*, fleet-booking-*) so fallback stays 1:1 |
| subscriptions (always mock) | `POST /subscriptions/create`, `POST /subscriptions/cancel`, `GET /subscriptions/status` | plan id from constants.js SUBSCRIPTION_PLANS (stays as pricing config) |
| payoutService demo ledger | `GET /admin/payouts`, `POST /admin/payouts/manual`, `PUT /admin/payouts/schedule` | keep mock only as 503 fallback |
| maintenance reminderEngine (local) | `GET /vehicles/{id}/maintenance` or `GET /reminders` | engine stays as offline calculator regardless |
| settings data export | `GET /settings/export` (settings.py has GET/PUT/change-password/delete-account, no export) | server snapshot; local JSON export (src/lib/exportLocalUserData.js) stays as device-data path |
| language switch | none (next-intl is client-side) | No backend needed — wire to src/lib/i18n when prioritized |

## 3. Explicitly out of scope (not mocks)

- constants.js pricing/category/brand tables: legit static config, stays.
- themeStore/toastStore localStorage/memory: correct as-is.
- nominatim / ip-api direct fetches: legit third-party, migrate to api.js proxy only if auth/retry needed.
- Edit-profile email disabled: intentional (no change-email flow exists anywhere); do not "fix".
- `product/[id]` `_placeholder` static param: required export-build stub (Capacitor `output:export`); documented in file.
