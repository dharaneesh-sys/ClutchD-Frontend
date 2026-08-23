# Deploy Sync — Ubuntu Server Parity Checklist

**Purpose:** Bring the real Ubuntu server (currently offline) to parity with this
repo. The local checkout is a **git copy only** — all verification here is local;
nothing in this file has ever run against a live server DB.

## Sync flow

1. Local: commit + push the `clutchd-app-hardening` branch.
2. Server: `git pull` the same branch (backend repo and ClutchD-App repo separately).
3. Server: run this checklist top-to-bottom, in order.

## 1. Environment variables (backend `.env`)

Mirror `backend/.env.example`; Docker path mirrors `docker-compose.yml`:

- [ ] `DATABASE_URL` — PostGIS asyncpg DSN:
      `postgresql+asyncpg://clutchd:<pass>@<host>:5432/clutchd`
- [ ] `SYNC_DATABASE_URL` — plain psycopg DSN (same DB, for sync alembic/scripts)
- [ ] `REDIS_URL` — `redis://<host>:6379/0`
- [ ] `JWT_SECRET_KEY` — **generate a fresh strong secret on the server.**
      NEVER reuse the dev fallback hardcoded in `docker-compose.yml`
      (`${JWT_SECRET_KEY:-950f7a…}`) — that default is a known anti-pattern.
- [ ] `FIREBASE_SERVICE_ACCOUNT` — full service-account JSON as one line
      (empty disables FCM push; offers still work, pushes silently skip)
- [ ] `CORS_ORIGINS` — include the Capacitor/web origins that will call the API
- [ ] `SEARCH_RADIUS_KM=25` (optional override), `DEBUG=false` on server
- [ ] Optional: `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`

## 2. PostGIS extension

The GIST migration (below) checks `pg_extension` and **silently skips** if
PostGIS is absent — so verify explicitly before migrating:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT extname FROM pg_extension WHERE extname = 'postgis';  -- must return 1 row
```

Docker image `postgis/postgis:16-3.4` already ships it; bare-metal PG needs the
extension package installed first. `scripts/bootstrap_db.py:145` also runs
`CREATE EXTENSION IF NOT EXISTS postgis` during seeding.

## 3. Migrations — `alembic upgrade head`

⚠️ **Known multi-head state** (as of branch `clutchd-app-hardening`):
`alembic heads` shows TWO heads — `c2d3e4f5a6b7` (marketplace fitment chain)
and `e4f5a6b7c8d9` (GIST indexes). Plain `alembic upgrade head` errors with
"Multiple head revisions". On the server use:

```bash
cd backend && alembic upgrade heads   # applies BOTH branches
alembic current                        # expect both head revisions stamped
```

(Preferred long-term fix: add an alembic merge revision locally, then plain
`upgrade head` works everywhere.)

**GIST revision `e4f5a6b7c8d9`** (down: `d2e3f4a5b6c7`) creates:

- `idx_mechanics_gist` ON mechanics USING gist ((ST_SetSRID(ST_MakePoint(lon, lat), 4326)))
- `idx_garages_gist`   ON garages   USING gist ((ST_SetSRID(ST_MakePoint(lon, lat), 4326)))

This migration has **never been applied to any live DB yet** — the first
server-side upgrade is its debut. Verify after:

```sql
SELECT indexname FROM pg_indexes WHERE indexname IN ('idx_mechanics_gist','idx_garages_gist');
```

Expression-only indexes; float columns untouched. Idempotent (`IF NOT EXISTS`),
skips gracefully without PostGIS (don't accept that skip in production).

## 4. Seed data & issue→expertise tag mapping

Discovery dispatch filters providers by expertise derived from issue tags
(`ISSUE_TO_EXPERTISE`, single-sourced in `app/services/matching.py`, mirrored by
frontend `src/lib/constants.js`). Current mapping: `flat_tire→tires`,
`engine_failure→engine`, `battery_dead→battery`, `overheating→engine`,
`brake_issue→brakes`, `oil_leak→oil`, `electrical→electrical`,
`ac_not_working→ac`, `transmission→transmission`, `starting_issue→engine`,
`noise→diagnostics`, `other→null`.

Seed rows predate the mapping — **reseed** so provider expertise tags line up:

```bash
cd backend && python scripts/bootstrap_db.py
```

Seeds cover Coimbatore (~11.01, 76.95); smoke-test discovery from those coords,
not Delhi.

## 5. `docker compose up --build` verify steps

```bash
docker compose up --build -d          # db(postgis:16-3.4) redis api worker
docker compose ps                     # api healthcheck green (/health)
curl -fsS http://localhost:8001/health
curl -fsS "http://localhost:8001/api/providers/nearby?lat=11.01&lng=76.95"
```

Ports: db 5434→5432, redis 6380→6379, api 8001→8000. Worker runs celery
(`CELERY_RESULT_BACKEND=rpc://` if you see `No module named 'memory'` errors).
Then run §3 migrations against the compose DB and re-curl `/api/providers/nearby`.

## 6. Frontend release build (Capacitor Android)

ClutchD-App is a **Capacitor Android app**; the web build wraps into the APK.
Release builds MUST point at the server URL, not localhost:

- `NEXT_PUBLIC_API_URL=https://clutchd.tail14cfb9.ts.net/api` (Tailscale Funnel →
  Caddy :8080 → uvicorn :8000) — already set in local `.env.local`; confirm on
  the build machine before `npm run build && npx cap sync android`.
- After the server IP/hostname changes, update this var FIRST — stale base URLs
  are the #1 transfer-breaker.

## Known follow-ups (out of current scope)

- The docker compose path above was **never exercised locally** (daemon
  sudo-gated on the dev workstation); Task 14's runtime smoke used a
  uvicorn+SQLite rig instead. First server run may surface compose-only issues.
- ~20 frontend files still carry legacy demo/localStorage fallback machinery
  (`fleetStorage.js` demo mode, `warrantyClaimsStore` localStorage fallback,
  `payoutService`, `subscriptionService`, `certificationStore`, …) flagged for a
  future purge pass — deferred by user decision; product code added since the
  no-mock directive contains none of it.

## Cross-references

- Button/endpoint audit: `ClutchD-App/docs/button-audit.md` (commit 12a6fa7)
- Backend dead-code decisions: header note in
  `backend/app/api/v1/matching_routes.py` + DEPRECATED block on
  `assign_job_auto` in `backend/app/services/job_service.py`
