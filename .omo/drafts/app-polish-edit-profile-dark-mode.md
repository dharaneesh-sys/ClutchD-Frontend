---
slug: app-polish-edit-profile-dark-mode
status: awaiting-approval
intent: unclear
pending-action: write .omo/plans/app-polish-edit-profile-dark-mode.md
approach: Three parallel workstreams: (1) fix edit profile field mapping + add photo upload, (2) replace 66 hardcoded color instances across 29 files with CSS variable classes, (3) general improvements for self-hosted deployment
---

# Draft: app-polish-edit-profile-dark-mode

## Components (topology ledger)
| id | outcome | status | evidence path |
|----|---------|--------|---------------|
| C1 | Edit profile: frontend sends/reads correct field names | active | src/app/marketplace/profile/edit/page.js:24-28,51-67,100-107 |
| C2 | Edit profile: backend accepts/saves profile photos | active | backend/app/schemas/profile.py:6-8 (PhotoUpdateRequest exists but unused), backend/app/api/v1/profile.py:115-135 (PUT /me has no photo handling) |
| C3 | Edit profile: response mapping from backend to store | active | src/store/authStore.js:410-415 (updateUserData) |
| C4 | Dark mode icons: replace text-emerald-400 (66 instances) | active | grep results: 66 matches across 29 files |
| C5 | Dark mode icons: replace text-amber-400 (included in above) | active | same as C4 |
| C6 | Dark mode icons: Part Store button in mechanic dashboard | active | src/app/dashboard/mechanic/page.js:117-123 |
| C7 | Dark mode icons: Star ratings (fill-amber-400) | active | ProductCard, ProductReviews, SearchFilters, StarRating |
| C8 | Dark mode icons: Toast component colors | active | src/components/ui/Toast.js:20-46 |
| C9 | General: loading/splash screen during auth restore | active | src/store/authStore.js:79-113 (restoreSession), src/lib/api.js:50-113 (401 interceptor) |
| C10 | General: app-level ErrorBoundary | active | Not yet present in app |
| C11 | General: theme system detection (prefers-color-scheme) | active | src/store/themeStore.js:6-30 (only checks localStorage, no system detection) |
| C12 | General: service worker / PWA improvements | deferred | Next.js apps can benefit from better SW config |
| C13 | General: fix navigation guards against flash of login page | active | Mechanics dashboard page.js:41-45 |

## Open assumptions (announced defaults)
| assumption | adopted default | rationale | reversible? |
|------------|----------------|-----------|-------------|
| Profile photo format | Store as filesystem path, serve via static mount | Self-hosted server has filesystem; no cloud storage needed | Yes - can migrate to S3 later |
| Dark mode color replacement | Use existing CSS var classes (text-icon-highlight, text-primary, icon-highlight) instead of inline Tailwind colors | Already defined in globals.css with proper light/dark values | Yes - easy to swap class |
| General improvement scope | Focus on 5 high-value improvements: splash screen, error boundary, system theme detection, auth guard fixing, config consolidation | Self-hosted server gives full control; no cloud API constraints | Yes |
| Photo storage base path | /home/dinusus/ClutchD-Backend/backend/uploads/profile_photos/ | Standard practice, easy to serve via FastAPI StaticFiles mount | Yes |

## Findings (cited - path:lines)
- **BUG 1: Field name mismatch** - Frontend GET reads `p.name` (line 54) but backend returns `full_name` (profile.py:49). Name is always empty on load.
- **BUG 2: PUT payload field mismatch** - Frontend sends `name` (line 102) but backend expects `full_name` (profile.py:11 schema, profile.py:120 usage). Name is never saved.
- **BUG 3: No photo upload pipeline** - Frontend sends `photo: dataUri` (line 106). Backend has `PhotoUpdateRequest` schema (profile/schemas.py:6-8) but PUT /me never handles photo (profile.py:115-135). No file storage, no static serving.
- **BUG 4: PUT response ignored** - Frontend catches error and falls back to local update (line 112-118) but on success the backend response format may not match what `updateUserData` expects.
- **66 hardcoded color instances** across 29 files using `text-emerald-400`, `text-amber-400`, `fill-amber-400` etc. CSS vars already exist: `--color-icon-highlight`, `--color-text-primary`, `--color-primary`, `--color-badge-text`.
- **Theme system lacks system-preference detection** - themeStore.js defaults to 'light' (line 29) without checking `prefers-color-scheme`.
- **No ErrorBoundary** at app root level - any uncaught error crashes the SPA.
- **Auth guard in mechanic dashboard** shows loading spinner until `_hydrated && isAuthenticated`, but no blocking splash for full app.

## Decisions
1. Field mapping: Frontend will send `full_name` (not `name`) and read `full_name` from GET response. This fixes the core edit profile bug.
2. Photo upload: Backend will accept base64 data URIs, save to `uploads/profile_photos/`, return URL. Frontend will send data URI for new photos.
3. Dark mode icons: Replace all `text-emerald-400`, `text-amber-400`, `fill-amber-400`, `text-emerald-500` with CSS variable classes. Map:
   - Icon semantic colors → `text-icon-highlight` or `icon-highlight`
   - Accent text → `text-primary`, `text-primary-light`  
   - Status/rating → `text-warning` (for star ratings)
   - Function-specific → keep only if truly color-coded (e.g., warning=amber, error=red)
4. General improvements batch: Focus on splash screen (auth restore), ErrorBoundary, system theme detection, auth guard refinement, config checking.
5. No new npm dependencies unless absolutely required.

## Scope IN
- Edit profile feature: fix field mapping, add photo upload, fix response handling
- Dark mode icons: all 29 files with hardcoded colors → CSS variable classes
- General improvements: splash screen, ErrorBoundary, system theme, auth guard fixes
- Backend changes: PhotoUpdateRequest integration in PUT /me, profile photo serving

## Scope OUT (Must NOT have)
- No database schema changes (photos stored as files, URL in existing `profile_photo_url` column)
- No new cloud storage integration (S3/Cloudinary etc.)
- No full redesign of any page
- No rewriting of auth system
- No adding tests (codebase has minimal test infrastructure)
- No changing the color system architecture itself
- No adding new npm packages (use what's already installed)

## Open questions
None - all forks resolved via exploration and defaults adopted.

## Approval gate
status: awaiting-approval

Approach: Three parallel workstreams by subagent delegation:
- **WS1 (Edit Profile)**: Fix frontend field mapping + backend photo handling
- **WS2 (Dark Mode Icons)**: Batch replace 66 hardcoded colors across 29 files  
- **WS3 (General Improvements)**: Splash screen, ErrorBoundary, system theme, auth guard

Each workstream delegated to a `deep` or `unspecified-high` agent in parallel. After all complete, rebuild APK and deploy.
