# Fix: Enable DEMO_MODE + Rebuild APK

## TL;DR
**Problem**: `.env.local` has `NEXT_PUBLIC_DEMO_MODE=false` which disables demo interceptors. The app tries to hit the real Render backend which expects a different login payload structure (LoginRequest has no `role` field), causing 422 validation errors and "Server unreachable" on login. Theme toggle works but is invisible because the app can't get past the login screen.

**Fix**: Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`, rebuild APK.

---

## Work Objectives

### Core Objective
Restore DEMO_MODE=true and rebuild the Android APK so login, marketplace, and all features work via demo interceptors.

### Deliverables
- Updated `.env.local` with `NEXT_PUBLIC_DEMO_MODE=true`
- New APK at `android/app/build/outputs/apk/debug/app-debug.apk` (~5.7MB)

### Must Have
- [ ] Login works (demo mode provides mock auth)
- [ ] Theme toggle visible and functional (bottom-right corner)
- [ ] Marketplace, dashboard work with demo data

### Must NOT Have
- Do NOT change the API URL — keep `https://clutchd-api.onrender.com/api`
- Do NOT modify theming code (ThemeProvider/ThemeToggle are fine)

---

## TODOs

- [ ] 1. `.env.local` — Set `NEXT_PUBLIC_DEMO_MODE=true`

  **What to do**:
  - In `/home/dinusus/ClutchD-App/.env.local`, change line `NEXT_PUBLIC_DEMO_MODE=false` to `NEXT_PUBLIC_DEMO_MODE=true`
  - Keep `NEXT_PUBLIC_API_URL=https://clutchd-api.onrender.com/api` as-is
  - Keep `NEXT_PUBLIC_WS_URL=wss://clutchd-api.onrender.com/ws` as-is

  **QA Scenarios**:
  ```
  Scenario: Verify DEMO_MODE value
    Tool: Bash (grep)
    Steps:
      1. Run: grep "NEXT_PUBLIC_DEMO_MODE" .env.local
    Expected Result: Output shows NEXT_PUBLIC_DEMO_MODE=true
    Evidence: .omo/evidence/task-1-demo-mode-value.txt
  ```

- [ ] 2. Rebuild the Android APK

  **What to do**:
  - Clear `.next/` and `out/` build cache:
    ```
    rm -rf ~/ClutchD-App/.next ~/ClutchD-App/out
    ```
  - Run the full Android build chain:
    ```
    cd ~/ClutchD-App && npm run build:android && cd android && ./gradlew assembleDebug
    ```

  **QA Scenarios**:
  ```
  Scenario: Verify Render URL baked into build
    Tool: Bash (grep)
    Steps:
      1. grep -c "clutchd-api.onrender.com" out/_next/static/chunks/*.js | grep -v ":0$" | wc -l
    Expected Result: At least 1 chunk file contains the Render URL
    Evidence: .omo/evidence/task-2-render-url-verified.txt

  Scenario: Verify no localhost references
    Tool: Bash (grep)
    Steps:
      1. grep -l "localhost:8001" out/_next/static/chunks/*.js | wc -l
    Expected Result: 0 files reference localhost:8001
    Evidence: .omo/evidence/task-2-no-localhost.txt

  Scenario: Verify APK exists
    Tool: Bash (ls)
    Steps:
      1. ls -lh android/app/build/outputs/apk/debug/app-debug.apk
    Expected Result: File exists, ~5.7MB, recent timestamp
    Evidence: .omo/evidence/task-2-apk-exists.txt
  ```

  **Commit**: YES
  - Message: `fix(env): enable DEMO_MODE for APK build`
  - Files: `.env.local`

---

## Success Criteria
- [ ] APK builds successfully
- [ ] APK has Render URL baked in (not localhost)
- [ ] DEMO_MODE=true baked into the JS bundle
- [ ] Login works on phone with demo credentials
- [ ] Theme toggle visible at bottom-right corner
