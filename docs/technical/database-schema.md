# OfferMarket - Database Schema

**Version:** 1.0  
**Date:** June 2026  
**Database:** PostgreSQL 15+

---

## Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OFFERMARKET DATA MODEL                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   users      │────<│   profiles   │────<│   skills     │
│              │     │              │     │              │
│ - id         │     │ - id         │     │ - id         │
│ - email      │     │ - user_id    │     │ - name       │
│ - role       │     │ - status     │     │ - category   │
│ - verified   │     │ - region     │     └──────────────┘
└──────────────┘     └──────────────┘           │
       │                     │                  │
       │                     │     ┌────────────┴────────────┐
       │                     │     │                         │
       │                     ▼     ▼                         ▼
       │            ┌──────────────────┐           ┌──────────────────┐
       │            │ profile_skills   │           │ certifications   │
       │            │                  │           │                  │
       │            │ - profile_id     │           │ - id             │
       │            │ - skill_id       │           │ - profile_id     │
       │            │ - level          │           │ - name           │
       │            │ - years          │           │ - number         │
       │            └──────────────────┘           │ - valid_until    │
       │                                          └──────────────────┘
       │
       │     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
       └────<│  employers   │────<│offer_templates│     │ verifications │
              │              │     │              │     │              │
              │ - id         │     │ - id         │     │ - id         │
              │ - user_id    │     │ - employer_id│     │ - entity_id  │
              │ - company_*  │     │ - title      │     │ - type       │
              └──────────────┘     └──────────────┘     │ - status     │
                     │                                   └──────────────┘
                     │
                     │     ┌──────────────┐     ┌──────────────┐
                     └────<│   offers     │────<│offer_versions│
                            │              │     │              │
                            │ - id         │     │ - offer_id   │
                            │ - worker_id  │     │ - version    │
                            │ - employer_id│     │ - salary_*   │
                            │ - status     │     │ - benefits   │
                            └──────────────┘     └──────────────┘
                                   │
                                   │     ┌──────────────┐
                                   └────<│  messages    │
                                          │              │
                                          │ - id         │
                                          │ - offer_id   │
                                          │ - sender_id  │
                                          │ - content    │
                                          └──────────────┘
```

---

## Core Tables

### 1. users

Base authentication and authorization table.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ,
    password_hash VARCHAR(255),
    
    -- Role: worker, employer, admin, support
    role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'employer', 'admin', 'support')),
    
    -- Verification status
    phone_number VARCHAR(20),
    phone_verified_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Account status
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'suspended', 'banned', 'pending_verification', 'deleted')),
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    last_login_ip INET,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NOT NULL;
```

---

### 2. workers

Extended worker profile data (1:1 with users).

```sql
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Anonymous profile - identity hidden from employers
    public_id VARCHAR(12) UNIQUE NOT NULL, -- e.g., "Profile #8472"
    
    -- Location (region only visible to employers)
    region_id UUID REFERENCES regions(id),
    postal_code VARCHAR(10), -- Encrypted, not shown to employers
    city VARCHAR(100),
    country VARCHAR(2) DEFAULT 'NL',
    
    -- Professional summary
    years_of_experience INTEGER CHECK (years_of_experience BETWEEN 0 AND 50),
    primary_trade VARCHAR(100),
    
    -- Availability
    availability VARCHAR(20) DEFAULT 'not_available'
        CHECK (availability IN ('immediate', '1_month', '3_months', '6_months', 'not_available')),
    notice_period_days INTEGER CHECK (notice_period_days BETWEEN 0 AND 90),
    
    -- Work preferences
    desired_salary_min INTEGER CHECK (desired_salary_min >= 0),
    desired_salary_max INTEGER CHECK (desired_salary_max >= 0),
    desired_hourly_rate INTEGER CHECK (desired_hourly_rate >= 0),
    employment_types VARCHAR(50)[], -- ['permanent', 'contract', 'freelance']
    travel_distance_km INTEGER DEFAULT 30 CHECK (travel_distance_km BETWEEN 0 AND 200),
    work_schedule_prefs VARCHAR(50)[],
    industry_prefs VARCHAR(50)[],
    career_priorities VARCHAR(50)[],
    
    -- Profile settings
    profile_visibility VARCHAR(20) DEFAULT 'all_verified'
        CHECK (profile_visibility IN ('all_verified', 'selected_companies', 'hidden')),
    is_profile_complete BOOLEAN DEFAULT FALSE,
    profile_completeness_pct INTEGER DEFAULT 0 CHECK (profile_completeness_pct BETWEEN 0 AND 100),
    
    -- Reputation
    reputation_score INTEGER DEFAULT 50 CHECK (reputation_score BETWEEN 0 AND 100),
    response_rate INTEGER DEFAULT 0 CHECK (response_rate BETWEEN 0 AND 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_workers_region ON workers(region_id);
CREATE INDEX idx_workers_availability ON workers(availability);
CREATE INDEX idx_workers_visibility ON workers(profile_visibility);
CREATE INDEX idx_workers_experience ON workers(years_of_experience);
```

---

### 3. employers

Company/employer profile data (1:1 with users).

```sql
CREATE TABLE employers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Company identification
    company_name VARCHAR(255) NOT NULL,
    company_trade_name VARCHAR(255),
    kvk_number VARCHAR(20) UNIQUE NOT NULL, -- Dutch Chamber of Commerce
    vat_number VARCHAR(20),
    
    -- Company details
    company_size VARCHAR(20) 
        CHECK (company_size IN ('1-10', '10-20', '20-50', '50-100', '100-200', '200-500', '500+')),
    industry VARCHAR(100),
    founded_year INTEGER,
    annual_revenue VARCHAR(20),
    
    -- Addresses
    registered_address JSONB NOT NULL, -- {street, number, postal_code, city, country}
    business_address JSONB, -- NULL if same as registered
    
    -- Contact
    website VARCHAR(255),
    phone VARCHAR(20),
    billing_email VARCHAR(255),
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'basic_verified', 'premium_verified', 'rejected')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    
    -- Reputation
    reputation_score INTEGER DEFAULT 50 CHECK (reputation_score BETWEEN 0 AND 100),
    offer_acceptance_rate INTEGER DEFAULT 0 CHECK (offer_acceptance_rate BETWEEN 0 AND 100),
    avg_response_time_hours INTEGER DEFAULT 0,
    
    -- Hiring stats (denormalized for performance)
    total_offers_sent INTEGER DEFAULT 0,
    total_hires INTEGER DEFAULT 0,
    
    -- Billing
    billing_status VARCHAR(20) DEFAULT 'active'
        CHECK (billing_status IN ('active', 'suspended', 'past_due', 'cancelled')),
    subscription_plan VARCHAR(20) DEFAULT 'pay_per_intro'
        CHECK (subscription_plan IN ('pay_per_intro', 'basic', 'professional', 'enterprise')),
    credit_balance INTEGER DEFAULT 0, -- For prepaid credits
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_employers_user_id ON employers(user_id);
CREATE INDEX idx_employers_kvk ON employers(kvk_number);
CREATE INDEX idx_employers_verification ON employers(verification_status);
CREATE INDEX idx_employers_region ON employers((registered_address->>'city'));
```

---

### 4. regions

Geographic regions for search and filtering.

```sql
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES regions(id),
    
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100), -- English name
    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('country', 'province', 'city', 'district', 'postal_code')),
    
    -- Netherlands-specific
    province VARCHAR(50), -- For NL: Noord-Holland, Zuid-Holland, etc.
    postal_code_prefix VARCHAR(4), -- For NL: first 4 chars (e.g., "3015")
    
    -- Coordinates
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    
    -- Hierarchy path for efficient queries
    path LTREE, -- Requires ltree extension
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regions_parent ON regions(parent_id);
CREATE INDEX idx_regions_type ON regions(type);
CREATE INDEX idx_regions_path ON regions USING GIST (path);
```

---

### 5. skills

Master list of skills in the platform.

```sql
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'technical', 'certification', 'soft_skill', 'language'
    subcategory VARCHAR(50),
    description TEXT,
    
    -- For trades: is this a required certification?
    is_certification BOOLEAN DEFAULT FALSE,
    certification_body VARCHAR(100), -- e.g., "VCA", "NEN"
    
    -- Hierarchy
    parent_skill_id UUID REFERENCES skills(id),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0, -- Denormalized count
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_parent ON skills(parent_skill_id);
CREATE INDEX idx_skills_slug ON skills(slug);
```

---

### 6. profile_skills

Worker skills (many-to-many with proficiency).

```sql
CREATE TABLE profile_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
    
    -- Proficiency level
    level VARCHAR(20) NOT NULL 
        CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master')),
    years_of_experience INTEGER CHECK (years_of_experience BETWEEN 0 AND 50),
    
    -- Certification details (if applicable)
    certification_number VARCHAR(100),
    certified_by VARCHAR(100),
    valid_until DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    is_primary BOOLEAN DEFAULT FALSE, -- Is this a primary skill?
    last_used_at TIMESTAMPTZ, -- When was this skill last used professionally
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (profile_id, skill_id)
);

CREATE INDEX idx_profile_skills_profile ON profile_skills(profile_id);
CREATE INDEX idx_profile_skills_skill ON profile_skills(skill_id);
CREATE INDEX idx_profile_skills_level ON profile_skills(level);
```

---

### 7. certifications

Worker certifications (separate from skills for verification).

```sql
CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id), -- Link to skill if applicable
    
    name VARCHAR(200) NOT NULL,
    certification_number VARCHAR(100),
    issuing_body VARCHAR(200) NOT NULL,
    
    -- Validity
    issued_at DATE,
    valid_from DATE,
    valid_until DATE,
    is_lifetime BOOLEAN DEFAULT FALSE,
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES users(id),
    verification_method VARCHAR(50), -- 'manual', 'api', 'document'
    
    -- Document
    document_url VARCHAR(500), -- Encrypted S3 URL
    document_verified BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certifications_profile ON certifications(profile_id);
CREATE INDEX idx_certifications_status ON certifications(verification_status);
CREATE INDEX idx_certifications_validity ON certifications(valid_until);
```

---

### 8. offers

Core offer table - tracks offer lifecycle.

```sql
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id VARCHAR(12) UNIQUE NOT NULL, -- For customer-facing references
    
    -- Parties
    worker_id UUID NOT NULL REFERENCES workers(id),
    employer_id UUID NOT NULL REFERENCES employers(id),
    
    -- Position
    job_title VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    job_description TEXT,
    
    -- Status lifecycle
    status VARCHAR(30) NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft', 'submitted', 'viewed', 'shortlisted', 
            'accepted', 'rejected', 'expired', 'withdrawn', 'countered'
        )),
    
    -- Timeline
    submitted_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    
    -- Current version (links to offer_versions)
    current_version_id UUID REFERENCES offer_versions(id),
    
    -- Worker actions
    shortlisted_at TIMESTAMPTZ,
    countered_at TIMESTAMPTZ,
    
    -- Metadata
    source VARCHAR(50), -- 'search', 'recommended', 'direct'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_worker ON offers(worker_id);
CREATE INDEX idx_offers_employer ON offers(employer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_submitted ON offers(submitted_at);
CREATE INDEX idx_offers_expires ON offers(expires_at);
CREATE INDEX idx_offers_worker_status ON offers(worker_id, status);
```

---

### 9. offer_versions

Versioned offer details (salary, benefits, etc.).

```sql
CREATE TABLE offer_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Compensation (all required fields)
    salary_min INTEGER NOT NULL CHECK (salary_min >= 20000),
    salary_max INTEGER NOT NULL CHECK (salary_max >= salary_min),
    salary_period VARCHAR(20) DEFAULT 'year' CHECK (salary_period IN ('hour', 'week', 'month', 'year')),
    
    hourly_rate INTEGER CHECK (hourly_rate >= 0), -- For part-time/contract
    
    sign_on_bonus INTEGER DEFAULT 0 CHECK (sign_on_bonus >= 0),
    performance_bonus_pct INTEGER DEFAULT 0 CHECK (performance_bonus_pct BETWEEN 0 AND 100),
    overtime_rate INTEGER CHECK (overtime_rate >= 0),
    weekend_rate INTEGER CHECK (weekend_rate >= 0),
    
    -- Contract terms
    contract_type VARCHAR(30) NOT NULL
        CHECK (contract_type IN ('permanent', 'fixed_term', 'contract', 'freelance', 'part_time')),
    contract_duration_months INTEGER CHECK (contract_duration_months BETWEEN 1 AND 36),
    hours_per_week INTEGER NOT NULL CHECK (hours_per_week BETWEEN 12 AND 40),
    start_date_type VARCHAR(20) DEFAULT 'flexible'
        CHECK (start_date_type IN ('flexible', 'specific')),
    start_date DATE,
    probation_months INTEGER DEFAULT 2 CHECK (probation_months BETWEEN 0 AND 6),
    
    -- Benefits
    vacation_days INTEGER NOT NULL CHECK (vacation_days BETWEEN 20 AND 40),
    holiday_allowance_pct INTEGER DEFAULT 8 CHECK (holiday_allowance_pct BETWEEN 0 AND 12),
    pension_contribution_pct INTEGER DEFAULT 0 CHECK (pension_contribution_pct BETWEEN 0 AND 15),
    training_budget INTEGER DEFAULT 0 CHECK (training_budget >= 0),
    
    -- Company vehicle
    company_vehicle VARCHAR(30)
        CHECK (company_vehicle IN ('full_use', 'work_only', 'not_provided')),
    vehicle_type VARCHAR(100),
    vehicle_value_est INTEGER CHECK (vehicle_value_est >= 0),
    
    -- Allowances
    travel_allowance_type VARCHAR(30)
        CHECK (travel_allowance_type IN ('per_km', 'ns_card', 'monthly', 'not_provided')),
    travel_allowance_value INTEGER CHECK (travel_allowance_value >= 0),
    phone_provided BOOLEAN DEFAULT FALSE,
    tools_provided BOOLEAN DEFAULT FALSE,
    
    -- Work arrangement
    schedule_type VARCHAR(50)[], -- ['daytime', 'shift', 'weekend', 'on_call']
    on_call_details TEXT,
    remote_work_pct INTEGER DEFAULT 0 CHECK (remote_work_pct BETWEEN 0 AND 100),
    travel_required_pct INTEGER DEFAULT 0 CHECK (travel_required_pct BETWEEN 0 AND 100),
    travel_region VARCHAR(200),
    physical_requirements TEXT,
    
    -- Requirements
    required_certifications JSONB[], -- Array of certification names
    required_experience_years INTEGER DEFAULT 0,
    
    -- Is this the version that was accepted?
    is_accepted_version BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offer_versions_offer ON offer_versions(offer_id);
CREATE INDEX idx_offer_versions_version ON offer_versions(offer_id, version);
```

---

### 10. messages

Post-acceptance communication.

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES offers(id),
    
    sender_id UUID NOT NULL REFERENCES users(id),
    recipient_id UUID NOT NULL REFERENCES users(id),
    
    content TEXT NOT NULL,
    content_encrypted TEXT, -- Encrypted version for sensitive data
    
    -- Message type
    message_type VARCHAR(30) DEFAULT 'text'
        CHECK (message_type IN ('text', 'file', 'calendar_invite', 'document_request')),
    
    -- Attachments
    attachments JSONB[], -- [{name, url, size, type}]
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- For system messages (offer status changes, etc.)
    is_system_message BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_offer ON messages(offer_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_read ON messages(recipient_id, is_read) WHERE is_read = FALSE;
```

---

### 11. conversations

Conversation threads (groups messages by offer).

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID UNIQUE NOT NULL REFERENCES offers(id),
    
    participant_1_id UUID NOT NULL REFERENCES users(id), -- Worker
    participant_2_id UUID NOT NULL REFERENCES users(id), -- Employer
    
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    
    unread_count_worker INTEGER DEFAULT 0,
    unread_count_employer INTEGER DEFAULT 0,
    
    is_archived_worker BOOLEAN DEFAULT FALSE,
    is_archived_employer BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_offer ON conversations(offer_id);
CREATE INDEX idx_conversations_participant ON conversations(participant_1_id);
```

---

### 12. blocked_companies

Workers can block specific employers.

```sql
CREATE TABLE blocked_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    
    reason VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (worker_id, employer_id)
);

CREATE INDEX idx_blocked_worker ON blocked_companies(worker_id);
CREATE INDEX idx_blocked_employer ON blocked_companies(employer_id);
```

---

### 13. ratings

Worker ratings of employers (post-interview/hire).

```sql
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID UNIQUE NOT NULL REFERENCES offers(id),
    
    rater_id UUID NOT NULL REFERENCES users(id), -- Worker who was hired
    employer_id UUID NOT NULL REFERENCES employers(id),
    
    -- Rating categories (1-5 scale)
    rating_overall INTEGER NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    rating_interview_experience INTEGER CHECK (rating_interview_experience BETWEEN 1 AND 5),
    rating_transparency INTEGER CHECK (rating_transparency BETWEEN 1 AND 5),
    rating_communication INTEGER CHECK (rating_communication BETWEEN 1 AND 5),
    rating_offer_accuracy INTEGER CHECK (rating_offer_accuracy BETWEEN 1 AND 5),
    rating_work_life_balance INTEGER CHECK (rating_work_life_balance BETWEEN 1 AND 5),
    
    -- Would work again?
    would_work_again BOOLEAN,
    
    -- Written review
    review_text TEXT,
    review_title VARCHAR(200),
    
    -- Moderation
    is_published BOOLEAN DEFAULT FALSE,
    is_verified_hire BOOLEAN DEFAULT FALSE, -- Only verified hires can publish
    flagged_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ratings_offer ON ratings(offer_id);
CREATE INDEX idx_ratings_employer ON ratings(employer_id);
CREATE INDEX idx_ratings_rater ON ratings(rater_id);
CREATE INDEX idx_ratings_published ON ratings(is_published);
```

---

### 14. verifications

Identity and credential verification tracking.

```sql
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What entity is being verified?
    entity_type VARCHAR(20) NOT NULL 
        CHECK (entity_type IN ('worker', 'employer', 'certification', 'document')),
    entity_id UUID NOT NULL,
    
    -- Verification type
    verification_type VARCHAR(50) NOT NULL
        CHECK (verification_type IN (
            'identity', 'phone', 'email', 'company_kvk', 'bank_account',
            'certification', 'document', 'address', 'ubo'
        )),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'verified', 'failed', 'expired')),
    
    -- Method
    method VARCHAR(50), -- 'manual', 'api', 'document_upload', 'microdeposit'
    
    -- Details (JSON for flexibility)
    details JSONB, -- {provider, reference_id, checks_performed, etc.}
    
    -- Documents
    document_urls VARCHAR(500)[], -- Encrypted S3 URLs
    
    -- Result
    result VARCHAR(20), -- 'pass', 'fail', 'inconclusive'
    failure_reason TEXT,
    
    -- Validity
    valid_until DATE,
    
    -- Performed by
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verifications_entity ON verifications(entity_type, entity_id);
CREATE INDEX idx_verifications_type ON verifications(verification_type);
CREATE INDEX idx_verifications_status ON verifications(status);
```

---

### 15. notifications

User notifications.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Type
    notification_type VARCHAR(50) NOT NULL,
    category VARCHAR(50), -- 'offer', 'message', 'system', 'billing'
    
    -- Content
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    
    -- Deep linking
    action_url VARCHAR(500),
    action_data JSONB,
    
    -- Delivery channels
    channel_email BOOLEAN DEFAULT FALSE,
    channel_push BOOLEAN DEFAULT FALSE,
    channel_sms BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
```

---

### 16. analytics_events

Event tracking for analytics.

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    
    -- Actor
    user_id UUID REFERENCES users(id),
    user_type VARCHAR(20), -- 'worker', 'employer'
    
    -- Context
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Event data
    properties JSONB NOT NULL,
    
    -- Timestamps
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by date for performance
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_occurred ON analytics_events(occurred_at);
```

---

### 17. subscriptions

Employer subscriptions and billing.

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES employers(id),
    
    -- Stripe
    stripe_customer_id VARCHAR(100) UNIQUE,
    stripe_subscription_id VARCHAR(100) UNIQUE,
    
    -- Plan
    plan VARCHAR(30) NOT NULL
        CHECK (plan IN ('pay_per_intro', 'basic', 'professional', 'enterprise')),
    status VARCHAR(30) DEFAULT 'active'
        CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
    
    -- Billing
    currency VARCHAR(3) DEFAULT 'EUR',
    amount INTEGER NOT NULL, -- In cents
    interval VARCHAR(20) CHECK (interval IN ('month', 'year')),
    
    -- Period
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    
    -- Usage
    offers_included INTEGER DEFAULT 0,
    offers_used INTEGER DEFAULT 0,
    introductions_this_month INTEGER DEFAULT 0,
    
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_employer ON subscriptions(employer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);
```

---

### 18. invoices

Invoices for pay-per-introduction and subscriptions.

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(30) UNIQUE NOT NULL, -- e.g., "2026-000542"
    
    employer_id UUID NOT NULL REFERENCES employers(id),
    subscription_id UUID REFERENCES subscriptions(id),
    
    -- Related introduction
    offer_id UUID REFERENCES offers(id),
    
    -- Amounts
    currency VARCHAR(3) DEFAULT 'EUR',
    subtotal INTEGER NOT NULL, -- In cents
    vat_rate INTEGER DEFAULT 21, -- NL VAT rate
    vat_amount INTEGER NOT NULL,
    total INTEGER NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'paid', 'past_due', 'cancelled', 'refunded')),
    
    -- Dates
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    due_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- Stripe
    stripe_invoice_id VARCHAR(100) UNIQUE,
    stripe_charge_id VARCHAR(100),
    
    -- PDF
    pdf_url VARCHAR(500),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_employer ON invoices(employer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
```

---

### 19. audit_logs

Comprehensive audit trail.

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Actor
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    user_role VARCHAR(20),
    
    -- Action
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'view', 'export'
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    
    -- Changes
    changes JSONB, -- {field, old_value, new_value}
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_occurred ON audit_logs(occurred_at);
```

---

### 20. admin_settings

Platform configuration.

```sql
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO admin_settings (key, value, description) VALUES
    ('platform.maintenance_mode', 'false', 'Enable maintenance mode'),
    ('platform.worker_signup_enabled', 'true', 'Allow new worker signups'),
    ('platform.employer_signup_enabled', 'true', 'Allow new employer signups'),
    ('offers.default_expiry_days', '14', 'Default offer expiry in days'),
    ('offers.max_expiry_days', '30', 'Maximum offer expiry in days'),
    ('verification.auto_approve_kvk', 'true', 'Auto-verify valid KvK numbers'),
    ('pricing.pay_per_intro_fee', '49900', 'Pay-per-intro fee in cents'),
    ('limits.offers_per_day_free', '5', 'Daily offer limit for free tier');
```

---

## Supporting Tables

### Skills Categories

```sql
CREATE TABLE skill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES skill_categories(id),
    sort_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed data for electricians
INSERT INTO skill_categories (name, slug, sort_order, icon) VALUES
    ('Electrical Installation', 'electrical-installation', 1, 'zap'),
    ('Safety & Compliance', 'safety-compliance', 2, 'shield'),
    ('Industrial Systems', 'industrial-systems', 3, 'factory'),
    ('Solar & Renewables', 'solar-renewables', 4, 'sun'),
    ('HVAC', 'hvac', 5, 'wind'),
    ('Maintenance', 'maintenance', 6, 'tool'),
    ('Programming & Automation', 'programming-automation', 7, 'cpu'),
    ('Soft Skills', 'soft-skills', 8, 'users');
```

### Job Templates (for employer convenience)

```sql
CREATE TABLE job_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Pre-filled offer defaults
    default_salary_min INTEGER,
    default_salary_max INTEGER,
    default_benefits JSONB,
    default_requirements JSONB,
    
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Saved Searches (for employers)

```sql
CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    
    -- Search criteria
    filters JSONB NOT NULL, -- {skills, region, experience, etc.}
    
    -- Alert settings
    alert_enabled BOOLEAN DEFAULT TRUE,
    alert_frequency VARCHAR(20) DEFAULT 'daily'
        CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
    
    last_run_at TIMESTAMPTZ,
    last_result_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Market Data (for analytics)

```sql
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Granularity
    data_type VARCHAR(50) NOT NULL,
    region_id UUID REFERENCES regions(id),
    skill_id UUID REFERENCES skills(id),
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metrics
    metrics JSONB NOT NULL, -- {avg_salary, demand_score, supply_count, etc.}
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (data_type, region_id, skill_id, period_start)
);

CREATE INDEX idx_market_data_region ON market_data(region_id);
CREATE INDEX idx_market_data_skill ON market_data(skill_id);
CREATE INDEX idx_market_data_period ON market_data(period_start, period_end);
```

---

## Views

### Worker Public Profile View

```sql
CREATE VIEW worker_public_profiles AS
SELECT 
    w.id,
    w.public_id,
    w.region_id,
    r.name AS region_name,
    w.years_of_experience,
    w.primary_trade,
    w.availability,
    w.desired_salary_min,
    w.desired_salary_max,
    w.employment_types,
    w.travel_distance_km,
    w.profile_completeness_pct,
    w.reputation_score,
    
    -- Aggregated skills
    (
        SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
                'name', s.name,
                'level', ps.level,
                'years', ps.years_of_experience,
                'is_certified', ps.is_verified
            )
        )
        FROM profile_skills ps
        JOIN skills s ON s.id = ps.skill_id
        WHERE ps.profile_id = w.id AND ps.level IS NOT NULL
    ) AS skills,
    
    -- Aggregated certifications
    (
        SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
                'name', c.name,
                'is_verified', c.verification_status = 'verified',
                'valid_until', c.valid_until
            )
        )
        FROM certifications c
        WHERE c.profile_id = w.id AND c.verification_status != 'revoked'
    ) AS certifications
    
FROM workers w
LEFT JOIN regions r ON r.id = w.region_id
WHERE w.profile_visibility = 'all_verified'
  AND w.deleted_at IS NULL;
```

### Employer Reputation View

```sql
CREATE VIEW employer_reputation AS
SELECT 
    e.id AS employer_id,
    e.company_name,
    e.reputation_score,
    
    -- Offer stats
    COUNT(o.id) AS total_offers,
    COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) AS accepted_offers,
    COUNT(CASE WHEN o.status = 'rejected' THEN 1 END) AS rejected_offers,
    
    -- Acceptance rate
    CASE 
        WHEN COUNT(o.id) > 0 
        THEN ROUND(COUNT(CASE WHEN o.status = 'accepted' THEN 1 END) * 100.0 / COUNT(o.id))
        ELSE 0 
    END AS acceptance_rate,
    
    -- Rating stats
    COALESCE(AVG(r.rating_overall), 0) AS avg_rating,
    COUNT(r.id) AS total_ratings,
    
    -- Response time (from messages)
    COALESCE(
        (SELECT AVG(EXTRACT(EPOCH FROM (m.created_at - o.viewed_at)) / 3600)
         FROM messages m
         JOIN offers o ON o.id = m.offer_id
         WHERE m.sender_id = e.user_id AND o.employer_id = e.id
         LIMIT 100),
        0
    ) AS avg_response_time_hours
    
FROM employers e
LEFT JOIN offers o ON o.employer_id = e.id
LEFT JOIN ratings r ON r.employer_id = e.id AND r.is_published = TRUE
GROUP BY e.id, e.company_name, e.reputation_score;
```

---

## Extensions Required

```sql
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "ltree";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search
```

---

## Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| users | email, role, status | Auth & filtering |
| workers | region, availability, visibility | Search |
| employers | kvk, verification_status | Verification |
| offers | worker_id, status, submitted_at | Offer management |
| messages | recipient_id, is_read | Unread count |
| notifications | user_id, is_read | Unread count |
| analytics_events | event_name, occurred_at | Analytics queries |

---

**Document Owner:** Backend Engineering  
**Last Updated:** June 2026  
**Next Review:** After schema migration to production
