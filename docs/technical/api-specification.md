# OfferMarket - API Specification

**Version:** 1.0  
**Date:** June 2026  
**Style:** REST with JSON  
**Authentication:** JWT (Clerk/Auth0)

---

## API Overview

```
Base URL (Production): https://api.offermarket.nl/v1
Base URL (Staging):    https://api-staging.offermarket.nl/v1
Base URL (Local):      http://localhost:3001/v1
```

### Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

### Response Format

```json
{
  "data": { },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-06-10T10:30:00Z"
  },
  "errors": null
}
```

### Error Format

```json
{
  "data": null,
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-06-10T10:30:00Z"
  },
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "message": "Invalid input data",
      "field": "email",
      "details": { "reason": "invalid_format" }
    }
  ]
}
```

### Rate Limiting

| Tier | Requests/minute | Requests/day |
|------|-----------------|--------------|
| Anonymous | 10 | 100 |
| Worker (free) | 60 | 1,000 |
| Employer (basic) | 120 | 5,000 |
| Employer (enterprise) | 300 | 50,000 |

Headers returned:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1623326400
```

---

## Authentication Endpoints

### POST /auth/register-worker

Register a new worker account.

**Request:**
```json
{
  "email": "marco@example.com",
  "password": "SecurePassword123!",
  "phone": "+31612345678",
  "region": "rotterdam"
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "marco@example.com",
      "role": "worker",
      "email_verified": false,
      "phone_verified": false
    },
    "tokens": {
      "access_token": "eyJhbG...",
      "refresh_token": "eyJhbG...",
      "expires_in": 3600
    }
  }
}
```

---

### POST /auth/register-employer

Register a new employer account.

**Request:**
```json
{
  "email": "tom@company.com",
  "password": "SecurePassword123!",
  "phone": "+31101234567",
  "company": {
    "name": "Leading Electrical BV",
    "kvk_number": "12345678",
    "website": "https://company.com"
  }
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "usr_def456",
      "email": "tom@company.com",
      "role": "employer",
      "email_verified": false,
      "company_verification_status": "pending"
    },
    "tokens": {
      "access_token": "eyJhbG...",
      "refresh_token": "eyJhbG...",
      "expires_in": 3600
    }
  }
}
```

---

### POST /auth/login

**Request:**
```json
{
  "email": "marco@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "data": {
    "user": { ... },
    "tokens": { ... }
  }
}
```

---

### POST /auth/refresh

**Request:**
```json
{
  "refresh_token": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "data": {
    "access_token": "eyJhbG...",
    "expires_in": 3600
  }
}
```

---

### POST /auth/verify-email

**Request:**
```json
{
  "code": "123456"
}
```

---

### POST /auth/verify-phone

**Request:**
```json
{
  "phone": "+31612345678",
  "code": "654321"
}
```

---

### POST /auth/forgot-password

**Request:**
```json
{
  "email": "marco@example.com"
}
```

---

### POST /auth/reset-password

**Request:**
```json
{
  "token": "reset_token_abc",
  "new_password": "NewSecurePassword123!"
}
```

---

## Worker Profile Endpoints

### GET /worker/profile

Get current user's worker profile.

**Response (200):**
```json
{
  "data": {
    "id": "wkr_abc123",
    "public_id": "Profile #8472",
    "user_id": "usr_abc123",
    "region": {
      "id": "reg_rotterdam",
      "name": "Rotterdam Area",
      "city": "Rotterdam"
    },
    "years_of_experience": 12,
    "primary_trade": "Electrician",
    "availability": "immediate",
    "notice_period_days": 0,
    "desired_salary_min": 50000,
    "desired_salary_max": 60000,
    "desired_hourly_rate": null,
    "employment_types": ["permanent"],
    "travel_distance_km": 30,
    "work_schedule_prefs": ["daytime"],
    "industry_prefs": ["industrial", "commercial"],
    "career_priorities": ["work_life_balance", "compensation"],
    "profile_visibility": "all_verified",
    "is_profile_complete": true,
    "profile_completeness_pct": 95,
    "reputation_score": 78,
    "skills": [
      {
        "id": "skl_elec_install",
        "name": "Electrical Installation",
        "level": "expert",
        "years_of_experience": 12,
        "is_verified": false
      },
      {
        "id": "skl_nen3140",
        "name": "NEN 3140",
        "level": "master",
        "years_of_experience": 10,
        "is_verified": true,
        "certification_number": "NEN-2024-123456"
      }
    ],
    "certifications": [
      {
        "id": "cert_abc",
        "name": "NEN 3140 VOP",
        "certification_number": "NEN-2024-123456",
        "issuing_body": "NEN",
        "valid_until": "2028-12-31",
        "verification_status": "verified"
      }
    ],
    "blocked_companies": [],
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-06-10T08:30:00Z"
  }
}
```

---

### PATCH /worker/profile

Update worker profile.

**Request:**
```json
{
  "desired_salary_min": 55000,
  "desired_salary_max": 65000,
  "availability": "1_month",
  "notice_period_days": 30
}
```

**Response (200):**
```json
{
  "data": { ... }
}
```

---

### PUT /worker/profile/skills

Replace all skills.

**Request:**
```json
{
  "skills": [
    {
      "skill_id": "skl_elec_install",
      "level": "expert",
      "years_of_experience": 12
    },
    {
      "skill_id": "skl_plc",
      "level": "advanced",
      "years_of_experience": 8
    }
  ]
}
```

---

### POST /worker/profile/skills

Add a skill.

**Request:**
```json
{
  "skill_id": "skl_solar",
  "level": "intermediate",
  "years_of_experience": 5
}
```

---

### DELETE /worker/profile/skills/:skillId

Remove a skill.

---

### POST /worker/profile/certifications

Add a certification.

**Request:**
```json
{
  "name": "VCA Certification",
  "certification_number": "VCA-2024-789012",
  "issuing_body": "VCA",
  "valid_until": "2027-06-30",
  "document_url": "s3://encrypted/..."
}
```

---

### DELETE /worker/profile/certifications/:certId

Remove a certification.

---

### POST /worker/profile/block-company

Block a company from viewing profile.

**Request:**
```json
{
  "employer_id": "emp_abc123",
  "reason": "Current employer"
}
```

---

### DELETE /worker/profile/block-company/:employerId

Unblock a company.

---

### GET /worker/profile/blocked-companies

List blocked companies.

**Response (200):**
```json
{
  "data": [
    {
      "employer_id": "emp_abc123",
      "company_name": "Current Employer BV",
      "blocked_at": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

### PATCH /worker/profile/visibility

Update profile visibility.

**Request:**
```json
{
  "visibility": "hidden",
  "reason": "Taking a break"
}
```

---

### DELETE /worker/profile

Soft delete worker profile.

**Response (204)**

---

## Employer Endpoints

### GET /employer/profile

Get current user's employer profile.

**Response (200):**
```json
{
  "data": {
    "id": "emp_def456",
    "user_id": "usr_def456",
    "company_name": "Leading Electrical Contractor BV",
    "company_trade_name": "Leading Electrical",
    "kvk_number": "12345678",
    "vat_number": "NL123456789B01",
    "company_size": "50-100",
    "industry": "Electrical Contracting",
    "registered_address": {
      "street": "Westerkade",
      "number": "45",
      "postal_code": "3015BA",
      "city": "Rotterdam",
      "country": "NL"
    },
    "website": "https://leadingelectrical.nl",
    "phone": "+31109876543",
    "billing_email": "finance@leadingelectrical.nl",
    "verification_status": "premium_verified",
    "verified_at": "2026-02-15T14:00:00Z",
    "reputation_score": 82,
    "offer_acceptance_rate": 73,
    "avg_response_time_hours": 4,
    "total_offers_sent": 47,
    "total_hires": 12,
    "subscription": {
      "plan": "professional",
      "status": "active",
      "offers_included": 20,
      "offers_used": 12,
      "current_period_end": "2026-07-01T00:00:00Z"
    },
    "created_at": "2026-01-10T09:00:00Z"
  }
}
```

---

### PATCH /employer/profile

Update employer profile.

**Request:**
```json
{
  "company_trade_name": "New Trade Name",
  "website": "https://newwebsite.com",
  "billing_email": "new@billing.com"
}
```

---

### GET /employer/verification-status

Get detailed verification status.

**Response (200):**
```json
{
  "data": {
    "status": "premium_verified",
    "checks": {
      "kvk_registration": { "status": "verified", "checked_at": "..." },
      "domain_verification": { "status": "verified", "checked_at": "..." },
      "phone_verification": { "status": "verified", "checked_at": "..." },
      "bank_account": { "status": "verified", "checked_at": "..." },
      "ubo_check": { "status": "verified", "checked_at": "..." }
    },
    "pending_checks": [],
    "failed_checks": []
  }
}
```

---

### POST /employer/verification/documents

Upload verification documents.

**Request (multipart/form-data):**
```
documents: [file1.pdf, file2.pdf]
type: "bank_statement"
```

---

## Search Endpoints

### GET /workers/search

Search worker profiles (employer only).

**Query Parameters:**
```
?skills=electrical-installation,nen3140
&region=rotterdam
&radius=25
&experience_min=5
&experience_max=15
&availability=immediate,1_month
&certifications=nop,nen3140
&contract_type=permanent
&salary_min=45000
&salary_max=65000
&language=dutch
&page=1
&limit=20
&sort=relevance,experience,availability
```

**Response (200):**
```json
{
  "data": {
    "profiles": [
      {
        "id": "wkr_abc123",
        "public_id": "Profile #8472",
        "region": {
          "name": "Rotterdam Area",
          "distance_km": 15
        },
        "years_of_experience": 12,
        "primary_trade": "Electrician",
        "availability": "immediate",
        "skills": [
          { "name": "Electrical Installation", "level": "expert" },
          { "name": "NEN 3140", "level": "master", "is_verified": true }
        ],
        "desired_salary_range": { "min": 50000, "max": 60000 },
        "match_score": 94,
        "last_active": "2026-06-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 87,
      "total_pages": 5
    },
    "filters": {
      "applied": { ... },
      "available": { ... }
    }
  }
}
```

---

### GET /workers/:publicId

Get single worker profile detail (anonymous view).

**Response (200):**
```json
{
  "data": {
    "id": "wkr_abc123",
    "public_id": "Profile #8472",
    "region": {
      "name": "Rotterdam Area",
      "distance_from_you_km": 15
    },
    "years_of_experience": 12,
    "primary_trade": "Electrician",
    "availability": "immediate",
    "skills": [
      {
        "name": "Electrical Installation",
        "level": "expert",
        "years": 12
      }
    ],
    "certifications": [
      {
        "name": "NEN 3140 VOP",
        "is_verified": true,
        "valid_until": "2028-12-31"
      }
    ],
    "work_preferences": {
      "employment_types": ["permanent"],
      "travel_distance_km": 30,
      "schedule": ["daytime"]
    },
    "career_priorities": ["work_life_balance", "compensation"],
    "profile_completeness_pct": 95,
    "reputation_score": 78,
    "last_active": "2026-06-10T08:00:00Z"
  }
}
```

---

### POST /workers/:publicId/save

Save a profile to favorites.

---

### DELETE /workers/:publicId/save

Remove from favorites.

---

### GET /employer/saved-profiles

List saved profiles.

---

## Offer Endpoints

### POST /offers

Create and submit a new offer.

**Request:**
```json
{
  "worker_id": "wkr_abc123",
  "job_title": "Senior Electrician",
  "department": "Industrial Projects",
  "job_description": "We're looking for...",
  "compensation": {
    "salary_min": 54000,
    "salary_max": 58000,
    "salary_period": "year",
    "sign_on_bonus": 3000,
    "performance_bonus_pct": 5,
    "overtime_rate": 35,
    "weekend_rate": 42
  },
  "contract": {
    "type": "permanent",
    "hours_per_week": 40,
    "start_date_type": "flexible",
    "probation_months": 2
  },
  "benefits": {
    "vacation_days": 30,
    "holiday_allowance_pct": 8,
    "pension_contribution_pct": 8,
    "training_budget": 1500,
    "company_vehicle": "full_use",
    "vehicle_type": "Van with branding",
    "travel_allowance_type": "per_km",
    "travel_allowance_value": 23,
    "phone_provided": true,
    "tools_provided": true
  },
  "work_arrangement": {
    "schedule_type": ["daytime"],
    "remote_work_pct": 10,
    "travel_required_pct": 80,
    "travel_region": "Zuid-Holland",
    "physical_requirements": "Able to lift 25kg..."
  },
  "requirements": {
    "certifications": ["NEN 3140 VOP", "VCA"],
    "experience_years": 8
  },
  "expires_in_days": 14
}
```

**Response (201):**
```json
{
  "data": {
    "offer": {
      "id": "off_abc123",
      "public_id": "OFF-2026-000542",
      "worker_id": "wkr_abc123",
      "employer_id": "emp_def456",
      "status": "submitted",
      "job_title": "Senior Electrician",
      "submitted_at": "2026-06-10T10:30:00Z",
      "expires_at": "2026-06-24T10:30:00Z",
      "current_version": { ... }
    }
  }
}
```

---

### GET /offers

List offers (context-aware: worker sees received, employer sees sent).

**Query Parameters (worker view):**
```
?status=submitted,viewed,shortlisted
&page=1
&limit=20
```

**Query Parameters (employer view):**
```
?status=submitted,viewed,accepted,rejected
&worker_id=wkr_abc123
&page=1
&limit=20
```

**Response (worker view):**
```json
{
  "data": {
    "offers": [
      {
        "id": "off_abc123",
        "public_id": "OFF-2026-000542",
        "employer": {
          "id": "emp_def456",
          "company_name": "Leading Electrical Contractor BV",
          "verification_status": "premium_verified",
          "reputation_score": 82
        },
        "job_title": "Senior Electrician",
        "status": "viewed",
        "compensation_summary": {
          "salary_range": { "min": 54000, "max": 58000 },
          "sign_on_bonus": 3000,
          "estimated_total": { "min": 65000, "max": 72000 }
        },
        "benefits_summary": {
          "vacation_days": 30,
          "company_vehicle": "full_use",
          "pension_pct": 8
        },
        "location": {
          "city": "Rotterdam",
          "distance_km": 15
        },
        "submitted_at": "2026-06-10T10:30:00Z",
        "expires_at": "2026-06-24T10:30:00Z",
        "viewed_at": "2026-06-10T15:42:00Z"
      }
    ],
    "pagination": { ... },
    "summary": {
      "total_offers": 5,
      "pending": 3,
      "shortlisted": 1,
      "accepted": 1
    }
  }
}
```

---

### GET /offers/:offerId

Get single offer details.

**Response (200):**
```json
{
  "data": {
    "offer": {
      "id": "off_abc123",
      "public_id": "OFF-2026-000542",
      "worker_id": "wkr_abc123",
      "employer_id": "emp_def456",
      "employer": {
        "company_name": "Leading Electrical Contractor BV",
        "verification_status": "premium_verified",
        "reputation_score": 82,
        "avg_rating": 4.2,
        "total_ratings": 34
      },
      "job_title": "Senior Electrician",
      "department": "Industrial Projects",
      "job_description": "We're looking for...",
      "status": "viewed",
      "current_version": {
        "version": 1,
        "compensation": {
          "salary_min": 54000,
          "salary_max": 58000,
          "salary_period": "year",
          "hourly_rate": 31.50,
          "sign_on_bonus": 3000,
          "performance_bonus_pct": 5,
          "overtime_rate": 35,
          "weekend_rate": 42
        },
        "contract": {
          "type": "permanent",
          "hours_per_week": 40,
          "start_date_type": "flexible",
          "probation_months": 2
        },
        "benefits": {
          "vacation_days": 30,
          "holiday_allowance_pct": 8,
          "pension_contribution_pct": 8,
          "training_budget": 1500,
          "company_vehicle": "full_use",
          "vehicle_type": "Van with branding",
          "vehicle_value_est": 6000,
          "travel_allowance_type": "per_km",
          "travel_allowance_value": 23,
          "phone_provided": true,
          "tools_provided": true
        },
        "work_arrangement": {
          "schedule_type": ["daytime"],
          "on_call_details": null,
          "remote_work_pct": 10,
          "travel_required_pct": 80,
          "travel_region": "Zuid-Holland",
          "physical_requirements": "Able to lift 25kg..."
        },
        "requirements": {
          "certifications": ["NEN 3140 VOP", "VCA"],
          "experience_years": 8
        }
      },
      "version_history": [],
      "timeline": {
        "submitted_at": "2026-06-10T10:30:00Z",
        "viewed_at": "2026-06-10T15:42:00Z",
        "expires_at": "2026-06-24T10:30:00Z"
      },
      "actions_available": ["shortlist", "accept", "reject", "counter"],
      "created_at": "2026-06-10T10:30:00Z"
    }
  }
}
```

---

### PATCH /offers/:offerId

Update offer (only if not viewed).

**Request:**
```json
{
  "compensation": {
    "salary_min": 56000,
    "salary_max": 60000
  }
}
```

**Response (200):**
```json
{
  "data": {
    "offer": { ... },
    "version_created": 2
  }
}
```

---

### POST /offers/:offerId/shortlist

Shortlist an offer (worker only).

**Response (200):**
```json
{
  "data": {
    "offer": {
      "id": "off_abc123",
      "status": "shortlisted",
      "shortlisted_at": "2026-06-10T16:00:00Z"
    }
  }
}
```

---

### POST /offers/:offerId/accept

Accept an offer (worker only).

**Response (200):**
```json
{
  "data": {
    "offer": {
      "id": "off_abc123",
      "status": "accepted",
      "accepted_at": "2026-06-10T16:05:00Z",
      "identity_revealed": true,
      "conversation_started": true,
      "conversation_id": "conv_abc123"
    },
    "next_steps": {
      "message_employer": "/conversations/conv_abc123",
      "invoice_generated": true,
      "invoice_id": "inv_2026-000542"
    }
  }
}
```

---

### POST /offers/:offerId/reject

Reject an offer (worker only).

**Request:**
```json
{
  "reason": "accepted_another_offer",
  "feedback": "The other offer had better work-life balance."
}
```

**Response (200):**
```json
{
  "data": {
    "offer": {
      "status": "rejected",
      "rejected_at": "2026-06-10T16:10:00Z"
    }
  }
}
```

---

### POST /offers/:offerId/counter

Submit a counter-offer (worker only).

**Request:**
```json
{
  "counter": {
    "salary_min": 58000,
    "salary_max": 62000,
    "sign_on_bonus": 5000,
    "vacation_days": 32
  },
  "message": "I'm very interested but was hoping for..."
}
```

**Response (201):**
```json
{
  "data": {
    "counter_offer": {
      "id": "coff_abc123",
      "original_offer_id": "off_abc123",
      "status": "pending",
      "created_at": "2026-06-10T16:15:00Z"
    }
  }
}
```

---

### POST /offers/:offerId/withdraw

Withdraw an offer (employer only).

**Request:**
```json
{
  "reason": "position_filled",
  "message": "We've filled this position internally."
}
```

---

### POST /offers/:offerId/expire

Manually expire an offer (employer only).

---

### GET /offers/stats

Get offer statistics.

**Response (worker):**
```json
{
  "data": {
    "total_received": 12,
    "by_status": {
      "submitted": 3,
      "viewed": 5,
      "shortlisted": 2,
      "accepted": 1,
      "rejected": 1
    },
    "avg_salary_offered": 54000,
    "top_skills_requested": ["Electrical Installation", "NEN 3140"],
    "response_rate": 83,
    "avg_time_to_response_hours": 24
  }
}
```

**Response (employer):**
```json
{
  "data": {
    "total_sent": 47,
    "by_status": {
      "submitted": 8,
      "viewed": 25,
      "shortlisted": 10,
      "accepted": 3,
      "rejected": 1,
      "expired": 0
    },
    "acceptance_rate": 25,
    "avg_time_to_accept_days": 5,
    "cost_per_introduction": 499,
    "total_introduction_fees": 1497
  }
}
```

---

## Conversation/Messaging Endpoints

### GET /conversations

List conversations.

**Query Parameters:**
```
?type=all,inbox,archived
&page=1
&limit=20
```

**Response (200):**
```json
{
  "data": {
    "conversations": [
      {
        "id": "conv_abc123",
        "offer_id": "off_abc123",
        "other_party": {
          "id": "emp_def456",
          "name": "Leading Electrical Contractor BV",
          "type": "employer"
        },
        "last_message": {
          "content": "Hi Marco, congratulations on accepting our offer!",
          "sender": "other",
          "created_at": "2026-06-10T10:23:00Z",
          "is_read": false
        },
        "unread_count": 2,
        "offer_status": "accepted",
        "updated_at": "2026-06-10T10:23:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### GET /conversations/:conversationId

Get conversation with messages.

**Query Parameters:**
```
?before=2026-06-10T10:00:00Z
?limit=50
```

**Response (200):**
```json
{
  "data": {
    "conversation": {
      "id": "conv_abc123",
      "offer_id": "off_abc123",
      "offer_summary": {
        "job_title": "Senior Electrician",
        "status": "accepted"
      },
      "other_party": {
        "id": "emp_def456",
        "name": "Lisa (HR Manager)",
        "type": "employer"
      },
      "messages": [
        {
          "id": "msg_001",
          "sender": {
            "id": "usr_def456",
            "name": "Lisa",
            "type": "employer"
          },
          "content": "Hi Marco! Congratulations on accepting our offer...",
          "message_type": "text",
          "attachments": [],
          "is_read": true,
          "created_at": "2026-06-10T10:23:00Z"
        },
        {
          "id": "msg_002",
          "sender": {
            "id": "usr_abc123",
            "name": "Marco",
            "type": "worker"
          },
          "content": "Hi Lisa, thanks for reaching out!",
          "message_type": "text",
          "is_read": true,
          "created_at": "2026-06-10T11:45:00Z"
        }
      ],
      "has_more": false
    }
  }
}
```

---

### POST /conversations/:conversationId/messages

Send a message.

**Request:**
```json
{
  "content": "Hi Lisa, yes Friday at 2 PM works for me!",
  "attachments": []
}
```

**Response (201):**
```json
{
  "data": {
    "message": {
      "id": "msg_003",
      "content": "Hi Lisa, yes Friday at 2 PM works for me!",
      "created_at": "2026-06-10T12:30:00Z"
    }
  }
}
```

---

### POST /conversations/:conversationId/read

Mark conversation as read.

---

### POST /conversations/:conversationId/archive

Archive a conversation.

---

### POST /conversations/:conversationId/unarchive

Unarchive a conversation.

---

## Ratings & Reviews Endpoints

### POST /ratings

Submit a rating/review (after hire).

**Request:**
```json
{
  "offer_id": "off_abc123",
  "ratings": {
    "overall": 5,
    "interview_experience": 4,
    "transparency": 5,
    "communication": 5,
    "offer_accuracy": 5,
    "work_life_balance": 4
  },
  "would_work_again": true,
  "review_title": "Great experience!",
  "review_text": "Professional team, transparent process..."
}
```

**Response (201):**
```json
{
  "data": {
    "rating": {
      "id": "rat_abc123",
      "is_published": false,
      "publish_note": "Review will be published after 14 days or employment verification"
    }
  }
}
```

---

### GET /employers/:employerId/ratings

Get employer ratings.

**Response (200):**
```json
{
  "data": {
    "employer": {
      "id": "emp_def456",
      "company_name": "Leading Electrical Contractor BV"
    },
    "summary": {
      "overall_rating": 4.2,
      "total_ratings": 34,
      "rating_distribution": {
        "5": 18,
        "4": 10,
        "3": 4,
        "2": 1,
        "1": 1
      },
      "category_averages": {
        "interview_experience": 4.0,
        "transparency": 4.3,
        "communication": 4.1,
        "offer_accuracy": 4.5,
        "work_life_balance": 4.2
      },
      "would_work_again_pct": 82
    },
    "reviews": [
      {
        "id": "rat_xyz789",
        "rating_overall": 5,
        "review_title": "Great employer",
        "review_text": "...",
        "would_work_again": true,
        "is_verified_hire": true,
        "created_at": "2026-05-15T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## Analytics Endpoints

### GET /analytics/worker

Worker analytics dashboard.

**Response (200):**
```json
{
  "data": {
    "profile_views": {
      "today": 5,
      "this_week": 24,
      "this_month": 87,
      "trend": "up",
      "history": [
        { "date": "2026-06-03", "count": 10 },
        { "date": "2026-06-04", "count": 12 },
        ...
      ]
    },
    "offers": {
      "total_received": 12,
      "this_week": 3,
      "this_month": 8,
      "trend": "up"
    },
    "market_value": {
      "estimated_range": { "min": 52000, "max": 62000 },
      "percentile": 75,
      "trend": "stable",
      "vs_last_month": { "min_change": 2000, "max_change": 3000 }
    },
    "demand_score": {
      "score": 78,
      "max": 100,
      "description": "High demand",
      "factors": [
        "NEN 3140 certification in high demand",
        "10+ years experience above average",
        "Rotterdam area has many openings"
      ]
    },
    "skill_demand": [
      { "skill": "Electrical Installation", "requests": 8 },
      { "skill": "NEN 3140", "requests": 10 },
      { "skill": "PLC Programming", "requests": 5 }
    ],
    "comparison": {
      "views_vs_similar": "above_average",
      "offers_vs_similar": "above_average"
    }
  }
}
```

---

### GET /analytics/employer

Employer analytics dashboard.

**Response (200):**
```json
{
  "data": {
    "offers": {
      "total_sent": 47,
      "this_week": 5,
      "this_month": 18,
      "by_status": { ... }
    },
    "performance": {
      "acceptance_rate": 25,
      "vs_market_average": "+5%",
      "avg_time_to_accept_days": 5,
      "offer_view_rate": 78,
      "shortlist_rate": 32
    },
    "spend": {
      "this_month": 1497,
      "total": 5988,
      "currency": "EUR"
    },
    "funnel": {
      "profiles_viewed": 150,
      "offers_sent": 47,
      "offers_viewed": 37,
      "offers_shortlisted": 15,
      "offers_accepted": 12,
      "hires_completed": 9
    },
    "competitive_position": {
      "salary_competitiveness": "above_market",
      "benefits_competitiveness": "market_average",
      "response_time_rank": "fast"
    },
    "talent_pool": {
      "matching_profiles": 87,
      "new_this_week": 12,
      "avg_salary_expectation": 54000
    }
  }
}
```

---

### GET /analytics/market

Market intelligence (premium feature).

**Query Parameters:**
```
?region=rotterdam
&skill=electrical-installation
&period=3_months
```

**Response (200):**
```json
{
  "data": {
    "salary_benchmarks": {
      "electrician": {
        "p25": 45000,
        "p50": 52000,
        "p75": 60000,
        "p90": 70000,
        "sample_size": 234
      },
      "senior_electrician": {
        "p25": 55000,
        "p50": 62000,
        "p75": 72000,
        "p90": 85000,
        "sample_size": 156
      }
    },
    "demand_trends": {
      "electricians": {
        "current_openings": 847,
        "change_vs_last_month": "+12%",
        "trend": "increasing"
      }
    },
    "regional_shortages": [
      {
        "region": "Rotterdam",
        "skill": "Electrical Installation",
        "shortage_score": 85,
        "severity": "high"
      }
    ],
    "skill_premiums": {
      "PLC Programming": "+€5,000/year",
      "Solar Installation": "+€3,500/year",
      "NEN 3140": "+€4,000/year"
    },
    "hiring_velocity": {
      "avg_days_to_hire": 21,
      "fastest_sector": "Industrial",
      "slowest_sector": "Residential"
    }
  }
}
```

---

## Admin Endpoints

### GET /admin/dashboard

Admin dashboard overview.

**Response (200):**
```json
{
  "data": {
    "users": {
      "total_workers": 1247,
      "total_employers": 342,
      "new_this_week": 89
    },
    "marketplace": {
      "offers_sent": 234,
      "matches_this_week": 67,
      "introductions_this_week": 12
    },
    "revenue": {
      "mtd": 47500,
      "currency": "EUR"
    },
    "queue": {
      "verifications_pending": 8,
      "reports_pending": 3,
      "fraud_alerts": 2
    }
  }
}
```

---

### GET /admin/verifications

List pending verifications.

**Query Parameters:**
```
?type=employer,worker,certification
&status=pending,in_progress
&page=1
&limit=20
```

---

### POST /admin/verifications/:id/approve

Approve a verification.

**Request:**
```json
{
  "notes": "All checks passed"
}
```

---

### POST /admin/verifications/:id/reject

Reject a verification.

**Request:**
```json
{
  "reason": "Invalid KvK number"
}
```

---

### GET /admin/reports

List reports.

---

### POST /admin/reports/:id/resolve

Resolve a report.

---

### GET /admin/users

Search and list users.

---

### GET /admin/users/:userId

Get user details with full audit trail.

---

### POST /admin/users/:userId/suspend

Suspend a user.

**Request:**
```json
{
  "reason": "Fraudulent activity",
  "message": "Your account has been suspended due to..."
}
```

---

### POST /admin/users/:userId/unsuspend

Unsuspend a user.

---

### GET /admin/offers

List all offers (for moderation).

---

### GET /admin/audit-logs

Query audit logs.

**Query Parameters:**
```
?user_id=usr_abc
?entity_type=offers
?entity_id=off_123
?action=create,update
?from=2026-06-01
?to=2026-06-10
```

---

## Webhooks

### Webhook Events

Employers can register webhooks for events:

```json
{
  "event_types": [
    "offer.viewed",
    "offer.accepted",
    "offer.rejected",
    "offer.expired",
    "message.received",
    "invoice.paid"
  ],
  "url": "https://company.com/webhooks/offermarket",
  "secret": "whsec_..."
}
```

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "offer.accepted",
  "created_at": "2026-06-10T16:05:00Z",
  "data": {
    "offer": {
      "id": "off_abc123",
      "public_id": "OFF-2026-000542",
      "worker_id": "wkr_abc123",
      "status": "accepted"
    }
  },
  "signature": "t=1623326400,v1=abc123..."
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | Token expired or invalid |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMITED` | 429 | Too many requests |
| `OFFER_NOT_EDITABLE` | 422 | Offer already viewed |
| `OFFER_EXPIRED` | 422 | Offer has expired |
| `ALREADY_BLOCKED` | 409 | Company already blocked |
| `VERIFICATION_PENDING` | 403 | Awaiting verification |
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits |
| `SUBSCRIPTION_REQUIRED` | 402 | Feature requires subscription |

---

**Document Owner:** Backend Engineering  
**Last Updated:** June 2026  
**Next Review:** After API gateway implementation
