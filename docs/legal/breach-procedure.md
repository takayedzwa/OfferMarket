# Data Breach Notification Procedure

**GDPR Articles 33 & 34 — Breach Notification**

*Last updated: July 11, 2026*
*Controller: OfferMarket B.V.*

---

## 1. Definition

A **personal data breach** is a breach of security leading to the accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data.

---

## 2. Roles and Responsibilities

| Role | Person | Responsibility |
|------|--------|---------------|
| **Breach Coordinator** | CTO / Technical Lead | Initial assessment, containment, technical investigation |
| **Data Protection Officer** | DPO (dpo@offermarket.nl) | Regulatory notification, data subject communication |
| **Management** | CEO / Board | Final approval of notifications, public communication |
| **Legal Counsel** | External lawyer | Legal assessment, regulatory liaison |

---

## 3. Breach Severity Levels

### Level 1: Low Severity
- No personal data exposed or affected
- Data was encrypted and inaccessible
- No data subjects affected
- **Example:** Failed login attempt spike; brief service disruption with no data loss

### Level 2: Medium Severity
- Limited personal data exposed (e.g., email addresses)
- Small number of data subjects affected (< 100)
- No special category data involved
- **Example:** Internal email list accidentally CC'd instead of BCC'd

### Level 3: High Severity
- Significant personal data exposed (e.g., profiles, messages)
- Large number of data subjects affected (> 100)
- Special category data potentially involved
- **Example:** Database misconfiguration exposing worker profiles

### Level 4: Critical Severity
- Large-scale breach affecting many data subjects
- Special category data (work authorization, ID documents) exposed
- Financial data exposed
- **Example:** Database breach exposing work authorization status and personal details

---

## 4. Response Procedure

### Phase 1: Detection & Containment (0-4 hours)

1. **Detect** — Breach may be detected by:
   - Automated monitoring alerts
   - User reports
   - Internal discovery
   - Third-party notification

2. **Contain** — Immediate actions:
   - Isolate affected systems
   - Revoke compromised credentials
   - Block unauthorized access
   - Preserve evidence (logs, timestamps)
   - Do NOT delete evidence

3. **Assess** — Initial assessment:
   - What data was affected?
   - How many data subjects?
   - Is special category data involved?
   - What is the likely severity level?
   - Is the breach still ongoing?

### Phase 2: Notification Assessment (4-24 hours)

#### 4.1 DPA Notification (Art. 33)

**Must notify Autoriteit Persoonsgegevens within 72 hours** of becoming aware of the breach when:
- The breach is likely to result in a risk to the rights and freedoms of data subjects
- Applies to ALL severity levels above Low

**Notification to DPA includes:**
1. Nature of the breach (categories of data, approximate number of data subjects)
2. DPO contact details
3. Likely consequences of the breach
4. Measures taken or proposed to address the breach

**How to notify:**
- Online: https://autoriteitpersoonsgegevens.nl/meld-misbruik
- Email: meldingen@autoriteitpersoonsgegevens.nl
- Phone: +31 (0)88 1805 250

#### 4.2 Data Subject Notification (Art. 34)

**Must notify affected data subjects without undue delay** when:
- The breach is likely to result in a **high risk** to their rights and freedoms
- Applies to Level 3 and Level 4 severity breaches

**Notification to data subjects includes:**
1. Clear and plain language description of the breach
2. Contact details of DPO
3. Likely consequences
4. Measures taken, including measures to mitigate adverse effects
5. Advice for data subjects to protect themselves

**Exceptions to data subject notification:**
- Data was encrypted/unintelligible to unauthorized parties
- Subsequent measures ensure high risk is no longer likely
- It would involve disproportionate effort (public communication instead)
- Notification would compromise investigation

### Phase 3: Remediation (24-72 hours)

1. **Fix the vulnerability** that caused the breach
2. **Review and strengthen** security measures
3. **Update access controls** if credentials were compromised
4. **Communicate with affected users** via email, in-app notification, and/or public announcement
5. **Document everything** — all decisions, actions, and timelines

### Phase 4: Post-Incident Review (1-2 weeks)

1. **Conduct root cause analysis**
2. **Update security measures** based on findings
3. **Update this procedure** if gaps identified
4. **Update DPIA** if the breach involved special category data
5. **Brief management and board**
6. **Archive all documentation** for at least 5 years

---

## 5. Internal Breach Reporting Template

### Breach Report Template

```
BREACH REPORT
=============

Date/Time Discovered:     ____________________
Date/Time of Breach:       ____________________
Reported By:               ____________________

BREACH DETAILS
--------------
Description:               ____________________
Data Categories Affected:  ____________________
Number of Data Subjects:   ____________________
Special Category Data:     ☐ Yes  ☐ No
Severity Level:            ☐ Low  ☐ Medium  ☐ High  ☐ Critical

CONTAINMENT ACTIONS
-------------------
Actions Taken:             ____________________
Time to Contain:            ____________________

DPA NOTIFICATION
---------------
Required:                  ☐ Yes  ☐ No
Notification Date:         ____________________
DPA Reference Number:      ____________________

DATA SUBJECT NOTIFICATION
-------------------------
Required:                  ☐ Yes  ☐ No
Notification Date:         ____________________
Notification Method:       ____________________

ROOT CAUSE
----------
Analysis:                  ____________________

REMEDIATION
-----------
Measures Taken:            ____________________
Measures Planned:          ____________________

REVIEW
------
DPO Sign-off:              ____________________
Date:                      ____________________
```

---

## 6. Breach Severity Decision Matrix

| Data Type Exposed | Number Affected | Severity | DPA Notify | Subject Notify |
|-------------------|-----------------|----------|------------|----------------|
| Email only | < 100 | Medium | ✅ Yes | ❌ No |
| Email only | > 100 | Medium | ✅ Yes | ❌ No |
| Profile data | < 100 | Medium | ✅ Yes | ❌ No |
| Profile data | > 100 | High | ✅ Yes | ✅ Yes |
| Work authorization | Any | **High** | ✅ Yes | ✅ Yes |
| ID documents | Any | **Critical** | ✅ Yes | ✅ Yes |
| Financial data | Any | **Critical** | ✅ Yes | ✅ Yes |
| Messages | < 100 | Medium | ✅ Yes | ❌ No |
| Messages | > 100 | High | ✅ Yes | ✅ Yes |
| Encrypted data | Any | Low | ❌ No* | ❌ No |

*\*Unless the encryption was also compromised*

---

## 7. Contact Information

| Role | Contact | Available |
|------|---------|-----------|
| DPO | dpo@offermarket.nl | Business hours + emergency |
| Technical Lead | [CTO contact] | 24/7 for critical incidents |
| Legal Counsel | [Lawyer contact] | Business hours |
| Autoriteit Persoonsgegevens | +31 (0)88 1805 250 | Business hours |

---

## 8. System-Level Breach Tracking

Breaches are tracked in the `DataBreach` model in the database with the following fields:
- `title` and `description`
- `severity` (LOW, MEDIUM, HIGH, CRITICAL)
- `affectedUsers` count
- `dataCategories` affected
- `detectedAt` and `containedAt` timestamps
- `reportedToDpaAt` and `reportedToUsersAt` timestamps
- `status` (DETECTED, INVESTIGATING, CONTAINED, REPORTED_DPA, NOTIFIED_USERS, RESOLVED)

Admin users can manage breaches through `/privacy/admin/breaches`.

---

*This procedure is reviewed annually and after any breach incident.*