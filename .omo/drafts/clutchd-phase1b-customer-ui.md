---
slug: clutchd-phase1b-customer-ui
status: awaiting-approval
intent: clear
review_required: false
pending-action: write .omo/plans/clutchd-phase1b-customer-ui.md
approach: Sequential implementation across 5 independent areas: VEHICLES → SCHEDULE → MARKETPLACE → HISTORY → GLOBAL STATES, each verified immediately after implementation.
---

# Draft: clutchd-phase1b-customer-ui — Phase 1B Remaining Customer UI

## Components (topology ledger)
id | outcome | status | evidence path
---|---------|--------|--------------
VEH-1 | Compact vehicle empty state | active | VehicleList.js:302-321 (p-12, Car size={48})
VEH-2 | Polished vehicle populated cards | active | VehicleList.js:325-396 (card grid + service history)
VEH-3 | Preserved vehicle CRUD | active | VehicleManagerModal.js (add/delete working)
VEH-4 | Consistent plate formatting | active | plateFormatter.js used in VehicleList:140, VehicleManagerModal:149
SCH-1 | Reduced schedule empty space | active | ScheduledAppointments.js:45 (max-w-lg mx-auto)
SCH-2 | Improved booking form flow | active | ScheduleBookingModal.js:38-49 (only date+time currently)
SCH-3 | Preserved scheduling logic | active | customer/page.js:225-233 (createRequest call)
MKT-1 | Marketplace error state rendered | active | productStore error set but never rendered in page.js/search/page.js
MKT-2 | Preserved product/API integration | active | productStore, cartStore, filters (all client-side)
MKT-3 | Parts Store gold active tab | active | BottomNav.js:178, customer page tabs both use text-primary (gold)
HIS-1 | History filter counts loading | active | ServiceHistory.js:39-43 (uses history[] which starts empty)
HIS-2 | History error state | active | ServiceHistory.js:49-50 (console.warn only, no UI feedback)
HIS-3 | History loading/layout preservation | active | ServiceHistory.js:150-157 (full-page spinner hides filters)
GLOB-1 | Modal overflow fix | active | Modal.js:27,30 ("unset" instead of saved value)
GLOB-2 | Safe-area single source | active | globals.css:997-1004 + BottomNav.js:77 + customer/page.js:349
GLOB-3 | 100vh → 100dvh | active | globals.css:247 + SearchFilters:306 + Modal.js:145

## Open assumptions (announced defaults)
assumption | adopted default | rationale | reversible?
----------|----------------|----------|------------
Schedule booking form scope | Add vehicle selector and notes; skip location (backend may not accept lat/lng for scheduled-only bookings) | Location is collected elsewhere (Service tab uses trackingStore); simplest integration that doesn't break existing flow | Yes — can add location if backend supports
Vehicle make/model inputs | Keep free-text; do NOT wire vehicleData.js dropdowns | Phase 1B spec says "preserve CRUD" not "improve forms"; avoid scope creep and eliminating free-text flexibility | Yes — can convert to dropdowns in Phase 2
Marketplace error rendering | Use inline banner below search bar, not toast | Toast competes with cart/coupon toasts; inline is contextual and dismissible | Yes — can change display mechanism
History filter count loading | Hide counts during loading (show "--" or skeleton) | Simplest fix that eliminates zero flash; preserves layout | Yes — can show shimmer counts instead
Safe-area fix strategy | Remove body-level safe-area padding, keep component-level | Components are positioned relative to viewport edges; body-level padding creates double-padding on all content | Yes — can reverse if issues appear
100vh replacement | Replace 5 occurrences with 100dvh | Mobile Safari dynamic toolbar causes 100vh to be taller than viewport; dvh is the modern standard | Yes — but all major browsers support it
ServiceHistory error display | Use global toast system (useToast) for fetch failures | Already available, consistent with downloadInvoice error pattern at line 86 | Yes — can use inline error instead
Schedule form: vehicle list source | Pass vehicles as prop from customer page (which already has them from VehicleList) | Avoids duplicate fetch; customer page already renders VehicleList tab so data is available | Yes — can fetch independently

## Findings (cited - path:lines)

### VEHICLES
1. VehicleList.js:302-321 — Empty state uses `p-12` (3rem/48px padding) and `Car size={48}` icon, making it ~200px tall. Can be compacted to `p-8` / `size={36}`.
2. VehicleList.js:180 — AddVehicleCard has `min-h-[210px]` — can reduce to `min-h-[160px]` or remove fixed min-height.
3. VehicleList.js:140 + VehicleManagerModal.js:149 — `formatIndianPlate()` used in both components. Already consistent.
4. VehicleManagerModal.js:115-116 — Free-text `<Input>` for make and model. `vehicleData.js` has 12 Indian makes + 100+ models but is NOT imported here.
5. VehicleManagerModal.js:32 + VehicleList.js:213 — Both call `api.get("/vehicles")` independently. No vehicleStore.
6. VehicleManagerModal.js:60,81 — Add and Delete both work. No edit functionality.

### SCHEDULE
7. ScheduledAppointments.js:45 — `<div className="max-w-lg mx-auto">` constrains card width to ~512px, wasting horizontal space on wider views.
8. ScheduleBookingModal.js:38-49 — Only collects `{ scheduledAt }`. Missing vehicle selection, service type, notes.
9. customer/page.js:225-233 — `handleScheduleSubmit` calls `createRequest({ scheduledAt })` with minimal payload.
10. ScheduledAppointments.js:19-32 — Fetches `/jobs/history`, filters for upcoming appointments with scheduledAt set, sorts ascending, shows top 3.

### MARKETPLACE
11. marketplace/page.js:50-54 — `useProductStore()` destructures `products`, `isLoading`, `fetchProducts` — NOT `error`.
12. search/page.js:147-155 — `useProductStore()` destructures `products`, `filters`, `isLoading`, `searchProducts`, `setFilter`, `clearFilters`, `fetchProducts` — NOT `error`.
13. productStore.js:39 — `catch` block sets `{ products: [], isLoading: false, error: msg }` but error is never consumed by UI.
14. BottomNav.js:178 + customer/page.js:374 — Active tab uses `text-primary` (gold `#b8860b`/`#d4a011`). No green (`#10b981`) used for active states.
15. productStore.js:28-41 — `fetchProducts` fetches ALL products via `GET /products`, stores in memory. Filters/search/sort all client-side.

### HISTORY
16. ServiceHistory.js:39-43 — `filterCounts` computed via `useMemo` from `history` which starts as `[]`. Initial render shows "All (0)" then flashes to correct counts.
17. ServiceHistory.js:49-50 — `fetchHistory` catch block only does `console.warn`, no user-visible feedback.
18. ServiceHistory.js:150-157 — Loading state replaces entire content with a centered spinner. Filter tab bar is hidden.
19. ServiceHistory.js:159-168 — Empty history state (full page when history.length === 0 and not loading).
20. ServiceHistory.js:192-206 — Filter-specific empty states for All/Completed/Cancelled (Phase 1A).

### GLOBAL STATES
21. Modal.js:27,30 — Body overflow set to `"unset"` on close instead of restoring saved original value.
22. globals.css:997-1004 — Body gets `padding: env(safe-area-inset-*)` in all 4 directions.
23. BottomNav.js:77 — `pb-[env(safe-area-inset-bottom)]` on the nav.
24. customer/page.js:349 — `pb-[env(safe-area-inset-bottom)]` on customer dashboard nav.
25. globals.css:247 — `min-height: 100vh` on body. Should be `100dvh`.
26. src/components/marketplace/SearchFilters.js:306 — Uses `100vh` for mobile sidebar.
27. Modal.js:145 — Uses `100vh` for content area.
28. src/hooks/ directory — Only 3 hooks exist: useMaintenanceReminders.js, useToast.js, useOrderStatusNotifications.js. No useOffline, useNetwork, usePermissions.

## Decisions (with rationale)
1. **No vehicleData.js integration** — Converting free-text make/model to dropdowns is a product decision, not a UI polish. Phase 1B scope is "improve empty/loading/populated states", not "redesign forms". Keeping free-text avoids breaking existing vehicle data.
2. **Schedule form adds vehicle + notes only** — Location collection for scheduled bookings requires backend changes (the scheduled flow currently submits to the same endpoint as immediate service requests). Vehicle selection and notes are frontend-only additions compatible with existing API.
3. **Marketplace error: inline banner** — Toast would conflict with cart/coupon/invoice toasts. Inline banner below search bar is context-specific, dismissible, and uses existing component patterns (ErrorCard style but not full-screen).
4. **History filter counts: hide during loading** — Simplest approach that eliminates the zero-flash. Render the filter tab bar with `opacity-50` or placeholder dashes for counts, then populate when data arrives.
5. **Safe-area: remove from body, keep in components** — Components that actually need safe-area awareness (bottom nav, sticky headers) already have `pb-[env(safe-area-inset-bottom)]`. Body-level safe-area padding affects ALL content unnecessarily.
6. **100vh → 100dvh: all 5 occurrences** — Standard mobile Safari fix. All modern browsers support `dvh`. No polyfill needed.
7. **No new hooks for Phase 1B** — Creating useOffline/useNetwork/usePermissions hooks is Phase 2 work. The existing inline patterns in SOSButton and PushPermissionBanner are adequate.
8. **No vehicleStore** — The duplicate `GET /vehicles` calls are minor. Creating a store is architectural scope beyond Phase 1B.

## Scope IN
- VEHICLES: Compact empty state (reduce padding, icon size). Polish card layout.
- SCHEDULE: Remove width constraint. Add vehicle selector + notes to booking form.
- MARKETPLACE: Render error state (inline banner). Ensure active tab stays gold.
- HISTORY: Fix filter count zero-flash. Add error toast on fetch failure. Preserve filter bar during loading.
- GLOBAL: Fix Modal body overflow. Fix safe-area double padding. Replace 100vh with 100dvh.

## Scope OUT (Must NOT have)
- No vehicleData.js dropdown integration
- No vehicleStore creation
- No edit vehicle functionality
- No location/geolocation field in schedule booking (backend limitation)
- No new Zustand stores
- No new hooks (useOffline/useNetwork/usePermissions deferred to Phase 2)
- No marketplace search API endpoint (client-side filtering stays)
- No vendor pricing data fabrication (VendorComparisonTable stays broken)
- No product detail enhancement (details stays null)
- No real-time tracking features
- No payments integration
- No admin dashboard changes
- No Firebase/auth changes
- No TypeScript migration
- No new npm dependencies

## Open questions
1. ~~Schedule form: should location field be added?~~ DECIDED: No — backend may not accept lat/lng for scheduled-only bookings. Keep minimal.
2. ~~Vehicle make/model: wire vehicleData.js as dropdowns?~~ DECIDED: No — scope creep, Phase 1B is polish not form redesign.
3. ~~Create useOffline/useNetwork hooks?~~ DECIDED: No — Phase 2 work.
4. ~~Create vehicleStore?~~ DECIDED: No — architectural scope beyond Phase 1B.

## Approval gate
status: awaiting-approval

The plan covers 5 areas with 18 discrete changes across 8 files (3 new empty states/modals patterns, 5 existing file modifications). No new dependencies, no backend changes, no new stores. Maximum change per file is ~30 lines. Verification via npm run test + npm run build after each area.

**Approach**: Implement areas sequentially (VEHICLES → SCHEDULE → MARKETPLACE → HISTORY → GLOBAL), running `npm run test` and `npm run build` after each area to catch regressions early. Each area is independent so order is flexible.

**Must NOT have** (guardrails):
- Do not touch cartStore, plateFormatter, vehicleData.js, productStore (logic), offlineCache, requestQueue
- Do not add new dependencies
- Do not add backend calls
- Do not fabricate product/marketplace data
- Do not change active tab colors from gold to green
- Do not create new Zustand stores
- Do not edit admin, auth, fleet, garage, or mechanic pages
