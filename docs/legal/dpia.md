# Data Protection Impact Assessment (DPIA)

**GDPR Article 35 — Data Protection Impact Assessment**

*Last updated: July 11, 2026*
*Controller: OfferMarket B.V.*

---

## 1. Introduction

This DPIA assesses the data protection risks associated with OfferMarket's processing of personal data, with particular attention to **special category data** (work authorization status revealing immigration origin) under GDPR Article 9.

A DPIA is required when processing is likely to result in a high risk to the rights and freedoms of data subjects, including:
- Systematic evaluation of personal aspects (profiling)
- Processing of special categories of data on a large scale
- Systematic monitoring of a publicly accessible area

---

## 2. Description of Processing

### 2.1 Overview

OfferMarket is a reverse talent marketplace for electricians in the Netherlands. The platform connects workers (electricians) with employers (companies) through anonymous worker profiles that are only revealed upon mutual acceptance of an offer.

### 2.2 Data Flow

```
Worker registers → Creates anonymous profile → Employer discovers profile →
Employer sends offer → Worker accepts → Identity revealed → Contract formed
```

### 2.3 Data Categories Processed

| Category | Examples | Sensitivity |
|----------|----------|-------------|
| Identity data | Name, email, phone | Standard |
| Professional data | Skills, experience, certifications | Standard |
| **Special category** | **Work authorization (immigration status)** | **High** |
| Communication data | Messages between users | Standard |
| Financial data | Invoices, payment records | Standard |
| Verification data | ID documents, certificates | High |
| Technical data | IP addresses, browser data | Low |

### 2.4 Special Category Data Processing

**Work Authorization Field:**

The `workAuthorization` enum contains values:
- `EU_CITIZEN` — Reveals likely EU/EEA nationality
- `DUTCH_WORK_PERMIT` — Reveals non-EU national with Dutch authorization
- `HIGHLY_SKILLED_MIGRANT` — Reveals non-EU national under specific visa program
- `REQUIRES_SPONSORSHIP` — Reveals need for work visa sponsorship

This data directly reveals **immigration status** and indirectly **national origin**, which are special categories under GDPR Article 9(1).

**Legal basis:** Explicit consent (Article 9(2)(a)) — only processed when the worker has given explicit, informed consent via the `immigrationConsentGiven` flag.

**Mitigation:** Without consent, only a binary `hasWorkAuthorization` flag (true/false) is shown to employers, which does not reveal immigration status.

---

## 3. Necessity and Proportionality

### 3.1 Why This Processing Is Necessary

- Employers need to know if a worker is authorized to work in the Netherlands
- This is a legitimate business requirement for hiring in the Netherlands
- The binary `hasWorkAuthorization` flag provides minimal information sufficient for initial screening
- Detailed work authorization type is only necessary at the contract formation stage

### 3.2 Proportionality Assessment

| Approach | Proportionality |
|----------|----------------|
| **Current: Binary flag + consent-gated detail** | ✅ Proportionate — minimal data by default, detail only with explicit consent |
| Showing all work authorization to all employers | ❌ Disproportionate — reveals immigration status unnecessarily |
| Not collecting work authorization at all | ❌ Under-proportionate — employers have legitimate need for work eligibility info |
| Collecting nationality directly | ❌ Disproportionate — far more data than needed |

### 3.3 Less Intrusive Alternatives Considered

1. **Only binary yes/no** — Insufficient for employers who need to verify work eligibility type at offer stage
2. **Verification without storage** — Requires repeated verification, creating friction and potential for discrimination
3. **Employer self-certification** — Unreliable; workers could misrepresent status

**Conclusion:** Current approach (binary flag + consent-gated detail) is the most proportionate solution.

---

## 4. Risk Assessment

### 4.1 Risks to Data Subjects

| Risk | Likelihood | Impact | Risk Level | Mitigation |
|------|-----------|--------|------------|------------|
| **Discrimination based on work authorization** | Medium | High | **High** | Anonymous profiles until offer acceptance; consent-gated exposure |
| **Re-identification from anonymous profile** | Low | High | Medium | Strict field whitelisting; no identifying info in anonymous profiles |
| **Unauthorized access to special category data** | Low | High | Medium | Explicit consent required; field not included in search results |
| **Data breach exposing work authorization** | Low | Very High | Medium | Encryption at rest and in transit; access controls |
| **Profiling based on work authorization** | Medium | High | **High** | No search/filter by work authorization type; only binary flag |
| **Inferred nationality from other data** | Medium | Medium | Medium | Content moderation; warning against entering nationality in free-text |
| **Consent fatigue leading to unnecessary data sharing** | Medium | Medium | Medium | Granular consent; clear explanations; easy withdrawal |

### 4.2 Risks to Controller

| Risk | Likelihood | Impact | Risk Level | Mitigation |
|------|-----------|--------|------------|------------|
| **DPA complaint** | Medium | High | **High** | DPIA, consent mechanism, privacy by design |
| **Data subject rights violation** | Low | High | Medium | Automated rights portal; 30-day response commitment |
| **Breach notification failure** | Low | Very High | Medium | Automated breach detection; 72-hour notification process |
| **Non-compliance with AVG** | Low | Very High | Medium | Legal review; DPO appointment; regular audits |

---

## 5. Measures to Address Risks

### 5.1 Technical Measures

1. **Anonymous Profile Pipe** — Strict whitelist of fields that can appear in public profiles; blacklist of fields that must NEVER appear
2. **Consent Gate** — `immigrationConsentGiven` boolean flag controls exposure of work authorization detail
3. **Binary Safe Flag** — `hasWorkAuthorization` provides yes/no without revealing immigration status
4. **Automatic Nullification** — When SPECIAL_CATEGORY consent is withdrawn, `workAuthorization` is automatically set to null
5. **Encryption** — AES-256 at rest, TLS 1.3 in transit
6. **Access Control** — Role-based access; admin access logged
7. **Data Minimization Interceptor** — API responses strip fields not needed by the requesting role
8. **IP Anonymization** — Last octet zeroed after 6 months
9. **Security Headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy

### 5.2 Organizational Measures

1. **DPO Appointment** — Data Protection Officer (Art. 37)
2. **Staff Training** — All staff trained on GDPR and special category data handling
3. **Access Reviews** — Quarterly access reviews for admin systems
4. **Breach Procedure** — Documented procedure with 72-hour notification
5. **Regular Audits** — Annual GDPR compliance audit
6. **Consent Records** — Full audit trail of consent grants and withdrawals
7. **Retention Policies** — Automated enforcement via cron jobs

### 5.3 Privacy by Design Principles

1. **Data Minimization** — Only collect data necessary for the stated purpose
2. **Purpose Limitation** — Data used only for the purpose for which it was collected
3. **Transparency** — Privacy policy, cookie policy, and consent management
4. **User Control** — Privacy dashboard for data subject rights
5. **Security by Default** — Anonymous profiles are the default; identity revealed only upon consent

---

## 6. Data Subject Rights

All GDPR data subject rights are implemented:

| Right | Article | Implementation |
|-------|---------|---------------|
| Access | Art. 15 | `/privacy/my-data` endpoint + Privacy Dashboard |
| Rectification | Art. 16 | Profile editing + `/privacy/request/rectification` |
| Erasure | Art. 17 | `/privacy/request/erasure` + 30-day grace period |
| Restriction | Art. 18 | `/privacy/restriction-status` toggle |
| Portability | Art. 20 | `/privacy/export` (JSON format) |
| Objection | Art. 21 | `/privacy/request/object` |
| Withdraw consent | Art. 7(3) | `/privacy/consents` + Privacy Dashboard |

---

## 7. Ongoing Monitoring

This DPIA will be reviewed:

1. **Annually** — Regular review cycle
2. **Upon significant change** — New processing activity, new data category, new processor
3. **After data breach** — To assess whether additional measures are needed
4. **Upon DPA request** — If the Autoriteit Persoonsgegevens requests review

### 7.1 Key Metrics to Monitor

- Number of consent grants/withdrawals for special category data
- Number of data subject requests and response times
- Number of data breaches and severity
- Percentage of users with work authorization consent
- Profile completeness vs. consent withdrawal rates
- Number of discrimination complaints

---

## 8. Conclusion

This DPIA identifies that processing work authorization data constitutes special category data processing under GDPR Article 9. The current implementation — with explicit consent gating, binary safe flags, and anonymous profiles — represents a proportionate and privacy-protective approach.

**Residual risk:** Medium. The main residual risk is potential discrimination based on work authorization type, which is mitigated by the consent-gated exposure and anonymous profile system.

**DPO Sign-off:** _________________________ Date: ____________

**Controller Approval:** _________________________ Date: ____________