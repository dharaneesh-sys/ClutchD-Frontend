# ClutchD App Redesign, Token Contract (DESIGN.md)

**Status:** ENFORCEABLE. This file is the single design contract all later waves implement against.
**Scope:** ClutchD-App (Next.js + Capacitor + Tailwind v4), 43 screens, whole-product overhaul.
**Direction:** Blue compulsory. Light-first default with dark toggle. No new screens, no new features, no new dependencies.
**Rule of conflict:** If code disagrees with this file, code is wrong. Update code, not this file, unless the contract is amended here first.

**Grounding (read-only sources this contract locks in):**
`src/app/globals.css`, `src/store/themeStore.js`, `src/components/ui/ThemeProvider.js`,
`src/components/ui/GlassCard.js`, `src/components/ui/Button.js`,
`src/components/ui/BottomNav.js`, `src/components/dashboard/DashboardTabBar.js`.

**Audit baseline this contract resolves:**
185 glass hits across 53 files, 19 `dark:` hits, stone/zinc skeleton split unified,
floating ThemeToggle removed, `dark:` classes eliminated, 0.75rem radius outliers killed.

---

## D1. Grounded-blue palette (LOCKED)

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

1. Light is the startup default. `themeStore.js#getInitialTheme()` returns `'light'` unless `localStorage['clutchd_theme']` holds an explicit `'light'`/`'dark'`. Legacy `theme-storage` key migrates once, then is removed. No code path may default to dark.
2. The single source of truth for theme is the `data-theme` attribute on `<html>` (`light` | `dark`), set from the store by `ThemeProvider.js`. `ThemeProvider` also toggles the `dark` class ONLY as a Tailwind `@custom-variant` compat shim. Components MUST NOT branch on it.
3. All theme-varying values MUST be `var(--...)` CSS variables with both `:root` and `[data-theme="dark"]` definitions in `globals.css`. **Zero `dark:` classes in components.** The 19 existing `dark:` hits MUST be removed wave by wave until `grep -rn "dark:" src/components src/app --include="*.js" --include="*.jsx"` returns zero.
4. `ThemeProvider` system-listener behavior is kept: `prefers-color-scheme` changes apply ONLY when no explicit `clutchd_theme` override is stored. `followSystemTheme()` clears the override and falls back to light.
5. Toggle placement: floating ThemeToggle is DELETED. Theme control lives ONLY in (a) settings screen/route and (b) the BottomNav Menu/Settings popover theme row (Sun/Moon + Light/Dark label, already present in `BottomNav.js`). No other floating, header, or per-screen toggle may be added.
6. New theme-dependent styling MUST add a variable pair, never a conditional class or `isLight`/`isDark` prop. The existing semantic utilities (`.bg-surface*`, `.text-*`, `.border-subtle`, `.bg-card`, `.badge-*`, `.icon-highlight`) are the consumption API.

---

## D3. Type scale (LOCKED)

1. Body and UI font is **Onest** (`--font-sans`, `body { font-family: 'Onest', sans-serif }`). Kept everywhere.
2. Sanctioned type utilities: `headline-3` (1.5rem/1.35/500), `body-2` (0.875rem/1.45/400), `title-3` (0.875rem/1.45/600), `label-2` (0.6875rem/1.3/600/0.05em). BottomNav labels use `type-label-2`. These four are the workhorses; other existing scale steps may be used sparingly but never extended.
3. **KILL `.type-display`** (3.5625rem). It MUST NOT be used on any screen. Remove usages; do not restyle it.
4. **KILL Instrument Serif as body/UI face.** `Instrument Serif` (`--font-display`) is restricted to large display headings (`h1`, hero display) via the existing `h1-h4` rule. All body copy, buttons, labels, inputs, nav, and cards use Onest. Any `font-family: 'Instrument Serif'` outside display headings is a QA fail.
5. No new font families, no new weights outside Onest 300..800, no ad-hoc `text-[...]` sizes that duplicate a sanctioned step.

---

## D4. Radii (LOCKED)

| Role | Value | Applies to |
|---|---|---|
| Cards / modals / sheets / popovers | `rounded-2xl` (1rem per GlassCard base; `1.25rem` via `--glass-lux-radius` for glass-lux) | `GlassCard`, modals, settings popover, SOS/surface cards |
| Controls (buttons, inputs, tabs) | `rounded-xl` (0.75rem+ family; Button base `rounded-xl`) | `Button`, inputs, DashboardTabBar buttons, segmented controls |
| Pills / badges / dots | `rounded-full` | Cart badge, active indicators, status dots |

**KILL 0.75rem outliers:** `.surface-elevated`, `.surface-filled`, `.surface-outlined`, `.input-glass`, Leaflet popup overrides, or any component using `border-radius: 0.75rem` MUST be migrated to the table above (surfaces to `rounded-2xl`, controls to `rounded-xl`). No new `0.75rem` radius may be introduced.

---

## D5. Glass 2-variant spec (LOCKED)

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

Use `--elevation-1` through `--elevation-5` and `--glass-lux-shadow` / `--glass-lux-shadow-hover` only. `hover-lift` (`translateY(-2px)`) is reserved for primary CTA and pressable glass. `hover-glow` is BANNED (see D1.1). Modal entrance stays `modal-in` / `backdrop-in`; page entrance stays `page-enter` (0.25s). No new shadow tokens, no per-component shadow literals.

---

## D7. Status color mapping: `--warning` to `--info` rename + new `--pending` (LOCKED)

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

1. **BottomNav: 6 items kept.** Home (`/marketplace`), Categories, Search, Cart (badge), Profile, Menu/Settings popover. Order, paths, and badge behavior are frozen. The Menu popover keeps: profile links (My Profile, Orders, Favorites), inline 2-tap Emergency SOS row (no overlay), and the Theme row. SOS behavior is frozen.
2. **Per-role DashboardTabBars kept.** `DASHBOARD_TABS` (customer: Service, Schedule, Vehicles, History, Parts Store), `MECHANIC_TABS` (Jobs, Navigation, Earnings, Parts Store), `GARAGE_TABS` (Dashboard, Garage Profile, Analytics, Parts Store), `SELLER_TABS` (Dashboard, My Listings, Sales, Upload) with existing deep-link paths. Controlled mode (dashboard in-place) and link mode (profile pages deep-link) behavior is frozen.
3. **Floating ThemeToggle deleted**, moved to settings route + Menu popover theme row (see D2.5). No wave may reintroduce it.
4. **Modal a11y kept.** `backdrop-in`/`modal-in` entrances, outside-click close, Escape close, route-change close, `aria-label`/`aria-expanded`/`aria-haspopup`/`aria-current` patterns from `BottomNav.js` and `DashboardTabBar.js` are the template for every modal, popover, and tab bar. Every new overlay MUST have: focus-visible ring, Escape dismissal, and correct ARIA roles.
5. No new top-level nav destinations, no tab reordering, no new floating chrome.

---

## D10. Hierarchy rule (LOCKED)

Parts store is PRIMARY commerce surface; mechanic finding is SECONDARY discovery surface. Concretely: marketplace/parts-store entry points (BottomNav Home/Categories/Search/Cart, customer Parts Store tab, mechanic/garage Parts Store tabs) keep top-level placement and full visual weight. Mechanic/garage discovery cards, banners, or cross-sells MUST NOT outrank, overlay, or displace parts-store chrome. Any wave that touches home, search, or dashboard tabs MUST preserve this ordering or fail QA.

---

## D11. Dials, spacing, accessibility (LOCKED)

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

This file changes only by explicit amendment: cite the section, state old vs new, and re-baseline the affected QA gate. Implementation waves never silently reinterpret a LOCKED rule.
