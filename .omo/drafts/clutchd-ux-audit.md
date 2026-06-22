# Draft: ClutchD UI/UX & Professionalism Audit

## Research Findings Summary

### App Structure
- Next.js 16 App Router, React 19, Tailwind v4
- 12 routes across 4 roles (customer, mechanic, garage, admin)
- 53+ UI components
- Strong CSS design system with glassmorphism, M3-type scale
- Zustand state management, Axios API, WebSocket real-time
- framer-motion v12 installed but **completely unused** (0 imports)

### Critical Issues from Exploration

**AI Slop / Template Artifacts:**
1. "M" placeholder logo on all dashboards/admin vs "C" on landing page
2. `animateBorder` prop accepted by GlassCard but does nothing
3. `bg-mesh` CSS class used in layout.js but never defined
4. Planning comment: `// Lazy-loaded history component (Phase 6)` in customer/page.js
5. 10+ identical error.js files (byte-for-byte duplicate)
6. 9+ near-identical loading.js files
7. Dashboard header duplicated 3x (~57 lines each)
8. `type-body-3` used but not defined in CSS
9. `xs:inline` non-standard Tailwind breakpoint

**Accessibility (Score: 4/10):**
- No focus trap in any Modal
- MultiSelect not keyboard-accessible
- PaymentModal method selector not keyboard-accessible
- No aria-live/role="alert" on toasts (~15 components)
- No aria-expanded on dropdowns
- No aria-invalid on form fields
- No skip-to-content link
- Forgot password code exposed in console logs (SECURITY)

**UX Gaps:**
- No centralized toast system (6+ scattered implementations)
- No breadcrumbs or back navigation
- No metadata/title on any "use client" page (all dashboards + admin)
- Loading.js hardcodes dark backgrounds (breaks light mode)
- Spinners used where skeletons would be better
- EmptyState component exists but not consistently used
- No unsaved changes warning on forms

**Visual Polish:**
- No logo assets in /public/ (only Next.js boilerplate)
- No favicon
- Inconsistent spacing between pages
- DemoToolbar (427 lines, extensive inline styles) looks like dev tool
- isLight ternary pattern repeated 50+ times (repetitive, should use CSS vars)
- Some components hardcode emerald colors that break in light mode

**Code Quality:**
- Large files: DemoToolbar (427), LoginCard (369), PaymentModal (361), ServiceRequestPanel (370)
- Duplicated fee preview logic in IncomingJobs + GarageJobQueue
- Dead prop: animateBorder in GlassCard
- alert() for errors in ProfileEditor and GarageProfile
- framer-motion unused (~30KB gzipped)
- cn() utility without tailwind-merge
- Inconsistent import paths (@/ vs ../../../)
