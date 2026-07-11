# Data Retention Schedule

**GDPR Article 5(1)(e) — Storage Limitation Principle**

*Last updated: July 11, 2026*
*Controller: OfferMarket B.V.*

---

## 1. Principle

Personal data must not be kept longer than necessary for the purposes for which it was collected. This schedule defines the retention period for each category of data, the legal basis for retention, and the action taken at expiry.

---

## 2. Retention Periods

| Data Category | Retention Period | Legal Basis | Action at Expiry | Auto-Delete |
|--------------|-----------------|-------------|------------------|-------------|
| **User Accounts** | Until deletion request + 30 days | Contract (Art. 6(1)(b)) | Anonymize PII, delete account | ❌ Manual |
| **Worker Profiles** | Until deletion request | Contract (Art. 6(1)(b)) | Soft delete, anonymize PII | ❌ Manual |
| **Employer Profiles (KvK)** | 7 years after account closure | Legal obligation (Art. 6(1)(c)) | Anonymize personal data, retain KvK | ✅ Cron |
| **Messages** | 2 years after conversation closure | Legitimate interest (Art. 6(1)(f)) | Anonymize content, retain metadata | ✅ Cron |
| **Offers** | 7 years | Legal obligation (Art. 6(1)(c)) | Anonymize personal details | ❌ Legal hold |
| **Invoices** | 7 years | Legal obligation — Dutch tax law (BW 7:44) | Archive | ❌ Legal hold |
| **Audit Logs** | 7 years | Legal obligation (Art. 6(1)(c)) | Anonymize userId | ✅ Cron (IPs at 6 months) |
| **Verification Documents** | 30 days after verification complete | Data minimization (Art. 5(1)(c)) | Delete from S3 + database | ✅ Cron |
| **Notifications** | 1 year | Legitimate interest (Art. 6(1)(f)) | Delete | ✅ Cron |
| **Suspicious Activity** | 2 years | Legitimate interest (Art. 6(1)(f)) | Delete | ✅ Cron |
| **Fraud Indicators** | 5 years | Legitimate interest (Art. 6(1)(f)) | Anonymize | ❌ Manual |
| **Consent Records** | 7 years after withdrawal | Legal obligation (proof of consent) | Archive | ❌ Legal hold |
| **Data Export Requests** | 30 days after download | Data minimization | Remove file, keep record | ✅ Cron |
| **Data Deletion Requests** | 7 years | Legal obligation | Archive | ❌ Legal hold |
| **IP Addresses** | 6 months | Security (legitimate interest) | Anonymize last octet | ✅ Cron |
| **Analytics (PostHog)** | Until consent withdrawal | Consent (Art. 6(1)(a)) | Delete all data | ✅ PostHog API |
| **Marketing Communications** | Until unsubscribe | Consent (Art. 6(1)(a)) | Remove from mailing list | ✅ Auto |
| **Work Authorization (Special)** | Until consent withdrawal | Explicit consent (Art. 9(2)(a)) | Set to null immediately | ✅ Immediate |

---

## 3. Automated Enforcement

The `RetentionService` runs daily cron jobs to enforce retention:

### 3.1 Daily at 03:00 UTC

- **Notifications:** Delete all notifications older than 1 year
- **Data Exports:** Mark completed exports older than 30 days as EXPIRED, remove file paths
- **Scheduled Deletions:** Execute account deletions past the 30-day grace period
- **Verification Documents:** Delete documents verified more than 30 days ago
- **IP Addresses:** Anonymize the last octet of IP addresses older than 6 months
- **Messages:** Mark messages in inactive conversations (2+ years) for retention expiry

### 3.2 Manual Actions

Some retention actions require manual review:
- Invoice archival after 7 years
- Fraud indicator cleanup after 5 years
- Legal hold releases

---

## 4. Deletion Strategy

### 4.1 Account Deletion

When a user requests account deletion:

| Data | Action | Reason |
|------|--------|--------|
| Email | Anonymize to `deleted-{uuid}@offermarket.nl` | Prevent re-use |
| Password | Replace with random hash | Prevent login |
| Phone | Set to null | Remove PII |
| Worker profile | Soft delete (`deletedAt` timestamp) | Retain anonymized data |
| Employer profile | Anonymize PII, keep KvK | Legal obligation |
| Messages | Anonymize content | Protect other party's data |
| Offers | Anonymize, retain for 7 years | Tax obligation |
| Notifications | Delete all | No legal obligation |
| Audit logs | Anonymize userId reference | Legal obligation to retain |
| Verification documents | Delete from S3 and DB | Data minimization |
| Consent records | Mark withdrawn, retain 7 years | Proof of consent |
| Invoices | Retain for 7 years | Tax obligation |

### 4.2 Grace Period

- Users have a **30-day grace period** after confirming deletion
- During this period, they can cancel the deletion request
- After the grace period, deletion is executed automatically by the `RetentionService`
- The user is notified via email at each stage

---

## 5. Legal Basis for Extended Retention

Some data must be retained beyond the user's account lifetime due to legal obligations:

| Obligation | Law | Data | Period |
|-----------|-----|------|--------|
| Tax records | BW 7:44 (Dutch Civil Code) | Invoices, financial records | 7 years |
| KvK registration | Handelsregisterwet | Company data, KvK numbers | 7 years |
| Proof of consent | AVG Art. 7(1) | Consent records | 7 years after withdrawal |
| Audit trail | AVG Art. 5(2) accountability | Audit logs | 7 years |
| Employment records | Various labor laws | Offer data, contracts | 7 years |

---

*This schedule is reviewed annually by the DPO and legal counsel.*