# Next Steps

## Done (this session)
- `matching.py`: `.format()` → conditional SQL (no injection surface)
- `matching.py`: `_MAX_FALLBACK_ROWS` 2000 → 200
- `payments.py`: Added `Field(ge=100, le=50000000)` to `PaymentCreateRequest` and `CashPaymentRequest`
- `schemas/auth.py`: Password reset code `min_length` 1 → 8

---

## Phase 0 — Critical (ship-blocking)

### 0.1 Idempotency key for payment creation
**Why**: Without idempotency, network retry creates duplicate payment records.
**File**: `backend/app/api/v1/payments.py` — `payment_create`
**How**: Accept `idempotency_key` header/body, check Redis set(NX, EX 86400) before processing.
**Risk**: Low — additive, existing flows untouched.
**Est**: 1h

### 0.2 Payment status webhook signature verification
**Why**: Razorpay webhook currently trusts unverified payloads.
**File**: `backend/app/api/v1/payments.py` — webhook handler
**How**: Validate HMAC-SHA256 signature from `x-razorpay-signature` header.
**Risk**: Low — doesn't affect existing client flows.
**Est**: 1h

### 0.3 Harden OAuth state validation (server-side store)
**Why**: Current validation is length-only (`len(state) < 8`). No replay protection.
**File**: `backend/app/api/v1/auth.py` — `oauth_google`
**How**: Store state hash in Redis on redirect, verify on callback, single-use expiry (5 min).
**Risk**: Low — additive, no existing OAuth flow changes.
**Est**: 1h

---

## Phase 1 — Testing (safety net)

### 1.1 Smoke tests for critical paths
**Target**: Matching, auth (login/signup), payment create, cash payment, WebSocket connect
**File**: `backend/tests/` (new)
**How**: 5 integration tests using `httpx.AsyncClient` + test DB. Only happy paths first.
**Est**: 4h

### 1.2 Contract tests for admin endpoints
**Target**: `GET /admin/users`, `GET /admin/jobs`, `GET /admin/analytics`
**How**: Assert response shape matches frontend expectations. Catches regressions during splitting.
**Est**: 3h

---

## Phase 2 — WebSocket hardening

### 2.1 Migrate auth from query param to `Sec-WebSocket-Protocol`
**Why**: JWT in URL leaks to server logs, referrer headers, browser history.
**Files**:
- `backend/app/main.py` — read token from `sec-websocket-protocol` header
- `src/lib/socket.js` — pass token as protocol: `new WebSocket(url, [token])`
- `backend/app/main.py` — keep query param fallback for 1 version (backward compat)
**Risk**: Medium — coordinated server+client change. Deploy server first, then client.
**Est**: 2h

### 2.2 Add WebSocket connection state to UI
**Why**: No indicator shows the user when real-time updates are disconnected.
**File**: `src/components/layout/` (new `ConnectionStatus` indicator)
**How**: Subscribe to `getConnectionState()`, show subtle dot (green/red/grey) in header.
**Risk**: Low — purely additive UI component.
**Est**: 1h

---

## Phase 3 — Code quality (while safe)

### 3.1 Remove `console.log` from production code
**Why**: 27 `console.log` statements in frontend code. All in `src/` — none in error handlers.
**How**: Replace with `console.warn`/`console.error` for actual warnings, remove debug logs.
**Risk**: Very low — no functional change.
**Est**: 30min

### 3.2 Standardise error responses (backend)
**Why**: Some endpoints return `{"detail": "..."}` (FastAPI default), others return `{"error": "...", "message": "..."}`. Frontend has to handle both.
**How**: Ensure all `HTTPException` calls use consistent shape, or add middleware to normalise.
**Risk**: Low — purely response shape. Test with smoke tests first.
**Est**: 1h

### 3.3 Remove unused imports (backend)
**Why**: Several `from sqlalchemy import select` inside function bodies (shadowing top-level import), dead imports after refactors.
**How**: Run `autoflake --remove-all-unused-imports` on each file, verify.
**Risk**: Very low.
**Est**: 30min

---

## Phase 4 — DevOps & config

### 4.1 GitHub CI — lint + smoke tests on PR
**Why**: No CI exists. Every change is manually verified or untested.
**File**: `.github/workflows/ci.yml` (new)
**How**: `ruff check` + `pyright` on backend, `eslint` on frontend, `python -m pytest` on backend smoke tests (from Phase 1).
**Est**: 2h

### 4.2 Add `output: 'standalone'` to Next.js config
**Why**: Docker image size is 800MB+ without it. With `standalone`, drops to ~150MB.
**File**: `next.config.mjs`
**Risk**: Low — build-time only change.
**Est**: 15min

### 4.3 Remove duplicate `.env.docker` files
**Why**: `.env.docker` and `.env.docker.example` exist in both backend/ and root. Confusing.
**How**: Pick one location, symlink the other.
**Est**: 15min

---

## Phase 5 — Structural (requires testing safety net first)

| Item | Why | Est |
|---|---|---|
| Split `admin.py` (837 lines) into 6 files | Largest file, hardest to maintain | 3h |
| Split `job_service.py` (475 lines) | Pricing + notification extraction | 2h |
| Split `payments.py` (398 lines) | Razorpay/Stripe separation | 2h |
| Extract `LocationIndicator` from `ServiceRequestPanel.js` (369 lines) | Component reusability | 1h |
| Replace `python-jose` with `PyJWT` | `python-jose` is unmaintained | 2h |
| Replace `@next/bundle-analyzer@15` with version compatible with Next.js 16 | Version mismatch warning | 30min |

## Effort summary

| Phase | Items | Estimate |
|---|---|---|
| 0 — Critical | 3 | 3h |
| 1 — Testing | 2 | 7h |
| 2 — WebSocket | 2 | 3h |
| 3 — Code quality | 3 | 2h |
| 4 — DevOps | 3 | 2.5h |
| 5 — Structural | 6 | 10.5h |
| **Total** | **19** | **~28h** |
