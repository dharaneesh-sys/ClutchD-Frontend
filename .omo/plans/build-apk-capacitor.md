# Build Android APK with Capacitor

## TL;DR

> **Quick Summary**: Push pending code changes in both repos, then build an Android APK via Capacitor's existing setup (static Next.js export + `npx cap sync android` + `gradlew assembleDebug`).
>
> **Deliverables**:
> - ClutchD-App: staged, committed, pushed to `origin/main`
> - ClutchD-Backend: committed, pushed to `origin/main`
> - Android debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`
>
> **Estimated Effort**: Short (1-2 hours depending on Gradle download)
> **Parallel Execution**: NO — sequential (push → build → APK)
> **Critical Path**: Fix capacitor CLI → Build export → Sync → Compile APK

---

## Context

### Original Request
User asked to push current changes and build an Android APK using Capacitor.

### Current State
**layout.js merge conflict** — Already resolved in the file but NOT staged (`git add` needed).
**Capacitor** — Already set up:
- `capacitor.config.js` with `webDir: 'out'`, appId `com.clutchd.app`
- Android project in `android/` with `gradlew`, SDK 35, min SDK 23
- `@capacitor/android: ^8.4.1`, `@capacitor/core: ^8.4.1`
- Build script: `npm run build:android`

**Version Mismatch** — `@capacitor/cli: ^7.6.7` vs `@capacitor/core/android: ^8.4.1`. CLI must be upgraded to `^8.4.1` before syncing.

**Environment** — Java 21, Android SDK at `/opt/android-sdk`, Gradle wrapper 8.11.1

### Pending Changes

**ClutchD-App** (layout.js conflict + ProfileMenu edits):
```
Changes not staged:
  - src/app/layout.js (Unmerged paths — needs git add)
  - src/components/profile/ProfileMenu.js
Untracked:
  - src/app/marketplace/profile/clutchd-card/
  - src/app/marketplace/profile/favorites/
```

**ClutchD-Backend** (new + modified files):
```
Changes not staged:
  - backend/app/api/v1/router.py
  - backend/app/models/__init__.py
  - backend/app/models/new_models.py
  - backend/app/models/user.py
Untracked:
  - backend/app/api/v1/card.py
  - backend/app/api/v1/favorites.py
  - backend/app/schemas/card.py
  - backend/app/schemas/favorites.py
```

---

## Work Objectives

### Core Objective
Push all pending code changes and produce a debug Android APK.

### Concrete Deliverables
- [x] ClutchD-App: `git push origin main` with resolved layout conflict + ProfileMenu + new Favorites/ClutchD-Card pages
- [x] ClutchD-Backend: `git push origin main` with new favorites/card APIs + models
- [x] Android APK: `app-debug.apk` at `android/app/build/outputs/apk/debug/`

### Definition of Done
- [ ] `git status` shows clean on both repos (nothing to commit, up to date)
- [ ] `ls android/app/build/outputs/apk/debug/app-debug.apk` exists
- [ ] APK file size > 1MB (valid build)

### Must Have
- Stage and commit layout.js merge resolution (currently "Unmerged paths")
- Upgrade @capacitor/cli to ^8.4.1 to match core/android
- Use existing `npm run build:android` script

### Must NOT Have (Guardrails)
- Do NOT modify any source code — only git operations, npm upgrades, and build commands
- Do NOT commit large APK files to git
- Do NOT touch the backend's production database (local dev only)
- Do NOT change next.config.js or Capacitor config

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (no test infra for Android builds)
- **Automated tests**: N/A (build artifact, not code)
- **Agent-Executed QA**: YES — verify APK exists and is valid

### QA Policy
Every task includes agent-executed scenarios using Bash (git status check, file existence, APK validation).

---

## Execution Strategy

### Parallel Execution Waves
```
Wave 1 (Sequential — git operations):
├── Task 1: Stage + commit ClutchD-App changes
├── Task 2: Stage + commit ClutchD-Backend changes
└── Task 3: Push both repos

Wave 2 (Sequential — APK build):
├── Task 4: Upgrade @capacitor/cli to v8
├── Task 5: Run export build + capacitor sync
├── Task 6: Build Android APK
└── Task 7: Verify APK

Wave FINAL:
├── Task F1: Validate APK exists and is deployable
```

---

## TODOs

- [ ] 1. Stage and commit ClutchD-App changes

  **What to do**:
  - `git add src/app/layout.js` — mark merge conflict as resolved
  - `git add src/components/profile/ProfileMenu.js`
  - `git add src/app/marketplace/profile/` — new favorite/card pages
  - Verify with `git status` that layout.js is no longer "Unmerged"
  - Commit with message: `fix: resolve layout.js merge conflict, add Favorites + ClutchD Card profile pages`
  - Exclude `.omo/` artifacts, session files, and non-code artifacts from the commit

  **Must NOT do**:
  - Do NOT commit `.omo/`, `.playwright-mcp/`, `playwright-report/`, `full-page-map.png`, `page-snapshot.yml`, or `logo/`

  **Recommended Agent Profile**: git (`/git-master` skill)
  - **Skills**: `git-master`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 3 (push)

  **Acceptance Criteria**:
  - [ ] `git status` shows clean
  - [ ] `git log --oneline -1` shows the commit with the correct message

  **QA Scenarios**:
  ```
  Scenario: Verify commit was created
    Tool: Bash
    Steps:
      1. git status → "nothing to commit, working tree clean"
      2. git log --oneline -1 → shows message
    Evidence: .omo/evidence/task-1-commit-status.txt
  ```

  **Commit**: YES
  - Message: `fix: resolve layout.js merge conflict, add Favorites + ClutchD Card profile pages`
  - Files: `src/app/layout.js`, `src/components/profile/ProfileMenu.js`, `src/app/marketplace/profile/favorites/`, `src/app/marketplace/profile/clutchd-card/`
  - Pre-commit: `npx next build` (already verified — OK)

- [ ] 2. Stage and commit ClutchD-Backend changes

  **What to do**:
  - `git add backend/app/api/v1/router.py backend/app/models/__init__.py backend/app/models/new_models.py backend/app/models/user.py`
  - `git add backend/app/api/v1/favorites.py backend/app/api/v1/card.py`
  - `git add backend/app/schemas/favorites.py backend/app/schemas/card.py`
  - Commit with message: `feat: add Favorites and ClutchD Card models, schemas, and API endpoints`

  **Must NOT do**:
  - Do NOT commit `AGENTS.md` (top-level — not part of the codebase)

  **Recommended Agent Profile**: git (`/git-master` skill)

  **Parallelization**:
  - **Can Run In Parallel**: NO (but independent of Task 1)
  - **Blocks**: Task 3 (push)

  **Acceptance Criteria**:
  - [ ] `git status` shows clean
  - [ ] All 9 files are in the commit

  **Commit**: YES
  - Message: `feat: add Favorites and ClutchD Card models, schemas, and API endpoints`
  - Files: `backend/app/api/v1/router.py`, `backend/app/api/v1/favorites.py`, `backend/app/api/v1/card.py`, `backend/app/models/__init__.py`, `backend/app/models/new_models.py`, `backend/app/models/user.py`, `backend/app/schemas/favorites.py`, `backend/app/schemas/card.py`

- [ ] 3. Push both repos

  **What to do**:
  - `cd /home/dinusus/ClutchD-App && git push origin main`
  - `cd /home/dinusus/ClutchD-Backend && git push origin main`

  **Recommended Agent Profile**: quick

  **Parallelization**:
  - **Can Run In Parallel**: YES (two independent pushes)
  - **Blocked By**: Task 1, Task 2

  **Acceptance Criteria**:
  - [ ] `git log --oneline origin/main -1` shows the latest commit (confirm pushed)

  **QA Scenarios**:
  ```
  Scenario: Verify push succeeded
    Tool: Bash
    Steps:
      1. git log --oneline origin/main -1 (ClutchD-App)
      2. git log --oneline origin/main -1 (ClutchD-Backend)
    Expected Result: Both show the recently committed messages
    Evidence: .omo/evidence/task-3-push-verified.txt
  ```

  **Commit**: NO (already committed)

- [ ] 4. Upgrade @capacitor/cli to match core/android

  **What to do**:
  - `npm install @capacitor/cli@^8.4.1` in ClutchD-App
  - Verify: `npx cap --version` shows `8.x.x`

  **Why**: Current CLI is v7.6.7 but core/android are v8.4.1. Running `npx cap sync` with mismatched CLI can produce incorrect native project files.

  **Recommended Agent Profile**: quick

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 3 (want pushed code first)
  - **Blocks**: Task 5

  **Acceptance Criteria**:
  - [ ] `npx cap --version` outputs `8.4.1`
  - [ ] `npm ls @capacitor/cli` shows v8.x

  **QA Scenarios**:
  ```
  Scenario: Verify CLI version
    Tool: Bash
    Steps:
      1. npx cap --version
    Expected Result: 8.4.1 (or 8.x.x)
    Evidence: .omo/evidence/task-4-cap-cli-version.txt
  ```

  **Commit**: NO (not worth committing separately; can be grouped if needed)
  - Message: `chore: upgrade @capacitor/cli to v8.4.1`

- [ ] 5. Run export build + capacitor sync

  **What to do**:
  - `NEXT_PUBLIC_BUILD_MODE=export npx next build` — static export to `out/`
  - `npx cap copy` — copy web assets to native project
  - `npx cap sync android` — sync Capacitor plugins + update native project

  **Note**: The first run of `npx cap sync android` may update `android/capacitor.settings.gradle` and `android/app/build.gradle` to match the new CLI version.

  **Recommended Agent Profile**: quick
  - **Skills**: N/A (shell commands)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 4
  - **Blocks**: Task 6

  **Acceptance Criteria**:
  - [ ] `ls out/` contains `index.html` (static export succeeded)
  - [ ] `npx cap sync android` exits 0
  - [ ] `ls android/app/src/main/assets/public/index.html` exists (Capacitor copied web assets)

  **QA Scenarios**:
  ```
  Scenario: Verify export output
    Tool: Bash
    Steps:
      1. ls out/index.html
    Expected Result: file exists
    Evidence: .omo/evidence/task-5-export-ok.txt

  Scenario: Verify capacitor sync created assets
    Tool: Bash
    Steps:
      1. ls android/app/src/main/assets/public/index.html
    Expected Result: file exists
    Evidence: .omo/evidence/task-5-cap-sync-ok.txt
  ```

  **Commit**: NO (build artifacts)

- [ ] 6. Build Android debug APK

  **What to do**:
  - `cd android && ./gradlew assembleDebug`
  - This compiles Java/Kotlin source, bundles JS assets, and produces APK
  - First build may download Gradle distribution + dependencies (~2-10 min)

  **Expected issues**:
  - Gradle daemon may need to start fresh
  - If SDK license not accepted: `yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses`

  **Recommended Agent Profile**: unspecified-high
  - **Skills**: N/A (build command)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 5
  - **Blocks**: Task 7

  **Acceptance Criteria**:
  - [ ] BUILD SUCCESSFUL in gradle output
  - [ ] `ls android/app/build/outputs/apk/debug/app-debug.apk` exists
  - [ ] File size > 1MB (valid compiled APK)

  **QA Scenarios**:
  ```
  Scenario: Verify APK was produced
    Tool: Bash
    Steps:
      1. ls -lh android/app/build/outputs/apk/debug/app-debug.apk
    Expected Result: file exists, size > 1MB
    Evidence: .omo/evidence/task-6-apk-exists.txt

  Scenario: Check APK is valid
    Tool: Bash
    Steps:
      1. file android/app/build/outputs/apk/debug/app-debug.apk
      2. unzip -l android/app/build/outputs/apk/debug/app-debug.apk | head -5
    Expected Result: Shows "Zip archive" and contains AndroidManifest.xml, classes.dex
    Evidence: .omo/evidence/task-6-apk-valid.txt
  ```

  **Commit**: NO (build artifacts)

- [ ] 7. Clean up — restore git state

  **What to do**:
  - Remove `out/` and `android/app/build/` from git tracking (already in .gitignore?)
  - Verify: `git status` shows no unexpected dirty files
  - If capacitor updated native project files (`android/capacitor.settings.gradle`, `android/app/build.gradle`, `android/variables.gradle`), verify they look correct

  **Recommended Agent Profile**: quick

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 6

  **Acceptance Criteria**:
  - [ ] `git status` shows clean or only expected files
  - [ ] Build artifacts are not tracked

---

## Final Verification Wave

- [ ] F1. **APK Validation** — `unspecified-high`
  Verify: `ls -lh android/app/build/outputs/apk/debug/app-debug.apk` exists (>1MB), `file` reports it as valid Zip/APK, `unzip -l` shows `AndroidManifest.xml` + `classes.dex`.
  Output: `APK [EXISTS/VALID/MISSING] | Size [N MB] | VERDICT`

---

## Commit Strategy

- **Task 1**: `fix: resolve layout.js merge conflict, add Favorites + ClutchD Card profile pages`
  - Files: ClutchD-App frontend files
  - Pre-commit: npx next build (already verified)

- **Task 2**: `feat: add Favorites and ClutchD Card models, schemas, and API endpoints`
  - Files: ClutchD-Backend files

- **Task 4** (optional): `chore: upgrade @capacitor/cli to v8.4.1`
  - Files: ClutchD-App package.json, package-lock.json

---

## Success Criteria

### Verification Commands
```bash
# Check git state
cd /home/dinusus/ClutchD-App && git status

# Check APK exists
ls -lh /home/dinusus/ClutchD-App/android/app/build/outputs/apk/debug/app-debug.apk

# Check APK validity
file /home/dinusus/ClutchD-App/android/app/build/outputs/apk/debug/app-debug.apk

# Verify pushes
cd /home/dinusus/ClutchD-App && git log --oneline -3 origin/main
cd /home/dinusus/ClutchD-Backend && git log --oneline -3 origin/main
```

### Final Checklist
- [ ] Both repos pushed to origin/main
- [ ] APK exists at expected path
- [ ] APK is valid Zip archive with AndroidManifest.xml + classes.dex
