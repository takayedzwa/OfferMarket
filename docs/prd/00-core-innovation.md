# OfferMarket - Core Innovation Design

**Version:** 2.0 (Foundational)  
**Date:** June 2026

---

## The Two Non-Negotiables

Everything in this system exists to serve two principles:

### 1. Structured Offers (The Demand Primitive)

**Every offer must be:**
- Complete (all fields required)
- Specific (salary ranges ≤ €5K spread)
- Binding (employer commits to stated terms)
- Comparable (standardized structure)

**What this prevents:**
- "Competitive salary" vagueness
- Bait-and-switch tactics
- Empty recruiter messages
- Fishing expeditions

**What this enables:**
- Side-by-side comparison
- Market transparency
- Worker leverage
- Trust in the platform

### 2. Anonymous Worker Profiles (The Supply Primitive)

**Workers are anonymous until they choose otherwise:**
- Identity hidden by default
- Region visible, not address
- Skills visible, not current employer
- Worker controls revelation timing

**What this prevents:**
- Current employer discovery
- Unsolicited contact spam
- Power imbalance
- Privacy violations

**What this enables:**
- Safe job exploration
- True market testing
- Worker-controlled process
- Leverage preservation

---

## Design Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE OFFERMARKET HIERARCHY                            │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │  STRUCTURED OFFERS  │
                    │  +                  │
                    │  ANONYMOUS PROFILES │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌────────────────┐ ┌─────────────┐ ┌─────────────┐
     │ Search         │ │ Messaging   │ │ Analytics   │
     │ (find matches) │ │ (post-accept)│ │ (market data)│
     └────────────────┘ └─────────────┘ └─────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    Can be removed/replaced
                    without breaking core value

Core Innovation (Top): Cannot be compromised
Supporting Features (Bottom): Can be copied, swapped, simplified
```

---

## The Structured Offer - Deep Dive

### Anatomy of an Offer

An offer is NOT a message. It is a **structured data contract**.

```typescript
interface Offer {
  // Identity
  id: string;
  publicId: string;      // "OFF-2026-000542"
  employerId: string;    // Who made it
  workerId: string;      // Who it's for (anonymous)
  
  // Status (state machine - see below)
  status: OfferStatus;
  
  // The OFFER VERSION - this is the actual offer
  // Offers can have multiple versions (counters)
  versions: OfferVersion[];
  currentVersionId: string;
  
  // Timeline
  submittedAt: DateTime;
  expiresAt: DateTime;     // Auto-expires
  viewedAt?: DateTime;
  acceptedAt?: DateTime;
  
  // Metadata
  jobTitle: string;
  department?: string;
  jobDescription: string;
}

interface OfferVersion {
  version: number;         // 1, 2, 3... (counters increment)
  
  // COMPENSATION - All required
  compensation: {
    salaryMin: number;     // €54,000 (required, ≥€20K)
    salaryMax: number;     // €58,000 (required, max €5K above min)
    salaryPeriod: 'year' | 'month' | 'hour';
    
    hourlyRate?: number;   // Required if part-time/contract
    
    signOnBonus: number;   // €3,000 (required, can be 0)
    performanceBonusPct: number;  // 5 (required, can be 0)
    overtimeRate: number;  // €35/hour (required for trades)
    weekendRate: number;   // €42/hour (required if weekend work)
  };
  
  // CONTRACT - All required
  contract: {
    type: 'permanent' | 'fixed_term' | 'contract' | 'freelance';
    durationMonths?: number;  // For fixed_term only
    hoursPerWeek: number;     // 40 (required, 12-40)
    startDateType: 'flexible' | 'specific';
    startDate?: Date;
    probationMonths: number;  // 2 (required, 0-6)
  };
  
  // BENEFITS - All required
  benefits: {
    vacationDays: number;        // 30 (required, 20-40)
    holidayAllowancePct: number; // 8 (required, NL standard)
    pensionContributionPct: number; // 8 (required, 0-15)
    trainingBudget: number;      // €1,500 (required)
    
    companyVehicle: 'full_use' | 'work_only' | 'not_provided';
    vehicleType?: string;
    vehicleValueEst: number;
    
    travelAllowanceType: 'per_km' | 'ns_card' | 'monthly' | 'not_provided';
    travelAllowanceValue: number;
    
    phoneProvided: boolean;
    toolsProvided: boolean;
  };
  
  // WORK ARRANGEMENT - All required
  workArrangement: {
    scheduleType: ScheduleType[];  // ['daytime', 'shift', 'weekend', 'on_call']
    onCallDetails?: string;
    remoteWorkPct: number;  // 0-100
    travelRequiredPct: number;  // 0-100
    travelRegion: string;
    physicalRequirements: string;
  };
  
  // REQUIREMENTS - All required
  requirements: {
    requiredCertifications: string[];  // ['NEN 3140 VOP', 'VCA']
    requiredExperienceYears: number;
  };
  
  // Calculated fields (for display)
  estimatedYear1Total: {
    min: number;  // €65,000
    max: number;  // €72,000
  };
}
```

### Offer State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OFFER STATE MACHINE                                  │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────┐
                         │   DRAFT     │
                         │ (employer)  │
                         └──────┬──────┘
                                │
                                │ SUBMIT (all fields required ✓)
                                ▼
                         ┌─────────────┐
                    ┌───>│  SUBMITTED  │<────────────────────┐
                    │    │  (worker)   │                     │
                    │    └──────┬──────┘                     │
                    │           │                            │
          ┌─────────┼─────────┬─┼─────────┬──────────────┐   │
          │         │         │ │         │              │   │
          │         │         │ │         │              │   │
          ▼         ▼         ▼ ▼         ▼              ▼   │
     ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐│
     │ VIEWED │ │EXPIRED │ │WITHDRAWN│ │REJECTED│  │COUNTERED│
     │        │ │(auto)  │ │(employer)│ │(worker)│  │(worker) │
     └───┬────┘ └────────┘ └────────┘ └────────┘  └────┬───┘│
         │                                             │    │
         │         ┌─────────────┬────────────┐        │    │
         │         │             │            │        │    │
         ▼         ▼             ▼            ▼        │    │
     ┌──────────────┐     ┌──────────┐  ┌────────┐    │    │
     │ SHORTLISTED  │     │ ACCEPTED │  │ REJECT │    │    │
     │   (worker)   │     │ (worker) │  │        │    │    │
     └──────┬───────┘     └──────────┘  └────────┘    │    │
            │                                          │    │
            │         ┌─────────────┐                  │    │
            │         │   ACCEPTED  │                  │    │
            └────────>│  (terminal) │                  │    │
                      └─────────────┘                  │    │
                                                       │    │
                      ┌────────────────────────────────┘    │
                      │  New offer version (v2, v3...)      │
                      └─────────────────────────────────────┘

TERMINAL STATES (cannot change):
- ACCEPTED: Worker accepted, identity revealed, conversation unlocked
- REJECTED: Worker rejected, employer notified, no further action
- EXPIRED: 14 days passed, offer auto-closed

TRANSITION RULES:
1. DRAFT → SUBMITTED: Requires ALL fields valid (no partial offers)
2. SUBMITTED → VIEWED: Automatic when worker opens offer
3. SUBMITTED → EXPIRED: Automatic after 14 days
4. VIEWED → SHORTLISTED: Worker action (can shortlist multiple)
5. SHORTLISTED → ACCEPTED: Worker action (terminal)
6. SHORTLISTED → REJECTED: Worker action (terminal)
7. SUBMITTED → COUNTERED: Worker submits counter (creates new draft for employer)
8. COUNTERED → SUBMITTED: Employer submits new version
9. Any → WITHDRAWN: Employer action (before acceptance only)
```

### Offer Validation Rules (Enforced)

```typescript
// apps/api/src/modules/offers/offer.validation.ts

const OFFER_VALIDATION_RULES = {
  // Salary transparency
  salary_range_max_spread: {
    rule: (offer) => offer.compensation.salaryMax - offer.compensation.salaryMin <= 5000,
    error: 'Salary range cannot exceed €5,000. Be specific about compensation.',
    severity: 'blocking'
  },
  
  salary_minimum: {
    rule: (offer) => offer.compensation.salaryMin >= 20000,
    error: 'Minimum salary must be at least €20,000/year',
    severity: 'blocking'
  },
  
  salary_required: {
    rule: (offer) => offer.compensation.salaryMin > 0 && offer.compensation.salaryMax > 0,
    error: 'Salary is required. "Competitive salary" is not allowed.',
    severity: 'blocking'
  },
  
  // Contract clarity
  hours_valid: {
    rule: (offer) => offer.contract.hoursPerWeek >= 12 && offer.contract.hoursPerWeek <= 40,
    error: 'Hours per week must be between 12 and 40',
    severity: 'blocking'
  },
  
  probation_max: {
    rule: (offer) => offer.contract.probationMonths <= 6,
    error: 'Probation period cannot exceed 6 months',
    severity: 'blocking'
  },
  
  // Benefits completeness
  vacation_days_minimum: {
    rule: (offer) => offer.benefits.vacationDays >= 20,
    error: 'Vacation days must be at least 20 (NL legal minimum)',
    severity: 'blocking'
  },
  
  // Work arrangement clarity
  schedule_required: {
    rule: (offer) => offer.workArrangement.scheduleType.length > 0,
    error: 'At least one schedule type must be selected',
    severity: 'blocking'
  },
  
  // Requirements clarity
  certifications_required: {
    rule: (offer) => offer.requirements.requiredCertifications.length > 0,
    error: 'At least one required certification must be specified',
    severity: 'blocking'
  }
};

// Middleware: Reject offer creation if ANY blocking rule fails
function validateOffer(offer: CreateOfferDto): ValidationResult {
  const errors = [];
  
  for (const [key, validation] of Object.entries(OFFER_VALIDATION_RULES)) {
    if (!validation.rule(offer)) {
      errors.push({
        code: `OFFER_VALIDATION_${key.toUpperCase()}`,
        message: validation.error,
        severity: validation.severity
      });
    }
  }
  
  const blockingErrors = errors.filter(e => e.severity === 'blocking');
  
  return {
    valid: blockingErrors.length === 0,
    errors: blockingErrors
  };
}
```

### What Happens When an Offer is Accepted

```typescript
// apps/api/src/modules/offers/offers.service.ts

async acceptOffer(offerId: string, workerId: string): Promise<AcceptOfferResult> {
  return this.prisma.$transaction(async (tx) => {
    // 1. Verify offer exists and belongs to worker
    const offer = await tx.offer.findUnique({
      where: { id: offerId },
      include: {
        worker: { include: { user: true } },
        employer: { include: { user: true, company: true } }
      }
    });
    
    if (!offer || offer.workerId !== workerId) {
      throw new UnauthorizedException('Not authorized');
    }
    
    if (offer.status !== 'submitted' && offer.status !== 'shortlisted') {
      throw new BadRequestException('Offer cannot be accepted');
    }
    
    // 2. Update offer status (terminal state)
    await tx.offer.update({
      where: { id: offerId },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });
    
    // 3. REVEAL WORKER IDENTITY TO EMPLOYER
    // This is the ONLY time identity is revealed
    const workerIdentity = {
      fullName: await this.decryptWorkerName(workerId),
      email: offer.worker.user.email,
      phone: await this.decryptWorkerPhone(workerId),
      // Current employer STILL hidden unless worker chooses to share
    };
    
    // 4. Create conversation (unlocks messaging)
    const conversation = await tx.conversation.create({
      data: {
        offerId: offerId,
        participant1Id: offer.worker.userId,
        participant2Id: offer.employer.userId,
        // Worker identity attached to conversation
        workerIdentityRevealed: true,
        workerIdentitySnapshot: workerIdentity
      }
    });
    
    // 5. Generate invoice (introduction fee)
    const invoice = await this.createIntroductionInvoice(tx, offer.employerId, offer);
    
    // 6. Notify employer (with revealed identity)
    await this.notifications.send(offer.employer.userId, {
      type: 'offer_accepted',
      title: 'Offer Accepted!',
      body: `${workerIdentity.fullName} has accepted your offer.`,
      actionUrl: `/conversations/${conversation.id}`,
      channelEmail: true,
      channelSms: true
    });
    
    // 7. Notify worker
    await this.notifications.send(workerId, {
      type: 'offer_accepted_confirmation',
      title: 'Offer Accepted',
      body: `Your identity has been shared with ${offer.employer.company.companyName}. You can now message them directly.`,
      actionUrl: `/conversations/${conversation.id}`
    });
    
    return {
      offer,
      conversation,
      invoice,
      workerIdentityRevealed: workerIdentity
    };
  });
}
```

---

## The Anonymous Worker Profile - Deep Dive

### What Employers See

```typescript
// apps/api/src/modules/workers/workers.service.ts

async getPublicProfile(publicId: string, viewerEmployerId?: string): Promise<PublicWorkerProfile> {
  const worker = await this.prisma.worker.findUnique({
    where: { publicId },
    include: {
      region: true,
      skills: {
        where: { level: { not: null } },
        include: { skill: true }
      },
      certifications: {
        where: { verificationStatus: 'verified' }
      },
      blockedCompanies: true
    }
  });
  
  if (!worker) {
    throw new NotFoundException('Profile not found');
  }
  
  // Check if this employer is blocked
  if (viewerEmployerId) {
    const isBlocked = worker.blockedCompanies.some(
      bc => bc.employerId === viewerEmployerId
    );
    
    if (isBlocked) {
      throw new ForbiddenException('This profile is not visible to your company');
    }
  }
  
  // CRITICAL: Strip ALL identifying information
  const {
    userId,           // REMOVE
    postalCode,       // REMOVE
    city,             // REMOVE (use region only)
    deletedAt,        // REMOVE
    ...publicProfile
  } = worker;
  
  // Transform to public view
  return {
    // Anonymous identifier
    publicId: publicProfile.publicId,  // "Profile #8472"
    
    // Location (region only, not exact)
    region: {
      name: publicProfile.region.name,  // "Rotterdam Area"
      distanceKm: this.calculateDistance(viewerEmployerId, publicProfile.region)
    },
    
    // Experience
    yearsOfExperience: publicProfile.yearsOfExperience,
    primaryTrade: publicProfile.primaryTrade,
    
    // Skills (no identifying details)
    skills: publicProfile.skills.map(s => ({
      name: s.skill.name,
      level: s.level,
      yearsOfExperience: s.yearsOfExperience,
      isCertified: s.isVerified
    })),
    
    // Certifications (verified only)
    certifications: publicProfile.certifications.map(c => ({
      name: c.name,
      isValid: c.validUntil > new Date(),
      validUntil: c.validUntil
    })),
    
    // Availability
    availability: publicProfile.availability,
    
    // Preferences (no identifying info)
    desiredSalaryRange: {
      min: publicProfile.desiredSalaryMin,
      max: publicProfile.desiredSalaryMax
    },
    employmentTypes: publicProfile.employmentTypes,
    travelDistanceKm: publicProfile.travelDistanceKm,
    
    // Profile quality signals
    profileCompletenessPct: publicProfile.profileCompletenessPct,
    reputationScore: publicProfile.reputationScore,
    lastActive: publicProfile.updatedAt,
    
    // What employers CANNOT see (explicitly documented)
    hidden: {
      name: 'REDACTED',
      email: 'REDACTED',
      phone: 'REDACTED',
      exactAddress: 'REDACTED',
      currentEmployer: 'REDACTED',
      profilePhoto: 'REDACTED',
      reason: 'Identity is only revealed after offer acceptance'
    }
  };
}
```

### Identity Revelation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IDENTITY REVELATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

BEFORE ACCEPTANCE:
┌─────────────────────────────────────────────────────────────────────────┐
│ Employer View                              │ Worker View                │
├────────────────────────────────────────────┼────────────────────────────┤
│ Profile #8472                              │ Your Profile (Private)     │
│ Rotterdam Area                             │ Name: Marco Vermeulen      │
│ 12 years experience                        │ Email: marco@example.com   │
│ Skills: Electrical Installation (Expert)   │ Phone: +31 6 •••• ••••    │
│                                            │ Current Employer: HIDDEN   │
│ ❌ Name: Hidden                            │                            │
│ ❌ Email: Hidden                           │ Identity Status:           │
│ ❌ Phone: Hidden                           │ ● Hidden from all employers│
│ ❌ Current Employer: Hidden                │                            │
│                                            │ Will be revealed when:     │
│ [Make Offer]                               │ ✓ You accept an offer      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Worker accepts offer
                                    ▼
AFTER ACCEPTANCE:
┌─────────────────────────────────────────────────────────────────────────┐
│ Employer View                              │ Worker View                │
├────────────────────────────────────────────┼────────────────────────────┤
│ ✅ OFFER ACCEPTED!                         │ ✅ Offer Accepted!         │
│                                            │                            │
│ Candidate Revealed:                        │ Your identity is now shared│
│ Marco Vermeulen                            │ with:                      │
│ Email: marco@example.com                   │ Leading Electrical BV      │
│ Phone: +31 6 12345678                      │                            │
│                                            │ Contact: Lisa (HR Manager) │
│ [Start Conversation]                       │                            │
│ [Schedule Interview]                       │ [Send Message]             │
└─────────────────────────────────────────────────────────────────────────┘

CRITICAL: Identity is revealed ALL AT ONCE, not gradually
- Name: Revealed
- Email: Revealed
- Phone: Revealed
- Current Employer: STILL HIDDEN (worker can choose to share later)
```

### Privacy by Design

```typescript
// apps/api/src/common/pipes/anonymous-profile.pipe.ts

// This pipe ensures NO identifying information leaks to employers
@Injectable()
export class AnonymousProfilePipe implements PipeTransform {
  transform(value: any): PublicWorkerProfile {
    // Explicitly whitelist fields that CAN be shown
    const allowedFields = [
      'publicId',
      'region',
      'yearsOfExperience',
      'primaryTrade',
      'skills',
      'certifications',
      'availability',
      'desiredSalaryRange',
      'employmentTypes',
      'travelDistanceKm',
      'profileCompletenessPct',
      'reputationScore',
      'lastActive'
    ];
    
    // Explicitly blacklist fields that CANNOT be shown
    const blacklistedFields = [
      'userId',
      'name',
      'email',
      'phone',
      'postalCode',
      'city',
      'exactAddress',
      'currentEmployer',
      'profilePhoto',
      'deletedAt'
    ];
    
    // Build safe profile
    const safeProfile = {};
    
    for (const field of allowedFields) {
      if (value.hasOwnProperty(field)) {
        safeProfile[field] = value[field];
      }
    }
    
    // Double-check no blacklisted fields leaked through
    for (const field of blacklistedFields) {
      if (safeProfile.hasOwnProperty(field)) {
        throw new Error(
          `SECURITY VIOLATION: Blacklisted field "${field}" found in public profile. ` +
          'This should never happen. Check the AnonymousProfilePipe.`
        );
      }
    }
    
    return safeProfile as PublicWorkerProfile;
  }
}
```

---

## What Can Be Copied vs What Cannot

### Easily Copied (Not Defensible)

| Feature | Why Copiable | Response |
|---------|--------------|----------|
| Search filters | Basic CRUD | Better matching algorithm |
| Messaging | Commodity | Post-acceptance only (core design) |
| Dashboards | UI/UX | Better data, not prettier UI |
| Profile fields | Schema | Anonymous by default (harder to copy) |
| Mobile app | Development | Not a priority initially |

### Hard to Copy (Defensible)

| Feature | Why Defensible | Moat |
|---------|----------------|------|
| Structured offers | Requires employer behavior change | Network effects |
| Anonymous profiles | Requires worker trust | Brand, first-mover |
| Offer comparison | Requires structured data | Data network effects |
| Salary transparency | Employer resistance | Critical mass of offers |
| Identity control | Worker empowerment | Trust, reputation |

### Cannot Be Copied (True Moats)

| Moat | Why | Time to Build |
|------|-----|---------------|
| Offer database | Accumulated structured offers | Years |
| Salary benchmarks | Derived from real offers | Years |
| Worker trust | Privacy track record | Years |
| Employer behavior | Trained to make real offers | Years |
| Two-sided network | Workers + employers | Years |

---

## Minimum Viable Product (Re-scoped)

### Must Have (Core Innovation)

| Feature | Why Essential |
|---------|---------------|
| **Anonymous profile creation** | Supply primitive |
| **Structured offer creation** | Demand primitive |
| **Offer viewing (worker)** | Core value delivery |
| **Offer accept/reject** | Transaction completion |
| **Identity revelation** | The "moment of truth" |
| **Post-acceptance messaging** | Enable hiring |
| **Employer verification** | Trust foundation |

### Can Be Manual (Not Core)

| Feature | Manual Alternative |
|---------|-------------------|
| Search | Admin-curated matches |
| Offer comparison | Side-by-side PDF |
| Analytics | Manual reports |
| Notifications | Manual emails |
| Billing | Manual invoices |
| Verification | Manual KvK check |

### Can Be Excluded (Post-MVP)

| Feature | Reason |
|---------|--------|
| Saved searches | Nice-to-have |
| Offer templates | Employers can re-type |
| Reputation scoring | Need data first |
| Market intelligence | Need scale first |
| Mobile apps | Web works |
| API access | Not needed for MVP |

---

## Technical Implications

### Database Priority

```
CRITICAL (Day 1):
- offers (with full versioning)
- offer_versions (structured data)
- workers (with anonymity fields)
- employers (with verification)
- conversations (post-acceptance)
- messages

IMPORTANT (Week 2-4):
- skills
- certifications
- regions
- notifications

CAN WAIT (Post-MVP):
- ratings
- analytics_events
- subscriptions
- invoices (manual first)
- saved_searches
```

### API Priority

```
CRITICAL (Week 1):
POST /offers              # Create structured offer
GET  /offers/:id          # View offer
POST /offers/:id/accept   # Accept (reveals identity)
POST /offers/:id/reject   # Reject
GET  /workers/:publicId   # Anonymous profile view

IMPORTANT (Week 2-3):
GET  /workers/search      # Employer search
POST /workers             # Create worker profile
PATCH /workers/me         # Update profile
GET  /conversations       # List conversations
POST /conversations/:id/messages

CAN WAIT (Week 4-6):
GET  /offers/stats
POST /offers/:id/shortlist
POST /offers/:id/counter
GET  /analytics/*
```

### Infrastructure Priority

```
CRITICAL:
- PostgreSQL (structured data)
- Basic auth (Clerk)
- Email (transactional)

IMPORTANT:
- Redis (caching, sessions)
- File storage (documents)

CAN WAIT:
- Elasticsearch (basic search works)
- Complex monitoring
- Auto-scaling
```

---

## Success Metrics (Core Innovation Focused)

### North Star Metric

**Structured Offers Per Week** - Number of valid, complete offers submitted

Why this metric:
- Measures employer commitment
- Indicates platform health
- Drives worker activation
- Cannot be gamed (requires real data)

### Supporting Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Offers with full salary | 100% | Core principle |
| Offers accepted within 14 days | 20%+ | Marketplace efficiency |
| Worker identity revealed | = Acceptances | Working as designed |
| Employer repeat offer rate | 60%+ | Employers find value |
| Time to first offer | < 7 days | Worker activation |

### Anti-Metrics (What We Ignore)

| Metric | Why We Ignore It |
|--------|------------------|
| Total registrations | Vanity without offers |
| Profile views | Doesn't measure commitment |
| Messages sent (pre-acceptance) | We don't allow this |
| Time on site | Not a content platform |
| Daily active users | Quality > quantity |

---

## Design Decisions (Non-Negotiable)

### Decision Log

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| No messaging before acceptance | Prevents spam, maintains leverage | Slower initial conversations |
| Salary range max €5K spread | Forces specificity | Some employers won't comply |
| All offer fields required | Enables comparison | Higher friction to create offer |
| Identity revealed all-at-once | Clear boundary, no ambiguity | Worker can't "test the waters" |
| 14-day offer expiry | Creates urgency | Some offers expire unused |
| No "save for later" on offers | Forces decision | Workers might miss offers |

### What We Will NOT Build

| Feature | Why Not |
|---------|---------|
| "Contact candidate" button | Breaks anonymity model |
| Salary hidden until later | Breaks transparency principle |
| Partial offers (drafts) | Breaks comparison feature |
| Employer sees who viewed | Breaks worker privacy |
| Worker sees who viewed (names) | Breaks leverage (can infer identity) |
| Direct email/phone sharing | Must go through platform |
| Job postings | Wrong model (reverse marketplace) |
| Application tracking | Workers don't apply |

---

## The Test: Is This Core or Supporting?

Before building any feature, ask:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE CORE INNOVATION TEST                             │
└─────────────────────────────────────────────────────────────────────────┘

Question 1: Does this enable STRUCTURED OFFERS?
├─ Yes → High priority
└─ No → Continue to Q2

Question 2: Does this enable ANONYMOUS PROFILES?
├─ Yes → High priority
└─ No → Continue to Q3

Question 3: Does this protect worker leverage?
├─ Yes → Medium priority
└─ No → Continue to Q4

Question 4: Is this required for launch?
├─ Yes → Build minimum version
└─ No → Postpone or cut

Examples:
- Offer comparison tool → Q1: Yes → High priority
- Search filters → Q1: No, Q2: No, Q3: No, Q4: No → Post-MVP
- Identity revelation → Q2: Yes → High priority
- Analytics dashboard → Q1: No, Q2: No, Q3: No, Q4: No → Post-MVP
```

---

**Document Owner:** Product / Founders  
**Last Updated:** June 2026  
**Review Cadence:** Every product decision must reference this document
