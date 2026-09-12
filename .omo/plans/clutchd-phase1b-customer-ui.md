# clutchd-phase1b-customer-ui - Work Plan

## TL;DR (For humans)
<!-- Fill this LAST, after the detailed plan below is written, so it summarizes the REAL plan. -->
<!-- Plain English for a non-engineer: NO file paths, NO todo numbers, NO wave/agent/tool names. -->

**What you'll get:** A polished customer dashboard with compact vehicle empty states, a vehicle-enabled schedule booking form, visible marketplace error states, fixed history filter flickering and error feedback, and resolved mobile safe-area/overflow/100vh issues across the app.

**Why this approach:** Each of the 5 areas is independent, so we can implement and verify sequentially with no cascading risk. We deliberately defer new stores, hooks, and form redesigns to Phase 2 — this phase is about polishing what exists.

**What it will NOT do:** Add new Zustand stores, wire vehicleData.js dropdowns, create useOffline hooks, add location to schedule booking, fabricate marketplace data, or change tab colors from gold to green.

**Effort:** Medium
**Risk:** Low — all changes are contained to 8 files, each <30 lines of change, no new dependencies or backend API calls
**Decisions to sanity-check:** Safe-area fix removes body-level padding (risk: notch overlap if components are wrong — mitigated by keeping component-level padding). History filter counts hidden during loading (risk: user sees no counts briefly — acceptable tradeoff vs zero flash).

Your next move: Implementation is authorized. Each todo verified after execution.

---

> TL;DR (machine): Medium effort, low risk. 11 todos across VEHICLES/SCHEDULE/MARKETPLACE/HISTORY/GLOBAL. Sequential implementation, verified per-commit.

## Scope
### Must have
- VEHICLES: Compact empty state (reduced padding/icon). Polished cards.
- SCHEDULE: Remove width constraint. Add vehicle selector + notes to booking modal. Wire through customer page.
- MARKETPLACE: Error state rendered as inline banner on marketplace pages.
- HISTORY: Filter count zero-flash fixed. Error toast on fetch failure. Filter tabs preserved during loading.
- GLOBAL: Modal overflow correctly restored. Safe-area single-sourced (component-only). 100vh→100dvh in 5 occurrences.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No vehicleData.js dropdown integration (keep free-text make/model)
- No vehicleStore creation
- No edit vehicle functionality
- No location field in schedule booking
- No new Zustand stores
- No new hooks (useOffline/useNetwork/usePermissions)
- No marketplace search API endpoint changes
- No vendor pricing data fabrication
- No product detail enhancement
- No real-time tracking, payments, admin dashboard
- No TypeScript migration
- No new npm dependencies
- No changes to cartStore, plateFormatter, productStore logic, offlineCache, requestQueue
- No active tab color changes from gold to green

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after (existing vitest suite + npm run build)
- Evidence: npm run test output showing 202/202 pass; npm run build showing "Compiled successfully"

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. VEHICLES: Compact empty state in VehicleList.js
  What to do / Must NOT do: Reduce VehicleList empty-state visual weight. Change p-12 to p-8, icon size={36} from size={48}. Reduce AddVehicleCard min-h-[210px] to min-h-[160px]. Do NOT change CRUD logic, do NOT change card layout, do NOT touch VehicleManagerModal.
  References: src/components/dashboard/VehicleList.js:302-321 (empty state), :180 (AddVehicleCard)
  Acceptance criteria: Vehicle list with 0 vehicles renders compact empty state with smaller icon + padding. Add vehicle CTA still works.
  QA: `npm run test` passes; `npm run build` compiles. Visual: empty state renders without excessive whitespace.
  Commit: Y | polish(vehicles): compact vehicle empty state

- [ ] 2. SCHEDULE: Remove width constraint from ScheduledAppointments.js
  What to do / Must NOT do: Remove `max-w-lg mx-auto` wrapper div from ScheduledAppointments.js. Keep GlassCard padding and layout intact. Do NOT change fetch logic, filtering, or empty state layout.
  References: src/components/dashboard/ScheduledAppointments.js:45 (max-w-lg mx-auto wrapper)
  Acceptance criteria: Scheduled appointments card spans full container width. No layout shift on populated/empty states.
  QA: `npm run test` passes; `npm run build` compiles. Visual: card fills available width.
  Commit: Y | polish(schedule): remove max-w constraint on appointments card

- [ ] 3. SCHEDULE: Add vehicle selector + notes to ScheduleBookingModal
  What to do / Must NOT do: Add a vehicle dropdown (select from user's vehicles array, passed as prop from customer page). Add notes textarea. Keep existing date picker + time slot grid. Do NOT change submission logic or add location field. Ensure vehicleId is passed in the onSubmit payload alongside scheduledAt.
  References: src/components/dashboard/ScheduleBookingModal.js:38-49 (current form state), customer/page.js:225-233 (handleScheduleSubmit)
  Acceptance criteria: Modal shows vehicle dropdown + notes field. On submit, payload includes vehicleId + notes + scheduledAt.
  QA: `npm run test` passes; `npm run build` compiles. Form submits with new fields.
  Commit: Y | feat(schedule): add vehicle selector and notes to booking modal

- [ ] 4. SCHEDULE: Update customer page to pass vehicles prop + new submit handler
  What to do / Must NOT do: In customer/page.js, pass vehicles array as prop to ScheduleBookingModal. Update handleScheduleSubmit to pass vehicleId and notes from modal. Use existing vehicle data already available on the page. Do NOT add new API calls.
  References: src/app/dashboard/customer/page.js:225-233 (handleScheduleSubmit), :268-273 (Schedule tab render), :333-338 (ScheduleBookingModal render)
  Acceptance criteria: Booking modal receives vehicles list. Submit sends extended payload.
  QA: `npm run test` passes; `npm run build` compiles. Booking creates request with vehicle ID.
  Commit: Y | feat(schedule): wire vehicle data and extended payload in customer page

- [ ] 5. MARKETPLACE: Render productStore error on marketplace pages
  What to do / Must NOT do: In marketplace/page.js and search/page.js, destructure `error` from useProductStore(). When error is set and products.length === 0 and !isLoading, render an inline error banner below the search bar (not toast, not full-screen). Banner should be dismissible. Do NOT change productStore, do NOT add new API calls, do NOT modify ProductCard.
  References: src/app/marketplace/page.js:50-54 (productStore destructure), src/app/marketplace/search/page.js:147-155, productStore.js:39 (error set on failure)
  Acceptance criteria: Mocked API failure shows inline error banner. Normal load shows no banner. Dismiss works.
  QA: `npm run test` passes; `npm run build` compiles. Error appears on API failure, not on success.
  Commit: Y | fix(marketplace): render product store error as dismissible banner

- [ ] 6. HISTORY: Fix filter count zero-flash in ServiceHistory
  What to do / Must NOT do: Initialize filterCounts to null when history is empty/loading. Show "--" or placeholder for counts while loading. Only compute and show real counts after data loads. Do NOT change fetch logic, empty states, or card rendering.
  References: src/components/dashboard/ServiceHistory.js:39-43 (filterCounts useMemo), :39-43 (TABS rendering)
  Acceptance criteria: Filter tabs show placeholder counts during loading. Real counts appear after fetch completes. No zero flash.
  QA: `npm run test` passes; `npm run build` compiles. During artificial delay, filter counts show "--" not "0".
  Commit: Y | fix(history): prevent filter count zero-flash during loading

- [ ] 7. HISTORY: Add error toast on fetch failure
  What to do / Must NOT do: In ServiceHistory's fetchHistory catch block, call the global useToast error method instead of (or in addition to) console.warn. Import useToast from the existing hook. Do NOT change the fetch logic or empty state.
  References: src/components/dashboard/ServiceHistory.js:49-50 (catch block), :12 (useToast import exists but unused)
  Acceptance criteria: When /jobs/history fails, user sees error toast. Functional test with mock API failure.
  QA: `npm run test` passes; `npm run build` compiles. Toast appears on API error.
  Commit: Y | fix(history): show error toast when history fetch fails

- [ ] 8. HISTORY: Preserve filter tabs during loading state
  What to do / Must NOT do: In ServiceHistory's loading state (history.length === 0 && loading), render the filter tab bar with skeleton/placeholder counts BELOW the spinner instead of hiding everything. Do NOT change populated rendering.
  References: src/components/dashboard/ServiceHistory.js:150-157 (loading state)
  Acceptance criteria: While loading, the filter tab bar is visible (with skeleton counts). UI doesn't flash from nothing→to tabs→to content.
  QA: `npm run test` passes; `npm run build` compiles. Filter tabs visible during loading state.
  Commit: Y | fix(history): show filter tabs during loading state

- [ ] 9. GLOBAL: Fix Modal.js body overflow restoration
  What to do / Must NOT do: In Modal.js's cleanup/close handler, save the original document.body.style.overflow value before setting to "hidden". On cleanup, restore the saved value instead of using "unset". Match the existing pattern used for focus restoration (previousActiveElement at line 18).
  References: src/components/ui/Modal.js:27,30 (overflow set to "unset"), :18 (previousActiveElement pattern)
  Acceptance criteria: Modal opens → body overflow is "hidden". Modal closes → body overflow restores to original value. Escape key close → same behavior.
  QA: `npm run test` passes; `npm run build` compiles. Body scroll restored correctly after modal closes.
  Commit: Y | fix(ui): restore body overflow correctly on modal close

- [ ] 10. GLOBAL: Fix safe-area double padding
  What to do / Must NOT do: Remove the body-level safe-area padding from globals.css (lines 997-1004). Keep the component-level pb-[env(safe-area-inset-bottom)] on BottomNav.js and customer dashboard nav. Do NOT add or remove any other safe-area handling. Do NOT touch any component styling.
  References: src/app/globals.css:997-1004 (body safe-area padding), src/components/ui/BottomNav.js:77 (nav safe-area), src/app/dashboard/customer/page.js:349 (nav safe-area)
  Acceptance criteria: grep for "safe-area-inset-bottom" shows it in BottomNav.js:77 and customer/page.js:349 but NOT in globals.css. Build compiles.
  QA: `npm run test` passes; `npm run build` compiles. grep for safe-area-inset-bottom in globals.css returns empty.
  Commit: Y | fix(ui): remove body-level safe-area padding to prevent double-padding

- [ ] 11. GLOBAL: Replace 100vh with 100dvh (5 occurrences)
  What to do / Must NOT do: Find and replace all `100vh` with `100dvh` in globals.css (body min-height), SearchFilters sidebar, Modal.js content area. Do NOT change: admin pages (not in Phase 1B scope), global-error.js (separate boundary), any non-100vh values.
  References: src/app/globals.css:247 (min-height: 100vh), src/components/marketplace/SearchFilters.js:306 (sidebar height), src/components/ui/Modal.js:145 (content height)
  Acceptance criteria: `grep -r "100vh" src/app/ src/components/` returns 0 matches (except exempted admin pages). Build compiles.
  QA: `npm run test` passes; `npm run build` compiles. grep returns 0 for 100vh in src/app/ and src/components/.
  Commit: Y | fix(ui): replace 100vh with 100dvh for mobile Safari compatibility

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy

## Success criteria
