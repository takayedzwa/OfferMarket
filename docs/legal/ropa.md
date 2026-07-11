# Record of Processing Activities (RoPA)

**GDPR Article 30 — Record of Processing Activities**

*Last updated: July 11, 2026*
*Controller: OfferMarket B.V.*

---

## Controller Details

| Field | Value |
|-------|-------|
| **Name** | OfferMarket B.V. |
| **Address** | [Address], Netherlands |
| **KvK Number** | [KvK Number] |
| **DPO Contact** | dpo@offermarket.nl |
| **Data Protection Officer** | To be appointed (Art. 37) |

---

## Processing Activities

### 1. User Registration & Authentication

| Field | Value |
|-------|-------|
| **Purpose** | Create and manage user accounts |
| **Legal Basis** | Contract performance (Art. 6(1)(b)) |
| **Data Categories** | Identity data (name, email, phone), authentication data (password hash, 2FA) |
| **Data Subjects** | Workers, Employers |
| **Recipients** | AWS (hosting), internal systems |
| **Retention** | Until account deletion + 30 days |
| **Transfers** | AWS EU (Frankfurt) |
| **Technical Measures** | Encryption at rest (AES-256), TLS 1.3 in transit, bcrypt password hashing |

### 2. Worker Profile Management

| Field | Value |
|-------|-------|
| **Purpose** | Enable workers to create and manage professional profiles |
| **Legal Basis** | Contract performance (Art. 6(1)(b)) |
| **Data Categories** | Professional data (skills, experience, education, certifications), preferences (salary, location, work type) |
| **Data Subjects** | Workers |
| **Recipients** | Employers (anonymous profile only until offer acceptance) |
| **Retention** | Until account deletion |
| **Transfers** | None |
| **Technical Measures** | Anonymous profile pipe, field whitelisting, consent-gated data exposure |

### 3. Work Authorization Processing (Special Category)

| Field | Value |
|-------|-------|
| **Purpose** | Match workers with employers based on work authorization status |
| **Legal Basis** | Explicit consent (Art. 9(2)(a)) |
| **Data Categories** | Special category data — work authorization status (may reveal immigration status/national origin) |
| **Data Subjects** | Workers |
| **Recipients** | Employers (only with explicit consent — binary flag shown by default, detail only with consent) |
| **Retention** | Until consent withdrawal |
| **Transfers** | None |
| **Technical Measures** | Explicit consent gate, `immigrationConsentGiven` flag, automatic nullification on consent withdrawal |
| **DPIA** | Required — See [DPIA document](dpia.md) |

### 4. Employer Verification

| Field | Value |
|-------|-------|
| **Purpose** | Verify employer identity and business legitimacy |
| **Legal Basis** | Legal obligation (Art. 6(1)(c)) — KvK registration requirement |
| **Data Categories** | Business data (KvK number, company name), verification documents |
| **Data Subjects** | Employers |
| **Recipients** | KvK (verification), internal verification team |
| **Retention** | 7 years (tax/legal obligation) |
| **Transfers** | None |
| **Technical Measures** | Encrypted document storage, verification status tracking |

### 5. Offer Processing

| Field | Value |
|-------|-------|
| **Purpose** | Facilitate job offers between employers and workers |
| **Legal Basis** | Contract performance (Art. 6(1)(b)) |
| **Data Categories** | Offer terms (salary, benefits, contract type), communication data |
| **Data Subjects** | Workers, Employers |
| **Recipients** | Both parties upon offer |
| **Retention** | 7 years (tax/legal obligation) |
| **Transfers** | None |
| **Technical Measures** | Offer versioning, access control |

### 6. Messaging

| Field | Value |
|-------|-------|
| **Purpose** | Enable communication between workers and employers |
| **Legal Basis** | Contract performance (Art. 6(1)(b)) |
| **Data Categories** | Message content, timestamps, read receipts |
| **Data Subjects** | Workers, Employers |
| **Recipients** | Conversation participants only |
| **Retention** | 2 years after conversation close, then anonymized |
| **Transfers** | None |
| **Technical Measures** | Access control, message retention policies |

### 7. Trust & Fraud Prevention

| Field | Value |
|-------|-------|
| **Purpose** | Maintain platform integrity and prevent fraud |
| **Legal Basis** | Legitimate interest (Art. 6(1)(f)) |
| **Data Categories** | IP addresses, behavioral patterns, suspicious activity flags |
| **Data Subjects** | All users |
| **Recipients** | Internal trust team |
| **Retention** | 2 years for suspicious activity, 6 months for IP addresses |
| **Transfers** | None |
| **Technical Measures** | IP anonymization, audit logging |

### 8. Billing & Invoicing

| Field | Value |
|-------|-------|
| **Purpose** | Process payments and maintain tax records |
| **Legal Basis** | Legal obligation (Art. 6(1)(c)) — Dutch tax law (BW 7:44) |
| **Data Categories** | Financial data (invoices, payment records, billing addresses) |
| **Data Subjects** | Employers |
| **Recipients** | Stripe (payment processing), tax authorities |
| **Retention** | 7 years (legal obligation) |
| **Transfers** | Stripe (US, with SCCs) |
| **Technical Measures** | Encrypted storage, audit trail |

### 9. Analytics (PostHog)

| Field | Value |
|-------|-------|
| **Purpose** | Understand platform usage and improve user experience |
| **Legal Basis** | Consent (Art. 6(1)(a)) |
| **Data Categories** | Usage data (page views, feature usage), anonymized analytics |
| **Data Subjects** | All users (only those who consented) |
| **Recipients** | PostHog (analytics processor) |
| **Retention** | Until consent withdrawal |
| **Transfers** | PostHog EU servers |
| **Technical Measures** | IP masking, consent gating, opt-out mechanism |
| **DPA** | In place with PostHog |

### 10. Notifications

| Field | Value |
|-------|-------|
| **Purpose** | Send service notifications (offers, messages, account updates) |
| **Legal Basis** | Consent (Art. 6(1)(a)) for marketing; Contract performance for service notifications |
| **Data Categories** | Email addresses, phone numbers, notification preferences |
| **Data Subjects** | All users |
| **Recipients** | AWS SES (email), Twilio (SMS) |
| **Retention** | 1 year for notification records |
| **Transfers** | AWS EU, Twilio |
| **Technical Measures** | Preference management, unsubscribe mechanism |

### 11. Verification Documents

| Field | Value |
|-------|-------|
| **Purpose** | Verify worker certifications and employer identity |
| **Legal Basis** | Legal obligation (Art. 6(1)(c)) for KvK; Consent for certifications |
| **Data Categories** | ID documents, certificates, diplomas |
| **Data Subjects** | Workers, Employers |
| **Recipients** | Internal verification team |
| **Retention** | 30 days after verification complete |
| **Transfers** | None |
| **Technical Measures** | Encrypted S3 storage, automatic deletion after verification |

### 12. Audit Logging

| Field | Value |
|-------|-------|
| **Purpose** | Maintain audit trail for security and compliance |
| **Legal Basis** | Legitimate interest (Art. 6(1)(f)) |
| **Data Categories** | User IDs, actions, timestamps, IP addresses |
| **Data Subjects** | All users |
| **Recipients** | Internal security team |
| **Retention** | 7 years (anonymized after account deletion) |
| **Transfers** | None |
| **Technical Measures** | IP anonymization after 6 months, userId anonymization on deletion |

---

## Processors

| Processor | Purpose | Data Categories | Location | DPA |
|-----------|---------|-----------------|----------|-----|
| **Amazon Web Services** | Cloud infrastructure, storage, email | All categories | EU (Frankfurt) | Yes |
| **Stripe** | Payment processing | Financial data | US (with SCCs) | Yes |
| **PostHog** | Product analytics | Usage data (consent-based) | EU | Yes |
| **Twilio** | SMS notifications | Phone numbers | US (with SCCs) | Yes |
| **Sentry** | Error monitoring | Minimal (error context) | US (with SCCs) | Yes |

---

## Data Transfers Outside EU

Where data is transferred outside the EU, appropriate safeguards are in place:

1. **Standard Contractual Clauses (SCCs)** — With all non-EU processors
2. **Adequacy decisions** — Where applicable
3. **Data Processing Agreements** — With all processors

---

*This RoPA is maintained in accordance with Article 30 of the AVG (GDPR) and will be reviewed annually or whenever processing activities change.*