# ClutchD Polish Plan - Learnings

## Project Conventions
- Next.js 16 (App Router), Tailwind v4, Zustand for state
- Components in `src/components/ui/` (53+ components)
- Pages in `src/app/` (12 routes)
- Theme: dark emerald / light amber via CSS variables
- Import alias: `@/` for src/

## Key Patterns
- `cn()` utility in `src/lib/utils.js` - needs tailwind-merge
- `isLight` ternary used 314 times across 20 files - replace with CSS vars
- Toast implementations scattered - centralize via Zustand
- Modal components have focus trap + dialog ARIA ✓
- MultiSelect needs keyboard accessibility

## Guardrails
- Do NOT change app functionality or business logic
- Do NOT break Google OAuth, Razorpay, Leaflet maps
- Do NOT change existing theme color palettes
- Do NOT add new external dependencies (use existing Zustand)
- Do NOT rewrite components entirely - refactor
- Do NOT change API contracts or store schemas

## File Structure
- `src/components/ui/` - 53+ UI components
- `src/app/` - 12 routes (landing, dashboards, auth, etc.)
- `src/lib/` - utilities, stores
- `public/` - static assets (needs favicon)

## 2026-06-20: Added tailwind-merge to cn() utility

- **File modified**: `src/lib/utils.js`
- **Change**: Added `import { twMerge } from "tailwind-merge"` and updated `cn()` to use `twMerge()`
- **Why**: Resolves conflicting Tailwind classes (e.g., `bg-red-500 bg-blue-500` results in only `bg-blue-500`)
- **Note**: tailwind-merge v3.6.0 was already in dependencies, no install needed
- **Status**: Build passes ✓

## 2026-06-20: Added ARIA accessibility to Toast system

- **Files modified**: `src/components/ui/ToastProvider.js`, `src/components/ui/Toast.js`
- **Changes**:
  - `ToastProvider.js`: Added `aria-atomic="true"` to container for full-region announcement
  - `Toast.js`: Added `TOAST_ROLES` mapping — error/warning use `role="alert"`, success/info use `role="status"`
  - Removed redundant `aria-live="polite"` from individual toasts (role handles it implicitly)
- **Why**: Screen readers now get appropriate urgency cues — assertive for errors/warnings, polite for success/info
- **Status**: Build passes ✓

## 2026-06-20: Added focus trap + ARIA to Modal & ConfirmModal

- **Files modified**: `src/components/ui/Modal.js`, `src/components/ui/ConfirmModal.js`
- **Changes**:
  - **Modal.js**: Added focus trap (Tab/Shift+Tab cycles within modal), focus save/restore on open/close, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` linking to title via generated `id` on `<h2>`, `tabIndex={-1}` on container, `aria-hidden="true"` on backdrop, `aria-label="Close modal"` on close button
  - **ConfirmModal.js**: Passes `role="alertdialog"` to Modal
- **Why**: Keyboard navigation was escaping the modal; screen readers had no dialog context
- **Implementation details**:
  - Uses `useRef` + `useEffect` (no external deps)
  - `requestAnimationFrame` for deferred focus-on-open (avoids race with render)
  - `previousActiveElement` ref stores trigger element, restores on close/unmount
  - Focusable query: `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`
- **Status**: Build passes ✓
