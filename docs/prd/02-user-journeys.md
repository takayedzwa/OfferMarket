# OfferMarket - User Journeys

**Version:** 1.0  
**Date:** June 2026

---

## Journey Overview

This document details complete user journeys for all four user types:
1. **Worker** - The talent (electrician, technician, etc.)
2. **Employer** - The hiring company
3. **Admin** - Platform operations
4. **Support** - Customer support team

---

# 1. WORKER JOURNEYS

## 1.1 Worker Discovery & Sign-up

### Journey: "Marco discovers OfferMarket"

**Trigger:** Marco is frustrated with his current job and curious about opportunities.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: AWARENESS                                                      │
└─────────────────────────────────────────────────────────────────────────┘

Touchpoints:
  ├── Sees Facebook ad targeting electricians in Rotterdam
  │   └── Ad copy: "Electricians in NL: Companies compete for YOU. 
  │       See what you're worth. Stay anonymous. €45K-€65K offers."
  │
  ├── OR: Friend recommends via WhatsApp
  │   └── "Check this out, got 3 offers in a week without applying"
  │
  └── OR: Google search "electrician jobs Rotterdam"
      └── Lands on offermarket.nl

Key Message: "No applications. Companies compete for you. Stay anonymous."
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: LANDING PAGE                                                   │
└─────────────────────────────────────────────────────────────────────────┘

Marco sees:
  ├── Hero: "Tired of applying? Let employers come to you."
  ├── Value prop bullets:
  │   ├── ✓ Stay anonymous until you're ready
  │   ├── ✓ See real offers with real salaries
  │   ├── ✓ No applications, no spam
  │   └── ✓ 5-minute profile setup
  │
  ├── Social proof:
  │   ├── "847 electricians received offers last month"
  │   ├── "Average offer: €52,000"
  │   └── Company logos (verified employers)
  │
  ├── How it works (3 steps):
  │   ├── 1. Create anonymous profile (2 min)
  │   ├── 2. Receive structured offers
  │   └── 3. Compare & choose on your terms
  │
  └── Primary CTA: "Create Free Profile"

Actions:
  ├── Clicks "Create Free Profile"
  └── OR: Scrolls to learn more
      ├── "How is this different?"
      ├── "Is my identity protected?"
      └── "How do I get verified?"
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: ACCOUNT CREATION                                               │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Email & Password
  ├── Email: [marco.electrician@gmail.com]
  ├── Password: [••••••••••••]
  ├── Checkbox: "I am a worker, not an employer"
  └── Button: "Continue"

Step 2: Phone Verification (fraud prevention)
  ├── Phone: [+31 6 12345678]
  ├── SMS code: [______]
  └── Button: "Verify & Continue"

Step 3: Basic Info (anonymous)
  ├── Region: [Rotterdam Area ▼]
  ├── Years of Experience: [10-15 years ▼]
  ├── Primary Trade: [Electrician ▼]
  └── Button: "Continue to Profile"

Progress: [====--------] 20%
```

---

## 1.2 Worker Profile Creation

### Journey: "Marco builds his profile"

**Goal:** Complete profile in under 5 minutes

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFILE STEP 1: SKILLS & CERTIFICATIONS                                │
└─────────────────────────────────────────────────────────────────────────┘

Section: Your Skills
  ├── Pre-populated for "Electrician":
  │   ├── ⚡ Electrical Installation (required)
  │   │   └── Level: [Apprentice | Journeyman | Master | Expert]
  │   ├── ⚡ NEN 3140 Certification (required for NL)
  │   │   └── Valid until: [MM/YYYY]
  │   ├── ⚡ PLC Programming
  │   │   └── Level: [Basic | Intermediate | Advanced | Expert]
  │   ├── ⚡ Solar Panel Installation
  │   │   └── Level: [ ]
  │   ├── ⚡ HVAC Systems
  │   │   └── Level: [ ]
  │   └── [+ Add another skill]
  │
  └── Auto-suggest as typing

Section: Certifications
  ├── Upload or enter:
  │   ├── VCA Certification [Upload PDF] [Valid until: __/__]
  │   ├── First Aid Certificate [Upload PDF] [Valid until: __/__]
  │   └── Driver's License [B] [Upload optional]
  │
  └── Note: "Verified certifications get 3x more offers"

Progress: [======------] 40%
Time elapsed: ~2 min
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFILE STEP 2: WORK PREFERENCES                                       │
└─────────────────────────────────────────────────────────────────────────┘

Section: What are you looking for?

Employment Type:
  ├── ○ Permanent position
  ├── ○ Fixed-term contract
  ├── ○ Freelance/Contract work
  └── ○ Multiple OK

Desired Salary:
  ├── Annual: € [_____] (placeholder: "50000")
  ├── OR Hourly: € [_____] (for freelance)
  └── Note: "This is visible to employers as a range"

Travel Distance:
  ├── Slider: [●──────────────] 30 km
  └── Text: "Willing to commute up to 30 km from Rotterdam"

Work Schedule:
  ├── ☑ Standard daytime hours
  ├── ☐ Shift work (including nights)
  ├── ☐ Weekend availability
  ├── ☐ On-call rotation OK
  └── ☐ Flexible/Remote when possible

Start Date:
  ├── ○ Immediately
  ├── ○ 1 month notice
  ├── ○ 3 months notice
  └── ○ Flexible

Progress: [========----] 60%
Time elapsed: ~3 min
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFILE STEP 3: CAREER INTERESTS                                       │
└─────────────────────────────────────────────────────────────────────────┘

Section: What matters most to you?

Select top 3 priorities:
  ├── ☐ Higher compensation
  ├── ☐ Better work-life balance
  ├── ☐ Career advancement
  ├── ☐ Skills development/training
  ├── ☐ Flexible schedule
  ├── ☐ Job security
  ├── ☐ Leading projects
  ├── ☐ Stable routine
  └── ☐ Variety of work

Section: Industry preferences:
  ├── ☐ Residential
  ├── ☐ Commercial
  ├── ☐ Industrial
  ├── ☐ Infrastructure
  ├── ☐ Solar/Renewables
  └── ☐ Facility maintenance

Section: Company size preference:
  ├── ○ Small (1-20 employees)
  ├── ○ Medium (20-100 employees)
  ├── ○ Large (100-500 employees)
  └── ○ Any size

Progress: [==========--] 80%
Time elapsed: ~4 min
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFILE STEP 4: PRIVACY & VISIBILITY                                   │
└─────────────────────────────────────────────────────────────────────────┘

Section: Privacy Settings

What employers CAN see:
  ├── ✓ Your region (Rotterdam Area)
  ├── ✓ Your skills and certifications
  ├── ✓ Your years of experience
  ├── ✓ Your salary expectations (as range)
  └── ✓ Your work preferences

What employers CANNOT see:
  ├── ✗ Your name
  ├── ✗ Your contact information
  ├── ✗ Your exact address
  ├── ✗ Your current employer
  └── ✗ Your profile photo

Section: Visibility Controls

Profile Visibility:
  ├── ● Visible to all verified employers
  ├── ○ Visible only to specific companies (select below)
  └── ○ Hidden (pause profile)

Blocked Companies (optional):
  ├── [Add companies you don't want to see your profile]
  └── Help: "Your current employer won't see you here"

Section: Identity Release

When do employers learn your identity?
  └── "Only AFTER you accept their offer interest"
      └── You control the timing

Final Checkbox:
  ├── ☑ "I confirm this information is accurate"
  └── Button: "Complete Profile & Go Live"

Progress: [============] 100%
Time elapsed: ~4:30 min
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFILE COMPLETE - ONBOARDING CONTINUES                                │
└─────────────────────────────────────────────────────────────────────────┘

Success Screen:
  ├── "🎉 Your profile is live!"
  ├── "You're now visible to 127 verified employers in your area"
  │
  ├── What happens next:
  │   ├── 1. Employers will start viewing your profile
  │   ├── 2. You'll receive offers via email and in-app
  │   ├── 3. Review and compare offers at your pace
  │   └── 4. Accept when you find the right fit
  │
  ├── Expected timeline:
  │   └── "Most workers receive their first offer within 3-7 days"
  │
  ├── Actions:
  │   ├── [View Your Profile] - See what employers see
  │   ├── [Get Verified] - Upload ID for verification badge (+3x offers)
  │   └── [Go to Dashboard] - Track views and offers
  │
  └── Email confirmation sent to marco.electrician@gmail.com
```

---

## 1.3 Worker Receiving & Managing Offers

### Journey: "Marco receives and evaluates offers"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NOTIFICATION: FIRST OFFER RECEIVED                                     │
└─────────────────────────────────────────────────────────────────────────┘

Trigger: Employer submits offer

Email Notification:
  Subject: "🎉 You've received an offer from a verified employer!"
  
  Body:
  ├── "Hi Marco,"
  ├── ""
  ├── "Great news! A verified employer in Rotterdam has sent you an offer."
  ├── ""
  ├── Offer Summary:
  │   ├── Company: "Leading Electrical Contractor" (verified ✓)
  │   ├── Role: "Senior Electrician"
  │   ├── Base Salary: "€54,000 - €58,000"
  │   ├── Sign-on Bonus: "€3,000"
  │   ├── Benefits: "Company vehicle, 30 vacation days, pension"
  │   └── Location: "Rotterdam (15 km from you)"
  │
  ├── "This employer has a 4.2/5 reputation score and 78% offer acceptance rate."
  ├── ""
  ├── [View Full Offer] button
  ├── ""
  ├── "You have 14 days to respond. Your identity remains anonymous until"
  │   "you choose to reveal it."
  └── ""
      "The OfferMarket Team"

Push Notification (if app installed):
  └── "New offer received! €54K+ • Senior Electrician • Rotterdam"
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DASHBOARD: REVIEWING OFFERS                                            │
└─────────────────────────────────────────────────────────────────────────┘

Worker Dashboard View:

┌────────────────────────────────────────────────────────────────────────┐
│ Welcome back, Marco!                              [🔔 3] [✉️] [⚙️]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ 📊 Your Activity (Last 30 days)                                       │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│ │  24         │  5          │  2          │  €56K       │             │
│ │ Profile     │ Offers      │ Shortlisted │ Avg Offer   │             │
│ │ Views       │ Received    │             │ Value       │             │
│ └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                                                        │
│ 📈 Market Value Score: 78/100  [↑ +5 this week]                        │
│ "You're in the top 25% of electricians in Rotterdam"                  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ 💼 Recent Offers (3 active)                                           │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ ⭐ NEW TODAY                                                       │ │
│ │ Leading Electrical Contractor ✓✓                                  │ │
│ │ Senior Electrician • Rotterdam                                    │ │
│ │                                                                   │ │
│ │ 💰 €54,000 - €58,000                                              │ │
│ │ 🎁 €3,000 sign-on • Company vehicle • 30 days vacation           │ │
│ │ 📍 15 km from you • Start: Flexible                               │ │
│ │                                                                   │ │
│ │ Reputation: ★★★★☆ (4.2) • Acceptance: 78%                        │ │
│ │                                                                   │ │
│ │ [View Details] [Shortlist] [Reject]                               │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ TechInstall BV ✓                                                   │ │
│ │ Industrial Electrician • Dordrecht                                │ │
│ │                                                                   │ │
│ │ 💰 €50,000 - €54,000                                              │ │
│ │ 🎁 Training budget €2,000 • 28 days vacation                     │ │
│ │ 📍 28 km from you • Shift premium included                        │ │
│ │                                                                   │ │
│ │ Reputation: ★★★☆☆ (3.8) • Acceptance: 65%                        │ │
│ │                                                                   │ │
│ │ [View Details] [Shortlist] [Reject]                               │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ SolarNL ✓✓                                                         │ │
│ │ Solar Installation Specialist • Breda                             │ │
│ │                                                                   │ │
│ │ 💰 €48,000 - €55,000 + commission                                 │ │
│ │ 🎁 Company van • Fuel card • 32 days vacation                    │ │
│ │ 📍 35 km from you • Growth path to team lead                      │ │
│ │                                                                   │ │
│ │ Reputation: ★★★★★ (4.8) • Acceptance: 89%                        │ │
│ │                                                                   │ │
│ │ [View Details] [Shortlist] [Reject]                               │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ OFFER DETAIL VIEW                                                      │
└─────────────────────────────────────────────────────────────────────────┘

Worker clicks "View Details" on Leading Electrical Contractor offer

┌────────────────────────────────────────────────────────────────────────┐
│ ← Back to Offers                                                      │
│                                                                        │
│ Leading Electrical Contractor ✓✓                    Reputation: 4.2/5 │
│ Industrial & Commercial Electrical Services                           │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📋 POSITION DETAILS                                                   │
│                                                                        │
│ Role: Senior Electrician                                               │
│ Department: Industrial Projects                                        │
│ Reports to: Project Manager                                            │
│ Team Size: 8 electricians                                              │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 💰 COMPENSATION                                                       │
│                                                                        │
│ Base Salary:        €54,000 - €58,000 (based on experience)           │
│ Hourly Equivalent:  €31.50/hour                                       │
│ Bonus:              Up to 5% performance bonus                        │
│ Sign-on Bonus:      €3,000 (paid after 3 months)                      │
│ Overtime:           €35/hour, weekend €42/hour                        │
│                                                                        │
│ Annual Total (est): €57,000 - €64,000                                 │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🎁 BENEFITS                                                           │
│                                                                        │
│ ✓ Company Vehicle     - Full use, private allowed                     │
│ ✓ Pension             - 8% company contribution                       │
│ ✓ Vacation            - 30 days (above legal minimum)                 │
│ ✓ Holiday Allowance   - 8% (€4,320 - €4,640/year)                     │
│ ✓ Training Budget     - €1,500/year                                   │
│ ✓ Travel Allowance    - €0.23/km or NS Business card                  │
│ ✓ Phone               - Company smartphone                            │
│ ✓ Tools               - All tools provided                            │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📅 WORK ARRANGEMENT                                                   │
│                                                                        │
│ Contract Type:      Permanent (vast contract)                         │
│ Hours/Week:         40 hours                                          │
│ Schedule:           Monday-Thursday 7:00-16:00, Friday 7:00-12:30     │
│ On-call:            Rotating, 1 week per 6 weeks, compensated         │
│ Travel:             80% client sites, 20% office                      │
│ Remote:             Admin days possible from home                     │
│                                                                        │
│ Start Date:         Flexible, preferably within 1 month               │
│ Probation:          2 months                                          │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📍 LOCATION                                                           │
│                                                                        │
│ Primary Base:       Rotterdam Airport area                            │
│ Commute from you:   15 km (~20 min drive)                             │
│ Travel Required:    Occasionally within Zuid-Holland                  │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ✅ REQUIREMENTS                                                       │
│                                                                        │
│ Required:                                                             │
│ • NEN 3140 certification (VOP)                                        │
│ • VCA certification                                                   │
│ • Minimum 8 years experience                                          │
│ • Valid driver's license B                                            │
│ • Fluent in Dutch (spoken)                                            │
│                                                                        │
│ Preferred:                                                            │
│ • PLC basics                                                          │
│ • Experience with industrial safety systems                           │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🏢 ABOUT THE EMPLOYER                                                 │
│                                                                        │
│ "Leading Electrical Contractor has been serving the Rotterdam area    │
│ for 25 years. We specialize in industrial installations and maintain  │
│ long-term relationships with major facilities."                       │
│                                                                        │
│ • 85 employees                                                        │
│ • Annual revenue: €12M                                                │
│ • Projects: Factories, warehouses, data centers                       │
│ • Culture: Hands-on, direct communication, work-life balance          │
│                                                                        │
│ Employee ratings (from former workers):                               │
│ • Work-life balance: ★★★★☆                                           │
│ • Management: ★★★☆☆                                                  │
│ • Growth: ★★★★☆                                                      │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 💬 NEXT STEPS                                                         │
│                                                                        │
│ If you accept this offer:                                             │
│ 1. Your identity will be revealed to the employer                     │
│ 2. You can message directly within OfferMarket                        │
│ 3. Employer can request a meeting/call                                │
│ 4. You continue anonymously with other offers until ready             │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  [💬 Ask a Question]    [📌 Shortlist]    [✅ Accept]    [❌ Reject]│  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Offer expires: June 24, 2026 (14 days from submission)                │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ OFFER COMPARISON TOOL                                                  │
└─────────────────────────────────────────────────────────────────────────┘

Worker selects 2-3 offers and clicks "Compare"

┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Compare Offers                                            [Add Another] [× Close]         │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│                              Leading Electrical    TechInstall BV      SolarNL            │
│                              Contractor ✓✓         ✓                   ✓✓                 │
│                              Senior Electrician    Industrial Elec.    Solar Specialist    │
│                                                                                            │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ 💰 TOTAL COMPENSATION (Year 1)                                                             │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ Base Salary                €54K - €58K            €50K - €54K         €48K - €55K         │
│ Sign-on Bonus              €3,000                 €1,500              €2,000              │
│ Performance Bonus          5% (~€2.5K)            None                Commission (~€3K)   │
│ Overtime Potential         ~€4K/year              ~€6K/year           Seasonal            │
│ Holiday Allowance (8%)     €4.3K - €4.6K          €4K - €4.3K         €3.8K - €4.4K       │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ ESTIMATED YEAR 1 TOTAL     €65K - €72K            €57K - €66K         €57K - €68K         │
│                              ★ Best               Good                Good                │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ 🎁 BENEFITS VALUE                                                                          │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ Company Vehicle            ✓ Full use             ✓ Work only         ✓ Van + fuel        │
│ Vehicle Value (est)        €6,000/year            €3,000/year         €5,000/year         │
│ Pension Contribution       8%                     6%                  7%                  │
│ Training Budget            €1,500/year            €2,000/year         €1,000/year         │
│ Vacation Days              30 days                28 days             32 days             │
│ Phone                      ✓                      ✗                   ✓                   │
│ Tools Provided             ✓                      ✓                   ✓                   │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ 📅 WORK-LIFE BALANCE                                                                       │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ Hours/Week                 40                     40                  40                  │
│ Schedule                   Mon-Thu + Fri AM       5-day rotation      Flexible            │
│ Weekend Work               Rare                   Rotating            Seasonal            │
│ On-call                    1/6 weeks              1/4 weeks           Rare                │
│ Overtime                   Optional               Often required      Seasonal            │
│ Remote Work                Some admin days        None                Some                │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ 📍 PRACTICAL FACTORS                                                                       │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ Commute Distance           15 km (20 min)         28 km (35 min)      35 km (45 min)      │
│ Commute Cost (est)         €1,200/year            €2,100/year         €2,800/year         │
│ Start Date                 Flexible               Within 2 weeks      Flexible            │
│ Contract Type              Permanent              Permanent           Permanent           │
│ Probation                  2 months               2 months            2 months            │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ 📈 CAREER GROWTH                                                                           │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ Promotion Path             → Team Lead (1-2 yr)   → Senior (2-3 yr)   → Project Mgr       │
│ Training Provided          ✓                      ✓✓                  ✓                   │
│ Certification Support      ✓                      ✓                   ✓                   │
│ Company Stability          25 years, stable       15 years, growing   5 years, startup    │
│ Company Size               85 employees           45 employees        22 employees        │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ ⭐ EMPLOYER REPUTATION                                                                     │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ Overall Rating             4.2/5 (87 reviews)     3.8/5 (34 reviews)  4.8/5 (19 reviews)  │
│ Offer Acceptance Rate      78%                    65%                 89%                 │
│ Response Time              Fast (2 days)          Medium (5 days)     Fast (1 day)        │
│ Worker Ratings:                                                                            │
│   - Work-life balance      ★★★★☆                 ★★★☆☆              ★★★★★              │
│   - Management             ★★★☆☆                 ★★★☆☆              ★★★★★              │
│   - Growth                 ★★★★☆                 ★★★★☆              ★★★★☆              │
│   - Compensation           ★★★★☆                 ★★★☆☆              ★★★★☆              │
│   - Would recommend        82%                    71%                 94%                 │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ 🏆 MATCH SCORE                                                                             │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ Based on your preferences  87/100 ★ Best Match    72/100              79/100              │
│ Compensation vs expect     ★★★★★                  ★★★☆☆              ★★★★☆              │
│ Benefits package           ★★★★☆                  ★★★☆☆              ★★★★☆              │
│ Work-life balance          ★★★★☆                  ★★☆☆☆              ★★★★★              │
│ Career growth              ★★★★☆                  ★★★☆☆              ★★★★☆              │
│ Location/commute           ★★★★★                  ★★★☆☆              ★★☆☆☆              │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│ ACTIONS                                                                                    │
│ ─────────────────────────────────────────────────────────────────────────────────────────  │
│                            [Accept] [Shortlist]   [Accept] [Reject]   [Accept] [Reject]   │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ACCEPTING AN OFFER                                                     │
└─────────────────────────────────────────────────────────────────────────┘

Worker clicks "Accept" on Leading Electrical Contractor offer

Confirmation Modal:
┌────────────────────────────────────────────────────────────────────────┐
│  Accept Offer - Final Step                                             │
│                                                                        │
│  You're about to accept the offer from Leading Electrical Contractor.  │
│                                                                        │
│  What happens next:                                                    │
│  1. ✓ Your identity will be revealed to the employer                  │
│  2. ✓ Your contact information will be shared                         │
│  3. ✓ Employer can now message you directly                           │
│  4. ✓ Offer status changes to "Accepted"                              │
│  5. ✓ Other active offers remain open until you withdraw              │
│                                                                        │
│  Your information shared with employer:                                │
│  • Name: Marco [Last Name]                                            │
│  • Email: marco.electrician@gmail.com                                 │
│  • Phone: +31 6 •••• •••• (last 4 digits shown, full after they msg)  │
│  • Full profile (all details)                                         │
│                                                                        │
│  ⚠️ This action cannot be undone. The employer will be notified.      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ☑ I understand and want to accept this offer                     │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│                    [Cancel]          [✅ Confirm Acceptance]           │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

After confirmation:
  ├── Success screen: "🎉 Offer Accepted!"
  ├── "Leading Electrical Contractor has been notified."
  ├── "You can now message them directly."
  ├── Email confirmation sent
  └── Redirect to conversation view
```

---

## 1.4 Worker Messaging (Post-Acceptance)

### Journey: "Marco communicates with the employer"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONVERSATION VIEW                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                                    │
│                                                                        │
│ Leading Electrical Contractor ✓✓                      [📞] [📅] [⋮]   │
│ Contact: HR Manager Lisa                                               │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📋 Offer Summary (Accepted)                                            │
│ Senior Electrician • €54K-€58K • Company vehicle • 30 days vacation   │
│ [View Full Offer]                                                      │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 💬 Messages                                                            │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Employer • Today at 10:23 AM                                      │ │
│ │                                                                   │ │
│ │ Hi Marco! Congratulations on accepting our offer. I'm Lisa from  │ │
│ │ HR. We're excited to move forward!                                │ │
│ │                                                                   │ │
│ │ Can you let me know:                                              │ │
│ │ 1. Your earliest start date?                                      │ │
│ │ 2. Are you available for a site visit this week?                  │ │
│ │ 3. Do you have all required certifications handy?                 │ │
│ │                                                                   │ │
│ │ Looking forward to working with you!                              │ │
│ │                                                                   │ │
│ │ [📎 Request Documents]                                            │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ You • Today at 11:45 AM                                           │ │
│ │                                                                   │ │
│ │ Hi Lisa, thanks for reaching out!                                 │ │
│ │                                                                   │ │
│ │ 1. I can start within 2 weeks (my notice period)                  │ │
│ │ 2. Site visit works for me - Thursday or Friday afternoon         │ │
│ │ 3. Yes, I have NEN 3140 and VCA, will bring copies                │ │
│ │                                                                   │ │
│ │ Looking forward to meeting the team!                              │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Employer • Today at 12:10 PM                                      │ │
│ │                                                                   │ │
│ │ Perfect! Let me schedule a site visit for Friday at 2 PM.         │ │
│ │ I'll send a calendar invite with the address.                     │ │
│ │                                                                   │ │
│ │ Also, could you upload your certifications through the platform?  │ │
│ │ It helps us complete the onboarding faster.                       │ │
│ │                                                                   │ │
│ │ [📎 Send Calendar Invite]                                         │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ [Type a message...]                                    [📎] [📤 Send]  │
│                                                                        │
│ Quick replies:                                                         │
│ [Yes, that works] [Let me check] [Can we reschedule?] [Thanks!]       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1.5 Worker Profile Management

### Journey: "Marco updates his profile"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFILE SETTINGS                                                       │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Profile Settings                                                       │
│                                                                        │
│ Status: ● Live (visible to employers)               [Pause Profile]    │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📊 Your Stats                                                          │
│ • Profile completeness: 95%                                            │
│ • Views this week: 12                                                  │
│ • Offers this month: 5                                                 │
│ • Last active: Today                                                   │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🔒 Privacy Controls                                                    │
│                                                                        │
│ Profile Visibility:                                                    │
│   ● Visible to all verified employers                                  │
│   ○ Visible only to selected companies                                 │
│   ○ Hidden (paused)                                                    │
│                                                                        │
│ Blocked Companies:                                                     │
│   [Current Employer BV] [×]                                            │
│   [+ Add company to block]                                             │
│                                                                        │
│ Identity Release:                                                      │
│   "Your identity is only revealed when you accept an offer"            │
│   [Learn more]                                                         │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ✓ Verification Status                                                  │
│                                                                        │
│ Identity Verification: ● Verified                                      │
│   Government ID verified on June 1, 2026                               │
│                                                                        │
│ Certification Verification: ◐ Partially Verified                       │
│   ✓ NEN 3140 - Verified                                                │
│   ✓ VCA - Verified                                                     │
│   ○ Driver's License - Not uploaded                                    │
│   [Upload Documents]                                                   │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📧 Notification Settings                                               │
│                                                                        │
│ Email Notifications:                                                   │
│   ☑ New offers received                                                │
│   ☑ Offer status updates                                               │
│   ☑ Weekly digest (views, trends)                                      │
│   ☑ Market insights (monthly)                                          │
│                                                                        │
│ Push Notifications:                                                    │
│   ☑ New offers                                                         │
│   ☑ Messages                                                           │
│   ☐ Profile view alerts                                                │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ⚙️ Account Settings                                                    │
│                                                                        │
│ Email: marco.electrician@gmail.com                    [Change]         │
│ Phone: +31 6 •••• ••••                                [Change]         │
│ Password: ••••••••••••                                [Change]         │
│ Language: English                                       [Change]       │
│                                                                        │
│ [Delete Account] (danger zone)                                         │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 2. EMPLOYER JOURNEYS

## 2.1 Employer Discovery & Sign-up

### Journey: "Technical Recruiter Tom discovers OfferMarket"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: AWARENESS                                                     │
└─────────────────────────────────────────────────────────────────────────┘

Touchpoints:
  ├── LinkedIn ad targeting technical recruiters
  │   └── "Struggling to hire electricians? 
  │       847 verified candidates in Rotterdam. No job posts needed."
  │
  ├── Google Ads: "hire electricians Netherlands"
  │   └── "OfferMarket - Reverse recruiting for shortage professions"
  │
  └── Industry referral
      └── "We hired 3 electricians through OfferMarket last quarter"
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: EMPLOYER LANDING PAGE                                         │
└─────────────────────────────────────────────────────────────────────────┘

Employer sees:
  ├── Hero: "Stop chasing candidates. Start making offers."
  │
  ├── Value props:
  │   ├── ✓ Access pre-verified talent
  │   ├── ✓ No job posts, no applications
  │   ├── ✓ Salary transparency = serious candidates
  │   └── ✓ Hire 3x faster than traditional methods
  │
  ├── Talent pool preview (live counts):
  │   ├── "847 Electricians in Netherlands"
  │   ├── "127 in Rotterdam Area"
  │   ├── "43 Available within 1 month"
  │   └── [View Sample Profiles] (shows anonymized examples)
  │
  ├── How it works:
  │   ├── 1. Verify your company (KvK check)
  │   ├── 2. Search talent pool
  │   ├── 3. Make structured offers
  │   └── 4. Hire when candidates accept
  │
  ├── Pricing:
  │   ├── Pay-per-introduction model
  │   ├── €499 per successful introduction
  │   └── "No introduction = no charge"
  │
  └── Primary CTA: "Create Employer Account"
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: EMPLOYER ACCOUNT CREATION                                     │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Company Information
  ├── Company Name: [Leading Electrical Contractor BV]
  ├── KvK Number: [12345678]
  │   └── Auto-validates against KvK registry
  │   └── Fetches: Company name, address, status
  ├── Company Website: [www.leadingelectrical.nl]
  ├── Company Size: [50-100 employees ▼]
  ├── Industry: [Electrical Contracting ▼]
  └── Button: "Continue"

Step 2: Your Information
  ├── Full Name: [Tom Vermeer]
  ├── Job Title: [Technical Recruiter]
  ├── Work Email: [tom@leadingelectrical.nl]
  │   └── Must match company domain
  ├── Phone: [+31 10 1234567]
  └── Button: "Continue"

Step 3: Verification
  ├── Email verification code sent to work email
  ├── Phone verification via SMS
  └── Button: "Verify & Continue"

Step 4: Account Setup
  ├── Password: [••••••••••••]
  ├── Billing Information:
  │   ├── Billing Email: [finance@leadingelectrical.nl]
  │   └── VAT Number: [NL123456789B01]
  ├── Terms & Conditions: ☑ Accepted
  ├── Privacy Policy: ☑ Accepted
  └── Button: "Complete Setup"

Progress: Account created, pending verification
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: ONBOARDING & VERIFICATION                                     │
└─────────────────────────────────────────────────────────────────────────┘

Welcome Screen:
  ├── "🎉 Welcome to OfferMarket, Tom!"
  ├── ""
  ├── Next Steps:
  │   ├── 1. ✓ Company info submitted
  │   ├── 2. ⏳ KvK verification (1-2 business days)
  │   ├── 3. ⏳ Bank account verification (optional, faster hiring)
  │   └── 4. ⏳ Complete company profile
  │
  ├── While you wait:
  │   ├── [Browse Sample Profiles] - See available talent
  │   ├── [Complete Company Profile] - Add details
  │   └── [Schedule Onboarding Call] - 15 min with success team
  │
  └── "You'll receive an email once verification is complete."
```

---

## 2.2 Employer Searching & Making Offers

### Journey: "Tom searches for talent and makes offers"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EMPLOYER DASHBOARD (Post-Verification)                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ OfferMarket for Employers                          [🔔 2] [Tom ▼] [⚙️] │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ Leading Electrical Contractor ✓✓                    Balance: €1,497   │
│ KvK: 12345678 • Rotterdam Area                                        │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📊 Hiring Overview                                                     │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│ │  3          │  12         │  5          │  73%        │             │
│ │ Active      │ Offers      │ Candidates  │ Offer       │             │
│ │ Positions   │ Sent        │ Interviewed │ Acceptance  │             │
│ └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🔍 Quick Search                                                        │
│                                                                        │
│ [What skills are you looking for?]     [Rotterdam Area ▼] [Search ▶]  │
│                                                                        │
│ Quick filters:                                                         │
│ ☑ Available within 1 month   ☑ NEN 3140 certified   ☑ VCA certified  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ 💼 Recent Activity                                                     │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Offer accepted! 🎉                                                 │ │
│ │ Candidate: Marco V. (identity now revealed)                        │ │
│ │ Position: Senior Electrician                                       │ │
│ │ Offer value: €58,000                                               │ │
│ │                                                                    │ │
│ │ [Start Conversation] [View Invoice]                                │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ 3 new candidates match your criteria                               │ │
│ │ • Industrial Electrician, 10 yrs exp, Dordrecht                   │ │
│ │ • Installation Electrician, 8 yrs exp, Breda                      │ │
│ │ • Maintenance Electrician, 15 yrs exp, Rotterdam                  │ │
│ │                                                                    │ │
│ │ [View Matches]                                                     │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SEARCH RESULTS                                                         │
└─────────────────────────────────────────────────────────────────────────┘

Tom searches: "Electrician" in "Rotterdam Area, 25km"

┌────────────────────────────────────────────────────────────────────────┐
│ Search Results: Electrician in Rotterdam Area (25 km)                  │
│                                                                        │
│ Filters:                                                               │
│ [Skills ▼] [Experience ▼] [Certifications ▼] [Availability ▼]         │
│ [Contract Type ▼] [Salary Range ▼] [Language ▼]                       │
│                                                                        │
│ Sort: [Most Relevant ▼]  |  [Newest]  [Experience]  [Availability]    │
│                                                                        │
│ 87 profiles found                                                      │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Profile #8472 (anonymous)                       Available: Now     │ │
│ │ ⚡⚡⚡ Master Electrician                          [Make Offer]     │ │
│ │                                                                    │ │
│ │ 📍 Rotterdam Area (exact location hidden)                         │ │
│ │ 💼 12 years experience                                            │ │
│ │                                                                    │ │
│ │ Skills:                                                            │ │
│ │ • Electrical Installation - Expert                                 │ │
│ │ • NEN 3140 - Certified ✓                                           │ │
│ │ • PLC Programming - Advanced                                       │ │
│ │ • Solar Installation - Intermediate                                │ │
│ │                                                                    │ │
│ │ Certifications: NEN 3140 VOP ✓, VCA ✓, First Aid ✓                │ │
│ │                                                                    │ │
│ │ Looking for: €50K-€60K • Permanent • 30km max commute             │ │
│ │                                                                    │ │
│ │ Match Score: 94%  |  Last active: Today                           │ │
│ │                                                                    │ │
│ │ [View Full Profile]                                                │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Profile #7291 (anonymous)                    Available: 1 month    │ │
│ │ ⚡⚡ Industrial Electrician                        [Make Offer]     │ │
│ │                                                                    │ │
│ │ 📍 Dordrecht (28 km from you)                                     │ │
│ │ 💼 10 years experience                                            │ │
│ │                                                                    │ │
│ │ Skills:                                                            │ │
│ │ • Industrial Systems - Expert                                      │ │
│ │ • NEN 3140 - Certified ✓                                           │ │
│ │ • Safety Systems - Expert                                          │ │
│ │ • Maintenance - Advanced                                           │ │
│ │                                                                    │ │
│ │ Certifications: NEN 3140 VOP ✓, VCA ✓                             │ │
│ │                                                                    │ │
│ │ Looking for: €48K-€55K • Any contract • Shift work OK             │ │
│ │                                                                    │ │
│ │ Match Score: 89%  |  Last active: Yesterday                       │ │
│ │                                                                    │ │
│ │ [View Full Profile]                                                │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Profile #9104 (anonymous)                    Available: Immediate  │ │
│ │ ⚡⚡⚡ Senior Electrician                            [Make Offer]     │ │
│ │                                                                    │ │
│ │ 📍 Rotterdam (15 km from you)                                     │ │
│ │ 💼 15 years experience                                            │ │
│ │                                                                    │ │
│ │ Skills:                                                            │ │
│ │ • Team Leadership - Expert                                         │ │
│ │ • Electrical Installation - Expert                                 │ │
│ │ • Project Management - Advanced                                    │ │
│ │ • NEN 3140 - Certified ✓                                           │ │
│ │                                                                    │ │
│ │ Certifications: NEN 3140 VOP ✓, VCA ✓, Driver's License B ✓       │ │
│ │                                                                    │ │
│ │ Looking for: €55K-€65K • Permanent • Leadership role              │ │
│ │                                                                    │ │
│ │ Match Score: 91%  |  Last active: Today                           │ │
│ │                                                                    │ │
│ │ [View Full Profile]                                                │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Pagination: [1] 2 3 4 5 ... Next                                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ PROFILE DETAIL VIEW (Employer)                                         │
└─────────────────────────────────────────────────────────────────────────┘

Tom clicks "View Full Profile" on Profile #8472

┌────────────────────────────────────────────────────────────────────────┐
│ ← Back to Search                                                       │
│                                                                        │
│ Profile #8472                              🔒 Verified Professional    │
│ Anonymous Talent Profile                                               │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📍 LOCATION & AVAILABILITY                                            │
│                                                                        │
│ Region: Rotterdam Area (Netherlands)                                  │
│ Commute from you: ~15-25 km                                           │
│ Availability: Immediate                                               │
│ Notice Period: None                                                   │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 💼 EXPERIENCE                                                         │
│                                                                        │
│ Total Experience: 12 years                                            │
│                                                                        │
│ Primary Role: Electrician                                             │
│ Specialization: Industrial & Commercial                               │
│                                                                        │
│ Experience Breakdown:                                                 │
│ • Electrical Installation: 12 years (Expert)                          │
│ • Industrial Systems: 10 years (Expert)                               │
│ • PLC Programming: 8 years (Advanced)                                 │
│ • Solar Installation: 5 years (Intermediate)                          │
│ • Team Leadership: 4 years (Advanced)                                 │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🎓 CERTIFICATIONS                                                     │
│                                                                        │
│ ✓ NEN 3140 VOP (Valid until 2028) - Verified                          │
│ ✓ VCA Certification (Valid until 2027) - Verified                     │
│ ✓ First Aid Certificate (Valid until 2027) - Verified                 │
│ ✓ Driver's License B - Self-reported                                  │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 💰 WORK PREFERENCES                                                   │
│                                                                        │
│ Employment Type Sought:                                               │
│   ✓ Permanent position                                                │
│   ☐ Fixed-term contract                                               │
│   ☐ Freelance/Contract                                                │
│                                                                        │
│ Salary Expectations: €50,000 - €60,000/year                           │
│ OR Hourly Rate: Not specified (seeking permanent)                     │
│                                                                        │
│ Travel Distance: Up to 30 km                                          │
│ Work Schedule:                                                        │
│   ✓ Standard daytime hours                                            │
│   ☐ Shift work                                                        │
│   ☐ Weekend availability                                              │
│   ☐ On-call rotation                                                  │
│   ✓ Flexible schedule preferred                                       │
│                                                                        │
│ Industry Preferences:                                                 │
│   ✓ Industrial                                                        │
│   ✓ Commercial                                                        │
│   ☐ Residential                                                       │
│   ✓ Infrastructure                                                    │
│                                                                        │
│ Career Priorities (top 3):                                            │
│   1. Better work-life balance                                         │
│   2. Higher compensation                                              │
│   3. Career advancement                                               │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🏢 COMPANY PREFERENCES                                                │
│                                                                        │
│ Preferred Company Size: Medium to Large (50+ employees)               │
│ Looking for: Growth opportunities, stable projects                    │
│ Not looking for: Excessive overtime, weekend work                     │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📊 PROFILE METRICS                                                    │
│                                                                        │
│ Profile Completeness: 100%                                            │
│ Verification Level: Certified Professional                            │
│ Last Active: Today                                                    │
│ Member Since: March 2026                                              │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ⚠️ IMPORTANT NOTES                                                    │
│                                                                        │
│ • This profile is anonymous - identity hidden                         │
│ • You cannot see: name, contact info, current employer                │
│ • Identity is only revealed if candidate accepts your offer           │
│ • You must make a structured offer to proceed                         │
│ • No messaging before offer acceptance                                │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │              [❌ Not Interested]    [💼 Make Offer]               │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MAKE OFFER FLOW                                                        │
└─────────────────────────────────────────────────────────────────────────┘

Tom clicks "Make Offer"

┌────────────────────────────────────────────────────────────────────────┐
│ Create Offer for Profile #8472                                         │
│                                                                        │
│ Candidate summary: 12 yrs exp • Rotterdam • €50K-€60K expected        │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ STEP 1: POSITION DETAILS                                               │
│                                                                        │
│ Job Title: [Senior Electrician________________]                        │
│                                                                        │
│ Department/Team: [Industrial Projects____________]                     │
│                                                                        │
│ Job Description:                                                       │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ We're looking for an experienced electrician to join our          │ │
│ │ industrial projects team. You'll work on factory installations,   │ │
│ │ maintenance projects, and safety system upgrades.                 │ │
│ │                                                                   │ │
│ │ Key responsibilities:                                             │ │
│ │ • Install and maintain industrial electrical systems              │ │
│ │ • Read and interpret technical drawings                           │ │
│ │ • Ensure compliance with NEN 3140 standards                       │ │
│ │ • Mentor junior electricians                                      │ │
│ │                                                                   │ │
│ │ What we offer:                                                    │ │
│ │ • Stable permanent contract                                       │ │
│ │ • Company vehicle for work use                                    │ │
│ │ • Good work-life balance (no weekends)                            │ │
│ │ • Training budget for certifications                              │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Required Certifications:                                               │
│   ☑ NEN 3140 VOP                                                       │
│   ☑ VCA                                                                │
│   ☐ First Aid                                                          │
│   ☐ Driver's License B                                                 │
│                                                                        │
│ Required Experience: [8+] years                                        │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ STEP 2: COMPENSATION (Required - Must be specific)                    │
│                                                                        │
│ Base Salary Range:                                                     │
│   From: € [54,000]  To: € [58,000]  /year                             │
│   ⚠️ Salary must be specified - no "competitive salary" allowed       │
│                                                                        │
│ Hourly Rate (if applicable):                                           │
│   € [____] /hour (for part-time or contract)                          │
│                                                                        │
│ Sign-on Bonus:                                                         │
│   € [3,000] (paid after 3 months)                                     │
│                                                                        │
│ Performance Bonus:                                                     │
│   [5]% of base salary (up to €2,900/year)                             │
│                                                                        │
│ Overtime Rate:                                                         │
│   Standard: € [35]/hour                                               │
│   Weekend: € [42]/hour                                                │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ STEP 3: CONTRACT TERMS                                                 │
│                                                                        │
│ Contract Type:                                                         │
│   ● Permanent (vast contract)                                         │
│   ○ Fixed-term (specify duration)                                     │
│   ○ Contract/Freelance                                                │
│                                                                        │
│ Hours per Week: [40]                                                   │
│                                                                        │
│ Start Date:                                                            │
│   ● Flexible (candidate preference)                                   │
│   ○ Specific date: [________]                                         │
│                                                                        │
│ Probation Period: [2] months (max 6 for permanent)                    │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ STEP 4: BENEFITS                                                       │
│                                                                        │
│ Vacation Days: [30] days (NL minimum: 20)                             │
│                                                                        │
│ Holiday Allowance: [8]% (€4,320 - €4,640/year)                        │
│                                                                        │
│ Pension Contribution: [8]% of gross salary                            │
│                                                                        │
│ Training Budget: € [1,500] /year                                      │
│                                                                        │
│ Company Vehicle:                                                       │
│   ● Full use (private allowed)                                        │
│   ○ Work use only                                                     │
│   ○ Not provided                                                      │
│   Vehicle type: [Van with branding]                                   │
│                                                                        │
│ Travel Allowance:                                                      │
│   ● €0.23/km mileage                                                  │
│   ○ NS Business card provided                                         │
│   ○ Not provided                                                      │
│                                                                        │
│ Phone:                                                                 │
│   ● Company smartphone provided                                       │
│   ○ Not provided                                                      │
│                                                                        │
│ Tools:                                                                 │
│   ● All tools provided                                                │
│   ○ Partial / Own tools required                                      │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ STEP 5: WORK ARRANGEMENT                                               │
│                                                                        │
│ Schedule:                                                              │
│   ☑ Standard daytime (Mon-Fri, 7:00-16:00)                            │
│   ☐ Shift work                                                        │
│   ☐ Weekend rotation                                                  │
│   ☐ On-call requirements                                              │
│                                                                        │
│ On-call Details (if applicable):                                       │
│   [Rotating schedule, 1 week per 6 weeks, compensated €50/week]       │
│                                                                        │
│ Remote Work:                                                           │
│   [0]% remote (on-site required for this role)                        │
│                                                                        │
│ Travel Requirements:                                                   │
│   [80]% client sites, [20]% office                                    │
│   Travel within: [Zuid-Holland province]                              │
│                                                                        │
│ Physical Requirements:                                                 │
│   [Able to lift 25kg, work at heights, outdoor work in all weather]   │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ STEP 6: REVIEW & SUBMIT                                                │
│                                                                        │
│ Offer Summary:                                                         │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Senior Electrician - Profile #8472                                │ │
│ │                                                                   │ │
│ │ Compensation:                                                     │ │
│ │ • Base: €54,000 - €58,000/year                                   │ │
│ │ • Sign-on: €3,000                                                 │ │
│ │ • Bonus: 5% performance (~€2,500)                                │ │
│ │ • Overtime: €35/hr standard, €42/hr weekend                      │ │
│ │                                                                   │ │
│ │ Benefits:                                                         │ │
│ │ • 30 days vacation + 8% holiday allowance                        │ │
│ │ • 8% pension contribution                                         │ │
│ │ • Company van (full use)                                          │ │
│ │ • €1,500 training budget                                          │ │
│ │ • €0.23/km travel allowance                                      │ │
│ │                                                                   │ │
│ │ Terms:                                                            │ │
│ │ • Permanent contract, 40 hrs/week                                 │ │
│ │ • Flexible start date                                             │ │
│ │ • 2 months probation                                              │ │
│ │ • Mon-Fri daytime, no weekends                                    │ │
│ │                                                                   │ │
│ │ Estimated Year 1 Value: €65,000 - €72,000                        │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Offer Expiry: [14] days (default, max 30)                             │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ ☑ I confirm this offer is accurate and authorized                │ │
│ │ ☑ I understand salary must be specific (no ranges over €5K)      │ │
│ │ ☑ I understand this offer is binding if accepted                 │ │
│ └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│                    [Save Draft]          [✅ Submit Offer]             │
│                                                                        │
│ Cost: 1 offer credit (or €0 if subscription includes offers)          │
│ If accepted: Introduction fee of €499 will be charged                 │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘

After submission:
  ├── "Offer submitted successfully!"
  ├── Candidate will be notified via email and in-app
  ├── Offer appears in "Sent Offers" dashboard
  └── 14-day countdown begins for candidate response
```

---

## 2.3 Employer Offer Management

### Journey: "Tom tracks and manages offers"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ OFFER MANAGEMENT DASHBOARD                                             │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Offers Sent                                         [+ New Offer]     │
│                                                                        │
│ Filters: [All ▼] [Pending ▼] [This Month ▼]                           │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Profile #8472 - Senior Electrician              Status: ⏳ Pending │ │
│ │ Sent: June 10, 2026 • Expires: June 24, 2026                     │ │
│ │                                                                   │ │
│ │ Offer: €54K-€58K + €3K sign-on + vehicle + 30 days               │ │
│ │ Last seen: Viewed yesterday at 3:42 PM                           │ │
│ │                                                                   │ │
│ │ [View Details] [Send Reminder] [Withdraw] [Edit]                 │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Profile #7291 - Industrial Electrician          Status: ✅ Accepted│ │
│ │ Sent: May 28, 2026 • Accepted: June 3, 2026                      │ │
│ │                                                                   │ │
│ │ Offer: €52K-€55K + sign-on + shift premium                       │ │
│ │ Identity: REVEALED - Jan de Vries                                │ │
│ │ Contact: jan.devries@email.com • +31 6 •••• ••••                 │ │
│ │                                                                   │ │
│ │ [Start Conversation] [Schedule Interview] [View Invoice]         │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Profile #9104 - Senior Electrician              Status: ❌ Rejected│ │
│ │ Sent: June 5, 2026 • Rejected: June 8, 2026                      │ │
│ │                                                                   │ │
│ │ Offer: €52K-€55K + vehicle                                       │ │
│ │ Reason: "Accepted another offer"                                 │ │
│ │                                                                   │ │
│ │ [View Details] [Send Feedback Request]                           │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Profile #6543 - Maintenance Electrician         Status: ⏰ Expired │ │
│ │ Sent: May 20, 2026 • Expired: June 3, 2026                       │ │
│ │                                                                   │ │
│ │ Offer: €48K-€52K + benefits                                      │ │
│ │ Last seen: Never viewed                                          │ │
│ │                                                                   │ │
│ │ [View Details] [Resend Offer]                                    │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Summary:                                                               │
│ • Pending: 8 offers                                                    │
│ • Accepted: 3 offers (€1,497 in fees)                                 │
│ • Rejected: 5 offers                                                   │
│ • Expired: 2 offers                                                    │
│ • Acceptance Rate: 25% (3/12)                                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 3. ADMIN JOURNEYS

## 3.1 Admin Dashboard & Verification

### Journey: "Alex verifies employers and monitors platform"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ADMIN DASHBOARD                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ OfferMarket Admin                               [🔔 5] [Alex ▼] [⚙️]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ 📊 Platform Health (Last 7 days)                                      │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│ │  1,247      │  342        │  89         │  €47,500    │             │
│ │ Total       │ Active       │ New         │ Revenue     │             │
│ │ Workers     │ Employers    │ This Week   │ (MTD)       │             │
│ └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                                                        │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│ │  234        │  67         │  12         │  94.2%      │             │
│ │ Offers      │ Matches      │ Introductions│ Uptime     │             │
│ │ Sent        │ This Week    │ This Week   │             │             │
│ └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ⚠️ Action Required                                                     │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ 🔴 VERIFICATION QUEUE: 8 pending employer verifications           │ │
│ │                                                                   │ │
│ │ Oldest: 2 days waiting                                            │ │
│ │ [Review Queue ▶]                                                  │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 REPORTS QUEUE: 3 pending reports                               │ │
│ │ • 2 suspicious profile reports                                    │ │
│ │ • 1 disputed offer                                                │ │
│ │                                                                   │ │
│ │ [Review Reports ▶]                                                │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ 🟠 FRAUD ALERTS: 2 flagged accounts                               │ │
│ │ • Duplicate account detected (same KvK)                           │ │
│ │ • Unusual offer pattern (spam-like)                               │ │
│ │                                                                   │ │
│ │ [Review Alerts ▶]                                                 │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📈 Recent Activity Feed                                                │
│                                                                        │
│ • 10:42 AM - New employer registered: ABC Electrical BV               │
│ • 10:38 AM - Offer accepted: Profile #8472 → Leading Electrical       │
│ • 10:35 AM - Verification completed: TechInstall BV ✓                 │
│ • 10:30 AM - Report filed: Profile #7291 (under review)               │
│ • 10:25 AM - Payment received: €499 (invoice #2026-0542)              │
│ • 10:18 AM - New worker profile: Profile #9876                        │
│ • 10:15 AM - System alert: High offer volume from single employer     │
│                                                                        │
│ [View Full Activity Log]                                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EMPLOYER VERIFICATION QUEUE                                            │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Verification Queue (8 pending)                                         │
│                                                                        │
│ Sort: [Oldest First ▼]  |  [Newest]  [Company Name]                   │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ ABC Electrical BV                              Submitted: 2 days ago│ │
│ │ KvK: 87654321 • Rotterdam                                          │ │
│ │ Contact: Piet Jansen • piet@abcelectrical.nl                      │ │
│ │                                                                    │ │
│ │ Verification Checks:                                               │ │
│ │ ✓ KvK Registration - ACTIVE (matches)                             │ │
│ │ ✓ Domain Verification - CONFIRMED                                 │ │
│ │ ✓ Phone Verification - CONFIRMED                                  │ │
│ │ ⏳ Bank Account - PENDING                                         │ │
│ │                                                                    │ │
│ │ Company Details (from KvK):                                        │ │
│ │ • Founded: 2018                                                    │ │
│ │ • Status: Active                                                   │ │
│ │ • Employees: 25-50                                                 │ │
│ │ • Industry: Electrical Installation                                │ │
│ │                                                                    │ │
│ │ Risk Score: LOW (12/100)                                           │ │
│ │                                                                    │ │
│ │ [View Full Details]  [✅ Approve]  [❌ Reject]  [⚠️ Flag for Review]│ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ QuickInstall BV                                Submitted: 1 day ago │ │
│ │ KvK: 11223344 • Amsterdam                                          │ │
│ │ Contact: Sarah de Wit • sarah@quickinstall.nl                     │ │
│ │                                                                    │ │
│ │ Verification Checks:                                               │ │
│ │ ✓ KvK Registration - ACTIVE (matches)                             │ │
│ │ ✓ Domain Verification - CONFIRMED                                 │ │
│ │ ✓ Phone Verification - CONFIRMED                                  │ │
│ │ ✓ Bank Account - VERIFIED                                         │ │
│ │                                                                    │ │
│ │ ⚠️ FLAG: New company (registered 6 months ago)                    │ │
│ │ ⚠️ FLAG: Same address as 2 other companies                        │ │
│ │                                                                    │ │
│ │ Risk Score: MEDIUM (45/100)                                        │ │
│ │                                                                    │ │
│ │ [View Full Details]  [✅ Approve]  [❌ Reject]  [⚠️ Request More Info]│ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EMPLOYER VERIFICATION - DETAIL VIEW                                    │
└─────────────────────────────────────────────────────────────────────────┘

Admin clicks "View Full Details" on ABC Electrical BV

┌────────────────────────────────────────────────────────────────────────┐
│ ABC Electrical BV - Verification Review                                │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📋 COMPANY INFORMATION                                                 │
│                                                                        │
│ Company Name: ABC Electrical BV                                        │
│ Trade Name: ABC Electrical                                             │
│ KvK Number: 87654321                                                   │
│ VAT Number: NL876543219B01                                             │
│                                                                        │
│ Registered Address:                                                    │
│ Westerkade 45                                                          │
│ 3015 BA Rotterdam                                                      │
│ Netherlands                                                            │
│                                                                        │
│ Business Address (if different):                                       │
│ [Same as registered]                                                   │
│                                                                        │
│ Website: www.abcelectrical.nl                                          │
│ Phone: +31 10 9876543                                                  │
│ Email: info@abcelectrical.nl                                           │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 👤 PRIMARY CONTACT                                                     │
│                                                                        │
│ Name: Piet Jansen                                                      │
│ Title: Owner / Director                                                │
│ Email: piet@abcelectrical.nl (✓ Domain verified)                      │
│ Phone: +31 6 12345678 (✓ Verified via SMS)                            │
│ LinkedIn: linkedin.com/in/pietjansen (not verified)                   │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ✅ VERIFICATION CHECKS                                                 │
│                                                                        │
│ 1. KvK Registration Check                                              │
│    Status: ✓ PASSED                                                    │
│    Details: Company found in KvK registry, status ACTIVE              │
│    Match: Company name, address, KvK all match                        │
│    Checked: June 10, 2026 at 09:15                                    │
│                                                                        │
│ 2. Domain Verification                                                 │
│    Status: ✓ PASSED                                                    │
│    Details: Email domain matches company website                      │
│    DNS Check: abcelectrical.nl resolves correctly                     │
│    Checked: June 10, 2026 at 09:16                                    │
│                                                                        │
│ 3. Phone Verification                                                  │
│    Status: ✓ PASSED                                                    │
│    Details: SMS code verified successfully                            │
│    Number: +31 10 9876543                                             │
│    Checked: June 10, 2026 at 09:17                                    │
│                                                                        │
│ 4. Bank Account Verification                                           │
│    Status: ⏳ PENDING                                                  │
│    Details: Account provided, awaiting microdeposit confirmation      │
│    Bank: ING Bank                                                     │
│    Account: NL## INGB #### #### ## (partial masked)                   │
│    Initiated: June 10, 2026 at 09:20                                  │
│                                                                        │
│ 5. Ultimate Beneficial Owner (UBO) Check                               │
│    Status: ✓ PASSED                                                    │
│    Details: Piet Jansen listed as 100% owner in UBO register          │
│    Checked: June 10, 2026 at 09:25                                    │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📊 RISK ASSESSMENT                                                     │
│                                                                        │
│ Overall Risk Score: 12/100 (LOW)                                       │
│                                                                        │
│ Risk Factors:                                                          │
│ ✓ Company age: 8 years (established 2018)                             │
│ ✓ Active KvK status                                                   │
│ ✓ No negative news mentions                                           │
│ ✓ No fraud alerts                                                     │
│ ✓ Domain age: 7 years                                                 │
│ ⚠️ Bank verification pending                                          │
│                                                                        │
│ Similar Companies Check:                                               │
│ • No duplicate KvK found                                              │
│ • No similar names in database                                        │
│ • Address not shared with other employers                             │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📝 ADMIN NOTES                                                         │
│                                                                        │
│ [Add internal notes here - visible to admin team only]                 │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │                                                                  │  │
│ │  [❌ Reject Application]    [⚠️ Request More Info]    [✅ Approve] │  │
│ │                                                                  │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Approving will:                                                        │
│ • Grant full employer access                                           │
│ • Allow making offers to workers                                       │
│ • Enable billing                                                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3.2 Admin Report Handling

### Journey: "Alex handles a suspicious profile report"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ REPORT MANAGEMENT                                                      │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Reports & Moderation                                                   │
│                                                                        │
│ Filters: [All Types ▼] [Pending ▼] [Priority: High ▼]                 │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ 🚨 HIGH PRIORITY - Profile #7291                                   │ │
│ │ Type: Suspicious Activity / Fake Certifications                   │ │
│ │ Reported by: Leading Electrical Contractor                        │ │
│ │ Submitted: June 9, 2026 at 4:23 PM                                │ │
│ │                                                                    │ │
│ │ Summary: "Candidate claims NEN 3140 certification but certificate │ │
│ │ number doesn't match registry. Suspect fake documentation."       │ │
│ │                                                                    │ │
│ │ [Review Case ▶]                                                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 MEDIUM PRIORITY - Profile #8832                                 │ │
│ │ Type: Inappropriate Behavior                                      │ │
│ │ Reported by: TechInstall BV                                       │ │
│ │ Submitted: June 8, 2026 at 11:15 AM                               │ │
│ │                                                                    │ │
│ │ Summary: "Candidate was rude and unprofessional in messages."     │ │
│ │                                                                    │ │
│ │ [Review Case ▶]                                                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ 🟡 MEDIUM PRIORITY - Employer #445                                 │ │
│ │ Type: Disputed Offer Terms                                        │ │
│ │ Reported by: Profile #9001                                        │ │
│ │ Submitted: June 7, 2026 at 2:45 PM                                │ │
│ │                                                                    │ │
│ │ Summary: "Offer stated €55K but contract shows €48K. Bait &      │ │
│ │ switch suspected."                                                │ │
│ │                                                                    │ │
│ │ [Review Case ▶]                                                   │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ REPORT DETAIL VIEW                                                     │
└─────────────────────────────────────────────────────────────────────────┘

Admin clicks "Review Case" on Profile #7291 report

┌────────────────────────────────────────────────────────────────────────┐
│ Case #R-2026-0847 - Suspicious Certification                           │
│ Status: 🟡 Under Review                                                │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📋 REPORT DETAILS                                                      │
│                                                                        │
│ Reported Profile: #7291 (Industrial Electrician)                       │
│ Reported By: Leading Electrical Contractor (Tom Vermeer)              │
│ Report Type: Fake/Fraudulent Certification                            │
│ Submitted: June 9, 2026 at 4:23 PM                                    │
│                                                                        │
│ Reporter's Statement:                                                  │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ "We received an application from this candidate. During our       │ │
│ │ verification process, we checked their NEN 3140 certificate       │ │
│ │ number (NEN-2024-847291) against the official registry. The       │ │
│ │ number doesn't exist in the system.                               │ │
│ │                                                                   │ │
│ │ We've also noticed the certificate PDF looks different from       │ │
│ │ standard NEN certificates - the logo appears lower quality        │ │
│ │ and the formatting is off.                                        │ │
│ │                                                                   │ │
│ │ We're concerned this candidate may have submitted fraudulent      │ │
│ │ documentation. Please investigate."                               │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Attached Evidence:                                                     │
│ • Certificate_PDF_Copy.pdf (downloaded from profile)                  │
│ • Registry_Check_Screenshot.png                                       │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🔍 INVESTIGATION                                                       │
│                                                                        │
│ Profile Information:                                                   │
│ • Name: Jan de Vries (now revealed - offer accepted)                  │
│ • Email: jan.devries@email.com                                        │
│ • Phone: +31 6 12345678                                               │
│ • Location: Dordrecht                                                 │
│                                                                        │
│ Claimed Certifications:                                                │
│ • NEN 3140 VOP - Number: NEN-2024-847291 - Valid until: 2027         │
│ • VCA - Number: VCA-2023-445821 - Valid until: 2026                  │
│                                                                        │
│ Registry Verification Results:                                         │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ NEN 3140 Registry Check                                          │  │
│ │ Status: ❌ NOT FOUND                                              │  │
│ │ Certificate number NEN-2024-847291 does not exist in database.   │  │
│ │ Checked: June 10, 2026 at 10:15 AM                               │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ VCA Registry Check                                               │  │
│ │ Status: ✓ FOUND - VALID                                          │  │
│ │ Certificate number VCA-2023-445821 is valid.                     │  │
│ │ Holder: J. de Vries                                              │  │
│ │ Valid until: March 2026                                          │  │
│ │ Checked: June 10, 2026 at 10:16 AM                               │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Document Analysis (automated):                                         │
│ • NEN 3140 PDF: ⚠️ Anomalies detected                                 │
│   - Logo resolution lower than official certificates                 │
│   - Font mismatch in signature area                                  │
│   - Metadata shows creation in non-official software                 │
│   - Confidence: 87% likely fraudulent                                │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📊 PROFILE HISTORY                                                     │
│                                                                        │
│ • Member since: February 2026                                          │
│ • Total offers received: 8                                             │
│ • Offers accepted: 2                                                   │
│ • Previous employers: Not disclosed                                    │
│ • Previous reports: 0                                                  │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📝 ACTION LOG                                                          │
│                                                                        │
│ • June 9, 4:23 PM - Report submitted by employer                      │
│ • June 9, 4:25 PM - Auto-flagged for review                           │
│ • June 10, 10:15 AM - NEN registry check performed (failed)           │
│ • June 10, 10:16 AM - VCA registry check performed (passed)           │
│ • June 10, 10:20 AM - Document analysis completed                     │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📝 ADMIN NOTES                                                         │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ [Add investigation notes, internal comments]                     │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ⚖️ DECISION                                                            │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ ☑ Evidence supports fraud claim (NEN certification)              │  │
│ │ ☐ Evidence inconclusive - need more investigation                │  │
│ │ ☐ Report appears unfounded                                       │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ Available Actions:                                                     │
│                                                                        │
│ [⚠️ Issue Warning] - Formal warning, certification flagged            │
│ [🔒 Suspend Profile] - Temporary suspension pending investigation    │
│ [❌ Permanent Ban] - Remove from platform, blacklist                  │
│ [✅ Clear Profile] - No action needed, report unfounded              │
│                                                                        │
│ [Request More Info from Reporter]                                      │
│ [Contact Profile Holder for Explanation]                               │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 4. SUPPORT JOURNEYS

## 4.1 Support - Worker Onboarding Assistance

### Journey: "Sam helps Marco with profile issues"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SUPPORT TICKET SYSTEM                                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Support Dashboard                                   [New Ticket] [Alex ▼]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│ 📊 Queue Overview (Today)                                              │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐             │
│ │  23         │  8          │  4          │  2.4 hrs    │             │
│ │ Open        │ In         │ Escalated   │ Avg Response│             │
│ │ Tickets     │ Progress   │             │ Time        │             │
│ └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 🎫 My Assigned Tickets                                                 │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ #T-2026-4521 - Can't upload certification                        │ │
│ │ Worker: Marco V. (marco.electrician@gmail.com)                    │ │
│ │ Submitted: 2 hours ago                                            │ │
│ │ Priority: Normal                                                  │ │
│ │                                                                   │ │
│ │ "I'm trying to upload my NEN 3140 certificate but keep getting   │ │
│ │ an error message saying 'file too large'. The PDF is only 2MB."  │ │
│ │                                                                   │ │
│ │ [Respond] [View Profile] [Escalate]                              │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ #T-2026-4519 - Employer won't respond                            │ │
│ │ Worker: Lisa K. (lisa.k@email.com)                                │ │
│ │ Submitted: 4 hours ago                                            │ │
│ │ Priority: Normal                                                  │ │
│ │                                                                   │ │
│ │ "I accepted an offer 5 days ago and the employer hasn't          │ │
│ │ messaged me yet. Is this normal?"                                │ │
│ │                                                                   │ │
│ │ [Respond] [View Profile] [Escalate]                              │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ #T-2026-4515 - Can't verify identity                             │ │
│ │ Worker: Ahmed R. (ahmed.r@email.com)                              │ │
│ │ Submitted: 1 day ago                                              │ │
│ │ Priority: High                                                    │ │
│ │                                                                   │ │
│ │ "The ID verification keeps failing. I've tried 3 times with my  │ │
│ │ passport. The error says 'photo unclear' but it's very clear."   │ │
│ │                                                                   │ │
│ │ [Respond] [View Profile] [Escalate to Tech]                      │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TICKET DETAIL & RESPONSE                                               │
└─────────────────────────────────────────────────────────────────────────┘

Support clicks "Respond" on ticket #T-2026-4521

┌────────────────────────────────────────────────────────────────────────┐
│ Ticket #T-2026-4521                                                    │
│ Subject: Can't upload certification                                    │
│ Status: 🟡 In Progress                                                 │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 👤 USER INFORMATION                                                    │
│                                                                        │
│ Name: Marco Vermeulen                                                  │
│ Email: marco.electrician@gmail.com                                     │
│ Profile: #8472 (Live)                                                  │
│ Member Since: June 1, 2026                                             │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📝 TICKET HISTORY                                                      │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Marco • June 10, 2026 at 8:23 AM                                  │ │
│ │                                                                   │ │
│ │ Hi,                                                               │ │
│ │                                                                   │ │
│ │ I'm trying to upload my NEN 3140 certificate but keep getting    │ │
│ │ an error message saying "file too large". The PDF is only 2MB    │ │
│ │ which doesn't seem too large.                                    │ │
│ │                                                                   │ │
│ │ I've tried multiple times with the same result. Can you help?    │ │
│ │                                                                   │ │
│ │ Thanks,                                                          │ │
│ │ Marco                                                            │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 💬 YOUR RESPONSE                                                       │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ Hi Marco,                                                        │  │
│ │                                                                  │  │
│ │ Thanks for reaching out! I'm sorry you're having trouble        │  │
│ │ uploading your certificate.                                     │  │
│ │                                                                  │  │
│ │ The 2MB file size should definitely work - our limit is 10MB.   │  │
│ │ Let me help you troubleshoot this:                              │  │
│ │                                                                  │  │
│ │ 1. Try using a different browser (Chrome or Firefox work best)  │  │
│ │ 2. Clear your browser cache and cookies                        │  │
│ │ 3. Make sure you're on a stable internet connection            │  │
│ │ 4. Try uploading from a computer instead of mobile              │  │
│ │                                                                  │  │
│ │ If none of these work, you can also email the certificate      │  │
│ │ directly to support@offermarket.nl and we'll manually add      │  │
│ │ it to your profile within 24 hours.                            │  │
│ │                                                                  │  │
│ │ Let me know how it goes!                                        │  │
│ │                                                                  │  │
│ │ Best regards,                                                   │  │
│ │ Sam                                                             │  │
│ │ Customer Support Team                                           │  │
│ │ OfferMarket                                                     │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ [Send Response]  [Save Draft]  [Attach File]  [Insert Template]       │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📎 INTERNAL NOTES (not visible to user)                               │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ Checked upload logs - seeing errors on PDF validation service.  │  │
│ │ Tech team aware, investigating. If more reports come in,        │  │
│ │ escalate to #tech-support channel.                              │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ [Update Status] [Assign to...] [Escalate] [Close Ticket]              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4.2 Support - Employer Technical Support

### Journey: "Sam helps Tom with offer issues"

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EMPLOYER SUPPORT TICKET                                                │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ Ticket #T-2026-4534                                                    │
│ Subject: Can't edit submitted offer                                    │
│ Status: 🟢 Open                                                        │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 👤 EMPLOYER INFORMATION                                                │
│                                                                        │
│ Company: Leading Electrical Contractor BV                              │
│ KvK: 12345678                                                          │
│ Contact: Tom Vermeer (tom@leadingelectrical.nl)                       │
│ Account Manager: None (SMB segment)                                    │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 📝 TICKET HISTORY                                                      │
│                                                                        │
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │ Tom • June 10, 2026 at 11:45 AM                                   │ │
│ │                                                                   │ │
│ │ Hi,                                                               │ │
│ │                                                                   │ │
│ │ I submitted an offer this morning but realized I made a mistake  │ │
│ │ in the salary field. I wrote €45K instead of €55K.               │ │
│ │                                                                   │ │
│ │ The offer hasn't been viewed yet. Can I edit it?                 │ │
│                                                                   │ │
│ │ Thanks,                                                          │ │
│ │ Tom                                                              │ │
│ └───────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ ✅ KNOWLEDGE BASE ARTICLE (auto-suggested)                            │
│                                                                        │
│ "Editing Submitted Offers"                                             │
│                                                                        │
│ You can edit offers that haven't been viewed yet. Once viewed,        │
│ you need to withdraw and resubmit.                                    │
│                                                                        │
│ [Send Article] [Dismiss]                                               │
│                                                                        │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                        │
│ 💬 YOUR RESPONSE                                                       │
│                                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐  │
│ │ Hi Tom,                                                          │  │
│ │                                                                  │  │
│ │ Good news - since the offer hasn't been viewed yet, you can     │  │
│ │ edit it directly!                                               │  │
│ │                                                                  │  │
│ │ Here's how:                                                     │  │
│ │ 1. Go to your "Offers Sent" dashboard                          │  │
│ │ 2. Find the offer (Profile #8472)                              │  │
│ │ 3. Click "Edit" next to the offer                              │  │
│ │ 4. Update the salary field                                     │  │
│ │ 5. Click "Save Changes"                                        │  │
│ │                                                                  │  │
│ │ The candidate will see the updated offer.                      │  │
│ │                                                                  │  │
│ │ Note: Once an offer is viewed, editing is locked to maintain   │  │
│ │ transparency. In that case, you'd need to withdraw and send    │  │
│ │ a new offer.                                                   │  │
│ │                                                                  │  │
│ │ Need help? Reply to this ticket or call us at +31 20 1234567.  │  │
│ │                                                                  │  │
│ │ Best,                                                           │  │
│ │ Sam                                                            │  │
│ │ OfferMarket Support                                             │  │
│ └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│ [Send Response]  [Add Internal Note]  [Close Ticket]                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# JOURNEY MAP SUMMARY

## Key Touchpoints by User Type

### Worker Touchpoints
1. **Discovery**: Ads, referrals, search
2. **Landing**: Value prop, social proof
3. **Signup**: Email, phone verification
4. **Onboarding**: Profile creation (5 min)
5. **Activation**: First offer received
6. **Engagement**: Reviewing offers, comparing
7. **Conversion**: Accepting offer, messaging
8. **Retention**: Ongoing offers, profile updates

### Employer Touchpoints
1. **Discovery**: LinkedIn, Google, referrals
2. **Landing**: Talent pool preview, pricing
3. **Signup**: Company + personal info
4. **Verification**: KvK check, bank verification
5. **Onboarding**: Company profile setup
6. **Activation**: First search, first offer
7. **Engagement**: Managing offers, messaging
8. **Conversion**: Successful hire
9. **Retention**: Ongoing hiring, subscriptions

### Admin Touchpoints
1. **Monitoring**: Dashboard, health metrics
2. **Verification**: Employer approval workflow
3. **Moderation**: Report handling, fraud detection
4. **Operations**: User management, system config

### Support Touchpoints
1. **Intake**: Ticket queue, prioritization
2. **Resolution**: Response templates, troubleshooting
3. **Escalation**: Tech team, account managers
4. **Follow-up**: Satisfaction surveys, closure

---

**Document Owner:** Product Design  
**Last Updated:** June 2026  
**Next Review:** After MVP user testing
