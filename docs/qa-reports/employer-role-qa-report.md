# Employer Role QA Report — OfferMarket Platform

**Date**: 2026-07-17  
**Role**: Employer (EMPLOYER)  
**Methodology**: Static code analysis tracing all employer-facing workflows end-to-end through controllers, services, DTOs, guards, and frontend pages.

---

## 1. Processes Tested

| # | Workflow | Key Files |
|---|----------|-----------|
| 1 | Employer Registration (KvK number) | `auth.controller.ts`, `auth.service.ts`, `auth.dto.ts` |
| 2 | Login & Token Management | `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts` |
| 3 | Employer Profile Create/Update | `employers.controller.ts`, `employers.service.ts` |
| 4 | Employer Verification Status | `employers.controller.ts`, `employers.service.ts` |
| 5 | Worker Search (anonymous profiles) | `workers.controller.ts`, `workers.service.ts`, `anonymous-profile.pipe.ts` |
| 6 | View Worker Public Profile | `workers.controller.ts`, `workers.service.ts` |
| 7 | Create/Update/Submit/Withdraw Offer | `offers.controller.ts`, `offers.service.ts`, `offer-validation.pipe.ts`, `create-offer.dto.ts` |
| 8 | Conversations & Messaging | `messages.controller.ts`, `messages.service.ts` |
| 9 | Billing & Invoices | `billing.controller.ts`, `billing.service.ts` |
| 10 | Employer Reputation & Ratings | `employers.controller.ts`, `ratings.controller.ts`, `ratings.service.ts` |
| 11 | Trust & Verification | `trust.controller.ts`, `trust.service.ts` |
| 12 | DSA Content Reporting | `dsa.controller.ts`, `dsa.service.ts` |
| 13 | Privacy/GDPR | `privacy.controller.ts`, `privacy.service.ts` |
| 14 | Support Tickets | `support.controller.ts`, `support.service.ts` |
| 15 | Notifications | `notifications.controller.ts` |

---

## 2. Expected vs. Actual Behavior

### 2.1 Employer Registration

**Expected**: Employer registers with email, password, phone, company details (name, KvK number, website). KvK number should be validated for Dutch format (8 digits). Duplicate KvK numbers should be rejected.

**Actual**:
- `RegisterEmployerDto` validates email, password (regex), phone as required, and `company` as `@IsObject()` with nested `name`, `kvkNumber`, `website?`. However, there is **no KvK number format validation**. The KvK number is a Dutch Chamber of Commerce number (8 digits) but the DTO accepts any string.
- Duplicate KvK check exists in `auth.service.ts` line 219, which is correct.
- The `company` object is validated with `@IsObject()` but no `@ValidateNested()` or `@Type()` decorator, so nested validation of `name` and `kvkNumber` will **not run**. The `class-transformer` and `class-validator` need `@ValidateNested()` and `@Type()` for nested object validation to work.

### 2.2 Authentication & Authorization

**Expected**: All employer endpoints should require JWT authentication. Role-based access control should prevent workers from accessing employer-only endpoints and vice versa.

**Actual**:
- **CRITICAL**: The `GET /auth/me` endpoint (`auth.controller.ts` line 31) takes `userId` and `userRole` as **query parameters** rather than from the JWT token. This means any authenticated user can query any other user's basic info by passing a different `userId`. No `@UseGuards(JwtAuthGuard)` decorator is present on this endpoint either.
- **CRITICAL**: The Offers controller (`offers.controller.ts`) uses `@Query('employerId')` for many endpoints (`POST /offers` line 31, `POST /offers/:id/withdraw` line 144, `GET /offers/:id/detail` line 209, `PATCH /offers/:id` line 228, `POST /offers/:id/submit` line 246). The `employerId` is taken from query parameters instead of from the authenticated user's JWT. This allows an employer to pass **any** employerId, potentially operating on behalf of another employer.
- **CRITICAL**: The `WorkersController.searchWorkers` endpoint (line 34) has `@UseGuards(JwtAuthGuard)` but **no role guard**. Any authenticated user, including workers, can search for other workers.
- The `WorkersController.getPublicProfile` (line 302) has **no authentication guard at all**. Any unauthenticated user can view worker public profiles.
- The `RatingsController` `GET /ratings/employer/:employerId` endpoints (lines 80-106) have **no authentication guard**, making ratings data publicly accessible.
- The `RatingsController.updateRating` endpoint (line 59) takes `userId` from **query parameters** instead of from the JWT token. This is an IDOR vulnerability — any user could update another user's rating.
- The `NotificationsController` takes `userId` from query params rather than from the JWT token, allowing any caller to read/mark other users' notifications.

### 2.3 Offer Creation & Management

**Expected**: Only verified employers can create offers. Offers must have complete structured data. Employers cannot make offers to workers who have blocked them. Offers should follow a state machine (DRAFT → SUBMITTED → VIEWED → SHORTLISTED → ACCEPTED/REJECTED/WITHDRAWN/EXPIRED).

**Actual**:
- **Verification check**: `offers.service.ts` line 52 checks `if (employer.verificationStatus === 'PENDING' || employer.verificationStatus === 'REJECTED')` and throws ForbiddenException. This is correct — only verified employers can create offers.
- **CRITICAL IDOR in createOffer**: The `createOffer` method in `offers.service.ts` line 40 takes `userId` as parameter, but the controller at line 29-36 passes `employerId` from query params, not from `req.user.id`. There is a mismatch: the controller passes `employerId` as `userId` to the service, but the service looks up employer by `userId` (which is the user.id, not employer.id). If an employerId (internal employer.id) is passed instead of a user.id, the lookup will fail or find the wrong employer.
- **Offer validation pipe** correctly enforces structured offer requirements (salary min/max, vacation days, etc.).
- **Salary range spread**: The validation pipe limits the spread between `salaryMin` and `salaryMax` to €5,000. While this enforces specificity, it is very tight for annual salaries (a €5,000 range on a €40,000-€60,000 salary is only ~8%). This may frustrate employers.
- **Offer state machine issues**:
  - `createOffer` creates offers with status `SUBMITTED` (line 105), not `DRAFT`. The `submitOffer` endpoint (line 409) checks for `DRAFT` status. This means an offer created through `POST /offers` cannot be submitted again (it's already SUBMITTED). The `DRAFT` status seems to exist only for the counter-offer flow.
  - `withdrawOffer` (line 850) takes `employerId` from query params, but verifies `offer.employerId !== employerId`. This passes the employer's internal ID, which is correct for the check, but again comes from query params rather than the authenticated user.

### 2.4 Worker Anonymity

**Expected**: Worker identity (name, email, phone, exact address, current employer) should NEVER be exposed to employers until an offer is accepted. This is the platform's core privacy promise.

**Actual**:
- The `AnonymousProfilePipe` (`anonymous-profile.pipe.ts`) is well-designed with explicit whitelist and blacklist, plus recursive scanning for email/phone patterns. This is defense-in-depth.
- **CRITICAL PRIVACY LEAK in `getOfferForWorker`**: In `offers.service.ts` line 201-244, when a worker views an offer, the response includes the full employer object including `employer.user` (line 216-221). This means the **employer's user email** is exposed to workers. While employers are not anonymous (their company names are public), exposing the employer's user email may not be intended.
- **CRITICAL PRIVACY LEAK in `listOffersForWorker`**: At line 923, the worker's offer list includes `employer: { include: { user: true } }`. This again exposes the employer's user email.
- **CRITICAL PRIVACY LEAK in `listOffersForEmployer`**: At line 951, the employer's offer list includes `worker: true`, which loads the **entire worker record** including `userId` and potentially other identifying fields. While the raw data is returned, the service does not apply the `AnonymousProfilePipe` or the `buildAnonymousProfile` method. The worker's real identity could leak through this endpoint.
- **PRIVACY CONCERN in `acceptOffer`**: The `getWorkerFullName` method (line 980-991) returns `worker.user.email.split('@')[0]` as a placeholder for the worker's real name. This is a privacy issue — even the email username part could be identifying.

### 2.5 Employer Profile & Verification

**Expected**: Employer profile CRUD should be restricted to the profile owner. Verification should follow a clear flow.

**Actual**:
- **CRITICAL IDOR on `updateEmployerProfile`**: The `employers.service.ts` `updateEmployerProfile` method (line 99) takes `updateDto: any` and directly spreads it into the Prisma `update` call. There is **no field whitelist** — any field in the employer model can be overwritten, including `verificationStatus`, `verifiedAt`, `verifiedBy`, `totalHires`, `reputationScore`, `offerAcceptanceRate`, etc. An employer could set their own `verificationStatus` to `BASIC_VERIFIED` or `PREMIUM_VERIFIED`.
- The `EmployersController` (line 23-28) for `PATCH /employers/me` has `@UseGuards(JwtAuthGuard)` but no role check. A worker authenticated with JWT could potentially create an employer profile via `POST /employers` and then modify it. The `findUnique({ where: { userId } })` does scope to the authenticated user, but the endpoint does not verify the user's role is EMPLOYER.
- **No DTO validation** on `createProfile` or `updateProfile` — both accept `any`. This means no server-side validation of KvK number format, company name length, or other business rules on profile updates.

### 2.6 Billing & Invoices

**Expected**: Employers should only see their own invoices. Invoice data should be scoped to the authenticated employer.

**Actual**:
- **SECURITY**: The `getInvoiceDetail` method (`billing.service.ts` line 145-172) takes an optional `employerId` parameter for ownership verification. When `employerId` is provided, it checks `invoice.employerId !== employerId` and returns 404 if mismatched. However, when `employerId` is **not provided** (e.g., from the admin endpoint), there's no ownership check. The `GET /billing/invoices/:id` endpoint (line 44) does pass the employer ID, so this is correctly scoped for employer access. But the potential for IDOR exists if the `employerId` parameter is omitted or null.
- Admin endpoints are properly guarded with `AdminGuard`.

### 2.7 Conversations/Messaging

**Expected**: Messaging should only be possible after offer acceptance. Only conversation participants should be able to view/send messages.

**Actual**:
- **CRITICAL**: `getConversations` (`messages.service.ts` line 24) takes `userType` as a parameter. It filters by `participant1Id: userId` for workers or `participant2Id: userId` for employers. However, there is **no verification that the authenticated user is actually a participant**. The `userType` parameter is trusted, and the `userId` could be any user ID. Combined with the frontend passing `userId` from localStorage, this could lead to IDOR if the API is called directly.
- The `getConversation` method correctly verifies `conversation.participant1Id !== userId && conversation.participant2Id !== userId` and throws ForbiddenException. This is good.
- **No conversation creation endpoint**: Conversations are only created during offer acceptance (`offers.service.ts` line 569-576). There is no standalone endpoint to create conversations, which is correct for enforcing the "messaging only after acceptance" rule.

### 2.8 Ratings

**Expected**: Only workers who received offers can rate employers. Ratings should be one per offer.

**Actual**:
- **IDOR vulnerability**: `RatingsController.updateRating` (line 59-68) takes `userId` from query parameters (`@Query('userId')`), not from the authenticated JWT token. Any user could pass another user's ID and update their ratings.
- **No rate limiting on rating creation**: While `canRateStatuses` includes `SUBMITTED`, `VIEWED`, and even `SHORTLISTED`, a worker could rate an employer after merely viewing an offer, without any real interaction. The `ACCEPTED` status gives `isVerifiedHire: true`, which is correct.
- **Public employer ratings** (`GET /ratings/employer/:employerId` and `GET /ratings/employer/:employerId/stats`) have no authentication guard. This makes sense for transparency but means rating data is publicly accessible.

### 2.9 DSA (Digital Services Act)

**Expected**: Any user (including employers) can report illegal content. Content reports should be tracked.

**Actual**:
- The `submitContentReport` endpoint (line 58) is **not authenticated** — it allows anonymous reports with just an email. This is correct per DSA Art. 16 but means spam/abuse is possible.
- Employers can file DSA complaints (line 236) after being authenticated. This is correct.
- The DSA implementation is comprehensive and well-structured.

### 2.10 Privacy/GDPR

**Expected**: Employers can manage their data, request exports, and request deletion.

**Actual**:
- The privacy module correctly uses `getAuthenticatedUserId(req)` (line 40-42) which extracts user ID from the JWT token, not from request params. This prevents IDOR.
- **Processing restriction**: When a user restricts processing (Art. 18), the `SkipProcessingRestrictionCheck` decorator is used on privacy endpoints, but there is no enforcement in the business logic to actually prevent data processing for restricted users. The `processingRestricted` flag is stored but not checked before processing user data in other modules.

### 2.11 Support Tickets

**Expected**: Users can create support tickets and track them.

**Actual**:
- **The entire Support controller is guarded by `SupportGuard`** (line 8), which only allows ADMIN and SUPPORT roles. Regular users (workers and employers) **cannot create tickets or view their own tickets** through this controller. The `GET /support/my-tickets` endpoint (line 156) requires `req.user.id` but is behind the `SupportGuard`.
- The frontend has pages for creating tickets (`/support/new-ticket`) and viewing tickets, but they would fail because the backend requires SUPPORT role.
- This appears to be a **critical bug** — employers have no way to file support tickets through the API.

### 2.12 Frontend-Backend Inconsistencies

**Expected**: Frontend API calls should match backend endpoint signatures.

**Actual**:
- **Offers API mismatch**: The frontend `offersApi.createOffer` (`api.ts` line 315-316) calls `api.post('/offers', data)` without passing `employerId` as a query parameter. But the backend `OffersController.createOffer` (line 31) requires `@Query('employerId') employerId: string` and throws `BadRequestException('employerId is required')` if missing. This means **offer creation will always fail from the frontend**.
- **Worker API extra params**: The frontend `workersApi.getMyProfile` (line 134-136) and similar methods pass `userId` as a query parameter, but the backend controller methods use `@Request() req` to get `req.user.id` from the JWT. These extra `userId` params are ignored by the backend.
- **Employer API mismatch**: The frontend `employersApi.getMyProfile` (line 279-281) passes `userId` as a query parameter, but the backend `EmployersController.getMyProfile` uses `@Request() req` and `req.user.id`.
- **Conversations API**: Frontend `conversationsApi.listConversations` (line 427) passes `userId` and `userType` as params, but the backend `MessagesController.getConversations` uses `@Request() req` and `@Query('userType')`. The extra `userId` param is ignored.
- **Notifications API**: Frontend passes `userId` as a query param for all notification endpoints, but the backend `NotificationsController` also takes `userId` from query params (not from JWT). This is a security concern — any user could read another user's notifications.
- **Dashboard fetches employerId from localStorage**: The employer dashboard (`page.tsx` line 52) calls `offersApi.getEmployerOffers(userId)` where `userId` is from localStorage. This passes the **user.id** (not employer.id) as `employerId`, but the backend `listOffersForEmployer` expects an employer's internal ID and does `findUnique({ where: { userId } })` correctly. This actually works because it uses the user ID to find the employer.

---

## 3. Errors and Issues Found

### CRITICAL (5)

**E-C1: IDOR in Offers Controller — employerId from query params**  
`offers.controller.ts` lines 31, 145, 209, 228, 246: The `employerId` is taken from query parameters instead of the authenticated user's JWT. An attacker can pass any employer's ID to create offers, withdraw offers, or view offer details on behalf of other employers. This is the most severe vulnerability in the system.

**E-C2: Mass Assignment on Employer Profile Update**  
`employers.service.ts` line 99-112: `updateEmployerProfile` accepts `any` DTO and passes it directly to `prisma.employer.update()`. An employer can set `verificationStatus`, `verifiedAt`, `reputationScore`, or any other field including self-verifying as `PREMIUM_VERIFIED`.

**E-C3: Worker Identity Leak in Employer Offer List**  
`offers.service.ts` line 951: `listOffersForEmployer` includes `worker: true` which returns the full worker record including `userId` and other identifying information, bypassing the anonymization layer.

**E-C4: Offer Creation Frontend-Backend Mismatch**  
`api.ts` line 315 vs `offers.controller.ts` line 31: Frontend does not pass `employerId`, but backend requires it. Offer creation will always fail from the frontend.

**E-C5: No DTO Validation on Employer Profile Endpoints**  
`employers.controller.ts` lines 9-28: Both `createProfile` and `updateProfile` accept `@Body() createDto: any` and `@Body() updateDto: any` with no validation class. No KvK format validation, no company name length limits.

### HIGH (8)

**E-H1: Unauthenticated GET /auth/me**  
`auth.controller.ts` line 31: No JWT guard on this endpoint, and it takes `userId`/`userRole` from query params. Any unauthenticated user can enumerate user IDs and get basic user info.

**E-H2: Support Controller Blocks Regular Users**  
`support.controller.ts` line 8: The `SupportGuard` only allows ADMIN/SUPPORT. Employers cannot create support tickets.

**E-H3: No Role-Based Access Control on Employer Endpoints**  
`employers.controller.ts`: While `JwtAuthGuard` is used, there is no `@Roles('EMPLOYER')` decorator. A worker with a JWT could potentially create an employer profile via `POST /employers` and then modify it.

**E-H4: No Role-Based Access Control on Offers Endpoints**  
Any authenticated user (including workers) can call `POST /offers` to create offers. There is no check that the user is actually an employer.

**E-H5: KvK Number Not Validated**  
`RegisterEmployerDto` uses `@IsObject()` for the `company` field but no `@ValidateNested()` / `@Type()` decorators, so nested validation of `kvkNumber`, `name` does not actually execute. KvK numbers should be validated for the 8-digit Dutch format.

**E-H6: Worker Search Not Role-Restricted**  
`GET /workers/search` only requires JWT auth, not an employer role. Workers can search for other workers.

**E-H7: Worker Public Profile Not Authenticated**  
`GET /workers/:publicId` has no auth guard. Anyone, including unauthenticated users, can view worker profiles.

**E-H8: Processing Restriction Not Enforced**  
The GDPR processing restriction flag is stored but no business logic checks it before processing user data (e.g., creating offers, sending notifications).

### MEDIUM (4)

**E-M1: Email/Phone Verification Not Implemented**  
`auth.service.ts` lines 390-398: `verifyEmail` always succeeds regardless of the code passed. The comment says "In production, verify the code properly" but the current implementation accepts any code.

**E-M2: Refresh Token Security**  
The refresh token is stored with its hash, which is good, but if `storedToken` is null (token not found at all, not just revoked), the code proceeds to issue new tokens, which could allow replay attacks with unknown tokens.

**E-M3: Offer Public ID Generation Race Condition**  
`offers.service.ts` lines 965-978: `generateOfferPublicId` uses `findFirst({ orderBy: { createdAt: 'desc' } })` and then increments the sequence. Under concurrent requests, two offers could get the same sequence number.

**E-M4: Counter-Offer Creates New Offer Instead of Versioning**  
`offers.service.ts` lines 762-776: When a worker counters an offer, a completely new offer record is created in `DRAFT` status. This new offer has no link back to the original. The employer must then find and submit this counter-offer separately.

### LOW (2)

**E-L1: Double Auth Guard**  
`AdminGuard` extends `AuthGuard('jwt')` and calls `super.canActivate()`. When both `JwtAuthGuard` and `AdminGuard` are used together (`@UseGuards(JwtAuthGuard, AdminGuard)`), authentication runs twice.

**E-L2: Missing @Roles Decorators**  
Throughout the codebase, the `Roles` decorator is defined but rarely used. Only the Trust controller and some admin endpoints use `@Roles('ADMIN')` or `@Roles('ADMIN', 'SUPPORT')`. Worker-only and employer-only endpoints rely solely on business logic checks rather than role-based guards.

---

## 4. Gaps, Risks, and Edge Cases

### Missing Features / Gaps

1. **No Email Sending**: The `forgotPassword` and `verifyEmail` methods return tokens/codes directly in the API response instead of sending emails. In production, these must be sent via email.

2. **No Rate Limiting on Sensitive Operations**: While auth endpoints have `@Throttle`, there is no rate limiting on offer creation, profile updates, or messaging. An employer could spam workers with offers.

3. **No Offer Expiry Background Job**: Offers have an `expiresAt` field but no background job or cron to mark expired offers. Expired offers remain in SUBMITTED status.

4. **No File Upload Handling**: Verification document submission (`POST /trust/employers/:employerId/documents`) accepts a `fileUrl` and `fileHash` but there is no actual file upload endpoint. Document uploads would need S3 integration.

5. **SELECTED_COMPANIES Visibility Not Fully Implemented**: In `workers.service.ts` line 83, when `profileVisibility === 'SELECTED_COMPANIES'`, the service throws "Profile not found" rather than checking an allowed-companies list. Workers cannot actually grant specific employers access.

6. **No Employer Search Endpoint**: There is no endpoint for workers to search for employers or view employer public profiles (beyond the reputation endpoint). The employer reputation endpoint (`GET /employers/:id/reputation`) takes any employer ID and returns detailed data.

7. **No Password Strength Validation Beyond Regex**: The `PASSWORD_REGEX` requires 8+ chars with uppercase, lowercase, and digit, but doesn't check for common passwords or breached passwords.

8. **No CORS Configuration Visible**: No explicit CORS configuration was found in the main app module. This could be a security risk if the API is accessible from any origin.

### Edge Cases

9. **Concurrent Offer Submissions**: If two employers try to create offers to the same worker simultaneously, both will succeed. There is no limit on the number of offers a worker can receive.

10. **Offer Version Race Condition**: The `updateOffer` method gets the next version number by querying for the max version, which could result in duplicate version numbers under concurrent updates.

11. **KvK Number Duplicate Check Race**: If two users register with the same KvK number simultaneously, both transactions could pass the uniqueness check before either commits, resulting in duplicate employers.

12. **Counter-Offer Without Worker Validation**: The counter-offer flow creates a new offer with `workerId` and `employerId` but doesn't check if the worker has blocked the employer or if the worker's profile is visible.

13. **Empty Offer Version in Submit**: The `submitOffer` method checks `if (!offer.currentVersion)` but there's no validation that the current version has all required fields before submitting.

---

## 5. Severity and Impact Assessment

| Severity | Count | Examples |
|----------|-------|---------|
| Critical | 5 | IDOR in Offers controller, Mass assignment in employer update, Worker identity leak in offer lists, Offer creation frontend-backend mismatch |
| High | 8 | Unauthenticated /auth/me, Support blocking regular users, No role guards on employer/offer endpoints, KvK validation missing, Processing restriction not enforced |
| Medium | 4 | Email/phone verification not implemented, Race conditions in ID generation, Salary range too tight, Counter-offer design issues |
| Low | 2 | Double auth guard, Missing Roles decorators |

---

## 6. Recommendations for Further Investigation

1. **Manual Penetration Testing**: The IDOR vulnerabilities in the Offers, Ratings, and Notifications controllers need manual verification to confirm exploitability. Specifically test whether passing different `employerId`/`userId` values in query params allows cross-account actions.

2. **Load Testing**: The race conditions in public ID generation (offers, workers) could cause duplicate IDs under high concurrency. Test with concurrent offer creation.

3. **KvK Number Validation**: Implement proper Dutch KvK number validation (8 digits, check digit algorithm). Add `@ValidateNested()` and `@Type()` to `RegisterEmployerDto.company`.

4. **Role-Based Access Control Audit**: Systematically add `@Roles('EMPLOYER')` guards to employer-only endpoints and `@Roles('WORKER')` to worker-only endpoints. The current approach of relying on database lookups (checking if a user has an employer/worker record) is insufficient because it allows cross-role access at the API level.

5. **AnonymousProfilePipe Integration**: The offer listing endpoints for employers (`listOffersForEmployer`) should use the `AnonymousProfilePipe` or at minimum call `buildAnonymousProfile` to ensure worker identity is never leaked.

6. **Support Ticket API for Regular Users**: Create a separate controller or add public endpoints to the support controller so employers can create and track tickets without requiring ADMIN/SUPPORT role.

7. **Frontend API Client Refactoring**: Remove `userId` query parameters from the frontend API client where the backend uses `req.user.id` from JWT. Add the missing `employerId` to offer creation calls.

8. **DTO Validation for Employer Profile**: Create proper DTOs with class-validator decorators for employer profile creation and updates, including KvK format validation, company name length limits, and field whitelisting.

9. **Notification Security**: Refactor the Notifications controller to use JWT authentication and extract `userId` from the token rather than query parameters.

10. **Offer State Machine Enforcement**: Consider adding explicit state transition validation to prevent invalid transitions (e.g., accepting a withdrawn offer, countering an expired offer).