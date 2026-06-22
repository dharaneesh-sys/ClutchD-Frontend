# ClutchD — Security Hardening

## TL;DR

> **Quick Summary**: Apply 4 low-risk, high-impact security fixes to the ClutchD frontend — CSP headers, stronger password policy, minimized localStorage exposure, and SRI on third-party scripts.
>
> **Deliverables**:
> - `next.config.mjs` updated with Content-Security-Policy header
> - `src/lib/validators.js` updated with stronger password rules (8+ chars, complexity)
> - `src/store/authStore.js` updated to persist only role+userId, not full PII
> - `src/components/auth/LoginCard.js` + `SignUpCard.js` updated with SRI on Google GSI script
>
> **Estimated Effort**: Quick (15-30 min)
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: None (all tasks are independent)

---

## Context

### Original Request
Run security fixes from the audit findings without breaking anything.

### Security Audit Summary
The full audit found **2 HIGH, 3 MEDIUM, 2 LOW** findings. This plan addresses the 4 frontend-actionable ones:
1. **Missing CSP** (HIGH) — No Content-Security-Policy header
2. **Weak password policy** (MEDIUM) — Only 6-char minimum, no complexity
3. **Auth PII in localStorage** (MEDIUM) — Full user object persisted in zustand store
4. **No SRI on third-party scripts** (MEDIUM) — Google GSI script loaded without integrity hash

### Guardrails
- **Do NOT break Google OAuth** — The CSP must allow `accounts.google.com` and the GSI script must still load
- **Do NOT break Razorpay** — CSP must allow `checkout.razorpay.com`
- **Do NOT break Leaflet maps** — CSP must allow tile servers and marker CDN
- **Do NOT break existing users** — Password policy change only affects NEW signups
- **Do NOT break auth persistence** — Users must still stay logged in on page refresh

---

## Work Objectives

### Core Objective
Eliminate 4 security findings from the audit without regressions.

### Concrete Deliverables
- `next.config.mjs` — Add `Content-Security-Policy` security header
- `src/lib/validators.js` — Strengthen password validation
- `src/store/authStore.js` — Strip PII from persisted state
- `src/components/auth/LoginCard.js` — Add SRI to Google GSI script tag
- `src/components/auth/SignUpCard.js` — Add SRI to Google GSI script tag

### Definition of Done
- [ ] `curl -I https://clutchd.example.com | grep -i content-security-policy` returns a policy header
- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] Signup form rejects password "abc123" (too short, no uppercase/numbers required in new rules)
- [ ] Signup form accepts password "SecurePass1" (meets new rules)
- [ ] `localStorage.getItem('auth-storage')` shows `userId` + `role` only, not full PII
- [ ] Google OAuth button renders and loads (test with visiting `/auth` after fix)

### Must Have
- CSP header present in all responses
- Password validation enforces ≥8 chars + uppercase + lowercase + number
- localStorage auth state contains no PII beyond userId + role
- Google GSI script has `integrity` attribute

### Must NOT Have (Guardrails)
- CSP must NOT block: Google GSI (`https://accounts.google.com`), Razorpay (`https://checkout.razorpay.com`), OpenStreetMap tiles, Nominatim API, OSRM routing, Leaflet CDN
- CSP must NOT use `unsafe-inline` for scripts — refactor is out of scope, so a minimal `unsafe-inline` is acceptable for this pass
- Password change must NOT affect existing users (they already have passwords)
- Auth persistence must NOT break — users must stay logged in after refresh

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Next.js)
- **Automated tests**: None (no Jest/Vitest config found)
- **Agent-Executed QA**: MANDATORY for all tasks

---

## Execution Strategy

```
Wave 1 (Start Immediately — all independent):
├── Task 1: Add Content-Security-Policy to next.config.mjs [quick]
├── Task 2: Strengthen password validation in validators.js [quick]
└── Task 3: Strip PII from authStore.js persisted state [quick]

Wave 2 (independent, but after Wave 1 for review):
├── Task 4: Add SRI to Google GSI script in LoginCard.js [unspecified-high]
├── Task 5: Add SRI to Google GSI script in SignUpCard.js [unspecified-high]
└── Task F1: Build + lint verification + QA [quick]

Wave FINAL:
├── Task F1: Build verification + QA signoff
```

---

## TODOs

- [x] 1. Add Content-Security-Policy header to next.config.mjs

  **What to do**:
  Add a `Content-Security-Policy` header to the existing `headers()` function in `next.config.mjs`.
  
  The policy must allow:
  - `default-src 'self'`
  - `script-src 'self' https://accounts.google.com https://checkout.razorpay.com 'unsafe-inline' https://raw.githubusercontent.com` (unsafe-inline needed for the inline theme script in layout.js — refactoring that is out of scope)
  - `style-src 'self' 'unsafe-inline' https://unpkg.com`
  - `img-src 'self' data: https:`
  - `connect-src 'self' https://nominatim.openstreetmap.org https://router.project-osrm.org wss:`
  - `font-src 'self' data:`
  - `frame-src https://accounts.google.com`
  
  Add as a new entry in the `headers` array alongside existing ones.

  **Must NOT do**:
  - Remove or modify any existing headers
  - Block Google OAuth, Razorpay, Leaflet tiles, or OSRM routing
  - Use `'none'` for any directive that would block needed resources

  **Files to modify**:
  - `next.config.mjs` — Add CSP to the headers array

  **Acceptance Criteria**:
  - [ ] `next.config.mjs` has a `Content-Security-Policy` header entry
  - [ ] `npm run build` passes
  - [ ] `npm run lint` passes
  - [ ] CSP contains all required directives listed above

  **QA Scenarios**:
  ```
  Scenario: CSP header is present in configuration
    Tool: Bash (grep)
    Steps:
      1. grep "Content-Security-Policy" next.config.mjs
      2. Confirm it appears in the headers array
    Expected Result: CSP header is defined with all required directives
    Evidence: .omo/evidence/task-1-csp-present.txt

  Scenario: Build passes without errors
    Tool: Bash (npm)
    Steps:
      1. npm run build 2>&1
    Expected Result: Build succeeds, exit code 0
    Evidence: .omo/evidence/task-1-build-pass.txt
  ```

  **Agent Profile**: quick
  **Parallelization**: Wave 1, with Tasks 2, 3
  **Blocks**: Task F1
  **Blocked By**: None

- [x] 2. Strengthen password validation in validators.js

  **What to do**:
  Update the password validation in all three schemas (`loginSchema`, `customerSignupSchema`, `mechanicSignupSchema`, `garageSignupSchema`) in `src/lib/validators.js`:
  - Change `min(6)` to `min(8)`
  - Add `.regex(/[A-Z]/, "Must include an uppercase letter")`
  - Add `.regex(/[a-z]/, "Must include a lowercase letter")`
  - Add `.regex(/[0-9]/, "Must include a number")`

  **Must NOT do**:
  - Change the `confirmPassword` refinement logic
  - Change any non-password validation rules
  - Make the error messages confusing or inconsistent with UI style

  **Files to modify**:
  - `src/lib/validators.js` — Update password fields in all schemas

  **Acceptance Criteria**:
  - [ ] `loginSchema` enforces: min 8, uppercase, lowercase, number
  - [ ] `customerSignupSchema` enforces same
  - [ ] `mechanicSignupSchema` enforces same
  - [ ] `garageSignupSchema` enforces same
  - [ ] All error messages are clear and user-friendly

  **QA Scenarios**:
  ```
  Scenario: Weak password is rejected
    Tool: Bash (node REPL)
    Steps:
      1. node -e "const { loginSchema } = require('./src/lib/validators'); try { loginSchema.parse({ email: 'test@test.com', password: 'abc123' }); console.log('SHOULD HAVE FAILED'); } catch(e) { console.log('REJECTED:', e.errors[0].message); }"
    Expected Result: Password rejected with validation error
    Evidence: .omo/evidence/task-2-weak-rejected.txt

  Scenario: Strong password is accepted
    Tool: Bash (node REPL)
    Steps:
      1. node -e "const { loginSchema } = require('./src/lib/validators'); try { const r = loginSchema.parse({ email: 'test@test.com', password: 'SecurePass1' }); console.log('ACCEPTED:', r.password); } catch(e) { console.log('UNEXPECTED REJECTION:', e.errors); }"
    Expected Result: Password accepted
    Evidence: .omo/evidence/task-2-strong-accepted.txt
  ```

  **Agent Profile**: quick
  **Parallelization**: Wave 1, with Tasks 1, 3
  **Blocks**: None
  **Blocked By**: None

- [x] 3. Strip PII from authStore.js persisted state

  **What to do**:
  Modify the `partialize` function in `src/store/authStore.js` to persist only `userId` and `role` instead of the full `user` object.

  Changes:
  - Replace `user: state.user` with `userId: state.user?.id` and `userRole: state.user?.role`
  - Keep `isAuthenticated` and `_hydrated`
  
  Also update `onRehydrateStorage` to reconstruct a minimal user object from the stored data (or set user to null, relying on `checkAuth()` to fetch it from the backend).

  **Must NOT do**:
  - Break `checkAuth()` — it should still fetch the full user from the backend
  - Break any UI component that reads `user.name`, `user.email`, etc. — the store should still hold the full user object in memory, just not persist it
  - Change any store methods (login, logout, signup, etc.)

  **Files to modify**:
  - `src/store/authStore.js` — `partialize` function + rehydration handler

  **Acceptance Criteria**:
  - [ ] `localStorage.getItem('auth-storage')` contains no PII fields (name, email, phone)
  - [ ] `localStorage.getItem('auth-storage')` contains userId and role
  - [ ] After page refresh, `useAuthStore.getState().user` still returns the full user object (fetched via checkAuth or rehydrated)
  - [ ] Login flow still works end-to-end

  **QA Scenarios**:
  ```
  Scenario: localStorage contains no PII
    Tool: Bash (node REPL simulating localStorage)
    Steps:
      1. Check the partialize logic: only userId, role, isAuthenticated, _hydrated are persisted
    Expected Result: PII fields (name, email, phone) are NOT in the persisted subset
    Evidence: .omo/evidence/task-3-no-pii-in-storage.txt

  Scenario: Store still holds full user in memory
    Tool: Bash (grep)
    Steps:
      1. Check authStore.js still has user: state.user in the store state
    Expected Result: The store state includes full user, only the persisted layer is minimized
    Evidence: .omo/evidence/task-3-store-has-user.txt
  ```

  **Agent Profile**: quick
  **Parallelization**: Wave 1, with Tasks 1, 2
  **Blocks**: None
  **Blocked By**: None

- [x] 4. Add SRI to Google GSI script in LoginCard.js

  **What to do**:
  Add an `integrity` attribute to the dynamically created Google GSI script element in `LoginCard.js`.

  Current code (line 102-108):
  ```js
  const script = document.createElement("script");
  script.id = scriptId;
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = initGoogle;
  document.body.appendChild(script);
  ```

  Add: `script.integrity = "sha384-..."` with the correct SRI hash.

  To get the correct hash, fetch the script and compute it:
  1. Fetch: `curl -s https://accounts.google.com/gsi/client | openssl dgst -sha384 -binary | openssl base64 -A`
  2. Use the output as the integrity value

  **Must NOT do**:
  - Change any other behavior of the script loading
  - Break the Google OAuth flow

  **Files to modify**:
  - `src/components/auth/LoginCard.js` — Add `integrity` to dynamic script tag

  **Acceptance Criteria**:
  - [ ] Script element has `integrity` attribute with correct sha384 hash
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Script tag has integrity attribute
    Tool: Bash (grep)
    Steps:
      1. grep -n "integrity" src/components/auth/LoginCard.js
      2. Confirm the integrity attribute is set on the dynamic script
    Expected Result: integrity attribute present with sha384-... value
    Evidence: .omo/evidence/task-4-login-sri-present.txt

  Scenario: Build passes
    Tool: Bash (npm)
    Steps:
      1. npm run build 2>&1 | tail -20
    Expected Result: Build succeeds
    Evidence: .omo/evidence/task-4-build-pass.txt
  ```

  **Agent Profile**: unspecified-high
  **Parallelization**: Wave 2, after Tasks 1-3
  **Blocks**: None
  **Blocked By**: None (can run alongside Task 5)

- [x] 5. Add SRI to Google GSI script in SignUpCard.js

  **What to do**:
  Same as Task 4, but for `src/components/auth/SignUpCard.js` (line 114-120).

  Add `script.integrity = "sha384-..."` with the same SRI hash.

  **Must NOT do**:
  - Same guardrails as Task 4

  **Files to modify**:
  - `src/components/auth/SignUpCard.js` — Add `integrity` to dynamic script tag

  **Acceptance Criteria**:
  - [ ] Script element has `integrity` attribute with correct sha384 hash
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Script tag has integrity attribute
    Tool: Bash (grep)
    Steps:
      1. grep -n "integrity" src/components/auth/SignUpCard.js
    Expected Result: integrity attribute present
    Evidence: .omo/evidence/task-5-signup-sri-present.txt
  ```

  **Agent Profile**: unspecified-high
  **Parallelization**: Wave 2, with Task 4
  **Blocks**: None
  **Blocked By**: None

---

## Final Verification Wave

- [x] F1. **Build + Lint + QA Signoff** — `quick`
  
  Run the full verification:
  1. `npm run build` — must pass
  2. `npm run lint` — must pass
  3. Run all QA scenarios from Tasks 1-5
  4. Verify CSP is in `next.config.mjs`
  5. Verify password schema rejects weak passwords
  6. Verify authStore partialize is stripped of PII
  7. Verify SRI integrity attributes are present

  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | QA [N/N pass] | VERDICT`

---

## Commit Strategy

- **1**: `security: add Content-Security-Policy header` — `next.config.mjs`
- **2**: `security: strengthen password validation to 8+ chars with complexity` — `src/lib/validators.js`
- **3**: `security: minimize PII persisted in authStore localStorage` — `src/store/authStore.js`
- **4-5**: `security: add Subresource Integrity to Google GSI script` — `src/components/auth/LoginCard.js`, `src/components/auth/SignUpCard.js`

---

## Success Criteria

### Verification Commands
```bash
npm run build    # Expected: exit 0, no errors
npm run lint     # Expected: exit 0, no errors
```

### Final Checklist
- [x] CSP header present in next.config.mjs
- [x] Password validation requires ≥8 chars + uppercase + lowercase + number
- [x] localStorage auth-storage has no PII (only userId + role)
- [x] LoginCard.js GSI script has integrity attribute
- [x] SignUpCard.js GSI script has integrity attribute
- [x] Build passes
- [x] Lint passes
