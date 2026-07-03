# Trust Layer Implementation

## Overview

The Trust Layer is a comprehensive security and reputation system for the OfferMarket platform. It provides verification, fraud prevention, and trust scoring for both employers and workers.

## Architecture

### New Database Models (Prisma)

#### Verification Models
- **EmployerVerification**: Tracks employer verification status (KvK, VAT, company documents)
- **WorkerVerification**: Tracks worker verification (identity, background, references, certifications)
- **VerificationDocument**: Stores uploaded verification documents with status tracking
- **VerificationLog**: Audit trail for all verification actions
- **IdentityCheck**: Third-party identity verification checks (document, facial, liveness)

#### Fraud Prevention Models
- **SuspiciousActivity**: Reports and tracks suspicious behavior patterns
- **FraudIndicator**: Confirmed fraud indicators with severity levels
- **DuplicateAccountCheck**: Detects and tracks duplicate accounts
- **BlacklistEntry**: Manages blacklisted users/entities

#### Reputation Models
- **TrustScore**: Stores calculated trust scores with history

## Features

### 1. Employer Verification

**Verification Levels:**
- `NONE`: No verification
- `BASIC`: KvK number verified
- `STANDARD`: KvK + VAT verified
- `ENHANCED`: Full company verification
- `PREMIUM`: Document verification complete

**API Endpoints:**
```
GET  /trust/employers/:employerId/verification
POST /trust/employers/:employerId/verification
POST /trust/employers/:employerId/documents
POST /trust/employers/:employerId/review (admin only)
```

### 2. Worker Verification

**Verification Components:**
- Identity verification (document scan, biometric, video call)
- Document verification (ID, passport, residence permit)
- Background check status tracking
- Reference check status tracking
- Certification verification

**Verification Levels:**
- `NONE`: No verification
- `BASIC`: Identity verified
- `STANDARD`: Identity + references verified
- `ENHANCED`: Full background check clear
- `PREMIUM`: All verifications complete

**API Endpoints:**
```
GET  /trust/workers/:workerId/verification
POST /trust/workers/:workerId/verification
POST /trust/workers/:workerId/documents
POST /trust/workers/:workerId/identity-check
PUT  /trust/identity-checks/:checkId/result
POST /trust/workers/:workerId/background-check
PUT  /trust/workers/:workerId/background-check/complete (admin only)
POST /trust/workers/:workerId/reference-check
PUT  /trust/workers/:workerId/reference-check/complete (admin only)
POST /trust/workers/:workerId/review (admin only)
```

### 3. Fraud Prevention

**Suspicious Activity Types:**
- Rapid account creation
- Multiple failed logins
- Unusual login location
- Bulk data access
- Rate limit exceeded
- Payment anomaly
- Profile manipulation
- Message spam
- Fake document upload
- Identity mismatch
- Duplicate account
- Bot behavior
- Circumvention attempt
- Data scraping

**Fraud Indicator Types:**
- Document fraud
- Identity fraud
- Payment fraud
- Account takeover
- Synthetic identity
- Business fraud
- Review manipulation
- Offer fraud

**API Endpoints:**
```
POST /trust/suspicious-activity
GET  /trust/suspicious-activity (admin/support only)
PUT  /trust/suspicious-activity/:activityId/review (admin/support only)
POST /trust/fraud-indicators (admin/support only)
PUT  /trust/fraud-indicators/:indicatorId (admin/support only)
GET  /trust/fraud-indicators/:entityType/:entityId (admin/support only)
```

### 4. Duplicate Account Prevention

**Match Types:**
- Email match
- Phone match
- IP address match
- Device fingerprint match
- Document number match
- Address match
- Name similarity
- Composite (multiple factors)

**API Endpoints:**
```
GET  /trust/duplicates/check/:userId (admin/support only)
POST /trust/duplicates (admin/support only)
PUT  /trust/duplicates/:primaryUserId/:suspectedUserId/review (admin only)
```

### 5. Identity Validation

**Identity Check Types:**
- Document verification
- Facial recognition
- Liveness check
- Address verification
- Phone verification
- Email verification
- SSN verification
- Background check

**API Endpoints:**
```
POST /trust/workers/:workerId/identity-check
PUT  /trust/identity-checks/:checkId/result
```

### 6. Reputation Scoring

**Score Components:**
- Verification Score (25-30%): Based on verification level and status
- Behavior Score (20%): Based on activity patterns
- Reputation Score (25-30%): Based on ratings and reviews
- Activity Score (10%): Based on engagement level
- Consistency Score (15%): Based on rating consistency

**Score Grades:**
- A+ (90-100): Excellent
- A (80-89): Very Good
- B (70-79): Good
- C (60-69): Fair
- D (40-59): Poor
- F (0-39): Very Poor

**API Endpoints:**
```
POST /trust/reputation/calculate
GET  /trust/reputation/employer/:employerId
GET  /trust/reputation/worker/:workerId
GET  /trust/score/:entityType/:entityId
```

### 7. Suspicious Activity Detection

**Automated Detection:**
- Suspicious login detection (unusual IP, location)
- Rapid account creation detection
- Blacklist checking on login
- Failed login attempt tracking

**API Endpoints:**
```
POST /trust/detect/suspicious-login
POST /trust/detect/rapid-account-creation
GET  /trust/blacklist/check/:entityType/:entityId
```

## Integration Points

### Auth Module Integration

The trust layer is integrated into the authentication flow:

1. **Registration:**
   - Checks for rapid account creation from same IP
   - Initializes verification records automatically
   - Reports suspicious registration patterns

2. **Login:**
   - Checks if user is blacklisted
   - Detects suspicious login patterns
   - Reports failed login attempts
   - Updates last login IP for tracking

### Existing Modules

The trust layer works alongside:
- **Ratings Module**: Trust scores incorporate rating data
- **Employers Module**: Employer verification status affects trust scores
- **Workers Module**: Worker verification status affects profile visibility

## Risk Levels

- `UNKNOWN`: No data available
- `VERY_LOW`: Fully verified, excellent history
- `LOW`: Verified, good standing
- `MEDIUM`: Partial verification or neutral history
- `HIGH`: Unverified or suspicious activity
- `VERY_HIGH`: Multiple red flags
- `CRITICAL`: Confirmed fraud or severe violations

## Security Considerations

1. **Access Control:**
   - Most fraud/trust endpoints require ADMIN or SUPPORT role
   - Users can only view their own verification status
   - Blacklist checks are available publicly but don't reveal details

2. **Data Protection:**
   - Verification documents are stored with file hashes
   - Identity check payloads are encrypted in transit
   - Audit logs track all verification actions

3. **Rate Limiting:**
   - Implement rate limiting on sensitive endpoints
   - Monitor for bulk data access patterns

## Future Enhancements

1. **Third-Party Integrations:**
   - KvK API for automatic company verification
   - Identity verification providers (Onfido, Jumio, etc.)
   - Background check services

2. **Machine Learning:**
   - Anomaly detection for suspicious activity
   - Pattern recognition for fraud detection
   - Risk scoring improvements

3. **Automation:**
   - Automatic document verification using OCR
   - Automated background check initiation
   - Scheduled trust score recalculation

## Usage Examples

### Checking Employer Trust Before Making an Offer

```typescript
// Get employer reputation
const reputation = await trustService.calculateReputationScore({ employerId });

// Check for fraud indicators
const fraudIndicators = await trustService.getFraudIndicators('EMPLOYER', employerId);

// Verify employer is not blacklisted
const isBlacklisted = await trustService.isBlacklisted('EMPLOYER', employerId);
```

### Worker Verification Flow

```typescript
// 1. Initialize verification
await trustService.initializeWorkerVerification(workerId);

// 2. Submit identity document
await trustService.submitWorkerDocument(workerId, {
  documentType: 'ID_CARD',
  fileUrl: 'https://storage.example.com/doc.pdf',
});

// 3. Initiate identity check
await trustService.initiateIdentityCheck(workerId, {
  checkType: 'DOCUMENT_VERIFICATION',
  provider: 'onfido',
});

// 4. Submit check result (from webhook)
await trustService.submitIdentityCheckResult(workerId, checkId, {
  result: 'PASS',
  confidenceScore: 95,
});

// 5. Calculate final trust score
const trustScore = await trustService.calculateReputationScore({ workerId });
```

## Module Structure

```
apps/api/src/modules/trust/
├── dto/
│   ├── verification.dto.ts    # Verification request/response types
│   ├── fraud.dto.ts           # Fraud prevention types
│   └── reputation.dto.ts      # Reputation scoring types
├── trust.service.ts           # Core trust layer logic
├── trust.controller.ts        # API endpoints
└── trust.module.ts            # Module configuration
```

## Testing

Run the existing test suite to verify trust layer functionality:

```bash
npm test
```

The trust layer is designed to work seamlessly with existing tests and does not break any current functionality.
