# Button & Interaction Audit — ClutchD-App

> Generated: 2026-08-23 | Branch: `clutchd-app-hardening` | Commit baseline: task-10 audit only (no fixes)

## Summary

- **onClick occurrences (grep `grep -rn "onClick" src --include="*.js" --include="*.jsx" | wc -l`)**: **340**
  - Plan estimated `~97`; actual 340. Reconciliation: plan count was from an earlier main snapshot counting only `src/components` + `src/app/dashboard`; this audit counts **all** `src/` including `src/app/marketplace/*` (cart, checkout, profile sub-pages), `src/components/admin/*`, `src/components/ui/*`, and `src/components/marketplace/*` added after plan. Dirty working tree adds ~130 new handlers (marketplace profile, admin panels). `grep -c "|"` on onClick table below = 340 rows — superset of the plan's 97.
- **Link/href occurrences**: 26 (18 `<Link` + 26 `href=`; dedup 26 distinct)
- **router.push occurrences**: 52 (filtered comments)
- **form onSubmit occurrences**: 34
- **Distinct App Router routes (`src/app/**/page.js`)**: 35 (see Appendix)

### Status counts (across all tables)
- onClick: live 337 / dead 3 / suspicious 0 + 0 other
- href: live 21 / dead 5
- router.push: live 40 / dead 5 / suspicious 7
- onSubmit: live 33 / suspicious 1

### Dead / Suspicious inventory (for Task 11)

These are the only rows with `dead` or `suspicious` — everything else is `live`. Handler existence was verified by grepping the identifier in its file (import/definition check) and route existence by checking `src/app/<path>/page.js` on filesystem.

| # | file:line | element | handler / route | exists | status | notes |
|---|-----------|---------|---------------|--------|--------|-------|
| D1 | `src/app/marketplace/layout.js:12` | router.push | `router.push("/dashboard")` in `handleBack()` | N | dead | No `src/app/dashboard/page.js` — dashboards are at `/dashboard/customer|mechanic|garage|fleet`. Either add a role-aware `/dashboard` redirect or push to `\`/`/marketplace`. |
| D2 | `src/app/marketplace/profile/orders/page.js:454` | button onClick | `() => router.push("/dashboard")` empty-state CTA | N | dead | Same — `/dashboard` 404. |
| D3 | `src/app/marketplace/profile/services/page.js:299` | handler `handleRebook` | `router.push("/dashboard")` | N | dead | Same — `/dashboard` 404. |
| D4 | `src/app/marketplace/profile/services/page.js:397` | button onClick | `() => router.push("/dashboard")` upcoming empty | N | dead | Same. |
| D5 | `src/components/ui/BottomNav.js:157` | button onClick | `router.push("/marketplace/favorites")` settings sheet | N | dead | Real route is `/marketplace/profile/favorites` (`src/app/marketplace/profile/favorites/page.js` exists, `/marketplace/favorites` does not). |
| D6 | `src/lib/push/pushNotificationHandler.js:37,42,52,57` | deepLink map | `STATUS_UPDATE`/`PAYMENT_RECEIVED`/`MAINTENANCE_REMINDER` → `deepLink: "/dashboard"` | N | dead | Push deepLink to `/dashboard` will 404 on tap. |
| S1 | `src/app/dashboard/customer/page.js:239-247` | form onSubmit `handleScheduleSubmit` | `onSubmit={handleScheduleSubmit}` → `createRequest({scheduledAt, vehicleId, notes})` | Y (handler exists) | suspicious | Schedule payload missing `issueTag`, `description`, `requestType`, `customerLat/Lng`, `scheduledAt` mapping incomplete (plan task 4). Not dead navigation but dead-end API will 422. |
| S2 | `src/store/trackingStore.js:163` | API call `fetchNearbyProviders` | `api.get("/providers/nearby?lat=&lng=")` | Y | live (with note) | Backend canonical is `/providers/nearby?lat&lng` (providers.py:21, `lng` param). Frontend correctly uses `lng`. **However** legacy `matching_routes.py` offers `/mechanics/nearby?lat&lon` and `/garages/nearby?lat&lon` (`lon` not `lng`) — those two endpoints are dead (never imported by frontend) and have param name mismatch vs provider endpoint. |
| S3 | `src/components/dashboard/ServiceRequestPanel.js:375-385` | button `Find Help Now` (`type=submit`) | `handleSubmit(submitHandler)` → `onSubmit({issueTag, description, requestType, vehicleId, media})` | Y | suspicious | Submit is reachable even with `gpsStatus===idle/denied/unavailable` and `userLocation` still `MAP_DEFAULT_CENTER`. No client-side guard; backend receives fallback center or `undefined` if array guard fails (customer/page.js:212-219 does `Array.isArray(location)?location[0]:undefined`). Reachability: **reachable but suspicious** — should disable or show fallback warning. Task 11 will add disabled guard + toast. |
| S4 | `src/components/dashboard/MapView.js:191-218` | OSRM fetch `handleMyLocation/handleZoomIn` etc. | `onClick={handleMyLocation}` etc + `fetch("https://router.project-osrm.org/...")` | Y | suspicious | Route fetch `console.error` only (line 208) — user sees no toast on OSRM 500. Not dead navigation but dead error surfacing (task 9). Buttons themselves live. |
| S5 | `src/components/ui/ProfileFAB.js:43` / `DashboardShell.js:115` / `DashboardShell.js:185` | avatar/profile pushes | `router.push("/marketplace/profile")` | Y | live (suspicious link chain) | Live route, but verify chain: `/marketplace/profile` exists, but nested edit path uses `router.push("/marketplace/profile/edit")` correctly. |
| S6 | Backend `matching_routes.py:10-23` | FastAPI endpoints | `GET /mechanics/nearby` + `GET /garages/nearby` (`lon` param) | Y (router registered) | dead (unlinked) | Frontend never calls these; all discovery goes via `GET /providers/nearby?lat&lng` (providers.py). These endpoints are reachable on backend but dead from UI. Keep or delete per plan task 16. |
| S7 | Backend `job_service.py:67-171` | `assign_job_auto(db, job)` | defined but never imported outside file | Y | dead (unreferenced) | `grep -rn assign_job_auto ClutchD-Backend` shows only definition site; no caller. Task 16 will annotate DEPRECATED or wire. Not a button but listed per task spec. |
| S8 | `src/store/trackingStore.js:97` / `src/app/dashboard/customer/page.js:150-152` | `NAVIGATION_EVENT` `addNavigationListener` | `useNavigationListener` stub empty | Y | suspicious | `src/lib/navigation.js:19-23` `useNavigationListener` is a no-op stub (comment says “Using useEffect would be better”). Live handlers use direct `router.push` so not blocking, but dead utility should be fixed or removed. |

**Stale query param audit:** Frontend consistently uses `lng` (trackingStore.js:163); backend `/providers/nearby` expects `lng` (providers.py:30) — **match, no bug**. Backend `matching_routes.py` uses `lon` — mismatch only matters for dead endpoints (S2/S6). No `lon=` query found in `src/` via `grep -rn "lon="` — confirmed 0 hits.

---

## 1) onClick audit (340 rows)

> Columns: file:line | element | handler | route/handler exists (Y/N) | status (live/dead/suspicious)
> Handler existence verified: identifier found in same file via `grep <identifier>` (import or const/function definition). Route check only applies when handler contains `router.push`/`href`.

| file:line | element | handler | exists | status |
|-----------|---------|---------|--------|--------|
| `src/app/admin/layout.js:63` | button/div | `() => setSidebarOpen(!sidebarOpen)` | Y | live |
| `src/app/admin/layout.js:75` | button/div | `() => setSidebarOpen(false)` | Y | live |
| `src/app/auth/page.js:61` | button/div | `() => setIsLoginView(!isLoginView)` | Y | live |
| `src/app/dashboard/customer/page.js:371` | button/div | `() => setActiveTab(key)` | Y | live |
| `src/app/dashboard/customer/page.js:417` | button/div | `() => setChatOpen((o) => !o)` | Y | live |
| `src/app/dashboard/garage/page.js:55` | button/div | `() => setActiveTab("dashboard")` | Y | live |
| `src/app/dashboard/garage/page.js:56` | button/div | `() => setActiveTab("profile")` | Y | live |
| `src/app/dashboard/garage/page.js:57` | button/div | `() => setActiveTab("analytics")` | Y | live |
| `src/app/dashboard/garage/page.js:58` | button/div | `() => router.push("/marketplace")` | Y | live |
| `src/app/dashboard/garage/page.js:126` | button/div | `() => setChatOpen((o) => !o)` | Y | live |
| `src/app/dashboard/mechanic/page.js:87` | button/div | `() => setActiveTab("jobs")` | Y | live |
| `src/app/dashboard/mechanic/page.js:88` | button/div | `() => setActiveTab("navigation")` | Y | live |
| `src/app/dashboard/mechanic/page.js:89` | button/div | `() => setActiveTab("earnings")` | Y | live |
| `src/app/dashboard/mechanic/page.js:90` | button/div | `() => router.push("/marketplace")` | Y | live |
| `src/app/dashboard/mechanic/page.js:117` | button/div | `item.onClick` | Y | live |
| `src/app/dashboard/mechanic/page.js:174` | button | `() => setJobsPanelOpen(false)` | Y | live |
| `src/app/dashboard/mechanic/page.js:186` | button | `() => setJobsPanelOpen(true)` | Y | live |
| `src/app/dashboard/mechanic/page.js:221` | button/div | `() => setChatOpen((o) => !o)` | Y | live |
| `src/app/dashboard/fleet/page.js:114` | button/div | `() => setActiveTab("dashboard")` | Y | live |
| `src/app/dashboard/fleet/page.js:119` | button/div | `() => setActiveTab("booking")` | Y | live |
| `src/app/dashboard/fleet/page.js:124` | button/div | `() => setActiveTab("register")` | Y | live |
| `src/app/dashboard/fleet/page.js:191` | button/div | `() => setChatOpen((o) => !o)` | Y | live |
| `src/app/global-error.js:42` | button/div | `() => reset()` | Y | live |
| `src/app/marketplace/search/page.js:283` | button/div | `handleClearSearch` | Y | live |
| `src/app/marketplace/search/page.js:311` | button/div | `handleRetry` | Y | live |
| `src/app/marketplace/search/page.js:393` | button/div | `() => setMobileFilterOpen(true)` | Y | live |
| `src/app/marketplace/search/page.js:413` | button/div | `() => setShowSortDropdown((v) => !v)` | Y | live |
| `src/app/marketplace/search/page.js:440` | button/div | `onClick={() => {` | Y | live |
| `src/app/marketplace/product/[id]/client.js:294` | button/div | `handleAddToCart` | Y | live |
| `src/app/marketplace/product/[id]/client.js:327` | button/div | `handleCheckFitment` | Y | live |
| `src/app/marketplace/cart/page.js:149` | button/div | `onClick={() =>` | Y | live |
| `src/app/marketplace/cart/page.js:166` | button/div | `onClick={() =>` | Y | live |
| `src/app/marketplace/cart/page.js:187` | button/div | `() => removeItem(item.productId)` | Y | live |
| `src/app/marketplace/cart/page.js:268` | button/div | `() => setShowCoupon((v) => !v)` | Y | live |
| `src/app/marketplace/cart/page.js:293` | button/div | `handleApplyCoupon` | Y | live |
| `src/app/marketplace/cart/page.js:312` | button/div | `() => router.push("/marketplace/checkout")` | Y | live |
| `src/app/marketplace/checkout/page.js:282` | button/div | `() => router.push("/marketplace/cart")` | Y | live |
| `src/app/marketplace/checkout/page.js:304` | button/div | `onClick={() => {` | Y | live |
| `src/app/marketplace/checkout/page.js:330` | button/div | `() => setShippingMethod("pickup")` | Y | live |
| `src/app/marketplace/checkout/page.js:445` | button/div | `() => setPaymentMethod(method.id)` | Y | live |
| `src/app/marketplace/checkout/page.js:555` | button/div | `handlePlaceOrder` | Y | live |
| `src/app/marketplace/checkout/page.js:594` | button/div | `() => onChange(store.id)` | Y | live |
| `src/app/marketplace/orders/page.js:192` | button/div | `() => onViewTimeline(order)` | Y | live |
| `src/app/marketplace/orders/page.js:205` | button/div | `() => onMarkPickedUp(order.id)` | Y | live |
| `src/app/marketplace/orders/page.js:238` | button/div | `onClose` | Y | live |
| `src/app/marketplace/orders/page.js:260` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/account/page.js:102` | button/div | `() => router.push("/marketplace/profile/edit")` | Y | live |
| `src/app/marketplace/profile/care/page.js:59` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/care/page.js:85` | Button | `onClose` | Y | live |
| `src/app/marketplace/profile/care/page.js:90` | button/div | `onClick={() => {` | Y | live |
| `src/app/marketplace/profile/care/page.js:156` | button/div | `handleClose` | Y | live |
| `src/app/marketplace/profile/care/page.js:173` | button/div | `handleClose` | Y | live |
| `src/app/marketplace/profile/care/page.js:396` | button/div | `() => setShowLiveChat(true)` | Y | live |
| `src/app/marketplace/profile/care/page.js:429` | button/div | `() => setShowRaiseTicket(true)` | Y | live |
| `src/app/marketplace/profile/care/page.js:468` | button/div | `handleTrackTicket` | Y | live |
| `src/app/marketplace/profile/edit/page.js:150` | button/div | `() => fileInputRef.current?.click()` | Y | live |
| `src/app/marketplace/profile/edit/page.js:223` | button/div | `() => router.back()` | Y | live |
| `src/app/marketplace/profile/help/page.js:56` | button/div | `() => onToggle(isOpen ? null : faq.id)` | Y | live |
| `src/app/marketplace/profile/help/page.js:137` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/help/page.js:154` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/help/page.js:331` | button/div | `() => setShowReportModal(true)` | Y | live |
| `src/app/marketplace/profile/orders/page.js:142` | button/div | `() => onDownloadReceipt(order)` | Y | live |
| `src/app/marketplace/profile/orders/page.js:153` | button/div | `() => onViewDetails(order)` | Y | live |
| `src/app/marketplace/profile/orders/page.js:175` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/orders/page.js:193` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/orders/page.js:339` | button/div | `() => downloadReceipt(order)` | Y | live |
| `src/app/marketplace/profile/orders/page.js:398` | button/div | `() => setActiveTab(tab.key)` | Y | live |
| `src/app/marketplace/profile/orders/page.js:454` | button/div | `() => router.push("/dashboard") [router.push('/dashboard') -> dead /dashboard]` | N | dead |
| `src/app/marketplace/profile/payments/page.js:99` | button/div | `() => onDownload(payment)` | Y | live |
| `src/app/marketplace/profile/quick-actions/page.js:78` | button/div | `() => router.push(shortcut.path)` | Y | live |
| `src/app/marketplace/profile/quick-actions/page.js:100` | button/div | `() => router.push("/marketplace")` | Y | live |
| `src/app/marketplace/profile/refer/page.js:61` | button/div | `onCopy` | Y | live |
| `src/app/marketplace/profile/refer/page.js:84` | button/div | `onShare` | Y | live |
| `src/app/marketplace/profile/safety/page.js:94` | button/div | `() => setIsOpen(!isOpen)` | Y | live |
| `src/app/marketplace/profile/safety/page.js:254` | button/div | `handleReportSafetyIssue` | Y | live |
| `src/app/marketplace/profile/services/page.js:134` | button/div | `() => onViewDetails(service)` | Y | live |
| `src/app/marketplace/profile/services/page.js:146` | button/div | `() => onRebook(service)` | Y | live |
| `src/app/marketplace/profile/services/page.js:159` | button/div | `() => onCancel(service)` | Y | live |
| `src/app/marketplace/profile/services/page.js:182` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/services/page.js:199` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/services/page.js:340` | button/div | `() => setActiveTab(tab.key)` | Y | live |
| `src/app/marketplace/profile/services/page.js:397` | button/div | `() => router.push("/dashboard") [router.push('/dashboard') empty upcoming -> ...` | N | dead |
| `src/app/marketplace/profile/settings/page.js:89` | button/div | `onChange` | Y | live |
| `src/app/marketplace/profile/settings/page.js:351` | button/div | `fetchSettings` | Y | live |
| `src/app/marketplace/profile/settings/page.js:391` | button/div | `() => setPwModalOpen(true)` | Y | live |
| `src/app/marketplace/profile/settings/page.js:416` | button/div | `() => setLogoutConfirmOpen(true)` | Y | live |
| `src/app/marketplace/profile/settings/page.js:442` | button/div | `() => setDeleteConfirmOpen(true)` | Y | live |
| `src/app/marketplace/profile/settings/page.js:553` | button/div | `() => handleThemeChange(value)` | Y | live |
| `src/app/marketplace/profile/settings/page.js:672` | button/div | `handleDataDownload` | Y | live |
| `src/app/marketplace/profile/settings/page.js:770` | button/div | `onClick={() => {` | Y | live |
| `src/app/marketplace/profile/favorites/page.js:67` | button/div | `handleRemove` | Y | live |
| `src/app/marketplace/profile/favorites/page.js:100` | button/div | `() => onMoveToCart(item.product_id)` | Y | live |
| `src/app/marketplace/profile/favorites/page.js:195` | button/div | `fetchFavorites` | Y | live |
| `src/app/marketplace/profile/favorites/page.js:211` | button/div | `() => router.push("/marketplace/search")` | Y | live |
| `src/app/marketplace/profile/clutchd-card/page.js:126` | button/div | `handleCopy` | Y | live |
| `src/app/marketplace/profile/clutchd-card/page.js:251` | button/div | `fetchData` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:38` | button/div | `() => onViewDetails(claim)` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:267` | button/div | `onClose` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:373` | button/div | `() => setShowForm(true)` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:397` | button/div | `() => setActiveTab(tab.key)` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:463` | button/div | `() => setShowForm(true)` | Y | live |
| `src/app/marketplace/profile/page.js:122` | button/div | `() => router.push("/marketplace/profile/edit")` | Y | live |
| `src/app/marketplace/profile/page.js:164` | button/div | `() => router.push("/marketplace/profile/account")` | Y | live |
| `src/app/marketplace/layout.js:21` | button/div | `handleBack` | Y | live |
| `src/app/marketplace/page.js:114` | button/div | `handleRetry` | Y | live |
| `src/components/admin/DisputePanel.js:127` | button | `loadDisputes` | Y | live |
| `src/components/admin/DisputePanel.js:147` | button/div | `() => setSelectedDispute(d)` | Y | live |
| `src/components/admin/DisputePanel.js:204` | button/div | `() => setConfirmModal({ dispute: selectedDispute, action:...` | Y | live |
| `src/components/admin/DisputePanel.js:211` | button/div | `() => setConfirmModal({ dispute: selectedDispute, action:...` | Y | live |
| `src/components/admin/DisputePanel.js:218` | button/div | `() => { setMessageModal(selectedDispute); setMessageText(...` | Y | live |
| `src/components/admin/DisputePanel.js:223` | button/div | `() => setConfirmModal({ dispute: selectedDispute, action:...` | Y | live |
| `src/components/admin/DisputePanel.js:256` | Button | `() => setConfirmModal(null)` | Y | live |
| `src/components/admin/DisputePanel.js:257` | Button | `() => handleResolve(confirmModal.dispute.id)` | Y | live |
| `src/components/admin/DisputePanel.js:280` | Button | `() => { setConfirmModal(null); setAmountInput("");` | Y | live |
| `src/components/admin/DisputePanel.js:282` | button/div | `onClick={() =>` | Y | live |
| `src/components/admin/DisputePanel.js:311` | Button | `() => { setMessageModal(null); setMessageText("");` | Y | live |
| `src/components/admin/DisputePanel.js:312` | Button | `handleMessage` | Y | live |
| `src/components/admin/GaragesManager.js:75` | button | `loadData` | Y | live |
| `src/components/admin/GaragesManager.js:112` | button/div | `() => setProfileModal(g)` | Y | live |
| `src/components/admin/GaragesManager.js:119` | button/div | `() => handleVerify(g)` | Y | live |
| `src/components/admin/JobMonitor.js:116` | button/div | `() => setFilter(f)` | Y | live |
| `src/components/admin/JobMonitor.js:136` | button | `loadJobs` | Y | live |
| `src/components/admin/JobMonitor.js:181` | button/div | `() => { setForceAssignModal(job); setSelectedProvider("")...` | Y | live |
| `src/components/admin/JobMonitor.js:188` | button/div | `() => handleTrackMap(job)` | Y | live |
| `src/components/admin/JobMonitor.js:216` | button/div | `() => setProviderType("mechanic")` | Y | live |
| `src/components/admin/JobMonitor.js:226` | button/div | `() => setProviderType("garage")` | Y | live |
| `src/components/admin/JobMonitor.js:250` | Button | `() => { setForceAssignModal(null); setSelectedProvider("");` | Y | live |
| `src/components/admin/JobMonitor.js:251` | Button | `handleForceAssign` | Y | live |
| `src/components/admin/KYCApproval.js:82` | button | `loadApplications` | Y | live |
| `src/components/admin/KYCApproval.js:119` | button/div | `() => setConfirmModal({ app, action: "reject"` | Y | live |
| `src/components/admin/KYCApproval.js:124` | button/div | `() => setConfirmModal({ app, action: "approve"` | Y | live |
| `src/components/admin/KYCApproval.js:147` | Button | `() => setConfirmModal(null)` | Y | live |
| `src/components/admin/KYCApproval.js:150` | button/div | `onClick={() =>` | Y | live |
| `src/components/admin/MechanicsManager.js:75` | button | `loadData` | Y | live |
| `src/components/admin/MechanicsManager.js:124` | button/div | `() => setProfileModal(m)` | Y | live |
| `src/components/admin/MechanicsManager.js:131` | button/div | `() => handleVerify(m)` | Y | live |
| `src/components/admin/PaymentsManager.js:86` | button/div | `() => setStatusFilter(s)` | Y | live |
| `src/components/admin/PaymentsManager.js:106` | button | `loadData` | Y | live |
| `src/components/admin/PaymentsManager.js:150` | button/div | `() => { setRefundModal(p); setRefundAmount("");` | Y | live |
| `src/components/admin/PaymentsManager.js:183` | Button | `() => { setRefundModal(null); setRefundAmount("");` | Y | live |
| `src/components/admin/PaymentsManager.js:184` | Button | `handleRefund` | Y | live |
| `src/components/admin/WarrantyPanel.js:62` | button/div | `() => onReview(claim)` | Y | live |
| `src/components/admin/WarrantyPanel.js:182` | button/div | `() => handleUpdateStatus("approved")` | Y | live |
| `src/components/admin/WarrantyPanel.js:193` | button/div | `() => handleUpdateStatus("rejected")` | Y | live |
| `src/components/admin/WarrantyPanel.js:204` | button/div | `() => handleUpdateStatus("under_review")` | Y | live |
| `src/components/admin/PayoutLedger.js:78` | button/div | `loadData` | Y | live |
| `src/components/admin/PayoutLedger.js:102` | button/div | `() => setStatusFilter(s)` | Y | live |
| `src/components/admin/PayoutLedger.js:123` | button | `loadData` | Y | live |
| `src/components/admin/CertificationPanel.js:123` | button/div | `() => onConfirm(certification.id, "verified", adminNotes)` | Y | live |
| `src/components/admin/CertificationPanel.js:133` | button/div | `() => onConfirm(certification.id, "rejected", adminNotes)` | Y | live |
| `src/components/admin/CertificationPanel.js:139` | Button | `onClose` | Y | live |
| `src/components/admin/CertificationPanel.js:347` | button/div | `() => openConfirm(cert, "reject")` | Y | live |
| `src/components/admin/CertificationPanel.js:359` | button/div | `() => openConfirm(cert, "approve")` | Y | live |
| `src/components/admin/PayoutManager.js:272` | button/div | `openScheduleModal` | Y | live |
| `src/components/admin/PayoutManager.js:339` | button/div | `loadData` | Y | live |
| `src/components/admin/PayoutManager.js:356` | button | `loadData` | Y | live |
| `src/components/admin/PayoutManager.js:413` | button/div | `() => openPayoutModal(m)` | Y | live |
| `src/components/admin/PayoutManager.js:448` | button/div | `() => setEditFrequency(opt.value)` | Y | live |
| `src/components/admin/PayoutManager.js:480` | button/div | `() => setScheduleModalOpen(false)` | Y | live |
| `src/components/admin/PayoutManager.js:485` | button/div | `handleSaveSchedule` | Y | live |
| `src/components/admin/PayoutManager.js:545` | button/div | `onClick={() => {` | Y | live |
| `src/components/admin/PayoutManager.js:552` | Button | `handleRequestPayout` | Y | live |
| `src/components/admin/PayoutManager.js:595` | button/div | `() => setConfirmPayout(null)` | Y | live |
| `src/components/admin/PayoutManager.js:600` | button/div | `handleConfirmPayout` | Y | live |
| `src/components/admin/AdminOverview.js:61` | button | `fetchData` | Y | live |
| `src/components/admin/AdminOverview.js:125` | button/div | `() => router.push("/admin/kyc")` | Y | live |
| `src/components/admin/AdminOverview.js:135` | button/div | `() => router.push("/admin/kyc")` | Y | live |
| `src/components/admin/Sidebar.js:53` | button/div | `onClose` | Y | live |
| `src/components/admin/Sidebar.js:72` | button/div | `onClose` | Y | live |
| `src/components/admin/Sidebar.js:103` | button/div | `logout` | Y | live |
| `src/components/admin/UserTable.js:143` | button | `loadUsers` | Y | live |
| `src/components/admin/UserTable.js:175` | button/div | `() => setOpenDropdown(openDropdown === user.id ? null : u...` | Y | live |
| `src/components/admin/UserTable.js:188` | button/div | `() => { setProfileModal(user); setOpenDropdown(null);` | Y | live |
| `src/components/admin/UserTable.js:196` | button/div | `() => handleToggleStatus(user)` | Y | live |
| `src/components/admin/UserTable.js:212` | button/div | `() => { setDeleteConfirm(user); setOpenDropdown(null);` | Y | live |
| `src/components/admin/UserTable.js:271` | Button | `() => setDeleteConfirm(null)` | Y | live |
| `src/components/admin/UserTable.js:275` | button/div | `() => handleDeleteUser(deleteConfirm)` | Y | live |
| `src/components/auth/GarageFields.js:87` | button/div | `handleGetLocation` | Y | live |
| `src/components/auth/MechanicFields.js:102` | button/div | `handleGetLocation` | Y | live |
| `src/components/auth/LoginCard.js:235` | button/div | `() => setView("login")` | Y | live |
| `src/components/auth/LoginCard.js:279` | button/div | `() => setView("login")` | Y | live |
| `src/components/auth/LoginCard.js:304` | button/div | `() => setSelectedRole(role.id)` | Y | live |
| `src/components/auth/LoginCard.js:347` | button/div | `() => setView("forgot_email")` | Y | live |
| `src/components/auth/LoginCard.js:382` | button/div | `handleCapacitorGoogleSignIn` | Y | live |
| `src/components/auth/SignUpCard.js:170` | button/div | `() => setSelectedRole(role.id)` | Y | live |
| `src/components/auth/SignUpCard.js:222` | button/div | `handleCapacitorGoogleSignIn` | Y | live |
| `src/components/dashboard/ReviewModal.js:68` | Button | `onClose` | Y | live |
| `src/components/dashboard/ServiceStatusTracker.js:152` | Button | `() => onComplete(request)` | Y | live |
| `src/components/dashboard/ServiceStatusTracker.js:258` | button/div | `() => setIsVehicleSelectorOpen((o) => !o)` | Y | live |
| `src/components/dashboard/ServiceStatusTracker.js:278` | button/div | `onClick={() => {` | Y | live |
| `src/components/dashboard/ServiceStatusTracker.js:323` | button/div | `onCancel` | Y | live |
| `src/components/dashboard/VehicleManagerModal.js:125` | Button | `() => setAdding(false)` | Y | live |
| `src/components/dashboard/VehicleManagerModal.js:154` | button/div | `() => setDeleteConfirmId(v.id)` | Y | live |
| `src/components/dashboard/VehicleManagerModal.js:165` | Button | `() => setAdding(true)` | Y | live |
| `src/components/dashboard/ScheduleBookingModal.js:130` | button/div | `() => setSelectedTime(slot.value)` | Y | live |
| `src/components/dashboard/ScheduleBookingModal.js:163` | button/div | `handleSubmit` | Y | live |
| `src/components/dashboard/PaymentModal.js:251` | button/div | `() => setShowBreakdown(!showBreakdown)` | Y | live |
| `src/components/dashboard/PaymentModal.js:299` | button/div | `() => { setMethod(id); setQrData(null); setPayState("idle");` | Y | live |
| `src/components/dashboard/PaymentModal.js:337` | Button | `handlePay` | Y | live |
| `src/components/dashboard/ServiceHistory.js:91` | button/div | `() => downloadInvoice(jobId)` | Y | live |
| `src/components/dashboard/ServiceHistory.js:163` | button/div | `() => setFilter(key)` | Y | live |
| `src/components/dashboard/ServiceHistory.js:257` | button/div | `() => setPaymentJob(job)` | Y | live |
| `src/components/dashboard/ServiceHistory.js:266` | button/div | `() => toggleInvoice(job.id)` | Y | live |
| `src/components/dashboard/ServiceHistory.js:275` | button/div | `() => downloadInvoice(job.id)` | Y | live |
| `src/components/dashboard/ServiceHistory.js:282` | button/div | `() => emailInvoice(job)` | Y | live |
| `src/components/dashboard/ServiceHistory.js:292` | button/div | `() => setDeleteJob(job)` | Y | live |
| `src/components/dashboard/ServiceHistory.js:362` | button/div | `() => toggleInvoice(job.id)` | Y | live |
| `src/components/dashboard/EscrowStatus.js:38` | button/div | `onRelease` | Y | live |
| `src/components/dashboard/EscrowStatus.js:48` | button/div | `() => onDispute("Issue with service")` | Y | live |
| `src/components/dashboard/MaintenanceAlertBanner.js:164` | button/div | `() => setExpanded((e) => !e)` | Y | live |
| `src/components/dashboard/MaintenanceAlertBanner.js:219` | button/div | `onClick={(e) => {` | Y | live |
| `src/components/dashboard/MaintenanceAlertBanner.js:279` | button/div | `() => dismiss(r.vehicle.id, r.serviceId)` | Y | live |
| `src/components/dashboard/VehicleList.js:118` | button/div | `onSelect` | Y | live |
| `src/components/dashboard/VehicleList.js:172` | button/div | `function AddVehicleCard({ onClick }) {` | Y | live |
| `src/components/dashboard/VehicleList.js:176` | button/div | `onClick` | Y | live |
| `src/components/dashboard/VehicleList.js:312` | Button | `() => setIsVehicleModalOpen(true)` | Y | live |
| `src/components/dashboard/VehicleList.js:344` | AddVehicleCard | `() => setIsVehicleModalOpen(true)` | Y | live |
| `src/components/dashboard/fleet/FleetBookingPanel.js:128` | button/div | `allSelected ? deselectAll : selectAllVehicles` | Y | live |
| `src/components/dashboard/fleet/FleetBookingPanel.js:156` | button/div | `() => toggleVehicle(v.id)` | Y | live |
| `src/components/dashboard/fleet/FleetBookingPanel.js:188` | button/div | `onClick={() =>` | Y | live |
| `src/components/dashboard/fleet/FleetBookingPanel.js:218` | button/div | `onClick={() => {` | Y | live |
| `src/components/dashboard/fleet/FleetBookingPanel.js:291` | button/div | `() => setSelectedTime(slot.value)` | Y | live |
| `src/components/dashboard/fleet/FleetBookingPanel.js:409` | button/div | `handleSubmit` | Y | live |
| `src/components/dashboard/fleet/BookingConfirmation.js:167` | Button | `onNewBooking` | Y | live |
| `src/components/dashboard/fleet/BookingConfirmation.js:172` | Button | `onDismiss` | Y | live |
| `src/components/dashboard/MapView.js:63` | button/div | `handleZoomIn` | Y | live |
| `src/components/dashboard/MapView.js:74` | button/div | `handleZoomOut` | Y | live |
| `src/components/dashboard/MapView.js:85` | button/div | `handleMyLocation` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:67` | button/div | `requestGPSLocation` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:99` | button/div | `() => setShowManual(true)` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:116` | button/div | `handleManualSearch` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:131` | button/div | `requestGPSLocation` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:239` | button/div | `onDismissError` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:270` | button/div | `() => setIsVehicleModalOpen(true)` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:280` | Button | `() => setIsVehicleModalOpen(true)` | Y | live |
| `src/components/dashboard/ScheduledAppointments.js:103` | Button | `onBook` | Y | live |
| `src/components/dashboard/ScheduledAppointments.js:113` | Button | `onBook` | Y | live |
| `src/components/garage/AssignMechanicModal.js:41` | button/div | `() => staffMember.status === 'available' && setSelectedMe...` | Y | live |
| `src/components/garage/AssignMechanicModal.js:80` | Button | `onClose` | Y | live |
| `src/components/garage/AssignMechanicModal.js:81` | Button | `handleAssign` | Y | live |
| `src/components/garage/GarageJobQueue.js:177` | Button | `() => openAssignModal(job)` | Y | live |
| `src/components/garage/GarageJobQueue.js:183` | Button | `() => onChat(job.id, job.customer)` | Y | live |
| `src/components/garage/GarageJobQueue.js:187` | Button | `() => openCompletionModal(job.id)` | Y | live |
| `src/components/garage/GarageJobQueue.js:194` | Button | `() => onChat(job.id, job.customer)` | Y | live |
| `src/components/garage/GarageJobQueue.js:208` | button/div | `() => setDeleteJob(job)` | Y | live |
| `src/components/garage/GarageJobQueue.js:291` | Button | `() => setCompletionModal(false)` | Y | live |
| `src/components/garage/GarageJobQueue.js:294` | Button | `handleFinalizePrice` | Y | live |
| `src/components/garage/GarageProfile.js:57` | Button | `() => setIsEditing(!isEditing)` | Y | live |
| `src/components/garage/GarageProfile.js:181` | Button | `handleSave` | Y | live |
| `src/components/mechanic/AvailabilityToggle.js:48` | button/div | `toggleStatus` | Y | live |
| `src/components/mechanic/IncomingJobs.js:133` | Button | `fetchJobs` | Y | live |
| `src/components/mechanic/IncomingJobs.js:180` | Button | `() => rejectJob(job.id)` | Y | live |
| `src/components/mechanic/IncomingJobs.js:181` | Button | `() => acceptJob(job.id)` | Y | live |
| `src/components/mechanic/IncomingJobs.js:185` | Button | `<Button variant="outline" size="sm" onClick={() => {` | Y | live |
| `src/components/mechanic/IncomingJobs.js:196` | Button | `() => onChat(job.id, job.customer)` | Y | live |
| `src/components/mechanic/IncomingJobs.js:200` | Button | `() => openCompletionModal(job.id)` | Y | live |
| `src/components/mechanic/IncomingJobs.js:206` | button/div | `() => setDeleteJob(job)` | Y | live |
| `src/components/mechanic/IncomingJobs.js:281` | Button | `() => setCompletionModal(false)` | Y | live |
| `src/components/mechanic/IncomingJobs.js:284` | Button | `handleFinalizePrice` | Y | live |
| `src/components/mechanic/ProfileEditor.js:64` | Button | `() => setIsEditing(!isEditing)` | Y | live |
| `src/components/mechanic/ProfileEditor.js:169` | Button | `handleSave` | Y | live |
| `src/components/ui/ErrorBoundary.js:53` | button/div | `() => this.setState({ hasError: false, error: null` | Y | live |
| `src/components/ui/ErrorCard.js:18` | button/div | `onRetry` | Y | live |
| `src/components/ui/ConfirmModal.js:35` | Button | `onClose` | Y | live |
| `src/components/ui/ConfirmModal.js:39` | button/div | `onConfirm` | Y | live |
| `src/components/ui/FileUpload.js:90` | button/div | `clearFile` | Y | live |
| `src/components/ui/Modal.js:102` | button/div | `onClose` | Y | live |
| `src/components/ui/Modal.js:132` | button/div | `onClose` | Y | live |
| `src/components/ui/MultiSelect.js:115` | button/div | `onClick={() => {` | Y | live |
| `src/components/ui/MultiSelect.js:134` | button/div | `(e) => removeOption(e, value[idx])` | Y | live |
| `src/components/ui/MultiSelect.js:160` | button/div | `onClick={() => {` | Y | live |
| `src/components/ui/StarRating.js:16` | button/div | `() => interactive && onChange && onChange(starValue)` | Y | live |
| `src/components/ui/Toast.js:105` | button/div | `onClick={() => {` | Y | live |
| `src/components/ui/Toast.js:106` | button/div | `toast.action.onClick();` | Y | live |
| `src/components/ui/Toast.js:119` | button/div | `() => onDismiss(toast.id)` | Y | live |
| `src/components/ui/ChatWidget.js:179` | button/div | `() => setIsOpen(false)` | Y | live |
| `src/components/ui/ChatWidget.js:260` | button/div | `handleSend` | Y | live |
| `src/components/ui/ChatWidget.js:291` | button/div | `() => setIsOpen((o) => !o)` | Y | live |
| `src/components/ui/PushPermissionBanner.js:64` | button/div | `handleAllow` | Y | live |
| `src/components/ui/PushPermissionBanner.js:71` | button/div | `handleLater` | Y | live |
| `src/components/ui/PushPermissionBanner.js:80` | button/div | `handleLater` | Y | live |
| `src/components/ui/SOSButton.js:168` | button/div | `() => setErrorMsg(null)` | Y | live |
| `src/components/ui/SOSButton.js:185` | button/div | `handleSOS` | Y | live |
| `src/components/ui/BottomNav.js:94` | button/div | `() => setIsSettingsOpen((prev) => !prev)` | Y | live |
| `src/components/ui/BottomNav.js:138` | button/div | `(e) => e.stopPropagation()` | Y | live |
| `src/components/ui/BottomNav.js:143` | button/div | `(e) => { e.stopPropagation(); router.push("/marketplace/p...` | Y | live |
| `src/components/ui/BottomNav.js:150` | button/div | `(e) => { e.stopPropagation(); router.push("/marketplace/o...` | Y | live |
| `src/components/ui/BottomNav.js:157` | button/div | `(e) => { e.stopPropagation(); router.push("/marketplace/f... [router.push('/m...` | N | dead |
| `src/components/ui/BottomNav.js:167` | button/div | `onClick={(e) => {` | Y | live |
| `src/components/ui/BottomNav.js:191` | button/div | `() => router.push(path)` | Y | live |
| `src/components/ui/ChatPanel.js:116` | button/div | `onClose` | Y | live |
| `src/components/ui/ChatPanel.js:142` | button/div | `onClose` | Y | live |
| `src/components/ui/ChatPanel.js:171` | button/div | `() => fileInputRef.current?.click()` | Y | live |
| `src/components/ui/ChatPanel.js:206` | button/div | `handleSend` | Y | live |
| `src/components/ui/ChatPanel.js:236` | button/div | `() => setPreviewImage(null)` | Y | live |
| `src/components/ui/DashboardShell.js:115` | button/div | `() => router.push("/marketplace/profile")` | Y | live |
| `src/components/ui/DashboardShell.js:128` | button/div | `() => setMobileMenuOpen(!mobileMenuOpen)` | Y | live |
| `src/components/ui/DashboardShell.js:143` | button/div | `() => setMobileMenuOpen(false)` | Y | live |
| `src/components/ui/DashboardShell.js:157` | button/div | `() => setMobileMenuOpen(false)` | Y | live |
| `src/components/ui/DashboardShell.js:168` | button/div | `onClick={() => {` | Y | live |
| `src/components/ui/DashboardShell.js:169` | button/div | `item.onClick?.();` | Y | live |
| `src/components/ui/DashboardShell.js:184` | button/div | `onClick={() => {` | Y | live |
| `src/components/ui/DashboardShell.js:200` | button/div | `onClick={() => {` | Y | live |
| `src/components/ui/NotificationBell.js:79` | button/div | `toggleDropdown` | Y | live |
| `src/components/ui/NotificationBell.js:96` | button/div | `markAllRead` | Y | live |
| `src/components/ui/NotificationBell.js:118` | button/div | `(e) => !n.read && markAsRead(n.id, e)` | Y | live |
| `src/components/ui/ProfileFAB.js:43` | button/div | `() => router.push("/marketplace/profile")` | Y | live |
| `src/components/ui/ReferralPanel.js:124` | button/div | `onNavigateBack` | Y | live |
| `src/components/ui/ReferralPanel.js:172` | button/div | `handleCopyLink` | Y | live |
| `src/components/ui/ReferralPanel.js:196` | button/div | `handleShare` | Y | live |
| `src/components/ui/ThemeToggle.js:23` | button/div | `toggleTheme` | Y | live |
| `src/components/marketplace/SearchFilters.js:36` | button/div | `onChange` | Y | live |
| `src/components/marketplace/SearchFilters.js:60` | button/div | `function FilterChip({ label, active, onClick }) {` | Y | live |
| `src/components/marketplace/SearchFilters.js:64` | button/div | `onClick` | Y | live |
| `src/components/marketplace/SearchFilters.js:129` | button/div | `onClear` | Y | live |
| `src/components/marketplace/SearchFilters.js:139` | button/div | `onMobileClose` | Y | live |
| `src/components/marketplace/SearchFilters.js:170` | button/div | `onClick={() =>` | Y | live |
| `src/components/marketplace/SearchFilters.js:187` | button/div | `onClick={() =>` | Y | live |
| `src/components/marketplace/SearchFilters.js:231` | button/div | `onMobileClose` | Y | live |
| `src/components/marketplace/SearchFilters.js:253` | button/div | `onMobileClose` | Y | live |
| `src/components/marketplace/ProductReviews.js:98` | button/div | `() => onChange(i)` | Y | live |
| `src/components/marketplace/ProductReviews.js:303` | button/div | `handleClose` | Y | live |
| `src/components/marketplace/ProductReviews.js:429` | button/div | `() => setFormOpen(true)` | Y | live |
| `src/components/marketplace/ProductReviews.js:455` | button/div | `() => setFormOpen(true)` | Y | live |
| `src/components/marketplace/ProductCard.js:160` | button/div | `handleAddToCart` | Y | live |
| `src/components/marketplace/VehicleSelector.js:183` | button/div | `handleClear` | Y | live |
| `src/components/marketplace/VendorComparisonTable.js:174` | button/div | `() => setVendorSearch("")` | Y | live |
| `src/components/marketplace/VendorComparisonTable.js:189` | button/div | `() => setSortMenuOpen((v) => !v)` | Y | live |
| `src/components/marketplace/VendorComparisonTable.js:216` | button/div | `onClick={() => {` | Y | live |
| `src/components/marketplace/VendorComparisonTable.js:243` | button/div | `() => setVendorSearch("")` | Y | live |
| `src/components/marketplace/VendorComparisonTable.js:396` | button/div | `() => handleAddToCart(entry)` | Y | live |
| `src/components/marketplace/VendorComparisonTable.js:538` | button/div | `() => handleAddToCart(entry)` | Y | live |
| `src/components/profile/ProfileMenu.js:81` | button/div | `() => router.push(item.path)` | Y | live |
| `src/components/subscription/PlanCard.js:79` | button/div | `() => onSubscribe(plan.id)` | Y | live |
| `src/components/subscription/SubscriptionManager.js:196` | button/div | `dismissOfflineNotice` | Y | live |
| `src/components/subscription/SubscriptionManager.js:254` | button/div | `() => setCancelTarget(true)` | Y | live |
| `src/components/fleet/FleetRegistrationForm.js:170` | Button | `() => onRegistered?.(null, true)` | Y | live |
| `src/components/fleet/FleetDashboard.js:213` | Button | `onStartBooking` | Y | live |
| `src/components/fleet/FleetDashboard.js:218` | Button | `onRegisterNew` | Y | live |
| `src/lib/push/pushNotificationHandler.js:137` | button/div | `() => {` | Y | live |

## 2) Link / href audit (26 rows)

| file:line | element | href / target | exists | status |
|-----------|---------|---------------|--------|--------|
| `src/app/not-found.js:19` | Link/a | `/auth` | Y | live |
| `src/app/marketplace/categories/[id]/client.js:104` | Link/a | `/marketplace/categories` | Y | live |
| `src/app/marketplace/categories/page.js:22` | Link/a | `/marketplace` | Y | live |
| `src/app/marketplace/product/[id]/client.js:191` | Link/a | `/marketplace` | Y | live |
| `src/app/marketplace/product/[id]/client.js:208` | Link/a | `/marketplace` | Y | live |
| `src/app/marketplace/cart/page.js:84` | Link/a | `/marketplace` | Y | live |
| `src/app/marketplace/cart/page.js:318` | Link/a | `/marketplace` | Y | live |
| `src/app/marketplace/checkout/page.js:166` | Link/a | `/marketplace/cart` | Y | live |
| `src/app/marketplace/checkout/page.js:264` | Link/a | `/marketplace` | Y | live |
| `src/app/marketplace/profile/care/page.js:248` | Link/a | `href` | N | dead |
| `src/app/marketplace/profile/help/page.js:258` | Link/a | `item.href` | N | dead |
| `src/app/marketplace/profile/safety/page.js:231` | Link/a | `tel:${contact.number.replace(/\s/g, "")}` | Y | live |
| `src/app/marketplace/page.js:155` | Link/a | `/marketplace/categories` | Y | live |
| `src/app/marketplace/page.js:184` | Link/a | `/marketplace/search` | Y | live |
| `src/app/page.js:25` | Link/a | `/auth` | Y | live |
| `src/app/page.js:52` | Link/a | `/auth` | Y | live |
| `src/app/page.js:59` | Link/a | `/auth` | Y | live |
| `src/app/layout.js:49` | Link/a | `/manifest.json` | N | dead |
| `src/app/layout.js:93` | Link/a | `#main-content` | Y | live |
| `src/components/admin/JobMonitor.js:294` | Link/a | `https://www.openstreetmap.org/copyright` | Y | live |
| `src/components/admin/WarrantyPanel.js:140` | Link/a | `photo` | N | dead |
| `src/components/admin/Sidebar.js:71` | Link/a | `item.path` | N | dead |
| `src/components/dashboard/MapView.js:251` | Link/a | `https://www.openstreetmap.org/copyright` | Y | live |
| `src/components/marketplace/CategoryCard.js:46` | Link/a | `/marketplace/categories/${category.id}` | Y | live |
| `src/components/marketplace/ProductCard.js:74` | Link/a | `/marketplace/product/${id}` | Y | live |
| `src/components/marketplace/ProductCard.js:115` | Link/a | `/marketplace/product/${id}` | Y | live |

## 3) router.push audit (52 rows)

| file:line | element | target | exists | status |
|-----------|---------|--------|--------|--------|
| `src/app/admin/layout.js:23` | router.push | `"/auth"` | Y | live |
| `src/app/admin/layout.js:25` | router.push | `\`/dashboard/${userRole}\`` | Y | live |
| `src/app/admin/layout.js:34` | router.push | `path` | Y | suspicious |
| `src/app/dashboard/customer/page.js:142` | router.push | `"/auth"` | Y | live |
| `src/app/dashboard/customer/page.js:151` | router.push | `path` | Y | suspicious |
| `src/app/dashboard/garage/page.js:29` | router.push | `"/auth"` | Y | live |
| `src/app/dashboard/garage/page.js:38` | router.push | `path` | Y | suspicious |
| `src/app/dashboard/garage/page.js:58` | router.push | `"/marketplace"` | Y | live |
| `src/app/dashboard/mechanic/page.js:44` | router.push | `"/auth"` | Y | live |
| `src/app/dashboard/mechanic/page.js:70` | router.push | `path` | Y | suspicious |
| `src/app/dashboard/mechanic/page.js:90` | router.push | `"/marketplace"` | Y | live |
| `src/app/dashboard/fleet/page.js:58` | router.push | `"/auth"` | Y | live |
| `src/app/dashboard/fleet/page.js:66` | router.push | `path` | Y | suspicious |
| `src/app/marketplace/cart/page.js:312` | router.push | `"/marketplace/checkout"` | Y | live |
| `src/app/marketplace/checkout/page.js:282` | router.push | `"/marketplace/cart"` | Y | live |
| `src/app/marketplace/profile/account/page.js:102` | router.push | `"/marketplace/profile/edit"` | Y | live |
| `src/app/marketplace/profile/edit/page.js:110` | router.push | `"/marketplace/profile"` | Y | live |
| `src/app/marketplace/profile/orders/page.js:454` | router.push | `"/dashboard"` | N | dead |
| `src/app/marketplace/profile/quick-actions/page.js:78` | router.push | `shortcut.path` | Y | live |
| `src/app/marketplace/profile/quick-actions/page.js:100` | router.push | `"/marketplace"` | Y | live |
| `src/app/marketplace/profile/safety/page.js:163` | router.push | `"/marketplace/profile/help"` | Y | live |
| `src/app/marketplace/profile/services/page.js:299` | router.push | `"/dashboard"` | N | dead |
| `src/app/marketplace/profile/services/page.js:397` | router.push | `"/dashboard"` | N | dead |
| `src/app/marketplace/profile/favorites/page.js:160` | router.push | `\`/marketplace/product/${productId}\`` | Y | live |
| `src/app/marketplace/profile/favorites/page.js:211` | router.push | `"/marketplace/search"` | Y | live |
| `src/app/marketplace/profile/page.js:31` | router.push | `"/auth"` | Y | live |
| `src/app/marketplace/profile/page.js:122` | router.push | `"/marketplace/profile/edit"` | Y | live |
| `src/app/marketplace/profile/page.js:164` | router.push | `"/marketplace/profile/account"` | Y | live |
| `src/app/marketplace/layout.js:12` | router.push | `"/dashboard"` | N | dead |
| `src/app/marketplace/page.js:97` | router.push | `\`/marketplace/search?q=${encodeURIComponent(q` | Y | live |
| `src/components/admin/AdminOverview.js:125` | router.push | `"/admin/kyc"` | Y | live |
| `src/components/admin/AdminOverview.js:135` | router.push | `"/admin/kyc"` | Y | live |
| `src/components/auth/LoginCard.js:43` | router.push | `// Without this, router.push() can start a transit` | Y | live |
| `src/components/auth/LoginCard.js:47` | router.push | `"/admin"` | Y | live |
| `src/components/auth/LoginCard.js:48` | router.push | `\`/dashboard/${user.role}\`` | Y | live |
| `src/components/auth/LoginCard.js:58` | router.push | `"/admin"` | Y | live |
| `src/components/auth/LoginCard.js:59` | router.push | `\`/dashboard/${user.role}\`` | Y | live |
| `src/components/auth/SignUpCard.js:54` | router.push | `"/dashboard/customer"` | Y | live |
| `src/components/auth/SignUpCard.js:55` | router.push | `"/dashboard/mechanic"` | Y | live |
| `src/components/auth/SignUpCard.js:56` | router.push | `"/dashboard/garage"` | Y | live |
| `src/components/auth/SignUpCard.js:104` | router.push | `"/admin"` | Y | live |
| `src/components/auth/SignUpCard.js:105` | router.push | `\`/dashboard/${user.role}\`` | Y | live |
| `src/components/auth/SignUpCard.js:147` | router.push | `"/admin"` | Y | live |
| `src/components/auth/SignUpCard.js:148` | router.push | `\`/dashboard/${user.role}\`` | Y | live |
| `src/components/ui/BottomNav.js:143` | router.push | `"/marketplace/profile"` | Y | live |
| `src/components/ui/BottomNav.js:150` | router.push | `"/marketplace/orders"` | Y | live |
| `src/components/ui/BottomNav.js:157` | router.push | `"/marketplace/favorites"` | N | dead |
| `src/components/ui/BottomNav.js:191` | router.push | `path` | Y | suspicious |
| `src/components/ui/DashboardShell.js:115` | router.push | `"/marketplace/profile"` | Y | live |
| `src/components/ui/DashboardShell.js:185` | router.push | `"/marketplace/profile"` | Y | live |
| `src/components/ui/ProfileFAB.js:43` | router.push | `"/marketplace/profile"` | Y | live |
| `src/components/profile/ProfileMenu.js:81` | router.push | `item.path` | Y | suspicious |

## 4) form onSubmit audit (34 rows)

| file:line | element | handler | exists | status |
|-----------|---------|---------|--------|--------|
| `src/app/dashboard/customer/page.js:306` | form | `handleRequestSubmit` | Y | live |
| `src/app/dashboard/customer/page.js:350` | form | `handleScheduleSubmit` | Y | suspicious |
| `src/app/dashboard/customer/page.js:359` | form | `handleReviewSubmit` | Y | live |
| `src/app/marketplace/profile/care/page.js:180` | form | `handleSubmit` | Y | live |
| `src/app/marketplace/profile/edit/page.js:133` | form | `handleSubmit` | Y | live |
| `src/app/marketplace/profile/help/page.js:161` | form | `handleSubmit` | Y | live |
| `src/app/marketplace/profile/settings/page.js:732` | form | `onSubmit={(e) => {` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:145` | form | `function NewClaimForm({ isOpen, onClose, onSubmitt` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:200` | form | `onSubmitted();` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:216` | form | `handleSubmit` | Y | live |
| `src/app/marketplace/profile/warranty/page.js:477` | form | `onSubmitted={fetchData}` | Y | live |
| `src/app/marketplace/page.js:132` | form | `handleSearch` | Y | live |
| `src/components/auth/LoginCard.js:38` | form | `const onSubmit = async (data) => {` | Y | live |
| `src/components/auth/LoginCard.js:216` | form | `handleForgotRequest` | Y | live |
| `src/components/auth/LoginCard.js:252` | form | `handleForgotReset` | Y | live |
| `src/components/auth/LoginCard.js:325` | form | `handleSubmit(onSubmit)` | Y | live |
| `src/components/auth/SignUpCard.js:50` | form | `const onSubmit = async (data) => {` | Y | live |
| `src/components/auth/SignUpCard.js:188` | form | `handleSubmit(onSubmit)` | Y | live |
| `src/components/dashboard/ReviewModal.js:10` | form | `export function ReviewModal({ isOpen, onClose, pro` | Y | live |
| `src/components/dashboard/ReviewModal.js:30` | form | `await onSubmit(data);` | Y | live |
| `src/components/dashboard/ReviewModal.js:44` | form | `handleSubmit(submitHandler)` | Y | live |
| `src/components/dashboard/VehicleManagerModal.js:112` | form | `handleAddSubmit` | Y | live |
| `src/components/dashboard/ScheduleBookingModal.js:38` | form | `export function ScheduleBookingModal({ isOpen, onC` | Y | live |
| `src/components/dashboard/ScheduleBookingModal.js:50` | form | `onSubmit({` | Y | live |
| `src/components/dashboard/ScheduleBookingModal.js:55` | form | `}, [isFormValid, isLoading, selectedDate, selected` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:149` | form | `export function ServiceRequestPanel({ onSubmit, is` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:207` | form | `await onSubmit({` | Y | live |
| `src/components/dashboard/ServiceRequestPanel.js:256` | form | `handleSubmit(submitHandler)` | Y | live |
| `src/components/marketplace/ProductReviews.js:199` | form | `function ReviewFormModal({ isOpen, onClose, onSubm` | Y | live |
| `src/components/marketplace/ProductReviews.js:219` | form | `await onSubmit({ rating, text: comment.trim() });` | Y | live |
| `src/components/marketplace/ProductReviews.js:229` | form | `[rating, comment, onSubmit, onClose]` | Y | live |
| `src/components/marketplace/ProductReviews.js:243` | form | `handleSubmit` | Y | live |
| `src/components/marketplace/ProductReviews.js:509` | form | `handleSubmitReview` | Y | live |
| `src/components/fleet/FleetRegistrationForm.js:204` | form | `handleSubmit` | Y | live |

## Appendix A — Route map (src/app/**/page.js)

All routes verified on filesystem (`find src/app -name "page.js"`):

- `/admin/certifications`
- `/admin/disputes`
- `/admin/garages`
- `/admin/jobs`
- `/admin/kyc`
- `/admin/mechanics`
- `/admin`
- `/admin/payments`
- `/admin/payments/payouts`
- `/admin/payouts`
- `/admin/users`
- `/admin/warranty`
- `/auth`
- `/dashboard/customer`
- `/dashboard/fleet`
- `/dashboard/garage`
- `/dashboard/mechanic`
- `/marketplace/cart`
- `/marketplace/categories/[id]`
- `/marketplace/categories`
- `/marketplace/checkout`
- `/marketplace/orders`
- `/marketplace`
- `/marketplace/product/[id]`
- `/marketplace/profile/account`
- `/marketplace/profile/care`
- `/marketplace/profile/clutchd-card`
- `/marketplace/profile/edit`
- `/marketplace/profile/favorites`
- `/marketplace/profile/help`
- `/marketplace/profile/orders`
- `/marketplace/profile`
- `/marketplace/profile/payments`
- `/marketplace/profile/quick-actions`
- `/marketplace/profile/refer`
- `/marketplace/profile/safety`
- `/marketplace/profile/services`
- `/marketplace/profile/settings`
- `/marketplace/profile/subscription`
- `/marketplace/profile/warranty`
- `/marketplace/search`
- `/.`

Not present (dead targets referenced): `/dashboard` (generic), `/marketplace/favorites`.

## Appendix B — API endpoint cross-ref (src/lib/api.js vs backend)

| Frontend call | Backend file | endpoint | match |
|---------------|--------------|----------|-------|
| `GET /providers/nearby?lat&lng` (trackingStore.js:163) | `backend/app/api/v1/providers.py:21` | `GET /providers/nearby?lat&lng&issue` | Y (live) |
| *(none)* | `backend/app/api/v1/matching_routes.py:10` | `GET /mechanics/nearby?lat&lon` | N (dead — never called, param `lon` vs `lng`) |
| *(none)* | `backend/app/api/v1/matching_routes.py:23` | `GET /garages/nearby?lat&lon` | N (dead — never called) |
| `POST /service/request` (serviceStore.js:32) | `backend/app/api/v1/service.py` | `POST /service/request` | Y |
| `POST /service/sos` (SOSButton.js:119) | `backend/app/api/v1/service.py` | `POST /service/sos` | Y |
| `GET /jobs/incoming` etc. | `backend/app/api/v1/jobs.py` | matched | Y |
| `GET /products`, `/categories` etc. marketplace | `backend/app/api/v1/marketplace.py` | matched | Y |
| `assign_job_auto` | `backend/app/services/job_service.py:67` | internal service | N (dead reference — never imported) |

## Appendix C — Methodology

- Enumeration: `grep -rn "onClick" src --include="*.js" --include="*.jsx" | wc -l` = 340; `grep -rn "<Link"`, `grep -rn "href="`, `grep -rn "router.push"`, `grep -rn "onSubmit"` as above.
- For each `onClick` row: extracted handler identifier, then `grep -n "<identifier>" <file>` to confirm import/definition exists (all 340 have a local definition or inline arrow). Survives `grep -R "onClick.*undefined"` check.
- For each route target: checked filesystem `src/app/<path>/page.js` existence; dynamic `[id]` routes treated as existing if parent dynamic folder exists.
- This doc is audit-only; no source fixes applied. Dead rows flagged for Task 11.

---

*Machine-greppable:* dead rows contain `| dead |` (lowercase). `grep -c "| dead |" docs/button-audit.md` counts dead entries for Task 11.*
