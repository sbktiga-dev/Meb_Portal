# Code Audit Report: Dashboard & Admin Panel
Date: 2026-07-08

## Severity Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 11 |
| HIGH | 23 |
| MEDIUM | 31 |
| LOW | 25 |
| INFO | 7 |
| **Total** | **97** |

---

## CRITICAL ISSUES

### C1. JWT Role Bypass in stats + posts API
- **Files**: `src/app/api/admin/stats/route.ts:16`, `src/app/api/admin/posts/route.ts:16,61,101`
- Reads `payload.role` from decoded JWT instead of querying DB. A demoted admin keeps admin access for up to 7 days until JWT expires. Other admin routes correctly use DB lookup.
- **Fix**: Replace JWT role check with `prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } })`.

### C2. Admin Self-Promotion / Role Escalation
- **File**: `src/app/api/admin/users/[id]/role/route.ts:23-24`
- No guard prevents an admin from changing their own role or promoting arbitrary users to ADMIN. Compromised admin can silently grant ADMIN to any account.
- **Fix**: Add `if (params.id === payload.userId) return 400` and optionally restrict ADMIN promotion.

### C3. Supplier & Manufacturer DELETE Endpoints Missing
- **Files**: `api/suppliers/[id]/route.ts`, `api/manufacturers/[id]/route.ts` — both only export GET+PUT
- Admin UI delete buttons call DELETE which returns 405. The UI optimistically removes rows while the data persists in the DB.
- **Fix**: Add DELETE handlers with ADMIN verification.

### C4. Schema Mismatch: premium Plan Not Declared
- **File**: `src/app/api/subscription/route.ts:53` vs `schema.prisma:571`
- Route accepts `'lite', 'pro', 'premium'` but schema declares `"lite" | "pro"` only.
- **Fix**: Either add `premium` to schema or remove from route.

### C5. Promotion POST Uses Denylist Instead of Allowlist
- **File**: `src/app/api/promotion/route.ts:47-48`
- Checks `user.role === 'CLIENT'` — any unexpected/null/undefined role passes the guard.
- **Fix**: Use allowlist: `!['USER','COMPANY','SUPPLIER','MANUFACTURER'].includes(user.role)`.

### C6. Unauthenticated Active-Promotions Leaks User Data
- **File**: `src/app/api/promotion/active/route.ts:6,28,36`
- Returns full `content` and `author.role` to unauthenticated visitors, exposing internal classification.
- **Fix**: Remove `role` from select; truncate `content` for public view.

### C7. 10 of 13 Admin Pages Lack Client-Side Role Guard
- **Files**: `admin/users`, `admin/feedback`, `admin/subscriptions`, `admin/promotion`, `admin/documents`, `admin/images`, `admin/companies`, `admin/suppliers`, `admin/manufacturers`, `admin/activity`
- Only 3 pages (dashboard, posts, monitoring) verify ADMIN role client-side. Middleware is the sole barrier on the other 10.
- **Fix**: Create `useAdminGuard()` hook; apply to every admin page.

### C8. Analytics Period Selector Is Cosmetic
- **File**: `src/app/dashboard/analytics/page.tsx:21-23,106-119`
- `period` state toggles but `useEffect` has empty deps `[]` — data never re-fetches.
- **Fix**: Add `period` to dependency array or implement client-side date filtering.

### C9. Analytics Shows All Users' Portfolio Items
- **File**: `src/app/dashboard/analytics/page.tsx:34,49`
- `/api/portfolio` returns all published items; analytics counts them all, not just current user's.
- **Fix**: Scope by `?userId=` or filter client-side.

### C10. Admin Can Ban Themselves
- **File**: `src/app/api/admin/users/[id]/ban/route.ts:17`
- No guard against `params.id === payload.userId`. Admin can lock themselves out.
- **Fix**: Add self-ban prevention check.

### C11. Banner PUT Lacks Position Validation
- **File**: `src/app/api/promotion/banners/[id]/route.ts:41`
- Create route validates position against `['feed','gallery','both']` but update route accepts any string.
- **Fix**: Add identical validation before the update.

---

## HIGH ISSUES

### H1. Server Error Hides Behind 200 OK
- **File**: `src/app/api/subscription/check/route.ts:57`
- Catch block returns `{ canPromote: false }` with status 200, masking real DB failures.
- **Fix**: Return `{ error: '...' }` with status 500.

### H2. Admin Cannot Delete Promotions
- **File**: `src/app/api/promotion/[id]/route.ts:63`
- DELETE only allows the owner. No admin override for removing spam.
- **Fix**: Add `&& user.role !== 'ADMIN'` to the condition.

### H3. Lite vs Pro Banner Limit Counting Is Inconsistent
- **File**: `src/app/api/promotion/banners/route.ts:38-43`
- Lite counts pending+active; pro counts created in last 7 days. Different criteria depending on endpoint called.
- **Fix**: Unify counting logic with shared constant.

### H4. Feedback IP Address Spoofable
- **File**: `src/app/api/feedback/route.ts:23`
- `x-forwarded-for` header is client-controllable; value stored raw in DB.
- **Fix**: Take only the first value, or use socket remote address.

### H5. Analytics Downloads Count Uses Paginated Length
- **File**: `src/app/dashboard/analytics/page.tsx:66`
- `.length` on paginated API response ≠ total count.
- **Fix**: Use `pagination.total` if API provides it.

### H6. Posts Page Auth/Data Fetch Race
- **File**: `src/app/admin/posts/page.tsx:38-69`
- Two useEffects fire simultaneously on mount — posts visible before redirect completes.
- **Fix**: Gate fetch behind `isAdmin` state flag.

### H7-H16. Nine Admin Pages Missing Client-Side Role Check
- **Files**: `admin/feedback`, `admin/subscriptions`, `admin/promotion`, `admin/documents`, `admin/images`, `admin/companies`, `admin/suppliers`, `admin/manufacturers`, `admin/activity`, `admin/monitoring`
- All rely solely on middleware + API-level checks.
- **Fix**: Add `/api/auth/me` verification on mount for each.

### H17. Admin Users API Unbounded Pagination
- **File**: `src/app/api/admin/users/route.ts:16-17`
- `limit=999999` dumps entire user table including emails and INNs.
- **Fix**: Clamp `page` >= 1, `limit` <= 100.

### H18. Role Change Not Logged to ActivityLog
- **File**: `src/app/api/admin/users/[id]/role/route.ts:5,23`
- `logActivity` imported but never called.
- **Fix**: Add `await logActivity(...)` after update.

### H19. Dashboard Post Count Stat Wrong
- **File**: `src/app/dashboard/page.tsx:62`
- Uses filtered array `.length` instead of `pagination.total`.
- **Fix**: Read from `postsData.pagination?.total`.

### H20. Followers Fetch Missing Auth Header
- **File**: `src/app/dashboard/page.tsx:71`
- One fetch inside `Promise.all` omits the Authorization header.
- **Fix**: Add token to that fetch call.

### H21. Documents Admin Page Calls Public Unauthenticated API
- **File**: `src/app/admin/documents/page.tsx:21`
- Fetches from `/api/documents` with zero auth. Any visitor can enumerate documents.
- **Fix**: Create admin-scoped documents endpoint.

### H22. Companies Admin Page Uses Two Public APIs
- **File**: `src/app/admin/companies/page.tsx:22-23`
- Both `/api/companies` and `/api/suppliers` are unauthenticated.
- **Fix**: Add auth or create admin routes.

### H23. Promotion Page Role Check Uses Denylist
- **File**: `src/app/dashboard/promotion/page.tsx:53`
- Same pattern as C5 — `role === 'CLIENT'` allows unexpected roles through.
- **Fix**: Switch to allowlist check.

---

## MEDIUM ISSUES

### Dashboard Pages

| # | File | Issue |
|---|------|-------|
| M1 | All dashboard pages | No ActivityLog for password/email change, subscription purchase, promotion creation |
| M2 | `analytics/page.tsx:69-70` | Followers/following counts depend on undocumented API response shape |
| M3 | `promotion/page.tsx:47-57` | Delete-account button calls non-existent `/api/user` DELETE |
| M4 | `settings/page.tsx:~95` | Profile save failure is silent — no error feedback |
| M5 | `tariffs/page.tsx` | Premium plan shown as "Pro" label |

### Dashboard API

| # | File | Issue |
|---|------|-------|
| M6 | `subscription/route.ts:7-41` | Auth boilerplate duplicated in both handlers (no shared helper) |
| M7 | `subscription/route.ts:60-62` | Subscription creation not logged |
| M8 | `subscription/[id]/route.ts:30-33` | Subscription cancellation not logged |
| M9 | `promotion/route.ts:82-91` | Promotion creation not logged |
| M10 | `promotion/[id]/route.ts:67` | Hard-deletes promotion — orphaning analytics/financial records |
| M11 | `promotion/[id]/route.ts:67` | No ActivityLog entry on deletion |
| M12 | `promotion/active/route.ts:15` | Malformed interests JSON silently ignored — attacker forces all banners |
| M13 | `promotion/active/route.ts:9` | `position` query param not validated against allowed values |
| M14 | `promotion/banners/route.ts:101-113` | Banner creation not logged |
| M15 | `promotion/banners/[id]/route.ts:28 vs 72` | Admin can DELETE but not PUT — asymmetric access |
| M16 | `feedback/route.ts:8-10` | No rate limiting; unlimited spam submissions |
| M17 | `feedback/route.ts:8` | No max length on message field |

### Admin Pages

| # | File | Issue |
|---|------|-------|
| M18 | `admin/page.tsx:97` | BigInt from raw SQL COUNT may lose precision |
| M19 | `admin/users/page.tsx:54-59` | Double API call on search — debounce fires fetchUsers AND setPage triggers it again |
| M20 | `admin/posts/page.tsx:38-47` | No loading gate during auth check — content flashes |
| M21 | `admin/posts/page.tsx:71-103` | Publish/hide/delete not logged to ActivityLog |
| M22 | `admin/feedback/page.tsx:40-46` | Delete proceeds without checking `res.ok` — optimistic UI lies on failure |
| M23 | `admin/subscriptions/page.tsx` | Subscription activation/deactivation not logged |
| M24 | `admin/promotion/page.tsx:76-93` | No subscription validation before approving promotion |
| M25 | `admin/promotion/page.tsx` | Promotion status changes not logged |
| M26 | `admin/images/page.tsx:33` | Listing fetches from public `/api/images` for admin page |

### Admin API

| # | File | Issue |
|---|------|-------|
| M27 | `admin/stats/route.ts:66-72` | SQLite-specific `date()` in raw SQL — not portable |
| M28 | `admin/posts/route.ts:81-84,117` | Publish toggle and deletion not logged |
| M29 | `admin/posts/route.ts:22-23` | Unbounded pagination parameters |
| M30 | `admin/feedback/route.ts:16-17` | Unbounded pagination |
| M31 | `admin/subscriptions/route.ts:53` | PATCH body validation incomplete — any status string accepted |

---

## LOW ISSUES

| # | File | Issue |
|---|------|-------|
| L1 | `dashboard/page.tsx` vs others | Inconsistent auth helpers — main page checks localStorage+cookies, others check only localStorage |
| L2 | `analytics/page.tsx:98` | Missing Sidebar component — inconsistent with other dashboard pages |
| L3 | `analytics/page.tsx:23-77` | No AbortController — state updates on unmounted component |
| L4 | `analytics/page.tsx:23` | Settings page uses AbortController but analytics doesn't |
| L5 | `subscription/route.ts:1` | `force-dynamic` export placed before imports (cosmetic) |
| L6 | `check/route.ts:28` | Banner limit fallback is `|| 1` while `banners/route.ts:60` uses `|| 2` |
| L7 | `check/route.ts:34-44` | Banner limit logic duplicated in `banners/route.ts:64-81` |
| L8 | `promotion/route.ts:62` | `duration` key lookup is fragile with string numbers |
| L9 | `promotion/active/route.ts:42` | `take: 5` always returns newest — no fair rotation |
| L10 | `promotion/banners/route.ts:12` | GET returns unbounded banner list — no pagination cap |
| L11 | `promotion/banners/[id]/route.ts:41` | PUT doesn't check banner status — can edit expired banners |
| L12 | `feedback/route.ts (API):12` | Error message for invalid type doesn't list valid values |
| L13 | `admin/page.tsx:75-88` | Transient server error triggers redirect to login |
| L14 | `admin/users/page.tsx:50` | Silent `catch {}` — no error feedback |
| L15 | `admin/users/[id]/ban/route.ts:17` | No existence check — raw Prisma error on bad ID |
| L16 | `admin/posts/route.ts:47,87,120` | Catch blocks swallow errors — no `console.error` |
| L17 | `admin/posts/route.ts:117` | Hard delete cascades to comments/likes |
| L18 | `admin/feedback/[id]/route.ts:15` | No existence check before delete |
| L19 | `admin/feedback/[id]/route.ts:15` | Feedback deletion not logged |
| L20 | `admin/subscriptions/route.ts:25-29` | GET returns unbounded result set — no pagination |
| L21 | `admin/subscriptions/route.ts` | Status changes not logged |
| L22 | `admin/activity/page.tsx:16-20` | Incomplete action labels for future action types |
| L23 | `admin/monitoring/page.tsx` | Memory reporting is heap-only, missing RSS |
| L24 | `admin/users/route.ts:36` | INN (tax ID) exposed in bulk listing unnecessarily |
| L25 | `promotion/[id]/route.ts:67` | Hard-deletes vs codebase norm of soft-delete |

---

## INFO

| # | File | Issue |
|---|------|-------|
| I1 | `middleware.ts:7-8,43-47` | Middleware only protects `/admin` — no role rules for dashboard sub-routes |
| I2 | `subscription/[id]/route.ts:23` | Owner check correct; no admin override needed for self-service cancel |
| I3 | `promotion/active/route.ts` | Public endpoint by design — but leaks role + full content |
| I4 | `monitoring API` | "Recent errors" filter only checks ban/delete actions, not app exceptions |
| I5 | `admin/monitoring/page.tsx:42-64` | Monitoring scope is useful but limited to table counts |
| I6 | `admin/page.tsx:75-88` | All errors redirect to login — should distinguish 401 from 500 |
| I7 | Cross-cutting | No shared `requireAuth()` helper — every route duplicates 8+ lines |

---

## PRIORITY FIX ORDER

### Phase 1 — Security (immediate)
1. Fix JWT role bypass in stats + posts API (C1)
2. Add self-promotion guard (C2)
3. Add `useAdminGuard()` hook to all 13 admin pages (C7)
4. Add DELETE handlers for suppliers + manufacturers (C3)
5. Fix allowlist role check in promotion POST (C5)

### Phase 2 — Data Integrity (this week)
6. Resolve premium plan schema mismatch (C4)
7. Fix banner position validation on PUT (C11)
8. Unify banner limit counting logic (H3)
9. Scope portfolio analytics to current user (C9)
10. Fix analytics period selector (C8)

### Phase 3 — Audit Trail (this sprint)
11. Add `logActivity()` to all mutation endpoints (M1, M7-M9, M11, M14, M21, M23, M25, M28)
12. Add `await` to existing `logActivity` calls (M28 in ban route)
13. Create shared `requireAuth()` helper (I7)

### Phase 4 — UX & Robustness (next sprint)
14. Fix admin pages that redirect on transient errors (L13)
15. Add error feedback to silent catch blocks (L14, L16)
16. Fix double-fetch in users search (M19)
17. Create `adminFetch()` utility with token expiry handling
18. Add rate limiting to feedback endpoint (M16)

---

## KEY PATTERNS TO ADDRESS

**Auth duplication**: Every route re-implements 8+ lines of token extraction. A single `requireAuth(request)` helper would eliminate drift risk.

**Activity logging gap**: `logActivity()` exists in `src/lib/activity.ts` but is called in only ~5 routes. The 97 identified issues include 17 endpoints where mutations go unlogged.

**Role check inconsistency**: Some routes use denylist (`role === 'CLIENT'`), others use allowlist (`role !== 'ADMIN'`). Standardize on one pattern.

**Banner limit logic**: Duplicated in 3 places with minor inconsistencies. Extract into shared module.

**Client-side admin guard**: Inconsistent across admin pages. Standardize with a reusable hook.
