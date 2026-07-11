import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private prisma: PrismaService) {}

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
   * Retains data that must be kept by law (invoices, KvK, audit logs).
   */
  private async executeUserDeletion(userId: string, deletionRequestId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Anonymize user record
      const anonymousEmail = `deleted-${userId}@offermarket.nl`;
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymousEmail,
          passwordHash: '$DELETED$' + Math.random().toString(36).slice(2, 15),
          phone: null,
          lastLoginIp: null,
          emailVerified: false,
          phoneVerified: false,
        },
      });

      // 2. Soft-delete worker profile if exists
      const worker = await tx.worker.findFirst({ where: { userId } });
      if (worker) {
        await tx.worker.update({
          where: { id: worker.id },
          data: {
            deletedAt: new Date(),
          },
        });
      }

      // 3. Anonymize employer profile personal contact info if exists
      const employer = await tx.employer.findFirst({ where: { userId } });
      if (employer) {
        await tx.employer.update({
          where: { id: employer.id },
          data: {
            // Keep KvK number (legal obligation) and billing email
            // Remove personal contact info
            phone: null,
          },
        });
      }

      // 4. Delete all notifications
      await tx.notification.deleteMany({
        where: { userId },
      });

      // 5. Mark all consents as withdrawn (keep record for audit)
      await tx.consent.updateMany({
        where: { userId },
        data: { withdrawnAt: new Date() },
      });

      // 6. Delete data export requests
      await tx.dataExportRequest.deleteMany({
        where: { userId },
      });

      // 7. Mark deletion request as completed
      await tx.dataDeletionRequest.update({
        where: { id: deletionRequestId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // 8. Remove GDPR flags
      await tx.userGdprFlags.deleteMany({
        where: { userId },
      });

      // 9. Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ACCOUNT_DELETION_EXECUTED',
          entityType: 'USER',
          entityId: userId,
          changes: {
            deletionRequestId,
            executedAt: new Date().toISOString(),
            dataRetained: ['invoices', 'audit_logs', 'consent_records', 'kvk_number'],
          },
        },
      });
    });

    this.logger.log(`Successfully executed account deletion for user ${userId}`);
  }

  // ============================================================================
  // VERIFICATION DOCUMENT PURGE
  // ============================================================================

  /**
   * Purge verification documents that are older than 30 days after verification.
   */
  async purgeOldVerificationDocuments(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.verificationDocument.deleteMany({
      where: {
        status: 'VERIFIED',
        verifiedAt: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(`Purged ${result.count} old verification documents`);
    return result.count;
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
  }> {
    return {
      notificationsDeleted: await this.purgeOldNotifications(),
      exportsPurged: await this.purgeExpiredExportRequests(),
      deletionsExecuted: await this.executeScheduledDeletions(),
      documentsPurged: await this.purgeOldVerificationDocuments(),
      ipsAnonymized: await this.anonymizeOldIpAddresses(),
      messagesAnonymized: await this.anonymizeOldMessages(),
    };
  }
}