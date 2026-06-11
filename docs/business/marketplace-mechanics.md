# OfferMarket - Marketplace Mechanics

**Version:** 1.0  
**Date:** June 2026

---

## Marketplace Model

OfferMarket operates as a **two-sided reverse marketplace**:

- **Supply side**: Workers (electricians, technicians, etc.)
- **Demand side**: Employers (contractors, facilities, etc.)

Unlike traditional job boards where workers apply, our model reverses the dynamic:
1. Workers create anonymous profiles
2. Employers search and make structured offers
3. Workers accept when ready
4. Platform facilitates introduction

---

## Network Effects

### Same-Side Network Effects (Workers)

**Positive:**
- More workers → More profile diversity → Better employer search results
- More workers → More offer data → Better salary benchmarks
- More workers → More success stories → Viral growth

**Negative (managed):**
- Too many workers in same skill/region → Competition for employer attention
- **Mitigation**: Ranking algorithm promotes quality profiles, active users

### Cross-Side Network Effects

**Worker → Employer:**
- More workers → More employer value → More employer signups
- More quality workers → Higher employer retention

**Employer → Worker:**
- More employers → More offers → Higher worker activation
- More employers → Better compensation → More worker signups

### Flywheel Effect

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE OFFERMARKET FLYWHEEL                             │
└─────────────────────────────────────────────────────────────────────────┘

     More Workers
         │
         ▼
  More Profile Diversity ─────────────────────────┐
         │                                         │
         ▼                                         │
  Better Search Results for Employers              │
         │                                         │
         ▼                                         │
  More Employer Signups                            │
         │                                         │
         ▼                                         │
  More Offers Made                                 │
         │                                         │
         ▼                                         │
  Higher Worker Activation ────────────────────────┤
         │                                         │
         ▼                                         │
  More Acceptances                                 │
         │                                         │
         ▼                                         │
  More Revenue                                     │
         │                                         │
         ▼                                         │
  Better Product Investment ───────────────────────┘
         │
         ▼
  Better Matching, Features
```

---

## Liquidity Metrics

### Key Liquidity Ratios

| Metric | Formula | Target |
|--------|---------|--------|
| **Offer-to-Profile Ratio** | Offers / Active Profiles | > 0.5 |
| **Introduction Rate** | Introductions / Offers | > 5% |
| **Time to First Offer** | Days from profile live to first offer | < 7 days |
| **Offer Acceptance Rate** | Accepted / Total Offers | 15-25% |
| **Search-to-Offer Conversion** | Offers / Searches | > 10% |

### Marketplace Health Score

```
Health Score = (
  (Offer_to_Profile_Ratio * 0.3) +
  (Introduction_Rate * 0.25) +
  (Time_to_First_Offer_Score * 0.2) +
  (Acceptance_Rate * 0.15) +
  (Employer_Retention * 0.1)
) * 100

Where each component is normalized to 0-1 scale
```

**Health Score Interpretation:**
- 80-100: Excellent liquidity
- 60-79: Good, room for improvement
- 40-59: Needs attention
- < 40: Critical, intervention required

---

## Matching Algorithm

### Employer → Worker Matching

```python
def calculate_match_score(worker, employer_filters):
    """
    Calculate match score (0-100) for worker appearing in employer search.
    """
    
    # Skill Match (40%)
    skill_score = calculate_skill_match(
        worker.skills, 
        employer_filters.required_skills,
        employer_filters.preferred_skills
    )  # 0-40 points
    
    # Availability (20%)
    availability_score = calculate_availability_score(
        worker.availability,
        employer_filters.availability_required
    )  # 0-20 points
    
    # Location Proximity (15%)
    location_score = calculate_location_score(
        worker.location,
        employer_filters.location,
        employer_filters.radius_km
    )  # 0-15 points
    
    # Experience Level (15%)
    experience_score = calculate_experience_score(
        worker.years_of_experience,
        employer_filters.experience_min,
        employer_filters.experience_preferred
    )  # 0-15 points
    
    # Profile Quality (10%)
    profile_score = calculate_profile_quality_score(
        worker.completeness,
        worker.verification_level,
        worker.last_active
    )  # 0-10 points
    
    return skill_score + availability_score + location_score + experience_score + profile_score
```

### Score Components

**Skill Match (40 points):**
- Required skill match: +10 points per skill
- Preferred skill match: +5 points per skill
- Skill level match: +2 bonus points per expert-level match
- Certification verified: +3 bonus points per certification

**Availability (20 points):**
- Immediate availability: 20 points
- 1 month notice: 15 points
- 3 months notice: 8 points
- 6 months notice: 3 points

**Location (15 points):**
- Within 10 km: 15 points
- Within 25 km: 12 points
- Within 50 km: 8 points
- Within 100 km: 4 points
- Beyond 100 km: 0 points

**Experience (15 points):**
- Meets minimum: 10 points
- Meets preferred: 15 points
- Below minimum: 0 points

**Profile Quality (10 points):**
- Completeness > 90%: 4 points
- Completeness > 70%: 2 points
- Verified identity: 3 points
- Active this week: 3 points
- Active this month: 1 point

---

## Offer Ranking (Worker View)

When workers see multiple offers, they're ranked by:

```python
def calculate_offer_ranking(offer, worker_preferences):
    """
    Calculate offer ranking score (0-100) for worker view.
    """
    
    # Compensation vs Expectations (30%)
    comp_score = calculate_compensation_match(
        offer.salary_range,
        worker_preferences.desired_salary
    )  # 0-30 points
    
    # Benefits Package (20%)
    benefits_score = calculate_benefits_score(
        offer.benefits,
        worker_preferences.benefit_priorities
    )  # 0-20 points
    
    # Work-Life Balance Fit (20%)
    wlb_score = calculate_wlb_score(
        offer.schedule,
        offer.remote_work_pct,
        offer.overtime_requirements,
        worker_preferences.wlb_priorities
    )  # 0-20 points
    
    # Employer Reputation (15%)
    rep_score = normalize(employer.reputation_score) * 15  # 0-15 points
    
    # Location/Commute (10%)
    location_score = calculate_commute_score(
        offer.location,
        worker_preferences.location,
        worker_preferences.max_commute_km
    )  # 0-10 points
    
    # Engagement Speed (5%)
    engagement_score = calculate_engagement_score(
        offer.submitted_at,
        offer.employer_response_time
    )  # 0-5 points
    
    return comp_score + benefits_score + wlb_score + rep_score + location_score + engagement_score
```

---

## Anti-Fraud Mechanisms

### Worker Verification

| Check | Method | Trigger |
|-------|--------|---------|
| Phone verification | SMS code | Signup |
| Email verification | Magic link | Signup |
| Identity verification | ID upload + selfie | Before first offer |
| Certification verification | Registry API check | When uploaded |
| Duplicate detection | Phone, email, device fingerprint | Continuous |

### Employer Verification

| Check | Method | Trigger |
|-------|--------|---------|
| KvK verification | KvK API | Signup |
| Domain verification | DNS check | Signup |
| Phone verification | SMS code | Signup |
| Bank verification | Microdeposit | Before first offer |
| UBO check | UBO register | Premium verification |
| Reference check | Manual call | High-volume hiring |

### Fraud Detection Rules

```python
FRAUD_RULES = {
    # Worker-side rules
    'multiple_accounts_same_phone': {
        'condition': 'count(phone) > 1',
        'action': 'block_signup',
        'severity': 'high'
    },
    'fake_certification': {
        'condition': 'certification_number not in registry',
        'action': 'flag_for_review',
        'severity': 'high'
    },
    'suspicious_profile_pattern': {
        'condition': 'profile_created < 1 day AND skills > 20',
        'action': 'flag_for_review',
        'severity': 'medium'
    },
    
    # Employer-side rules
    'multiple_accounts_same_kvk': {
        'condition': 'count(kvk) > 1',
        'action': 'block_signup',
        'severity': 'high'
    },
    'spam_like_offers': {
        'condition': 'offers_sent > 50 AND acceptance_rate < 5%',
        'action': 'suspend_offers',
        'severity': 'high'
    },
    'salary_bait_switch': {
        'condition': 'offer_salary != contract_salary',
        'action': 'flag_for_review',
        'severity': 'high'
    },
    'unusual_offer_volume': {
        'condition': 'offers_today > 3 * average_daily_offers',
        'action': 'rate_limit',
        'severity': 'medium'
    }
}
```

---

## Reputation System

### Employer Reputation Score

```
Employer Reputation = (
  (Offer_Acceptance_Rate * 0.30) +
  (Worker_Rating_Avg * 0.25) +
  (Response_Time_Score * 0.20) +
  (Profile_Completeness * 0.15) +
  (Verification_Level * 0.10)
) * 100
```

**Components:**

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Offer Acceptance Rate | 30% | Accepted offers / Total offers |
| Worker Rating Average | 25% | Average of 1-5 ratings × 20 |
| Response Time Score | 20% | Normalized from avg response hours |
| Profile Completeness | 15% | % of profile fields completed |
| Verification Level | 10% | Basic=5, Premium=10 |

**Reputation Tiers:**

| Score | Tier | Display | Benefits |
|-------|------|---------|----------|
| 90-100 | Elite | ★★★★★ (4.8+) | Priority placement, lower fees |
| 75-89 | Great | ★★★★☆ (4.0-4.7) | Standard placement |
| 60-74 | Good | ★★★☆☆ (3.5-3.9) | Standard placement |
| 40-59 | Fair | ★★☆☆☆ (2.5-3.4) | Reduced visibility |
| 0-39 | Poor | ★☆☆☆☆ (< 2.5) | Hidden from search |

### Worker Reputation Score

```
Worker Reputation = (
  (Profile_Completeness * 0.20) +
  (Response_Rate * 0.20) +
  (Offer_Acceptance_Rate * 0.15) +
  (Verification_Level * 0.25) +
  (Professional_Activity * 0.20)
) * 100
```

**Components:**

| Factor | Weight | Calculation |
|--------|--------|-------------|
| Profile Completeness | 20% | % of profile fields completed |
| Response Rate | 20% | Offers responded to / Total offers |
| Offer Acceptance Rate | 15% | Accepted offers / Total offers (capped at 50%) |
| Verification Level | 25% | Identity=10, Certifications=15 |
| Professional Activity | 20% | Profile updates, skill additions |

---

## Market Intelligence

### Data Collection

| Data Point | Source | Usage |
|------------|--------|-------|
| Salary offers | Employer submissions | Benchmarks |
| Offer acceptance | Offer outcomes | Market demand |
| Profile views | Analytics events | Interest tracking |
| Search queries | Search logs | Demand signals |
| Skill tags | Worker profiles | Supply mapping |
| Certification data | Worker uploads | Verification trends |

### Salary Benchmark Calculation

```python
def calculate_salary_benchmark(skill, region, experience_level):
    """
    Calculate salary benchmark for a given skill/region/experience combo.
    """
    
    # Get all offers for this skill in region (last 90 days)
    offers = get_offers(
        skill=skill,
        region=region,
        days=90,
        status='accepted'
    )
    
    # Filter by experience level
    filtered = filter_by_experience(offers, experience_level)
    
    if len(filtered) < 10:
        # Not enough data, broaden search
        filtered = get_offers(skill=skill, region=None, days=180)
    
    salaries = [o.salary_max for o in filtered]
    
    return {
        'p25': percentile(salaries, 25),
        'p50': percentile(salaries, 50),  # Median
        'p75': percentile(salaries, 75),
        'p90': percentile(salaries, 90),
        'sample_size': len(salaries),
        'confidence': 'high' if len(salaries) >= 50 else 'medium' if len(salaries) >= 10 else 'low'
    }
```

### Demand Score Calculation

```python
def calculate_demand_score(skill, region):
    """
    Calculate demand score (0-100) for a skill in a region.
    """
    
    # Search demand (employers looking for this skill)
    search_volume = get_search_volume(skill, region, days=30)
    search_trend = get_search_trend(skill, region, days=90)
    
    # Offer volume (employers making offers)
    offer_volume = get_offer_volume(skill, region, days=30)
    offer_trend = get_offer_trend(skill, region, days=90)
    
    # Supply (workers with this skill)
    supply_count = get_worker_count(skill, region)
    
    # Supply-demand ratio
    if supply_count == 0:
        ratio_score = 100
    else:
        demand_per_supply = (search_volume + offer_volume) / supply_count
        ratio_score = min(100, demand_per_supply * 10)
    
    # Trend score
    trend_score = (search_trend + offer_trend) / 2  # -100 to +100
    trend_score = (trend_score + 100) / 2  # Normalize to 0-100
    
    # Final score
    return (ratio_score * 0.6) + (trend_score * 0.4)
```

**Demand Score Interpretation:**

| Score | Level | Display | Meaning |
|-------|-------|---------|---------|
| 80-100 | Very High | 🔥🔥🔥 | Severe shortage, high competition |
| 60-79 | High | 🔥🔥 | Growing demand |
| 40-59 | Moderate | 🔥 | Stable demand |
| 20-39 | Low | - | Limited demand |
| 0-19 | Very Low | ↓ | Declining demand |

---

## Pricing Mechanics

### Pay-Per-Introduction Model

**How it works:**
1. Employers create free account
2. Employers can make unlimited offers (during MVP)
3. When worker accepts offer → Introduction created
4. Employer charged €499 per introduction
5. Invoice sent, payment due in 14 days

**Economics:**
- Platform takes no position on employment
- Platform is not a temp agency (different legal treatment)
- Fee is for introduction service, not placement

### Subscription Plans (Phase 2)

| Plan | Monthly | Offers/Month | Intro Fee | Best For |
|------|---------|--------------|-----------|----------|
| Basic | €199 | 5 | €299 | Small contractors |
| Professional | €499 | 20 | €199 | Growing companies |
| Enterprise | €999 | Unlimited | €149 | Large employers |

**Unit Economics:**

```
Assumptions:
- Average employer makes 10 offers/month
- Average acceptance rate: 20%
- Average introductions/month: 2

Pay-per-intro:
  Revenue = 2 × €499 = €998/month

Basic Subscription:
  Revenue = €199 + (2 × €299) = €797/month
  Savings for employer = €201/month
  Platform margin = Lower but predictable

Professional Subscription:
  Revenue = €499 + (2 × €199) = €897/month
  Breakeven for employer at ~3 introductions

Enterprise Subscription:
  Revenue = €999 (unlimited)
  Best for employers with 5+ introductions/month
```

---

## Dispute Resolution

### Common Dispute Types

| Type | Frequency | Resolution Process |
|------|-----------|-------------------|
| Salary mismatch | Medium | Compare offer vs contract, refund if bait-switch |
| Role mismatch | Low | Review offer description, mediate |
| Timing dispute | Low | Check timestamps, honor original terms |
| Duplicate introduction | Rare | First acceptance wins, refund second |
| Non-payment | Medium | Suspend account, collections |

### Dispute Resolution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DISPUTE RESOLUTION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

Dispute Filed
     │
     ▼
┌─────────────────┐
│ Auto-investigate│
│ - Check offer   │
│ - Check messages│
│ - Check invoice │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Clear Violation │     │ Unclear /       │
│ by Employer     │     │ Disputed Facts  │
└────────┬────────┘     └────────┬────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐     ┌─────────────────┐
│ Refund Worker   │     │ Human Review    │
│ Warning Employer│     │ (48 hour SLA)   │
└────────┬────────┘     └────────┬────────┘
         │                      │
         │                      ▼
         │             ┌─────────────────┐
         │             │ Decision        │
         │             │ - Full refund   │
         │             │ - Partial refund│
         │             │ - No refund     │
         │             └────────┬────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────┐
│ Resolution Communicated         │
│ - Email to both parties         │
│ - Credit/debit account          │
│ - Appeal option (7 days)        │
└─────────────────────────────────┘
```

---

## Scaling Strategy

### Geographic Expansion

**Phase 1: Netherlands (Months 1-12)**
- Focus: Electricians
- Cities: Amsterdam, Rotterdam, Utrecht, Eindhoven
- Target: 5,000 workers, 500 employers

**Phase 2: Netherlands Multi-Trade (Months 12-24)**
- Add: HVAC, Plumbers, Industrial Maintenance
- Target: 25,000 workers, 2,000 employers

**Phase 3: DACH Region (Months 24-36)**
- Countries: Germany, Austria, Switzerland
- Localization: Language, certifications, salary norms
- Target: 100,000 workers, 5,000 employers

**Phase 4: EU-Wide (Months 36-48)**
- Countries: France, Belgium, UK, Nordics
- Target: 500,000 workers, 20,000 employers

### Vertical Expansion

**Phase 1: Skilled Trades**
- Electricians, HVAC, Plumbers
- Common: Certifications, unions, standardized skills

**Phase 2: Healthcare**
- Nurses, Care workers, Technicians
- Different: Licensing, shift work, agency competition

**Phase 3: Industrial/Manufacturing**
- CNC operators, Welders, Assemblers
- Different: Factory settings, production skills

**Phase 4: Logistics**
- Forklift operators, Truck drivers, Warehouse
- Different: CDL licenses, shift flexibility

---

**Document Owner:** Product Strategy  
**Last Updated:** June 2026  
**Next Review:** Quarterly or upon market expansion
