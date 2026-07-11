# Data Subject Rights Procedure

**GDPR Articles 15-22 — Data Subject Rights**

*Last updated: July 11, 2026*
*Controller: OfferMarket B.V.*

---

## 1. Overview

Under the AVG (Algemene Verordening Gegevensbescherming / GDPR), data subjects have specific rights regarding their personal data. This document describes how OfferMarket handles each right request.

---

## 2. Right of Access (Article 15)

### What it means
Data subjects have the right to obtain confirmation that their data is being processed, and to access that data along with information about the processing.

### How to exercise
- **Self-service:** Privacy Dashboard → "Download My Data" (`/privacy/export`)
- **API:** `GET /privacy/my-data`
- **Email:** dpo@offermarket.nl

### What we provide
- All personal data we hold about the data subject
- The purposes of processing
- The categories of data concerned
- The recipients or categories of recipients
- The retention period
- Information about the source of the data
- Information about automated decision-making
- The right to lodge a complaint with the Autoriteit Persoonsgegevens

### Response time
Within **30 days** of the request.

### Verification
Identity verification via authenticated session or email verification.

---

## 3. Right to Rectification (Article 16)

### What it means
Data subjects have the right to have inaccurate personal data corrected.

### How to exercise
- **Self-service:** Profile settings → edit fields directly
- **API:** `POST /privacy/request/rectification`
- **Email:** dpo@offermarket.nl

### What we do
1. Verify the data is inaccurate
2. Correct the data
3. Notify any recipients of the correction
4. Respond within **30 days**

### Special cases
- If the data subject believes data is inaccurate but we cannot verify, we mark the data as disputed
- Verification documents (certificates, ID) require admin review before correction

---

## 4. Right to Erasure (Article 17)

### What it means
Data subjects have the right to have their personal data deleted ("right to be forgotten").

### How to exercise
- **Self-service:** Privacy Dashboard → "Delete Account" (`/privacy/delete`)
- **API:** `POST /privacy/request/erasure`

### Process
1. User requests deletion
2. **30-day grace period** begins — user can cancel
3. After grace period, account data is anonymized/deleted
4. User is notified that deletion is complete

### What gets deleted
- Email → anonymized to `deleted-{uuid}@offermarket.nl`
- Password → replaced with random hash
- Phone → set to null
- Worker profile → soft deleted, PII fields nullified
- Messages → anonymized (content replaced)
- Notifications → deleted
- Consent records → marked as withdrawn, retained for 7 years
- Verification documents → deleted from storage

### What is retained (legal obligation)
- Invoices → retained for 7 years (Dutch tax law BW 7:44)
- KvK number → retained for 7 years
- Audit logs → retained for 7 years (anonymized)
- Consent withdrawal records → retained for 7 years

### Exceptions
We may refuse erasure when:
- Processing is necessary for compliance with a legal obligation
- Processing is necessary for the establishment, exercise, or defense of legal claims
- The data must be retained under Dutch tax law

---

## 5. Right to Restriction of Processing (Article 18)

### What it means
Data subjects can request that we restrict processing of their data while a dispute is being resolved.

### How to exercise
- **Self-service:** Privacy Dashboard → "Restriction" toggle
- **API:** `POST /privacy/restriction-status`

### What happens
1. `processingRestricted` flag is set on `UserGdprFlags`
2. All data processing except storage is stopped
3. The user's profile becomes invisible to employers
4. No offers can be sent to the user
5. The user can still access their own data

### Duration
Until the user removes the restriction or the dispute is resolved.

---

## 6. Right to Data Portability (Article 20)

### What it means
Data subjects have the right to receive their personal data in a structured, commonly used, machine-readable format.

### How to exercise
- **Self-service:** Privacy Dashboard → "Export Data" (`/privacy/export`)
- **API:** `POST /privacy/export`

### Format
- **Primary:** JSON (machine-readable)
- **Secondary:** CSV (human-readable spreadsheet)

### What is included
- Profile data
- Skills and certifications
- Education and work experience
- Offers sent and received
- Messages (user's own only)
- Consent records

### What is NOT included
- Other users' data
- Internal system data
- Derived analytics data

### Response time
- Export is generated asynchronously
- Available for download within **24 hours**
- Download link expires after **30 days**

---

## 7. Right to Object (Article 21)

### What it means
Data subjects have the right to object to processing based on legitimate interest or for direct marketing.

### How to exercise
- **API:** `POST /privacy/request/object`
- **Email:** dpo@offermarket.nl

### What happens
1. We assess whether our legitimate interests override the data subject's rights
2. If the objection is upheld, processing is stopped
3. The data subject is notified of the outcome

### Specific objections
- **Marketing:** Objecting to marketing processing is absolute — we must stop immediately
- **Legitimate interest:** We must demonstrate compelling legitimate grounds that override the data subject's interests
- **Profiling:** Objecting to profiling stops any automated decision-making

---

## 8. Right to Withdraw Consent (Article 7(3))

### What it means
Where processing is based on consent, data subjects can withdraw consent at any time. Withdrawal must be as easy as giving consent.

### How to exercise
- **Self-service:** Privacy Dashboard → "Consents" (`/privacy/consent`)
- **API:** `DELETE /privacy/consents/{type}`
- **Email:** dpo@offermarket.nl

### What happens
1. Consent record is updated with `withdrawnAt` timestamp
2. Processing based on that consent stops immediately
3. For `SPECIAL_CATEGORY` (work authorization): the `workAuthorization` field is set to null
4. For `COOKIE_ANALYTICS`: PostHog tracking is disabled
5. For `MARKETING`: marketing emails are stopped

### Effect on service
- Withdrawing required consents (privacy policy, terms, data processing) may limit ability to use the platform
- Withdrawing optional consents (analytics, marketing) has no impact on core functionality
- Withdrawing `SPECIAL_CATEGORY` consent only hides work authorization detail — the profile remains visible

---

## 9. Handling Requests

### 9.1 Request Flow

```
Request received → Identity verification → Log request → Process request →
Notify data subject → Close request
```

### 9.2 Identity Verification

All data subject requests require identity verification:
- **Authenticated users:** Verified via session (most requests)
- **Unauthenticated users:** Email verification + additional identity proof
- **Children (< 16):** Parental consent required (Netherlands age of digital consent)

### 9.3 Time Limits

| Right | Response Time | Extension |
|-------|--------------|-----------|
| Access | 30 days | +30 days if complex |
| Rectification | 30 days | +30 days if complex |
| Erasure | 30 days (grace period + execution) | N/A |
| Restriction | Immediate (system flag) | N/A |
| Portability | 30 days | +30 days if complex |
| Objection | 30 days | +30 days if complex |
| Withdraw consent | Immediate | N/A |

### 9.4 Logging

All data subject requests are logged in the `DataSubjectRequest` model with:
- Request type
- Request date
- Response date
- Outcome
- Any actions taken

---

## 10. Complaints

If a data subject is not satisfied with our response, they have the right to lodge a complaint with:

**Autoriteit Persoonsgegevens (Dutch DPA)**
- Website: https://autoriteitpersoonsgegevens.nl
- Phone: +31 (0)88 1805 250
- Address: Postbus 93374, 2509 AJ Den Haag

---

*This procedure is reviewed annually by the DPO.*