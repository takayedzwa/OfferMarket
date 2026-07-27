import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

// ============================================================================
// MAIL MODULE
// ----------------------------------------------------------------------------
// Provides the dependency-free MailService. Imported by AuthModule (verification
// codes + password reset) and NotificationsModule (channelEmail delivery).
// ============================================================================

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}