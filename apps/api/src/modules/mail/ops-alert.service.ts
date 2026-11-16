import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EMAIL_CONFIG_TOKEN, EMAIL_TRANSPORT_TOKEN } from './mail.tokens';
import { defaultEmailConfig, EmailConfig } from './email-config';
import { EmailCategory, EmailMessage, EmailType } from './email-message';
import { buildEmailMessage } from './email-renderer';
import { EmailTransport } from './transports/email.transport';
import { LogTransport } from './transports/log.transport';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================================
// OPS ALERT SERVICE — internal alerting for the verification SLA (E10)
// ----------------------------------------------------------------------------
// Sends best-effort internal alert emails to the ops mailbox:
//   1. Immediately after a new employer registers (the concierge hook — the
//      admin should verify within 4 working hours while the employer is warm).
//   2. Weekly sweep: employers still PENDING-verification older than 24h.
//
// Deliberately INLINE (like MailService auth emails), not outbox+dispatcher:
// the outbox pipeline is user-notification machinery (Notification rows,
// consent/suppression gate, per-user locale). Ops alerts target an internal
// mailbox that is not a platform user, and losing one must never break the
// primary operation (or the weekly sweep) — so: never throws, log + continue.
// ============================================================================
const DEFAULT_OPS_ALERT_EMAIL = 'support@offermarket.nl';

@Injectable()
export class OpsAlertService {
  private readonly logger = new Logger(OpsAlertService.name);
  private readonly transport: EmailTransport;
  private readonly config: EmailConfig;

  constructor(
    @Optional() @Inject(EMAIL_TRANSPORT_TOKEN) transport?: EmailTransport,
    @Optional() @Inject(EMAIL_CONFIG_TOKEN) config?: EmailConfig,
    @Optional() private readonly prisma?: PrismaService,
  ) {
    this.config = config ?? defaultEmailConfig();
    this.transport = transport ?? new LogTransport();
  }

  /** Ops mailbox, configurable via OPS_ALERT_EMAIL (default support@offermarket.nl). */
  private opsRecipient(): string {
    return (process.env.OPS_ALERT_EMAIL ?? DEFAULT_OPS_ALERT_EMAIL).trim();
  }

  /** Set OPS_ALERTS_ENABLED=false to disable the weekly cron sweep (tests / single-purpose deploys). */
  private alertsEnabled(): boolean {
    return (process.env.OPS_ALERTS_ENABLED ?? 'true').trim() !== 'false';
  }

  private async send(subject: string, text: string): Promise<void> {
    const message: EmailMessage = buildEmailMessage(
      {
        to: this.opsRecipient(),
        subject,
        text,
        emailType: 'notification' as EmailType,
        category: 'transactional' as EmailCategory,
        locale: 'en',
        tags: ['ops_alert'],
        metadata: { source: 'ops_alert' },
      },
      this.config,
    );
    try {
      await this.transport.send(message);
    } catch (error) {
      // Best-effort: an ops-email failure must never surface to the caller.
      this.logger.warn(`Ops alert failed to send ("${subject}"): ${error}`);
    }
  }

  /**
   * Concierge hook: alert ops right after a new employer registers.
   * Call AFTER the registration transaction commits. Never throws.
   */
  async notifyNewEmployer(input: {
    companyName: string;
    kvkNumber: string;
    email: string;
  }): Promise<void> {
    const lines = [
      'New employer signed up and is awaiting verification.',
      '',
      `Company: ${input.companyName}`,
      `KvK: ${input.kvkNumber}`,
      `Email: ${input.email}`,
      `Registered at: ${new Date().toISOString()}`,
      '',
      'Concierge SLA: aim to verify within 4 working hours.',
      'Verify in the admin console: Employers → pending verification.',
    ];
    this.logger.log(`Ops alert (new employer): ${input.companyName}`);
    await this.send(
      `New employer awaiting verification — ${input.companyName}`,
      lines.join('\n'),
    );
  }

  /**
   * Weekly sweep (Mondays 08:00): employers still verif. PENDING older than 24h.
   * Zero pending → no email (no nagging).
   */
  @Cron('0 8 * * 1')
  async weeklyUnverifiedSweep(): Promise<void> {
    if (!this.alertsEnabled() || !this.prisma) return;
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pending = await this.prisma.employer.findMany({
        where: { verificationStatus: 'PENDING', createdAt: { lt: cutoff } },
        select: {
          companyName: true,
          kvkNumber: true,
          createdAt: true,
          user: { select: { email: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      if (pending.length === 0) return;

      const lines = [
        `Unverified-employer sweep: ${pending.length} employer(s) PENDING for more than 24h.`,
        '',
        ...pending.map(
          (e) =>
            `- ${e.companyName} (KvK ${e.kvkNumber}, ${e.user.email}) — since ${e.createdAt.toISOString()}`,
        ),
        pending.length === 50 ? '… (list capped at 50)' : '',
        '',
        'Verify in the admin console: Employers → pending verification.',
      ];
      this.logger.log(`Ops alert (weekly sweep): ${pending.length} unverified employers`);
      await this.send(
        `Weekly sweep — ${pending.length} unverified employers`,
        lines.filter(Boolean).join('\n'),
      );
    } catch (error) {
      // The sweep must never crash the scheduler.
      this.logger.warn(`Weekly unverified sweep failed: ${error}`);
    }
  }
}
