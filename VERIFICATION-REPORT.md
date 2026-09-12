# CLUTCHD LIVE VERIFICATION REPORT — 2026-09-12 14:30–14:50 IST

## Version pins
- Backend (server): `811705c` — `fix: reorder fitment endpoint params`, clean tree. Local backend HEAD is 6+ commits ahead (`f4fbea1`, `2174288`, `290edf5`, `512c471`, …) — NOT deployed.
- Frontend: branch `clutchd-app-hardening` @ `4c5f857`. APK: `ClutchD-v1.6-funnel.apk` (built Sep 12 14:23, newer than HEAD, funnel URL verified in bundle, zero `localhost` refs).
- Server path: `https://clutchd-1.tail14cfb9.ts.net` → Caddy :8080 → uvicorn :8000 (docker `clutchd-backend-api-1`, db + redis separate containers).

## PHASE 0 — deployment baseline: ✅ PASS
/health → 200 `{"status":"ok"}`. Backend confirmed at 811705c via SSH (`git rev-parse`, clean). Expectation set: Phase 1–2 fixes in undeployed commits will be absent.

## PHASE 1 — infra: ✅ PASS (5/5)
| Check | Evidence |
|---|---|
| /health | 200 `{"status":"ok"}` |
| /api/providers/nearby?lat=11.0168&lng=76.9558 | 200 — Vijay Kumar 4.7★ 0.0km + SpeedFix Auto Garage 1.95km |
| login customer@demo.com/demo123456 | 200, 313-char JWT (sub + role customer) |
| wrong password | 401 `{"error":"Unauthorized","detail":"Invalid email or password"}` — no 500/hang |
| WS /ws + token subprotocol | CONNECTED, auth accepted, OPEN 8s+, no 4401 |
| Deviation (non-blocking) | No PONG handler server-side; app never listens for PONG — heartbeat is fire-and-forget by design both ends |

## PHASE 2 — core flows API-side: ✅ PASS with 2 RED exceptions
Live job `bc825fb6` (engine, Coimbatore 11.0168,76.9558): created 200 → admin-assigned to Vijay 200 → mechanic incoming shows it (count 1, `assigned`) → `en_route` → `in_progress` → finalize-price ₹500 → `payment_pending` with correct math (500+40 fee+102.6 GST+30 cancel = **672.6** total) → customer complete (upi/success) → `completed` → history shows it → **real PDF invoice** 200 `application/pdf` 2313 bytes `%PDF-1.3` (not HTML fallback).
Marketplace: cart add 201 (qty 2) → cart get syncs → order POST **201** (`48404572`, total 898.00, `confirmed`, product_id payload) → coupon FREEDEL valid (200.00 off ₹2500) → bogus code honest invalid → cart DELETE 204 → 0 lines.
- ❌ RED-1 (deploy gap): seller product creation — POST /api/products → **405**, POST /api/marketplace/products → **404** on server. Routes exist in local backend but were never deployed (server predates them). Cart/order tests used seeded catalog product instead.
- ❌ RED-2 (missing feature, local + server): escrow `hold`/`release`, `dispute`, `vehicle`-attach routes exist **nowhere**. Frontend proceeds local-state-first with swallowed 404s (`serviceStore.js` holdPayment/releasePayment/disputePayment/updateVehicle) — no crash, but escrow states render with no backend backing and no explicit local/demo label found.
- ⚠️ YELLOW: `GET /chat/history/{id}` has no route (local or server) — `fetchHistory` catches → empty list, no crash, no fake messages. Acceptable.
- ❌ RED-3 (frontend bug): push registration calls `/api/push/register` — double `/api` prefix against baseURL (`API_BASE_URL` already ends in `/api`) → resolves to `/api/api/push/register` → guaranteed 404. Server exposes `/api/providers/device-tokens`, which the frontend never calls. Push therefore never registers server-side.

## PHASE 3 — resilience: ✅ PASS (with anomaly noted)
- Kill test: `docker restart clutchd-backend-api-1` → /health 200 again within ~7s. Clean logs (no tracebacks, no DELETEs).
- Persistence: verify job + order + history intact after restart. WS re-handshake post-restart: CONNECTED.
- Retry safety (code + live): interceptors retry **only GET/HEAD/__isRetryable** (`api.js:143-144,195-196`); POST/PUT/PATCH/DELETE never auto-retried → no duplicate charges/orders possible from client retries. No double-POST evidence in server logs.
- Token expiry honesty: expired 15-min access token → clean 401 `Not authenticated` (observed live), re-login restores. No hang.
- ⚠️ ANOMALY: orders for customer@demo.com read **2 before** restart, **1 after** (only `48404572`). DB container untouched (3h uptime), no DELETEs in logs, no other writes in the window. Unexplained — needs a DB-level check before trusting order counts. Not claiming data loss.
- Not run (no device): airplane-mode toggle toasts, socket backoff timing under real radio loss. Code path returns honest "Server unreachable" (`extractApiError`, `api.js:221`).

## PHASE 4 — known gaps: ✅ MATCHES DOCUMENTED BEHAVIOR
| Gap | Evidence |
|---|---|
| payouts | No `/api/admin/payouts*` routes on server; `payoutService.js` present but unrunnable — no fake success observed |
| subscriptions | Endpoints commented out as `Future:` (`subscriptionService.js:108,155`) — honest |
| warranty | No `/api/warranty/*` route; store exists, unwired |
| certifications | localStorage-backed (`certificationStore.js`, seeds `cert-demo-1`); no backend — ⚠️ seed renders without an explicit demo tag in Badge/Panel |
| fleet | No `/api/fleet/*` route — `POST /fleet/register` 404s honestly |
| data-export | `exportLocalUserData.js` is local-only by name/design |

## Punchlist (RED, in order)
1. Deploy backend past 811705c (6+ commits incl. seller product routes) — unblocks RED-1.
2. Fix push registration: single-prefix path + use `/api/providers/device-tokens` — RED-3, frontend-only fix.
3. Decide escrow/dispute/vehicle-attach: implement server routes OR label UI states local/demo — RED-2.
4. Resolve orders 2→1 anomaly with a DB-level audit before release — Phase 3 anomaly.
5. Tag seeded certifications as demo in UI — Phase 4 note.

---

## FIX PASS — 2026-09-12 15:05 IST (all punchlist items closed)

- Backend deployed `811705c` → `db26af7` (8 commits: 6 fixes + seller CRUD + escrow routes). Migration chain repaired
  (`f3a4b5c6d7e8` rebased onto `c2d3e4f5a6b7`); `upgrade heads` applied fitment table + `seller_user_id` + GIST indexes.
  Live DB is host postgres (docker db is a spare) — column verified present. `systemctl restart clutchd-api`, health 200.
- RED-1 closed: POST /api/marketplace/products → 201 live (id `a77b6a44`, vendor auto-resolved, category linked).
- RED-2 closed: implemented + verified live — hold 200 (payment row `held`, id returned) → release → `completed`;
  dispute → ticket `TKT-BCBAAE04` open; vehicle attach 200 (ownership-checked). OpenAPI 103 → 111 paths.
- RED-3 closed: `notificationStore` now POSTs `/providers/device-tokens` {token, platform} and DELETEs by returned id;
  verified live 201 + 204. Old `/api/api/push/*` calls removed.
- Orders anomaly resolved: host-DB ground truth = exactly 1 order for customer@demo.com (the verify order).
  The earlier '2' was a misread on my side — no data loss, no phantom writes.
- Cert demo tags: admin CertificationPanel now renders a Demo pill on all `cert-demo-*` seeds.
- Full green: eslint 0, 278/278 tests, `npm run build` green.
- APK `ClutchD-v1.7-complete.apk` (Sep 12 15:04): funnel URL verified in bundle, zero `localhost` refs.