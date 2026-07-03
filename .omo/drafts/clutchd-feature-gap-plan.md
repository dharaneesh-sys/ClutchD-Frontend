# Draft: ClutchD Feature Gap & Ultrawork Integration Plan

**Status:** awaiting-approval
**Intent:** CLEAR
**Review required:** true
**Slug:** clutchd-feature-gap

## Intent Announcement
Intent: **CLEAR, review required** — comprehensive audit + gap analysis + plan for integrating missing features against competitor apps. High-accuracy review will run after approval.

## Owner Decisions (from user)
1. **Payment**: Real Stripe/Razorpay integration ✅
2. **Push**: Firebase Cloud Messaging (FCM) ✅
3. **Priority order**: Safety-first → SOS + Push first, then payments, then vehicle/reviews, then marketplace depth ✅

## Research Findings Summary

### Current App Health — Structural State
- Codebase is structurally sound: consistent Zustand stores, robust Axios interceptor (401→refresh→retry with mutex), CSS-variable theming, shared components (ErrorCard, LoadingScreen, ToastProvider, Logo, DashboardShell)
- Two prior plans fully executed: production-readiness (46 tasks: deploy, Tailwind fix, theme refactor, demo mode gating, tests, PWA, mobile, marketplace MVP) + UI polish (23 tasks: logo, error/loading components, Toast, accessibility, CSS variables, favicon, clean imports)
- Testing infra exists: Vitest + Playwright
- PWA, Capacitor, Sentry all configured

### 🔴 Critical Code Issues Found (must fix in plan)

| # | Issue | File | Detail |
|---|-------|------|--------|
| C1 | **Timer leak in Demo Mode** | `src/components/dashboard/PaymentModal.js:62-84` | Nested `setTimeout` cleanups never reach React's effect. Inner timers fire on unmounted component. |
| C2 | **Duplicate `useToast` — different return shapes** | `hooks/useToast.js` vs `components/ui/ToastProvider.js` | Same export name, incompatible return shapes. Landmine for future imports. |
| C3 | **MultiSelect out-of-bounds** | `components/ui/MultiSelect.js` | `options[activeIndex].value.replace(...)` — throws if `options` is empty or `activeIndex = -1`. |
| C4 | **`_checkInterval` variable typo** | `lib/backendHealth.js:65` | Interval variable name mismatch may prevent cleanup. |
| C5 | **`toCamelCase` duplicated 5×** | `productStore.js`, `categoryStore.js`, `orderStore.js`, 2 page files | Same function copy-pasted. Should be centralized. |

### 🟠 Code Quality Issues (included in Wave 5)
- Dead imports: `GarageAnalytics.js` (recharts), `ProductReviews.js` (`CheckCircle`), `DashboardShell.js` (`Gift`), `NotificationBell.js` (`Loader2`, `CheckCircle2`)
- `ProfileFAB` and `ThemeToggle` both `fixed bottom-8 right-8` — overlap
- `formatCurrency` exists but dozens of inline `₹{x}` patterns exist
- `scheduleProactiveRefresh` in authStore references appear possibly truncated
- `MultiSelect.js` uses raw string replace on `.value` without null check
- `IncomingJobs.js` status transition skips `assigned` step

### 🧩 Feature Gap vs Competitors

Compared against: YourMechanic, Wrench, RepairSmith, ResQ, Roadr, GaragePotti, AutoZone, AAA

**ClutchD's unique advantage**: Dual marketplace (parts) + on-demand mechanic service in ONE platform. No major US competitor does both.

**Critical missing features (blocking launch-readiness):**

| Priority | Feature | Competitor Evidence | Why |
|---|---|---|---|
| 🔴 C1 | Push notifications (FCM) | YourMechanic, Wrench, AAA all use push | Real-time invisible when app is backgrounded — defeats core value prop |
| 🔴 C2 | VIN/License plate parts fitment | AutoZone "VIN decoder", Advance "search by VIN" | Wrong parts = returns = trust loss |
| 🔴 C3 | Mechanic-customer in-app chat | YourMechanic "chat prior to appointment" with photo sharing | Prevents misdiagnosis, reduces no-shows |
| 🔴 C4 | Maintenance reminders/schedules | YourMechanic 40% repeat rate driven by this | Retention engine |
| 🔴 C5 | Warranty management/display | YourMechanic/Wrench/RepairSmith ALL "12-month/12,000-mile" | #1 trust signal in mobile repair |
| 🔴 C6 | Offline-first SOS + essential data | AAA digital card works offline | Stranded users have no signal — SOS must work |

**Important growth features:**
- 🟡 Subscription/membership plans (Wrench TotalCare: $59-90/mo)
- 🟡 Online diagnostic tool / symptom checker (RepairSmith)
- 🟡 Multi-vehicle dashboard with per-vehicle history
- 🟡 Fleet/B2B services
- 🟡 BOPIS for parts marketplace
- 🟡 Real-time order/delivery tracking
- 🟡 Mechanic certification badges
- 🟡 Itemized invoice PDF generation
- 🟡 Price comparison across vendors

**Nice-to-have differentiators:**
- 🟢 EV charging station locator, pre-purchase inspections, insurance partnerships, loyalty program, DIY repair guides, social login expansion, Apple CarPlay

## Approach

**5 sequential implementation waves** — each wave parallel within itself:

| Wave | Focus | Features | Depends On |
|---|---|---|---|
| **1. Safety & Foundation** | Trust & reliability | FCM push notifications, Mechanic-customer chat, SOS offline support, Real-time ETA display | WebSocket infra (exists) |
| **2. Revenue Engine** | Monetization | Stripe/Razorpay real payments, Subscription/membership plans, Invoice PDF generation | Wave 1 (trust before money) |
| **3. User Retention** | Engagement | VIN fitment for parts, Maintenance reminders, Multi-vehicle dashboard, Warranty management | Wave 2 (payments enable subscriptions) |
| **4. Marketplace Depth** | Conversion | BOPIS, Real-time order tracking, Vendor price comparison, Mechanic certification badges | Wave 2 (payments power transactions) |
| **5. Admin Power & Polish** | Operations | Admin analytics dashboard, Fleet/B2B services, Payout management, Fix 5 critical code bugs, Deduplicate toCamelCase | Waves 1-4 (needs data) |

## Must NOT Have (Guardrails)
- No backend FastAPI code changes (frontend-only repo)
- No Google Maps integration (no budget, Leaflet stays)
- No actual app store submission (setup only)
- No replacing existing Leaflet/OSM map implementation
- No adding real AI/ML features (out of scope)
- No breaking existing demo mode functionality
- No adding dependencies without necessity

## Pending Action
Write `.omo/plans/clutchd-feature-gap.md` with ~40+ structured todos across 5 waves + verification, each with references, agent-executable acceptance criteria, and QA scenarios.
