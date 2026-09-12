# Seller Upload — Mechanics + Garages can list parts

**Branch:** `clutchd-app-hardening`
**Date:** 2026-09-11
**Request:** mechanics + garages upload own parts to app store.

## Ground truth (verified)

- Backend `/home/dinusus/ClutchD-Backend`: NO `POST/PUT/DELETE /products|/vendors|/seller` (marketplace.py only GET products + POST reviews/cart/orders). `ProductResponse` read-only; `MarketplaceVendor` table exists but unwired. Only generic `POST /api/uploads` (auth, multipart file → `/static/uploads/{uuid}{ext}`, 10/min).
- Frontend `src/store/productStore.js`: GET-only (`/products`, `/products/{id}`). `ProductCard` shape: id,name,description,price,rating,image,brand,availability,vendor,vendorId. No product Zod schema in `validators.js`. Image precedents: `serviceStore.js:21` + `ChatPanel.js:80` FormData→`/uploads`, `FileUpload.js`, `warranty/page.js:251 accept=image/*`.
- Entry points today: mechanic + garage dashboards have `Parts Store → /marketplace` link only. No My Listings.

## Decision

Frontend-first local seller flow (no backend changes). Mirror `ProductResponse` shape so future `POST /api/marketplace/products` (proposed: `require_roles(mechanic,garage,admin)`, body name/price/brand/category_id/description/image/availability/delivery_time) drops in without UI rewrite. Keep offline fallback per BACKEND_CONTRACTS.

## Phase plan

### Phase 1 — Store + validation (role-guarded, local-first)
- `src/lib/validators.js`: add `productSchema` (name min3, price >=0 number, brand optional, category optional, description min10, availability bool default true, deliveryTime optional, image optional url/dataURL).
- `src/store/productStore.js`: add `sellerProducts` (localStorage `seller-products`), `addSellerProduct(data)`, `updateSellerProduct(id,patch)`, `removeSellerProduct(id)`; merge seller items into `products` getter/list (seller first, `isSeller:true`, `vendor` = user shop name, `vendorId` = user id); guard: only `mechanic|garage` can add (customer/admin → toast + reject).
- Image: try `POST /uploads` FormData when `BackendHealth.isAvailable()`, else FileReader dataURL fallback; validate ext jpg/png/webp + size <= max_upload_mb.
- Acceptance: mechanic/garage can add → appears in marketplace list + ProductCard; customer blocked; reload persists.
- Validate: vitest productStore seller tests, eslint, build.

### Phase 2 — Upload UI in both dashboards + marketplace entry
- New `src/components/marketplace/SellerProductForm.js` (react-hook-form+zod, fields name/price/brand/category/description/availability/image FileUpload, fitment optional text).
- Mechanic dashboard: sidebar `Sell Part` (or Parts Store submenu My Listings) → modal or `/dashboard/mechanic/listings` reusing form; Garage same in garage dashboard.
- Marketplace: seller CTA visible only to mechanic/garage (`Sell your part` → role dashboard or login).
- My Listings management: edit/delete own items, stock toggle.
- Acceptance: ≤3 taps to form from each dashboard; validation errors inline; image preview; new part visible in search/categories.
- Validate: eslint 0 warnings, build, e2e button-smoke seller flow (or manual 375/1440).

## Gates
- Touch only: validators, productStore (+tests), SellerProductForm, mechanic/garage pages, marketplace CTA. No auth/SOS/plate regressions.
- After each phase: diff stat, eslint 0 problems, tests pass, build 0.
- Rollback per-phase. Future backend wiring: add `POST /api/marketplace/products` + ProductCreate schema, then flip store to try-live-first.
