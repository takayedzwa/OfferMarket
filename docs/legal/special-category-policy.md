# Special Category Data Policy

**GDPR Article 9 — Processing of Special Categories of Personal Data**

*Last updated: July 11, 2026*
*Controller: OfferMarket B.V.*

---

## 1. Overview

Under GDPR Article 9, the processing of special categories of personal data is prohibited unless one of the exceptions in Article 9(2) applies. On the OfferMarket platform, the primary special category data we process is **work authorization status**, which reveals immigration status and, by extension, national origin.

---

## 2. Special Category Data on OfferMarket

### 2.1 Work Authorization (Immigration Status)

The `workAuthorization` field in worker profiles contains one of:
- `EU_CITIZEN` — Indicates EU/EEA national
- `DUTCH_WORK_PERMIT` — Indicates non-EU national with Dutch work authorization
- `HIGHLY_SKILLED_MIGRANT` — Indicates non-EU national under the highly skilled migrant program
- `REQUIRES_SPONSORSHIP` — Indicates need for employer visa sponsorship

**This data directly reveals immigration status and indirectly reveals national origin, which is special category data under Article 9(1).**

### 2.2 Potentially Special Category Data in Free-Text Fields

Workers may inadvertently include special category data in free-text profile fields:
- Nationality/ethnic origin in summary or description
- Gender indicators in profile text
- Health information (disabilities, medical conditions)
- Union membership
- Political opinions

**Policy:** We do NOT request, encourage, or process this data. Our profile forms explicitly warn against entering special category data.

---

## 3. Legal Basis for Processing

### 3.1 Work Authorization — Explicit Consent (Art. 9(2)(a))

Work authorization is processed under **explicit consent** only. This means:

1. Workers must **actively check** a consent checkbox to share their work authorization status
2. The consent is **separate** from other consents (not bundled)
3. The consent text **clearly explains** that this data reveals immigration status
4. Workers can **withdraw consent at any time** through the Privacy Dashboard
5. Withdrawal of consent **does not affect** other platform functionality

**Implementation:**
- `immigrationConsentGiven` boolean on Worker model
- `immigrationConsentAt` timestamp on Worker model
- When consent is withdrawn, `workAuthorization` is set to `null` (not deleted — it can be re-granted)
- `hasWorkAuthorization` binary flag remains visible (true/false) as it does not reveal immigration status

### 3.2 Verification Documents — Legal Obligation (Art. 9(2)(b))

Employer KvK verification documents are processed under legal obligation (Dutch law requires KvK registration for businesses).

Worker certification documents are processed under explicit consent.

---

## 4. Processing Rules

### 4.1 Collection Rules

| Data | Collection Method | Consent Required | Default State |
|------|-------------------|-----------------|---------------|
| Work authorization type | Optional dropdown | ✅ Explicit (Art. 9) | Null — not shown to employers |
| hasWorkAuthorization | Automatic binary | ❌ Not required | Shown as true/false |
| Photos in profiles | NOT COLLECTED | N/A | N/A |
| Nationality | NOT COLLECTED | N/A | N/A |
| Gender | NOT COLLECTED | N/A | N/A |
| Health info | NOT COLLECTED | N/A | N/A |
| Union membership | NOT COLLECTED | N/A | N/A |

### 4.2 Storage Rules

- Work authorization data is stored in the `Worker` model with `immigrationConsentGiven` flag
- Consent records are stored in the `Consent` model with type `SPECIAL_CATEGORY`
- All access to work authorization data is logged in `AuditLog` with `legalBasis` field

### 4.3 Access Rules

| Viewer | Can See Work Authorization? | Conditions |
|--------|------------------------------|------------|
| Worker (own profile) | ✅ Yes | Always |
| Employer (anonymous profile) | ❌ No | Only `hasWorkAuthorization` boolean shown |
| Employer (after offer acceptance) | ✅ Yes | Only if worker gave explicit consent |
| Admin | ✅ Yes | Logged in audit trail |
| Support | ✅ Yes | Logged in audit trail, time-limited |

### 4.4 Deletion Rules

- Upon consent withdrawal: `workAuthorization` set to null
- Upon account deletion: all special category data permanently deleted
- Verification documents: deleted from S3 30 days after verification

---

## 5. Consent Flow

### 5.1 Granting Consent

1. Worker navigates to profile setup or privacy dashboard
2. Worker sees a clearly labeled consent section:
   > "I consent to the processing of my work authorization status (which may reveal my immigration status) for the purpose of matching with employers. This is special category data under AVG Article 9. I can withdraw this consent at any time."
3. Worker checks the checkbox
4. `immigrationConsentGiven` is set to `true`
5. `immigrationConsentAt` is timestamped
6. A `Consent` record is created with type `SPECIAL_CATEGORY`, legal basis `EXPLICIT_CONSENT`

### 5.2 Withdrawing Consent

1. Worker navigates to Privacy Dashboard → Consents
2. Worker toggles the "Work Authorization" consent off
3. `immigrationConsentGiven` is set to `false`
4. `workAuthorization` is set to `null`
5. The `Consent` record's `withdrawnAt` is timestamped
6. An `AuditLog` entry is created documenting the withdrawal
7. Worker's anonymous profile immediately stops showing work authorization detail

### 5.3 Re-granting Consent

Workers can re-grant consent at any time. When they do:
1. Worker selects a new work authorization value from the dropdown
2. Worker checks the consent checkbox again
3. `immigrationConsentGiven` is set to `true` with new timestamp
4. A new `Consent` record is created

---

## 6. Monitoring and Audit

### 6.1 Regular Checks

- **Monthly:** Audit log review for unauthorized access to work authorization data
- **Quarterly:** Review consent withdrawal patterns and processing restriction requests
- **Annually:** Full DPIA review

### 6.2 Key Metrics

- Percentage of workers who have granted special category consent
- Number of consent withdrawals per month
- Number of admin/support accesses to work authorization data
- Time between consent withdrawal and data nullification (should be immediate)

---

## 7. Data Subject Rights for Special Category Data

| Right | How It Applies | Implementation |
|-------|---------------|----------------|
| Access (Art. 15) | Workers can see all their data including work authorization | `/privacy/my-data` |
| Rectification (Art. 16) | Workers can correct their work authorization status | Profile edit + `/privacy/request/rectification` |
| Erasure (Art. 17) | Workers can request deletion of work authorization data | `/privacy/request/erasure` — special category data is prioritized for immediate deletion |
| Restriction (Art. 18) | Workers can restrict processing of work authorization data | `/privacy/restriction-status` |
| Portability (Art. 20) | Workers can export their data including work authorization | `/privacy/export` |
| Object (Art. 21) | Workers can object to processing of work authorization | Withdraw consent via Privacy Dashboard |

---

## 8. Staff Guidelines

### 8.1 DO

- ✅ Always check `immigrationConsentGiven` before accessing work authorization data
- ✅ Log all access to special category data in the audit trail
- ✅ Refer to this policy when handling data subject requests involving work authorization
- ✅ Treat work authorization data as strictly confidential

### 8.2 DON'T

- ❌ Never discuss a worker's immigration status outside of necessary business context
- ❌ Never share work authorization data with third parties without explicit consent
- ❌ Never make hiring/firing decisions based solely on work authorization status (this may constitute discrimination under Dutch law)
- ❌ Never store special category data outside of the designated database fields

---

## 9. Violations

Violations of this policy may result in:
- Disciplinary action up to and including termination
- Reporting to the Autoriteit Persoonsgegevens
- Potential fines under the AVG (up to €20 million or 4% of annual global turnover)

---

*This policy is reviewed annually by the DPO and updated as needed.*