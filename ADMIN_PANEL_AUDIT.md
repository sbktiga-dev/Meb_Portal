# Admin Panel Audit — 13 Pages + API Routes
Date: 2026-07-08

## Defense Architecture

- **Layer 1 — Middleware** (`src/middleware.ts:23-48`): Verifies JWT from cookie, checks `role === 'ADMIN'` for all `/admin/*` paths. Redirects non-admins to `/dashboard`.
- **Layer 2 — API routes**: Every `/api/admin/*` endpoint independently verifies Bearer token and ADMIN role via DB lookup.
- **Layer 3 — Client pages**: Varies per page (see below).

---

## 1. `src/app/admin/page.tsx` — Dashboard

### 1.1 — BigInt from raw SQL count
- **Lines**: 97
- **Severity**: MEDIUM
- **Problem**: `registrationsByDay` comes from a raw SQL `COUNT(*)` query. Depending on the database driver, count values may arrive as BigInt. `Number(r.count)` handles this in modern runtimes, but could lose precision on extremely large tables.
- **Fix**: Use `CAST(COUNT(*) AS INTEGER)` in the SQL or call `.toString()` before rendering.

### 1.2 — Transient error triggers logout
- **Lines**: 75-88
- **Severity**: LOW
- **Problem**: The `.catch(() => window.location.href = '/login')` catches ALL errors including server 500s. A valid admin hitting a temporary backend error gets redirected to login.
- **Fix**: Distinguish 401/403 (redirect) from other errors (show error message in UI).

---

## 2. `src/app/admin/users/page.tsx` — User Management

### 2.1 — Missing client-side role guard
- **Lines**: 30-58 (entire component)
- **Severity**: CRITICAL
- **Problem**: No `fetch('/api/auth/me')` call exists. The page calls the API immediately. If middleware is ever misconfigured (wrong matcher, edge function deployment issue), any authenticated user could access this page and see user emails, INNs, and manage roles/bans. Other admin pages (dashboard, posts) do have this check.
- **Fix**: Add the same `useEffect` pattern from `admin/page.tsx:67-73` to verify ADMIN role before rendering data.

### 2.2 — Double API call on search
- **Lines**: 54-59
- **Severity**: MEDIUM
- **Problem**: The search debounce `useEffect` (line 56-58) calls `setPage(1)` then `fetchUsers()`. The page state change triggers the other `useEffect` (line 54) which also calls `fetchUsers()`. Every search keystroke fires two identical API requests.
- **Fix**: Remove the explicit `fetchUsers()` call from the search effect. The `setPage(1)` already triggers re-fetch via the page effect.

### 2.3 — Silent error swallowing
- **Lines**: 50
- **Severity**: LOW
- **Problem**: `catch {}` block gives zero feedback when the users API fails.
- **Fix**: Show a toast or inline error state.

### 2.4 — ADMIN role change not logged
- **Lines**: 74-85 (handleRoleChange)
- **Severity**: LOW
- **Problem**: Changing a user's role has no ActivityLog entry on the frontend side. The API at `api/admin/users/[id]/role/route.ts` also does not call `logActivity()`. Compare with ban action which does log.
- **Fix**: Add `logActivity({ action: 'role_change', ... })` in the API route.

---

## 3. `src/app/admin/posts/page.tsx` — Post Moderation

### 3.1 — Auth check and data fetch race
- **Lines**: 38-47 and 49-69
- **Severity**: HIGH
- **Problem**: Two `useEffect` hooks run on mount. The first checks auth and redirects non-admins. The second fetches posts. Both fire simultaneously. A non-admin will briefly see post data in the DOM before the redirect completes.
- **Fix**: Gate the posts fetch behind an `isAdmin` state flag. Only fetch after auth confirmation.

### 3.2 — No loading state during auth check
- **Lines**: 38-47
- **Severity**: MEDIUM
- **Problem**: There is no `isAuthChecked` state. The posts table renders immediately while auth is still pending. If the auth check is slow, the page flashes content before redirecting.
- **Fix**: Add an auth-check loading gate similar to the dashboard page's `loading` state.

### 3.3 — No activity logging for moderation actions
- **Lines**: 71-103
- **Severity**: MEDIUM
- **Problem**: Publishing, hiding, and deleting posts are significant admin actions that leave no trace in the ActivityLog. The API routes (`api/admin/posts/route.ts` PATCH and DELETE) also lack `logActivity()` calls.
- **Fix**: Add logging in the PATCH and DELETE handlers of `api/admin/posts/route.ts`.

---

## 4. `src/app/admin/feedback/page.tsx` — Feedback Management

### 4.1 — Missing client-side role guard
- **Lines**: 16-36
- **Severity**: HIGH
- **Problem**: Same issue as users page — no `/api/auth/me` check. Relies entirely on middleware and API-level protection.
- **Fix**: Add admin role verification on component mount.

### 4.2 — Delete proceeds without checking API response
- **Lines**: 40-46
- **Severity**: MEDIUM
- **Problem**: `handleDelete` calls the API and immediately updates local state (`setFeedbacks` filter, `setTotal` decrement) without verifying `res.ok`. If the delete fails (e.g., network error, 500), the UI shows the item as deleted while it still exists.
- **Fix**: Check `res.ok` before updating local state; show error toast on failure.

### 4.3 — Feedback deletion not logged
- **Lines**: `api/admin/feedback/[id]/route.ts:15`
- **Severity**: LOW
- **Problem**: No `logActivity()` call when feedback is deleted.
- **Fix**: Add activity log entry.

---

## 5. `src/app/admin/subscriptions/page.tsx` — Subscription Management

### 5.1 — Missing client-side role guard
- **Lines**: 24-42
- **Severity**: HIGH
- **Problem**: No `/api/auth/me` check. Redirects to login only if token is absent from localStorage, not if the user is non-admin.
- **Fix**: Add role verification on mount.

### 5.2 — Subscription activation/deactivation not logged
- **Lines**: `api/admin/subscriptions/route.ts:73-78`
- **Severity**: MEDIUM
- **Problem**: Toggling subscription status (a financially significant action) creates no ActivityLog entry.
- **Fix**: Add `logActivity({ action: 'subscription_change', ... })` in the PATCH handler.

---

## 6. `src/app/admin/promotion/page.tsx` — Promotion & Banners

### 6.1 — Missing client-side role guard
- **Lines**: 41-68
- **Severity**: HIGH
- **Problem**: No `/api/auth/me` check on mount. The `loadData` function redirects to `/dashboard` only if the API returns non-OK (line 59), which happens after the page has already attempted to render.
- **Fix**: Verify admin role before rendering.

### 6.2 — No subscription validation for promotion approval
- **Lines**: 76-93
- **Severity**: MEDIUM
- **Problem**: Admins can activate promotions for any user regardless of whether the user has an active subscription. There is no check that the requesting user has a valid plan before approving their promotion.
- **Fix**: In the PATCH handler, verify the promotion's user has an active subscription before setting status to 'active'.

### 6.3 — Promotion status change not logged
- **Lines**: `api/admin/promotion/route.ts:80-121`
- **Severity**: MEDIUM
- **Problem**: Activating or deactivating promotions and banners creates no ActivityLog entry.
- **Fix**: Add logging in both the promotion and banner update paths.

---

## 7. `src/app/admin/documents/page.tsx` — Documents

### 7.1 — Missing client-side role guard
- **Lines**: 17-26
- **Severity**: HIGH
- **Problem**: Only checks for token existence, not ADMIN role. The API (`/api/documents`) is a public endpoint with no auth at all — any visitor can fetch documents. The admin page fetches from this public route, meaning the token check is purely cosmetic.
- **Fix**: Add `/api/auth/me` check; consider creating a dedicated `/api/admin/documents` endpoint with admin verification.

### 7.2 — Calls a public unauthenticated API
- **Lines**: 21
- **Severity**: HIGH
- **Problem**: `fetch('/api/documents?limit=100')` hits the public documents endpoint which has zero auth. An attacker doesn't even need a valid token to enumerate all documents.
- **Fix**: Create an admin-specific documents API route or add auth to the existing route.

### 7.3 — Read-only page with no admin actions
- **Lines**: entire file
- **Severity**: LOW
- **Problem**: The page only displays documents with no ability to delete, edit, or manage them. It's effectively a dashboard widget, not an admin management page.
- **Fix**: Add edit/delete capabilities or reduce the page to a stats card.

---

## 8. `src/app/admin/images/page.tsx` — Image Management

### 8.1 — Missing client-side role guard
- **Lines**: 28-39
- **Severity**: HIGH
- **Problem**: Only checks token existence. No ADMIN role verification. The listing API (`/api/images`) is public and unauthenticated.
- **Fix**: Add `/api/auth/me` check. The write operations (upload, PATCH, DELETE) do have admin checks in their API routes.

### 8.2 — Image listing from public API
- **Lines**: 33
- **Severity**: MEDIUM
- **Problem**: `fetch('/api/images?limit=100')` uses the public images endpoint. No privacy concern per se (images are public), but the admin page should use an admin-scoped endpoint for consistency.
- **Fix**: Optional — create `/api/admin/images` route for consistency.

---

## 9. `src/app/admin/companies/page.tsx` — Company Management

### 9.1 — Missing client-side role guard
- **Lines**: 17-32
- **Severity**: HIGH
- **Problem**: Only checks token. No role verification. Both `/api/companies` and `/api/suppliers` are public unauthenticated endpoints.
- **Fix**: Add admin role check on mount.

### 9.2 — Fetches from two public unauthenticated APIs
- **Lines**: 22-23
- **Severity**: HIGH
- **Problem**: `fetch('/api/companies?limit=100')` and `fetch('/api/suppliers?limit=100')` hit public endpoints. Any visitor can enumerate all companies and suppliers.
- **Fix**: Either add auth to these endpoints or create admin-specific versions.

### 9.3 — Read-only with no management actions
- **Lines**: entire file
- **Severity**: LOW
- **Problem**: Cannot verify, ban, or manage companies from this page. The `isVerified` status is displayed but not toggleable.
- **Fix**: Add verify/unverify toggle functionality.

---

## 10. `src/app/admin/suppliers/page.tsx` — Supplier Management

### 10.1 — Missing client-side role guard
- **Lines**: 25-38
- **Severity**: HIGH
- **Problem**: `fetchSuppliers` only checks token existence. No ADMIN role verification.
- **Fix**: Add role check on mount.

### 10.2 — Delete API endpoint missing
- **Lines**: 67-73
- **Severity**: **CRITICAL**
- **Problem**: `handleDelete` calls `DELETE /api/suppliers/${id}` but `src/app/api/suppliers/[id]/route.ts` only exports GET and PUT — there is no DELETE handler. This means the delete button silently does nothing (405 Method Not Allowed). The UI then optimistically removes the row from the list while the supplier still exists in the database.
- **Fix**: Add a DELETE handler to `api/suppliers/[id]/route.ts` with ADMIN role verification and activity logging.

### 10.3 — Optimistic UI without API confirmation
- **Lines**: 71-72
- **Severity**: MEDIUM
- **Problem**: After calling DELETE, `fetchSuppliers()` re-fetches without checking `res.ok` first. If the DELETE fails (which it always will due to missing endpoint), the re-fetch just shows the supplier again, creating a flash effect.
- **Fix**: Check response status before updating UI.

---

## 11. `src/app/admin/manufacturers/page.tsx` — Manufacturer Management

### 11.1 — Missing client-side role guard
- **Lines**: 25-38
- **Severity**: HIGH
- **Problem**: Same as suppliers — no ADMIN role check on the client side.
- **Fix**: Add role check on mount.

### 11.2 — Delete API endpoint missing
- **Lines**: 67-73
- **Severity**: **CRITICAL**
- **Problem**: Identical to suppliers — `handleDelete` calls `DELETE /api/manufacturers/${id}` but `src/app/api/manufacturers/[id]/route.ts` only exports GET and PUT. The delete button is non-functional.
- **Fix**: Add a DELETE handler to `api/manufacturers/[id]/route.ts` with ADMIN verification.

### 11.3 — "geometry" field name mismatch
- **Lines**: 21, 99
- **Severity**: MEDIUM
- **Problem**: The form field is called `geometry` but the database schema field is likely `geometry` (based on the PUT handler at `api/manufacturers/[id]/route.ts:60`). The `handleCreate` sends `geometry` in the body but the POST handler at `api/manufacturers/route.ts:90` receives it as `geometry`. This appears consistent but the naming is confusing — `geometry` vs `geography`. Verify the Prisma schema field name matches.
- **Fix**: Confirm schema field name; rename form field if there's a mismatch.

---

## 12. `src/app/admin/monitoring/page.tsx` — System Monitoring

### 12.1 — Missing client-side role guard
- **Lines**: 20-28
- **Severity**: HIGH
- **Problem**: Only checks token existence. No ADMIN role verification on the client side.
- **Fix**: Add role check on mount.

### 12.2 — Monitoring data is useful but limited
- **Lines**: 42-64
- **Severity**: INFO
- **Problem**: DB stats show table counts. Uptime, memory, and Node version are helpful. However, "recent errors" filter (line 31 of API) only looks at `ban`, `user_delete`, `post_delete` actions — real application errors (unhandled exceptions, API failures) are not captured.
- **Fix**: Consider a separate error tracking mechanism or capture thrown exceptions in activity log.

### 12.3 — Memory reporting is heap-only
- **Lines**: `api/admin/monitoring/route.ts:29,40`
- **Severity**: LOW
- **Problem**: `process.memoryUsage()` returns `heapUsed` and `heapTotal`, but the total system memory (RSS) is not reported. For containerized deployments, heap limits may differ from actual memory consumption.
- **Fix**: Also report `rss` from `process.memoryUsage()`.

---

## 13. `src/app/admin/activity/page.tsx` — Activity Log

### 13.1 — Missing client-side role guard
- **Lines**: 22-42
- **Severity**: HIGH
- **Problem**: No `/api/auth/me` check. Relies on middleware + API protection only.
- **Fix**: Add admin verification on mount.

### 13.2 — Incomplete action labels
- **Lines**: 16-20
- **Severity**: LOW
- **Problem**: `actionLabels` maps 10 actions, but the codebase creates other actions (e.g., `subscription_change`, `promotion_activate`, `feedback_delete` are not yet logged but will be). New action types will show raw strings.
- **Fix**: Make the label map exhaustive or fall back gracefully (already does via `actionLabels[log.action] || log.action`).

---

## Cross-Cutting Issues (Affecting Multiple Pages)

### X.1 — Inconsistent auth check patterns across all admin pages
- **Severity**: CRITICAL
- **Problem**: Only 3 of 13 pages (dashboard, posts, monitoring) do client-side ADMIN role verification. The other 10 pages rely solely on middleware + API checks. While the API layer is solid, the inconsistent client-side approach means:
  - Non-admin users see the page shell and loading spinners before API rejection
  - If middleware is bypassed, the client does nothing to stop access
  - Different error UX: some pages redirect, some show empty data, some show 403 errors
- **Fix**: Standardize a `useAdminGuard()` hook that all admin pages call on mount.

### X.2 — No centralized admin API wrapper
- **Severity**: MEDIUM
- **Problem**: Every page independently reads `localStorage.getItem('token')` and constructs `Authorization: Bearer ${token}` headers. Token expiration is never handled — if the token expires mid-session, all API calls silently fail with 401s and the page shows empty data.
- **Fix**: Create a shared `adminFetch()` utility that handles token retrieval, auth headers, and 401 redirects automatically.

### X.3 — Activity logging coverage is incomplete
- **Severity**: MEDIUM
- **Problem**: Only 2 of 13 admin flows log to ActivityLog:
  - User ban (via `api/admin/users/[id]/ban/route.ts`)
  - User role change endpoint exists but `logActivity()` is NOT called in `api/admin/users/[id]/role/route.ts`
  
  Missing logging for: post moderation, feedback deletion, subscription changes, promotion/banner activation, supplier/manufacturer create/delete, image upload/edit/delete.
- **Fix**: Add `logActivity()` to every mutation endpoint under `/api/admin/`.

### X.4 — Supplier and manufacturer DELETE endpoints entirely absent
- **Severity**: CRITICAL
- **Problem**: Both `api/suppliers/[id]/route.ts` and `api/manufacturers/[id]/route.ts` only export GET and PUT. The admin UI calls DELETE which returns 405. Admins cannot actually delete these entities despite the UI showing a delete button.
- **Fix**: Add DELETE handlers with ADMIN verification and activity logging.

### X.5 — No middleware for public API routes used by admin
- **Severity**: MEDIUM
- **Problem**: Several public APIs (`/api/documents`, `/api/images`, `/api/companies`, `/api/suppliers`, `/api/manufacturers`) are used by admin pages but have no authentication on their GET endpoints. While this is by design for public browsing, it means admin pages for documents and companies fetch data from completely unauthenticated sources.
- **Fix**: Low priority — public data is intentionally public. But for consistency, admin management pages could use admin-scoped routes.

---

## Summary by Severity

| Severity | Count | Key Items |
|----------|-------|-----------|
| CRITICAL | 4 | Users page missing role guard; Supplier/Manufacturer DELETE endpoints missing; Inconsistent auth patterns |
| HIGH | 10 | 8 pages missing client-side role checks; Documents/Companies use public APIs; Posts page race condition |
| MEDIUM | 10 | Double-fetch bug; Missing activity logging; No token expiry handling; Subscription validation gap |
| LOW | 8 | Silent error swallowing; Read-only admin pages; Memory reporting; Incomplete labels |
| INFO | 2 | Monitoring scope; Read-only pages |

## Priority Fix Order

1. **Add DELETE handlers** for suppliers and manufacturers (CRITICAL — features are broken)
2. **Create `useAdminGuard` hook** and apply to all 13 pages (CRITICAL — defense in depth)
3. **Fix double-fetch** in users page search (MEDIUM — performance)
4. **Add activity logging** to all admin mutation endpoints (MEDIUM — auditability)
5. **Create shared `adminFetch` utility** (MEDIUM — token expiry handling)
6. **Gate posts page data fetch** behind auth confirmation (HIGH — data exposure window)
