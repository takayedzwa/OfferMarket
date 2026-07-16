import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkersModule } from './modules/workers/workers.module';
import { EmployersModule } from './modules/employers/employers.module';
import { OffersModule } from './modules/offers/offers.module';
import { MessagesModule } from './modules/messages/messages.module';
import { CommonModule } from './modules/common/common.module';
import { AdminModule } from './modules/admin/admin.module';
import { SupportModule } from './modules/support/support.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { TrustModule } from './modules/trust/trust.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { DsaModule } from './modules/dsa/dsa.module';
import { CustomThrottlerGuard } from './guards/throttler-guard';
import { ProcessingRestrictionGuard } from './guards/processing-restriction.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting — protects all endpoints against brute-force and DoS attacks.
    // Default: 100 requests per 60 seconds per IP.
    // Auth endpoints override with stricter limits (see auth.controller.ts).
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 100,
      },
    ]),
    // EventEmitter2 enables decoupled event-driven notifications.
    // Services emit events (e.g., offer.accepted); NotificationsService listens.
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      maxListeners: 10,
    }),
    PrismaModule,
    AuthModule,
    WorkersModule,
    EmployersModule,
    OffersModule,
    MessagesModule,
    CommonModule,
    AdminModule,
    SupportModule,
    RatingsModule,
    TrustModule,
    BillingModule,
    NotificationsModule,
    PrivacyModule,
    DsaModule,
  ],
  providers: [
    // Apply rate limiting globally via custom guard (skips admin users)
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    // Enforce GDPR Article 18 processing restriction — blocks write operations
    // for users who have restricted processing. Privacy endpoints are exempted
    // with @SkipProcessingRestrictionCheck() so users can lift restrictions.
    { provide: APP_GUARD, useClass: ProcessingRestrictionGuard },
  ],
})
export class AppModule {}