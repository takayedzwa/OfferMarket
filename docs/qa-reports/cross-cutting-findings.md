# Cross-Cutting Findings & Executive Summary — OfferMarket QA Audit

**Date**: 2026-07-17  
**Scope**: Full platform QA audit across all four user roles (Worker, Employer, Admin, Support)  
**Methodology**: Static code analysis of backend controllers, services, DTOs, guards, frontend pages, and API client code

---

## Executive Summary

Four independent QA agents simulated each user role and traced all workflows end-to-end through the source code. The audit identified **17 unique Critical**, **22 unique High**, **27 unique Medium**, and **25 unique Low** issues across the platform.

The most urgent findings fall into three categories:

1. **Authentication & Authorization Gaps**: Multiple endpoints lack authentication guards entirely (notifications, trust, auth/me), and many endpoints accept user identity from untrusted sources (query params, request body) instead of JWT tokens, enabling IDOR attacks.

2. **Data Exposure**: Password hashes and two-factor secrets are exposed in admin user detail responses. Worker identity leaks through employer offer lists. Employer emails leak in worker offer views.

3. **Frontend-Backend Mismatches**: Several core workflows (offer creation, support tickets, user search, dashboard stats) are broken because the frontend API calls don't match the backend endpoint signatures.

---

## Cross-Cutting Critical Issues

### CC-C1: Unauthenticated Endpoints Expose Sensitive Data

These endpoints have **no authentication guard** and are accessible to anyone:

| Endpoint | Issue |
|----------|-------|
| `GET /auth/me?userId=X&userRole=Y` | Returns any user's email, phone, role, verification status |
| `GET /notifications?userId=X` | Read any user's notifications |
| `PATCH /notifications/:id/read?userId=X` | Mark any user's notifications as read |
| `PATCH /notifications/read-all?userId=X` | Clear all notifications for any user |
| `GET /notifications/unread-count?userId=X` | See unread counts for any user |
| `GET /workers/:publicId` | View any worker's anonymous profile |
| `POST /auth/register/support` | Create SUPPORT role accounts |
| `GET /trust/blacklist/check/:entityType/:entityId` | Check blacklist status |
| `POST /trust/suspicious-activity` | Report suspicious activity |
| `POST /trust/detect/suspicious-login` | Probe login detection |
| `POST /trust/detect/rapid-account-creation` | Probe account creation detection |
| `POST /trust/reputation/calculate` | Trigger reputation calculations |
| `GET /trust/reputation/employer/:id` | View reputation scores |
| `GET /trust/reputation/worker/:id` | View worker reputation |
| `GET /trust/score/:entityType/:entityId` | View trust scores |

### CC-C2: IDOR (Insecure Direct Object Reference) Vulnerabilities

These endpoints accept identity from untrusted sources instead of JWT tokens:

| Endpoint | Param Source | Risk |
|----------|-------------|------|
| `POST /offers?employerId=X` | Query param | Create offers as any employer |
| `POST /offers/:id/withdraw?employerId=X` | Query param | Withdraw any employer's offers |
| `GET /offers/:id/detail?employerId=X` | Query param | View any employer's offer details |
| `PATCH /offers/:id?employerId=X` | Query param | Modify any employer's offer |
| `POST /offers/:id/submit?employerId=X` | Query param | Submit any employer's offer |
| `PATCH /ratings/:id?userId=X` | Query param | Update another user's rating |
| `GET /auth/me?userId=X` | Query param | View any user's info |
| All `/notifications` endpoints | Query param | Read/modify anyone's notifications |
| `POST /support/tickets` (userId) | Request body | Create tickets as another user |

### CC-C3: Missing Role-Based Authorization

The `RolesGuard` exists but is rarely applied. These endpoints lack role checks:

| Endpoint Group | Expected Role | Actual Access |
|---------------|---------------|----------------|
| `WorkersController` (all) | WORKER | Any authenticated user |
| `EmployersController` (all) | EMPLOYER | Any authenticated user |
| `OffersController` (create) | EMPLOYER | Any authenticated user |
| `OffersController` (accept/reject/counter) | WORKER | Any authenticated user |
| `SupportController` (all) | ADMIN/SUPPORT | ADMIN/SUPPORT only ✅ |
| `AdminController` (all) | ADMIN | ADMIN only ✅ |
| `TrustController` (various) | Mixed | Some unauthenticated ⚠️ |

### CC-C4: Mass Assignment Vulnerabilities

These endpoints accept `any` DTOs with no field whitelisting:

| Endpoint | Risk |
|----------|------|
| `PATCH /employers/me` | Employer can set `verificationStatus`, `reputationScore`, etc. |
| `POST /employers` | No validation on company fields |
| `PATCH /billing/admin/settings` | Arbitrary key/value pairs |
| `PATCH /admin/settings` | Arbitrary key/value pairs |
| `POST /support/tickets/:id/extend` | No validation on `days` parameter |

### CC-C5: Frontend-Backend API Mismatches

| Frontend Call | Backend Expectation | Result |
|---------------|---------------------|--------|
| `offersApi.createOffer(data)` | `POST /offers?employerId=X` | **Always fails** — missing required param |
| `GET /support/users?search=X` | `GET /support/users/:id` (no search) | **Always fails** |
| Support dashboard expects `totalTickets`, etc. | Backend returns `resolvedToday`, `totalUsers`, etc. | **Wrong data** |
| Support ticket filters (priority, category, search) | Backend only supports `status` | **Ignored silently** |
| Frontend passes `userId` in query params | Backend uses `req.user.id` from JWT | Extra params ignored (but confusing) |

### CC-C6: Password Hash & Sensitive Data Exposure

`GET /admin/users/:id` returns all User model scalar fields including `passwordHash` and `twoFactorSecret`. No field exclusion is applied.

### CC-C7: SELECTED_COMPANIES Visibility Not Implemented

Workers who set visibility to `SELECTED_COMPANIES` get a 404 — the backend has no mechanism for workers to specify which companies can see their profile. The frontend offers this option, misleading users.

### CC-C8: Support Controller Blocks Regular Users

The `SupportController` uses `@UseGuards(SupportGuard)` which only allows ADMIN/SUPPORT. Workers and employers cannot create support tickets through the API. The frontend has pages for this (`/support/new-ticket`) but they would fail with 403 Forbidden.

---

## Consolidated Severity Summary

| Severity | Worker | Employer | Admin | Support | Unique Total |
|----------|--------|----------|-------|---------|-------------|
| Critical | 5 | 5 | 3 | 4 | **17** |
| High | 8 | 8 | 6 | 6 | **22** |
| Medium | 9 | 4 | 8 | 7 | **27** |
| Low | 7 | 2 | 6 | 7 | **25** |

---

## Cross-Cutting Gaps & Risks

### Architecture Gaps

- **No Global Role-Based Authorization Layer**: The application relies on `JwtAuthGuard` for authentication but doesn't have a consistent role-based authorization layer. `RolesGuard` exists but is only used on `TrustController` and some admin endpoints.

- **IDOR Pattern Throughout**: Multiple controllers accept identity from query params/body instead of JWT (`employerId`, `userId`, `adminUserId`). This is a systemic pattern that should be fixed comprehensively.

- **No CSRF Protection**: No CSRF tokens were observed on state-changing admin endpoints.

- **No Email Sending**: `forgotPassword` and `verifyEmail` return tokens/codes in API responses instead of sending emails. This is a production blocker.

### Business Logic Gaps

- **Offer State Machine Not Enforced**: No validation that state transitions are valid (accepting a withdrawn offer, countering an expired offer, etc.).

- **No Offer Expiry Background Job**: `expiresAt` is set but no cron marks offers as expired.

- **No File Upload Handling**: Verification documents accept `fileUrl`/`fileHash` but no upload endpoint exists.

- **Worker Anonymity Leak**: `listOffersForEmployer` returns full worker data without anonymization.

- **Counter-Offer Creates Unlinked New Offer**: No `parentOfferId` field to link counter-offers to originals.

### Data Validation Gaps

- **No DTO on Employer Profile Endpoints**: `any` type allows mass assignment of any field.
- **KvK Number Not Validated**: Dutch 8-digit format not enforced.
- **No DTO on Billing Settings, Admin Settings, DSA Dates**: Arbitrary key/value accepted.
- **Email/Phone Verification Not Implemented**: Always succeeds regardless of code.

### Privacy & GDPR Gaps

- **Processing Restriction Not Enforced**: Flag is stored but not checked before data processing.
- **Admin User Detail Exposes Password Hash**: No field exclusion.
- **Employer Email Leaked to Workers**: In offer responses for non-accepted offers.
- **Support Can Access Any Conversation**: No audit trail for data access.

---

## Top 10 Recommendations for Immediate Action

| Priority | Recommendation | Impact |
|----------|---------------|--------|
| 🔴 1 | Add `JwtAuthGuard` to all notification endpoints and `GET /auth/me`. Extract `userId` from `req.user.id`, not query params. Apply same fix to ratings update endpoint. | Closes 5+ IDOR vulnerabilities |
| 🔴 2 | Replace query-param IDs with JWT-based IDs in Offers controller (`employerId`), Ratings controller (`userId`), and all other endpoints accepting identity from untrusted sources. | Closes systemic IDOR pattern |
| 🔴 3 | Add `@Roles('WORKER')`, `@Roles('EMPLOYER')` guards to role-specific endpoints. Workers should not create employer profiles or offers; employers should not create worker profiles. | Prevents cross-role privilege escalation |
| 🔴 4 | Add `JwtAuthGuard + AdminGuard` to `POST /auth/register/support`. Extract `adminUserId` from `req.user.id`. | Prevents unauthorized SUPPORT account creation |
| 🔴 5 | Add authentication guards to all Trust module endpoints that should be protected (reputation, suspicious activity, detection, blacklist checks). | Closes 9+ unauthenticated endpoints |
| 🟠 6 | Create proper DTOs with `@ValidateNested()` and field whitelisting for employer profile create/update, billing settings, admin settings, and DSA date fields. Remove `any` types. | Prevents mass assignment attacks |
| 🟠 7 | Exclude `passwordHash` and `twoFactorSecret` from all API responses using Prisma `select` or response DTOs. | Closes sensitive data exposure |
| 🟠 8 | Add state transition validation for offers (accept only valid states), tickets (cannot reopen CLOSED), content reports (RECEIVED → ASSESSMENT → ACTION → RESOLVED), and employer verification (only PENDING → VERIFIED/REJECTED). | Prevents invalid state transitions |
| 🟠 9 | Replace `AdminGuard` with `RolesGuard` + `@Roles('ADMIN', 'SUPPORT')` on DSA content moderation endpoints so SUPPORT can handle content reports. | Fixes role access gap |
| 🟡 10 | Fix frontend-backend mismatches: add `employerId` to offer creation, implement user search in support module, align dashboard stats fields, implement SELECTED_COMPANIES visibility or remove from frontend. | Fixes broken core workflows |

---

## Report Files

| Role | File |
|------|------|
| Worker | [`worker-role-qa-report.md`](./worker-role-qa-report.md) |
| Employer | [`employer-role-qa-report.md`](./employer-role-qa-report.md) |
| Admin | [`admin-role-qa-report.md`](./admin-role-qa-report.md) |
| Support | [`support-role-qa-report.md`](./support-role-qa-report.md) |
| Cross-Cutting | [`cross-cutting-findings.md`](./cross-cutting-findings.md) (this file) |

---

*This report was generated through static code analysis. All findings should be verified through manual penetration testing and integration testing before prioritizing fixes. No code changes were made during this audit.*