# Database Migration Setup — ClutchD-Backend

## Goal
Make database schema changes easy and safe by setting up Alembic with full environment support and convenience scripts. Any developer can change a model, generate a migration, and apply it in seconds — whether running locally, in Docker, or in production on Render.

## What Was Done

| # | Change | File | Detail |
|---|--------|------|--------|
| 1 | **Env-aware DB URL** | `backend/alembic.ini` | Commented; `env.py` overrides `sqlalchemy.url` from `DATABASE_URL` env var when set |
| 2 | **Env var reading** | `backend/migrations/env.py` | Reads `DATABASE_URL` — works in Docker, Render, local dev without editing config |
| 3 | **Migration generator script** | `backend/scripts/makemigration.sh` | `bash makemigration.sh "message"` → auto-generates migration from model changes |
| 4 | **Migration runner script** | `backend/scripts/migrate.sh` | `bash migrate.sh` → applies pending migrations |
| 5 | **Auto-stamp in bootstrap** | `backend/scripts/bootstrap_db.py` | Stamps Alembic head after `Base.metadata.create_all` so future migrations know the baseline |
| 6 | **Documentation** | `README.md` | Full migration workflow section with examples |

### Committed
- `23bfcff` — pushed to GitHub, auto-deploys to Render

## Pre-existing Alembic State
- Alembic was already initialized with `alembic.ini` and `migrations/env.py`
- 4 migration scripts existed in `migrations/versions/`
- `env.py` was already async-capable (using `async_engine_from_config`)
- `bootstrap_db.py` already had a `run_migrations()` function calling `alembic upgrade head`
- **Problem**: `alembic.ini` had a hardcoded Docker DB URL; no env var fallback; no convenience scripts; `bootstrap_db.py` would create tables but not stamp Alembic, so running `alembic upgrade head` would try to re-apply all migrations

## Developer Workflow

### After changing a SQLAlchemy model

```bash
cd backend

# 1. Generate migration
bash scripts/makemigration.sh "add service_category to Job"

# 2. Review the auto-generated file in migrations/versions/
#    Check that upgrade() does what you expect

# 3. Apply to your local DB
bash scripts/migrate.sh
```

### Apply pending migrations only

```bash
cd backend && bash scripts/migrate.sh
```

### Rollback

```bash
cd backend && PYTHONPATH=. alembic downgrade -1
cd backend && PYTHONPATH=. alembic downgrade <revision_id>
```

### How it works across environments

| Environment | `DATABASE_URL` source | Alembic uses |
|-------------|----------------------|--------------|
| Docker | `docker-compose.yml` env var | ✅ Env var overrides config |
| Local dev | `.env` file or exported var | ✅ Env var overrides config |
| Render production | Render dashboard env var | ✅ Env var overrides config |
| No env var set | — | ⚠️ Falls back to `alembic.ini` Docker default |

The `env.py` picks up `DATABASE_URL` automatically in every environment. No need to edit `alembic.ini`.

## Migration Files

- `backend/alembic.ini` — Alembic config
- `backend/migrations/env.py` — Environment (async, autogenerate, env var support)
- `backend/migrations/script.py.mako` — Migration template
- `backend/migrations/versions/` — Generated migration scripts (4 existing)
- `backend/scripts/makemigration.sh` — Generate new migration
- `backend/scripts/migrate.sh` — Apply pending migrations

## Relevant Files
- `backend/alembic.ini`
- `backend/migrations/env.py`
- `backend/migrations/versions/*.py`
- `backend/scripts/makemigration.sh`
- `backend/scripts/migrate.sh`
- `backend/scripts/bootstrap_db.py` (stamp added at ~line 150)

## Commands Quick Reference

```bash
# Generate migration
bash scripts/makemigration.sh "description of change"

# Apply migrations
bash scripts/migrate.sh

# Roll back one revision
PYTHONPATH=. alembic downgrade -1

# Check current revision
PYTHONPATH=. alembic current

# View migration history
PYTHONPATH=. alembic history
```
