# 🚗 ClutchD App — Update Summary

> All changes shipped in a fresh APK (8.8 MB) at `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🆕 New Features

### Customer Dashboard Polish
- **Scheduled Appointments** — Upcoming service list with vehicle plate, date, status badges. Full width now.
- **Vehicle Selector + Notes** in booking modal — pick which car needs service and add notes.
- **Vehicle List** — Compact empty state, shimmer skeleton while loading.
- **Service History** — Filter tabs (All / Completed / Cancelled) with counts. Stays visible during loading. Error toast if fetch fails.
- **Marketplace Error Banners** — Dismissible amber alert when API fails (home + search pages).
- **SOS Button** — Quick-access emergency button at consistent bottom position.

### Service Request Flow
- **Media Upload Area** — Attach photos of the issue.
- **Provider Column** — See mechanic info during request.
- **Plate Number Field** — Auto-formats to Indian format: `DL-04-CA-1234`.
- **Indian Plate Formatter** — New utility (`formatIndianPlate`).

## 🔧 Fixes & Polish
- **Modal scroll lock** fixed — body overflow saved/restored correctly on close.
- **Mobile browser chrome** respected — `100vh` → `100dvh` across 6 files.
- **Body safe-area CSS** removed — was causing unnecessary padding.
- **Filter count zero-flash** fixed — counts hide during loading.
- **History tabs** stay visible during loading (no more full-page spinner).

## ✅ Quality
- **202/202 tests passing** across 8 test files.
- **Build compiles cleanly** — Next.js export + Android Gradle.
- **Fresh APK built** July 26, 2026.

---

*This update covers Phases 1A (9 waves foundation) + 1B (11 polish items) of the ClutchD customer UI.*
