import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

// ============================================================================
// NOTIFICATIONS MODULE
// ============================================================================
// Provides:
//   - NotificationsService: creates, persists, and delivers notifications
//   - NotificationsController: REST API for fetching & marking notifications
//   - NotificationsGateway: Socket.IO WebSocket for real-time push
//
// Other modules emit events via EventEmitter2; this module listens
// and handles all delivery channels (DB, WebSocket, and future email/push).
// ============================================================================

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}