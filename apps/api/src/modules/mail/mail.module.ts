import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailOutboxService } from './dispatcher/email-outbox.service';
import { EmailDeliveryGate } from './dispatcher/email-delivery-gate';
import { EmailDispatcher } from './dispatcher/email-dispatcher.service';
import { BrevoWebhookController } from './webhooks/brevo-webhook.controller';
import { EMAIL_CONFIG_TOKEN, EMAIL_TRANSPORT_TOKEN } from './mail.tokens';
import { loadEmailConfig } from './email-config';
import { createTransport } from './transports/transport.factory';

// ============================================================================
// MAIL MODULE
// ----------------------------------------------------------------------------
// Provides the MailService (inline auth emails: verification codes + password
// resets) and the outbox delivery pipeline (notification emails):
//   - EmailOutboxService  — durable email intent + claim/state machine
//   - EmailDeliveryGate   — "may we send?" gate (GDPR re-check; consent +
//                           suppression added in Phase 3)
//   - EmailDispatcher     — interval-driven outbox pump (@Interval, active only
//                           when ScheduleModule.forRoot() is running, i.e. the
//                           full app; disabled via EMAIL_OUTBOX_DISPATCHER_ENABLED)
//
// The transport + config are built once at boot from the environment:
//   - EMAIL_PROVIDER=brevo → BrevoTransport (fails the boot in production if
//     BREVO_API_KEY is missing — see loadEmailConfig).
//   - EMAIL_PROVIDER unset / `log` → LogTransport (dev/test capture; in
//     production, logs a loud warning and drops — no silent success).
//
// PrismaModule is @Global, so the outbox/gate/dispatcher can inject PrismaService
// without an explicit import here.
//
// Imported by AuthModule (verification codes + password reset) and
// NotificationsModule (channelEmail delivery via the outbox).
// ============================================================================

@Module({
  providers: [
    { provide: EMAIL_CONFIG_TOKEN, useFactory: () => loadEmailConfig() },
    {
      provide: EMAIL_TRANSPORT_TOKEN,
      useFactory: (config) => createTransport(config),
      inject: [EMAIL_CONFIG_TOKEN],
    },
    MailService,
    EmailOutboxService,
    EmailDeliveryGate,
    EmailDispatcher,
  ],
  controllers: [BrevoWebhookController],
  exports: [MailService, EmailOutboxService, EmailDeliveryGate],
})
export class MailModule {}