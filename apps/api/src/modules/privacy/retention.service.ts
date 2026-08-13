import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { BreachStatus, BreachSeverity, ConsentStatus, DeletionStatus, Prisma } from '@prisma/client';
import { NotificationEventType } from '../notifications/notification.types';

/**
 * RETENTION SERVICE
 *
 * Automated data retention enforcement for GDPR compliance.
 * Runs scheduled tasks to purge, anonymize, or archive data
 * based on the retention policies defined in the database.
 */
@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private storage: StorageService,
  ) {}

  // ============================================================================
  // SCHEDULED TASKS
  // ============================================================================

  /**
   * Run every day at 3:00 AM UTC — purge expired data.
   */
  @Cron('0 3 * * *')
  async handleDailyRetention() {
    this.logger.log('Starting daily data retention tasks...');
    const results = {
      notificationsDeleted: 0,
      exportsPurged: 0,
      deletionsExecuted: 0,
      documentsPurged: 0,
      ipsAnonymized: 0,
      messagesAnonymized: 0,
    };

    try {
      results.notificationsDeleted = await this.purgeOldNotifications();
      results.exportsPurged = await this.purgeExpiredExportRequests();
      results.deletionsExecuted = await this.executeScheduledDeletions();
      results.documentsPurged = await this.purgeOldVerificationDocuments();
      results.ipsAnonymized = await this.anonymizeOldIpAddresses();
      results.messagesAnonymized = await this.anonymizeOldMessages();

      this.logger.log(`Daily retention complete: ${JSON.stringify(results)}`);
    } catch (error) {
      this.logger.error('Error during daily retention tasks', error);
    }
  }

  // ============================================================================
  // NOTIFICATION PURGE
  // ============================================================================

  /**
   * Delete notifications older than 1 year.
   */
  async purgeOldNotifications(): Promise<number> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: oneYearAgo },
      },
    });

    this.logger.log(`Purged ${result.count} old notifications`);
    return result.count;
  }

  // ============================================================================
  // EXPORT REQUEST PURGE
  // ============================================================================

  /**
   * Mark data export request files as expired (> 30 days old).
   * Keeps the request record for audit but removes the file path.
   */
  async purgeExpiredExportRequests(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const expiredExports = await this.prisma.dataExportRequest.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { lt: thirtyDaysAgo },
        filePath: { not: null },
      },
    });

    for (const exportReq of expiredExports) {
      await this.prisma.dataExportRequest.update({
        where: { id: exportReq.id },
        data: {
          filePath: null,
          status: 'EXPIRED',
        },
      });
    }

    this.logger.log(`Purged ${expiredExports.length} expired export files`);
    return expiredExports.length;
  }

  // ============================================================================
  // SCHEDULED ACCOUNT DELETIONS
  // ============================================================================

  /**
   * Execute account deletions that have passed the 30-day grace period.
   */
  async executeScheduledDeletions(): Promise<number> {
    const now = new Date();

    const readyForDeletion = await this.prisma.dataDeletionRequest.findMany({
      where: {
        status: 'CONFIRMED',
        scheduledDeletionAt: { lte: now },
      },
      include: {
        user: true,
      },
    });

    let deletedCount = 0;

    for (const deletionRequest of readyForDeletion) {
      try {
        await this.executeUserDeletion(deletionRequest.userId, deletionRequest.id);
        deletedCount++;
      } catch (error) {
        this.logger.error(
          `Failed to execute deletion for user ${deletionRequest.userId}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Executed ${deletedCount} scheduled account deletions`);
    return deletedCount;
  }

  /**
   * Perform the actual user data deletion/anonymization.
   * This is the single authoritative method for GDPR Art. 17 erasure.
   * Retains data that must be kept by law (invoices, KvK, audit logs).
   *
   * Called by:
   *  - RetentionService.executeScheduledDeletions() (cron-triggered)
   *  - PrivacyService.executeDeletion() (user-initiated)
   */
  async executeUserDeletion(userId: string, deletionRequestId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Anonymize user record — merge both previous implementations
      const anonymizedEmail = `deleted-${userId}@offermarket.nl`;
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          passwordHash: '$2b$10$deletedAccountHashPlaceholderXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
          phone: null,
          lastLoginIp: null,
          twoFactorSecret: null,
          emailVerified: false,
          phoneVerified: false,
          status: 'DELETED',
          deletedAt: new Date(),
          // Clear privacy/TOS consent fields
          privacyPolicyVersion: null,
          privacyPolicyAcceptedAt: null,
          termsOfServiceVersion: null,
          termsOfServiceAcceptedAt: null,
          marketingConsent: false,
          analyticsConsent: false,
        },
      });

      // 2. Anonymize worker profile if exists
      const worker = await tx.worker.findFirst({ where: { userId } });
      if (worker) {
        await tx.worker.update({
          where: { id: worker.id },
          data: {
            summary: null,
            headline: null,
            postalCode: null,
            workAuthorization: null,
            immigrationConsentGiven: false,
            immigrationConsentAt: null,
            profileVisibility: 'HIDDEN',
            deletedAt: new Date(),
          },
        });

        // 2a. Delete BlockedCompany records for this worker
        await tx.blockedCompany.deleteMany({
          where: { workerId: worker.id },
        });
      }

      // 3. Anonymize employer profile PII if exists (keep KvK for legal obligation)
      const employer = await tx.employer.findFirst({ where: { userId } });
      if (employer) {
        await tx.employer.update({
          where: { id: employer.id },
          data: {
            phone: null,
            billingEmail: null,
            website: null,
            deletedAt: new Date(),
          },
        });
      }

      // 4. Redact messages sent by the deleted user
      //    Content is replaced with "[Deleted]" but the message record is preserved
      //    so the other party's conversation history remains intact.
      await tx.message.updateMany({
        where: { senderId: userId },
        data: {
          content: '[Deleted]',
          contentEncrypted: null,
        },
      });

      // 5. Redact conversation metadata that may contain PII
      //    Null out lastMessagePreview and workerIdentitySnapshot for conversations
      //    where the deleted user is a participant.
      const conversationsAsP1 = await tx.conversation.findMany({
        where: { participant1Id: userId },
        select: { id: true },
      });
      const conversationsAsP2 = await tx.conversation.findMany({
        where: { participant2Id: userId },
        select: { id: true },
      });
      const conversationIds = [
        ...conversationsAsP1.map(c => c.id),
        ...conversationsAsP2.map(c => c.id),
      ];
      if (conversationIds.length > 0) {
        await tx.conversation.updateMany({
          where: { id: { in: conversationIds } },
          data: {
            lastMessagePreview: null,
            workerIdentitySnapshot: Prisma.DbNull,
          },
        });
      }

      // 6. Delete all notifications for the user
      await tx.notification.deleteMany({
        where: { userId },
      });

      // 7. Withdraw all consents (keep records for audit trail)
      await tx.consent.updateMany({
        where: { userId, status: ConsentStatus.GIVEN },
        data: {
          status: ConsentStatus.WITHDRAWN,
          withdrawnAt: new Date(),
        },
      });

      // 8. Delete data export requests (file paths already purged by retention)
      await tx.dataExportRequest.deleteMany({
        where: { userId },
      });

      // 9. Mark deletion request as completed
      await tx.dataDeletionRequest.update({
        where: { id: deletionRequestId },
        data: {
          status: DeletionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // 10. Remove GDPR flags
      await tx.userGdprFlags.deleteMany({
        where: { userId },
      });

      // 11. Delete refresh tokens (invalidate all sessions)
      await tx.refreshToken.deleteMany({
        where: { userId },
      });

      // 12. Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_DELETION_EXECUTED',
          entityType: 'USER',
          entityId: userId,
          changes: {
            deletionRequestId,
            executedAt: new Date().toISOString(),
            dataRetained: ['invoices', 'audit_logs', 'consent_records', 'kvk_number', 'ratings_anonymized', 'messages_redacted'],
          },
        },
      });
    });

    this.logger.log(`Successfully executed account deletion for user ${userId}`);
  }

  // ============================================================================
  // VERIFICATION DOCUMENT PURGE
  // ============================================================================
  // Purges verification documents (and their S3 objects) that have been in a
  // terminal state (VERIFIED or REVOKED) for more than 30 days. PENDING docs
  // are never purged. Both the S3 object and the DB row are removed so the
  // underlying PII does not persist indefinitely (GDPR retention). The S3
  // object is deleted first, per row; if the S3 delete fails transiently the DB
  // row is still removed (safer than leaking the row), with a warning logged.

  /**
   * Purge verification documents that are older than 30 days after a terminal
   * review, including their S3 objects.
   */
  async purgeOldVerificationDocuments(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const docs = await this.prisma.verificationDocument.findMany({
      where: {
        status: { in: ['VERIFIED', 'REVOKED'] },
        OR: [
          { verifiedAt: { lt: thirtyDaysAgo } },
          { verifiedAt: null, updatedAt: { lt: thirtyDaysAgo } },
        ],
      },
      select: { id: true, fileUrl: true, metadata: true },
      take: 500,
    });

    let purged = 0;
    for (const doc of docs) {
      const key =
        (doc.metadata as any)?.key ??
        this.storage.extractKeyFromFileUrlPublic(doc.fileUrl);
      if (key) {
        try {
          await this.storage.deleteObject(key);
        } catch (err) {
          // deleteObject already swallows most errors; this guards the purge
          // loop so one bad row doesn't abort the whole batch.
          this.logger.warn(`S3 delete failed for ${key}: ${(err as Error).message}`);
        }
      }
      await this.prisma.verificationDocument.delete({ where: { id: doc.id } });
      purged++;
    }

    this.logger.log(`Purged ${purged} old verification documents (DB + S3)`);
    return purged;
  }

  // ============================================================================
  // IP ADDRESS ANONYMIZATION
  // ============================================================================

  /**
   * Anonymize IP addresses older than 6 months by replacing the last octet with 0.
   */
  async anonymizeOldIpAddresses(): Promise<number> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Find audit logs with non-anonymized IPs older than 6 months
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        ipAddress: { not: null },
        occurredAt: { lt: sixMonthsAgo },
      },
      select: { id: true, ipAddress: true },
      take: 1000, // Process in batches
    });

    let anonymized = 0;
    for (const log of auditLogs) {
      if (log.ipAddress) {
        const anonymizedIp = this.anonymizeIp(log.ipAddress);
        if (anonymizedIp !== log.ipAddress) {
          await this.prisma.auditLog.update({
            where: { id: log.id },
            data: { ipAddress: anonymizedIp },
          });
          anonymized++;
        }
      }
    }

    this.logger.log(`Anonymized ${anonymized} old IP addresses`);
    return anonymized;
  }

  /**
   * Anonymize an IP address by zeroing out the last octet (IPv4)
   * or the last 64 bits (IPv6).
   */
  private anonymizeIp(ip: string): string {
    if (ip.includes(':')) {
      // IPv6 — keep only the first two groups
      const parts = ip.split(':');
      return parts.slice(0, 2).join(':') + '::';
    }

    // IPv4 — replace last octet with 0
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }

    return ip;
  }

  // ============================================================================
  // MESSAGE ANONYMIZATION
  // ============================================================================

  /**
   * Anonymize messages in conversations that have been inactive for 2+ years.
   */
  async anonymizeOldMessages(): Promise<number> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Find conversations with no activity for 2+ years
    const oldConversations = await this.prisma.conversation.findMany({
      where: {
        lastMessageAt: { lt: twoYearsAgo },
      },
      select: { id: true },
    });

    if (oldConversations.length === 0) {
      return 0;
    }

    const conversationIds = oldConversations.map(c => c.id);

    // Set retention expiry on old conversation messages
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId: { in: conversationIds },
        isDeleted: false,
        retentionExpiresAt: null,
      },
      data: {
        retentionExpiresAt: twoYearsAgo,
      },
    });

    this.logger.log(`Marked ${result.count} messages in old conversations for retention expiry`);
    return result.count;
  }

  // ============================================================================
  // HELPER: Manual trigger for testing
  // ============================================================================

  /**
   * Manually run all retention tasks. For testing/admin purposes only.
   */
  async runAllRetentionTasks(): Promise<{
    notificationsDeleted: number;
    exportsPurged: number;
    deletionsExecuted: number;
    documentsPurged: number;
    ipsAnonymized: number;
    messagesAnonymized: number;
    breachDeadlinesChecked: number;
  }> {
    return {
      notificationsDeleted: await this.purgeOldNotifications(),
      exportsPurged: await this.purgeExpiredExportRequests(),
      deletionsExecuted: await this.executeScheduledDeletions(),
      documentsPurged: await this.purgeOldVerificationDocuments(),
      ipsAnonymized: await this.anonymizeOldIpAddresses(),
      messagesAnonymized: await this.anonymizeOldMessages(),
      breachDeadlinesChecked: await this.checkBreachDeadlines(),
    };
  }

  // ============================================================================
  // GDPR ART. 33-34: BREACH NOTIFICATION DEADLINE ENFORCEMENT
  // ============================================================================

  /**
   * Check for data breaches that have exceeded the 72-hour notification deadline
   * without being reported to the supervisory authority (Art. 33) or affected
   * data subjects (Art. 34).
   *
   * This runs daily as part of the retention schedule. It flags overdue breaches
   * and creates audit log entries for compliance tracking.
   */
  @Cron('0 4 * * *') // Run at 4:00 AM UTC, after the 3:00 AM retention tasks
  async checkBreachDeadlines(): Promise<number> {
    this.logger.log('Checking data breach notification deadlines (GDPR Art. 33/34)...');

    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Find breaches still in INVESTIGATING or CONTAINED status past 72 hours
    // that haven't been reported to the authority yet
    const overdueBreachToAuthority = await this.prisma.dataBreach.findMany({
      where: {
        status: { in: [BreachStatus.INVESTIGATING, BreachStatus.CONTAINED] },
        reportedToAuthorityAt: null,
        discoveredAt: { lte: seventyTwoHoursAgo },
      },
    });

    // Find breaches reported to authority but not yet to affected users
    // (Art. 34 requires notification without undue delay when high risk)
    const overdueBreachToUsers = await this.prisma.dataBreach.findMany({
      where: {
        status: { in: [BreachStatus.REPORTED_AUTHORITY] },
        reportedToUsersAt: null,
        severity: { in: [BreachSeverity.HIGH, BreachSeverity.CRITICAL] },
        discoveredAt: { lte: seventyTwoHoursAgo },
      },
    });

    let flaggedCount = 0;

    for (const breach of overdueBreachToAuthority) {
      this.logger.warn(
        `BREACH DEADLINE EXCEEDED: Breach "${breach.title}" (${breach.id}) ` +
        `discovered at ${breach.discoveredAt.toISOString()} has NOT been reported ` +
        `to the supervisory authority within 72 hours. ` +
        `This is a GDPR Art. 33 violation.`
      );

      // Create an audit log entry for compliance tracking
      await this.prisma.auditLog.create({
        data: {
          action: 'BREACH_72H_DEADLINE_EXCEEDED',
          entityType: 'data_breach',
          entityId: breach.id,
          legalBasis: 'GDPR_ARTICLE_33',
          changes: {
            breachId: breach.id,
            title: breach.title,
            discoveredAt: breach.discoveredAt.toISOString(),
            hoursSinceDiscovery: Math.round(
              (Date.now() - breach.discoveredAt.getTime()) / (1000 * 60 * 60)
            ),
            authorityNotified: false,
          },
        },
      });

      flaggedCount++;
    }

    for (const breach of overdueBreachToUsers) {
      this.logger.warn(
        `BREACH USER NOTIFICATION OVERDUE: Breach "${breach.title}" (${breach.id}) ` +
        `reported to authority but affected users have NOT been notified. ` +
        `Severity: ${breach.severity}. This may be a GDPR Art. 34 violation.`
      );

      await this.prisma.auditLog.create({
        data: {
          action: 'BREACH_USER_NOTIFICATION_OVERDUE',
          entityType: 'data_breach',
          entityId: breach.id,
          legalBasis: 'GDPR_ARTICLE_34',
          changes: {
            breachId: breach.id,
            title: breach.title,
            discoveredAt: breach.discoveredAt.toISOString(),
            severity: breach.severity,
            usersNotified: false,
          },
        },
      });

      // Transition breach to NOTIFIED_USERS status so the user-facing endpoint returns it
      await this.prisma.dataBreach.update({
        where: { id: breach.id },
        data: {
          status: BreachStatus.NOTIFIED_USERS,
          reportedToUsersAt: new Date(),
        },
      });

      // Notify all users about the high/critical severity breach
      // For breaches affecting all users, we notify up to the estimated count
      const affectedUserCount = breach.estimatedAffectedUsers || 100;
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
        take: Math.min(affectedUserCount, 1000), // Cap at 1000 notifications per check
      });

      for (const user of users) {
        this.eventEmitter.emit(NotificationEventType.BREACH_NOTIFICATION, {
          recipientUserId: user.id,
          breachId: breach.id,
          breachTitle: breach.title,
          severity: breach.severity,
          actionUrl: `/privacy/dashboard`,
        });
      }

      flaggedCount++;
    }

    if (flaggedCount > 0) {
      this.logger.warn(`Breach deadline check complete: ${flaggedCount} overdue breach(es) flagged.`);
    } else {
      this.logger.log('Breach deadline check complete: no overdue breaches found.');
    }

    return flaggedCount;
  }
}