
# 2026-07-08: Intelligent Back Navigation Implementation

## Summary
Implemented context-aware back navigation for the Capacitor hardware back button. Created a new `backNavigation.js` utility and enhanced `BackButtonHandler.js`.

## Key Design Decisions

### Navigation Context Tracking (backNavigation.js)
- Module-level singleton stack tracks navigation entries: `{ path, context, timestamp }`
- Context inference from path: `auth`, `dashboard`, `marketplace`, `admin`, `home`, `general`
- `getBackTarget()` returns `{ action: "back" | "stay" | "exit" }` based on context rules:
  - **Auth** → exit app (let Capacitor default handle it)
  - **Dashboard** with previous dashboard entry → go back (stay in dashboard)
  - **Dashboard** with non-dashboard previous entry → stay (don't leave dashboard to auth)
  - **All others** → default browser back

### Tracking Mechanics (BackButtonHandler.js)
- **Forward navigation**: `usePathname()` detects pathname changes → `pushNavigation()`
- **Backward navigation**: `popstate` event handler → `popNavigation()` + sets `wasPopState` flag
- Pathname `useEffect` skips pushing when `wasPopState` flag is set (avoids double-tracking)
- `useRef` flags ensure proper state tracking without re-render overhead

### Key Insight
Using `wasPopState` ref as a gate between popstate handler and pathname effect elegantly handles BOTH Capacitor-initiated `history.back()` AND browser-native back/forward — the popstate event fires before React re-renders, so the flag is always correctly set when the pathname effect runs.

## [2026-07-08] Additional Feature Gap Improvements

### GPS Location Sharing in Signup
- Added "Use GPS" button to both MechanicFields and GarageFields
- Uses `navigator.geolocation.getCurrentPosition()` with `enableHighAccuracy: true`
- Stores coordinates in hidden `latitude`/`longitude` form fields
- Validators updated with optional `z.number().optional()` for both schemas
- Pattern: inline button next to location text input with flex layout

### MapView Zoom Controls
- Added `ZoomControls` component using `useMap()` from react-leaflet
- + and - buttons styled with glass-lux aesthetic matching MyLocationButton
- Positioned above MyLocationButton with `marginBottom: 50px`
- Route (polyline + nav target + route distance) gated behind `showNavigation` check
- Only renders navigation features for `role="customer"` or `role="mechanic"`
- Route polyline has sticky Tooltip showing distance
- Midpoint distance label marker with permanent tooltip

### Provider Filter Fix
- Added `providerFilter` state to trackingStore ("all" | "mechanic" | "garage")
- Added `setProviderFilter()` and `getFilteredProviders()` computed getter
- ServiceRequestPanel syncs requestType radio -> providerFilter via useEffect
  - "auto" -> "all", "mechanic" -> "mechanic", "garage" -> "garage"
- ProviderList uses `getFilteredProviders()` selector for reactive filtering
- Added filter indicator badge in ProviderList header

### Nearby Providers Data Flow
- `fetchNearbyProviders()` tries backend first, applies `toCamelCase()`
- On failure, calls `_fallbackWithMockData()` which:
  - Uses IP geolocation (ip-api.com)
  - Generates nearby providers from mock dataset with computed distances
- Demo interceptor now handles `/providers/nearby` route with distance calculation
- Returns `{ mechanics, garages }` format matching backend response shape
