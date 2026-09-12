# app-polish-edit-profile-dark-mode - Work Plan

## TL;DR (For humans)

**What you'll get:** Edit profile that actually saves your name, phone, and photo. Icons that change color correctly in both light and dark mode. A splash screen so the app doesn't flash the login page on reload. An error boundary so the whole app doesn't crash from one bug. Plus general polish fixes from a full app audit.

**Why this approach:** Three independent workstreams run in parallel — no waiting. The hardcoded color fix is a bulk CSS replacement (find/replace in 29 files), the edit profile fix is backend+frontend coordination, and general improvements are isolated additions. No database changes needed.

**What it will NOT do:** Add cloud storage (photos save to server disk), redesign any page, change the auth system, add new npm packages, or write test infrastructure.

**Effort:** Large | **Risk:** Low — all changes are reversible (no DB migrations, no new services)

**Decisions I made for you:**
- Profile photos stored on server filesystem (not S3/Cloudinary)
- Icon colors use existing CSS variable classes (no new variables)
- No new npm packages
- General improvements limited to highest-impact items from audit

---

> TL;DR (machine): Large effort, Low risk — 3 parallel streams: edit profile fix (backend + frontend), dark mode icons (29 files), general improvements (splash, error boundary, system theme, auth guard) + audit findings

## Scope
### Must have
- Edit profile: fix field name mapping (name → full_name) on both frontend GET and PUT
- Edit profile: add photo upload pipeline (backend save + frontend send)
- Dark mode: replace all 66 hardcoded `text-emerald-400`, `text-amber-400`, `fill-amber-400` with CSS var classes
- General: splash screen during auth restore
- General: ErrorBoundary component at app root
- General: system theme detection (prefers-color-scheme)
- General: app-wide audit findings integrated
- Rebuild APK with all fixes

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No new npm dependencies
- No database schema changes
- No cloud storage integration
- No page redesigns
- No auth system changes
- No test infrastructure (none exists in codebase)
- No changing the theme architecture

## Verification strategy
- Test decision: none (codebase has no test framework setup)
- Evidence: Manual verification via code review + LSP diagnostics clean
- Each workstream verified independently: (1) profile API responds correctly, (2) no emerald/amber remain in JSX, (3) components render without errors

## Execution strategy
### Parallel execution waves
- Wave 1: ALL 3 workstreams + audit in parallel
- Wave 2: Remediate audit findings
- Wave 3: Rebuild APK + final verification

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| Workstream 1 (Edit profile) | — | — | WS 2, WS 3, Audit |
| Workstream 2 (Dark mode icons) | — | — | WS 1, WS 3, Audit |
| Workstream 3 (General improvements) | — | — | WS 1, WS 2, Audit |
| Audit integration | Audit results | — | WS 1, WS 2, WS 3 |
| Rebuild APK | All WS | — | — |

## Todos

### Workstream 1: Edit Profile

- [ ] 1. Fix frontend GET/PUT field mapping (name → full_name)
  What: In src/app/marketplace/profile/edit/page.js, change `p.name` to `p.full_name` on GET response (line 54). Change PUT payload key from `name` to `full_name` (line 102). Map PUT response data correctly into updateUserData.
  Must NOT: Change UI layout, add new fields, change validation logic.
  Files: src/app/marketplace/profile/edit/page.js:48-72 (GET), :91-123 (PUT), src/store/authStore.js:410-415 (updateUserData)
  Acceptance: GET loads full_name into name field. PUT sends full_name and backend saves it.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: All other todos

- [ ] 2. Fix PUT error handling — remove fake success fallback
  What: On PUT error (edit/page.js:111-119), remove the catch-block that silently falls back to local update with fake success toast. Show the actual API error message instead using toast.error().
  Must NOT: Keep the lying success toast on API failure.
  Files: src/app/marketplace/profile/edit/page.js:107-123
  Acceptance: API failure shows real error message. API success updates store with backend response.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: All other todos

- [ ] 3. Add photo upload to backend PUT /profile/me
  What: In backend PUT /profile/me (profile.py:115-135), add photo handling: accept `photo` field in request body (data URI). Decode base64, save to `uploads/profile_photos/{uuid}.{ext}`, set `profile.profile_photo_url`. Update ProfileUpdateRequest schema to accept optional `photo` field. Mount static files in main.py to serve uploads. Create uploads dir on startup.
  Must NOT: Use S3/cloud. No DB schema changes. Validate image type + size (<5MB).
  Files: backend/app/api/v1/profile.py, backend/app/schemas/profile.py, backend/app/main.py
  Acceptance: PUT with `photo: "data:image/png;base64,..."` saves file + returns URL. GET returns URL.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: All other todos

- [ ] 4. Fix main.py static mount + uploads directory
  What: In backend/app/main.py, add `from fastapi.staticfiles import StaticFiles`, mount `/uploads` to serve uploads directory. Create directory on startup if not exists.
  Files: backend/app/main.py
  Acceptance: Files in uploads/profile_photos/ are accessible at /uploads/profile_photos/filename.jpg
  Parallelization: Wave 1 | Blocked by: — | Parallel with: All other todos

### Workstream 2: Dark Mode Icons

- [ ] 5. Fix hardcoded colors in dashboard files (7 instances)
  What: mechanic/page.js: line 119 `text-emerald-400` → `text-icon-highlight`, line 170/186 Briefcase icon → `text-icon-highlight`. customer/page.js: 4 instances of emerald/amber → CSS var classes.
  Files: src/app/dashboard/mechanic/page.js, src/app/dashboard/customer/page.js
  Acceptance: Zero hardcoded emerald/amber in dashboard files.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 6-9

- [ ] 6. Fix hardcoded colors in marketplace components
  What: StarRating.js: `fill-amber-400` → `fill-warning`. ProductCard.js, ProductReviews.js, SearchFilters.js, VehicleSelector.js, VendorComparisonTable.js: emerald/amber → CSS var classes.
  Files: grep results for these 6 files
  Acceptance: Zero hardcoded emerald/amber in these files.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 5, 7-9

- [ ] 7. Fix hardcoded colors in profile sub-pages
  What: Fix all profile/*/page.js: favorites, settings, safety, payments, help, quick-actions, care, main profile page.
  Files: grep results for these 8 files
  Acceptance: Zero hardcoded emerald/amber in profile pages.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 5-6, 8-9

- [ ] 8. Fix hardcoded colors in UI components
  What: Toast.js (warning/error/info icon colors), SubscriptionManager.js, MaintenanceAlertBanner.js, EscrowStatus.js, ChatPanel.js, ReferralPanel.js, FleetDashboard.js, IncomingJobs.js
  Files: grep results for these 8 files
  Acceptance: Zero hardcoded emerald/amber in UI components.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 5-7, 9

- [ ] 9. Fix hardcoded colors in admin components
  What: PayoutManager.js, CertificationPanel.js, WarrantyPanel.js
  Files: grep results for these 3 files
  Acceptance: Zero hardcoded emerald/amber in admin components.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 5-8

### Workstream 3: General Improvements

- [ ] 10. Add splash screen during auth restore
  What: Create a SplashScreen component that shows while `_isRestoring` is true (authStore.js:67). Place in root layout or AuthInit. Shows logo + spinner. Blocks all page rendering until restore completes.
  Must NOT: Change auth flow logic. Only add visual blocking overlay.
  Files: src/app/layout.js, src/store/authStore.js:67 (_isRestoring flag)
  Acceptance: When _isRestoring is true, splash shows. After restore, content appears.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 11-14

- [ ] 11. Add ErrorBoundary component
  What: Create client-side ErrorBoundary wrapping app root. Catches uncaught render errors, shows friendly error screen with "Retry" button. Console.error logs.
  Must NOT: Catch auth errors that should propagate.
  Files: src/app/layout.js (wrap location)
  Acceptance: Simulated render error shows error UI instead of white screen.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 10, 12-14

- [ ] 12. Add system theme detection
  What: In themeStore.js, check `window.matchMedia('(prefers-color-scheme: dark)')` on init. Listen for changes. Default to system preference when no explicit localStorage choice exists.
  Must NOT: Break existing light/dark toggle. Not change toggle UI.
  Files: src/store/themeStore.js:6-30 (getInitialTheme)
  Acceptance: On system with dark mode, app defaults dark on first visit. System preference changes update theme.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 10-11, 13-14

- [ ] 13. Fix auth guard consistency across all guarded pages
  What: Ensure all protected routes (dashboard, profile, etc.) use the same guard pattern: check `_hydrated && isAuthenticated`, show consistent loading state. Leverage splash screen from todo 10 as the single guard.
  Files: src/app/dashboard/mechanic/page.js:41-45,81-83, check other guarded pages
  Acceptance: No page content renders before auth state resolved. Consistent loading across routes.
  Parallelization: Wave 1 | Blocked by: — | Parallel with: Todos 10-12, 14

- [ ] 14. Audit findings remediation (P0/P1)
  What: After audit agents return, add fixes for P0 and P1 findings here. P2 done only if trivial.
  Files: TBD from audit results
  Acceptance: All P0/P1 findings addressed.
  Parallelization: Wave 2 | Blocked by: Audit agents complete | Parallel with: —

- [ ] 15. Clean up LSP diagnostics on all changed files
  What: Run lsp_diagnostics on all modified files, fix any new errors/warnings introduced.
  Files: All files modified in todos 1-14
  Acceptance: Zero diagnostics errors on all changed files.
  Parallelization: Wave 3 | Blocked by: Todos 1-14 | Parallel with: —

### Final Steps

- [ ] 16. Rebuild APK and deploy
  What: npm run build (static export), npx cap sync android, cd android && ./gradlew assembleDebug. Then scp APK to server or share download link.
  Must NOT: Skip build verification.
  Acceptance: Build exits 0. APK generated at android/app/build/outputs/apk/debug/app-debug.apk
  Parallelization: Wave 3 | Blocked by: Todos 1-15 | Parallel with: —

## Final verification wave
- [ ] F1. Verify edit profile: profile GET returns full_name, PUT saves it, photo upload works
- [ ] F2. Verify no hardcoded emerald/amber remains: grep should return 0
- [ ] F3. Verify splash screen renders during restore
- [ ] F4. Verify dark mode toggle works across all fixed components
- [ ] F5. LSP diagnostics clean on all changed files

## Commit strategy
- One commit per workstream: `fix(profile): ...`, `fix(ui): replace hardcoded colors with theme vars`, `feat(app): add general improvements` + audit commit

## Success criteria
- [ ] Edit profile saves and loads correctly (name, phone, address, photo)
- [ ] All icons use CSS variable classes — zero hardcoded emerald/amber in JSX
- [ ] App shows splash screen during auth restore on page reload
- [ ] ErrorBoundary catches render errors without crashing app
- [ ] System theme detection works (respects OS preference)
- [ ] APK builds successfully and deploys
