# Getting Started - OfferMarket

**Quick start guide for developers**

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm or yarn

## 1. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

## 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

## 3. Set Up Environment

```bash
# Copy environment file
cp apps/api/.env.example apps/api/.env

# Update DATABASE_URL if needed (default works with Docker)
```

## 4. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with test data
npm run db:seed
```

## 5. Start Development

```bash
# Start both API and web frontend
npm run dev

# Or start individually:
npm run dev:api   # API only (port 3001)
npm run dev:web   # Frontend only (port 3000)
```

## 6. Verify Setup

### Test API
```bash
curl http://localhost:3001/api/v1/health
```

### Test Database
```bash
npm run db:studio
```

## Project Structure

```
OfferMarket/
├── apps/
│   ├── api/              # NestJS backend (port 3001)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── workers/     # Anonymous profiles
│   │   │   │   ├── employers/
│   │   │   │   ├── offers/      # Structured offers
│   │   │   │   └── messages/
│   │   │   └── prisma/
│   │   └── prisma/
│   │       └── schema.prisma    # Database schema
│   │
│   └── web/              # Next.js frontend (port 3000)
│       └── app/
│
├── packages/
│   ├── shared/           # Shared types, utils
│   └── ui/               # Shared UI components
│
├── docker-compose.yml    # Local infrastructure
└── docs/                 # Documentation
```

## Core Concepts

### 1. Structured Offers

All offers must include:
- Specific salary (max €5K range)
- Complete benefits
- Clear contract terms
- Work arrangement details

**No "competitive salary" allowed.**

### 2. Anonymous Worker Profiles

Workers remain anonymous until they accept an offer:
- Employers see: region, skills, certifications
- Employers DON'T see: name, email, phone, current employer

### 3. Identity Revelation

Identity is revealed ONLY when:
1. Worker accepts an offer
2. Conversation is created
3. Employer receives contact info

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/prisma/schema.prisma` | Database schema |
| `apps/api/src/modules/offers/` | Structured offer logic |
| `apps/api/src/modules/workers/` | Anonymous profile logic |
| `apps/api/src/modules/offers/pipes/offer-validation.pipe.ts` | Offer validation |
| `apps/api/src/modules/workers/pipes/anonymous-profile.pipe.ts` | Anonymity enforcement |

## Common Commands

```bash
# Database
npm run db:migrate    # Run migrations
npm run db:studio     # Open Prisma Studio
npm run db:generate   # Generate Prisma client

# Testing
npm run test          # Run all tests
npm run lint          # Lint code

# Docker
docker-compose up     # Start all services
docker-compose down   # Stop all services
```

## API Endpoints

See [apps/api/README.md](apps/api/README.md) for full API documentation.

### Quick Test

```bash
# Register a worker
curl -X POST http://localhost:3001/api/v1/auth/register/worker \
  -H "Content-Type: application/json" \
  -d '{"email":"worker@test.com","password":"password123"}'

# Register an employer
curl -X POST http://localhost:3001/api/v1/auth/register/employer \
  -H "Content-Type: application/json" \
  -d '{"email":"employer@test.com","password":"password123","phone":"+31612345678","company":{"name":"Test BV","kvkNumber":"12345678"}}'

# Create an offer (requires employer auth)
curl -X POST http://localhost:3001/api/v1/offers \
  -H "Content-Type: application/json" \
  -H "x-user-id: <employer-id>" \
  -H "x-user-role: EMPLOYER" \
  -d '{...offer data...}'
```

## Troubleshooting

### Database connection error
```bash
# Check Docker is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Check connection
docker-compose exec postgres pg_isready -U offermarket
```

### Port already in use
```bash
# Check what's using the port
lsof -i :3001

# Or change port in .env
PORT=3002
```

### Prisma client out of date
```bash
npm run db:generate
```

## Next Steps

1. Read [Core Innovation Design](docs/prd/00-core-innovation.md)
2. Review [Database Schema](apps/api/prisma/schema.prisma)
3. Explore [Offer Validation](apps/api/src/modules/offers/pipes/offer-validation.pipe.ts)
4. Build the frontend (apps/web/)

---

**Need help?** Check the documentation in `docs/` or the API README in `apps/api/README.md`.
