# OfferMarket - UX Wireframe Descriptions

**Version:** 1.0  
**Date:** June 2026  
**Design System:** Mobile-first, responsive

---

## Design Principles

1. **Trust First** - Every interaction builds confidence
2. **Clarity Over Cleverness** - Obvious actions, no hidden patterns
3. **Progressive Disclosure** - Show what's needed, reveal more on demand
4. **Worker Empowerment** - Workers feel in control
5. **Employer Efficiency** - Employers can hire quickly

---

## Screen Inventory

### Public Screens (Unauthenticated)

| ID | Screen | Purpose |
|----|--------|---------|
| P01 | Landing Page (Worker) | Convert visitors to signups |
| P02 | Landing Page (Employer) | Convert employers to signups |
| P03 | How It Works | Explain the reverse marketplace |
| P04 | Pricing | Show employer pricing |
| P05 | About/Trust | Build credibility |

### Worker Screens

| ID | Screen | Purpose |
|----|--------|---------|
| W01 | Worker Signup | Account creation |
| W02 | Profile Creation | Build anonymous profile |
| W03 | Worker Dashboard | Overview of activity |
| W04 | Offers List | View received offers |
| W05 | Offer Detail | Review single offer |
| W06 | Offer Comparison | Compare multiple offers |
| W07 | Profile Settings | Manage profile & privacy |
| W08 | Conversations | Message employers |
| W09 | Analytics | View market insights |

### Employer Screens

| ID | Screen | Purpose |
|----|--------|---------|
| E01 | Employer Signup | Company registration |
| E02 | Employer Dashboard | Hiring overview |
| E03 | Search Results | Find talent |
| E04 | Profile Detail | View worker profile |
| E05 | Create Offer | Make structured offer |
| E06 | Offers Sent | Track offers |
| E07 | Conversations | Message candidates |
| E08 | Company Settings | Manage profile |
| E09 | Analytics | Hiring metrics |

### Admin Screens

| ID | Screen | Purpose |
|----|--------|---------|
| A01 | Admin Dashboard | Platform overview |
| A02 | Verification Queue | Review verifications |
| A03 | Reports Queue | Handle reports |
| A04 | User Management | Manage users |
| A05 | Platform Settings | Configure platform |

---

## Wireframe Descriptions

### P01: Landing Page (Worker)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET                                    Login          Sign Up  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         Tired of applying?                              │
│                    Let employers compete for YOU                        │
│                                                                         │
│              No applications. No spam. Real offers. Real salaries.      │
│                                                                         │
│                    [ Create Free Profile → ]                            │
│                                                                         │
│              Join 1,247 electricians receiving offers this month        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  How It Works                                                    │   │
│  │                                                                  │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │   │
│  │  │    1     │    │    2     │    │    3     │                   │   │
│  │  │  Create  │───>│ Receive │───>│  Choose  │                   │   │
│  │  │  Profile │    │  Offers  │    │  On Your │                   │   │
│  │  │  (2 min) │    │          │    │  Terms   │                   │   │
│  │  └──────────┘    └──────────┘    └──────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  What You Control                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ ✓ Anonymous    │  │ ✓ Salary       │  │ ✓ No Spam      │            │
│  │   Until Ready  │  │   Transparency │  │   Messages     │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Real Offers, Real Salaries                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ "Senior Electrician - €54,000-€58,000 + vehicle"                │   │
│  │ "Industrial Tech - €50,000-€55,000 + shift bonus"               │   │
│  │ "Maintenance Electrician - €48,000-€52,000 + benefits"          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    Ready to see what you're worth?                      │
│                    [ Create Free Profile → ]                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Clear value proposition above fold
- Social proof (member count, offer examples)
- Simple 3-step process
- Strong CTAs throughout
- Trust indicators (anonymous, no spam)

---

### P02: Landing Page (Employer)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET         For Employers           Login          Sign Up    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                    Stop chasing candidates.                             │
│                      Start making offers.                               │
│                                                                         │
│         Access pre-verified talent. No job posts. No applications.      │
│                                                                         │
│                   [ Create Employer Account → ]                         │
│                                                                         │
│              342 verified employers • 847 electricians available        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Talent Pool Preview (Live)                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Electricians in Netherlands              847                    │   │
│  │  ████████████████████████████████████████                       │   │
│  │                                                                  │   │
│  │  In Rotterdam Area                        127                    │   │
│  │  ██████████                                                     │   │
│  │                                                                  │   │
│  │  Available within 1 month                 43                     │   │
│  │  ████                                                           │   │
│  │                                                                  │   │
│  │                    [ View Sample Profiles → ]                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Simple Pricing                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Pay only when you succeed                                       │   │
│  │                                                                  │   │
│  │  €499 per successful introduction                               │   │
│  │  No introduction = no charge                                    │   │
│  │                                                                  │   │
│  │  Subscription plans available for active hiring                 │   │
│  │                                                                  │   │
│  │                    [ View Pricing → ]                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### W01: Worker Signup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET                                                            │
│                                                                         │
│                    Create Your Worker Profile                           │
│                    Stay anonymous. Get offers.                          │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1 of 4: Account                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Email Address *                                                 │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ marco@example.com                                         │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  Password *                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ ••••••••••••••••                              [👁]        │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │ ✓ 8+ characters  ✓ Number  ✓ Special char                │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                  │   │
│  │  Phone Number *                                                  │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ +31 6 12345678                                            │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  ☑ I am a worker, not an employer                               │   │
│  │  ☑ I agree to Terms and Privacy Policy                         │   │
│  │                                                                  │   │
│  │                    [ Continue → ]                                │   │
│  │                                                                  │   │
│  │  Already have an account? Log in                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### W02: Profile Creation

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET                              Step 2 of 4: Skills    [×]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Profile Progress                                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│  25%                                                                    │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  What are your skills?                                                  │
│  Add at least 5 skills to get more offers                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Primary Trade *                                                │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ Electrician                                    [▼]        │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Years of Experience *                                          │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ 10-15 years                                    [▼]        │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Skill Levels                                                   │   │
│  │                                                                  │   │
│  │  ⚡ Electrical Installation                                      │   │
│  │     ○ Beginner  ○ Intermediate  ● Advanced  ○ Expert           │   │
│  │                                                                  │   │
│  │  📜 NEN 3140 Certification                                       │   │
│  │     ○ Beginner  ○ Intermediate  ○ Advanced  ● Expert           │   │
│  │     Certificate Number: ┌─────────────────────┐                 │   │
│  │     Valid Until: ┌──────────┐                                    │   │
│  │                                                                  │   │
│  │  🔧 PLC Programming                                              │   │
│  │     ○ Beginner  ● Intermediate  ○ Advanced  ○ Expert           │   │
│  │                                                                  │   │
│  │  [+ Add another skill]                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  💡 Tip: Verified certifications get 3x more offers             │   │
│  │     Upload your certificates in the next step                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                    [ ← Back ]  [ Continue → ]                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### W03: Worker Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET         [🔔 3]  [✉️ 1]  Marco V. [▼]  [⚙️]               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Welcome back, Marco!                              Profile: ● Live     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 Your Activity (Last 30 days)                                       │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐     │
│  │               │               │               │               │     │
│  │    24         │     5         │     2         │    €56K       │     │
│  │  Profile      │   Offers      │  Shortlisted  │   Avg Offer   │     │
│  │   Views       │  Received     │               │    Value      │     │
│  │               │               │               │               │     │
│  │   ↑ 12%       │   ↑ 2 this    │               │   ↑ €3K       │     │
│  │   vs last     │   week        │               │   vs last     │     │
│  │   month       │               │               │   month       │     │
│  └───────────────┴───────────────┴───────────────┴───────────────┘     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📈 Market Value Score: 78/100  [↑ +5 this week]                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ████████████████████████████████████████░░░░░░░░░░░░            │   │
│  │                                                                  │   │
│  │  You're in the top 25% of electricians in Rotterdam             │   │
│  │  Based on: Experience (12 yrs), Certifications (3), Demand      │   │
│  │                                                                  │   │
│  │  [View Full Analytics →]                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  💼 Recent Offers (3 active)                        [View All →]       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⭐ NEW TODAY                                                     │   │
│  │ Leading Electrical Contractor ✓✓                 Reputation 4.2 │   │
│  │ Senior Electrician • Rotterdam                                  │   │
│  │                                                                  │   │
│  │ 💰 €54,000 - €58,000                                            │   │
│  │ 🎁 €3,000 sign-on • Company vehicle • 30 days vacation         │   │
│  │ 📍 15 km from you                                               │   │
│  │                                                                  │   │
│  │ [View Details]  [Shortlist ⭐]  [Reject ✕]                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ TechInstall BV ✓                                Reputation 3.8  │   │
│  │ Industrial Electrician • Dordrecht                              │   │
│  │                                                                  │   │
│  │ 💰 €50,000 - €54,000                                            │   │
│  │ 🎁 Training budget €2,000 • 28 days vacation                   │   │
│  │ 📍 28 km from you                                               │   │
│  │                                                                  │   │
│  │ [View Details]  [Shortlist ⭐]  [Reject ✕]                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🎯 Quick Actions                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Edit Profile │  │ Get Verified │  │ View Messages│                 │
│  │     [→]      │  │     [→]      │  │     [→]      │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### W05: Offer Detail

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET         ← Back to Offers                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Leading Electrical Contractor ✓✓                    ★★★★☆ (4.2/5)    │
│  Industrial & Commercial Electrical Services                           │
│  85 employees • Rotterdam • Founded 1998                               │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📋 POSITION                                                      │   │
│  │                                                                  │   │
│  │  Role: Senior Electrician                                        │   │
│  │  Department: Industrial Projects                                 │   │
│  │  Team: 8 electricians, reports to Project Manager               │   │
│  │                                                                  │   │
│  │  Description:                                                    │   │
│  │  We're looking for an experienced electrician to join our       │   │
│  │  industrial projects team. You'll work on factory installations,│   │
│  │  maintenance projects, and safety system upgrades.              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💰 COMPENSATION                                                 │   │
│  │                                                                  │   │
│  │  Base Salary          €54,000 - €58,000 /year                  │   │
│  │  Hourly Equivalent    €31.50 /hour                             │   │
│  │  Sign-on Bonus        €3,000 (after 3 months)                  │   │
│  │  Performance Bonus    5% (~€2,500/year)                        │   │
│  │  Overtime Rate        €35/hour, weekend €42/hour               │   │
│  │  ─────────────────────────────────────────────────────────     │   │
│  │  Estimated Year 1     €65,000 - €72,000                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎁 BENEFITS                                                      │   │
│  │                                                                  │   │
│  │  ✓ Company Vehicle    Full private use (est. €6,000/year)      │   │
│  │  ✓ Pension            8% company contribution                  │   │
│  │  ✓ Vacation           30 days (above minimum)                  │   │
│  │  ✓ Holiday Allowance  8% (€4,320 - €4,640/year)                │   │
│  │  ✓ Training Budget    €1,500/year                              │   │
│  │  ✓ Travel Allowance   €0.23/km or NS Business card             │   │
│  │  ✓ Phone              Company smartphone                        │   │
│  │  ✓ Tools              All tools provided                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📅 WORK ARRANGEMENT                                             │   │
│  │                                                                  │   │
│  │  Contract Type      Permanent (vast contract)                   │   │
│  │  Hours/Week         40 hours                                    │   │
│  │  Schedule           Mon-Thu 7:00-16:00, Fri 7:00-12:30         │   │
│  │  On-call            Rotating, 1 week per 6 weeks (paid)        │   │
│  │  Travel             80% sites, 20% office                       │   │
│  │  Start Date         Flexible                                    │   │
│  │  Probation          2 months                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📍 LOCATION                                                      │   │
│  │                                                                  │   │
│  │  Base: Rotterdam Airport area                                   │   │
│  │  Commute from you: 15 km (~20 min drive)                        │   │
│  │  Travel: Within Zuid-Holland province                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✅ REQUIREMENTS                                                 │   │
│  │                                                                  │   │
│  │  Required:                                                       │   │
│  │  • NEN 3140 certification (VOP)                                 │   │
│  │  • VCA certification                                            │   │
│  │  • Minimum 8 years experience                                   │   │
│  │  • Valid driver's license B                                     │   │
│  │  • Fluent in Dutch (spoken)                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Offer expires: June 24, 2026 (14 days)                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  [💬 Ask Question]    [⭐ Shortlist]    [✅ Accept]    [✕ Reject]│   │
│  │                                                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Your identity is hidden. It will only be revealed if you accept.     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### W06: Offer Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET         Compare Offers              [Add Another] [×]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Select 2-5 offers to compare side-by-side                             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                              Leading Electrical    TechInstall BV      │
│                              Contractor ✓✓         ✓                    │
│                              Senior Electrician    Industrial Elec.    │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────── │
│ 💰 TOTAL COMPENSATION (Year 1)                                          │
│ ─────────────────────────────────────────────────────────────────────── │
│ Base Salary                €54K - €58K            €50K - €54K          │
│ Sign-on Bonus              €3,000                 €1,500               │
│ Performance Bonus          5% (~€2.5K)            None                 │
│ Overtime Potential         ~€4K/year              ~€6K/year            │
│ Holiday Allowance (8%)     €4.3K - €4.6K          €4K - €4.3K          │
│ ─────────────────────────────────────────────────────────────────────── │
│ ESTIMATED YEAR 1 TOTAL     €65K - €72K   ★        €57K - €66K          │
│ ─────────────────────────────────────────────────────────────────────── │
│ 🎁 BENEFITS VALUE                                                       │
│ ─────────────────────────────────────────────────────────────────────── │
│ Company Vehicle            ✓ Full use             ✓ Work only          │
│ Vehicle Value (est)        €6,000/year            €3,000/year          │
│ Pension Contribution       8%                     6%                   │
│ Training Budget            €1,500/year            €2,000/year          │
│ Vacation Days              30 days                28 days              │
│ Phone                      ✓                      ✕                    │
│ ─────────────────────────────────────────────────────────────────────── │
│ 📅 WORK-LIFE BALANCE                                                    │
│ ─────────────────────────────────────────────────────────────────────── │
│ Hours/Week                 40                     40                   │
│ Schedule                   Mon-Thu + Fri AM       5-day rotation       │
│ Weekend Work               Rare                   Rotating             │
│ On-call                    1/6 weeks              1/4 weeks            │
│ Remote Work                Some admin days        None                 │
│ ─────────────────────────────────────────────────────────────────────── │
│ 📍 PRACTICAL FACTORS                                                    │
│ ─────────────────────────────────────────────────────────────────────── │
│ Commute Distance           15 km (20 min)         28 km (35 min)       │
│ Commute Cost (est)         €1,200/year            €2,100/year          │
│ Start Date                 Flexible               Within 2 weeks       │
│ Contract Type              Permanent              Permanent            │
│ ─────────────────────────────────────────────────────────────────────── │
│ ⭐ EMPLOYER REPUTATION                                                  │
│ ─────────────────────────────────────────────────────────────────────── │
│ Overall Rating             4.2/5 (87 reviews)     3.8/5 (34 reviews)   │
│ Offer Acceptance Rate      78%                    65%                  │
│ Would Recommend            82%                    71%                  │
│ ─────────────────────────────────────────────────────────────────────── │
│ 🏆 MATCH SCORE                                                          │
│ ─────────────────────────────────────────────────────────────────────── │
│ Based on your preferences  87/100 ★ Best Match    72/100               │
│ ─────────────────────────────────────────────────────────────────────── │
│ ACTIONS                                                                 │
│ ─────────────────────────────────────────────────────────────────────── │
│                            [Accept] [Shortlist]   [Accept] [Reject]    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### E02: Employer Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET         For Employers         [🔔 2]  Tom [▼]  [⚙️]      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Leading Electrical Contractor ✓✓                    Balance: €1,497  │
│  KvK: 12345678 • Rotterdam Area                                        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 Hiring Overview                                                     │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐     │
│  │               │               │               │               │     │
│  │      3        │      12       │       5       │      73%      │     │
│  │   Active      │   Offers      │  Candidates   │   Offer       │     │
│  │   Positions   │   Sent        │  Interviewed  │   Acceptance  │     │
│  │               │               │               │               │     │
│  │   ↓ 1         │   ↑ 3 this    │               │   ↑ 5% vs     │     │
│  │   vs last     │   week        │               │   last month  │     │
│  │   month       │               │               │               │     │
│  └───────────────┴───────────────┴───────────────┴───────────────┘     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🔍 Quick Search                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  [🔍 What skills are you looking for?]  [Rotterdam Area ▼]      │   │
│  │                                                 [ Search → ]     │   │
│  │                                                                  │   │
│  │  Quick filters:                                                  │   │
│  │  ☑ Available within 1 month   ☑ NEN 3140   ☑ VCA certified     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  💼 Recent Activity                                 [View All →]       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎉 Offer accepted!                                               │   │
│  │ Candidate: Marco V. (identity now revealed)                     │   │
│  │ Position: Senior Electrician                                    │   │
│  │ Offer value: €58,000                                            │   │
│  │                                                                  │   │
│  │ Invoice generated: €499 (due June 24)                           │   │
│  │                                                                  │   │
│  │ [Start Conversation]  [View Invoice]  [Schedule Interview]      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 3 new candidates match your criteria                            │   │
│  │                                                                  │   │
│  │ • Industrial Electrician, 10 yrs exp, Dordrecht                │   │
│  │ • Installation Electrician, 8 yrs exp, Breda                   │   │
│  │ • Maintenance Electrician, 15 yrs exp, Rotterdam               │   │
│  │                                                                  │   │
│  │ [View Matches →]                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⏳ Pending offers (3)                                            │   │
│  │                                                                  │   │
│  │ Profile #8472 - Viewed yesterday                               │   │
│  │ Profile #7291 - Not yet viewed                                 │   │
│  │ Profile #9104 - Viewed 3 days ago                              │   │
│  │                                                                  │   │
│  │ [Send Reminder]  [View All Offers →]                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🎯 Quick Actions                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Search Talent│  │ New Offer    │  │ View Analytics│                │
│  │     [→]      │  │     [→]      │  │     [→]      │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### E03: Search Results

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET         Search Talent                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Search: Electrician in Rotterdam Area (25 km)                         │
│                                                                         │
│  Filters: [Skills ▼] [Experience ▼] [Certifications ▼]                 │
│           [Availability ▼] [Contract Type ▼] [Salary Range ▼]          │
│                                                                         │
│  Sort: [Most Relevant ▼]  |  [Newest]  [Experience]  [Availability]    │
│                                                                         │
│  87 profiles found                                  [Save Search] [📧] │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Profile #8472 (anonymous)                    Available: Now     │   │
│  │ ⚡⚡⚡ Master Electrician                         [ Make Offer → ]│   │
│  │                                                                  │   │
│  │  📍 Rotterdam Area (exact location hidden)                      │   │
│  │  💼 12 years experience                                         │   │
│  │                                                                  │   │
│  │  Skills:                                                        │   │
│  │  • Electrical Installation - Expert                             │   │
│  │  • NEN 3140 - Certified ✓                                       │   │
│  │  • PLC Programming - Advanced                                   │   │
│  │  • Solar Installation - Intermediate                            │   │
│  │                                                                  │   │
│  │  Certifications: NEN 3140 VOP ✓, VCA ✓, First Aid ✓            │   │
│  │                                                                  │   │
│  │  Looking for: €50K-€60K • Permanent • 30km max commute         │   │
│  │                                                                  │   │
│  │  Match Score: 94%  |  Last active: Today                       │   │
│  │                                                                  │   │
│  │  [View Full Profile]                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Profile #7291 (anonymous)                   Available: 1 month  │   │
│  │ ⚡⚡ Industrial Electrician                       [ Make Offer → ]│   │
│  │                                                                  │   │
│  │  📍 Dordrecht (28 km from you)                                  │   │
│  │  💼 10 years experience                                         │   │
│  │                                                                  │   │
│  │  Skills:                                                        │   │
│  │  • Industrial Systems - Expert                                  │   │
│  │  • NEN 3140 - Certified ✓                                       │   │
│  │  • Safety Systems - Expert                                      │   │
│  │                                                                  │   │
│  │  Certifications: NEN 3140 VOP ✓, VCA ✓                         │   │
│  │                                                                  │   │
│  │  Looking for: €48K-€55K • Any contract • Shift work OK         │   │
│  │                                                                  │   │
│  │  Match Score: 89%  |  Last active: Yesterday                   │   │
│  │                                                                  │   │
│  │  [View Full Profile]                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Profile #9104 (anonymous)                   Available: Immediate│   │
│  │ ⚡⚡⚡ Senior Electrician                          [ Make Offer → ]│   │
│  │                                                                  │   │
│  │  📍 Rotterdam (15 km from you)                                  │   │
│  │  💼 15 years experience                                         │   │
│  │                                                                  │   │
│  │  Skills:                                                        │   │
│  │  • Team Leadership - Expert                                     │   │
│  │  • Electrical Installation - Expert                             │   │
│  │  • Project Management - Advanced                                │   │
│  │                                                                  │   │
│  │  Certifications: NEN 3140 VOP ✓, VCA ✓, Driver's License B ✓   │   │
│  │                                                                  │   │
│  │  Looking for: €55K-€65K • Permanent • Leadership role          │   │
│  │                                                                  │   │
│  │  Match Score: 91%  |  Last active: Today                       │   │
│  │                                                                  │   │
│  │  [View Full Profile]                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Pagination: [1] 2 3 4 5 ... Next                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### E05: Create Offer

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET         Create Offer                              [×]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Making offer to: Profile #8472                                        │
│  12 yrs exp • Rotterdam • €50K-€60K expected                           │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Step 1 of 6: Position Details                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                                                                  │   │
│  │  Job Title *                                                     │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ Senior Electrician                                        │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  Department/Team                                                 │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ Industrial Projects                                       │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  Job Description *                                               │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ We're looking for an experienced electrician to join     │  │   │
│  │  │ our industrial projects team. You'll work on factory     │  │   │
│  │  │ installations, maintenance projects, and safety system   │  │   │
│  │  │ upgrades.                                                 │  │   │
│  │  │                                                           │  │   │
│  │  │ Key responsibilities:                                     │  │   │
│  │  │ • Install and maintain industrial electrical systems     │  │   │
│  │  │ • Read and interpret technical drawings                  │  │   │
│  │  │ • Ensure compliance with NEN 3140 standards              │  │   │
│  │  │ • Mentor junior electricians                             │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │  Required Certifications                                        │   │
│  │  ☑ NEN 3140 VOP   ☑ VCA   ☐ First Aid   ☐ Driver's License    │   │
│  │                                                                  │   │
│  │  Required Experience: [8+] years                                 │   │
│  │                                                                  │   │
│  │                    [ Continue → ]                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💡 Tips for a great offer                                       │   │
│  │                                                                  │   │
│  │  • Be specific about salary (no "competitive")                  │   │
│  │  • Highlight unique benefits                                    │   │
│  │  • Include growth opportunities                                 │   │
│  │  • Mention work-life balance                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### A01: Admin Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  OFFERMARKET ADMIN                    [🔔 5]  Alex [▼]  [⚙️]           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📊 Platform Health (Last 7 days)                                      │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐     │
│  │               │               │               │               │     │
│  │    1,247      │     342       │      89       │    €47,500    │     │
│  │   Total       │   Active      │    New        │   Revenue     │     │
│  │   Workers     │   Employers   │  This Week    │   (MTD)       │     │
│  │               │               │               │               │     │
│  │   ↑ 5%        │   ↑ 3%        │   ↑ 12%       │   ↑ 8%        │     │
│  └───────────────┴───────────────┴───────────────┴───────────────┘     │
│                                                                         │
│  ┌───────────────┬───────────────┬───────────────┬───────────────┐     │
│  │               │               │               │               │     │
│  │     234       │      67       │      12       │     94.2%     │     │
│  │   Offers      │   Matches     │  Introductions│    Uptime     │     │
│  │   Sent        │   This Week   │   This Week   │               │     │
│  └───────────────┴───────────────┴───────────────┴───────────────┘     │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ⚠️ Action Required                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🔴 VERIFICATION QUEUE: 8 pending                                │   │
│  │                                                                  │   │
│  │ Oldest: 2 days waiting                                          │   │
│  │                                                                  │   │
│  │ ┌────────────────────────────────────────────────────────────┐  │   │
│  │ │ ABC Electrical BV • KvK: 87654321 • Submitted 2 days ago  │  │   │
│  │ │ Risk Score: LOW (12/100)                                   │  │   │
│  │ │ [Review] [Approve] [Reject]                                │  │   │
│  │ └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                  │   │
│  │                    [View Full Queue →]                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🟡 REPORTS QUEUE: 3 pending                                     │   │
│  │                                                                  │   │
│  │ • Suspicious certification (Profile #7291) - HIGH priority     │   │
│  │ • Inappropriate behavior (Profile #8832) - MEDIUM priority     │   │
│  │ • Disputed offer terms (Employer #445) - MEDIUM priority       │   │
│  │                                                                  │   │
│  │                    [View Reports →]                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🟠 FRAUD ALERTS: 2 flagged                                      │   │
│  │                                                                  │   │
│  │ • Duplicate KvK detected (Employer #447, #448)                 │   │
│  │ • Unusual offer pattern from Employer #392                     │   │
│  │                                                                  │   │
│  │                    [Review Alerts →]                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📈 Recent Activity Feed                            [View Full Log →]  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ • 10:42 AM - New employer: ABC Electrical BV                    │   │
│  │ • 10:38 AM - Offer accepted: Profile #8472 → Leading Electrical │   │
│  │ • 10:35 AM - Verification completed: TechInstall BV ✓           │   │
│  │ • 10:30 AM - Report filed: Profile #7291 (under review)         │   │
│  │ • 10:25 AM - Payment received: €499 (invoice #2026-0542)        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Considerations

All screens are designed mobile-first with these adaptations:

### Mobile Layout Changes

1. **Navigation**: Bottom tab bar instead of top nav
2. **Cards**: Full-width cards, stacked vertically
3. **Tables**: Horizontal scroll or card transformation
4. **Forms**: Single column, larger touch targets
5. **Actions**: Floating action button for primary action

### Mobile-Specific Patterns

```
┌─────────────────────────┐
│  OFFERMARKET       [≡]  │
├─────────────────────────┤
│                         │
│  Welcome back, Marco!   │
│                         │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │  Market Value     │  │
│  │  78/100  ↑ +5     │  │
│  │  ████████░░       │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  5 New Offers     │  │
│  │  [View All →]     │  │
│  └───────────────────┘  │
│                         │
├───────┬─────┬─────┬─────┤
│ 🏠    │ 🔍  │ 💼  │ ⚙️  │
│ Home  │Search│Offers│Settings│
└───────┴─────┴─────┴─────┘
```

---

## Component Library

### Core Components

| Component | Variants | Usage |
|-----------|----------|-------|
| Button | Primary, Secondary, Ghost, Danger | Actions |
| Input | Text, Email, Password, Number | Forms |
| Select | Single, Multi | Dropdowns |
| Card | Default, Interactive, Highlighted | Containers |
| Badge | Success, Warning, Error, Info | Status |
| Avatar | Worker (anon), Employer | User representation |
| Modal | Default, Confirmation, Form | Overlays |
| Toast | Success, Error, Warning, Info | Notifications |

### Feature Components

| Component | Usage |
|-----------|-------|
| OfferCard | Display offer summary |
| ProfileCard | Display worker summary |
| MatchScore | Show compatibility |
| SalaryRange | Display compensation |
| VerificationBadge | Show verification status |
| ComparisonTable | Side-by-side offers |
| ReputationStars | Employer rating display |

---

**Document Owner:** Product Design  
**Last Updated:** June 2026  
**Next Review:** After user testing
