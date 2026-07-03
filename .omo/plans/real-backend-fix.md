# Real Backend Fix — Full Stack E2E

## The Situation

The backend (`clutchd-api.onrender.com`) is running but **returns 500** on all auth endpoints. The frontend sends `role` with login which the backend doesn't expect. Even after fixing that, the 500 will persist because:

**Root cause**: The free-tier Redis on Render has `ipAllowList: []` (empty = no connections allowed). The login endpoint calls `get_redis()` on EVERY request for rate limiting, which crashes with a connection error. The health check (no Redis/DB) works fine.

## What Needs to Change

### Backend (ClutchD-Backend repo)
| File | Change |
|------|--------|
| `render.yaml` | Set `ipAllowList: ["0.0.0.0"]` on the Redis service |
| OR `backend/app/core/redis_client.py` | Add try/catch in `get_redis()` so login works without Redis |

### Frontend (ClutchD-App repo)
| File | Change |
|------|--------|
| `src/store/authStore.js` | Remove `role` from `login()` payload — backend expects `{ email, password }` only |

### Deploy
| Step | Action |
|------|--------|
| Push backend changes → GitHub | Render auto-deploys `clutchd-api` |
| Set `DEMO_MODE=false` in `.env.local` | Use real backend for APK |
| Rebuild APK | Fresh build with real backend |

---

## TODOs

- [x] 1. Backend — Fix Redis config and/or add connection fallback

  **Two options (pick one)**:
  
  **Option A (render.yaml fix)**:
  - Edit `/tmp/ClutchD-Backend/render.yaml`
  - Change Redis `ipAllowList: []` to `ipAllowList: ["0.0.0.0"]`
  
  **Option B (code fallback in redis_client.py)**:
  - Edit `/tmp/ClutchD-Backend/backend/app/core/redis_client.py`
  - Wrap `get_redis()` in try/except, return a dummy Redis client or None
  - Make login route handle None Redis gracefully (skip rate limiting)

  **QA**:
  - Verify render.yaml change: `grep ipAllowList render.yaml`
  - Verify the backend starts: `curl -s https://clutchd-api.onrender.com/health`

- [x] 2. Backend — Push changes to GitHub + trigger Render re-deploy

  ```
  cd /tmp/ClutchD-Backend
  git add .
  git commit -m "fix: allow Redis connections from any IP or add fallback"
  git push
  ```

  **QA**:
  - Wait for Render deploy to complete (check deploy logs or use deploy hook)
  - Verify auth works: `curl -s -X POST https://clutchd-api.onrender.com/api/auth/login -H "Content-Type: application/json" -d '{"email":"customer@demo.com","password":"demo123456"}'`

- [x] 3. Frontend — Fix authStore.js login payload

  **What to do**:
  - Edit `src/store/authStore.js`
  - In the `login` function (line 79-101), change:
    ```js
    const response = await api.post("/auth/login", { email, password, role });
    ```
    To:
    ```js
    const response = await api.post("/auth/login", { email, password });
    ```
  - Keep the `role` parameter in the function signature for UI use, just don't send it

  **QA**:
  - `grep -n "auth/login" src/store/authStore.js` — confirm `role` removed from payload

- [x] 4. Frontend — Set DEMO_MODE=false in .env.local

  **What to do**:
  - Edit `.env.local`
  - Change `NEXT_PUBLIC_DEMO_MODE=true` → `NEXT_PUBLIC_DEMO_MODE=false`
  - Keep API URL and WS_URL unchanged

- [x] 5. Frontend — Rebuild APK with real backend

  **What to do**:
  ```
  rm -rf .next out
  npm run build:android
  cd android && ./gradlew assembleDebug
  ```

  **QA**:
  ```
  grep -c "clutchd-api.onrender.com" out/_next/static/chunks/*.js | grep -v ":0$" | wc -l  # ≥1
  grep -l "localhost:8001" out/_next/static/chunks/*.js | wc -l                           # 0
  grep -oP 'e\.s\(\["DEMO_MODE"[^]]+\]' out/_next/static/chunks/*.js                      # !0 (false = not true)
  ls -lh android/app/build/outputs/apk/debug/app-debug.apk                                 # exists
  ```

---

## Success Criteria
- [x] Login works with seed account: `customer@demo.com` / `demo123456`
- [x] All marketplace, dashboard features use live data (test in-app)
- [x] Theme toggle works (test in-app) — fixed shared zustand store
- [x] No "Server unreachable" errors — backend responds with tokens
- [x] DEMO_MODE=false in APK
- [x] Backend ports: 500 errors gone on auth endpoints
- [x] Location permissions added to AndroidManifest.xml (ACCESS_FINE/COARSE/BACKGROUND_LOCATION)
- [x] AuthInit clears stale demo state on startup for clean role transition

## Seed Accounts (from backend README)
| Email | Password | Role |
|-------|----------|------|
| `admin@clutchd.com` | `AdminChangeMe!` | admin |
| `customer@demo.com` | `demo123456` | customer |
| `mechanic@demo.com` | `demo123456` | mechanic (verified) |
| `garage@demo.com` | `demo123456` | garage (verified) |
