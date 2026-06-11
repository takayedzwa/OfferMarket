# OfferMarket - Revenue Model & Financial Projections

**Version:** 1.0  
**Date:** June 2026

---

## Revenue Streams Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OFFERMARKET REVENUE STREAMS                          │
└─────────────────────────────────────────────────────────────────────────┘

Phase 1 (Months 1-12)          Phase 2 (Months 12-24)
┌─────────────────────┐        ┌─────────────────────┐
│ Pay-Per-Introduction│        │ Subscriptions       │
│ €499 per intro      │───────>│ €199-€999/month    │
│                     │        │ + reduced intro fee │
└─────────────────────┘        └─────────────────────┘
                                        │
                                        ▼
                               Phase 3 (Months 24-36)
                               ┌─────────────────────┐
                               │ Success Fees        │
                               │ 6-8% of salary      │
                               │ + subscription      │
                               └─────────────────────┘
                                        │
                                        ▼
                               Phase 4 (Months 36+)
                               ┌─────────────────────┐
                               │ Market Intelligence │
                               │ €299-€999/month    │
                               │ Data subscriptions  │
                               └─────────────────────┘
```

---

## Phase 1: Pay-Per-Introduction (Months 1-12)

### Pricing Structure

| Component | Price | Notes |
|-----------|-------|-------|
| Introduction Fee | €499 | Per accepted offer |
| Job Postings | N/A | Not offered - reverse model |
| Offer Credits | €499 | 1 credit = 1 introduction |
| Bulk Credits | €1,399 | 3 credits (€466 each) |
| Enterprise Credits | €2,499 | 6 credits (€416 each) |

### Unit Economics

**Per Introduction:**
```
Revenue: €499

Variable Costs:
- Payment processing (Stripe): €14.47 (2.9% + €0.30)
- Customer support: €25.00 (avg 30 min at €50/hr)
- Verification costs: €5.00 (KvK, ID checks)
- Infrastructure: €3.53 (server, storage per transaction)

Total Variable Cost: €48.00
Contribution Margin: €451.00 (90.4%)
```

**Customer Acquisition Cost (CAC):**

| Channel | Cost per Lead | Conversion | CAC |
|---------|---------------|------------|-----|
| Google Ads (Employer) | €50 | 10% | €500 |
| LinkedIn Ads (Employer) | €80 | 8% | €1,000 |
| Referral (Employer) | €0 | 25% | €200 (referral bonus) |
| Facebook Ads (Worker) | €5 | 15% | €33 |
| Trade School Partnerships | €500 | 20% | €50 (per 10 workers) |

**Blended CAC:**
- Employer: €600 (weighted average)
- Worker: €40

**Lifetime Value (LTV):**

```
Employer LTV Calculation:
- Avg introductions/month: 2
- Avg monthly revenue: €998
- Avg retention: 12 months
- Gross LTV: €11,976

Worker LTV (indirect):
- Workers are free, but drive employer value
- Avg worker generates: 1.5 introductions
- Avg employer revenue per worker: €748
```

**LTV:CAC Ratio:**
- Employer: €11,976 / €600 = 19.96:1 (excellent)
- Target: Maintain > 3:1 at scale

---

## Phase 2: Subscription Plans (Months 12-24)

### Pricing Tiers

| Plan | Monthly | Annual (2 months free) | Intro Fee | Offers/Month | Target Segment |
|------|---------|------------------------|-----------|--------------|----------------|
| Basic | €199 | €1,990 | €299 | 5 | Small contractors (1-20 employees) |
| Professional | €499 | €4,990 | €199 | 20 | Medium companies (20-100 employees) |
| Enterprise | €999 | €9,990 | €149 | Unlimited | Large employers (100+ employees) |

### Subscription Economics

**Basic Plan Unit Economics:**
```
Monthly Revenue: €199

Assumptions:
- Avg 2 introductions/month @ €299 = €598
- Total monthly revenue: €797

Variable Costs:
- Payment processing: €23.11
- Support: €15.00 (subscribers need less support)
- Verification: €5.00
- Infrastructure: €5.00

Total Variable Cost: €48.11
Contribution Margin: €748.89 (94.0%)
```

**Plan Mix Projection:**

| Year | Basic % | Professional % | Enterprise % | Pay-per-intro % |
|------|---------|----------------|--------------|-----------------|
| 1 | 0% | 0% | 0% | 100% |
| 2 | 40% | 35% | 15% | 10% |
| 3 | 35% | 40% | 20% | 5% |
| 4 | 30% | 40% | 25% | 5% |

---

## Phase 3: Success Fees (Months 24-36)

### Pricing Structure

| Plan | Monthly | Success Fee | Features |
|------|---------|-------------|----------|
| Standard | €299 | 8% | Standard terms, basic support |
| Premium | €499 | 6% | Priority placement, dedicated AM |

**Success Fee Calculation:**
```
Example Hire:
- Electrician salary: €55,000
- Success fee (8%): €4,400
- Success fee (6%): €3,300

Comparison to traditional recruiting:
- Agency fee (20-30%): €11,000 - €16,500
- OfferMarket savings: €6,600 - €12,100 (60-73% savings)
```

### When Success Fees Apply

Success fees replace introduction fees when:
1. Worker accepts offer
2. Worker starts employment
3. Worker completes 30-day probation

**Payment Terms:**
- Invoice sent on day 31
- Payment due in 14 days
- Guarantee: Free replacement if worker leaves within 90 days

---

## Phase 4: Market Intelligence (Months 36+)

### Data Products

| Product | Price | Target | Description |
|---------|-------|--------|-------------|
| Salary Benchmarks | €299/month | HR teams | Real-time salary data by role/region |
| Market Intelligence | €499/month | Enterprise | Demand trends, supply analysis |
| Custom Reports | €999+ | Consultants | Bespoke market research |
| API Access | €1,999/month | Platforms | Real-time data integration |

### Market Intelligence Economics

```
Gross Margin: ~95%
- Data already collected from core business
- Minimal incremental cost
- High willingness to pay from enterprises

Target Customers:
- Large employers (compensation planning)
- Recruitment agencies (market insights)
- Private equity (due diligence)
- Government agencies (labor statistics)
- Consulting firms (client recommendations)
```

---

## Financial Projections

### Revenue Projection (5 Years)

| Year | Employers | Avg Revenue/Employer | ARR | Growth |
|------|-----------|---------------------|-----|--------|
| 1 | 150 | €8,000 | €1.2M | - |
| 2 | 500 | €12,000 | €6.0M | 400% |
| 3 | 1,500 | €15,000 | €22.5M | 275% |
| 4 | 4,000 | €18,000 | €72.0M | 220% |
| 5 | 8,000 | €20,000 | €160.0M | 122% |

### Revenue Breakdown by Stream

| Year | Pay-per-intro | Subscriptions | Success Fees | Data | Total |
|------|---------------|---------------|--------------|------|-------|
| 1 | €1.2M | €0 | €0 | €0 | €1.2M |
| 2 | €1.8M | €4.2M | €0 | €0 | €6.0M |
| 3 | €2.2M | €12.8M | €7.5M | €0 | €22.5M |
| 4 | €3.6M | €36.0M | €25.2M | €7.2M | €72.0M |
| 5 | €4.8M | €64.0M | €64.0M | €27.2M | €160.0M |

### Expense Projection

| Category | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|----------|--------|--------|--------|--------|--------|
| **COGS** | | | | | |
| Infrastructure | €60K | €180K | €540K | €1.4M | €2.9M |
| Verification | €15K | €75K | €225K | €600K | €1.2M |
| Payment Processing | €36K | €180K | €675K | €2.2M | €4.8M |
| **Total COGS** | €111K | €435K | €1.4M | €4.2M | €8.9M |
| | | | | | |
| **OPEX** | | | | | |
| Salaries | €600K | €1.8M | €4.5M | €10.8M | €21.6M |
| Marketing | €300K | €1.2M | €3.6M | €10.8M | €24.0M |
| G&A | €120K | €360K | €900K | €2.2M | €4.8M |
| **Total OPEX** | €1.0M | €3.4M | €9.0M | €23.8M | €50.4M |
| | | | | | |
| **Total Expenses** | €1.1M | €3.8M | €10.4M | €28.0M | €59.3M |

### Profitability Projection

| Year | Revenue | Expenses | EBITDA | Margin |
|------|---------|----------|--------|--------|
| 1 | €1.2M | €1.1M | €0.1M | 8% |
| 2 | €6.0M | €3.8M | €2.2M | 37% |
| 3 | €22.5M | €10.4M | €12.1M | 54% |
| 4 | €72.0M | €28.0M | €44.0M | 61% |
| 5 | €160.0M | €59.3M | €100.7M | 63% |

### Funding Requirements

| Round | Amount | Use of Funds | Target Milestone |
|-------|--------|--------------|------------------|
| Pre-seed | €500K | MVP, initial hiring | Product launch, 50 employers |
| Seed | €3M | Growth, marketing | €1M ARR, 500 employers |
| Series A | €10M | Scale, expansion | €10M ARR, EU expansion |
| Series B | €30M | Market dominance | €50M ARR, multi-vertical |

---

## Key Metrics

### North Star Metric

**Monthly Introductions** - Number of accepted offers leading to hires

Why this metric:
- Directly correlates with revenue
- Measures marketplace liquidity
- Indicates value delivered to both sides
- Drives network effects

### Primary KPIs

| Metric | Formula | Target Y1 | Target Y3 | Target Y5 |
|--------|---------|-----------|-----------|-----------|
| MRR | Sum of monthly recurring revenue | €50K | €1.5M | €10M |
| Active Employers | Employers making offers in 30 days | 150 | 1,500 | 8,000 |
| Active Workers | Workers with complete profiles | 5,000 | 75,000 | 400,000 |
| Introduction Rate | Introductions / Offers | 15% | 20% | 22% |
| Employer Retention | Employers active month-over-month | 70% | 85% | 90% |
| Worker Activation | Workers receiving offers / Total | 40% | 50% | 60% |
| LTV:CAC | Lifetime value / Customer acquisition cost | 10:1 | 15:1 | 20:1 |
| Take Rate | Revenue / GMV (total salary placed) | 1.5% | 2.0% | 2.5% |

### Secondary KPIs

| Metric | Why It Matters |
|--------|----------------|
| Time to First Offer | Worker activation speed |
| Offer Acceptance Rate | Marketplace efficiency |
| Employer NPS | Satisfaction predictor |
| Worker NPS | Satisfaction predictor |
| Search-to-Offer Rate | Search quality |
| Profile Completeness | Quality signal |
| Response Time | Engagement quality |

---

## Sensitivity Analysis

### Downside Scenario (50% of target)

| Year | Revenue | Employers | Notes |
|------|---------|-----------|-------|
| 1 | €600K | 75 | Slower adoption |
| 2 | €2.4M | 200 | Delayed subscription launch |
| 3 | €7.5M | 600 | Slower geographic expansion |
| 4 | €24M | 1,600 | Reduced marketing spend |
| 5 | €60M | 3,200 | Extended path to profitability |

### Upside Scenario (150% of target)

| Year | Revenue | Employers | Notes |
|------|---------|-----------|-------|
| 1 | €1.8M | 225 | Viral growth |
| 2 | €9.6M | 800 | Faster subscription adoption |
| 3 | €36M | 2,400 | Accelerated expansion |
| 4 | €108M | 6,000 | Market leadership |
| 5 | €240M | 12,000 | Multi-vertical success |

---

## Pricing Experiments

### A/B Test Roadmap

**Test 1: Introduction Fee Sensitivity**
- Variant A: €399 (20% discount)
- Variant B: €499 (control)
- Variant C: €599 (20% premium)
- Measure: Conversion rate, LTV, satisfaction

**Test 2: Subscription Anchoring**
- Show Professional plan first (anchoring)
- Show Basic plan first
- Show all three side-by-side
- Measure: Plan selection, conversion

**Test 3: Annual Discount**
- 10% off annual
- 15% off annual
- 2 months free (17% equivalent)
- Measure: Annual uptake, cash flow, retention

**Test 4: Enterprise Negotiation**
- Self-serve enterprise pricing
- Contact sales for enterprise
- Hybrid (pricing visible, custom terms)
- Measure: Enterprise conversion, deal size

---

## Competitive Pricing Analysis

| Competitor | Model | Fee | Notes |
|------------|-------|-----|-------|
| LinkedIn Jobs | Job posting | €200-€800/job | Traditional model, no guarantee |
| Indeed | Pay-per-click | €0.50-€5/click | Expensive, no outcome guarantee |
| Recruitment Agency | Success fee | 20-30% of salary | High cost, personal service |
| Temp Agency | Margin on hourly | 25-50% margin | Ongoing cost, employment model |
| **OfferMarket** | **Pay-per-intro** | **€499/intro** | **Transparent, outcome-based** |

**Positioning:**
- 60-75% cheaper than agencies
- More targeted than job boards
- Self-serve, scalable model
- Aligned incentives (only paid on success)

---

**Document Owner:** Finance / Strategy  
**Last Updated:** June 2026  
**Next Review:** Quarterly
