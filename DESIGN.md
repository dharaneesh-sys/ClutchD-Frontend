# ClutchD App — Design Contract (DESIGN.md)

**Status: AUTHORITATIVE — flat-blue pilot contract.** Effective 2026-10-25 on branch `redesign/blue-pilot`.
**Scope:** ClutchD-App (Next.js 16 + Capacitor + Tailwind v4). The pilot covers customer, mechanic and garage in full; marketplace receives tokens/navigation; seller, fleet and admin receive tokens/shell only.
**Reference direction:** `/home/dinusus/Downloads/ClutchD Blue Two-Wheeler Service App Showcase.png` (the plan's `~/Pictures/...` path is stale). The image is a north star to improve, not a screen-by-screen spec.
**Rule of conflict:** §0 wins over every rule below and over code. If code disagrees, code is wrong. The historical contract (D1–D16) is retained for audit only.

> **This contract supersedes the old indigo/glass rules.** It retires `#1E29B6`, `#162086`, `#2e3bd1`, Instrument Serif headings, `glass-lux` content cards and the six-item marketplace nav. Conflicting historical sections are tagged `SUPERSEDED` inline with the reason and the replacement section.

---

## 0. Flat-blue pilot contract (AUTHORITATIVE)

### 0.1 Non-negotiables at a glance

- **Brand:** light primary `#1A73E8`, small-text blue `#1557B0`, canvas `#F5F7FB`, card `#FFFFFF`, text `#111827`, muted `#5F6B7A`, border `#E1E7F0`, success `#188038`, pending `#B06000`, danger `#D93025`. Dark values and contrast ratios are in §0.3.
- **Type:** Onest only. Instrument Serif is retired. No remote Google Fonts import; self-host through `next/font/google`.
- **Surfaces:** every content surface is flat. Glass is allowed ONLY on (1) the fixed bottom navigation bar, (2) modal/sheet scrim + panel, (3) floating map controls, (4) the splash overlay.
- **Banned by name:** `glass-lux`, `glass-strong`, `surface-elevated`, `surface-filled`, `surface-outlined`, `btn-glow`, `hover-glow`, cream `rgba(255,249,235,...)`, indigo `#1E29B6`/`#162086`/`#2e3bd1`, Instrument Serif. No gradients and no glow.
- **Shape:** card radius 16px, control radius 12px, 1px card border and one soft shadow.
- **Navigation:** customer 5, marketplace 5, mechanic 5, garage 5, seller 4; fleet keeps its existing nav; admin keeps its desktop sidebar. No back arrow on top-level screens; back only on pushed/detail screens.
- **Status/payment:** the exact status map is §0.8. Payment is immediate capture; there is no hold/release UI.
- **Accessibility:** 4.5:1 body text, 3:1 large text, visible focus rings, keyboard modal trap, reduced-motion support, and status conveyed by text not colour alone (§0.9).
- **Real data only:** every amount, quote, balance and fixture shown in the app comes from the live API or a cache of real API data. Unsupported values render `—`. Rent/incentives are out of pilot scope; `NEXT_PUBLIC_BILLING_ENABLED` defaults to false (§0.10–§0.11).

### 0.2 Surface system — flat by default

Every content surface is flat: `background: var(--surface-card)`, `border: 1px solid var(--border)`, `border-radius: 16px`, `box-shadow: var(--shadow-card)`. This applies to cards, lists, forms, inputs, stat tiles, headers, tabs, popovers, toasts and empty states.

Glass is allowed ONLY on these four surfaces:

1. **Bottom navigation bar** — the fixed mobile tab bar.
2. **Modal/sheet scrim + panel** — the scrim uses `--glass-overlay-scrim`; the panel may use `--glass-overlay-bg` plus blur.
3. **Floating map controls** — zoom, recenter and layer buttons over the map.
4. **Splash overlay** — the full-screen launch/hero overlay.

Approved glass recipe, using tokens only:

```css
background: var(--glass-overlay-bg);
border: 1px solid var(--glass-overlay-border);
backdrop-filter: blur(var(--glass-overlay-blur));
-webkit-backdrop-filter: blur(var(--glass-overlay-blur));
```

No `saturate(...)`, no cream tint, no indigo tint, no glow shadow, and no `backdrop-blur` anywhere else.

**Banned legacy classes and values (zero hits in `src/`):**

| Banned | Why / replacement |
|---|---|
| `glass-lux`, `glass`, `glass-strong`, `glass-lux-strong`, `glass-hover` | Old indigo glass; use flat `--surface-card`, or an approved overlay only |
| `surface-elevated`, `surface-filled`, `surface-outlined` | Old card variants; all collapse to the flat card |
| `btn-glow`, `hover-glow` | Neon glow; use a flat fill and `--shadow-card` |
| `rgba(255,249,235,...)` (cream) | Old light glass tint; banned |
| `#1E29B6`, `#162086`, `#2e3bd1` (indigo) | Old brand; banned |
| `Instrument Serif` | Old display face; Onest only |
| `backdrop-blur` outside the four allowed surfaces | Glass leakage; remove |
| Gradient text/buttons/backgrounds, `saturate(1.2)` / `saturate(1.3)` | No gradients or glow in this system |
| `dark:` utility variants for colour | Theme through `data-theme` tokens only |

A legacy class in new or migrated code is a bug. Temporary aliases may exist only while a task is in flight; the pilot's final state is zero hits (task 10).

### 0.3 Palette and exact tokens

Light values live in `:root`; dark values live in `[data-theme="dark"]`. These are the canonical token names for task 5.

| Role | Token | Light | Dark | Rule |
|---|---|---|---|---|
| Primary | `--primary` | `#1A73E8` | `#8AB4F8` | Fills, primary actions, active icons |
| Primary small text | `--primary-dark` | `#1557B0` | `#A8C7FA` | All small blue text and links; never use `--primary` for body-size text |
| Canvas | `--background` | `#F5F7FB` | `#0B1220` | App background |
| Surface card | `--surface-card` | `#FFFFFF` | `#151C28` | Flat cards, modal/sheet panels |
| Text | `--foreground` | `#111827` | `#E8EEF7` | Primary text |
| Muted text | `--text-muted` | `#5F6B7A` | `#A7B2C3` | Secondary text, captions |
| Border | `--border` | `#E1E7F0` | `#2A3444` | 1px card borders and dividers |
| Control border | `--border-strong` | `#748192` | `#5C6C84` | Form-control boundaries (3:1 on card and canvas) |
| Success | `--success` | `#188038` | `#81C995` | Completed/paid |
| Pending | `--pending` | `#B06000` | `#FDD663` | Pending/awaiting fills and icons; text on card |
| Danger | `--danger` | `#D93025` | `#F28B82` | Error, cancelled, destructive |
| On primary | `--on-primary` | `#FFFFFF` | `#0B1220` | Text/icons on a primary fill |
| Soft surface | `--surface-soft` | `#EDF2FA` | `#1B2432` | Active tab pill, tinted rows, skeletons |
| Focus ring | `--ring` | `#1A73E8` | `#A8C7FA` | 2px focus outline |
| Pending soft | `--pending-soft` | `#FDF3E7` | `#3A2C12` | Pending chip background |
| Pending ink | `--pending-ink` | `#8A4A00` | `#FDD663` | Pending text directly on canvas |
| Danger ink | `--danger-ink` | `#C5221F` | `#F28B82` | Danger text directly on canvas |
| Glass background | `--glass-overlay-bg` | `rgba(255,255,255,0.78)` | `rgba(21,28,40,0.78)` | Approved glass only |
| Glass border | `--glass-overlay-border` | `rgba(255,255,255,0.55)` | `rgba(232,238,247,0.14)` | Approved glass only |
| Glass scrim | `--glass-overlay-scrim` | `rgba(17,24,39,0.48)` | `rgba(0,0,0,0.62)` | Modal/sheet scrim |
| Glass blur | `--glass-overlay-blur` | `16px` | `16px` | Approved glass only |
| Card shadow | `--shadow-card` | `0 1px 2px rgba(17,24,39,0.04), 0 8px 24px rgba(17,24,39,0.06)` | `0 1px 2px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.35)` | Flat card only |

**Light contrast ratios (WCAG 2.x relative-luminance formula):**

| Pair | Ratio | Use |
|---|---|---|
| `#111827` on `#F5F7FB` | 16.54:1 | Body text on canvas |
| `#111827` on `#FFFFFF` | 17.74:1 | Body text on card |
| `#5F6B7A` on `#F5F7FB` | 5.06:1 | Muted text on canvas |
| `#5F6B7A` on `#FFFFFF` | 5.43:1 | Muted text on card |
| `#1557B0` on `#F5F7FB` | 6.48:1 | Small blue text on canvas |
| `#1557B0` on `#FFFFFF` | 6.95:1 | Small blue text on card |
| `#FFFFFF` on `#1A73E8` | 4.51:1 | `--on-primary` on primary |
| `#188038` on `#FFFFFF` | 5.02:1 | Success text on card |
| `#B06000` on `#FFFFFF` | 4.65:1 | Pending text on card |
| `#D93025` on `#FFFFFF` | 4.77:1 | Danger text on card |
| `#8A4A00` on `#F5F7FB` | 6.40:1 | `--pending-ink` on canvas |
| `#C5221F` on `#F5F7FB` | 5.40:1 | `--danger-ink` on canvas |

**Light-theme cautions:** `#1A73E8` on `#F5F7FB` is 4.20:1 and must not be used for body-size text; use `--primary-dark`. `#B06000` on canvas is 4.33:1 and `#D93025` on canvas is 4.45:1, so status text placed directly on canvas uses `--pending-ink` / `--danger-ink`; otherwise put status text on a `--surface-card` or tinted pill. White on `#1A73E8` is 4.51:1 and is reserved for semibold 14px+ button labels.

**Dark contrast ratios (all text pairs pass 4.5:1):**

| Pair | Ratio | Use |
|---|---|---|
| `#E8EEF7` on `#0B1220` | 16.05:1 | Body text on canvas |
| `#E8EEF7` on `#151C28` | 14.65:1 | Body text on card |
| `#A7B2C3` on `#0B1220` | 8.74:1 | Muted text on canvas |
| `#A7B2C3` on `#151C28` | 7.98:1 | Muted text on card |
| `#A8C7FA` on `#0B1220` | 10.89:1 | Small blue text on canvas |
| `#A8C7FA` on `#151C28` | 9.94:1 | Small blue text on card |
| `#0B1220` on `#8AB4F8` | 8.88:1 | `--on-primary` on primary |
| `#81C995` on `#0B1220` | 9.56:1 | Success text on canvas |
| `#81C995` on `#151C28` | 8.73:1 | Success text on card |
| `#FDD663` on `#0B1220` | 13.35:1 | Pending text on canvas |
| `#FDD663` on `#151C28` | 12.19:1 | Pending text on card |
| `#F28B82` on `#0B1220` | 7.84:1 | Danger text on canvas |
| `#F28B82` on `#151C28` | 7.16:1 | Danger text on card |

Dark `--on-primary` is deliberately `#0B1220`, not white: white on `#8AB4F8` is 2.11:1 and fails. Dark mode is a re-map of the same roles, not a separate theme.

### 0.4 Typography — Onest only

Self-host Onest through `next/font/google` with `display: "swap"` and `variable: "--font-onest"`; weights 400, 500, 600 and 700. Remove the remote `fonts.googleapis.com` `@import`. Instrument Serif is retired completely; headings use Onest.

| Role | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|
| Display | 32px / 36px | 700 | -0.02em | Landing hero, page hero |
| Section header | 20px / 26px | 600 | -0.01em | Section titles |
| Card title | 16px / 22px | 600 | 0 | Card headers, list-row titles |
| Body | 15px / 23px | 400 | 0 | Paragraphs, form values |
| Label | 13px / 18px | 600 | 0.01em | Field labels, chips |
| Caption | 12px / 17px | 500 | 0.01em | Helper text, timestamps |
| Stat value | 28px / 31px | 700 | -0.02em | Dashboard metrics; tabular numerals |
| Button label | 14px / 20px | 600 | 0.01em | Primary/secondary controls |
| Nav label | 11px / 14px | 600 | 0.01em | Bottom-nav labels |

**Numeric treatment:** apply `font-variant-numeric: tabular-nums lining-nums` to stat values, prices, earnings, ETA, countdowns and table numbers. Use Indian digit grouping (`₹1,200`, no space after `₹`). Currency values are whole rupees in the UI; never invent decimals. Unknown or unsupported values render `—`. Offer timers use the real `expiresAt` (`mm:ss`, 15-minute offer window); do not add a fake 58-second timer.

### 0.5 Shape, spacing and elevation

- **Radii:** content card 16px; control (button, input, select, tab) 12px; modal/sheet 16px; pill/badge/avatar full; icon button 12px. The old 20px `glass-lux` radius and 0.75rem outliers are gone.
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48px. Page gutter 16px mobile / 24px tablet / 32px desktop. Card padding 16px mobile / 20px desktop. Row minimum height 56px. Section gap 24–32px. Grid gap 12–16px.
- **Controls:** minimum 44×44px target; primary controls 48px high; 12px radius; `--border-strong` boundary; visible label and error text.
- **Flat card recipe:** `background: var(--surface-card); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow-card)`. No gradient, no glow, no inset highlight, no glass.
- **Motion:** 150–200ms ease-out for hover/press; 200–250ms for modal/sheet entrances. No parallax, no glow pulse, no gradient animation; reduced-motion collapses everything (§0.9).

### 0.6 Navigation matrix (AUTHORITATIVE)

| Surface | Items (count) | Back arrow |
|---|---|---|
| Customer dashboard | Service, Schedule, Vehicles, History, Store (5) | None on top-level |
| Marketplace store | Home, Categories, Search, Cart, Profile (5) | None at root; one on category, product and checkout |
| Mechanic | Home, Navigation, Earnings, History, Support (5) | None on top-level |
| Garage | Home, Jobs, Analytics, Garage, Support (5) | None on top-level |
| Seller | Dashboard, Listings, Sales, Upload (4) | None on top-level |
| Fleet | Existing fleet nav; no new item | Existing behaviour |
| Admin | Desktop sidebar/topbar | Not applicable |

Rules:

1. One `BottomNav` / `DashboardTabBar` implementation supports these exact items, order and routes. `?tab=` deep links keep working; the active item carries `aria-current="page"`.
2. Top-level tabs never render a back arrow. Back arrows appear only on pushed/detail screens (for example category, product, checkout, job detail, settings, edit profile), and there is one back control in the header.
3. The marketplace `Menu` popover is replaced by a header overflow button so theme, SOS and help stay reachable for logged-out users. It is not a sixth nav item.
4. The bottom bar is fixed and persists on every top-level customer/partner tab, not only the dashboard screen. Keep the customer `Store` item pointing at the marketplace.
5. Admin keeps its desktop sidebar/topbar; no mobile bottom nav is required. Seller and fleet keep their existing four-item bars. No new top-level destinations.

### 0.7 Safe areas and layout bounds

- The Next.js `viewport` export includes `viewportFit: "cover"`, `width: "device-width"`, `initialScale: 1`, and theme colours light `#F5F7FB` / dark `#0B1220`.
- The bottom nav is fixed. Its height token is `--bottom-nav-height: 64px`, and it adds `padding-bottom: env(safe-area-inset-bottom)`.
- Every scroll container gets bottom padding of at least `calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 16px)`. No content may sit under the nav bar or the status bar.
- Headers add `padding-top: env(safe-area-inset-top)`. Landscape layouts also respect `env(safe-area-inset-left)` and `env(safe-area-inset-right)`.
- Modal/sheet panels and map controls respect the same insets; map controls sit above the nav height plus the bottom inset.
- Minimum target size is 44×44px; nav items fill the bar height. Test at 360×800, 390×844, landscape, and a notched device.

### 0.8 Status map and payment semantics

| Status | Emitted by | Display copy | Rule |
|---|---|---|---|
| `searching` | Backend/DB | Finding a provider | Default status for a new request |
| `providers_notified` | Frontend display-only | Providers notified | DB remains `searching`; never persist this value |
| `assigned` | Backend | Mechanic assigned | Provider accepted |
| `en_route` | Backend | On the way | Provider travelling |
| `in_progress` | Backend | In service | Work started |
| `payment_pending` | Backend | Awaiting payment | Bill ready |
| `payment_escrow` | Frontend-only legacy label | Payment held (legacy) | Backend does not emit; do not create; no hold UI |
| `payment_released` | Frontend-only legacy label | Payment released (legacy) | Backend does not emit; do not create; no release UI |
| `payment_dispute` | Frontend-only legacy label | Payment dispute (legacy) | Backend does not emit; read-only if encountered |
| `completed` | Backend | Service completed / Job completed | Payment captured |
| `cancelled` | Backend | Cancelled | Request/job cancelled |

Rules:

1. This is the complete set. Do not invent `picked_up`, `delivered`, `ready` or any other status.
2. `providers_notified` is display-only; the database status stays `searching`.
3. `payment_escrow` / `payment_released` / `payment_dispute` are frontend-only legacy labels; the backend does not emit them. Do not add new UI, calls or copy around them.
4. Payment is **immediate capture**. Razorpay verify and cash both set the job to `completed` on the backend. There is no hold/release step, no `/hold` or `/release` call, and no "Payment Held" / "Released" copy. Open review only after a backend-confirmed completion.
5. Status pills use text plus icon, never colour alone. Recommended tone: info (blue) for searching/providers_notified/assigned; pending (amber) for en_route/in_progress/payment_pending; success for completed; danger for cancelled; neutral for legacy payment labels. Info text uses `--primary-dark` on `--surface-soft`; it does not get a new hue.

### 0.9 Accessibility minimums

- **Contrast:** WCAG AA in both themes — 4.5:1 for normal/body text, 3:1 for large text (≥24px regular or ≥18.66px bold) and for essential UI graphics. Card borders use `--border`; form-control boundaries use `--border-strong` (≥3:1 on card and canvas).
- **Focus:** every interactive element shows a visible focus ring: 2px solid `var(--ring)`, 2px offset, at least 3:1 against adjacent colours. Never remove an outline without an equivalent visible replacement.
- **Keyboard:** all controls are reachable in a logical order. Modals/sheets trap focus, close on Escape, and return focus to the trigger. Include the skip link and semantic headings.
- **Reduced motion:** under `@media (prefers-reduced-motion: reduce)`, collapse animations/transitions to `0.001ms` or one frame. No parallax, autoplay or motion that hides content.
- **Status:** convey status with text and an icon, not colour alone. Announce async status changes with a polite live region where appropriate.
- **Targets and labels:** 44×44px minimum targets, programmatic labels on icon buttons, errors linked to their fields, alt text on meaningful images.
- Dark mode is a full parity target; the same checks apply in both themes.

### 0.10 Real-data policy

- The app has no synthetic mode, fixtures, seeded sample rows, fake users or fabricated API adapter. Every value comes from the live API or a cache of real API data.
- Unsupported or missing values render `—`; never invent a fallback such as `1200` or `4.5 hrs`.
- When the backend is unavailable, show an honest error or empty state. Do not fabricate success, balances, quotes, jobs or sessions.
- Authentication is real only: no synthetic accounts, synthetic tokens or role-bypass identifiers.

### 0.11 Billing / pilot scope guard

- Rent, incentives, rent payment history, onboarding and payout/settlement screens are **out of pilot scope**. They belong to Phase 2.
- `NEXT_PUBLIC_BILLING_ENABLED` is a build-time flag, default `false`. When false, no rent/incentive/billing UI or copy is rendered, and no fake amounts are shown.
- Do not add rent/incentive features to the pilot under the guise of visual polish.

### 0.12 Implementation map for task 5 (`globals.css` + `layout.js`)

Canonical declaration block (values are duplicated in §0.3 for readability; this block is the implementation source of truth):

```css
:root {
  --primary: #1A73E8;
  --primary-dark: #1557B0;
  --background: #F5F7FB;
  --surface-card: #FFFFFF;
  --foreground: #111827;
  --text-muted: #5F6B7A;
  --border: #E1E7F0;
  --border-strong: #748192;
  --success: #188038;
  --pending: #B06000;
  --danger: #D93025;
  --on-primary: #FFFFFF;
  --surface-soft: #EDF2FA;
  --ring: #1A73E8;
  --pending-soft: #FDF3E7;
  --pending-ink: #8A4A00;
  --danger-ink: #C5221F;
  --glass-overlay-bg: rgba(255,255,255,0.78);
  --glass-overlay-border: rgba(255,255,255,0.55);
  --glass-overlay-scrim: rgba(17,24,39,0.48);
  --glass-overlay-blur: 16px;
  --shadow-card: 0 1px 2px rgba(17,24,39,0.04), 0 8px 24px rgba(17,24,39,0.06);
  --bottom-nav-height: 64px;
}

[data-theme="dark"] {
  --primary: #8AB4F8;
  --primary-dark: #A8C7FA;
  --background: #0B1220;
  --surface-card: #151C28;
  --foreground: #E8EEF7;
  --text-muted: #A7B2C3;
  --border: #2A3444;
  --border-strong: #5C6C84;
  --success: #81C995;
  --pending: #FDD663;
  --danger: #F28B82;
  --on-primary: #0B1220;
  --surface-soft: #1B2432;
  --ring: #A8C7FA;
  --pending-soft: #3A2C12;
  --pending-ink: #FDD663;
  --danger-ink: #F28B82;
  --glass-overlay-bg: rgba(21,28,40,0.78);
  --glass-overlay-border: rgba(232,238,247,0.14);
  --glass-overlay-scrim: rgba(0,0,0,0.62);
  --glass-overlay-blur: 16px;
  --shadow-card: 0 1px 2px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.35);
}
```

Additional task-5 requirements:

- `@theme inline` maps the canonical tokens (`--color-primary: var(--primary)`, `--color-background`, `--color-foreground`, `--color-surface-card`, `--color-text-muted`, `--color-border`, `--color-success`, `--color-pending`, `--color-danger`, `--color-on-primary`, `--color-surface-soft`, `--color-ring`).
- Keep temporary compatibility aliases for one migration wave: `--surface: var(--surface-card)`, `--on-surface: var(--foreground)`, `--color-bg-card: var(--surface-card)`, `--color-text-muted: var(--text-muted)`, `--color-border-subtle: var(--border)`, `--color-surface-soft: var(--surface-soft)`, `--color-icon-highlight: var(--primary)`. Delete them at task 10.
- `body` uses `font-family: var(--font-onest), sans-serif`, `background: var(--background)`, `color: var(--foreground)`. `h1`–`h4` use Onest; no Instrument Serif.
- `layout.js` imports Onest from `next/font/google`, adds `viewportFit: "cover"`, and sets theme colours to `#F5F7FB` / `#0B1220`.
- Remove `fonts.googleapis.com`; the standalone CSP stays unchanged. The static export has no server headers, so verify the offline APK.
- Task 5 acceptance: `rg -n "Instrument Serif|fonts.googleapis.com|#1E29B6|#162086|#2e3bd1" src out` returns zero.

### 0.13 Contract verification greps

Run from the repo root. Zero hits, except documented third-party/fallback exceptions:

```bash
rg -n "Instrument Serif|#1E29B6|#162086|#2e3bd1" src
rg -n "glass-lux|glass-strong|surface-elevated|surface-filled|surface-outlined|btn-glow|hover-glow" src --glob '!**/*.test.*'
rg -n "dark:" src --glob '!**/*.test.*'
rg -n "bg-white/(5|10)|border-white/" src --glob '!**/*.test.*'
rg -n "text-warning|bg-warning|fill-warning" src --glob '!**/*.test.*'
```

Also audit every remaining `backdrop-blur` and confirm it belongs to one of the four allowed glass surfaces. Document exceptions (for example Google logo SVG brand colours, Leaflet tile colours, `global-error.js` fallback hexes) in `.omo/evidence/pilot/contract-exceptions.md` with file:line and reason.

---

## Historical contract (D1–D16) — retained for audit

> **SUPERSEDED (2026-10-25):** Everything in D1–D16 below is the pre-pilot contract. It is kept to preserve the audit trail. Do not implement it where it conflicts with §0; each conflicting section carries an inline `SUPERSEDED` note with the replacement.

**Historical status (at time of writing):** ENFORCEABLE. This file was the single design contract all later waves implemented against.
**Historical scope:** ClutchD-App (Next.js + Capacitor + Tailwind v4), 43 screens, whole-product overhaul.
**Historical direction:** Blue compulsory. Light-first default with dark toggle. No new screens, no new features, no new dependencies.
**Historical rule of conflict:** If code disagreed with this file, code was wrong. Update code, not this file, unless the contract was amended here first.

**Grounding (read-only sources this contract locks in):**
`src/app/globals.css`, `src/store/themeStore.js`, `src/components/ui/ThemeProvider.js`,
`src/components/ui/GlassCard.js`, `src/components/ui/Button.js`,
`src/components/ui/BottomNav.js`, `src/components/dashboard/DashboardTabBar.js`.

**Audit baseline this contract resolves:**
185 glass hits across 53 files, 19 `dark:` hits, stone/zinc skeleton split unified,
floating ThemeToggle removed, `dark:` classes eliminated, 0.75rem radius outliers killed.

---

## D1. Grounded-blue palette (LOCKED)

> **SUPERSEDED (2026-10-25):** The indigo palette below is retired; use the flat-blue light/dark tokens in §0.3.

Light theme values live in `:root`. Dark theme values live in `[data-theme="dark"]`. Nothing else defines brand color.

| Token | Light (`:root`) | Dark (`[data-theme="dark"]`) | Notes |
|---|---|---|---|
| `--primary` | `#1E29B6` | `#4aa5f5` | Only brand blue family allowed |
| `--primary-dark` | `#162086` | `#2e8ce0` | Gradient end / pressed state |
| `--primary-light` | `#2e3bd1` | `#8cc3f5` | Gradient start / text on dark |
| `--accent` | `#1E29B6` | `#4aa5f5` | Mirrors `--primary`, never diverges |
| `--background` | `#f4f6fc` | `#09090b` | App canvas |
| `--foreground` | `#171a2e` | `#fafafa` | Primary text |
| `--danger` | `#ef4444` | `#ef4444` | Errors, SOS, destructive only |
| `--success` | `#22c55e` | `#22c55e` | Completed / success only |
| `--info` (renamed, see D7) | `#3b82f6` | `#60a5fa` | Informational only, never warning semantics |
| `--pending` (new, see D7) | amber scale (D7 table) | amber scale (D7 table) | Queued / awaiting states only |
| `--color-primary-rgb` | `30, 41, 182` | `74, 165, 245` | Alpha derivations only |
| `--color-icon-highlight` | `#1E29B6` | `#4aa5f5` | Active icons, badges |
| `--color-badge-bg` / `--color-badge-text` | `rgba(30,41,182,0.15)` / `#1E29B6` | `rgba(74,165,245,0.2)` / `#8cc3f5` | Badges stay in blue family |
| `--color-surface-soft` / `--color-surface-mid` | `rgba(30,41,182,0.1)` / `rgba(30,41,182,0.15)` | `rgba(74,165,245,0.1)` / `rgba(74,165,245,0.2)` | Active tab / tinted surfaces |
| Charts | neutral oklch scale + `--chart-crosshair: oklch(0.4 0.1828 274.34)` | neutral oklch scale | Charts stay neutral, crosshair blue is the one exception |

### D1.1 BAN list (explicit, zero tolerance)

BANNED everywhere (components, utilities, inline styles, new code):

1. Neon glows: `btn-glow`, `hover-glow`, any `box-shadow` with saturated glow spread, `drop-shadow` neon on icons or markers.
2. AI-purple gradients: purple/violet/indigo gradient washes on text, buttons, cards, backgrounds. The only sanctioned gradient-text is the grounded-blue one (light: `#1E29B6, #162086, #121B6F`; dark: `#8cc3f5, #4aa5f5, #2e8ce0`), and it is for display accents only.
3. One-off hue escapes: lime, teal, sky, purple, orange, rose used as brand or surface accents. Status colors outside D7 are banned (the one legacy exception being remapped is `.status-enroute: #8b5cf6`, which MUST be remapped to `--pending` amber per D7).
4. Hardcoded hex/rgb outside tokens: no raw `#...` or `rgba(...)` color literals in components. Derive from `var(--...)` tokens only.
5. `stone-*` / `zinc-*` skeleton or surface splits: unified skeleton system only (see D12).

Enforcement: `grep -rn "btn-glow\|hover-glow\|#8b5cf6\|stone-\|zinc-\|lime\|teal-\|rose-\|orange-\|purple-" src/` MUST return zero brand/surface hits per wave QA gate.

---

## D2. Light-first default + dark-toggle spec (LOCKED)

> **PARTIALLY SUPERSEDED (2026-10-25):** D2.1–D2.4 and D2.6 remain compatible (light-first, `data-theme` tokens, no `dark:` branching). D2.5 is SUPERSEDED: the Menu popover is replaced by the marketplace header overflow (§0.6), with theme control there and in settings.

1. Light is the startup default. `themeStore.js#getInitialTheme()` returns `'light'` unless `localStorage['clutchd_theme']` holds an explicit `'light'`/`'dark'`. Legacy `theme-storage` key migrates once, then is removed. No code path may default to dark.
2. The single source of truth for theme is the `data-theme` attribute on `<html>` (`light` | `dark`), set from the store by `ThemeProvider.js`. `ThemeProvider` also toggles the `dark` class ONLY as a Tailwind `@custom-variant` compat shim. Components MUST NOT branch on it.
3. All theme-varying values MUST be `var(--...)` CSS variables with both `:root` and `[data-theme="dark"]` definitions in `globals.css`. **Zero `dark:` classes in components.** The 19 existing `dark:` hits MUST be removed wave by wave until `grep -rn "dark:" src/components src/app --include="*.js" --include="*.jsx"` returns zero.
4. `ThemeProvider` system-listener behavior is kept: `prefers-color-scheme` changes apply ONLY when no explicit `clutchd_theme` override is stored. `followSystemTheme()` clears the override and falls back to light.
5. Toggle placement: floating ThemeToggle is DELETED. Theme control lives ONLY in (a) settings screen/route and (b) the BottomNav Menu/Settings popover theme row (Sun/Moon + Light/Dark label, already present in `BottomNav.js`). No other floating, header, or per-screen toggle may be added.
6. New theme-dependent styling MUST add a variable pair, never a conditional class or `isLight`/`isDark` prop. The existing semantic utilities (`.bg-surface*`, `.text-*`, `.border-subtle`, `.bg-card`, `.badge-*`, `.icon-highlight`) are the consumption API.

---

## D3. Type scale (LOCKED)

> **SUPERSEDED (2026-10-25):** Instrument Serif is retired and `.type-display` is deleted; use the Onest-only scale in §0.4.

1. Body and UI font is **Onest** (`--font-sans`, `body { font-family: 'Onest', sans-serif }`). Kept everywhere.
2. Sanctioned type utilities: `headline-3` (1.5rem/1.35/500), `body-2` (0.875rem/1.45/400), `title-3` (0.875rem/1.45/600), `label-2` (0.6875rem/1.3/600/0.05em). BottomNav labels use `type-label-2`. These four are the workhorses; other existing scale steps may be used sparingly but never extended.
3. **KILL `.type-display`** (3.5625rem). It MUST NOT be used on any screen. Remove usages; do not restyle it.
4. **KILL Instrument Serif as body/UI face.** `Instrument Serif` (`--font-display`) is restricted to large display headings (`h1`, hero display) via the existing `h1-h4` rule. All body copy, buttons, labels, inputs, nav, and cards use Onest. Any `font-family: 'Instrument Serif'` outside display headings is a QA fail.
5. No new font families, no new weights outside Onest 300..800, no ad-hoc `text-[...]` sizes that duplicate a sanctioned step.

---

## D4. Radii (LOCKED)

> **SUPERSEDED (2026-10-25):** Card 16px and control 12px are locked in §0.5; the glass-lux 20px radius and 0.75rem outlier rules no longer apply.

| Role | Value | Applies to |
|---|---|---|
| Cards / modals / sheets / popovers | `rounded-2xl` (1rem per GlassCard base; `1.25rem` via `--glass-lux-radius` for glass-lux) | `GlassCard`, modals, settings popover, SOS/surface cards |
| Controls (buttons, inputs, tabs) | `rounded-xl` (0.75rem+ family; Button base `rounded-xl`) | `Button`, inputs, DashboardTabBar buttons, segmented controls |
| Pills / badges / dots | `rounded-full` | Cart badge, active indicators, status dots |

**KILL 0.75rem outliers:** `.surface-elevated`, `.surface-filled`, `.surface-outlined`, `.input-glass`, Leaflet popup overrides, or any component using `border-radius: 0.75rem` MUST be migrated to the table above (surfaces to `rounded-2xl`, controls to `rounded-xl`). No new `0.75rem` radius may be introduced.

---

## D5. Glass 2-variant spec (LOCKED)

> **SUPERSEDED (2026-10-25):** Both glass-lux variants are banned; glass is restricted to bottom nav, modal/sheet, map controls and splash (§0.2), and the flat card is the default.

Exactly two glass variants exist. Everything else is deprecated.

| Variant | Class | Use |
|---|---|---|
| Default card | `glass-lux` | ALL cards, panels, sheets, popovers by default |
| Pressable only | `glass-lux-interactive` | ONLY elements with a press action (`:hover` border/shadow lift, `:active scale(0.99)`) |

Deprecated and BANNED for new or migrated code: `glass`, `glass-strong`, `glass-hover` (standalone), `glass-lux-strong`, `surface-elevated`, `surface-filled`, `surface-outlined`. `GlassCard.js#variantClasses` MUST shrink to the two sanctioned variants (plus a pass-through escape hatch only where a wave explicitly justifies it in its QA notes). Default `variant` prop becomes `"glass-lux"`.

Grounding: `--glass-lux-bg/border/shadow` pairs in `:root` and `[data-theme="dark"]`, `--glass-lux-radius: 1.25rem`, blur `20px saturate(1.3)`. Dark glass stays near-black translucent (`rgba(12,12,15,0.55)`), never frosted white.

Consolidation target: the 185 glass hits across 53 files collapse onto these two variants. Wave QA MUST show the hit count decreasing toward zero legacy hits.

---

## D6. Elevation + shadow discipline

> **SUPERSEDED (2026-10-25):** Glass shadows, hover-glow and elevation tiers are replaced by the single flat-card shadow token in §0.5; no glow or gradient.

Use `--elevation-1` through `--elevation-5` and `--glass-lux-shadow` / `--glass-lux-shadow-hover` only. `hover-lift` (`translateY(-2px)`) is reserved for primary CTA and pressable glass. `hover-glow` is BANNED (see D1.1). Modal entrance stays `modal-in` / `backdrop-in`; page entrance stays `page-enter` (0.25s). No new shadow tokens, no per-component shadow literals.

---

## D7. Status color mapping: `--warning` to `--info` rename + new `--pending` (LOCKED)

> **SUPERSEDED (2026-10-25):** The status colours and the complete status map are redefined in §0.8; do not use this warning/info/pending mapping in the pilot.

`--warning` is a misnomer: both themes define it as blue (`#3b82f6` light / `#60a5fa` dark). It is RENAMED to `--info`. Amber takes over pending/warning semantics as `--pending`.

| Old token / class | New token | Light | Dark | Semantics |
|---|---|---|---|---|
| `--warning: #3b82f6` | `--info` | `#3b82f6` | `#60a5fa` | Informational: searching, assigned, neutral notices |
| (new) | `--pending` | `#f59e0b` (bg `rgba(245,158,11,0.14)`, text `#b45309`) | `#fbbf24` (bg `rgba(251,191,36,0.16)`, text `#fcd34d`) | Pending: queued, awaiting, enroute, confirming |
| `--danger: #ef4444` | unchanged | `#ef4444` | `#ef4444` | Error, failed, SOS, destructive |
| `--success: #22c55e` | unchanged | `#22c55e` | `#22c55e` | Completed, paid, success |
| `.status-searching` / `.status-assigned` (`#3b82f6`) | `var(--info)` |, | Informational |
| `.status-enroute` (`#8b5cf6`, banned purple) | `var(--pending)` |, | Pending (this kills the purple exception) |
| `.status-inprogress` (`var(--primary)`) | unchanged |, | Active work stays brand blue |
| `.status-completed` (`#22c55e`) | `var(--success)` |, | Done |

Migration rules:

1. Rename `--warning` to `--info` in both `:root` and `[data-theme="dark"]`, keep a deprecated `--warning: var(--info)` alias for exactly one release, then delete it. `@theme inline` maps `--color-info`, not `--color-warning`, going forward.
2. Add `--pending` (+ bg/text pair) to both themes. All queued/awaiting/confirming UI (including SOS `queued`/`confirming` states in `BottomNav.js`) uses `--pending`, never blue, never red.
3. No component may reference `#3b82f6`, `#60a5fa`, `#8b5cf6`, or `var(--warning)` after its wave. Amber MUST NOT leak into informational states and blue MUST NOT leak into pending states.

---

## D8. Icon rule (LOCKED)

`lucide-react` ONLY. `BottomNav.js`, `DashboardTabBar.js`, and `Button.js` (Loader2) already comply. No emoji icons, no inline SVG icon sets, no new icon packages. Icons inherit `text-text-muted` at rest and `text-primary` / `icon-highlight` when active. Icon buttons keep minimum 44px targets (see D11).

---

## D9. Information architecture (LOCKED)

> **SUPERSEDED (2026-10-25):** The six-item BottomNav and Menu popover are replaced by the authoritative navigation matrix in §0.6.

1. **BottomNav: 6 items kept.** Home (`/marketplace`), Categories, Search, Cart (badge), Profile, Menu/Settings popover. Order, paths, and badge behavior are frozen. The Menu popover keeps: profile links (My Profile, Orders, Favorites), inline 2-tap Emergency SOS row (no overlay), and the Theme row. SOS behavior is frozen.
2. **Per-role DashboardTabBars kept.** `DASHBOARD_TABS` (customer: Service, Schedule, Vehicles, History, Parts Store), `MECHANIC_TABS` (Jobs, Navigation, Earnings, Parts Store), `GARAGE_TABS` (Dashboard, Garage Profile, Analytics, Parts Store), `SELLER_TABS` (Dashboard, My Listings, Sales, Upload) with existing deep-link paths. Controlled mode (dashboard in-place) and link mode (profile pages deep-link) behavior is frozen.
3. **Floating ThemeToggle deleted**, moved to settings route + Menu popover theme row (see D2.5). No wave may reintroduce it.
4. **Modal a11y kept.** `backdrop-in`/`modal-in` entrances, outside-click close, Escape close, route-change close, `aria-label`/`aria-expanded`/`aria-haspopup`/`aria-current` patterns from `BottomNav.js` and `DashboardTabBar.js` are the template for every modal, popover, and tab bar. Every new overlay MUST have: focus-visible ring, Escape dismissal, and correct ARIA roles.
5. No new top-level nav destinations, no tab reordering, no new floating chrome.

---

## D10. Hierarchy rule (LOCKED)

> **PARTIALLY SUPERSEDED (2026-10-25):** The parts-store hierarchy remains, but mechanic and garage no longer carry a Parts Store tab; use the exact navigation matrix in §0.6.

Parts store is PRIMARY commerce surface; mechanic finding is SECONDARY discovery surface. Concretely: marketplace/parts-store entry points (BottomNav Home/Categories/Search/Cart, customer Parts Store tab, mechanic/garage Parts Store tabs) keep top-level placement and full visual weight. Mechanic/garage discovery cards, banners, or cross-sells MUST NOT outrank, overlay, or displace parts-store chrome. Any wave that touches home, search, or dashboard tabs MUST preserve this ordering or fail QA.

---

## D11. Dials, spacing, accessibility (LOCKED)

> **PARTIALLY SUPERSEDED (2026-10-25):** The accessibility minimums in §0.9 are authoritative; `focus-lux` is replaced by `--ring`, and the safe-area/nav rules are in §0.7. The 4px/8px spacing rhythm remains valid.

**Variance / motion / density caps (hard ceilings):**

| Dial | Cap | Meaning |
|---|---|---|
| Variance | 6 | Max 6 distinct card/panel treatments per screen (goal: 2, the glass pair). A 7th treatment fails QA |
| Motion | 4 | Max 4 distinct animation patterns per screen (`page-enter`, `modal-in`/`backdrop-in`, `fade-in-up`, `scale-in`). No new keyframes without amending this file |
| Density | 5 | Max 5 density levels (section, card, row, control, micro). No tighter packing than existing `h-14/h-16` nav bars and `h-9/h-11/h-14` buttons |

**8dp spacing rhythm:** all spacing in multiples of 4px, preferring 8px steps (4/8/12/16/24/32). No 5px/7px/11px one-offs. Safe-area insets (`env(safe-area-inset-bottom)`) kept on both nav bars.

**WCAG AA + targets + reduced motion:**

1. Text contrast MUST meet WCAG AA (4.5:1 body, 3:1 large text) in BOTH themes. Muted/dim text (`--color-text-muted`, `--color-text-dim`) may be used for secondary text only where it passes AA on its background; otherwise escalate to `--color-text-secondary` or `--foreground`.
2. Touch targets MUST be at least 44px in at least one dimension. Existing `h-14`/`h-16` nav bars, `h-9/h-11/h-14` buttons, and `36px` my-location button MUST be audited: anything under 44px gets padding expansion, not a waiver, except the cart badge dot and active indicator line.
3. `prefers-reduced-motion` block in `globals.css` is frozen and MUST be honored: all animations/transitions collapse to `0.001ms`. No wave may add motion that bypasses it.
4. Focus: global `:focus-visible` (2px `var(--primary)` outline, 2px offset) plus `.focus-lux` ring on cards/inputs. Every interactive element MUST show a visible focus state in both themes.

---

## D12. Keep/kill checklist (grounded in the audit)

> **SUPERSEDED (2026-10-25):** This list keeps the retired glass-lux system and six-item nav; the pilot bans both. Use §0.2, §0.6 and §0.13.

### KEEP

- [ ] Onest body + headline-3/body-2/title-3/label-2 (D3)
- [ ] `data-theme` CSS-var theming + zustand `themeStore` + `ThemeProvider` sync (D2)
- [ ] `glass-lux` + `glass-lux-interactive` only (D5)
- [ ] BottomNav 6 items + Menu popover (profile links, inline SOS, theme row) (D9.1)
- [ ] Per-role DashboardTabBars + controlled/link modes + deep links (D9.2)
- [ ] Modal/popover a11y (outside-click, Escape, route-change close, ARIA) (D9.4)
- [ ] Semantic theme utilities (`.bg-surface*`, `.text-*`, `.border-subtle`, `.bg-card`, `.badge-*`) (D2.6)
- [ ] `page-enter` / `modal-in` / `backdrop-in` / `fade-in-up` / `scale-in` motion set (D6, D11)
- [ ] `prefers-reduced-motion` guard (D11)
- [ ] Grounded-blue palette values in D1 table

### KILL (with verification)

- [ ] 185 legacy glass hits across 53 files collapse to the 2-variant system; `grep -rEn "\bglass-strong\b|\bglass-hover\b|glass-lux-strong|surface-elevated|surface-filled|surface-outlined" src/ --include="*.js" --include="*.jsx" --include="*.css"` reaches zero
- [ ] 19 `dark:` hits removed; `grep -rn "dark:" src/components src/app --include="*.js" --include="*.jsx"` returns zero
- [ ] Floating ThemeToggle deleted; theme control only in settings + Menu popover
- [ ] `.type-display` usages removed; Instrument Serif body use removed
- [ ] `0.75rem` radius outliers migrated per D4
- [ ] Stone/zinc skeleton split unified into one token-driven shimmer (`shimmer-pulse` + `page-enter` family); `grep -rn "stone-\|zinc-" src/` returns zero
- [ ] `--warning` renamed to `--info`; `--pending` amber added; `.status-enroute` purple remapped; no `#8b5cf6` remains
- [ ] `btn-glow` / `hover-glow` / neon shadows removed

---

## D13. Per-wave QA gates (pass/fail, LOCKED)

> **SUPERSEDED (2026-10-25):** These gates and greps target the retired indigo/glass system, and their G1/G2 names differ from the pilot gates. Use the contract greps in §0.13 and the plan verification strategy.

Every implementation wave MUST pass ALL gates below. One fail blocks the wave.

### Gate G1: ESLint clean (FAIL on any error or new warning)

```bash
npx eslint src/ --max-warnings=0
```

Pass: exit 0. Fail: any error, or any warning not present on the wave's base commit.

### Gate G2: Visual QA matrix, light + dark (FAIL on any regression)

Manual or Playwright screenshot pass over every touched screen in BOTH `data-theme="light"` and `data-theme="dark"`:

1. No banned purples/glows/one-off hues (D1.1 eyeball + grep).
2. Glass variants correct (default vs pressable-only).
3. Radii correct (cards 2xl, controls xl).
4. Type correct (Onest UI, display serif only where sanctioned, no `.type-display`).
5. Theme toggle works from settings + Menu popover; no floating toggle; no `dark:`-only styling that breaks the opposite theme.
6. 44px targets spot-checked; focus rings visible; reduced-motion spot-checked where motion was touched.

Pass: matrix recorded (screens x light/dark) with no regressions. Fail: any regression or unrecorded screen.

### Gate G3: Token grep gates (FAIL on any hit above the wave's allowance)

```bash
grep -rn "dark:" src/components src/app --include="*.js" --include="*.jsx" | wc -l   # MUST NOT increase; target zero
grep -rEn "glass-strong|glass-lux-strong|surface-elevated|surface-filled|surface-outlined|btn-glow|hover-glow" src/ --include="*.js" --include="*.jsx" --include="*.css" | wc -l  # MUST NOT increase; target zero
grep -rn "stone-\|zinc-" src/ --include="*.js" --include="*.jsx" --include="*.css" | wc -l  # MUST be zero after skeleton wave
grep -rEn "type-display|Instrument Serif" src/ --include="*.js" --include="*.jsx" --include="*.css" | wc -l  # type-display usages zero; Instrument Serif only in display rule
grep -rEn "#8b5cf6|var\(--warning\)" src/ --include="*.js" --include="*.jsx" --include="*.css" | wc -l  # MUST NOT increase; target zero after status wave
grep -rEn "#[Bb]3261[Ee]|#[Ff]9[Dd][Ee][Dd][Cc]|#[Dd]0[Bb][Cc][Ff][Ff]|cubic-bezier\((?!0\.2, 0, 0, 1)\)" src/ --include="*.js" --include="*.jsx" --include="*.css" | wc -l  # non-spec error-container hues or non-M3 easings MUST be zero
grep -rEn "elevation-|glass-lux" src/components src/app --include="*.js" --include="*.jsx" | wc -l  # touched cards MUST resolve to elevation/glass-lux roles, trending up as legacy variants die
```

Pass: counts at or below the wave's stated allowance and trending to the D12 targets. Fail: any increase, or any new banned hit.

### Gate G4: APK / bundle checks (FAIL on breakage or bloat regression)

```bash
npm run build
npx cap sync android
```

Pass: production build succeeds, Capacitor sync succeeds, no new dependency added (`package.json` diff empty of new deps), bundle size does not regress beyond the wave's stated allowance. Fail: build/sync break, or an unapproved dependency or asset bloat lands.

### Gate G5: Contract traceability (FAIL on untraceable change)

Every wave's summary MUST map each change to a DESIGN.md section (D1-D16). Any visual or token change without a section mapping fails, as does any edit that contradicts a LOCKED rule without amending this file first.

### Gate G6: M3 compliance (FAIL on deviation)

1. Every touched surface uses an M3 role from the D15.1 table (primary / container / surface / error families). No raw color outside roles.
2. State layers on interactive elements match D15.3 opacities (hover 8%, focus 12%, pressed 12%, dragged 16%) within eyeball tolerance; no neon/glow substitutes.
3. Radii on touched components match the D15.2 shape mapping (cards 2xl, controls xl, dialogs 2xl per C1 resolution, pills full).
4. Touched nav bars, tabs, cards, FABs, switches, dialogs conform to their D15.4 component spec (active-indicator pill, 3dp tab indicator, FAB clearance, switch track, dialog scrim).

Pass: all four hold on every touched component. Fail: any role, state-layer, shape, or component-spec deviation.

## D15. Material 3 compliance mapping (LOCKED)

> **SUPERSEDED (2026-10-25):** The M3 mapping is not adopted in the pilot; its indigo/glass role mappings are replaced by §0.3 and §0.5.

**How M3 is implemented here:** M3 is a token/behavior spec inside our Tailwind + CSS-variable system, NOT `@material/web` components. No M3 library is installed and none may be added (G4 bans new dependencies). Every M3 role below resolves to an existing `var(--...)` token in `globals.css`; every M3 behavior resolves to an existing utility or a D-section rule. Where real M3 and a LOCKED section conflict, the LOCKED section wins; each conflict is resolved explicitly in D15.6.

### D15.1 M3 color roles mapped onto grounded-blue tokens

Primary family (M3 `primary / on-primary / primary-container / on-primary-container`):

| M3 role | Light token | Dark token |
|---|---|---|
| `primary` | `--primary` `#1E29B6` | `--primary` `#4aa5f5` |
| `on-primary` | `#FFFFFF` (CTA text on primary) | `#0B1030` (deep navy text on `#4aa5f5` fill) |
| `primary-container` | `--color-surface-soft` (primary 10% tint) | `--color-surface-mid` (primary 20% tint) |
| `on-primary-container` | `--primary-dark` `#162086` | `--primary-light` `#8cc3f5` |
| `primary-fixed` / `primary-dim` gradient accents | sanctioned grounded-blue gradient-text only (D1.1) | dark sanctioned gradient-text only |

Surface family (M3 `surface / surface-dim / surface-bright / surface-container-{lowest,low,medium,high,highest} / on-surface / on-surface-variant / surface-variant / outline / outline-variant`):

| M3 role | Our token |
|---|---|
| `surface` | `--surface` |
| `surface-dim` | `--surface-dim` |
| `surface-bright` | `--surface-bright` |
| `surface-container-lowest` | `--surface-container-low` (nearest existing step; no new token) |
| `surface-container-low` | `--surface-container-low` |
| `surface-container` (`medium`) | `--surface-container` |
| `surface-container-high` | `--surface-container-high` |
| `surface-container-highest` | `--surface-container-highest` |
| `on-surface` | `--on-surface` |
| `on-surface-variant` | `--on-surface-variant` |
| `surface-variant` | `--surface-container-high` (adaptation; no separate token, see C5) |
| `outline` / `outline-variant` | `--outline` / `--outline-variant` |
| `scrim` | black 32% (`rgba(0,0,0,0.32)`) for dialog/modal backdrops, both themes (M3 scrim value) |

Error family (M3 `error / on-error / error-container / on-error-container`):

| M3 role | Light | Dark |
|---|---|---|
| `error` | `--danger` `#ef4444` (LOCKED deviation from M3 `#B3261E`, see C4) | `--danger` `#ef4444` (LOCKED deviation from M3 `#F2B8B5`, see C4) |
| `on-error` | `#FFFFFF` | `#FFFFFF` |
| `error-container` | `--danger` at 12-14% bg (`rgba(239,68,68,0.14)`) | `--danger` at 16% bg (`rgba(239,68,68,0.16)`) |
| `on-error-container` | `#7f1d1d` text on container | `#fecaca` text on container |

Status roles reuse D7: `info` (`--info`), `pending` (`--pending` amber), `success` (`--success`). Tertiary/flex hues from M3 color schemes are NOT adopted (grounded-blue exclusivity, D1).

### D15.2 Shape scale mapping (LOCKED)

M3 shape scale is extra-small 4dp / small 8dp / medium 12dp / large 16dp / extra-large 28dp / full. Our mapping:

| M3 shape | M3 canonical use | Our resolution |
|---|---|---|
| XS 4dp | snackbar, dividers | `rounded` (4px) for snackbars/toasts only |
| S 8dp | chips, small containers | chips, filter chips, my-location button (`rounded-lg`) |
| M 12dp | cards (elevated/filled/outlined), menus | cards use `rounded-2xl` per D4 (see C1); menus/popovers `rounded-2xl` |
| L 16dp | FAB (medium 56dp), dialogs (small), search | FAB container `rounded-2xl`; controls `rounded-xl` per D4 |
| XL 28dp | dialogs, large sheets | **Resolved to `rounded-2xl` per D4 (C1).** Dialog XL intent is carried by elevation + 32% scrim + `modal-in` entrance, not by a 28px radius. No 28px radius token exists and none may be added. |
| Full | pills, FAB (alt), active-indicator, badges | `rounded-full` for pills, badges, cart dot, nav active-indicator pill, tab indicator |

### D15.3 State layers (LOCKED interaction rule)

M3 state-layer opacities over the content color: hover 8%, focus 12%, pressed 12%, dragged 16%. Applied as:

- Hover: 8% primary or on-surface overlay. Realized via existing treatments: `glass-lux-interactive:hover` (border-accent + shadow-hover), `hover:bg-white/5`-family utilities in light mapped to `--color-surface-soft` tints. No glow, no shadow spread (D1.1).
- Focus: 12% ring. Realized via `:focus-visible` 2px `var(--primary)` outline + `.focus-lux` ring (D11). Focus MUST remain keyboard-visible in both themes.
- Pressed: 12% + `scale(0.99)` (`glass-lux-interactive:active`, `.active-press`). Button press uses `primary-dark` fill shift.
- Dragged: 16% overlay on draggable sheets/handles and map markers while dragging; resting state returns to hover or base.
- Disabled: `disabled:opacity-50 disabled:pointer-events-none` (Button base) is kept; M3 38%-opacity convention is approximated, not restyled.

### D15.4 Component specs for kept components (LOCKED)

1. Navigation bar (BottomNav + DashboardTabBar, M3 nav-bar role): bar height stays `h-16`/`h-14` + safe-area inset (D11 density; ≈80dp M3 bar height WITH insets, see C2). Active destination gets an active-indicator pill (`rounded-full`, `bg-surface-soft` = `primary-container` role, `text-primary` icon+label) per M3 active-indicator spec (M3: 64x32 pill). Inactive destinations use `text-text-muted` (`on-surface-variant`). Badge (cart dot) is M3 badge role: `bg-danger`, white 10px bold, `99+` cap.
2. Tabs (DashboardTabBar controlled/link modes, M3 tabs role): active tab carries the 3dp indicator bar (`w-6 h-0.5 rounded-full bg-primary`, M3 active-indicator-line height) plus `bg-surface-soft` pill. `aria-current="page"` on active tab is mandatory (M3 selection semantics + D9.4).
3. Cards (M3 elevated / filled / outlined mapped to 2 glass variants, D5): M3 elevated (surface + level-1, no border) and M3 filled (`surface-container-highest`, no elevation) BOTH map to `glass-lux` default. M3 outlined (surface + `outline-variant` border) maps to `glass-lux` with `glass-lux-border-accent` border. The outlined distinction is a border treatment, never a third variant (variance dial, C3).
4. FAB rules + collision fix: at most one FAB per screen, for the single primary action only (M3 FAB role, container L 16dp = `rounded-2xl`). FAB sits end-aligned with 16dp margins and clears nav chrome: bottom offset = nav-bar height + safe-area + 16dp. FAB is forbidden on screens where it would collide with BottomNav, DashboardTabBar, the Menu popover, bottom sheets, or the SOS row (this codifies the FAB collision fix). Extended FAB labels use `label-2` Onest, never serif.
5. Switches (M3 switch role): track 52x32, thumb 16dp rest / 24dp selected, `primary` track when on (`primary-container` + `primary` thumb per M3 selected state), `outline` track when off. No custom toggle aesthetics.
6. Dialogs (M3 basic dialog role): `rounded-2xl` container (C1), icon slot optional (lucide only), Onest headline (`headline-3`) + `body-2` supporting text (serif restricted per D3 even in dialogs), 32% scrim, `modal-in`/`backdrop-in` entrance at 200-300ms (D15.5), actions right-aligned text buttons (tonal/outline Button variants), Escape + scrim-tap dismissal (D9.4).

### D15.5 Motion (LOCKED)

M3 standard easing `cubic-bezier(0.2, 0, 0, 1)` at short4-medium2 durations (200-300ms) is the ONLY easing for state changes, entrances, and press feedback. This matches our existing `transition-all duration-200`, `page-enter 0.25s`, `modal-in`/`scale-in` set. M3 expressive springs are GATED: allowed only on the FAB press and sheet drag-release, only inside the motion-4 cap (D11), and always killed by `prefers-reduced-motion`. No new keyframes, no spring physics on cards, tabs, or nav.

### D15.6 Conflicts resolved (M3 vs LOCKED, LOCKED wins)

| # | Conflict | Resolution |
|---|---|---|
| C1 | M3 dialog XL 28px radius vs D4 `rounded-2xl` cards/modals | D4 wins. No 28px token. XL intent via scrim + elevation + entrance (D15.2). |
| C2 | M3 nav-bar 80dp height vs D11 `h-14`/`h-16` bars | D11 wins. 80dp intent met WITH safe-area insets; bar heights frozen (D15.4.1). |
| C3 | M3 elevated/filled/outlined = 3 card treatments vs D5 2 glass variants + variance-6 | D5 wins. Elevated+filled collapse to `glass-lux`; outlined = accent-border treatment, not a variant (D15.4.3). |
| C4 | M3 error `#B3261E`/`#F2B8B5` pair vs D1/D7 `--danger` `#ef4444` both themes | LOCKED wins. Documented deviation; SOS/destructive consistency outranks M3 error hues. |
| C5 | M3 `surface-variant` + `surface-container-lowest` distinct roles vs our token set | Adapted without new tokens: lowest folds into `--surface-container-low`, surface-variant into `--surface-container-high` (D15.1). |
| C6 | M3 expressive springs vs motion-4 cap | Motion-4 wins. Springs gated to FAB/sheet-release only, reduced-motion kills them (D15.5). |
| C7 | M3 FAB standard placement vs D9 no-new-floating-chrome | D9 wins. FAB only for single primary action with nav clearance; collision zones banned (D15.4.4). |
| C8 | M3 tertiary/flex colorways vs grounded-blue exclusivity | D1 wins. No tertiary hues; status needs use D7 roles only. |

Amendment record (per D16 protocol, formerly D14): D15 added 2026-09-26; G5 range D1-D13 to D1-D16; G3 extended with M3 role/easing greps; G6 added; amendment protocol renumbered D14 to D16 with no content change.

---

## D16. Amendment protocol

> **RETAINED:** Amendments to §0 use this protocol; cite the section, state old vs new, and re-baseline the affected gate.

This file changes only by explicit amendment: cite the section, state old vs new, and re-baseline the affected QA gate. Implementation waves never silently reinterpret a LOCKED rule.
