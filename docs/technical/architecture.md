# OfferMarket - Technical Architecture

**Version:** 1.0  
**Date:** June 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OFFERMARKET ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │   Cloudflare │
                                    │     CDN      │
                                    └──────┬───────┘
                                           │
                                    ┌──────▼───────┐
                                    │   Load       │
                                    │   Balancer   │
                                    └──────┬───────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
     ┌────────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
     │   Next.js App   │          │   Next.js App   │          │   Next.js App   │
     │   (Frontend)    │          │   (Frontend)    │          │   (Frontend)    │
     │   :3000         │          │   :3000         │          │   :3000         │
     └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
              │                            │                            │
              └────────────────────────────┼────────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
     ┌────────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
     │   NestJS API    │          │   NestJS API    │          │   NestJS API    │
     │   (Backend)     │          │   (Backend)     │          │   (Backend)     │
     │   :3001         │          │   :3001         │          │   :3001         │
     └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
              │                            │                            │
              └────────────────────────────┼────────────────────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
     ┌────────▼────────┐          ┌────────▼────────┐          ┌────────▼────────┐
     │   PostgreSQL    │          │   Redis         │          │  Elasticsearch  │
     │   (Primary)     │          │   (Cache)       │          │  (Search)       │
     │   :5432         │          │   :6379         │          │   :9200         │
     └─────────────────┘          └─────────────────┘          └─────────────────┘
              │
     ┌────────▼────────┐
     │   PostgreSQL    │
     │   (Replica)     │
     │   :5433         │
     └─────────────────┘
```

---

## Tech Stack

### Frontend

| Technology | Purpose | Why |
|------------|---------|-----|
| **Next.js 14** | React framework | SSR for SEO, API routes, excellent DX |
| **TypeScript** | Type safety | Catches bugs early, better DX |
| **Tailwind CSS** | Styling | Rapid development, consistent design |
| **shadcn/ui** | Component library | Customizable, accessible, no vendor lock-in |
| **Zustand** | State management | Simple, lightweight, works well with Next.js |
| **React Query** | Data fetching | Caching, background refetch, optimistic updates |
| **React Hook Form** | Forms | Performance, validation integration |
| **Zod** | Validation | Schema validation, type inference |

### Backend

| Technology | Purpose | Why |
|------------|---------|-----|
| **NestJS** | Node.js framework | Modular, TypeScript-first, enterprise-ready |
| **TypeScript** | Type safety | Shared types with frontend |
| **Prisma** | ORM | Type-safe queries, migrations, excellent DX |
| **PostgreSQL** | Database | Relational data, JSONB, full-text search |
| **Redis** | Cache/Sessions | Fast lookups, rate limiting, queues |
| **Elasticsearch** | Search | Full-text search, facets, relevance scoring |
| **BullMQ** | Job queues | Background jobs, scheduled tasks |
| **Passport.js** | Auth strategy | Flexible, many providers |

### Infrastructure

| Technology | Purpose | Why |
|------------|---------|-----|
| **AWS** | Cloud provider | Comprehensive services, global reach |
| **ECS/Fargate** | Container orchestration | Serverless containers, auto-scaling |
| **RDS** | Managed PostgreSQL | Backups, patches, read replicas |
| **ElastiCache** | Managed Redis | No ops overhead |
| **CloudFront** | CDN | Global edge caching |
| **S3** | File storage | Encrypted document storage |
| **SES** | Email | Transactional emails |
| **CloudWatch** | Monitoring | Logs, metrics, alarms |

### Third-Party Services

| Service | Purpose | Why |
|---------|---------|-----|
| **Clerk** | Authentication | Pre-built UI, MFA, session management |
| **Stripe** | Payments | Subscriptions, invoicing, global |
| **PostHog** | Analytics | Product analytics, feature flags |
| **Sentry** | Error tracking | Real-time error monitoring |
| **Twilio** | SMS | Phone verification, notifications |

---

## Project Structure

```
OfferMarket/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App router pages
│   │   │   ├── (auth)/         # Auth pages (login, register)
│   │   │   ├── (dashboard)/    # Dashboard layouts
│   │   │   │   ├── worker/     # Worker dashboard
│   │   │   │   └── employer/   # Employer dashboard
│   │   │   ├── api/            # API routes (BFF)
│   │   │   └── public/         # Public pages
│   │   ├── components/
│   │   │   ├── ui/             # Base UI components
│   │   │   ├── forms/          # Form components
│   │   │   ├── layouts/        # Layout components
│   │   │   └── features/       # Feature-specific components
│   │   ├── lib/
│   │   │   ├── api/            # API client
│   │   │   ├── utils/          # Utilities
│   │   │   └── validations/    # Zod schemas
│   │   └── hooks/              # React hooks
│   │
│   └── api/                    # NestJS backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/       # Authentication
│       │   │   ├── users/      # User management
│       │   │   ├── workers/    # Worker profiles
│       │   │   ├── employers/  # Employer profiles
│       │   │   ├── offers/     # Offer management
│       │   │   ├── search/     # Search functionality
│       │   │   ├── messages/   # Messaging
│       │   │   ├── ratings/    # Ratings & reviews
│       │   │   ├── analytics/  # Analytics
│       │   │   ├── billing/    # Stripe integration
│       │   │   ├── notifications/ # Email, push, SMS
│       │   │   └── admin/      # Admin operations
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   └── pipes/
│       │   └── database/
│       │       ├── migrations/
│       │       └── seeds/
│       └── test/
│
├── packages/
│   ├── shared/                 # Shared code
│   │   ├── types/              # TypeScript types
│   │   ├── constants/          # Shared constants
│   │   └── utils/              # Shared utilities
│   │
│   └── ui/                     # Shared UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       └── ...
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.api
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── k8s/
│       ├── deployment.yaml
│       └── service.yaml
│
└── scripts/
    ├── setup.sh
    ├── migrate.sh
    └── seed.sh
```

---

## Module Architecture

### Authentication Module

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Next.js   │────────>│   Clerk     │────────>│   NestJS    │
│   Frontend  │         │   (Auth)    │         │   Backend   │
└─────────────┘         └─────────────┘         └─────────────┘
       │                      │                       │
       │  1. Login/Register   │                       │
       │─────────────────────>│                       │
       │                      │                       │
       │  2. JWT Token        │                       │
       │<─────────────────────│                       │
       │                      │                       │
       │  3. API Request + JWT│                       │
       │──────────────────────────────────────────────>│
       │                      │                       │
       │                      │  4. Verify JWT        │
       │                      │──────────────────────>│
       │                      │                       │
       │  5. Protected Data   │                       │
       │<──────────────────────────────────────────────│
       │                      │                       │
```

**Implementation:**
```typescript
// apps/web/lib/auth.ts
import { getAuth } from '@clerk/nextjs/server';

export function getUserFromRequest(req: Request) {
  const { userId, sessionId } = getAuth(req);
  return { userId, sessionId };
}

// apps/api/src/modules/auth/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ClerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly clerkClient: ClerkClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];
    
    if (!token) return false;
    
    const user = await this.clerkClient.users.getUserByToken(token);
    request.user = user;
    return true;
  }
}
```

---

### Worker Profile Module

```typescript
// apps/api/src/modules/workers/workers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      include: {
        skills: {
          include: { skill: true }
        },
        certifications: true,
        region: true
      }
    });

    if (!worker) throw new NotFoundException('Worker profile not found');
    return worker;
  }

  async updateProfile(userId: string, data: UpdateWorkerDto) {
    const completeness = this.calculateCompleteness(data);
    
    return this.prisma.worker.update({
      where: { userId },
      data: {
        ...data,
        is_profile_complete: completeness >= 90,
        profile_completeness_pct: completeness
      }
    });
  }

  private calculateCompleteness(data: any): number {
    let score = 0;
    if (data.skills?.length >= 5) score += 25;
    if (data.certifications?.length >= 2) score += 20;
    if (data.years_of_experience) score += 15;
    if (data.desired_salary_min) score += 10;
    if (data.availability) score += 10;
    if (data.work_schedule_prefs?.length) score += 10;
    if (data.career_priorities?.length) score += 10;
    return Math.min(score, 100);
  }

  async getPublicProfile(publicId: string, viewerUserId?: string) {
    // Return anonymized profile
    const worker = await this.prisma.worker.findUnique({
      where: { public_id: publicId },
      include: {
        skills: {
          where: { level: { not: null } },
          include: { skill: true }
        },
        certifications: {
          where: { verification_status: 'verified' }
        }
      }
    });

    // Remove sensitive fields
    const { user_id, postal_code, ...publicProfile } = worker;
    return publicProfile;
  }
}
```

---

### Offer Module

```typescript
// apps/api/src/modules/offers/offers.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OfferStatus } from '@prisma/client';

@Injectable()
export class OffersService {
  constructor(private prisma: PrismaService) {}

  async createOffer(employerId: string, data: CreateOfferDto) {
    // Check employer has credits/subscription
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: { subscription: true }
    });

    if (!this.canMakeOffer(employer)) {
      throw new BadRequestException('Insufficient credits or subscription limit reached');
    }

    // Check worker hasn't blocked this employer
    const blocked = await this.prisma.blockedCompany.findFirst({
      where: {
        worker_id: data.worker_id,
        employer_id: employerId
      }
    });

    if (blocked) {
      throw new BadRequestException('Cannot make offer to this worker');
    }

    // Create offer with version
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.create({
        data: {
          worker_id: data.worker_id,
          employer_id: employerId,
          public_id: await this.generatePublicId(tx),
          job_title: data.job_title,
          department: data.department,
          job_description: data.job_description,
          status: 'submitted',
          expires_at: new Date(Date.now() + data.expires_in_days * 24 * 60 * 60 * 1000),
          submitted_at: new Date(),
          offer_versions: {
            create: {
              version: 1,
              salary_min: data.compensation.salary_min,
              salary_max: data.compensation.salary_max,
              salary_period: data.compensation.salary_period,
              hourly_rate: data.compensation.hourly_rate,
              sign_on_bonus: data.compensation.sign_on_bonus,
              performance_bonus_pct: data.compensation.performance_bonus_pct,
              overtime_rate: data.compensation.overtime_rate,
              contract_type: data.contract.type,
              hours_per_week: data.contract.hours_per_week,
              start_date_type: data.contract.start_date_type,
              start_date: data.contract.start_date,
              probation_months: data.contract.probation_months,
              vacation_days: data.benefits.vacation_days,
              holiday_allowance_pct: data.benefits.holiday_allowance_pct,
              pension_contribution_pct: data.benefits.pension_contribution_pct,
              training_budget: data.benefits.training_budget,
              company_vehicle: data.benefits.company_vehicle,
              vehicle_type: data.benefits.vehicle_type,
              travel_allowance_type: data.benefits.travel_allowance_type,
              travel_allowance_value: data.benefits.travel_allowance_value,
              phone_provided: data.benefits.phone_provided,
              tools_provided: data.benefits.tools_provided,
              schedule_type: data.work_arrangement.schedule_type,
              remote_work_pct: data.work_arrangement.remote_work_pct,
              travel_required_pct: data.work_arrangement.travel_required_pct,
              required_certifications: data.requirements.certifications,
              required_experience_years: data.requirements.experience_years
            }
          }
        },
        include: { offer_versions: true }
      });

      // Send notification to worker
      await this.prisma.notification.create({
        data: {
          user_id: data.worker_id,
          notification_type: 'offer_received',
          category: 'offer',
          title: 'New offer received!',
          body: `${employer.company_name} has sent you an offer for ${data.job_title}`,
          action_url: `/offers/${offer.id}`,
          channel_email: true,
          channel_push: true
        }
      });

      return offer;
    });
  }

  async acceptOffer(offerId: string, workerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: {
          worker: { include: { user: true } },
          employer: { include: { user: true } }
        }
      });

      if (offer.worker_id !== workerId) {
        throw new BadRequestException('Not authorized');
      }

      if (offer.status !== 'submitted' && offer.status !== 'shortlisted') {
        throw new BadRequestException('Offer cannot be accepted');
      }

      // Update offer status
      await tx.offer.update({
        where: { id: offerId },
        data: {
          status: 'accepted',
          accepted_at: new Date()
        }
      });

      // Create conversation
      const conversation = await tx.conversation.create({
        data: {
          offer_id: offerId,
          participant_1_id: offer.worker.user_id,
          participant_2_id: offer.employer.user_id
        }
      });

      // Create invoice for introduction fee
      const invoice = await this.createIntroductionInvoice(tx, offer.employer_id, offer);

      return { offer, conversation, invoice };
    });
  }

  private async createIntroductionInvoice(tx, employerId: string, offer: any) {
    const invoiceNumber = await this.generateInvoiceNumber(tx);
    
    return tx.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        employer_id: employerId,
        offer_id: offer.id,
        subtotal: 49900, // €499 in cents
        vat_rate: 21,
        vat_amount: 10479,
        total: 60379,
        status: 'sent',
        due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    });
  }
}
```

---

### Search Module

```typescript
// apps/api/src/modules/search/search.service.ts
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private es: ElasticsearchService) {}

  async indexWorkerProfile(worker: any) {
    await this.es.index({
      index: 'worker_profiles',
      id: worker.id,
      body: {
        public_id: worker.public_id,
        region: worker.region.name,
        region_coords: worker.region.coords,
        years_of_experience: worker.years_of_experience,
        primary_trade: worker.primary_trade,
        availability: worker.availability,
        skills: worker.skills.map(s => ({
          name: s.skill.name,
          level: s.level,
          category: s.skill.category
        })),
        certifications: worker.certifications.map(c => c.name),
        desired_salary_min: worker.desired_salary_min,
        desired_salary_max: worker.desired_salary_max,
        visibility: worker.profile_visibility,
        last_active: worker.updated_at,
        indexed_at: new Date()
      }
    });
  }

  async searchWorkers(filters: SearchFilters) {
    const query: any = {
      bool: {
        must: [],
        filter: [
          { term: { visibility: 'all_verified' } }
        ]
      }
    };

    // Skills filter
    if (filters.skills?.length) {
      query.bool.must.push({
        nested: {
          path: 'skills',
          query: {
            bool: {
              should: filters.skills.map(skill => ({
                match: { 'skills.name': skill }
              }))
            }
          }
        }
      });
    }

    // Region filter with geo
    if (filters.region && filters.radius) {
      query.bool.filter.push({
        geo_distance: {
          distance: `${filters.radius}km`,
          'region_coords': filters.region_coords
        }
      });
    }

    // Availability filter
    if (filters.availability?.length) {
      query.bool.filter.push({
        terms: { availability: filters.availability }
      });
    }

    // Experience filter
    if (filters.experience_min || filters.experience_max) {
      query.bool.filter.push({
        range: {
          years_of_experience: {
            ...(filters.experience_min && { gte: filters.experience_min }),
            ...(filters.experience_max && { lte: filters.experience_max })
          }
        }
      });
    }

    const response = await this.es.search({
      index: 'worker_profiles',
      body: {
        query,
        sort: [
          { last_active: 'desc' },
          { _score: 'desc' }
        ],
        from: (filters.page - 1) * filters.limit,
        size: filters.limit,
        aggs: {
          skills: {
            nested: { path: 'skills' },
            aggs: {
              skills_agg: { terms: { field: 'skills.name' } }
            }
          },
          regions: { terms: { field: 'region' } },
          availability: { terms: { field: 'availability' } }
        }
      }
    });

    return {
      profiles: response.hits.hits.map(hit => ({ ...hit._source, _score: hit._score })),
      total: response.hits.total.value,
      aggregations: response.aggregations
    };
  }
}
```

---

## Data Flow Diagrams

### Worker Receiving Offer Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKER RECEIVES OFFER FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

Employer                    API                    Worker                Services
   │                        │                        │                      │
   │  POST /offers          │                        │                      │
   │───────────────────────>│                        │                      │
   │                        │  Check credits         │                      │
   │                        │───────────────────────>│                      │
   │                        │<───────────────────────│                      │
   │                        │                        │                      │
   │                        │  Check blocked list    │                      │
   │                        │───────────────────────>│                      │
   │                        │<───────────────────────│                      │
   │                        │                        │                      │
   │                        │  Create offer (DB)     │                      │
   │                        │───────────────────────>│                      │
   │                        │<───────────────────────│                      │
   │                        │                        │                      │
   │                        │  Index in Elasticsearch│                      │
   │                        │────────────────────────>│                      │
   │                        │                        │                      │
   │                        │  Create notification   │                      │
   │                        │─────────────────────────────────────────────>│
   │                        │                        │                      │
   │  201 Created           │                        │  Push notification   │
   │<───────────────────────│                        │<────────────────────│
   │                        │                        │                      │
   │                        │                        │  Email notification  │
   │                        │                        │<────────────────────│
   │                        │                        │                      │
   │                        │                        │  GET /offers         │
   │                        │                        │────────────────────>│
   │                        │                        │                        │
   │                        │                        │  Offer list          │
   │                        │                        │<────────────────────│
   │                        │                        │                      │
```

---

### Offer Acceptance Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OFFER ACCEPTANCE FLOW                                │
└─────────────────────────────────────────────────────────────────────────┘

Worker                  API                    Employer               Services
   │                     │                        │                       │
   │  POST /offers/:id/accept                    │                       │
   │────────────────────>│                        │                       │
   │                     │  Verify ownership      │                       │
   │                     │  Check status          │                       │
   │                     │                        │                       │
   │                     │  Update offer status  │                       │
   │                     │  (accepted_at)        │                       │
   │                     │───────────────────────>│                       │
   │                     │                        │                       │
   │                     │  Create conversation  │                       │
   │                     │───────────────────────>│                       │
   │                     │                        │                       │
   │                     │  Create invoice       │                       │
   │                     │──────────────────────────────────────────────>│
   │                     │                        │                       │
   │                     │  Send notification    │                       │
   │                     │──────────────────────────────────────────────>│
   │                     │                        │                       │
   │  Identity revealed  │                        │  Notification         │
   │<────────────────────│                        │<──────────────────────│
   │                     │                        │                       │
   │                     │                        │  GET /conversations   │
   │                     │                        │──────────────────────>│
   │                     │                        │                       │
   │  GET /conversations │                        │                       │
   │────────────────────>│                        │                       │
   │                     │                        │                       │
   │  Conversation data  │                        │                       │
   │<────────────────────│                        │                       │
   │                     │                        │                       │
   │  Message            │                        │                       │
   │────────────────────>│                        │                       │
   │                     │  Store message        │                       │
   │                     │───────────────────────>│                       │
   │                     │                        │                       │
   │                     │  Push to employer     │                       │
   │                     │──────────────────────────────────────────────>│
   │                     │                        │                       │
   │                     │                        │  Message received     │
   │                     │                        │<──────────────────────│
   │                     │                        │                       │
```

---

## Security Architecture

### Data Encryption

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA ENCRYPTION LAYERS                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ In Transit                                                      │
│ • TLS 1.3 for all HTTP traffic                                 │
│ • Certificate pinning for mobile (future)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ At Rest                                                         │
│ • PostgreSQL TDE (Transparent Data Encryption)                 │
│ • S3 SSE-KMS for documents                                     │
│ • Encrypted backups                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Application Level                                               │
│ • PII fields encrypted with AES-256                            │
│ • Encryption keys in AWS KMS                                   │
│ • Field-level encryption for:                                  │
│   - Postal codes                                               │
│   - Phone numbers                                              │
│   - ID document URLs                                           │
│   - Bank account numbers                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Access Control

```typescript
// apps/api/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// apps/api/src/modules/offers/offers.controller.ts
@Controller('offers')
export class OffersController {
  @Get()
  @Roles('worker', 'employer')
  async listOffers(@User() user: User) {
    if (user.role === 'worker') {
      return this.offersService.findReceived(user.id);
    }
    return this.offersService.findSent(user.employerId);
  }

  @Post()
  @Roles('employer')
  @CheckCredits()
  async createOffer(@User() user: User, @Body() dto: CreateOfferDto) {
    return this.offersService.create(user.employerId, dto);
  }

  @Post(':id/accept')
  @Roles('worker')
  async acceptOffer(@User() user: User, @Param('id') id: string) {
    return this.offersService.accept(id, user.id);
  }
}
```

---

## Scalability Strategy

### Horizontal Scaling

| Component | Scaling Strategy | Trigger |
|-----------|-----------------|---------|
| Next.js | ECS Auto Scaling | CPU > 60%, Request count |
| NestJS | ECS Auto Scaling | CPU > 60%, Queue depth |
| PostgreSQL | Read replicas | Read latency > 100ms |
| Redis | Cluster mode | Memory > 70% |
| Elasticsearch | Add nodes | Index size, query latency |

### Caching Strategy

```typescript
// apps/api/src/common/interceptors/cache.interceptor.ts
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { url } = request;
    return url;
  }
}

// Cache configuration
// apps/api/src/app.module.ts
CacheModule.register({
  ttl: 300, // 5 minutes
  max: 10000, // Max 10000 items
});
```

**Cache Layers:**

1. **CDN (CloudFront)** - Static assets, public pages
2. **Next.js ISR** - Semi-static pages (profiles, job details)
3. **Redis** - API responses, session data
4. **Database** - Query result cache, prepared statements

---

## Monitoring & Observability

### Metrics Collection

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                             │
└─────────────────────────────────────────────────────────────────┘

Application              Infrastructure            Business
    │                         │                        │
    ▼                         ▼                        ▼
┌──────────┐           ┌──────────┐           ┌──────────┐
│ PostHog  │           │ CloudWatch│          │ Custom   │
│ - Events │           │ - CPU     │          │ Metrics  │
│ - Funnels│           │ - Memory  │          │ - Offers │
│ - Errors │           │ - Latency │          │ - Hires  │
└────┬─────┘           └────┬─────┘           └────┬─────┘
     │                      │                      │
     └──────────────────────┼──────────────────────┘
                            │
                            ▼
                     ┌──────────┐
                     │ Grafana  │
                     │ - Dashboards│
                     │ - Alerts    │
                     └──────────┘
```

### Key Metrics

**Business Metrics:**
- Daily active workers
- Daily active employers
- Offers sent/day
- Offer acceptance rate
- Time to first offer
- Introductions per week
- MRR/ARR

**Technical Metrics:**
- API latency (p50, p95, p99)
- Error rate
- Database query latency
- Cache hit rate
- Search latency
- WebSocket connections

**Alerting Thresholds:**
| Metric | Warning | Critical |
|--------|---------|----------|
| API Error Rate | > 1% | > 5% |
| API Latency p95 | > 500ms | > 2000ms |
| Database CPU | > 70% | > 90% |
| Queue Depth | > 1000 | > 5000 |
| Offer Acceptance Drop | > 20% | > 50% |

---

## Deployment Strategy

### CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD PIPELINE                               │
└─────────────────────────────────────────────────────────────────┘

GitHub Push
     │
     ▼
┌─────────────────┐
│ 1. Lint & Type  │
│    Check        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Unit Tests   │
│    (Jest)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Integration  │
│    Tests        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Build        │
│    Docker       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Deploy to    │
│    Staging      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. E2E Tests    │
│    (Playwright) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. Manual       │
│    Approval     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 8. Deploy to    │
│    Production   │
│    (Blue/Green) │
└─────────────────┘
```

### Environment Strategy

| Environment | Purpose | Update Strategy |
|-------------|---------|-----------------|
| Local | Development | Manual |
| Staging | Testing, E2E | Auto on PR |
| Production | Live | Manual approval |

---

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| PostgreSQL | Continuous + Daily snapshot | 30 days | Multi-AZ |
| S3 Documents | Versioned | Indefinite | Cross-region |
| Elasticsearch | Daily snapshot | 7 days | S3 |

### RTO/RPO

| Component | RTO | RPO |
|-----------|-----|-----|
| PostgreSQL | 1 hour | 5 minutes |
| Application | 30 minutes | 0 (stateless) |
| Elasticsearch | 4 hours | 24 hours |
| Redis | 1 hour | 0 (cache) |

---

**Document Owner:** Platform Engineering  
**Last Updated:** June 2026  
**Next Review:** After infrastructure setup
