# Backend Contracts — Real-Data Wiring Status

Date: 2026-09-11, updated 2026-10-26. Backend OFF during drafting; all EXIST
paths verified against local `/home/dinusus/ClutchD-Backend/backend/app/api/v1/*.py`.
NEW = no local backend route; needs backend work before wiring.

Migration rule (all items): the frontend is real-data-only. Do not reintroduce
local fabricated fallbacks, seeded sample rows, or synthetic success paths.
Where a backend endpoint is missing, surface an honest error or empty state;
local storage may only cache successful API responses.

## 1. EXISTS — wire when backend is on (no backend changes needed)

| Frontend state | Contract | Notes |
|---|---|---|
| cartStore local cart (`backendEnabled=false`) | `GET/POST/PATCH/DELETE /marketplace/cart`, `DELETE /marketplace/cart` (marketplace.py:518-658) | Flip `setBackendEnabled(true)` only after live verify |
| orderStore local order builder | `POST/GET /orders` (marketplace.py:406,464), `POST /marketplace/offers/validate` (:365), socket `STATUS_UPDATE` replaces the local status flow | No synthetic order progress |
| fitment.js | `GET /marketplace/products/{id}/fitment` (marketplace.py:219) | Returns `compatible: null` / `source: "unavailable"` when the API is unreachable |
| ServiceHistory/orders invoice 501 branches | `GET /jobs/history/{job_id}/invoice` → PDF (jobs.py:227-322) | Client-side HTML receipt (src/lib/documentDownload.js) stays as offline fallback; 404 still shows inline breakdown |
| help page ticket submit | `POST/GET /tickets` (tickets.py:21,59) | Surface the real error when down |
| favorites remove | favorites routes exist (favorites.py) | Surface the real error when down |
| auth firebase- fallback | `/auth/login, /signup, /oauth/google, /refresh` (auth.py) | Firebase stays explicit fallback, never silent local login |

## 2. NEW — backend endpoints required first

| Frontend state | Proposed contract | Payload / response |
|---|---|---|
| certificationStore (local only until API exists) | `GET /mechanic/certifications`, `POST /admin/certifications/{id}/verify` | verify: `{status: verified\|rejected}` → updated cert |
| warrantyClaimsStore (backend-first cache) | `POST /warranty/claims`, `PATCH /warranty/claims/{id}` | claim: `{productId, orderId, reason, photos[]}` → `{id, status}` |
| fleet (backend-owned, local cache) | `POST /fleet/register`, `GET /fleet/my-fleet`, `GET/POST /vehicles`, `GET/POST /fleet/bookings` | mirror backend shapes; never seed local rows |
| subscriptions (no endpoints yet) | `POST /subscriptions/create`, `POST /subscriptions/cancel`, `GET /subscriptions/status` | paid create/cancel throw until the API exists; Free stays a client default |
| payoutService | `GET /admin/payouts`, `POST /admin/payouts/manual`, `PUT /admin/payouts/schedule` | backend-only; no local fallback |
| maintenance reminderEngine (local) | `GET /vehicles/{id}/maintenance` or `GET /reminders` | engine stays as offline calculator regardless |
| settings data export | `GET /settings/export` (settings.py has GET/PUT/change-password/delete-account, no export) | server snapshot; local JSON export (src/lib/exportLocalUserData.js) stays as device-data path |
| language switch | none (next-intl is client-side) | No backend needed — wire to src/lib/i18n when prioritized |

## 3. Explicitly out of scope (not synthetic data)

- constants.js pricing/category/brand tables: legit static config, stays.
- themeStore/toastStore localStorage/memory: correct as-is.
- nominatim / ip-api direct fetches: legit third-party, migrate to api.js proxy only if auth/retry needed.
- Edit-profile email disabled: intentional (no change-email flow exists anywhere); do not "fix".
- `product/[id]` `_placeholder` static param: required export-build stub (Capacitor `output:export`); documented in file.
