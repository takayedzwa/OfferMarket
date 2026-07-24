# Admin Role QA Report — OfferMarket Platform

**Date**: 2026-07-17  
**Role**: Admin (ADMIN)  
**Methodology**: Static code analysis tracing all admin-facing workflows end-to-end through controllers, services, DTOs, guards, and frontend pages.

---

## 1. Processes Tested

| # | Workflow | Controller | Service | Frontend |
|---|----------|-----------|---------|----------|
| 1 | Dashboard statistics | `AdminController.getDashboardStats` | `AdminService.getDashboardStats` | `/admin/page.tsx` |
| 2 | User listing/filtering | `AdminController.getUsers` | `AdminService.getUsers` | `/admin/users/page.tsx` |
| 3 | User detail view | `AdminController.getUserById` | `AdminService.getUserById` | `/admin/users/[id]/page.tsx` |
| 4 | User suspend/ban/restore | `AdminController.suspendUser/banUser/restoreUser` | `AdminService` | `/admin/users/page.tsx` |
| 5 | Employer verification queue | `AdminController.getVerificationQueue` | `AdminService` | `/admin/verifications/page.tsx` |
| 6 | Employer verify/reject | `AdminController.verifyEmployer/rejectEmployer` | `AdminService` | `/admin/employers/[id]/page.tsx` |
| 7 | Employer listing | `AdminController.getEmployers` | Direct Prisma | `/admin/employers/page.tsx` |
| 8 | Platform settings | `AdminController.getSettings/updateSetting` | `AdminService` | `/admin/settings/page.tsx` |
| 9 | Audit logs | `AdminController.getAuditLogs/getAdminActions` | `AdminService` | `/admin/audit-logs/page.tsx` |
| 10 | Offer monitoring | `AdminController.getAllOffers/getOfferById` | `AdminService` | `/admin/offers/page.tsx` |
| 11 | Billing admin | `BillingController` (admin/*) | `BillingService` | `/admin/billing/page.tsx` |
| 12 | Trust & fraud | `TrustController` (review, suspicious activity, fraud, duplicates, blacklist, reputation) | `TrustService` | (no dedicated frontend page found) |
| 13 | Ratings admin (flag/unflag/publish) | `RatingsController` (admin endpoints) | `RatingsService` | (no dedicated frontend page found) |
| 14 | Privacy admin | `PrivacyController` (admin/*) | `PrivacyService` | (no dedicated frontend page found) |
| 15 | DSA admin | `DsaController` (admin/*) | `DsaService` | `/admin/reports/page.tsx` |
| 16 | Support ticket management | `SupportController` | `SupportService` | (no dedicated admin frontend page found) |
| 17 | Admin/support registration | `AuthController.registerAdmin/registerSupport` | `AuthService` | (no dedicated page) |
| 18 | Billing settings update | `BillingController.updateBillingSetting` | `BillingService` | `/admin/settings/page.tsx` |

---

## 2. Expected vs. Actual Behavior

### 2.1 Dashboard Statistics

**Expected**: Dashboard shows platform metrics (total users, workers, employers, pending verifications, active offers, revenue).

**Actual**: `totalCredits` from `employer.aggregate({ _sum: { creditBalance: true } })` is labeled as `totalRevenue`. The sum of all employer credit balances is not revenue — it is outstanding credit. This is misleading.

### 2.2 User Suspend/Ban/Restore

**Expected**: Admins cannot suspend/ban other admins, but can restore anyone.

**Actual**: `suspendUser` and `banUser` correctly block ADMIN targets. However, `restoreUser` does **not** check whether the target is an ADMIN. While this is not strictly a bug (restoring a previously suspended admin is valid), there is no confirmation or extra safeguard for restoring an admin.

**Expected**: Suspend/ban actions are audit-logged.

**Actual**: Yes, `adminAction` records are created. However, the `restoreUser` action does **not** include the `reason` field even though one is not accepted from the controller.

### 2.3 Employer Verification

**Expected**: Only PENDING employers can be verified or rejected; already-verified or rejected employers should not be re-processable without proper state transitions.

**Actual**: There is **no status check** in `verifyEmployer` or `rejectEmployer`. An admin can verify a REJECTED or already-BASIC_VERIFIED employer, overwriting the previous state without traceability.

### 2.4 Platform Settings

**Expected**: Setting values should be type-checked and validated.

**Actual**: `UpdateSettingsDto` has `value: any` with only `@IsObject()`. An admin can set any value (string, number, nested object) for any key, including keys that don't exist yet. There is no validation of setting key names or expected value types. Critical settings like `introduction_fee_cents` could be set to negative values or non-numeric types.

### 2.5 Admin Employers Endpoint

**Expected**: Controller delegates to service for data access.

**Actual**: `AdminController.getEmployers` and `getEmployer` bypass the service layer and directly access `this.adminService['prisma']`, accessing a private property. This violates encapsulation and makes the controller harder to test.

### 2.6 Trust & Fraud Endpoints

**Expected**: All trust review/admin endpoints should require ADMIN or SUPPORT authorization.

**Actual**: Several endpoints lack authentication guards entirely:
- `GET /trust/employers/:employerId/verification` — **no auth guard**
- `POST /trust/suspicious-activity` — **no auth guard**
- `POST /trust/detect/suspicious-login` — **no auth guard**
- `POST /trust/detect/rapid-account-creation` — **no auth guard**
- `GET /trust/blacklist/check/:entityType/:entityId` — **no auth guard**
- `POST /trust/reputation/calculate` — **no auth guard**
- `GET /trust/reputation/employer/:employerId` — **no auth guard**
- `GET /trust/reputation/worker/:workerId` — **no auth guard**
- `GET /trust/score/:entityType/:entityId` — **no auth guard**

### 2.7 Ratings Admin

**Expected**: Admin actions should be logged with the admin's identity from the JWT token.

**Actual**: `flagRating` takes `adminUserId` from `@Query('userId')` — a query parameter, not the JWT. An admin could impersonate another admin. `unflagRating` takes **no** admin ID at all, so there is zero audit trail for who unflagged a rating. `toggleRatingPublication` also has no admin audit trail.

### 2.8 Admin Registration

**Expected**: Only authenticated admins should be able to create support users.

**Actual**: `POST /auth/register/support` has **no auth guard**. It accepts `adminUserId` from the request body and looks up whether that user is an admin, but anyone who knows an admin's user ID can create a support account. The endpoint should require JwtAuthGuard + AdminGuard and extract the admin's ID from `req.user`.

### 2.9 Billing Admin Settings

**Expected**: Billing settings updates should use a validated DTO.

**Actual**: `PATCH /billing/admin/settings` uses `@Body() body: { key: string; value: any }` with no DTO class. No validation is applied. An admin could set `introduction_fee_cents` to a string, negative number, or empty value.

### 2.10 DSA Complaint Submission

**Expected**: Complaints should capture the user's email properly.

**Actual**: `submitComplaint` uses `req.user?.email || dto.contentReportId || ''` as the email fallback, which makes no sense — `contentReportId` is not an email.

### 2.11 Content Report Status Transitions

**Expected**: Reports should follow a defined state machine (RECEIVED → ASSESSMENT → ACTION_TAKEN → RESOLVED).

**Actual**: No status transition validation exists. An admin can resolve a report that is still in RECEIVED status, or take action on an already-resolved report.

### 2.12 Support Offer Expiry Extension

**Expected**: Days parameter should be validated to be positive and reasonable.

**Actual**: `extendOfferExpiry` accepts any `days` number with no validation. A support user could extend an offer by -1 days (moving expiry into the past) or by 99999 days.

### 2.13 User Detail Endpoint Exposes Sensitive Data

**Expected**: The admin user detail endpoint should exclude password hashes and other sensitive fields.

**Actual**: `AdminService.getUserById` includes full `worker`, `employer`, `notifications` relations but does **not** explicitly exclude `passwordHash`, `twoFactorSecret`, or other sensitive fields from the User model. While Prisma may not include these if not in `include`, the User model fields are all returned by default since `findUnique` returns all scalar fields. The password hash and two-factor secret would be exposed in the API response.

### 2.14 Duplicate Account Review

**Expected**: Confirmed duplicates should suspend the suspected account and log the admin action.

**Actual**: The account is suspended, but the suspicious activity creation uses `entityId: 'USER'` (a string literal instead of the actual user ID), and no `adminAction` record is created.

---

## 3. Errors and Issues Found

### CRITICAL (3)

**A-C1: Unauthenticated Trust Endpoints (IDOR)**  
Multiple `/trust/*` endpoints lack authentication guards. Anyone can check blacklist status, calculate reputation scores, report suspicious activity, and detect rapid account creation. This exposes internal fraud detection systems and could be used for reconnaissance.
- Files: `trust.controller.ts` lines 51, 112-115, 296-298, 304-306, 325-329, 341-346

**A-C2: Unauthenticated Support User Creation**  
`POST /auth/register/support` has no auth guard. Anyone who knows an admin's user ID can create a support account with SUPPORT role privileges.
- File: `auth.controller.ts` line 72, `auth.service.ts` lines 138-186

**A-C3: Sensitive Data Exposure in Admin User Detail**  
`GET /admin/users/:id` returns the full user object including `passwordHash` and `twoFactorSecret` because `findUnique` returns all scalar fields by default.
- File: `admin.service.ts` lines 91-128

### HIGH (6)

**A-H1: Missing Employer Verification State Guards**  
`verifyEmployer` and `rejectEmployer` do not check if the employer is in PENDING status. An admin can re-verify an already-verified or already-rejected employer, overwriting the previous state.
- File: `admin.service.ts` lines 247-307

**A-H2: Admin Flag/Unflag Ratings with Wrong Audit Trail**  
`flagRating` takes admin ID from a query parameter (impersonation possible). `unflagRating` and `toggleRatingPublication` have no admin audit trail at all.
- File: `ratings.controller.ts` lines 147-151, 158-162, 168-175; `ratings.service.ts` lines 585-610

**A-H3: No DTO Validation on Billing Admin Settings Update**  
`PATCH /billing/admin/settings` uses an inline body type with no validation class, allowing arbitrary key/value pairs.
- File: `billing.controller.ts` lines 107-112

**A-H4: No DTO Validation on Admin Employer Verify/Reject**  
The controller uses `@Body('notes')` and `@Body('reason')` directly without a DTO class. The existing `VerifyEmployerDto` is defined but unused.
- File: `admin.controller.ts` lines 141-154

**A-H5: Content Report Status Transition Enforcement Missing**  
Admins can resolve, escalate, or take action on reports in any status without state machine validation.
- File: `dsa.service.ts` lines 260-286, 292-306

**A-H6: DSA Complaint Email Fallback Uses contentReportId**  
`submitComplaint` uses `dto.contentReportId` as email fallback, which is incorrect.
- File: `dsa.controller.ts` line 244

### MEDIUM (8)

**A-M1: Direct Prisma Access from Controller**  
`AdminController.getEmployers` and `getEmployer` access `this.adminService['prisma']` directly, breaking encapsulation.
- File: `admin.controller.ts` lines 76-128

**A-M2: No Pagination Limit Validation**  
Most admin endpoints accept `page` and `limit` as string query params parsed with `parseInt()` but with no bounds checking. A client could set `limit=10000` to fetch an unreasonably large result set.
- Files: `admin.controller.ts`, `billing.controller.ts`, `privacy.controller.ts`, `dsa.controller.ts`

**A-M3: Support Offer Expiry Extension Has No Input Validation**  
`extendOfferExpiry` accepts any number of days including negative values.
- File: `support.service.ts` lines 434-463

**A-M4: updateBreach Accepts Arbitrary DTO**  
`PrivacyService.updateBreach` passes the entire DTO directly to `prisma.dataBreach.update`, enabling mass assignment. Any field in the breach record could be overwritten.
- File: `privacy.service.ts` lines 1182-1190

**A-M5: Duplicate Account Review Logs Wrong entityId**  
When confirming a duplicate account, the suspicious activity record uses `entityId: 'USER'` (string literal) instead of the actual `suspectedUserId`.
- File: `trust.service.ts` line 653

**A-M6: Settings Update Has No Old-Value Audit**  
When an admin updates a setting, the audit log records the new key and value but not the previous value, making it impossible to determine what changed.
- File: `admin.service.ts` lines 330-358

**A-M7: No Validation on DSA Transparency Report Date Range**  
`generateTransparencyReport` accepts raw date strings with no format validation. Invalid dates would cause a Prisma error.
- File: `dsa.controller.ts` lines 370-376

**A-M8: Ticket Number Race Condition**  
`createTicket` uses `count + 1` for ticket numbering without a transaction, creating a race condition where concurrent ticket creation could produce duplicate ticket numbers.
- File: `support.service.ts` lines 109-111

### LOW (6)

**A-L1: restoreUser Does Not Check ADMIN Role**  
While `suspendUser` and `banUser` block ADMIN targets, `restoreUser` allows restoring any user including admins, though this is arguably valid behavior.

**A-L2: Dashboard "totalCredits" Labeled "totalRevenue"**  
The `totalCredits` field sums employer `creditBalance` which represents outstanding credits, not revenue.
- File: `admin.service.ts` lines 27-39

**A-L3: Admin Pages Use Raw fetch() Instead of Centralized API Client**  
The frontend admin pages make direct `fetch()` calls rather than using the centralized `api` axios instance, leading to duplicated auth header logic and inconsistent error handling.
- Files: `/admin/page.tsx`, `/admin/users/page.tsx`

**A-L4: No Client-Side Admin Role Check**  
Frontend admin pages check for authentication token but do not verify the user's role is ADMIN before rendering admin functionality.

**A-L5: Missing Frontend Admin Pages**  
Several backend admin modules (trust/fraud, privacy admin, DSA admin, support) have no corresponding frontend pages in `/admin/`.

**A-L6: Audit Logs Query Doesn't Filter by adminId**  
The `getAuditLogs` method does not support filtering by `adminId` even though the schema likely supports it through `adminAction`.

---

## 4. Gaps, Risks, and Edge Cases

### Security Gaps

- **IDOR on ratings admin endpoints**: The `flagRating` endpoint accepts `userId` from query params instead of extracting it from the JWT token.
- **Mass assignment on settings/billing/privacy**: Multiple endpoints accept arbitrary key-value pairs without whitelisting allowed keys or validating value types.
- **No rate limiting on admin endpoints**: Unlike auth endpoints that use `@Throttle()`, admin endpoints have no rate limiting. A compromised admin session could rapidly ban all users.
- **No CSRF protection observed**: Admin state-changing endpoints (POST/PATCH/PUT/DELETE) have no CSRF tokens visible.

### Business Logic Gaps

- **Employer verification state machine is not enforced**: Already-verified employers can be re-verified to a different level without any record of the transition.
- **Content report status machine is not enforced**: Reports can be resolved without going through assessment and action phases.
- **Invoice cancellation does not reverse the associated offer state**: When an admin cancels an invoice, there is no corresponding update to the offer's billing status.
- **Suspicious activity report allows empty entity IDs**: The `ReportSuspiciousActivityDto` makes `entityId` optional, meaning suspicious activity can be logged without specifying what entity it relates to.

### Race Conditions

- **Ticket numbering**: Concurrent ticket creation could generate duplicate ticket numbers.
- **Employer verification**: Two admins could verify the same employer simultaneously without idempotency checks.
- **Invoice overdue check**: `checkOverdueInvoices` updates multiple invoices without a transaction, meaning a partial failure would leave the database in an inconsistent state.

### Edge Cases

- **Empty database**: Dashboard statistics return `totalCredits: 0` (since `_sum` of null is 0), which is fine, but the label is misleading.
- **Negative page numbers**: `parseInt(page)` on query params could produce NaN or negative values, causing unexpected query behavior.
- **User with no worker/employer profile**: `getUserById` would return `null` for `worker` and `employer` includes, which is fine but the frontend should handle this.
- **Blacklist expiry**: `isBlacklisted` correctly checks `expiresAt`, but there is no cron job or cleanup mechanism to deactivate expired entries automatically.

### GDPR Compliance Gaps

- **Admin access to user data**: Admin endpoints return full user data including potentially sensitive fields (email, phone) without data minimization. While admins need access, the principle of proportionality suggests limiting which admins can see what.
- **Rectification field whitelist**: Good — the rectification feature uses a whitelist of allowed fields, preventing arbitrary data modification.
- **Breach notification**: The system creates breach records but the `updateBreach` method accepts arbitrary fields, potentially allowing admins to modify breach severity or affected users count without proper controls.

---

## 5. Severity and Impact Assessment

| Severity | Count | Examples |
|----------|-------|---------|
| Critical | 3 | Unauthenticated trust endpoints, unauthenticated support user creation, password hash exposure |
| High | 6 | Missing state guards on employer verification, ratings admin audit trail, no DTO validation on settings/billing, content report state machine, DSA email bug |
| Medium | 8 | Direct Prisma access, no pagination bounds, no days validation, mass assignment on breach, wrong entityId, missing old-value audit, date validation, ticket race condition |
| Low | 6 | Missing ADMIN check on restore, misleading revenue label, raw fetch in frontend, missing role check, missing frontend pages, audit filter gap |

**Most urgent items for immediate remediation:**

1. **Add authentication guards** to all `/trust/*` endpoints that should be protected (reputation calculation, suspicious activity reporting, blacklist checks, duplicate detection)
2. **Add JwtAuthGuard + AdminGuard** to the `POST /auth/register/support` endpoint
3. **Exclude sensitive fields** (passwordHash, twoFactorSecret) from admin user detail responses
4. **Add DTO validation** to billing settings update, employer verify/reject, and admin settings update
5. **Add state transition validation** for employer verification and content report workflows

---

## 6. Recommendations for Further Investigation

1. **Manual penetration testing**: The unauthenticated trust endpoints should be tested manually to confirm what data can be accessed and what actions can be performed without authentication.

2. **Load testing**: The pagination endpoints without bounds should be tested with large `limit` values (e.g., `limit=100000`) to check for memory exhaustion and slow queries.

3. **Race condition testing**: The ticket numbering and employer verification flows should be tested with concurrent requests to confirm the race conditions.

4. **CSRF testing**: Admin state-changing endpoints should be tested for CSRF vulnerability since no CSRF tokens were observed.

5. **Audit log completeness review**: A systematic review of all admin actions that should create `adminAction` records but currently do not (ratings flag/unflag/publish, trust reviews, DSA actions, support actions).

6. **Frontend admin panel review**: The frontend needs pages for trust/fraud management, privacy admin, DSA content moderation, and support ticket management. The existing pages use raw `fetch()` instead of the centralized API client, which should be standardized.

7. **Authorization matrix review**: The trust controller has a mix of unauthenticated, JWT-only, and role-gated endpoints. A full authorization matrix should be documented and verified against business requirements for each endpoint.

8. **Settings schema validation**: A comprehensive review of all admin settings keys and their expected types should be conducted, with corresponding DTO validation classes created.

9. **Data exposure audit**: All admin-facing endpoints should be reviewed for data minimization — specifically, ensuring password hashes, two-factor secrets, and other PII are excluded from responses.

10. **Content report state machine**: Implement proper state transition validation in the DSA service to ensure reports follow the correct lifecycle.