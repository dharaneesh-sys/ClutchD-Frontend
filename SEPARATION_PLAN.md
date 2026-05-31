# ClutchD App — Backend Separation & Improvement Plan

> This document outlines the step-by-step plan to separate the FastAPI backend into its own repository, connect it with the Next.js frontend via direct URL, and apply all critical/high-priority fixes from `improvements.md`.

---

## Phase 0 — Preparation

### 0.1 Create `.env.docker.example`

- Copy `.env.docker` → `.env.docker.example`
- Replace all secrets (JWT, DB passwords, API keys) with placeholder values
- Add explanatory comments for each variable

### 0.2 Scrub Secrets from Git History

- Install `git-filter-repo` if needed
- Remove `.env.docker` and any other files containing secrets from all history
- Force-push the cleaned history (requires coordination with all collaborators)

### 0.3 Create Backend GitHub Repo

- Create `github.com/<your-username>/clutchd-api` (empty, no README, no license)

---

## Phase 1 — Backend Separation

### 1.1 Extract Backend History

```bash
git subtree split --prefix=backend -b backend-only
```

Creates a new branch `backend-only` with only commits that touched the `backend/` directory.

### 1.2 Push to New Repo

```bash
git remote add backend-origin git@github.com:<username>/clutchd-api.git
git push backend-origin backend-only:main
```

### 1.3 Remove Backend from Frontend Repo

```bash
git rm -r backend/
git commit -m "chore: separate backend into own repository"
```

### 1.4 Add `.gitmodules` (optional — for shared contracts)

If you create a shared types package later, add it as a submodule:
```bash
git submodule add git@github.com:<username>/clutchd-shared.git shared
```

### 1.5 Update Frontend Docker Configuration

**`Dockerfile`:**
- Remove `ARG BACKEND_INTERNAL_URL` and `ENV BACKEND_INTERNAL_URL`
- Keep `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_PORT` as build args
- Default `NEXT_PUBLIC_API_URL` to the production backend URL (e.g., `https://api.clutchd.com`)

**`docker-compose.yml`:**
- Remove `api`, `worker`, `db`, `redis` services
- Remove `fullstack` profile from `frontend` service
- Update `frontend` build args to point to external backend:
  - `NEXT_PUBLIC_API_URL=https://api.clutchd.com` (or localhost for dev)
  - Remove `BACKEND_INTERNAL_URL`
- Remove `pgdata` volume

### 1.6 Update `next.config.mjs`

- Remove the `async rewrites()` block (no longer need to proxy `/backend-api/*` to a local backend)
- Frontend now calls the backend directly via `NEXT_PUBLIC_API_URL`

### 1.7 Update Frontend Constants

**`src/lib/constants.js`:**
- Change `API_BASE_URL` default from `"/backend-api"` to `"http://localhost:8000/api"` (dev fallback)
- Change `WS_URL` default to use the same host but `ws://` protocol:
  ```js
  export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${hostname}:8001/ws`;
  ```

### 1.8 Create Frontend-Only `.env.local.example`

```env
# Point to your local or production backend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8001/ws
```

### 1.9 Update CORS in Backend

Ensure the backend's `CORS_ORIGINS` includes the frontend's production URL (already configured via `cors_origins` setting). No code change needed — just env config.

---

## Phase 2 — Critical Security Fixes

### 2.1 Secrets Scrub + Rotation (already done in Phase 0.2)

- All secrets removed from git history
- Rotate all keys in production after deployment
- Generate new JWT secret: `python -c "import secrets; print(secrets.token_hex(32))"`

### 2.2 JWT Default Secret Check

**File: `backend/backend/app/core/security.py`**

- Hash known default secrets and reject if the current secret matches any known default hash
- Add a startup warning if secret appears to be weak (< 32 chars, common patterns)

### 2.3 Password Reset Brute Force Protection

**File: `backend/backend/app/api/v1/auth.py`**

- Replace 6-digit numeric code with `secrets.token_urlsafe(6)` (8+ alphanumeric chars)
- Implement exponential backoff per email using Redis:
  - Track failed attempts per email: `reset_attempts:{email}` with TTL
  - After 3 failed attempts, lock for 5 minutes
  - After 5 failed attempts, lock for 1 hour
- Rate-limit per email (not just per endpoint)
- Reduce rate limit to `3/minute` for both request and reset endpoints

### 2.4 Admin Audit Trail

**New file: `backend/backend/app/models/audit_log.py`**

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[UUID] = mapped_column(GUID, primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(64))
    entity_type: Mapped[str] = mapped_column(String(64))
    entity_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    before: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(default=func.now())
```

**New decorator: `backend/backend/app/api/audit.py`**

```python
def audit_log(action: str, entity_type: str):
    """Decorator to log admin mutations."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            # Log with user, action, before/after state
            return result
        return wrapper
    return decorator
```

Apply to all admin mutation endpoints: verify mechanic/garage, toggle user status, update dispute, refund, penalize.

### 2.5 Google OAuth State Parameter

**Backend (`auth.py`):** Accept `state` param on OAuth request, verify it matches on callback.

**Frontend (`authStore.js` or `LoginCard.js`):** Generate random state via `crypto.randomUUID()`, store in `sessionStorage`, send with OAuth request.

### 2.6 Redis Authentication

**File: `backend/backend/app/core/config.py`**

- Add `redis_password: str | None = None` to Settings
- Update `redis_url` to optionally include password

**File: `backend/backend/app/core/redis_client.py`**

- Pass password when creating Redis connection:
  ```python
  _client = redis.from_url(
      get_settings().redis_url,
      decode_responses=True,
      password=get_settings().redis_password,
  )
  ```

**File: `.env.docker.example`**

- Add commented-out `REDIS_PASSWORD=your-redis-password`
- Update `REDIS_URL` to `redis://redis:6379/0` with note about password

---

## Phase 3 — High Priority Backend Fixes

### 3.1 Request Body Size Limits

**File: `backend/backend/app/main.py`**

```python
from starlette.middleware.base import BaseHTTPMiddleware

class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):
        super().__init__(app)
        self.max_size = max_size

    async def dispatch(self, request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_size:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=413, content={"detail": "Request too large"})
        return await call_next(request)

app.add_middleware(RequestSizeLimitMiddleware, max_size=10_000_000)
```

### 3.2 Rate Limiter Behind Proxy

**File: `backend/backend/app/core/limiter.py`**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

# Use proxy-aware IP extraction
limiter = Limiter(key_func=get_remote_address)
```

**File: `backend/backend/app/main.py`**

```python
from slowapi.middleware import SlowAPIMiddleware
# SlowAPIMiddleware is already added
# Add ProxyHeadersMiddleware to trust X-Forwarded-For
```

### 3.3 Payout Service

**File: `backend/backend/app/services/payout_service.py`**

- Integrate with Razorpay Payouts API (or Stripe Connect)
- Track payout status in a `Payout` model
- Proper error handling and retry logic

### 3.4 Admin Analytics N+1 Fix

**File: `backend/backend/app/api/v1/admin.py`**

Replace 5 separate `COUNT` queries with a single query using subqueries:

```python
async def analytics(db: DbSession, user: AdminUser):
    from sqlalchemy import text
    row = (await db.execute(text("""
        SELECT
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM jobs WHERE status = 'completed') AS jobs_completed,
            (SELECT COUNT(*) FROM jobs) AS total_jobs,
            (SELECT COALESCE(SUM(amount), 0) FROM payments) AS total_revenue,
            (SELECT COUNT(*) FROM mechanic) AS total_mechanics,
            (SELECT COUNT(*) FROM garage) AS total_garages
    """))).one()
    return {
        "totalUsers": row.total_users,
        "totalJobs": row.total_jobs,
        "jobsCompleted": row.jobs_completed,
        "activeProviders": (row.total_mechanics or 0) + (row.total_garages or 0),
        "totalMechanics": row.total_mechanics,
        "totalGarages": row.total_garages,
        "totalRevenue": row.total_revenue,
    }
```

### 3.5 Rate Limiting on All Endpoints

Add `@limiter.limit()` decorators to these endpoints (currently missing):

| File | Endpoints | Rate Limit |
|------|-----------|------------|
| `service.py` | `/service/request`, `/service/sos` | 10/minute, 5/minute |
| `uploads.py` | `/uploads` | 10/minute |
| `reviews.py` | `/reviews` | 10/minute |
| `admin.py` | All mutation endpoints | 30/minute |
| `matching_routes.py` | `/mechanics/nearby`, `/garages/nearby` | 30/minute |
| `jobs.py` | `/jobs/create`, `/jobs/assign` | 20/minute |
| `providers.py` | `/providers/nearby` | 30/minute |
| `garage_routes.py` | All | 20/minute |
| `vehicles.py` | All CRUD | 20/minute |
| `notifications.py` | All | 20/minute |

### 3.6 Error Response Format Standardization

**New file: `backend/backend/app/schemas/error.py`**

```python
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error: str
    message: str
    status_code: int
```

**File: `backend/backend/app/main.py`**

- Register a global exception handler that catches all HTTPExceptions and unhandled errors
- Return standardized `ErrorResponse` JSON for all errors

### 3.7 WebSocket Horizontal Scaling (Redis PubSub)

**File: `backend/backend/app/ws/manager.py`**

- On initialization, subscribe to Redis PubSub channels:
  - `ws:user:{user_id}` — messages for specific users
  - `ws:job:{job_id}` — messages for specific jobs
- When sending a message, publish to Redis channel AND deliver to local connections
- When receiving from Redis pubsub, deliver to local connections only
- Handle Redis reconnect gracefully

---

## Phase 4 — High Priority Frontend Fixes

### 4.1 JWT to httpOnly Cookie

**Files: `src/store/authStore.js`, `src/lib/api.js`**

- Remove all `localStorage.setItem/removeItem("clutchd_token")` calls
- Store access token in memory (Zustand state, NOT in persist middleware)
- The refresh token is already set as an httpOnly cookie by the backend
- On app init, call `/auth/refresh` to get a fresh access token if the cookie is valid
- Remove token from Axios request interceptor (use store state instead)
- Remove token from `persist` middleware partialize

### 4.2 Error Boundaries Integration

**Files: `src/app/layout.js`**

- Wrap `{children}` with `<ErrorBoundary>` in the root layout

**Files: Admin page**

- Wrap admin dashboard sections with `ErrorBoundary`

### 4.3 SEO Meta Tags

Add `export const metadata` to all pages:
- `src/app/auth/page.js`
- `src/app/dashboard/customer/page.js`
- `src/app/dashboard/mechanic/page.js`
- `src/app/dashboard/garage/page.js`
- `src/app/admin/page.js`
- `src/app/admin/users/page.js`
- `src/app/admin/mechanics/page.js`
- `src/app/admin/garages/page.js`
- `src/app/admin/jobs/page.js`
- `src/app/admin/kyc/page.js`
- `src/app/admin/payments/page.js`
- `src/app/admin/disputes/page.js`

### 4.4 Leaflet CSS Dynamic Import

**File: `src/app/globals.css`**
- Remove `@import "leaflet/dist/leaflet.css";`

**File: `src/components/dashboard/MapView.js`**
- Add dynamic CSS import:
  ```js
  useEffect(() => {
    import("leaflet/dist/leaflet.css");
  }, []);
  ```

### 4.5 Bundle Analysis

**File: `package.json`**
- Add `@next/bundle-analyzer` as dev dependency
- Add analyze script: `"analyze": "ANALYZE=true next build"`

**File: `next.config.mjs`**
- Conditionally enable bundle analyzer:
  ```js
  const withBundleAnalyzer = process.env.ANALYZE === 'true'
    ? (await import('@next/bundle-analyzer')).default({ enabled: true })
    : (config) => config;
  export default withBundleAnalyzer(nextConfig);
  ```

### 4.6 Login Log Endpoint

**File: `src/app/api/login-log/route.js`**
- Remove the endpoint entirely (or disable it)
- The `data/` directory is already in `.gitignore`, but the endpoint still accumulates log entries on disk

---

## Order of Execution

For safety, execute changes in this order:

1. **Phase 0** — Prep work, no code changes
2. **Phase 2 (backend-only fixes)** — Security fixes that don't affect the API contract
3. **Phase 3 (backend-only fixes)** — Backend improvements that don't change API responses
4. **Phase 4 (frontend fixes)** — Frontend improvements (test separately)
5. **Phase 1** — Backend separation (do LAST because it touches git history)

> **Note:** Phase 1 (separation) should be done last because moving the backend to a separate repo will break the monorepo structure. Do all improvements first while everything is in one repo, then separate.

---

## Rollback Plan

If something breaks after any change:

1. **Backend changes:** `git checkout -- backend/` or `git revert <commit>`
2. **Frontend changes:** `git checkout -- src/` or `git revert <commit>`
3. **After separation:** The original monorepo commit is always available via `git reflog`
