# Worker Role QA Report — OfferMarket Platform

**Date**: 2026-07-17  
**Role**: Worker (WORKER)  
**Methodology**: Static code analysis tracing all worker-facing workflows end-to-end through controllers, services, DTOs, guards, and frontend pages.

---

## 1. Processes Tested

| # | Workflow | Key Files |
|---|----------|-----------|
| 1 | Worker Registration | `auth.controller.ts`, `auth.service.ts`, `auth.dto.ts` |
| 2 | Login & Token Management | `auth.controller.ts`, `auth.service.ts`, `jwt.strategy.ts` |
| 3 | Password Reset | `auth.controller.ts`, `auth.service.ts`, `reset-password.dto.ts` |
| 4 | Email Verification | `auth.controller.ts`, `auth.service.ts` |
| 5 | Phone Verification | `auth.controller.ts`, `auth.service.ts` |
| 6 | Worker Profile Create/Read/Update/Delete | `workers.controller.ts`, `workers.service.ts`, `dto/worker.dto.ts` |
| 7 | Skills CRUD | `workers.controller.ts`, `workers.service.ts` |
| 8 | Certifications CRUD | `workers.controller.ts`, `workers.service.ts` |
| 9 | Languages CRUD | `workers.controller.ts`, `workers.service.ts` |
| 10 | Education CRUD | `workers.controller.ts`, `workers.service.ts` |
| 11 | Project Experience CRUD | `workers.controller.ts`, `workers.service.ts` |
| 12 | Profile Visibility (ALL_VERIFIED / SELECTED_COMPANIES / HIDDEN) | `workers.controller.ts`, `workers.service.ts` |
| 13 | Company Blocking/Unblocking | `workers.controller.ts`, `workers.service.ts` |
| 14 | Worker Search (Employer view — anonymous profile) | `workers.controller.ts`, `workers.service.ts`, `anonymous-profile.pipe.ts` |
| 15 | Offer View/Accept/Reject/Shortlist/Counter | `offers.controller.ts`, `offers.service.ts` |
| 16 | Conversations & Messaging | `messages.controller.ts`, `messages.service.ts` |
| 17 | Employer Ratings | `ratings.controller.ts`, `ratings.service.ts` |
| 18 | Privacy/GDPR (Consents, Export, Deletion, Restriction) | `privacy.controller.ts`, `privacy.service.ts` |
| 19 | DSA Content Reporting | `dsa.controller.ts`, `dsa.service.ts` |
| 20 | Notifications | `notifications.controller.ts`, `notifications.service.ts` |
| 21 | Support Tickets | `support.controller.ts`, `support.service.ts` |
| 22 | Frontend Integration | `api.ts`, `AuthContext.tsx`, worker dashboard & profile pages |

---

## 2. Expected vs. Actual Behavior

| Workflow | Expected | Actual |
|----------|----------|--------|
| Worker registration | Password validated, email uniqueness checked | ✅ Correct; password regex enforces complexity |
| GET /auth/me | Returns current user's data from JWT | ❌ Returns data for ANY userId passed as query param — **IDOR vulnerability** |
| Worker profile creation | Only WORKER role users can create | ❌ No role check; any authenticated user can create a worker profile |
| Public profile view | Employer can see anonymous profile if not blocked and visibility allows | ❌ SELECTED_COMPANIES visibility always returns 404; no allowed-company list exists |
| Offer acceptance | Only the offer's assigned worker can accept | ✅ Correct; `offer.workerId !== worker.id` check exists |
| Offer counter | Worker can counter only SUBMITTED/VIEWED/SHORTLISTED offers | ❌ No status check; worker can counter offers in any state |
| Ratings creation | Worker can rate offers they received | ✅ Correct; verifies offer belongs to worker. But allows rating for SUBMITTED/VIEWED offers, not just ACCEPTED |
| Notifications API | Only the authenticated user can read their notifications | ❌ userId taken from query param, not JWT — **IDOR vulnerability** |
| Messaging | Only conversation participants can send messages | ✅ Correct; verifies participant IDs match |
| Privacy data export | Only the authenticated user can download their export | ✅ Correct; `processDataExport` verifies userId ownership |
| Support ticket creation | User creates ticket for themselves | ❌ `CreateTicketDto.userId` comes from body; not verified against JWT |
| Frontend API calls | Backend uses `req.user.id` from JWT for auth | ✅ Correct on workers/offers/privacy endpoints; ❌ incorrect on notifications and some ratings endpoints |

---

## 3. Errors and Issues Found

### CRITICAL (5)

**W-C1: IDOR on Notifications API**  
`/notifications` endpoints (`notifications.controller.ts` lines 29-93) accept `userId` as a query parameter instead of extracting it from the JWT token. Any authenticated user can read, mark as read, or clear all notifications for any other user by passing their userId.

**W-C2: IDOR on GET /auth/me**  
`auth.controller.ts` line 31 takes `userId` and `userRole` as query parameters. Any authenticated user can retrieve any other user's profile data (email, phone, role, verification status) by passing a different userId. The frontend (`AuthContext.tsx` lines 35-36) also passes these as query params from localStorage.

**W-C3: No Role Guards on Worker Endpoints**  
The `WorkersController` has `@UseGuards(JwtAuthGuard)` but no `@Roles` decorator. Any authenticated user (EMPLOYER, ADMIN, SUPPORT) can call worker-only endpoints like creating a worker profile, updating visibility, blocking companies, or deleting a worker profile. An employer could create a worker profile for themselves and then manipulate it.

**W-C4: Counter-Offer Missing State Validation**  
In `offers.service.ts` lines 723-843, the `counterOffer` method only checks if the offer exists and belongs to the worker, but doesn't validate that the offer is in a state that allows countering (e.g., SUBMITTED, VIEWED, SHORTLISTED). A worker could counter a WITHDRAWN, ACCEPTED, REJECTED, or EXPIRED offer.

**W-C5: SELECTED_COMPANIES Visibility Not Implemented**  
In `workers.service.ts` lines 380-382, when a worker sets visibility to `SELECTED_COMPANIES`, the `getPublicProfile` method always throws `NotFoundException('Profile not found')`. There is no mechanism for workers to specify which companies can see their profile. The frontend (setup page) offers this option, misleading workers into thinking the feature works.

### HIGH (8)

**W-H1: Frontend userId in Query Param**  
The frontend API client (`api.ts` lines 135-248) passes `userId` from localStorage as a query parameter for worker CRUD operations. While the backend ignores these and uses `req.user.id` from JWT, this creates a dangerous pattern where future developers might use the query param. It also leaks user IDs in URLs and server logs.

**W-H2: Email/Phone Verification Bypass**  
In `auth.service.ts` lines 390-415, `verifyEmail` and `verifyPhone` methods simply set the verification flag to `true` without validating any code. The comment says "In production, verify the code properly" but the endpoint is active and accessible. Any user can verify any other user's email or phone by calling `POST /auth/verify-email` with their userId.

**W-H3: Password Reset Token Returned in API Response**  
In `auth.service.ts` line 648, the `forgotPassword` method returns the raw reset token in the response (`token: rawToken`). This means anyone who triggers a password reset can see the token in the API response, even if they don't own the email account.

**W-H4: Support Ticket userId from Request Body**  
In `CreateTicketDto` (line 6 in `create-ticket.dto.ts`), `userId` is a required field from the request body. The support controller doesn't override this with the authenticated user's ID. A worker could create a ticket under another user's identity.

**W-H5: Offer Salary Range Too Restrictive**  
In `offer-validation.pipe.ts` lines 73-78, the maximum salary spread is capped at €5,000 (`salaryMax - salaryMin > 5000`). This is far too restrictive for the Dutch labor market where senior electricians earn €40k-€80k and the spread would typically be €10k-€20k.

**W-H6: Offer Search Doesn't Check Blocked Status**  
The `searchWorkers` endpoint (`workers.service.ts` lines 63-223) filters by `profileVisibility: 'ALL_VERIFIED'` but does not exclude workers who have blocked the searching employer. An employer blocked by a worker can still find that worker in search results. The `getPublicProfile` endpoint does check blocked status, creating an inconsistency.

**W-H7: Ratings Update Uses Query Param userId**  
In `ratings.controller.ts` line 64, the `updateRating` endpoint takes `userId` from a query parameter instead of from the JWT. While the service checks `rating.raterId !== userId`, the userId comes from an untrusted source. An attacker could pass another user's ID.

**W-H8: Offer Salary Validation Blocks Legitimate Salaries**  
Related to W-H5, the validation pipe enforces `salaryMax - salaryMin ≤ 5000`. For annual salaries in the Netherlands, a range of only €5,000 is very narrow. This will block legitimate employer offers and frustrate the hiring process.

### MEDIUM (9)

**W-M1: Worker/Offer Public ID Race Condition**  
The `generateWorkerPublicId` (`workers.service.ts` lines 1251-1265) and `generateOfferPublicId` (`offers.service.ts` lines 965-978) methods query for the last record and increment. Under concurrent requests, two workers could receive the same publicId. The `findUnique` query on publicId would then fail for the second insertion.

**W-M2: Offer Acceptance Allows Non-Accepted States**  
In `offers.service.ts` line 532, the acceptance check allows `SUBMITTED`, `VIEWED`, and `SHORTLISTED` statuses. While `VIEWED` makes sense, `SUBMITTED` means the worker hasn't even viewed it yet. Accepting without viewing could be unintentional.

**W-M3: Worker Can Rate Offers Not Yet Accepted**  
In `ratings.service.ts` line 67, `canRateStatuses` includes `VIEWED` and `SUBMITTED`. This allows workers to rate employers based on just viewing an offer, without any actual interaction. The `isVerifiedHire` flag correctly distinguishes these, but the rating itself could be based on minimal information.

**W-M4: getOfferForWorker Returns Full Employer User Data**  
In `offers.service.ts` lines 201-243, the worker's view of an offer includes the full `employer.user` object (including email). While this happens after acceptance which is appropriate, for non-accepted states (VIEWED, SHORTLISTED), this leaks the employer's email to the worker.

**W-M5: Processing Restriction Guard Not Globally Applied**  
The `ProcessingRestrictionGuard` exists but is not registered as a global guard in the app module. It only works when explicitly applied. Workers who have restricted processing can still make write requests to endpoints that don't have `@SkipProcessingRestrictionCheck` or the guard.

**W-M6: Messages Unread Count Logic Assumes Fixed Roles**  
In `messages.service.ts` lines 136-148, the service determines which unread counter to increment based on whether the recipient is `participant1Id` (worker) or `participant2Id` (employer). If the role assignment in conversations ever changes, the logic breaks silently.

**W-M7: No Pagination Limits on Sub-resource Endpoints**  
Workers can add unlimited skills, certifications, languages, education entries, and project experiences without any limit. This could be abused to create excessively large profiles that slow down queries.

**W-M8: Worker Deletion Doesn't Cascade**  
The `deleteWorkerProfile` method (`workers.service.ts` lines 882-890) soft-deletes only the worker record. Related data (skills, certifications, languages, education, project experiences, offers, conversations, ratings) are not handled. The worker's user account also remains active.

**W-M9: Auth /logout Doesn't Invalidate Access Tokens**  
The logout endpoint (`auth.controller.ts` lines 152-158) only revokes refresh tokens. The access token remains valid until it expires (1 hour). This is a known pattern but could be improved with a token blacklist.

### LOW (7)

**W-L1: Frontend Doesn't Handle Token Refresh**  
`AuthContext.tsx` doesn't implement refresh token logic. When the access token expires, the user is simply redirected to login. There's no automatic token refresh.

**W-L2: Frontend Stores userId and userRole in localStorage**  
These are stored separately from the JWT, creating a source of truth conflict. The role and userId should be decoded from the JWT instead.

**W-L3: updateProfile Doesn't Recalculate Safety Score on All Changes**  
The `updateWorkerProfile` method recalculates completeness and safety score, but individual sub-resource endpoints (skills, certifications, etc.) only recalculate completeness. Safety score recalculation is only done for certification changes.

**W-L4: Worker Dashboard Displays Incorrect Salary**  
The worker dashboard (`dashboard/worker/page.tsx` line 131) displays `desiredSalaryMin` as the main salary indicator, which is confusing UX since this is the worker's expectation, not what they earn.

**W-L5: Anonymous Profile Pipe May False-Trigger**  
The `isIdentifyingField` method (lines 199-218 in `anonymous-profile.pipe.ts`) checks if field names contain patterns like "name", "employer", "company". This could flag legitimate fields like "companyVehicle" in the offer data.

**W-L6: No Throttling on Worker Profile Endpoints**  
While auth endpoints have rate limiting (`@Throttle`), the worker CRUD endpoints (create profile, add skills, etc.) don't have rate limiting.

**W-L7: Support Controller Uses SupportGuard for Regular Users**  
The `SupportController` uses `@UseGuards(SupportGuard)`, which only allows ADMIN/SUPPORT. Workers cannot create support tickets through this controller. The frontend has pages for this but they would fail.

---

## 4. Gaps, Risks, and Edge Cases

### Architecture Gaps

- **No Global Role-Based Authorization**: The application relies on `JwtAuthGuard` for authentication but doesn't have a consistent role-based authorization layer. The `RolesGuard` exists but is not applied to worker-specific endpoints. Any authenticated user can access worker-only endpoints.

- **SELECTED_COMPANIES Visibility**: The frontend offers three visibility options, but `SELECTED_COMPANIES` is completely unimplemented on the backend. Workers who select this option effectively hide themselves from all employers with no way to selectively reveal their profile.

### Edge Cases

- **Concurrent Profile Creation**: Two rapid requests to create a worker profile could result in a race condition. The `findUnique` check might pass for both requests before either creates the record. The `publicId` generation also has a race condition.

- **Offer Counter Creates New Offer Without Version Linkage**: When a worker counters an offer, a new offer is created with the employer as the recipient. However, there's no explicit linkage back to the original offer in the data model (no `parentOfferId` or `counterOfferForId` field).

- **Deleting a Worker Profile While Offers Are Active**: A worker with active offers (SUBMITTED, VIEWED, SHORTLISTED) can soft-delete their profile. The profile becomes HIDDEN but the offers remain in those states. Employers might see stale offer data.

- **Concurrent Offer Submissions**: If two employers try to create offers to the same worker simultaneously, both will succeed. There is no limit on the number of offers a worker can receive.

### Security Risks

- **XSS in Offer Content**: Job descriptions and other text fields in offers are stored as plain text. The frontend renders them, but there's no server-side sanitization of user-provided content. Rich text or HTML in descriptions could pose XSS risks.

- **Privacy Risk: Employer Email Exposure**: In the `getOfferForWorker` method, the full employer user object (including email) is returned even for offers that haven't been accepted. This leaks employer contact information before the offer is accepted.

- **Race Condition: Offer Acceptance**: Two rapid accept requests for the same offer could potentially both succeed before the status check, though the database transaction should prevent this. However, there's no explicit locking mechanism.

### Missing Validation

- **Counter Offer Amounts**: The `CounterOfferDto` doesn't validate that `salaryMin` and `salaryMax` are within reasonable bounds. A worker could counter with a salary of €1 or €10 million.

---

## 5. Severity and Impact Assessment

| Severity | Count | Impact |
|----------|-------|--------|
| Critical | 5 | IDOR allowing unauthorized data access, missing role guards allowing privilege escalation, unimplemented feature misleading users |
| High | 8 | User impersonation in support tickets, email/phone verification bypass, salary validation blocking legitimate offers, missing authorization checks |
| Medium | 9 | Race conditions, data leakage in offer views, incomplete cascade on deletion, missing processing restriction enforcement |
| Low | 7 | Missing token refresh, localStorage concerns, false positive in anon pipe, no rate limiting on profile endpoints |

**Critical findings (W-C1 through W-C5) require immediate remediation** as they allow unauthorized access to user data and privilege escalation.

---

## 6. Recommendations for Further Investigation

1. **Manual Penetration Testing**: The IDOR vulnerabilities in notifications, auth/me, and ratings should be verified with actual API calls to confirm exploitability.

2. **Role Guard Audit**: Systematically review every endpoint in every controller and add `@Roles` decorators where appropriate. Workers should only access worker endpoints, employers only employer endpoints.

3. **Support Guard Verification**: Confirm that `support.guard.ts` properly restricts access to SUPPORT and ADMIN roles only, and that the worker-facing ticket creation path properly authenticates the user.

4. **SELECTED_COMPANIES Implementation**: Either implement the full feature (allow workers to specify which companies can see their profile) or remove the option from the frontend to avoid misleading users.

5. **Load Testing**: Test concurrent worker profile creation and offer public ID generation to confirm the race condition exists under load.

6. **Token Refresh Implementation**: Add proper refresh token handling to the frontend to avoid forced logouts.

7. **Input Sanitization**: Add server-side HTML/entity sanitization to all user-provided text fields (job descriptions, summaries, review texts) to prevent XSS.

8. **Processing Restriction Guard Integration**: Register the `ProcessingRestrictionGuard` globally in the app module, with `@SkipProcessingRestrictionCheck()` decorators on endpoints that must remain accessible (consent withdrawal, restriction removal, data export).

9. **Offer Response Sanitization**: In `getOfferForWorker`, strip employer user data down to only what's needed (company name, trade name) for non-accepted offers, and only reveal full contact details upon acceptance.

10. **Support Ticket userId Override**: The `CreateTicketDto.userId` should be overridden with `req.user.id` from the JWT in the controller, not accepted from the client.

### Key Files Requiring Changes

- `/apps/api/src/modules/notifications/notifications.controller.ts` — Use `req.user.id` instead of query param
- `/apps/api/src/modules/auth/auth.controller.ts` — Remove userId/userRole query params from /auth/me, use JWT
- `/apps/api/src/modules/workers/workers.controller.ts` — Add role guards
- `/apps/api/src/modules/offers/offers.controller.ts` — Add role guards for worker/employer actions
- `/apps/api/src/modules/ratings/ratings.controller.ts` — Use `req.user.id` for update rating
- `/apps/api/src/modules/offers/offers.service.ts` — Add status validation for counter offers
- `/apps/api/src/modules/workers/workers.service.ts` — Implement SELECTED_COMPANIES visibility
- `/apps/web/src/lib/api.ts` — Remove userId query params from API calls


# THE FIX
All 5 critical security issues have been fixed. Here's a summary of all changes:

---
W-C1: IDOR on Notifications API ✅

Problem: /notifications endpoints accepted userId as a query parameter, allowing any authenticated user to read, mark as read, or clear notifications for any other user.

Fix:
- notifications.controller.ts: Added @UseGuards(JwtAuthGuard) at the class level. Replaced all @Query('userId') parameters with @Request() req and extracted userId from req.user.id (the verified JWT token).
- api.ts (frontend): Removed userId query params from all notificationsApi methods. The Authorization: Bearer header (already sent via the request interceptor) is now the sole source of user identity.

---
W-C2: IDOR on GET /auth/me ✅

Problem: /auth/me took userId and userRole as query parameters, allowing any authenticated user to retrieve any other user's profile data.

Fix:
- auth.controller.ts: Added @UseGuards(JwtAuthGuard) and @Request() req to the getMe endpoint. User identity is now extracted from req.user.id (verified JWT) instead of query params.
- AuthContext.tsx (frontend): Removed userId and userRole from the /auth/me request. The JWT token (already in the Authorization header) is now the sole identity source.
- api.ts (frontend): Cleaned up all localStorage.removeItem('userId') and localStorage.removeItem('userRole') calls in the 401 handler and authApi.logout(). Client-side userId/userRole storage remains for convenience but is no longer trusted by the backend.

---
W-C3: No Role Guards on Worker Endpoints ✅

Problem: WorkersController only had @UseGuards(JwtAuthGuard) — no @Roles decorator. Any authenticated user (EMPLOYER, ADMIN, SUPPORT) could create a worker profile, update visibility, block companies, or delete a worker profile.

Fix:
- workers.controller.ts: Added RolesGuard import and @Roles('WORKER') decorator to all worker-only endpoints. Now only users with the WORKER role can:
    - Create/update/delete their worker profile
    - Manage skills, certifications, languages, education, project experiences
    - Block/unblock companies
    - Update visibility
    - Get their private profile
- Public endpoints (trades, specializations, skills, search, :publicId) remain accessible to all authenticated users as appropriate.
- Also injected PrismaService into the controller for employer ID resolution in search.

---
W-C4: Counter-Offer Missing State Validation ✅

Problem: The counterOffer method in offers.service.ts didn't validate that the offer was in a state that allows countering. A worker could counter a WITHDRAWN, ACCEPTED, REJECTED, or EXPIRED offer.

Fix:
- offers.service.ts: Added state validation before allowing a counter-offer. Only offers in SUBMITTED, VIEWED, or SHORTLISTED states can be countered. Offers in terminal states (DRAFT, ACCEPTED, REJECTED, EXPIRED, WITHDRAWN, COUNTERED) are rejected with a clear error message.

---
W-C5: SELECTED_COMPANIES Visibility Not Implemented ✅

Problem: When a worker set visibility to SELECTED_COMPANIES, getPublicProfile always threw NotFoundException. There was no mechanism for workers to specify which companies could see their profile.

Fix:
- Prisma schema: Added VisibleCompany model (join table between Worker and Employer with unique constraint on [workerId, employerId]). Added visibleCompanies relation to both Worker and Employer models. Created migration SQL.
- workers.service.ts:
    - getPublicProfile: Instead of blanket-throwing NotFoundException, now checks if the viewer employer ID is in the worker's visibleCompanies list. If the employer has been granted access, the profile is returned.
    - searchWorkers: Now accepts an optional employerId parameter. When provided, includes SELECTED_COMPANIES workers that have granted visibility to that employer in addition to ALL_VERIFIED workers.
    - getPrivateProfile: Now includes visibleCompanies in the response so workers can see which companies they've granted access to.
    - Added addVisibleCompany, removeVisibleCompany, getVisibleCompanies service methods.
    - Fixed updateVisibility to properly resolve userId → worker.id.
- workers.controller.ts: Added three new endpoints:
    - POST /workers/me/visible-companies — add a company to the visible list
    - DELETE /workers/me/visible-companies/:employerId — remove a company
    - GET /workers/me/visible-companies — list visible companies
    - All require WORKER role.
    - Search endpoint now resolves employer ID from JWT for SELECTED_COMPANIES visibility.
- Frontend (api.ts): Added addVisibleCompany, removeVisibleCompany, getVisibleCompanies API methods.
- Frontend (profile/edit/page.tsx): Added VisibleCompaniesManager component that appears when SELECTED_COMPANIES visibility is selected, allowing workers to add/remove employers.
- Frontend (profile/setup/page.tsx): Added a warning message when SELECTED_COMPANIES is selected, directing workers to manage visibility after profile creation.
- Frontend (profile/page.tsx): Added a note for SELECTED_COMPANIES profiles linking to visibility management settings.