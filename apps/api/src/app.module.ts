import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // EventEmitter2 enables decoupled event-driven notifications.
    // Services emit events (e.g., offer.accepted); NotificationsService listens.
    EventEmitterModule.forRoot({
      // Use wildcards for event patterns
      wildcard: false,
      // Delimiter for wildcards (not used with wildcard: false)
      delimiter: '.',
      // Whether to throw errors in event handlers (we want to catch and log, not crash)
      newListener: false,
      // Maximum listeners per event
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
  ],
})
export class AppModule {}