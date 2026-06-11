# OfferMarket

**A reverse talent marketplace where workers have leverage and employers compete transparently.**

---

## ⚠️ The Core Innovation

**Everything in this system serves two non-negotiable principles:**

### 1. Structured Offers
Employers cannot send empty messages. Every offer must include:
- Specific salary (max €5K range, no "competitive salary")
- Complete benefits (vacation, pension, vehicle, training)
- Clear contract terms (hours, start date, probation)
- Work arrangement (schedule, travel, remote)

**This is the product.** Not a feature.

### 2. Anonymous Worker Profiles
Workers remain anonymous until they accept an offer:
- Identity hidden by default
- Region visible, not exact address
- Skills visible, not current employer
- Worker controls when identity is revealed

**This is the product.** Not a feature.

---

## What This Is NOT

- ❌ A job board (workers don't apply)
- ❌ LinkedIn (no public profiles, no networking)
- ❌ A recruitment agency (platform ≠ employer)
- ❌ A messaging platform (no contact before acceptance)

## What This IS

- ✅ A reverse marketplace (employers compete)
- ✅ Salary transparency (forced disclosure)
- ✅ Worker-controlled (identity on their terms)
- ✅ Structured offers only (no spam)

---

## Documentation Index

### 🎯 Core Innovation (READ FIRST)

| Document | Description |
|----------|-------------|
| **[Core Innovation Design](docs/prd/00-core-innovation.md)** | **The foundational design. Read before everything else.** |

### 📋 Product Requirements

| Document | Description |
|----------|-------------|
| [Product Requirements](docs/prd/01-product-requirements.md) | Full product spec (supporting features) |
| [User Journeys](docs/prd/02-user-journeys.md) | Complete user flows |

### 🏗️ Technical

| Document | Description |
|----------|-------------|
| [Database Schema](docs/technical/database-schema.md) | PostgreSQL design |
| [API Specification](docs/technical/api-specification.md) | REST API |
| [Architecture](docs/technical/architecture.md) | System design |

### 🎨 UX Design

| Document | Description |
|----------|-------------|
| [Wireframes](docs/ux/wireframes.md) | Screen designs |

### 💼 Business

| Document | Description |
|----------|-------------|
| [Marketplace Mechanics](docs/business/marketplace-mechanics.md) | Algorithms, reputation |
| [Revenue Model](docs/business/revenue-model.md) | Financial projections |
| [Launch Strategy](docs/business/launch-strategy.md) | Go-to-market plan |

---

## The Hierarchy

```
                    ┌─────────────────────┐
                    │  STRUCTURED OFFERS  │
                    │  +                  │
                    │  ANONYMOUS PROFILES │
                    │                     │
                    │  THIS IS THE PRODUCT│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌────────────────┐ ┌─────────────┐ ┌─────────────┐
     │ Search         │ │ Messaging   │ │ Analytics   │
     │ (supporting)   │ │ (supporting)│ │ (supporting)│
     └────────────────┘ └─────────────┘ └─────────────┘
     
     CAN BE COPIED    CAN BE COPIED    CAN BE COPIED
     NOT DEFENSIBLE   NOT DEFENSIBLE   NOT DEFENSIBLE
```

---

## The Offer State Machine

```
                    ┌─────────────┐
                    │   DRAFT     │
                    └──────┬──────┘
                           │ SUBMIT (all fields required)
                           ▼
                    ┌─────────────┐
               ┌───>│  SUBMITTED  │<──────────────┐
               │    └──────┬──────┘               │
               │           │                      │
         ┌─────┼─────┬─────┼─────┬────────────┐   │
         │     │     │     │     │            │   │
         ▼     ▼     ▼     ▼     ▼            ▼   │
     ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │
     │ VIEWED │ │EXPIRED │ │WITHDRAWN│ │REJECTED│ │
     └───┬────┘ └────────┘ └────────┘ └────────┘ │
         │                                       │
         ▼         ┌─────────────┐               │
     ┌──────────────┐ │  ACCEPTED │               │
     │ SHORTLISTED  │ │ (IDENTITY │               │
     └──────┬───────┘ │  REVEALED)│               │
            │        └─────────────┘               │
            └──────────────────────────────────────┘
                        (counter → new version)
```

---

## Identity Revelation (The Moment of Truth)

```
BEFORE ACCEPTANCE:                AFTER ACCEPTANCE:
┌──────────────────────┐         ┌──────────────────────┐
│ Employer View        │         │ Employer View        │
├──────────────────────┤         ├──────────────────────┤
│ Profile #8472        │         │ ✅ OFFER ACCEPTED!   │
│ Rotterdam Area       │         │                      │
│ 12 years experience  │         │ Marco Vermeulen      │
│ Skills: [Expert]     │         │ marco@example.com    │
│                      │         │ +31 6 12345678       │
│ ❌ Name: Hidden      │         │                      │
│ ❌ Email: Hidden     │         │ [Start Conversation] │
│ ❌ Phone: Hidden     │         └──────────────────────┘
│ ❌ Current Employer  │
└──────────────────────┘
```

**Identity is revealed ALL AT ONCE, not gradually.**

---

## Minimum Viable Product

### Week 1-2: Core Primitives

```
MUST BUILD (non-negotiable):
├── Anonymous profile creation
├── Structured offer creation (all fields required)
├── Offer viewing
├── Offer accept/reject
├── Identity revelation (on acceptance)
└── Post-acceptance messaging

CAN BE MANUAL:
├── Employer verification (admin does KvK check)
├── Invoicing (manual PDF)
└── Notifications (manual emails)

CAN BE EXCLUDED:
├── Search (admin-curated matches works)
├── Analytics
├── Reputation scoring
├── Saved searches
├── Offer templates
└── Mobile apps
```

---

## Validation Rules (Non-Negotiable)

```typescript
// These rules BLOCK offer submission if violated

{
  salary_range_max_spread: "€5,000",      // Must be specific
  salary_minimum: "€20,000",              // No lowball offers
  salary_required: true,                   // No "competitive"
  hours_valid: "12-40 per week",
  vacation_days_minimum: 20,               // NL legal minimum
  certifications_required: true,           // Must specify
  schedule_required: true                  // Must specify
}
```

---

## The Test: Build or Cut?

Before any feature, ask:

1. **Does this enable STRUCTURED OFFERS?** → Yes = Build
2. **Does this enable ANONYMOUS PROFILES?** → Yes = Build
3. **Does this protect worker leverage?** → Yes = Consider
4. **Is this required for launch?** → No = Cut

**Examples:**
- Offer comparison tool → Q1: Yes → Build
- Search filters → Q1: No, Q2: No, Q3: No, Q4: No → Cut (for MVP)
- Identity revelation → Q2: Yes → Build
- Analytics dashboard → All No → Cut

---

## Tech Stack (Minimal for Core)

| Component | Choice | Why |
|-----------|--------|-----|
| Database | PostgreSQL | Structured data, JSONB for offer versions |
| Backend | NestJS | TypeScript, validation |
| Frontend | Next.js | Forms, SSR |
| Auth | Clerk | Fast setup, not core |
| Hosting | Railway/Render | Simple, not AWS complexity |

**Infrastructure is NOT the product.** The core innovation is.

---

## Success Metrics

### North Star

**Structured Offers Per Week** - Complete, valid offers submitted

### Supporting

| Metric | Target |
|--------|--------|
| Offers with full salary | 100% |
| Acceptance rate | 15-25% |
| Time to first offer | < 7 days |
| Identity revealed (on accept) | 100% |

### Anti-Metrics (Ignore)

| Metric | Why Ignore |
|--------|------------|
| Total registrations | Vanity |
| Profile views | Doesn't measure commitment |
| Messages (pre-accept) | We don't allow this |

---

## Competitive Moat

| Moat | Strength |
|------|----------|
| Structured offer database | Years to accumulate |
| Salary transparency data | Derived from real offers |
| Worker trust (anonymity) | Brand, track record |
| Employer behavior (trained) | Hard to change |
| Two-sided network | Classic marketplace |

**Search can be copied. The offer database cannot.**

---

## File Structure

```
OfferMarket/
├── docs/
│   ├── prd/
│   │   ├── 00-core-innovation.md    # ⚠️ READ THIS FIRST
│   │   ├── 01-product-requirements.md
│   │   └── 02-user-journeys.md
│   ├── technical/
│   ├── ux/
│   └── business/
└── README.md
```

---

## Getting Started

1. **Read [Core Innovation Design](docs/prd/00-core-innovation.md)**
2. Understand what's non-negotiable vs. what can be cut
3. Build the offer primitive first
4. Build anonymous profiles second
5. Everything else is supporting

---

*Last Updated: June 2026*
