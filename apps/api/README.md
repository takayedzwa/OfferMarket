# OfferMarket API

**NestJS backend for OfferMarket - the reverse talent marketplace**

## Core Primitives

This API enforces two non-negotiable principles:

1. **Structured Offers** - All offers must be complete with specific salary, benefits, and terms
2. **Anonymous Worker Profiles** - Worker identity is only revealed after offer acceptance

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

API runs on http://localhost:3001/api/v1

## Core Endpoints

### Authentication
```
POST /auth/register/worker   - Register worker account
POST /auth/register/employer - Register employer account
POST /auth/login             - Login
POST /auth/verify-email      - Verify email
POST /auth/verify-phone      - Verify phone
```

### Workers (Anonymous Profiles)
```
GET  /workers/me             - Get my profile (private)
PATCH /workers/me            - Update my profile
POST /workers                - Create profile
GET  /workers/:publicId      - Get public profile (ANONYMOUS)
POST /workers/me/block       - Block a company
PATCH /workers/me/visibility - Update visibility settings
```

### Offers (Structured)
```
POST /offers                 - Create offer (employer)
GET  /offers                 - List offers
GET  /offers/:id             - View offer details
POST /offers/:id/accept      - Accept offer (reveals identity!)
POST /offers/:id/reject      - Reject offer
POST /offers/:id/shortlist   - Shortlist offer
POST /offers/:id/counter      - Counter offer
POST /offers/:id/withdraw    - Withdraw offer (employer)
```

### Conversations (Post-Acceptance Only)
```
GET  /conversations          - List conversations
GET  /conversations/:id      - Get conversation with messages
POST /conversations/:id/messages - Send message
POST /conversations/:id/read - Mark as read
```

## Offer Validation

All offers are validated by the `OfferValidationPipe`. Offers are rejected if:

- Salary range exceeds €5,000 spread
- Salary is below €20,000 minimum
- Any required field is missing
- "Competitive salary" or vague terms used

See `src/modules/offers/pipes/offer-validation.pipe.ts` for full validation rules.

## Identity Revelation

Worker identity is ONLY revealed when:
1. Worker accepts an offer (`POST /offers/:id/accept`)
2. Conversation is created automatically
3. Employer receives worker's name, email, phone

See `src/modules/offers/offers.service.ts` - `acceptOffer()` method.

## Anonymous Profile Pipe

The `AnonymousProfilePipe` ensures NO identifying information leaks to employers:

- Whitelist of allowed fields
- Blacklist of forbidden fields
- Runtime security checks
- Email/phone pattern detection

See `src/modules/workers/pipes/anonymous-profile.pipe.ts`.

## Database Schema

Core tables:
- `User` - Authentication base
- `Worker` - Anonymous worker profiles
- `Employer` - Company profiles
- `Offer` - Structured offers
- `OfferVersion` - Offer details (versioned)
- `Conversation` - Post-acceptance messaging
- `Message` - Messages

See `prisma/schema.prisma` for full schema.

## Security Considerations

1. **Worker PII** - Name, email, phone stored encrypted (TODO: implement encryption)
2. **Identity Revelation** - Only via `acceptOffer()` transaction
3. **Blocked Companies** - Silently fail, don't reveal block status
4. **Audit Logging** - All identity revelations logged (TODO: implement)

## Testing

```bash
# Run tests
npm run test

# Run specific test file
npm run test offers.service.spec.ts
```

## Architecture

```
src/
├── modules/
│   ├── auth/           - Authentication
│   ├── workers/        - Anonymous profiles
│   ├── employers/      - Company profiles
│   ├── offers/         - Structured offers
│   └── messages/       - Post-acceptance comms
├── prisma/
│   ├── schema.prisma   - Database schema
│   └── prisma.service.ts
└── common/
    ├── filters/        - Exception filters
    ├── guards/         - Auth guards
    ├── interceptors/   - Response interceptors
    └── pipes/          - Validation pipes
```

## Environment Variables

See `.env.example` for required variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Token signing
- `ENCRYPTION_KEY` - PII encryption (TODO)

## License

Proprietary - All rights reserved
