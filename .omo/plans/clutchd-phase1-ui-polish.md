# clutchd-phase1-ui-polish — Work Plan

## TL;DR (For humans)

**What you'll get:** PHASE 1 UI improvements to ClutchD's existing screens — bottom nav consistency, landing page polish, service request flow improvements, Indian number-plate formatting, vehicle list enhancements, schedule tab improvement, marketplace polish, history filters, and SOS button positioning. 9 focused waves, each modifying only relevant files.

**Why this approach:** Incremental improvement preserves all working functionality. Each wave is isolated and independently verifiable. No rewrites, no new dependencies, no backend schema changes. Reuses existing GlassCard, Shimmer, EmptyState, Button, and all design tokens.

**What it will NOT do:** No backend changes, no fake data, no TypeScript migration, no green coloring on Parts Store, no glassmorphism additions, no implementing dispatch/matching/push/payments (PHASE 2+).

**Effort:** ~30-file changes across 9 waves. No new dependencies. No database migrations.

## Scope

IN: Bottom navigation consistency, landing page polish, service request UI improvements, Indian number-plate formatting utility, vehicle list enhancements, schedule tab improvement, marketplace polish, history filters, SOS button repositioning.

OUT: Backend schema changes, new dependencies, fake data/provider assignment, TypeScript migration, PHASE 2+ features, glassmorphism/unnecessary gradients, green for Parts Store.

## Verification strategy

- Each wave: check imports, check rendering, verify no regressions
- After all waves: `npm run build` (verifies compilation)
- `npm run test` (runs existing Vitest tests)
- Manual visual check of: landing page, customer dashboard (all 5 tabs), service request flow, vehicle management, marketplace, history

## Execution strategy

Execute waves sequentially (1 → 9) since some modifications touch related areas. Each wave is a todo item. Verify after each wave.

## Todos

### Wave 1 — Bottom Navigation Consistency

- [ ] 1. Extract reusable BottomNavigation component from customer dashboard inline code

**References:**
- Source inline nav: src/app/dashboard/customer/page.js lines 367-417
- Existing marketplace BottomNav: src/components/ui/BottomNav.js (separate component for marketplace)
- TABS definition: customer/page.js lines 58-64

**Acceptance:**
- New component at src/components/ui/CustomerBottomNav.js
- Component accepts: activeTab, onTabChange, notificationCount props
- Renders 5 tabs: Service, Schedule, Vehicles, Parts Store, History
- All tabs use SAME active styling (gold/primary)
- Parts Store tab gets `bg-surface-soft` when active (like all other tabs)
- No decorative dots unless representing real data
- Uses lucide-react icons: Wrench, Calendar, Car, ShoppingBag, History

**QA (happy):**
- All 5 tabs render correctly in a row
- Active tab shows gold/primary background
- Switching tabs fires onTabChange with correct key

**QA (failure):**
- No tabs crashes gracefully

**Commit:** "feat: extract reusable CustomerBottomNav component with consistent styling"

---

- [ ] 2. Integrate CustomerBottomNav in customer dashboard, remove inline nav

**References:**
- Customer dashboard: src/app/dashboard/customer/page.js

**Acceptance:**
- Inline nav (lines 367-417) replaced with <CustomerBottomNav>
- All tab state management preserved
- Safe area insets preserved
- SOS button positioning not broken

**QA (happy):**
- Tab switching works identically to before
- All 5 tabs navigable

**QA (failure):**
- No visual regression from nav replacement

**Commit:** "fix: integrate CustomerBottomNav, remove inline duplicated nav"

---

### Wave 2 — Landing Page Polish

- [ ] 3. Improve landing page spacing, hierarchy, card styling, responsiveness

**References:**
- src/app/page.js

**Acceptance:**
- Preserve all content: ClutchD logo, "Now live in Coimbatore", headline, subtitle, Get Started/Sign In buttons, How It Works section, 4 feature cards (Instant Connect, Live Tracking, Verified Pros, 24/7 Available)
- Use responsive grid for feature cards (2-col on tablet, 4-col on desktop)
- Improve card spacing and visual hierarchy
- Get Started = primary CTA with gold gradient
- Sign In = secondary with subtle glass styling
- Ensure all text has sufficient contrast

**QA (happy):**
- All sections render on mobile, tablet, desktop
- CTAs visible and functional
- Feature cards in grid layout

**QA (failure):**
- Empty state: N/A (static page)
- Loading: page loads progressively

**Commit:** "polish: improve landing page spacing, hierarchy, responsiveness"

---

### Wave 3 — Service Request Flow Improvements

- [ ] 4. Improve ServiceRequestPanel layout and mobile wording

**References:**
- src/components/dashboard/ServiceRequestPanel.js

**Acceptance:**
- Change media upload label from "Upload Photo/Video (Optional)" to "Add photos or video"
- Improve provider preference segmented control appearance (Fastest | Mechanic | Garage)
- Improve LocationIndicator compactness and states
- Better vehicle selection UX with formatted plate display
- Improve estimated price display
- "Find Help Now" button remains dominant CTA

**QA (happy):**
- Form renders all fields
- Provider preference shows 3 options in segmented control
- "Add photos or video" label visible
- File upload accepts image and video

**QA (failure):**
- No vehicles: shows "No vehicles added" with Add Vehicle button
- GPS denied: shows manual entry option
- Form validation errors displayed inline

**Commit:** "feat: improve ServiceRequestPanel with mobile-native media wording and better layout"

---

### Wave 4 — Indian Number-Plate Formatting

- [ ] 5. Add Indian registration number formatter utility

**References:**
- Vehicle plate field: license_plate (vehicle.py:18, schemas/vehicle.py:11)
- VehicleManagerModal form reference: src/components/dashboard/VehicleManagerModal.js

**Acceptance:**
- Create `formatIndianPlate(plate)` function in `src/lib/validators.js` or new `src/lib/plateFormatter.js`
- Function normalizes input: uppercase, remove spaces/hyphens
- Accepts formats: `tn38ab1234`, `TN38AB1234`, `TN 38 AB 1234`, `TN-38-AB-1234`
- Returns canonical format: `TN38AB1234`
- Display format: `TN 38 AB 1234`
- Rejects invalid characters (non-alphanumeric except spaces/hyphens for parsing)

**QA (happy):**
- `formatIndianPlate("tn38ab1234")` → `{ display: "TN 38 AB 1234", canonical: "TN38AB1234" }`
- `formatIndianPlate("TN-38-AB-1234")` → `{ display: "TN 38 AB 1234", canonical: "TN38AB1234" }`
- `formatIndianPlate("TN 38 AB 1234")` → `{ display: "TN 38 AB 1234", canonical: "TN38AB1234" }`

**QA (failure):**
- Empty string returns empty
- Null returns null/empty
- Very old format with dots is preserved as-is

**Commit:** "feat: add Indian vehicle registration plate formatter"

---

- [ ] 6. Integrate plate formatter at input and display boundaries

**References:**
- Create vehicle: src/components/dashboard/VehicleManagerModal.js
- Display vehicles: src/components/dashboard/VehicleList.js (line 136-139)
- Display in service: src/components/dashboard/ServiceRequestPanel.js (line 278)
- Display in history: src/components/dashboard/ServiceHistory.js
- Display in provider UI: src/components/dashboard/ProviderList.jsx

**Acceptance:**
- VehicleManagerModal input auto-formats as user types
- All vehicle display locations show formatted plate (TN 38 AB 1234)
- No backend migration needed — stored as-is

**QA (happy):**
- Entering "tn38ab1234" shows formatted preview
- List view shows "TN 38 AB 1234"
- Service request shows "TN 38 AB 1234"

**QA (failure):**
- No plate: shows "No plate" or empty gracefully

**Commit:** "feat: integrate plate formatter across vehicle display points"

---

### Wave 5 — Schedule Tab Improvement

- [ ] 7. Improve Schedule tab with more useful content and reduced unused space

**References:**
- src/app/dashboard/customer/page.js lines 267-291

**Acceptance:**
- Replace large empty promo card with compact, useful content
- Show next scheduled appointment if one exists
- Show "No upcoming appointments" with CTA to schedule
- Keep ScheduleBookingModal integration
- Reduce whitespace by ~40%

**QA (happy):**
- Schedule tab shows compact layout
- Book Appointment button opens modal
- Modal shows date picker and time slots

**QA (failure):**
- No upcoming appointments shows empty state with CTA

**Commit:** "improve: schedule tab with compact layout and better empty state"

---

### Wave 6 — Vehicle List Enhancements

- [ ] 8. Add skeleton loading and formatted plate display to VehicleList

**References:**
- src/components/dashboard/VehicleList.js

**Acceptance:**
- Use Shimmer component for loading state (replacing current spinner)
- Display formatted plate using plateFormatter
- Improve empty state layout
- Preserve all existing functionality: CRUD, service history, maintenance checks

**QA (happy):**
- Loading shows shimmer cards (not spinner)
- Vehicle cards show "TN 38 AB 1234"
- Empty state shows Add Vehicle button
- Selecting vehicle shows service history

**QA (failure):**
- API error shows cached vehicles or empty state

**Commit:** "improve: vehicle list with skeleton loading and formatted plates"

---

### Wave 7 — Marketplace Polish

- [ ] 9. Improve marketplace product cards and loading states

**References:**
- src/app/marketplace/page.js

**Acceptance:**
- Ensure consistent card styling with rest of app (use existing design tokens)
- Improve empty state for products
- Improve category grid responsiveness
- Preserve all existing: search, categories, featured products, navigation

**QA (happy):**
- Categories grid renders
- Featured products scrollable row
- Search bar functional
- Loading states show skeletons

**QA (failure):**
- No products: shows "No products available yet."
- API error: shows error state

**Commit:** "polish: marketplace product cards and loading states"

---

### Wave 8 — Service History Filters

- [ ] 10. Add All/Completed/Cancelled filter tabs to ServiceHistory

**References:**
- src/components/dashboard/ServiceHistory.js

**Acceptance:**
- Add filter tabs at top: All | Completed | Cancelled
- "All" shows all history items (default)
- "Completed" filters to `status === "completed"`
- "Cancelled" filters to `status === "cancelled"`
- Active filter uses gold/primary styling
- Improve card layout and empty state per filter
- Preserve all existing functionality: invoice, download, email, delete, warranty

**QA (happy):**
- Default shows all items
- Clicking "Completed" shows only completed jobs
- Clicking "Cancelled" shows only cancelled jobs
- Empty state per filter shows appropriate message

**QA (failure):**
- No history: shows empty state
- API error: shows error message

**Commit:** "feat: add All/Completed/Cancelled filter tabs to service history"

---

### Wave 9 — SOS Button Positioning

- [ ] 11. Improve SOS button positioning to not overpower navigation

**References:**
- src/components/ui/SOSButton.js

**Acceptance:**
- Keep SOS button visible but not overpowering
- Maintain red for emergency semantics
- Maintain all existing functionality (confirm/send/queue)
- Position above bottom nav without overlapping
- All states preserved: idle, confirming, sent, queued, error

**QA (happy):**
- Button renders fixed at bottom-left
- Does not overlap bottom nav
- All 4 states render correctly
- Confirm flow works (tap → tap again to send)

**QA (failure):**
- Rate-limited shows error toast
- Offline queues SOS

**Commit:** "fix: reposition SOS button to avoid overlapping bottom nav"

---

## Final verification wave

- [ ] F1. Build verification: `npm run build` succeeds
- [ ] F2. Test verification: `npm run test` passes (existing tests)
- [ ] F3. Navigation check: All 5 tabs functional, Parts Store consistent
- [ ] F4. Service flow check: Form renders, validation works, submit calls API
- [ ] F5. Number plate check: Indian format normalizes and displays correctly
- [ ] F6. SOS button check: Visible, not overlapping nav, states work

## Commit strategy

Each wave gets its own commit. 11 commits total. All on `main` branch (project convention per AGENTS.md).

## Success criteria

- Bottom nav consistent (all tabs use same gold active treatment)
- Landing page responsive with improved spacing/hierarchy
- Service request has mobile-native wording and improved layout
- Indian number plates auto-format on input and display as "TN 38 AB 1234"
- Vehicle list uses shimmer loading with formatted plates
- Schedule tab is compact and useful
- Marketplace has consistent cards and loading states
- History shows All/Completed/Cancelled filters
- SOS button visible but not overpowering
- `npm run build` succeeds
- `npm run test` passes
