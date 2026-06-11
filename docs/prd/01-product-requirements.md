# OfferMarket - Product Requirements Document (PRD)

**Version:** 1.0  
**Date:** June 2026  
**Status:** Foundation Document

---

## Executive Summary

OfferMarket is a reverse talent marketplace where workers create anonymous profiles and employers compete by making structured offers. Starting with electricians in the Netherlands, the platform will expand to all shortage professions globally.

**Vision:** Give workers leverage by reversing the application model. Employers compete. Workers choose.

**Target Revenue:** €100M+ ARR within 7 years

---

## 1. Problem Statement

### Current State (Broken System)

1. **Workers must apply** - Spending hours tailoring applications with no response
2. **Salary opacity** - "Competitive salary" hides actual compensation
3. **Power imbalance** - Employers control all information and access
4. **Messaging chaos** - Recruiters spam without serious offers
5. **No leverage** - Workers compete against hundreds of applicants

### The OfferMarket Solution

1. **No applications** - Workers create profiles, employers approach
2. **Mandatory salary transparency** - Every offer must include compensation
3. **Worker-controlled** - Identity revealed only when worker chooses
4. **Structured offers only** - No empty messages, only concrete terms
5. **Competitive pressure** - Employers compete against each other transparently

---

## 2. Target Market

### Primary Market (Beachhead)

**Electricians in the Netherlands**

- ~85,000 electricians in NL
- Severe shortage: 4,000+ vacancies annually
- Average salary: €35,000 - €55,000
- High demand in: Amsterdam, Rotterdam, Utrecht, Eindhoven
- Strong union standards = clear certification requirements

### Why Electricians First?

1. **Clear certifications** - NEN 3140, VCA, first aid requirements
2. **Standardized skills** - Easy to structure and compare
3. **High demand** - Chronic shortage across all regions
4. **Good wages** - Platform economics work at this salary level
5. **Digital adoption** - Tradespeople increasingly use mobile apps

### Expansion Markets (Phased)

| Phase | Market | Size | Timeline |
|-------|--------|------|----------|
| 1 | Electricians NL | 85K | Months 1-6 |
| 2 | HVAC Technicians NL | 45K | Months 6-12 |
| 3 | Plumbers NL | 40K | Months 12-18 |
| 4 | All Skilled Trades NL | 300K | Months 18-24 |
| 5 | Healthcare NL | 450K | Months 24-36 |
| 6 | DACH Region (All Trades) | 2.5M | Months 36-48 |
| 7 | EU-Wide | 15M+ | Years 5-7 |

---

## 3. User Personas

### 3.1 Worker Personas

#### Primary: "Marco the Electrician"

**Demographics:**
- Age: 34
- Location: Rotterdam, NL
- Experience: 12 years
- Current salary: €48,000
- Family: Married, 2 children

**Goals:**
- Better work-life balance
- Higher compensation
- Less commute time
- Career growth opportunities

**Frustrations:**
- Too busy to job hunt
- Doesn't know his market value
- Hates writing applications
- Privacy concerns (doesn't want current employer to know)

**Platform Behavior:**
- Creates profile in 5 minutes
- Sets availability to "open to offers"
- Receives 5-8 offers per week
- Compares offers on weekends
- Accepts interview when ready

#### Secondary: "Sarah the Nurse"

**Demographics:**
- Age: 29
- Location: Amsterdam, NL
- Experience: 6 years
- Current salary: €42,000
- Single, flexible

**Goals:**
- Flexible schedule
- Professional development
- Higher pay for specialized skills

---

### 3.2 Employer Personas

#### Primary: "Technical Recruiter Tom"

**Demographics:**
- Age: 41
- Role: Senior Technical Recruiter
- Company: Medium-sized electrical contractor (50-200 employees)
- Hiring volume: 15-20 electricians/year

**Goals:**
- Fill positions faster
- Quality candidates
- Reduce agency fees
- Better hire retention

**Frustrations:**
- Job boards are expensive and slow
- Agencies charge 20-30% fees
- Candidates ghost after interviews
- Can't compete with big companies on brand

**Platform Behavior:**
- Searches for certified electricians
- Makes 10-15 offers per week
- Tracks offer acceptance rate
- Adjusts compensation based on market data

#### Secondary: "HR Director Helena"

**Demographics:**
- Age: 52
- Role: HR Director
- Company: Large facility management company (500+ employees)
- Hiring volume: 50+ tradespeople/year

**Goals:**
- Pipeline of qualified candidates
- Employer branding
- Data-driven compensation
- Reduced time-to-hire

---

### 3.3 Admin & Support Personas

#### Platform Admin "Alex"

**Role:** Operations Manager
**Responsibilities:**
- Verify employer accounts
- Monitor fraud detection
- Handle escalations
- Review reported content
- Manage platform settings

#### Support Specialist "Sam"

**Role:** Customer Support
**Responsibilities:**
- Worker onboarding assistance
- Employer technical support
- Offer dispute resolution
- Account recovery
- General inquiries

---

## 4. Core Features

### 4.1 Anonymous Talent Profiles

**Requirements:**

| Field | Visible to Employers | Notes |
|-------|---------------------|-------|
| Name | ❌ Hidden | Revealed after acceptance |
| Email | ❌ Hidden | Platform communication only |
| Phone | ❌ Hidden | Revealed after acceptance |
| Exact Address | ❌ Hidden | Region only (e.g., "Rotterdam Area") |
| Current Employer | ❌ Hidden | Industry only |
| Profile Photo | ❌ Hidden | Optional avatar/icon only |
| Region | ✅ Visible | City/region level |
| Skills | ✅ Visible | With proficiency levels |
| Certifications | ✅ Visible | Verified badges |
| Years of Experience | ✅ Visible | Total and per skill |
| Availability | ✅ Visible | Timeline only |
| Salary Expectations | ✅ Visible | Range format |
| Work Preferences | ✅ Visible | Contract type, travel, etc. |

**Profile Completion States:**
1. **Draft** - Profile started, not visible
2. **Incomplete** - Basic info, 40-60% complete, limited visibility
3. **Complete** - 100% complete, full visibility
4. **Verified** - Identity verified, boosted visibility badge

**Privacy Controls:**
- Toggle visibility on/off
- Block specific companies
- Control which employers can see profile
- Reveal identity only to accepted offers

---

### 4.2 Structured Offer System

**Offer Fields (All Required):**

#### Compensation
| Field | Type | Validation |
|-------|------|------------|
| Base Salary | Number (€) | Min €20,000, Max €200,000 |
| Hourly Rate | Number (€) | Required if part-time/contract |
| Sign-on Bonus | Number (€) | Optional, max 20% of salary |
| Performance Bonus | Percentage | 0-50% of base |
| Overtime Rate | Number (€) | Required for trades |

#### Contract Terms
| Field | Type | Options |
|-------|------|---------|
| Contract Type | Select | Permanent, Fixed-term, Contract, Freelance |
| Duration | Number (months) | For fixed-term only |
| Hours per Week | Number | 12-40 |
| Start Date | Date | Flexible or specific |
| Probation Period | Number (months) | 0-6 |

#### Benefits
| Field | Type | Options |
|-------|------|---------|
| Vacation Days | Number | 20-40 |
| Holiday Allowance | Percentage | 0-12% (NL standard: 8%) |
| Pension Contribution | Percentage | 0-15% |
| Training Budget | Number (€) | 0-10,000 |
| Company Vehicle | Boolean + Details | Yes/No, type |
| Travel Allowance | Number (€) | Per month or km |
| Flexible Schedule | Boolean | Yes/No |
| Remote Work | Percentage | 0-100% |
| Shift Premium | Percentage | For shift work |

#### Requirements
| Field | Type |
|-------|------|
| Required Certifications | List |
| Required Experience | Years |
| Physical Requirements | Text |
| Travel Requirements | Percentage |
| On-call Requirements | Boolean + Details |

**Offer States:**

```
┌─────────────┐
│   DRAFT     │ ← Employer creating offer
└──────┬──────┘
       │ Submit
       ▼
┌─────────────┐
│  SUBMITTED  │ ← Sent to worker, visible
└──────┬──────┘
       │
       ├──────────────┬──────────────┬─────────────┐
       │              │              │             │
       ▼              ▼              ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ VIEWED   │  │ EXPIRED  │  │ WITHDRAWN│  │ REJECTED │
└────┬─────┘  └──────────┘  └──────────┘  └──────────┘
     │
     ├─────────────┬─────────────┐
     │             │             │
     ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│SHORTLISTED│ │ COUNTERED│ │ ACCEPTED │
└──────────┘ └────┬─────┘ └──────────┘
                  │
                  ▼
           ┌──────────┐
           │SUBMITTED │ ← New version
           └──────────┘
```

**State Transition Rules:**

| From | To | Allowed | Notes |
|------|-----|---------|-------|
| DRAFT | SUBMITTED | ✅ | Requires all required fields |
| SUBMITTED | VIEWED | ✅ | Auto when worker opens |
| SUBMITTED | EXPIRED | ✅ | Auto after 14 days |
| SUBMITTED | WITHDRAWN | ✅ | Employer action |
| SUBMITTED | REJECTED | ✅ | Worker action |
| SUBMITTED | SHORTLISTED | ✅ | Worker action |
| SUBMITTED | COUNTERED | ✅ | Worker counter-offer |
| SHORTLISTED | ACCEPTED | ✅ | Worker action |
| SHORTLISTED | REJECTED | ✅ | Worker action |
| COUNTERED | SUBMITTED | ✅ | New offer version |
| ACCEPTED | * | ❌ | Terminal state |
| REJECTED | * | ❌ | Terminal state |
| EXPIRED | * | ❌ | Terminal state |

---

### 4.3 Offer Comparison System

**Comparison Matrix View:**

Workers can select 2-5 offers to compare side-by-side.

**Comparison Categories:**

1. **Total Compensation**
   - Base salary (annualized)
   - Bonus potential
   - Sign-on bonus
   - Total year 1 value

2. **Benefits Value**
   - Pension contribution
   - Training budget
   - Vehicle value
   - Travel allowance

3. **Work-Life Balance**
   - Hours per week
   - Vacation days
   - Flexible schedule
   - Remote work %

4. **Career Growth**
   - Training opportunities
   - Promotion path
   - Skill development
   - Company size/stability

5. **Practical Factors**
   - Commute time
   - Start date flexibility
   - Contract type
   - Team size

**Scoring Algorithm:**

Each offer receives a **Match Score** (0-100) based on:
- Worker preferences (40% weight)
- Compensation vs expectations (25% weight)
- Benefits package (15% weight)
- Employer reputation (10% weight)
- Response time/engagement (10% weight)

---

### 4.4 Search & Discovery

**Employer Search Filters:**

| Filter | Type | Options |
|--------|------|---------|
| Skills | Multi-select | All platform skills |
| Region | Radius | 10km, 25km, 50km, 100km, National |
| Experience | Range | 0-1, 1-3, 3-5, 5-10, 10+ years |
| Certifications | Multi-select | Required certifications |
| Availability | Select | Immediate, 1 month, 3 months, 6 months |
| Contract Type | Multi-select | Permanent, Contract, Freelance |
| Salary Range | Range slider | €20K - €100K+ |
| Language | Multi-select | Dutch, English, etc. |

**Search Results Display:**

- Anonymous profile cards
- Skill match percentage
- Distance from employer location
- Availability badge
- Certification badges
- "Make Offer" CTA

**Search Ranking Algorithm:**

Profiles ranked by:
1. Skill match (40%)
2. Availability (20%) - sooner = higher
3. Location proximity (15%)
4. Experience level (15%)
5. Profile completeness (10%)

---

### 4.5 Trust & Verification Layer

#### Employer Verification

**Tier 1: Basic Verification**
- [ ] Company registration number (KvK in NL)
- [ ] Business address verification
- [ ] Domain email verification
- [ ] Phone verification
- [ ] Terms acceptance

**Tier 2: Enhanced Verification**
- [ ] Bank account verification
- [ ] Reference check (2 clients)
- [ ] Insurance verification
- [ ] Industry association membership

**Verification Badge Display:**
- ✅ Verified Employer (Tier 1)
- ✅✅ Premium Verified (Tier 2)

#### Worker Verification

**Tier 1: Identity Verification**
- [ ] Government ID upload
- [ ] Selfie verification
- [ ] Phone verification
- [ ] Email verification

**Tier 2: Professional Verification**
- [ ] Certification uploads
- [ ] Certificate authority verification
- [ ] Reference employers (2)
- [ ] Work portfolio (photos/projects)

**Verification Badge Display:**
- 🔒 Verified Professional (Tier 1)
- 🔒🔒 Certified Professional (Tier 2)

#### Fraud Prevention

**Automated Detection:**
- Duplicate account detection (email, phone, device, IP)
- Suspicious offer patterns (too low, spam-like)
- Fake certification detection
- Unusual search behavior
- Bot detection

**Manual Review Triggers:**
- New employer, high-volume offers
- Worker reports
- Certification disputes
- Payment disputes
- Identity disputes

**Reputation Scoring:**

**Employer Reputation Score (0-100):**
- Offer acceptance rate (30%)
- Response time (20%)
- Worker ratings (25%)
- Profile completeness (15%)
- Verification level (10%)

**Worker Reputation Score (0-100):**
- Profile completeness (20%)
- Response rate (20%)
- Offer acceptance rate (15%)
- Verification level (25%)
- Professional activity (20%)

---

### 4.6 Market Intelligence Layer

**Data Products:**

#### For Workers

1. **Market Value Score**
   - Based on skills, experience, location
   - Updated weekly
   - Compared to similar profiles

2. **Demand Indicator**
   - Profile views per week
   - Offer count trends
   - Skill demand heatmap

3. **Salary Benchmark**
   - What similar workers earn
   - Regional variations
   - Skill premiums

#### For Employers

1. **Talent Availability**
   - Number of qualified candidates
   - Regional supply
   - Time to hire estimates

2. **Compensation Benchmarks**
   - Market rates by role/region
   - Benefits standards
   - Competitor analysis (aggregated)

3. **Offer Performance**
   - Acceptance rate vs market
   - Time to acceptance
   - Competitive positioning

#### For Platform (Internal)

1. **Marketplace Health Metrics**
   - Liquidity ratio (offers/profile)
   - Match rate
   - Time to first offer
   - Activation rates

2. **Pricing Intelligence**
   - Willingness to pay
   - Price elasticity
   - Conversion by price point

---

### 4.7 Analytics Dashboard

#### Worker Analytics

| Metric | Description |
|--------|-------------|
| Profile Views | Views per day/week/month |
| Offer Count | Total and active offers |
| Market Value Trend | 30/60/90 day trend |
| Demand Score | 0-100 based on interest |
| Top Viewers | Which companies viewed (anonymized) |
| Skill Demand | Which skills get most interest |
| Comparison Activity | How often compared vs others |

#### Employer Analytics

| Metric | Description |
|--------|-------------|
| Offer Acceptance Rate | % of offers accepted |
| Time to Hire | Avg days from offer to accept |
| Candidate Engagement | Views, shortlists, responses |
| Funnel Metrics | Views → Offers → Accepts |
| Competitive Position | How offers compare to market |
| Spend Analytics | Total platform spend |
| ROI Metrics | Cost per hire vs alternatives |

#### Admin Analytics

| Metric | Description |
|--------|-------------|
| Total Users | Workers, Employers |
| Active Users | DAU, WAU, MAU |
| New Signups | Daily/weekly trends |
| Verification Queue | Pending verifications |
| Report Queue | Pending reports |
| Revenue Metrics | MRR, ARR, LTV |
| Marketplace Metrics | Liquidity, match rate |

---

## 5. Monetization Model

### Phase 1: Pay-Per-Introduction (Months 1-12)

**Model:** Employers pay per accepted offer (introduction)

| Tier | Price | Features |
|------|-------|----------|
| Starter | €499/intro | 1 introduction, basic support |
| Growth | €399/intro | 3+ introductions, priority support |
| Volume | €299/intro | 10+ introductions, dedicated AM |

**Worker Side:** Always free

**Expected Conversion:**
- 15% of employers who make offers get accepted
- Average 3 introductions/month per active employer

### Phase 2: Subscription Plans (Months 12-24)

**Model:** Monthly subscription + reduced intro fees

| Plan | Monthly | Intro Fee | Features |
|------|---------|-----------|----------|
| Basic | €199 | €299 | 5 offers/month, basic search |
| Professional | €499 | €199 | 20 offers/month, advanced filters |
| Enterprise | €999 | €149 | Unlimited offers, API access, SLA |

### Phase 3: Success Fees (Months 24-36)

**Model:** Lower subscription + percentage of first-year salary

| Plan | Monthly | Success Fee | Features |
|------|---------|-------------|----------|
| Standard | €299 | 8% | Standard contract terms |
| Premium | €499 | 6% | Priority placement, branding |

### Phase 4: Market Intelligence (Months 36+)

**Model:** Add-on subscriptions for data products

| Product | Monthly | Target |
|---------|---------|--------|
| Salary Benchmarks | €299 | HR teams |
| Market Intelligence | €499 | Enterprise |
| Custom Reports | €999+ | Consultants, PE |

### Pricing Evolution Rationale

1. **Start simple** - Pay-per-intro is easy to understand
2. **Add predictability** - Subscriptions for active users
3. **Align incentives** - Success fees tied to outcomes
4. **Data monetization** - High-margin add-on products

### Revenue Projections (Years 1-5)

| Year | Employers | Avg Revenue/Employer | ARR |
|------|-----------|---------------------|-----|
| 1 | 150 | €8,000 | €1.2M |
| 2 | 500 | €12,000 | €6M |
| 3 | 1,500 | €15,000 | €22.5M |
| 4 | 4,000 | €18,000 | €72M |
| 5 | 8,000 | €20,000 | €160M |

---

## 6. MVP Scope (6-Week Launch)

### In Scope (Must Have)

**Worker Features:**
- [ ] Email/password signup
- [ ] Basic profile creation (skills, experience, region)
- [ ] Profile visibility toggle
- [ ] View offers
- [ ] Accept/Reject offers
- [ ] Simple messaging (post-acceptance only)

**Employer Features:**
- [ ] Company signup + KvK verification
- [ ] Search profiles (basic filters)
- [ ] Create structured offers
- [ ] View offer status
- [ ] Simple messaging (post-acceptance only)

**Admin Features:**
- [ ] User management
- [ ] Employer verification dashboard
- [ ] Basic reporting

**Technical:**
- [ ] Web app (Next.js)
- [ ] API (NestJS)
- [ ] PostgreSQL database
- [ ] Basic email notifications
- [ ] Stripe integration (manual invoicing for MVP)

### Out of Scope (Post-MVP)

- [ ] Advanced search filters
- [ ] Offer comparison tool
- [ ] Market intelligence dashboards
- [ ] Mobile apps
- [ ] Advanced verification (certifications)
- [ ] Reputation scoring
- [ ] Analytics dashboards
- [ ] Webhooks/integrations
- [ ] API access

### Manual Processes (MVP)

1. **Employer verification** - Manual KvK check by admin
2. **Invoicing** - Manual invoice generation, not automated
3. **Payment collection** - Bank transfer, not card
4. **Support** - Email support, no chat
5. **Certification verification** - Manual review

---

## 7. Success Metrics

### MVP Success Criteria (Month 3)

| Metric | Target |
|--------|--------|
| Active Worker Profiles | 500+ |
| Active Employer Accounts | 50+ |
| Offers Made | 200+ |
| Offers Accepted | 30+ |
| Time to First Offer | < 7 days |
| Worker Retention (30-day) | 60%+ |
| Employer Retention (30-day) | 70%+ |

### Series A Criteria (Month 18)

| Metric | Target |
|--------|--------|
| Active Worker Profiles | 25,000+ |
| Active Employer Accounts | 500+ |
| Monthly Introductions | 200+ |
| MRR | €200,000+ |
| NPS (Workers) | 50+ |
| NPS (Employers) | 40+ |
| Gross Margin | 80%+ |

---

## 8. Risks & Mitigations

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chicken-egg problem | High | High | Seed with worker profiles first, concierge employer onboarding |
| Employer price sensitivity | Medium | Medium | Start with pay-per-intro, prove ROI before subscriptions |
| Incumbent response (LinkedIn, Indeed) | Medium | High | Focus on anonymity + structured offers, they can't copy easily |
| Worker adoption slow | Medium | High | Partner with unions, trade schools, certification bodies |

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Privacy breach | Low | Critical | Encryption, minimal data, regular audits, insurance |
| Fake profiles | Medium | High | Verification system, manual review, reporting |
| Platform abuse | Medium | Medium | Rate limits, monitoring, quick suspension capability |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Fraudulent employers | Medium | High | Manual verification, bank verification, references |
| Disputed introductions | Medium | Medium | Clear terms, mediation process, escrow option |
| Regulatory compliance | Low | High | GDPR from day 1, legal counsel, Dutch employment law |

---

## 9. Compliance Requirements

### GDPR Compliance

- [ ] Data minimization
- [ ] Right to erasure
- [ ] Data portability
- [ ] Consent management
- [ ] DPA with processors
- [ ] EU data residency

### Dutch Employment Law

- [ ] Terms comply with Dutch labor law
- [ ] Clear distinction: platform ≠ employer
- [ ] No discriminatory filtering
- [ ] Transparency requirements met

### Payment Regulations

- [ ] Stripe compliance
- [ ] VAT handling (EU)
- [ ] Invoice requirements (NL)
- [ ] Anti-money laundering (business customers)

---

## 10. Appendix

### Glossary

| Term | Definition |
|------|------------|
| Offer | Structured employment proposal with compensation |
| Introduction | Accepted offer leading to employer contact |
| Match Score | Algorithmic fit between worker and offer |
| Verification | Identity/credential confirmation process |
| Reputation Score | Platform trust metric |

### Related Documents

- [User Journeys](./02-user-journeys.md)
- [Database Schema](../technical/database-schema.md)
- [API Specification](../technical/api-spec.md)
- [UX Wireframes](../ux/wireframes.md)

---

**Document Owner:** Product  
**Last Updated:** June 2026  
**Next Review:** Monthly or upon major feature changes
