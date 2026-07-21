# Support Role QA Report — OfferMarket Platform

**Date**: 2026-07-17  
**Role**: Support (SUPPORT)  
**Methodology**: Static code analysis tracing all support-facing workflows end-to-end through controllers, services, DTOs, guards, and frontend pages.

---

## 1. Processes Tested

| # | Workflow | Key Files |
|---|----------|-----------|
| 1 | Dashboard statistics | `support.controller.ts:16`, `support.service.ts:13-39`, `/support/page.tsx` |
| 2 | Ticket listing and filtering | `support.controller.ts:25-35`, `support.service.ts:46-81`, `/support/tickets/page.tsx` |
| 3 | Ticket detail view | `support.controller.ts:37-39`, `support.service.ts:83-106`, `/support/tickets/[id]/page.tsx` |
| 4 | Ticket creation | `support.controller.ts:55-58`, `support.service.ts:108-129`, `create-ticket.dto.ts`, `/support/new-ticket/page.tsx` |
| 5 | Ticket reply (internal notes) | `support.controller.ts:60-67`, `support.service.ts:131-167`, `/support/tickets/[id]/page.tsx:115-139` |
| 6 | Ticket status change | `support.controller.ts:69-76`, `support.service.ts:206-233`, `/support/tickets/[id]/page.tsx:142-161` |
| 7 | Ticket close | `support.controller.ts:78-84`, `support.service.ts:236-252` |
| 8 | Ticket resolve | `support.controller.ts:86-92`, `support.service.ts:255-271` |
| 9 | Ticket assignment | `support.controller.ts:94-100`, `support.service.ts:274-290`, `/support/tickets/[id]/page.tsx:163-186` |
| 10 | Ticket messages | `support.controller.ts:42-53`, `support.service.ts:170-204` |
| 11 | My tickets (self) | `support.controller.ts:156-167`, `support.service.ts:469-498` |
| 12 | User lookup by ID | `support.controller.ts:106-109`, `support.service.ts:296-321`, `/support/users/[id]/page.tsx` |
| 13 | User offers | `support.controller.ts:111-114`, `support.service.ts:323-375` |
| 14 | User tickets | `support.controller.ts:116-127`, `support.service.ts:469-498` |
| 15 | Conversation lookup | `support.controller.ts:129-132`, `support.service.ts:377-395` |
| 16 | Unblock company | `support.controller.ts:134-140`, `support.service.ts:397-431` |
| 17 | Extend offer expiry | `support.controller.ts:142-149`, `support.service.ts:434-463` |
| 18 | Trust/suspicious activity dashboard | `trust.controller.ts:127-129`, `trust.service.ts:1374-1406` |
| 19 | Trust/review suspicious activity | `trust.controller.ts:136-148`, `trust.service.ts:331-373` |
| 20 | Trust/fraud indicators CRUD | `trust.controller.ts:154-191`, `trust.service.ts:379-416` |
| 21 | Trust/duplicate account checks | `trust.controller.ts:200-214`, `trust.service.ts:480-596` |
| 22 | Trust/report suspicious activity | `trust.controller.ts:111-120`, `trust.service.ts:305-325` |
| 23 | Support user registration | `auth.controller.ts:71-75`, `auth.service.ts:138-186` |
| 24 | DSA content report submission | `dsa.controller.ts:58-72`, `dsa.service.ts:58-103` |
| 25 | DSA report status check | `dsa.controller.ts:79-82` |
| 26 | DSA my reports | `dsa.controller.ts:87-100` |
| 27 | DSA complaints | `dsa.controller.ts:234-289` |
| 28 | Notifications (REST) | `notifications.controller.ts` |
| 29 | Dashboard stats mismatch | `support.service.ts:13-39` vs `/support/page.tsx:8-14` |

---

## 2. Expected vs. Actual Behavior

### Dashboard Statistics

**Expected**: Frontend expects fields `totalTickets`, `openTickets`, `inProgressTickets`, `pendingUserTickets`, `resolvedTickets`, `closedTickets`.

**Actual**: Backend `getDashboardStats()` returns `openTickets`, `inProgressTickets`, `resolvedToday`, `totalUsers`, `pendingEmployerVerifications`. Only `openTickets` and `inProgressTickets` overlap. The frontend will show `undefined` for `totalTickets`, `pendingUserTickets`, `resolvedTickets`, and `closedTickets` — they will render as `0` because of `|| 0` fallbacks, but the data is wrong. `resolvedToday` and `totalUsers` and `pendingEmployerVerifications` from the backend are never displayed.

### Ticket Listing Search

**Expected**: Frontend sends `?search=<term>` to filter tickets.

**Actual**: Backend `getTickets()` only supports `status` query parameter. There is no `search`, `priority`, or `category` filter in the backend. The frontend sends these params but they are silently ignored. The priority and category dropdowns in the frontend filter UI will have no effect.

### User Search

**Expected**: Frontend `/support/users` page calls `GET /support/users?search=<term>` to search users by email or ID.

**Actual**: Backend only has `GET /support/users/:id` (get by ID). There is no search/list endpoint. The user search page will always return a 404 or error.

### Ticket Assignment

**Expected**: The assign modal in the frontend lets the user type a "support user ID" and immediately calls the assign API with that raw ID.

**Actual**: The `AssignTicketDto` only validates `@IsString() assignedToId: string`. There is no validation that the assigned user exists, or that they have a SUPPORT or ADMIN role. A support agent could assign a ticket to any user, including a worker or employer, or to a nonexistent UUID. The `assignTicket` service method does not validate the target user.

### Ticket Status Transitions

**Expected**: Only valid status transitions should be allowed (e.g., CLOSED tickets should not go back to OPEN).

**Actual**: `updateTicketStatus` validates that the status is in the list of valid statuses, but does not enforce any transition rules. A support agent can set a CLOSED ticket back to OPEN, or an IN_PROGRESS ticket directly to CLOSED, bypassing any workflow. The `closeTicket` and `resolveTicket` methods don't check if the ticket is already closed/resolved.

### Conversation Access (IDOR)

**Expected**: Support should only access conversations relevant to their duties.

**Actual**: `getConversationById` retrieves any conversation by ID with no access check. A support user can view any user's private conversation, including full message content, by simply guessing/iterating UUIDs. While this may be intended for support purposes, there is no audit trail for this access.

### User Data Exposure

**Expected**: Support should see user data relevant to helping them.

**Actual**: `getUserById` strips `passwordHash` and `twoFactorSecret` but exposes everything else: email, phone, full worker profile with skills/certifications, full employer profile with ratings, etc. This is excessive and may include data beyond what is necessary for support functions.

### Unblock Company Validation

**Expected**: Only the worker who blocked a company should be able to unblock, or support on the worker's behalf.

**Actual**: The endpoint `/support/users/:workerId/unblock/:employerId` correctly requires the block record to exist and logs the action. However, there is no validation that the `workerId` corresponds to an actual worker or that the `employerId` corresponds to an actual employer. Invalid UUIDs will result in a generic "Block record not found" rather than a more helpful error.

### Extend Offer Expiry Validation

**Expected**: The `days` parameter should be validated (positive, reasonable maximum).

**Actual**: The `extendOfferExpiry` method takes `days` as a raw number from `@Body('days')`. There is no DTO validation. A support user could pass a negative number, 0, or an extremely large number (e.g., 999999 days). No minimum/maximum validation exists. Additionally, an expired offer can still have its expiry extended, which may be unintended.

### Trust Module Access for SUPPORT

**Expected**: SUPPORT should view suspicious activity and help review it, but not perform destructive actions.

**Actual**: The `@Roles('ADMIN', 'SUPPORT')` guard on suspicious activity review, fraud indicator CRUD, and duplicate checking gives SUPPORT the same abilities as ADMIN, including confirming fraud, creating fraud indicators, and marking duplicates. This is overly broad. The duplicate review endpoint (`PUT /trust/duplicates/:primaryUserId/:suspectedUserId/review`) is correctly ADMIN-only. Blacklist management is also correctly ADMIN-only.

### DSA Module Access

**Expected**: Per the platform's DSA compliance requirements, SUPPORT should access DSA content report assessment and review.

**Actual**: All DSA admin endpoints (`GET/POST /dsa/admin/*`) use `AdminGuard`, which only allows ADMIN role. SUPPORT users are completely blocked from DSA content moderation, assessment, action, resolution, escalation, statement of reasons, misuse tracking, and transparency report generation. This is a significant access gap if SUPPORT is expected to handle DSA content reports.

### Notifications — No Auth

**Expected**: Notification endpoints should require authentication.

**Actual**: `NotificationsController` has NO guards. The endpoints `GET /notifications?userId=...`, `PATCH /notifications/:id/read?userId=...`, etc. are completely unauthenticated. Any caller can read any user's notifications or mark them as read by simply providing the `userId` query parameter. This is a critical security issue.

### Auth — Register Support Endpoint

**Expected**: Only admins should create support users.

**Actual**: `POST /auth/register/support` requires an `adminUserId` in the DTO and validates the admin role in the service. However, this endpoint has NO authentication guard. Any unauthenticated caller who knows an admin's user ID can create a support account. The `adminUserId` is taken from the request body, not from the JWT token.

### Auth — Get Current User

**Expected**: Should require authentication.

**Actual**: `GET /auth/me` takes `userId` and `userRole` as query parameters with no authentication. Anyone can query any user's basic info by providing their ID.

---

## 3. Errors and Issues Found

### CRITICAL (4)

**S-C1: Unauthenticated Support User Registration**  
`POST /auth/register/support` (`auth.controller.ts:71-75`) has no `JwtAuthGuard` or `AdminGuard`. The `adminUserId` is passed in the request body and verified against the database, but anyone can call this endpoint. An attacker can create support accounts if they know any admin's user ID. IDs are UUIDs, which are hard to guess, but this is still a broken authentication pattern.

**S-C2: Unauthenticated Notification Endpoints**  
All `NotificationsController` endpoints (`GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`) have NO authentication guards. They rely on a `userId` query parameter. Any caller can read, mark as read, or count any user's notifications. This is a severe IDOR and privacy violation.

**S-C3: Unauthenticated User Info Endpoint**  
`GET /auth/me?userId=...&userRole=...` (`auth.controller.ts:30-33`) has no authentication guard. It returns user ID, role, email, email verification status, phone, and phone verification status for any user whose ID is provided.

**S-C4: SUPPORT Locked Out of DSA Admin Endpoints**  
All DSA admin endpoints use `AdminGuard` (ADMIN-only), not `RolesGuard` with ADMIN+SUPPORT. If SUPPORT is supposed to handle content reports per DSA Art. 16-17, this is a complete access denial. SUPPORT users cannot assess, action, resolve, escalate content reports, create statements of reasons, manage misuse, or generate transparency reports.

### HIGH (6)

**S-H1: Ticket Assignment Has No User Validation**  
`assignTicket` (`support.service.ts:274-290`) does not verify that `assignedToId` corresponds to a real user, or that the user has ADMIN/SUPPORT role. Any string is accepted, creating broken references.

**S-H2: No Status Transition Enforcement**  
`updateTicketStatus` (`support.service.ts:206-233`) allows any transition between valid statuses. A CLOSED ticket can be set to OPEN. `resolveTicket` and `closeTicket` don't check current status, so they can be called on already closed/resolved tickets, overwriting `resolvedAt` and `resolvedById`.

**S-H3: Dashboard Stats Mismatch Between Frontend and Backend**  
Backend returns `resolvedToday`, `totalUsers`, `pendingEmployerVerifications` but frontend expects `totalTickets`, `pendingUserTickets`, `resolvedTickets`, `closedTickets`. Dashboard will display incorrect/zeroed data.
- `support.service.ts:13-39` vs `/support/page.tsx:8-14`

**S-H4: Missing User Search Endpoint**  
Frontend `/support/users/page.tsx` calls `GET /support/users?search=...` but backend only has `GET /support/users/:id`. There is no search/list functionality. User lookup page will always fail.

**S-H5: Conversation Access Without Ownership Check or Audit**  
`getConversationById` (`support.service.ts:377-395`) retrieves any conversation by ID with full message history. While arguably needed for support duties, there is no logging/audit trail of which support agent accessed which conversation and when.

**S-H6: Offer Expiry Extension Has No Validation**  
The `days` parameter (`support.controller.ts:142-149`) has no DTO validation. Negative, zero, or extreme values are accepted. Expired offers can have their expiry extended.

### MEDIUM (7)

**S-M1: SUPPORT Can Access All Trust Fraud Endpoints**  
`trust.controller.ts:127-148,154-191`: SUPPORT can review suspicious activity, create/update fraud indicators, check duplicates, and record duplicate matches. Some of these should arguably be ADMIN-only (e.g., confirming fraud indicators with `isConfirmed: true`).

**S-M2: Ticket Creation on Behalf of Any User**  
`CreateTicketDto` takes a `userId` field, allowing support to create tickets attributed to any user. There is no validation that the user exists or is a real worker/employer. A typo in the UUID would create an orphan ticket.

**S-M3: No Rate Limiting on Support Endpoints**  
The support controller has no throttle guards. A support agent (or compromised account) could spam ticket creation, replies, or status changes without rate limiting.

**S-M4: Frontend Sends Unsupported Filter Params**  
`/support/tickets/page.tsx:40-47` sends `search`, `priority`, and `category` query parameters, but the backend only supports `status`. These are silently ignored, so the filter dropdowns for priority and category do nothing.

**S-M5: My-Tickets Endpoint Returns Wrong Scope**  
`GET /support/my-tickets` (`support.controller.ts:156-167`) returns tickets for `req.user.id`, but since the entire controller is behind `SupportGuard` (ADMIN+SUPPORT), this would return the support agent's own tickets, not the tickets they are assigned to.

**S-M6: Reply on RESOLVED Ticket Allowed**  
Only CLOSED status blocks replies in `support.service.ts:131-167`. A RESOLVED ticket can still receive replies, which may be unintended since RESOLVED typically means the issue is finished.

**S-M7: HTTP Method Inconsistency**  
Status changes (`POST /tickets/:id/status`) and assignment (`PATCH /tickets/:id/assign`) both modify existing resources. The status change should arguably be a `PATCH` since it's a partial update, and the HTTP method is inconsistent between the two.

### LOW (7)

**S-L1: Ticket Number Race Condition**  
`support.service.ts:109-111`: The ticket number format `SUP-{year}-{count+1}` uses `count()` before the `create()`. Under concurrent creation, two tickets could receive the same number. The `@unique` constraint would then cause one to fail, but the error would be unhandled.

**S-L2: Pagination Page/Limit Type Safety**  
`support.controller.ts:26-35`: `parseInt(page)` and `parseInt(limit)` with no validation could result in NaN being passed to the service if non-numeric strings are provided.

**S-L3: Poor Assign Modal UX**  
`/support/tickets/[id]/page.tsx:484-499`: The assignment modal asks for a raw "support user ID" (UUID). There is no user lookup, autocomplete, or listing of available support agents. This will lead to typos and failed assignments.

**S-L4: Unassign Sends Empty String**  
`/support/tickets/[id]/page.tsx:184-186`: The `handleUnassign` function calls `handleAssign("")`, which sends `{ assignedToId: "" }` to the backend. This will set `assignedToId` to an empty string rather than `null`, potentially breaking foreign key constraints or causing query issues.

**S-L5: Missing Frontend Pages for Key Features**  
The support frontend only covers tickets, dashboard, and user lookup. There are no UI pages for:
- Viewing suspicious activity dashboard (trust module)
- Managing fraud indicators
- Checking duplicate accounts
- DSA content report assessment
- Viewing/moderating user conversations
- Unblocking companies
- Extending offer expiry dates

**S-L6: Misleading adminId Field**  
`support.service.ts:421,453`: The `adminAction.adminId` is set to the support user's ID. The field name `adminId` is misleading since support users are not admins. This could cause confusion in audit logs.

**S-L7: Conversation Access Path Separation**  
`messages.controller.ts` and `messages.service.ts:61-93`: The `getConversation` method verifies that the user is a participant. Support cannot access conversations through the regular messages endpoint, only through `support/conversations/:id`. This is correct but worth noting that support has a separate path with no ownership verification.

---

## 4. Gaps, Risks, and Edge Cases

### Gaps

1. **No Support-Specific DSA Access**: DSA admin endpoints are ADMIN-only. If SUPPORT should handle DSA content reports, the `AdminGuard` on DSA admin routes should be replaced with `RolesGuard` with `@Roles('ADMIN', 'SUPPORT')`.

2. **No User Search Functionality**: The user lookup page in the frontend is non-functional because there is no `GET /support/users?search=...` endpoint. Only exact ID lookup works.

3. **No Audit Trail for Support Data Access**: When a support agent views a user's profile, offers, tickets, or conversations, there is no logging of this access. GDPR and privacy best practices suggest logging who accessed what and when.

4. **No Notification to Users When Support Acts**: When a support agent changes a ticket status, resolves a ticket, extends an offer, or unblocks a company, there is no notification to the affected user. The `NotificationsService` is not integrated with the support module.

5. **Missing Support Pages for Key Features**: The frontend has no pages for trust/fraud management, DSA reports, conversation access, unblocking companies, or extending offer expiry. These backend capabilities are unreachable from the UI.

### Risks

6. **Privilege Escalation via Trust Endpoints**: SUPPORT users can create fraud indicators with `isConfirmed: true` and confidence scores of 100, effectively marking entities as confirmed fraud without admin oversight. They can also review suspicious activity and set status to CONFIRMED, which auto-creates fraud indicators.

7. **Race Condition on Ticket Numbers**: Under concurrent ticket creation, duplicate ticket numbers could be attempted (mitigated by the `@unique` constraint, but the error is not gracefully handled).

8. **IDOR on Conversations**: Any authenticated SUPPORT user can view any conversation by UUID. While this may be intended, it should be rate-limited and logged.

9. **IDOR on User Profiles**: Any authenticated SUPPORT user can view any user's full profile including sensitive data by UUID.

10. **Unvalidated Offer Expiry Extension**: A support agent could extend an offer by 999999 days, effectively making it never expire.

### Edge Cases

11. **Concurrent Ticket Updates**: Two support agents updating the same ticket status simultaneously could overwrite each other's changes. There is no optimistic concurrency control.

12. **Assigning Ticket to Non-Existent User**: No validation means the ticket's `assignedToId` would reference a nonexistent user, causing foreign key violations or null pointer errors in the frontend.

13. **Unblocking a Non-Existent Block**: Handled correctly with a `NotFoundException`, but the error message does not distinguish between "no block found" and "worker/employer not found."

14. **Extending an Already-Expired Offer**: The service extends `offer.expiresAt` by adding days to the current expiry. If the offer is already expired, the new date would still be in the past if only 1 day is added. No check ensures the resulting date is in the future.

15. **Creating a Ticket for a Non-Existent User**: The `createTicket` method does not validate that `userId` references a real user. If a typo occurs, an orphan ticket is created.

---

## 5. Severity and Impact Assessment

| Severity | Count | Issues |
|----------|-------|--------|
| **Critical** | 4 | Unauthenticated support registration (#1), Unauthenticated notifications (#2), Unauthenticated user info (#3), SUPPORT locked out of DSA admin endpoints (#4) |
| **High** | 6 | No assignment validation (#5), No status transition rules (#6), Dashboard stats mismatch (#7), Missing user search endpoint (#8), No conversation access audit (#9), No validation on offer extension (#10) |
| **Medium** | 7 | Excessive trust access for SUPPORT (#11), No user existence validation on ticket create (#12), No rate limiting (#13), Frontend filter params ignored (#14), My-tickets scope issue (#15), Reply on RESOLVED tickets (#16), HTTP method inconsistency (#17) |
| **Low** | 7 | Ticket number race condition (#18), Page/limit NaN (#19), Poor assign UX (#20), Empty string unassign (#21), Missing frontend pages (#22), Misleading adminId field (#23), Conversation access path separation (#24) |

**Overall Assessment**: The support module has a functional core but significant issues in authentication gaps (3 endpoints without auth), authorization gaps (SUPPORT locked out of DSA), data validation (assignment, status transitions, offer extension), and frontend-backend mismatches (dashboard stats, user search, filter params). The most urgent items are the 4 critical issues that expose user data or allow unauthorized account creation.

---

## 6. Recommendations for Further Investigation

1. **Manual Testing of Unauthenticated Endpoints**: Confirm that `POST /auth/register/support`, `GET /auth/me`, and all notification endpoints are accessible without any token. Test with curl/Postman.

2. **Load Test Ticket Number Generation**: Create tickets concurrently to verify the `@unique` constraint catches duplicates and that the error is handled gracefully.

3. **Test DSA Content Report Flow as SUPPORT User**: Attempt all `/dsa/admin/*` endpoints with a SUPPORT JWT to confirm they are blocked. Then verify whether there is an alternative path for SUPPORT to handle content reports.

4. **Verify Notification WebSocket Authentication**: The `NotificationsGateway` accepts `userId` from handshake query/auth without verifying a JWT. Test whether a malicious client can subscribe to another user's notification channel.

5. **Audit Trail Review**: Confirm whether `AdminAction` records are being created for all support actions (unblock, extend offer) and whether they are accessible via the admin audit log endpoint.

6. **Frontend-Backend Contract Testing**: Build and run the frontend against the backend to confirm all dashboard stats, user search, and ticket filter features match the API responses.

7. **Rate Limiting Audit**: Review all support and trust endpoints for throttler configuration to prevent abuse of ticket creation, user lookups, and fraud indicator creation.

8. **GDPR Compliance Review**: Have a privacy expert review the support module's access to user profiles, conversations, and offers for compliance with data minimization and purpose limitation principles under Dutch and EU law.

9. **Verify Support Registration in Production**: Check whether `ADMIN_REGISTRATION_CODE` environment variable is set and whether the `registerSupport` endpoint is network-restricted (behind a VPN/admin network) even though it lacks application-level auth.

10. **Test Offer Expiry Extension Edge Cases**: Try extending an expired offer, extending by 0 days, extending by negative days, and extending by very large numbers to confirm the service handles these correctly or rejects them.