# OfferMarket - Launch & Growth Strategy

**Version:** 1.0  
**Date:** June 2026

---

## Executive Summary

**Mission:** Reverse the job market. Give workers leverage. Make employers compete.

**Beachhead:** Electricians in the Netherlands

**Launch Timeline:** 6 weeks to MVP

**Target (Year 1):** €1.2M ARR, 150 employers, 5,000 workers

---

## 6-Week MVP Launch Plan

### Week 1-2: Foundation

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WEEK 1-2: FOUNDATION                                                    │
└─────────────────────────────────────────────────────────────────────────┘

Technical:
├── Set up development environment
├── Initialize codebase (Next.js + NestJS)
├── Configure CI/CD pipeline
├── Set up AWS infrastructure (dev)
├── Database schema finalization
└── Authentication integration (Clerk)

Product:
├── Finalize PRD and user journeys
├── Complete wireframe designs
├── Set up analytics (PostHog)
└── Define success metrics

Operations:
├── Company registration (NL)
├── Bank account setup
├── Stripe account setup
├── Legal: Terms of Service, Privacy Policy
└── GDPR compliance review
```

### Week 3-4: Core Development

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WEEK 3-4: CORE DEVELOPMENT                                              │
└─────────────────────────────────────────────────────────────────────────┘

Frontend:
├── Landing pages (worker + employer)
├── Worker signup flow
├── Profile creation wizard
├── Worker dashboard
├── Employer signup flow
└── Employer dashboard

Backend:
├── User authentication APIs
├── Worker profile CRUD
├── Employer profile CRUD
├── Search functionality
├── Offer creation/management
└── Basic notifications

Infrastructure:
├── PostgreSQL setup (RDS)
├── Redis cache (ElastiCache)
├── Email service (SES)
└── Monitoring (CloudWatch + Sentry)
```

### Week 5-6: Polish & Launch Prep

```
┌─────────────────────────────────────────────────────────────────────────┐
│ WEEK 5-6: POLISH & LAUNCH PREP                                          │
└─────────────────────────────────────────────────────────────────────────┘

Testing:
├── End-to-end testing (Playwright)
├── Load testing (basic)
├── Security audit (basic)
└── Mobile responsiveness check

Content:
├── Landing page copy
├── Email templates
├── Help center articles
└── Social media assets

Soft Launch Prep:
├── Recruit beta employers (10 target)
├── Recruit beta workers (100 target)
├── Prepare onboarding calls
└── Set up feedback collection

Launch:
├── Production deployment
├── DNS configuration
├── SSL certificates
└── Final smoke tests
```

---

## Go-to-Market Strategy

### Phase 1: Supply Side (Workers) - First 4 Weeks

**Goal:** Seed platform with 500+ quality worker profiles before employer onboarding

**Why first:** Employers will leave quickly if they don't find talent

#### Worker Acquisition Tactics

**1. Trade School Partnerships**

```
Target: 10 trade schools in Netherlands
Approach: Partnership for graduate placement

Value Prop:
- Free for graduates
- Better job outcomes
- Salary transparency
- No agency fees

Action Items:
├── Identify top 20 trade schools
├── Find career services contacts
├── Prepare partnership deck
├── Schedule meetings (founder-led)
└── Offer: Free premium profiles for graduates

Target: 50 graduates/school = 500 profiles
```

**2. Union Partnerships**

```
Target: FNV Bouw, CNV Vakmensen (construction unions)

Value Prop:
- Member benefit (free)
- Better wages through transparency
- Worker-controlled marketplace
- No agency exploitation

Action Items:
├── Contact union leadership
├── Present at union meetings
├── Offer: Exclusive access for members
└── Co-marketing opportunities

Target: 200 union members
```

**3. Facebook/Instagram Ads**

```
Target: Electricians, 25-55, Netherlands

Ad Creative:
- "Electricians: See what you're worth"
- "No applications. Companies compete for you."
- "€45K-€65K offers from verified employers"

Budget: €5,000/month (Month 1-2)
Target CPA: €40/worker
Expected: 125 workers/month

Platforms:
├── Facebook (primary)
├── Instagram (secondary)
└── WhatsApp sharing (viral)
```

**4. Referral Program**

```
Program: "Invite Colleagues"

Incentive:
- Referrer: €25 bol.com gift card
- Referee: Priority profile placement

Mechanics:
├── Unique referral link
├── Track via dashboard
├── Auto-reward at 100 referrals
└── Leaderboard (monthly prizes)

Target: 20% of workers refer 1+ colleagues
```

**5. Content Marketing**

```
SEO Strategy:
├── "Electrician salary Netherlands"
├── "Electrician jobs Rotterdam"
├── "NEN 3140 certification requirements"
└── "How to become electrician NL"

Content Calendar:
├── 2 blog posts/week
├── 1 guide/month (long-form)
├── Salary benchmark reports (quarterly)
└── Worker success stories

Target: 1,000 organic visitors/month by Month 6
```

---

### Phase 2: Demand Side (Employers) - Weeks 5-12

**Goal:** Onboard 50 paying employers in first 8 weeks

#### Employer Acquisition Tactics

**1. Concierge Onboarding**

```
Target: 50 founding employers

Approach: High-touch, founder-led

Process:
├── Initial call (30 min)
│   ├── Understand hiring needs
│   ├── Explain platform
│   └── Set expectations
├── Company verification (expedited)
├── First offer creation (hand-holding)
├── Weekly check-ins (first month)
└── Feedback collection

Conversion Target: 60% of demos → paying

Why it works:
- Builds strong relationships
- Immediate feedback loop
- Early advocates
```

**2. LinkedIn Outreach**

```
Target: Technical recruiters, HR managers, company owners

Search Criteria:
- Title: "Recruiter", "HR Manager", "Owner"
- Company: Electrical contractors, 10-200 employees
- Location: Netherlands

Message Template:
"Hi [Name], I noticed [Company] hires electricians regularly. 
We've built a new platform where electricians create anonymous 
profiles and employers compete with transparent offers. 

We have 500+ electricians in [Region] already. Would you be 
open to a 15-min demo?

First 10 employers get founding member pricing (€299/intro vs €499)."

Volume: 100 messages/week
Response Rate: 15%
Meeting Rate: 5%
Conversion: 2%

Expected: 2 new employers/week
```

**3. Google Ads**

```
Keywords:
├── "hire electrician Netherlands"
├── "electrician recruitment"
├── "technical recruitment agency"
├── "hire skilled trades"
└── "electrician staffing"

Budget: €3,000/month
Target CPC: €3-€5
Landing Page: Employer-focused

Expected:
- 600 clicks/month
- 5% conversion to demo: 30 demos
- 20% close rate: 6 employers/month

CAC: €500 (acceptable for LTV of €8,000+)
```

**4. Industry Events**

```
Target Events:
├── Vakbeurs Facilitair (March)
├── Holland Tech Events
├── Local chamber of commerce events
└── Trade association meetings

Booth Strategy:
├── Live demo station
├── "See available talent" interactive
├── Founding member pricing (event exclusive)
└── Collect leads for follow-up

Target: 5-10 employers/event
```

**5. Referral Program (Employers)**

```
Program: "Refer an Employer"

Incentive:
- Referrer: €250 credit
- Referee: €100 credit on first intro

Mechanics:
├── Unique referral code
├── Credit applied after referee's first intro
└── No limit on referrals

Target: 30% of employers refer 1+ colleague
```

---

## Growth Strategy (Months 3-12)

### Growth Loops

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRIMARY GROWTH LOOPS                                 │
└─────────────────────────────────────────────────────────────────────────┘

Loop 1: Worker Flywheel
─────────────────────────
More Workers → More Employer Value → More Employers → More Offers → 
More Success Stories → More Workers (via referrals)

Loop 2: Content SEO
─────────────────────────
Salary Data → Blog Posts → SEO Traffic → Worker Signups → 
More Salary Data (reinforcing)

Loop 3: Employer Network
─────────────────────────
Happy Employers → Referrals → More Employers → 
More Competition → Better Offers → More Worker Activations

Loop 4: Viral Profiles
─────────────────────────
Worker Success → Social Sharing → FOMO → 
New Worker Signups → More Supply
```

### Growth Experiments (Quarterly)

**Q1 Experiments:**
| Experiment | Hypothesis | Metric | Target |
|------------|------------|--------|--------|
| Referral €25 vs €50 | Higher incentive = more referrals | Referrals/user | 0.3 |
| LinkedIn vs Facebook ads | LinkedIn has better employer quality | CAC payback | < 2 months |
| Concierge vs self-serve | High-touch = higher retention | 30-day retention | 70% |
| Salary transparency | Showing ranges = more clicks | Profile CTR | 15% |

**Q2 Experiments:**
| Experiment | Hypothesis | Metric | Target |
|------------|------------|--------|--------|
| Subscription launch | Predictable pricing = higher LTV | MRR growth | 20%/month |
| Saved searches | Alerts = more engagement | Weekly active | 50% |
| Offer templates | Easier offer creation = more offers | Offers/employer | 5/week |
| Verification badge | Verified = more trust | Offer acceptance | 25% |

---

## Retention Strategy

### Worker Retention

**Problem:** Workers leave after finding a job

**Solutions:**
1. **Keep Profile Active**
   - "Update your profile quarterly" reminders
   - Market value updates (email)
   - "See new offers" notifications

2. **Career Growth positioning**
   - Not a job board, a career platform
   - "Always know your worth" messaging
   - Annual salary check-ins

3. **Alumni Network**
   - Success story features
   - Referral bonuses (for referring other workers)
   - Exclusive content (career advice)

**Target Metrics:**
- 30-day retention: 60%
- 90-day retention: 40%
- 12-month retention: 20% (acceptable for job changers)

### Employer Retention

**Problem:** Employers leave if they don't hire

**Solutions:**
1. **Success-Based Pricing**
   - Only pay when you hire
   - No upfront commitment
   - Money-back guarantee (30 days)

2. **Ongoing Value**
   - Market intelligence (free tier)
   - Salary benchmarks
   - Talent pipeline (save searches)

3. **Account Management**
   - Dedicated contact (Professional+)
   - Monthly check-ins
   - Offer optimization tips

**Target Metrics:**
- 30-day retention: 80%
- 90-day retention: 60%
- 12-month retention: 50%

---

## Geographic Expansion

### Netherlands Rollout

```
Phase 1: Randstad (Months 1-3)
├── Amsterdam
├── Rotterdam
├── The Hague
└── Utrecht
Target: 60% of Dutch electricians

Phase 2: Major Cities (Months 4-6)
├── Eindhoven
├── Groningen
├── Enschede
└── Maastricht
Target: 85% coverage

Phase 3: National (Months 7-12)
├── All remaining municipalities
├── Rural areas
└── Cross-border (Belgium, Germany)
Target: Full NL coverage
```

### International Expansion

**Decision Criteria:**
- Market size > 50,000 target workers
- Similar certification systems
- Digital adoption > 70%
- Labor shortage in target trades

**Expansion Roadmap:**

| Market | Entry | Workers | Employers | Localization Needed |
|--------|-------|---------|-----------|---------------------|
| Germany | Month 18 | 300K | 3K | Language, certifications, VAT |
| Belgium | Month 20 | 50K | 500 | Language (FR/NL), certifications |
| France | Month 24 | 200K | 2K | Language, labor law |
| UK | Month 30 | 250K | 3K | Language, certifications |
| Nordics | Month 36 | 100K | 1K | Language, labor law |

---

## Vertical Expansion

### Timeline

```
Year 1: Electricians (proven model)
Year 2: + HVAC, Plumbers (adjacent trades)
Year 3: + Industrial Maintenance (adjacent skills)
Year 4: Healthcare (nurses, care workers)
Year 5: Logistics, Manufacturing
```

### Expansion Criteria

**Before launching new vertical:**
1. Core vertical profitable
2. 80%+ retention in core vertical
3. Clear certification/skill mapping
4. Similar employer profile
5. Market size > 30,000 workers

### Vertical Playbook

```
Step 1: Market Research (4 weeks)
├── Map certifications
├── Understand salary norms
├── Interview 20 workers
├── Interview 20 employers
└── Validate demand

Step 2: Product Adaptation (4 weeks)
├── Add vertical-specific skills
├── Update certification fields
├── Adapt offer templates
└── Create vertical-specific content

Step 3: Soft Launch (4 weeks)
├── Recruit 50 workers (beta)
├── Recruit 10 employers (beta)
├── Gather feedback
└── Iterate

Step 4: Full Launch (ongoing)
├── Marketing campaign
├── PR push
├── Partnership announcements
└── Growth experiments
```

---

## Competitive Moats

### Moat 1: Data Network Effects

**What:** More transactions = better matching = more value

**How it compounds:**
- More offers → Better salary benchmarks
- More matches → Better matching algorithm
- More profiles → Better search results
- More data → Harder for competitors to catch up

**Defensibility:** High
- Takes years to accumulate
- Proprietary dataset
- Improves core product

### Moat 2: Brand

**What:** "Go-to platform for shortage professions"

**How it compounds:**
- More success stories → More trust → More signups
- More market share → More press → More awareness
- More workers → More employer awareness

**Defensibility:** Medium-High
- Takes time to build
- Hard to replicate reputation
- First-mover advantage

### Moat 3: Switching Costs

**What:** Employers invest in profile, history, reputation

**How it compounds:**
- More offers sent → More history → Higher switching cost
- More hires → More reviews → Reputation value
- More team members → More workflow integration

**Defensibility:** Medium
- Not insurmountable
- Mitigated by outcome-based pricing

### Moat 4: Two-Sided Network

**What:** Chicken-and-egg problem for competitors

**How it compounds:**
- More workers → More employers → More workers
- Geographic density → Better matches → More growth
- Vertical density → Better matching → More growth

**Defensibility:** High
- Classic marketplace moat
- Requires massive funding to challenge
- Local network effects

---

## Risk Mitigation

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LinkedIn copies model | Medium | High | Focus on anonymity + structured offers (they can't easily copy) |
| Economic downturn | Medium | Medium | Shortage professions remain in demand; value prop stronger in downturn |
| Worker adoption slow | Medium | High | Increase marketing budget; partner with unions/trade schools |
| Employer price resistance | High | Medium | Prove ROI with case studies; flexible pricing |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Fraudulent profiles | Medium | High | Robust verification; manual review; insurance |
| Platform abuse | Medium | Medium | Rate limits; monitoring; quick suspension |
| Data breach | Low | Critical | Encryption; minimal data; regular audits; cyber insurance |
| Key person dependency | High | Medium | Document processes; cross-train team; hire early |

### Regulatory Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| GDPR violation | Low | High | Privacy from day 1; legal counsel; DPO appointment |
| Labor law changes | Medium | Medium | Monitor legislation; flexible terms; legal retainer |
| Agency classification | Low | High | Clear terms; platform ≠ employer; legal structure |

---

## Success Milestones

### 6-Month Milestones

| Metric | Target | Stretch |
|--------|--------|---------|
| Active Workers | 2,000 | 3,000 |
| Active Employers | 100 | 150 |
| Monthly Introductions | 30 | 50 |
| MRR | €50K | €75K |
| NPS (Workers) | 40 | 50 |
| NPS (Employers) | 35 | 45 |

### 12-Month Milestones

| Metric | Target | Stretch |
|--------|--------|---------|
| Active Workers | 5,000 | 7,500 |
| Active Employers | 200 | 300 |
| Monthly Introductions | 100 | 150 |
| ARR | €1.2M | €1.8M |
| Gross Margin | 85% | 90% |
| Employer Retention | 70% | 80% |

### 24-Month Milestones

| Metric | Target | Stretch |
|--------|--------|---------|
| Active Workers | 25,000 | 35,000 |
| Active Employers | 750 | 1,000 |
| Monthly Introductions | 400 | 600 |
| ARR | €10M | €15M |
| Gross Margin | 88% | 92% |
| EBITDA Positive | Yes | Yes |

---

## Investment in Growth

### Marketing Budget Allocation

| Year | Budget | % of Revenue | Primary Channels |
|------|--------|--------------|------------------|
| 1 | €300K | 25% | Performance marketing, events |
| 2 | €1.2M | 20% | Performance + brand |
| 3 | €3.6M | 16% | Brand, content, partnerships |
| 4 | €10.8M | 15% | Full-funnel marketing |
| 5 | €24.0M | 15% | Market expansion, brand |

### Hiring Plan

| Year | Team Size | Key Hires |
|------|-----------|-----------|
| 1 | 8 | 2 engineers, 1 product, 1 marketing, 2 support, 1 ops |
| 2 | 20 | +4 engineers, 2 sales, 2 marketing, 3 support |
| 3 | 50 | +10 engineers, 5 sales, 5 marketing, 10 support |
| 4 | 120 | +30 engineers, 15 sales, 10 marketing, 15 support |
| 5 | 250 | +50 engineers, 30 sales, 20 marketing, 30 support |

---

**Document Owner:** Growth / Marketing  
**Last Updated:** June 2026  
**Next Review:** Monthly during growth phase
