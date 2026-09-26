# ClutchD APK Build Runbook

## Paths (backend serves both at once — no server change ever needed)

| Path | URL | Speed (measured Sep 22) | Role |
|------|-----|-------------------------|------|
| Fast (Cloudflare Tunnel) | `https://clutchd.dpdns.org/api` | ~0.5s `/health` | Default since v3.1.28 |
| Fallback (Tailscale Funnel) | `https://clutchd-1.tail14cfb9.ts.net/api` | ~1.6–2.2s `/health` | Use if Cloudflare fails |

Both ingresses hit the same `clutchd-api.service :8000` on `clutchd-1`.
Tailscale funnel + all 3 watchdogs (funnel 5min, ssh-lifeline 30s, api-alerts 2min)
stay enabled so the fallback is always warm. `connect-src` CSP already allows both.

## A. Standard build (fast path)

```bash
cd /home/dinusus/ClutchD/ClutchD-App

# 1. .env.local (gitignored) must point at the fast path:
#    NEXT_PUBLIC_API_URL=https://clutchd.dpdns.org/api
#    NEXT_PUBLIC_WS_URL=wss://clutchd.dpdns.org/ws

# 2. Bump version in android/app/build.gradle:
#    versionCode <prev + 1>, versionName "3.1.XX"

# 3. Build + sync + release:
NEXT_PUBLIC_BUILD_MODE=export npm run build && npx cap copy && npx cap sync android
cd android && ./gradlew assembleRelease && cd ..

# 4. Rename output:
cp android/app/build/outputs/apk/release/app-release.apk ClutchD-v3.1.XX-release.apk
```

Release signing uses `android/keystore.properties` (gitignored) + `clutchd-release.keystore` — back it up.

## B. Fallback build (Cloudflare down — no code edits)

Same as above, but override the URLs for that build only (`.env.local` untouched):

```bash
cd /home/dinusus/ClutchD/ClutchD-App
# bump versionCode/versionName first (see A.2)
NEXT_PUBLIC_API_URL=https://clutchd-1.tail14cfb9.ts.net/api \
NEXT_PUBLIC_WS_URL=wss://clutchd-1.tail14cfb9.ts.net/ws \
NEXT_PUBLIC_BUILD_MODE=export npm run build && npx cap copy && npx cap sync android
cd android && ./gradlew assembleRelease && cd ..
cp android/app/build/outputs/apk/release/app-release.apk ClutchD-v3.1.XX-release.apk
```

## C. Verify before shipping

```bash
# DNS: expect Cloudflare edge IPs (fast) — fallback: funnel host resolves via tailnet
dig +short clutchd.dpdns.org @1.1.1.1

# Backend live on both paths (expect 200 {"status":"ok"}):
curl -s --max-time 15 https://clutchd.dpdns.org/health
curl -s --max-time 15 https://clutchd-1.tail14cfb9.ts.net/health

# Bundle baked the right API URL (expect hits; expect 0 for the other path + localhost):
grep -rl "clutchd.dpdns.org/api" out/ | head -3
grep -r "localhost:800[01]" out/ | head -3; grep -r "tail14cfb9" out/ | head -3

# APK version stamp:
aapt dump badging ClutchD-v3.1.XX-release.apk | grep -E "versionCode|versionName"
```

## D. Server pieces you never need to touch per-build

- `cloudflared.service` runs tunnel `708225ee-…` with `/etc/cloudflared/config.yml`
  (`clutchd.dpdns.org → http://localhost:8000`).
- DNS record: `CNAME @ → 708225ee-4629-4254-96e8-6c95f7d98b2a.cfargotunnel.com` (Proxied).
- Deploy backend code: `~/ClutchD-Backend/deploy-backend.sh` (pull + restart + health poll).
- Never commit `.env.local`. Old `ClutchD-v*-release.apk` files are gitignored.

## History

- v3.1.27 and earlier: funnel URL baked.
- v3.1.28 (code 58): first fast-path build, 8.9MB, bundle has `https://clutchd.dpdns.org/api`, zero localhost/funnel refs.
