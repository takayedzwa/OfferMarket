import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { RetentionService } from './retention.service';
import {
  ConsentType,
  ConsentStatus,
  LegalBasis,
  DataSubjectRequestType,
  DataSubjectRequestStatus,
  ExportStatus,
  ExportFormat,
  DeletionStatus,
  BreachSeverity,
  BreachStatus,
} from '@prisma/client';
import { NotificationEventType } from '../notifications/notification.types';

/**
 * PRIVACY SERVICE
 *
 * Implements GDPR data subject rights and privacy management:
 * - Consent management (Articles 6, 7)
 * - Right of access (Article 15)
 * - Right to rectification (Article 16)
 * - Right to erasure (Article 17)
 * - Right to restrict processing (Article 18)
 * - Right to data portability (Article 20)
 * - Right to object (Article 21)
 * - Special category data handling (Article 9)
 * - Breach notification (Articles 33, 34)
 * - Data retention enforcement
 */

@Injectable()
export class PrivacyService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private retentionService: RetentionService,
  ) {}

  // ============================================================================
  // CONSENT MANAGEMENT
  // ============================================================================

  /**
   * Record a user's consent for a specific processing activity.
   * Tracks IP address and user agent for audit trail.
   */
  async recordConsent(
    userId: string | null,
    consentType: ConsentType,
    legalBasis: LegalBasis,
    version: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Check for existing active consent of the same type
    const existing = await this.prisma.consent.findFirst({
      where: {
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // If same version, just return existing with derived fields
      if (existing.version === version) {
        return {
          id: existing.id,
          consentType: existing.consentType,
          granted: existing.status === ConsentStatus.GIVEN,
          status: existing.status,
          version: existing.version,
          legalBasis: existing.legalBasis,
          ipAddress: existing.ipAddress,
          userAgent: existing.userAgent,
          grantedAt: existing.createdAt.toISOString(),
          withdrawnAt: existing.withdrawnAt?.toISOString() ?? null,
          expiresAt: existing.expiresAt?.toISOString() ?? null,
          createdAt: existing.createdAt.toISOString(),
          updatedAt: existing.updatedAt.toISOString(),
        };
      }
      // If new version, withdraw old consent and create new
      await this.prisma.consent.update({
        where: { id: existing.id },
        data: {
          status: ConsentStatus.WITHDRAWN,
          withdrawnAt: new Date(),
        },
      });
    }

    // Create new consent record
    const consent = await this.prisma.consent.create({
      data: {
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
        legalBasis,
        version,
        ipAddress,
        userAgent,
      },
    });

    // Return with derived fields for frontend compatibility
    return {
      id: consent.id,
      consentType: consent.consentType,
      granted: true,
      status: consent.status,
      version: consent.version,
      legalBasis: consent.legalBasis,
      ipAddress: consent.ipAddress,
      userAgent: consent.userAgent,
      grantedAt: consent.createdAt.toISOString(),
      withdrawnAt: consent.withdrawnAt?.toISOString() ?? null,
      expiresAt: consent.expiresAt?.toISOString() ?? null,
      createdAt: consent.createdAt.toISOString(),
      updatedAt: consent.updatedAt.toISOString(),
    };
  }

  /**
   * Withdraw consent for a specific processing activity.
   * Handles cascading effects for special category data.
   */
  async withdrawConsent(userId: string, consentType: ConsentType) {
    const activeConsents = await this.prisma.consent.findMany({
      where: {
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
      },
    });

    if (activeConsents.length === 0) {
      throw new NotFoundException(`No active consent found for type: ${consentType}`);
    }

    // Withdraw all active consents of this type
    await this.prisma.consent.updateMany({
      where: {
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
      },
      data: {
        status: ConsentStatus.WITHDRAWN,
        withdrawnAt: new Date(),
      },
    });

    // Handle cascading effects for special category data
    if (consentType === ConsentType.SPECIAL_CATEGORY) {
      await this.handleImmigrationConsentWithdrawal(userId);
    }

    // Update user consent flags
    if (consentType === ConsentType.COOKIE_ANALYTICS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { analyticsConsent: false },
      });
    }

    if (consentType === ConsentType.MARKETING || consentType === ConsentType.EMAIL_NOTIFICATIONS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { marketingConsent: false },
      });
    }

    return { success: true, consentType, withdrawnAt: new Date() };
  }

  /**
   * When immigration (special category) consent is withdrawn,
   * remove the workAuthorization data from the worker profile.
   */
  private async handleImmigrationConsentWithdrawal(userId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
    });

    if (worker) {
      await this.prisma.worker.update({
        where: { id: worker.id },
        data: {
          workAuthorization: null,
          immigrationConsentGiven: false,
          immigrationConsentAt: null,
        },
      });
    }
  }

  /**
   * Check if a user has active consent for a specific type.
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const consent = await this.prisma.consent.findFirst({
      where: {
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
      },
    });
    return !!consent;
  }

  /**
   * Get all consents for a user.
   * Returns a flat array with `granted` and `grantedAt` derived fields
   * for frontend compatibility.
   */
  async getUserConsents(userId: string) {
    const consents = await this.prisma.consent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Map to include `granted` (boolean) and `grantedAt` (ISO date string)
    // derived from the `status` and `createdAt` fields the frontend expects
    return consents.map((c) => ({
      id: c.id,
      consentType: c.consentType,
      granted: c.status === ConsentStatus.GIVEN,
      status: c.status,
      version: c.version,
      legalBasis: c.legalBasis,
      ipAddress: c.ipAddress,
      userAgent: c.userAgent,
      grantedAt: c.createdAt.toISOString(),
      withdrawnAt: c.withdrawnAt?.toISOString() ?? null,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Check which consents are required but not yet given.
   */
  async getRequiredConsents(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const requiredConsents: Array<{ type: ConsentType; label: string; granted: boolean }> = [
      { type: ConsentType.PRIVACY_POLICY, label: 'Privacy Policy', granted: !!user.privacyPolicyAcceptedAt },
      { type: ConsentType.TERMS_OF_SERVICE, label: 'Terms of Service', granted: !!user.termsOfServiceAcceptedAt },
      { type: ConsentType.DATA_PROCESSING, label: 'Data Processing', granted: await this.hasConsent(userId, ConsentType.DATA_PROCESSING) },
    ];

    // Optional consents
    const optionalConsents: Array<{ type: ConsentType; label: string; granted: boolean }> = [
      { type: ConsentType.COOKIE_ANALYTICS, label: 'Analytics Cookies', granted: user.analyticsConsent },
      { type: ConsentType.MARKETING, label: 'Marketing Emails', granted: user.marketingConsent },
      { type: ConsentType.EMAIL_NOTIFICATIONS, label: 'Email Notifications', granted: await this.hasConsent(userId, ConsentType.EMAIL_NOTIFICATIONS) },
    ];

    // Check if user is a worker — then immigration consent is relevant
    const worker = await this.prisma.worker.findUnique({ where: { userId } });
    if (worker) {
      requiredConsents.push({
        type: ConsentType.SPECIAL_CATEGORY,
        label: 'Immigration Status Processing',
        granted: worker.immigrationConsentGiven === true,
      });
    }

    return {
      required: requiredConsents,
      optional: optionalConsents,
    };
  }

  // ============================================================================
  // RIGHT OF ACCESS (Article 15) - Data Export
  // ============================================================================

  /**
   * Request a data export containing all personal data for the user.
   * GDPR requires this be provided within 30 days.
   */
  async requestDataExport(
    userId: string,
    format: ExportFormat = ExportFormat.JSON,
    dataCategories?: string[],
  ) {
    // Check for existing pending/processing export
    const existing = await this.prisma.dataExportRequest.findFirst({
      where: {
        userId,
        status: { in: [ExportStatus.PENDING, ExportStatus.PROCESSING] },
      },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending data export request');
    }

    const allCategories = [
      'profile',
      'worker_profile',
      'employer_profile',
      'offers',
      'messages',
      'ratings',
      'notifications',
      'consents',
      'audit_logs',
      'verification_documents',
    ];

    return this.prisma.dataExportRequest.create({
      data: {
        userId,
        format,
        dataCategories: dataCategories || allCategories,
        status: ExportStatus.PENDING,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      },
    });
  }

  /**
   * Gather all personal data for a user.
   * This is the actual data for the export.
   */
  async gatherAllUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        status: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        privacyPolicyVersion: true,
        privacyPolicyAcceptedAt: true,
        termsOfServiceVersion: true,
        termsOfServiceAcceptedAt: true,
        marketingConsent: true,
        analyticsConsent: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const [worker, employer, consents, dataSubjectRequests] = await Promise.all([
      this.prisma.worker.findUnique({
        where: { userId },
        include: {
          skills: { include: { skill: true } },
          certifications: true,
          languages: true,
          education: true,
          projectExperiences: true,
          blockedCompanies: { include: { employer: { select: { id: true, companyName: true } } } },
          region: true,
        },
      }),
      this.prisma.employer.findUnique({
        where: { userId },
        include: { verification: true },
      }),
      this.prisma.consent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dataSubjectRequest.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const offers = await this.prisma.offer.findMany({
      where: {
        OR: [
          { worker: { userId } },
          { employer: { userId } },
        ],
      },
      include: { currentVersion: true },
    });

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        offer: { select: { id: true, jobTitle: true, publicId: true } },
      },
    });

    const ratings = await this.prisma.rating.findMany({
      where: { raterId: userId },
    });

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const auditLogs = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { occurredAt: 'desc' },
      take: 100,
    });

    const gdprFlags = await this.prisma.userGdprFlags.findUnique({
      where: { userId },
    });

    return {
      exportedAt: new Date().toISOString(),
      user,
      workerProfile: worker,
      employerProfile: employer,
      offers,
      conversations,
      ratings,
      notifications,
      consents,
      dataSubjectRequests,
      auditLogs,
      gdprFlags,
    };
  }

  /**
   * Process a pending data export request.
   * Generates export data in the requested format (JSON or CSV).
   * Stores the data snapshot so re-downloads serve the original data
   * (GDPR Art. 15/20: data as it existed at the time of the request).
   */
  async processDataExport(requestId: string, userId?: string) {
    const request = await this.prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Export request not found');

    // Verify ownership if userId is provided (prevents IDOR)
    if (userId && request.userId !== userId) {
      throw new ForbiddenException('You can only download your own data export');
    }

    // If already completed, return the stored snapshot (not live data)
    if (request.status === ExportStatus.COMPLETED && request.snapshotData) {
      // Check if the export link has expired
      if (request.expiresAt && new Date() > request.expiresAt) {
        throw new BadRequestException('This export link has expired. Please request a new data export.');
      }
      return request.snapshotData as any;
    }

    if (request.status !== ExportStatus.PENDING && request.status !== ExportStatus.PROCESSING) {
      throw new BadRequestException(`Export request is in ${request.status} status`);
    }

    // Mark as processing
    await this.prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: ExportStatus.PROCESSING },
    });

    try {
      const data = await this.gatherAllUserData(request.userId);
      const fileSize = Buffer.byteLength(JSON.stringify(data, null, 2), 'utf-8');

      // Store the snapshot so re-downloads serve the original data (Art. 15/20)
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: ExportStatus.COMPLETED,
          snapshotData: data as any,
          fileSize,
          completedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        },
      });

      return data;
    } catch (error) {
      await this.prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: ExportStatus.FAILED },
      });
      throw error;
    }
  }

  /**
   * Convert export data to CSV format (GDPR Art. 20 — machine-readable format).
   * Flattens nested data into tabular rows suitable for CSV.
   */
  private flattenToCsv(data: any): string {
    const rows: string[] = [];

    // Helper to escape CSV fields
    const escape = (val: any): string => {
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // User profile
    if (data.user) {
      rows.push('--- USER PROFILE ---');
      const userHeaders = Object.keys(data.user).join(',');
      rows.push(userHeaders);
      rows.push(Object.values(data.user).map(escape).join(','));
      rows.push('');
    }

    // Worker profile
    if (data.workerProfile) {
      rows.push('--- WORKER PROFILE ---');
      const wp = data.workerProfile;
      const wpFields = { id: wp.id, userId: wp.userId, headline: wp.headline, summary: wp.summary, postalCode: wp.postalCode, profileVisibility: wp.profileVisibility };
      rows.push(Object.keys(wpFields).join(','));
      rows.push(Object.values(wpFields).map(escape).join(','));
      rows.push('');
    }

    // Employer profile
    if (data.employerProfile) {
      rows.push('--- EMPLOYER PROFILE ---');
      const ep = data.employerProfile;
      const epFields = { id: ep.id, userId: ep.userId, companyName: ep.companyName, kvkNumber: ep.kvkNumber, website: ep.website, verificationStatus: ep.verificationStatus };
      rows.push(Object.keys(epFields).join(','));
      rows.push(Object.values(epFields).map(escape).join(','));
      rows.push('');
    }

    // Offers
    if (data.offers?.length) {
      rows.push('--- OFFERS ---');
      const offerHeaders = 'id,jobTitle,status,createdAt';
      rows.push(offerHeaders);
      for (const offer of data.offers) {
        rows.push([offer.id, offer.jobTitle, offer.status, offer.createdAt].map(escape).join(','));
      }
      rows.push('');
    }

    // Consents
    if (data.consents?.length) {
      rows.push('--- CONSENTS ---');
      rows.push('id,consentType,status,legalBasis,grantedAt,withdrawnAt');
      for (const c of data.consents) {
        rows.push([c.id, c.consentType, c.status, c.legalBasis, c.createdAt, c.withdrawnAt].map(escape).join(','));
      }
      rows.push('');
    }

    return rows.join('\n');
  }

  /**
   * Get export data in the specified format (JSON or CSV).
   */
  async getExportData(requestId: string, userId: string, format: ExportFormat = ExportFormat.JSON) {
    const data = await this.processDataExport(requestId, userId);

    if (format === ExportFormat.CSV) {
      return {
        content: this.flattenToCsv(data),
        contentType: 'text/csv',
        filename: `offermarket-data-export-${new Date().toISOString().split('T')[0]}.csv`,
      };
    }

    return {
      content: JSON.stringify(data, null, 2),
      contentType: 'application/json',
      filename: `offermarket-data-export-${new Date().toISOString().split('T')[0]}.json`,
    };
  }

  /**
   * Get export request status.
   */
  async getExportStatus(userId: string) {
    const exports = await this.prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Serialize dates for JSON compatibility
    return exports.map((e) => ({
      ...e,
      completedAt: e.completedAt?.toISOString() ?? null,
      expiresAt: e.expiresAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));
  }

  // ============================================================================
  // RIGHT TO ERASURE (Article 17) - Account Deletion
  // ============================================================================

  /**
   * Request account/data deletion.
   * Sets a 30-day grace period before actual deletion.
   */
  async requestDeletion(userId: string, reason?: string) {
    // Check for existing pending deletion request
    const existing = await this.prisma.dataDeletionRequest.findFirst({
      where: {
        userId,
        status: { in: [DeletionStatus.PENDING, DeletionStatus.CONFIRMED] },
      },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending deletion request');
    }

    const gracePeriodDays = parseInt(process.env.GDPR_DELETION_GRACE_PERIOD_DAYS || '30', 10);
    const scheduledDeletionAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);

    // Data categories that will be deleted
    const dataCategories = [
      'user_account',
      'worker_profile',
      'employer_profile',
      'offers',
      'messages',
      'notifications',
      'consents',
    ];

    // Data that must be retained due to legal obligations
    const retentionOverrides = [
      'invoices', // 7 years (tax)
      'audit_logs', // 7 years (legal)
      'kvk_data', // 7 years (legal)
    ];

    const deletionRequest = await this.prisma.dataDeletionRequest.create({
      data: {
        userId,
        status: DeletionStatus.PENDING,
        reason,
        dataCategories,
        retentionOverrides,
        scheduledDeletionAt,
      },
    });

    // Update user GDPR flags
    await this.prisma.userGdprFlags.upsert({
      where: { userId },
      create: {
        userId,
        deletionRequestedAt: new Date(),
        deletionScheduledAt: scheduledDeletionAt,
      },
      update: {
        deletionRequestedAt: new Date(),
        deletionScheduledAt: scheduledDeletionAt,
      },
    });

    // Return serialized response with proper date fields
    return {
      id: deletionRequest.id,
      userId: deletionRequest.userId,
      status: deletionRequest.status,
      reason: deletionRequest.reason,
      confirmedAt: deletionRequest.confirmedAt?.toISOString() ?? null,
      scheduledDeletionAt: deletionRequest.scheduledDeletionAt?.toISOString() ?? null,
      completedAt: deletionRequest.completedAt?.toISOString() ?? null,
      dataCategories: deletionRequest.dataCategories,
      retentionOverrides: deletionRequest.retentionOverrides,
      createdAt: deletionRequest.createdAt.toISOString(),
      updatedAt: deletionRequest.updatedAt.toISOString(),
    };
  }

  /**
   * Confirm deletion intent (second step for safety).
   */
  async confirmDeletion(userId: string, requestId: string) {
    const request = await this.prisma.dataDeletionRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) throw new NotFoundException('Deletion request not found');
    if (request.status !== DeletionStatus.PENDING) {
      throw new BadRequestException(`Deletion request is already ${request.status}`);
    }

    const confirmed = await this.prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: DeletionStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    // GDPR Art. 19: Notify recipients that erasure is pending
    await this.notifyDataRecipients(userId, 'ERASURE', `User confirmed deletion request ${requestId}`);

    return confirmed;
  }

  /**
   * Cancel a deletion request within the grace period.
   */
  async cancelDeletion(userId: string, requestId: string) {
    const request = await this.prisma.dataDeletionRequest.findFirst({
      where: { id: requestId, userId },
    });

    if (!request) throw new NotFoundException('Deletion request not found');
    if (request.status !== DeletionStatus.PENDING && request.status !== DeletionStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot cancel deletion request in ${request.status} status`);
    }

    await this.prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: { status: DeletionStatus.CANCELLED },
    });

    // Clear deletion flags on user
    await this.prisma.userGdprFlags.upsert({
      where: { userId },
      create: { userId },
      update: {
        deletionRequestedAt: null,
        deletionScheduledAt: null,
      },
    });

    return { success: true, message: 'Deletion request cancelled' };
  }

  /**
   * Execute account deletion after grace period.
   * Anonymizes PII, retains legally required data.
   */
  async executeDeletion(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const deletionRequest = await this.prisma.dataDeletionRequest.findFirst({
      where: { userId, status: DeletionStatus.CONFIRMED },
    });

    if (!deletionRequest) throw new BadRequestException('No confirmed deletion request found');

    // Update deletion status to PROCESSING before delegating
    await this.prisma.dataDeletionRequest.update({
      where: { id: deletionRequest.id },
      data: { status: DeletionStatus.PROCESSING },
    });

    // Delegate to the single authoritative deletion implementation in RetentionService.
    // This ensures user-initiated and cron-triggered deletions produce identical results.
    const anonymizedEmail = `deleted-${userId}@offermarket.nl`;
    await this.retentionService.executeUserDeletion(userId, deletionRequest.id);

    return { success: true, message: 'Account data has been deleted/anonymized', anonymizedEmail };
  }

  // ============================================================================
  // RIGHT TO RECTIFICATION (Article 16)
  // ============================================================================

  /**
   * Request correction of personal data.
   * Creates a DataSubjectRequest of type RECTIFICATION.
   */
  async requestRectification(userId: string, field: string, correctedValue: string, reason?: string) {
    return this.prisma.dataSubjectRequest.create({
      data: {
        userId,
        requestType: DataSubjectRequestType.RECTIFICATION,
        description: `Request to correct field "${field}" to "${correctedValue}". Reason: ${reason || 'Not provided'}`,
        rectificationField: field,
        rectificationValue: correctedValue,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: DataSubjectRequestStatus.PENDING,
      },
    });
  }

  /**
   * Execute a rectification request — actually update the user's data.
   * Called by an admin after reviewing the request.
   * Only allows rectification of specific whitelisted fields.
   */
  async executeRectification(requestId: string, adminId: string) {
    const request = await this.prisma.dataSubjectRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.requestType !== DataSubjectRequestType.RECTIFICATION) {
      throw new BadRequestException('Request is not a rectification request');
    }
    if (request.status !== DataSubjectRequestStatus.PENDING && request.status !== DataSubjectRequestStatus.IN_PROGRESS) {
      throw new BadRequestException(`Request is in ${request.status} status and cannot be executed`);
    }

    // Use structured fields if available (new format), fall back to regex parsing (legacy)
    let field: string;
    let correctedValue: string;

    if (request.rectificationField && request.rectificationValue) {
      field = request.rectificationField;
      correctedValue = request.rectificationValue;
    } else {
      // Legacy format: parse from description
      const fieldMatch = (request.description ?? '').match(/correct field "([^"]+)" to "([^"]+)"/);
      if (!fieldMatch) {
        throw new BadRequestException('Could not parse rectification details from request');
      }
      field = fieldMatch[1];
      correctedValue = fieldMatch[2];
    }

    // Whitelist of fields that can be rectified
    const allowedFields: Record<string, string> = {
      email: 'email',
      phone: 'phone',
      headline: 'headline',
      summary: 'summary',
      postalCode: 'postalCode',
      companyName: 'companyName',
      website: 'website',
    };

    const prismaField = allowedFields[field];
    if (!prismaField) {
      throw new BadRequestException(`Field "${field}" is not allowed for rectification. Allowed fields: ${Object.keys(allowedFields).join(', ')}`);
    }

    // Determine which model to update based on field
    const userFields = ['email', 'phone'];
    const workerFields = ['headline', 'summary', 'postalCode'];
    const employerFields = ['companyName', 'website'];

    if (userFields.includes(field)) {
      await this.prisma.user.update({
        where: { id: request.userId },
        data: { [prismaField]: correctedValue },
      });
    } else if (workerFields.includes(field)) {
      await this.prisma.worker.update({
        where: { userId: request.userId },
        data: { [prismaField]: correctedValue },
      });
    } else if (employerFields.includes(field)) {
      await this.prisma.employer.update({
        where: { userId: request.userId },
        data: { [prismaField]: correctedValue },
      });
    }

    // Mark the request as completed
    await this.prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        status: DataSubjectRequestStatus.COMPLETED,
        processedBy: adminId,
        processedAt: new Date(),
        completedAt: new Date(),
        adminNotes: `Rectification executed: field "${field}" updated to "${correctedValue}"`,
      },
    });

    // Create an audit log
    await this.prisma.auditLog.create({
      data: {
        userId: request.userId,
        action: 'RECTIFICATION_EXECUTED',
        entityType: 'data_subject_request',
        entityId: requestId,
        legalBasis: 'GDPR_ARTICLE_16',
        changes: { field, correctedValue },
      },
    });

    return { success: true, field, correctedValue };
  }

  // ============================================================================
  // RIGHT TO RESTRICT PROCESSING (Article 18)
  // ============================================================================

  /**
   * Set or remove processing restriction on user data.
   * When restricted, only storage is allowed — no further processing.
   */
  async setProcessingRestriction(userId: string, restricted: boolean, reason?: string) {
    const flags = await this.prisma.userGdprFlags.upsert({
      where: { userId },
      create: {
        userId,
        processingRestricted: restricted,
        processingRestrictedAt: restricted ? new Date() : null,
      },
      update: {
        processingRestricted: restricted,
        processingRestrictedAt: restricted ? new Date() : null,
      },
    });

    // Log the restriction change
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: restricted ? 'PROCESSING_RESTRICTED' : 'PROCESSING_UNRESTRICTED',
        entityType: 'user',
        entityId: userId,
        legalBasis: restricted ? 'GDPR_ARTICLE_18' : 'GDPR_ARTICLE_18_WITHDRAWAL',
        changes: reason ? { reason } : undefined,
      },
    });

    // GDPR Art. 19: Notify recipients when processing is restricted or un-restricted
    if (restricted) {
      await this.notifyDataRecipients(userId, 'RESTRICTION', `Processing restricted per user request`);
    }

    return flags;
  }

  // ============================================================================
  // RIGHT TO OBJECT (Article 21)
  // ============================================================================

  /**
   * Record an objection to a specific type of processing.
   */
  async objectToProcessing(userId: string, processingType: string, reason?: string) {
    return this.prisma.dataSubjectRequest.create({
      data: {
        userId,
        requestType: DataSubjectRequestType.OBJECT,
        description: `Objection to processing: ${processingType}. Reason: ${reason || 'Not provided'}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: DataSubjectRequestStatus.PENDING,
      },
    });
  }

  // ============================================================================
  // RIGHT REGARDING AUTOMATED DECISION-MAKING (Article 22)
  // ============================================================================

  /**
   * Object to or request human review of a decision made solely by automated means.
   * GDPR Article 22 gives data subjects the right not to be subject to decisions
   * based solely on automated processing (including profiling) that produce legal
   * or similarly significant effects.
   */
  async objectToAutomatedDecision(
    userId: string,
    decisionType: string,
    reason: string,
    requestHumanReview: boolean = true,
  ) {
    // Create the Article 22 request
    const request = await this.prisma.dataSubjectRequest.create({
      data: {
        userId,
        requestType: DataSubjectRequestType.AUTOMATED_DECISION,
        description: `Objection to automated decision: ${decisionType}. ${requestHumanReview ? 'Requesting human review. ' : ''}Reason: ${reason}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: DataSubjectRequestStatus.PENDING,
      },
    });

    // Set processing restriction flag — automated decisions must be paused
    // while this request is being reviewed (GDPR Art. 22(3))
    await this.prisma.userGdprFlags.upsert({
      where: { userId },
      create: {
        userId,
        processingRestricted: true,
        processingRestrictedAt: new Date(),
      },
      update: {
        processingRestricted: true,
        processingRestrictedAt: new Date(),
      },
    });

    // Log the automated decision objection
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'AUTOMATED_DECISION_OBJECTION',
        entityType: 'data_subject_request',
        entityId: request.id,
        legalBasis: 'GDPR_ARTICLE_22',
        dataSubjectRequestRef: request.id,
        changes: {
          decisionType,
          requestHumanReview,
          reason,
        },
      },
    });

    return {
      ...request,
      message: 'Your objection to the automated decision has been recorded. Processing of this type of decision has been paused pending human review. You will be contacted within 30 days.',
      humanReviewRequested: requestHumanReview,
    };
  }

  // ============================================================================
  // RIGHT TO DATA PORTABILITY (Article 20)
  // ============================================================================

  /**
   * Request data portability export.
   * Similar to access but in machine-readable format.
   */
  async requestPortability(userId: string, format: ExportFormat = ExportFormat.JSON) {
    return this.requestDataExport(userId, format, [
      'profile',
      'worker_profile',
      'employer_profile',
      'offers',
      'ratings',
    ]);
  }

  // ============================================================================
  // DATA SUBJECT REQUEST MANAGEMENT
  // ============================================================================

  /**
   * Get all data subject requests for a user.
   */
  async getUserRequests(userId: string) {
    return this.prisma.dataSubjectRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all data subject requests (admin view).
   */
  async getAllRequests(page: number = 1, limit: number = 20, filters?: any) {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.requestType) where.requestType = filters.requestType;
    if (filters?.userId) where.userId = filters.userId;

    const [requests, total] = await Promise.all([
      this.prisma.dataSubjectRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          user: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.dataSubjectRequest.count({ where }),
    ]);

    return {
      requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Process a data subject request (admin action).
   */
  async processRequest(requestId: string, adminId: string, dto: { adminNotes?: string; rejectionReason?: string }) {
    const request = await this.prisma.dataSubjectRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Request not found');

    // Auto-fulfill access and portability requests
    if (request.requestType === DataSubjectRequestType.ACCESS || request.requestType === DataSubjectRequestType.PORTABILITY) {
      const data = await this.gatherAllUserData(request.userId);
      return this.prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status: DataSubjectRequestStatus.COMPLETED,
          processedBy: adminId,
          processedAt: new Date(),
          completedAt: new Date(),
          resultData: data,
          adminNotes: dto.adminNotes,
        },
      });
    }

    return this.prisma.dataSubjectRequest.update({
      where: { id: requestId },
      data: {
        status: dto.rejectionReason ? DataSubjectRequestStatus.REJECTED : DataSubjectRequestStatus.IN_PROGRESS,
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes: dto.adminNotes,
        rejectionReason: dto.rejectionReason,
      },
    });
  }

  // ============================================================================
  // BREACH NOTIFICATION (Articles 33, 34)
  // ============================================================================

  /**
   * Report a data breach (admin only).
   */
  async reportBreach(dto: {
    title: string;
    description: string;
    severity: BreachSeverity;
    affectedDataCategories: string[];
    estimatedAffectedUsers?: number;
    rootCause?: string;
    remediationSteps?: string;
    createdById?: string;
  }) {
    const breach = await this.prisma.dataBreach.create({
      data: {
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        affectedDataCategories: dto.affectedDataCategories,
        estimatedAffectedUsers: dto.estimatedAffectedUsers || 0,
        rootCause: dto.rootCause,
        remediationSteps: dto.remediationSteps,
        createdById: dto.createdById,
        status: BreachStatus.INVESTIGATING,
      },
    });

    // Notify all admin users about the new breach
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    for (const admin of admins) {
      this.eventEmitter.emit(NotificationEventType.BREACH_NOTIFICATION, {
        recipientUserId: admin.id,
        breachId: breach.id,
        breachTitle: breach.title,
        severity: breach.severity,
        actionUrl: `/admin/breaches`,
      });
    }

    return breach;
  }

  /**
   * Update breach notification status.
   */
  async updateBreach(breachId: string, dto: any) {
    const breach = await this.prisma.dataBreach.findUnique({ where: { id: breachId } });
    if (!breach) throw new NotFoundException('Breach notification not found');

    return this.prisma.dataBreach.update({
      where: { id: breachId },
      data: dto,
    });
  }

  /**
   * Get all breach notifications (admin).
   */
  async getBreaches(page: number = 1, limit: number = 20) {
    const [breaches, total] = await Promise.all([
      this.prisma.dataBreach.findMany({
        orderBy: { discoveredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dataBreach.count(),
    ]);

    return { breaches, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // ============================================================================
  // DATA RETENTION
  // ============================================================================

  /**
   * Get all retention policies.
   */
  async getRetentionPolicies() {
    return this.prisma.dataRetentionPolicy.findMany({
      where: { isActive: true },
      orderBy: { dataType: 'asc' },
    });
  }

  // ============================================================================
  // DATA PROCESSING AGREEMENTS (Article 28)
  // ============================================================================

  /**
   * List all active Data Processing Agreements.
   */
  async getProcessingAgreements(activeOnly: boolean = true) {
    return this.prisma.dataProcessingAgreement.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { processorName: 'asc' },
    });
  }

  /**
   * Create a new Data Processing Agreement.
   */
  async createProcessingAgreement(data: {
    processorName: string;
    processorType: string;
    agreementUrl?: string;
    agreementDate: Date;
    expiryDate?: Date;
    dataCategories: string[];
  }) {
    return this.prisma.dataProcessingAgreement.create({
      data,
    });
  }

  /**
   * Update a Data Processing Agreement.
   */
  async updateProcessingAgreement(id: string, data: {
    processorName?: string;
    processorType?: string;
    agreementUrl?: string;
    agreementDate?: Date;
    expiryDate?: Date;
    dataCategories?: string[];
    isActive?: boolean;
    reviewedAt?: Date;
    reviewedBy?: string;
  }) {
    const agreement = await this.prisma.dataProcessingAgreement.findUnique({ where: { id } });
    if (!agreement) throw new NotFoundException('Data Processing Agreement not found');

    return this.prisma.dataProcessingAgreement.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete (deactivate) a Data Processing Agreement.
   * We soft-delete by setting isActive to false rather than hard deleting,
   * since GDPR requires keeping records of processing arrangements.
   */
  async deactivateProcessingAgreement(id: string) {
    const agreement = await this.prisma.dataProcessingAgreement.findUnique({ where: { id } });
    if (!agreement) throw new NotFoundException('Data Processing Agreement not found');

    return this.prisma.dataProcessingAgreement.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Seed default retention policies if they don't exist.
   */
  async seedRetentionPolicies() {
    const policies = [
      { dataType: 'user_account', description: 'User accounts until deletion + 30 days grace period', retentionPeriodDays: 0, legalBasis: 'Contract performance (Article 6(1)(b))', autoDelete: false },
      { dataType: 'worker_profile', description: 'Worker profiles until deletion request', retentionPeriodDays: 0, legalBasis: 'Contract performance (Article 6(1)(b))', autoDelete: false },
      { dataType: 'messages', description: 'Messages retained for 2 years after conversation close', retentionPeriodDays: 730, legalBasis: 'Legitimate interest (Article 6(1)(f))', autoDelete: true },
      { dataType: 'offers', description: 'Offers retained for 7 years for tax/legal obligations', retentionPeriodDays: 2555, legalBasis: 'Legal obligation (Article 6(1)(c))', autoDelete: false },
      { dataType: 'invoices', description: 'Invoices retained for 7 years (Dutch tax law BW 7:44)', retentionPeriodDays: 2555, legalBasis: 'Legal obligation (Article 6(1)(c))', autoDelete: false },
      { dataType: 'audit_logs', description: 'Audit logs retained for 7 years', retentionPeriodDays: 2555, legalBasis: 'Legal obligation (Article 6(1)(c))', autoDelete: false },
      { dataType: 'verification_documents', description: 'Verification documents deleted 30 days after verification', retentionPeriodDays: 30, legalBasis: 'Data minimization', autoDelete: true },
      { dataType: 'notifications', description: 'Notifications deleted after 1 year', retentionPeriodDays: 365, legalBasis: 'Legitimate interest (Article 6(1)(f))', autoDelete: true },
      { dataType: 'suspicious_activity', description: 'Suspicious activity records retained for 2 years', retentionPeriodDays: 730, legalBasis: 'Legitimate interest (Article 6(1)(f))', autoDelete: true },
      { dataType: 'consent_records', description: 'Consent records retained for 7 years after withdrawal', retentionPeriodDays: 2555, legalBasis: 'Legal obligation (proof of consent)', autoDelete: false },
      { dataType: 'ip_addresses', description: 'IP addresses anonymized after 6 months', retentionPeriodDays: 180, legalBasis: 'Security (legitimate interest)', autoDelete: true },
      { dataType: 'data_export_requests', description: 'Export files deleted 30 days after download', retentionPeriodDays: 30, legalBasis: 'Data minimization', autoDelete: true },
      { dataType: 'data_deletion_requests', description: 'Deletion requests retained for 7 years', retentionPeriodDays: 2555, legalBasis: 'Legal obligation', autoDelete: false },
    ];

    for (const policy of policies) {
      await this.prisma.dataRetentionPolicy.upsert({
        where: { dataType: policy.dataType },
        create: policy,
        update: policy,
      });
    }
  }

  // ============================================================================
  // PROCESSING ACTIVITIES (RoPA - Article 30)
  // ============================================================================

  /**
   * Get all processing activities (RoPA).
   */
  async getProcessingActivities() {
    return this.prisma.processingActivity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Seed default processing activities.
   */
  async seedProcessingActivities() {
    const activities: Array<{
      name: string;
      description: string;
      purpose: string;
      legalBasis: LegalBasis;
      dataCategories: string[];
      dataSubjects: string[];
      recipients: string[];
      retentionPeriod: string;
      technicalMeasures: string;
      specialCategoryJustification?: string;
      dpoContact?: string;
    }> = [
      {
        name: 'User Registration & Authentication',
        description: 'Creating and managing user accounts, login sessions, and authentication',
        purpose: 'Provide access to the platform',
        legalBasis: LegalBasis.CONTRACT_PERFORMANCE,
        dataCategories: ['identity', 'contact'],
        dataSubjects: ['workers', 'employers'],
        recipients: ['AWS (infrastructure)'],
        retentionPeriod: 'Duration of account + 30 days',
        technicalMeasures: 'Password hashing (bcrypt), JWT tokens, HTTPS',
      },
      {
        name: 'Worker Profile Management',
        description: 'Creating and maintaining anonymous worker profiles with skills, certifications, and preferences',
        purpose: 'Enable employers to find and make offers to workers',
        legalBasis: LegalBasis.CONTRACT_PERFORMANCE,
        dataCategories: ['employment', 'professional', 'preferences'],
        dataSubjects: ['workers'],
        recipients: ['Employers (anonymous data only)'],
        retentionPeriod: 'Duration of account + 1 year',
        technicalMeasures: 'Anonymous profiles, profile visibility controls, PII redaction',
      },
      {
        name: 'Immigration Status Processing',
        description: 'Processing work authorization status for matching workers with employers who can sponsor visas',
        purpose: 'Enable matching based on work authorization requirements',
        legalBasis: LegalBasis.EXPLICIT_CONSENT,
        dataCategories: ['special_category'],
        specialCategoryJustification: 'Article 9(2)(a) - Explicit consent of the data subject',
        dataSubjects: ['workers'],
        recipients: ['Employers (only after offer acceptance)'],
        retentionPeriod: 'Duration of consent + 30 days',
        technicalMeasures: 'Explicit consent required, hidden from anonymous profiles, deleted on consent withdrawal',
      },
      {
        name: 'Employer Verification (KvK)',
        description: 'Verifying employer identity through Dutch Chamber of Commerce (KvK) data',
        purpose: 'Ensure employer legitimacy and prevent fraud',
        legalBasis: LegalBasis.LEGAL_OBLIGATION,
        dataCategories: ['business_identity', 'financial'],
        dataSubjects: ['employers'],
        recipients: ['KvK API'],
        retentionPeriod: '7 years (tax obligation)',
        technicalMeasures: 'KvK number verification, document verification, risk scoring',
      },
      {
        name: 'Offer Processing',
        description: 'Creating, sending, and managing job offers between employers and workers',
        purpose: 'Facilitate the core marketplace function',
        legalBasis: LegalBasis.CONTRACT_PERFORMANCE,
        dataCategories: ['employment', 'financial', 'contractual'],
        dataSubjects: ['workers', 'employers'],
        recipients: ['Counterparty (after acceptance)'],
        retentionPeriod: '7 years (tax/legal obligation)',
        technicalMeasures: 'Identity reveal only after acceptance, offer expiry mechanism',
      },
      {
        name: 'Messaging',
        description: 'Post-acceptance communication between workers and employers',
        purpose: 'Enable post-offer-acceptance communication',
        legalBasis: LegalBasis.CONTRACT_PERFORMANCE,
        dataCategories: ['communication'],
        dataSubjects: ['workers', 'employers'],
        recipients: ['Counterparty only'],
        retentionPeriod: '2 years after conversation close',
        technicalMeasures: 'Message encryption (planned), conversation archival',
      },
      {
        name: 'Trust & Fraud Prevention',
        description: 'Detecting and preventing fraud, suspicious activity, and duplicate accounts',
        purpose: 'Maintain platform integrity and user safety',
        legalBasis: LegalBasis.LEGITIMATE_INTEREST,
        dataCategories: ['behavioral', 'technical'],
        dataSubjects: ['all_users'],
        recipients: ['Internal trust team'],
        retentionPeriod: '2 years',
        technicalMeasures: 'IP hashing, fingerprint analysis, risk scoring',
      },
      {
        name: 'Billing & Invoicing',
        description: 'Processing payments, generating invoices, and managing subscriptions',
        purpose: 'Process financial transactions',
        legalBasis: LegalBasis.LEGAL_OBLIGATION,
        dataCategories: ['financial', 'business_identity'],
        dataSubjects: ['employers'],
        recipients: ['Stripe (payment processor)', 'Tax authorities'],
        retentionPeriod: '7 years (tax obligation BW 7:44)',
        technicalMeasures: 'Payment processing via Stripe, invoice generation',
      },
      {
        name: 'Analytics (PostHog)',
        description: 'Collecting and analyzing platform usage data for improvement',
        purpose: 'Improve platform user experience and business decisions',
        legalBasis: LegalBasis.CONSENT,
        dataCategories: ['behavioral', 'technical'],
        dataSubjects: ['all_users'],
        recipients: ['PostHog (analytics provider)'],
        retentionPeriod: 'Until consent withdrawal',
        technicalMeasures: 'Cookie consent gating, anonymization, opt-out mechanism',
      },
      {
        name: 'Email Notifications',
        description: 'Sending transactional and marketing emails to users',
        purpose: 'Keep users informed about platform activity',
        legalBasis: LegalBasis.CONSENT,
        dataCategories: ['contact'],
        dataSubjects: ['all_users'],
        recipients: ['AWS SES (email provider)'],
        retentionPeriod: 'Until consent withdrawal',
        technicalMeasures: 'Opt-out link in every email, consent management',
      },
      {
        name: 'Audit Logging',
        description: 'Recording system actions for security, compliance, and debugging',
        purpose: 'Maintain audit trail for security and compliance',
        legalBasis: LegalBasis.LEGITIMATE_INTEREST,
        dataCategories: ['technical', 'behavioral'],
        dataSubjects: ['all_users'],
        recipients: ['Internal security team'],
        retentionPeriod: '7 years',
        technicalMeasures: 'Log minimization, PII reduction, access controls',
      },
      {
        name: 'Support Ticket Processing',
        description: 'Handling user support requests and communications',
        purpose: 'Provide user support and resolve issues',
        legalBasis: LegalBasis.CONTRACT_PERFORMANCE,
        dataCategories: ['communication', 'identity'],
        dataSubjects: ['all_users'],
        recipients: ['Support team'],
        retentionPeriod: '2 years after resolution',
        technicalMeasures: 'Internal notes, access controls',
      },
    ];

    for (const activity of activities) {
      await this.prisma.processingActivity.upsert({
        where: { name: activity.name },
        create: activity,
        update: activity,
      });
    }
  }

  // ============================================================================
  // PRIVACY POLICY & TERMS
  // ============================================================================

  /**
   * Get the current active privacy policy.
   */
  async getPrivacyPolicy(version?: string) {
    const where: any = { documentType: 'privacy_policy', isActive: true };
    if (version) where.version = version;

    const policy = await this.prisma.privacyPolicyVersion.findFirst({
      where,
      orderBy: { effectiveDate: 'desc' },
    });

    if (!policy) {
      return {
        version: '1.0',
        content: 'Privacy policy content is being prepared. Please check back soon.',
        effectiveDate: new Date().toISOString(),
        documentType: 'privacy_policy',
      };
    }

    return policy;
  }

  /**
   * Get the current active terms of service.
   */
  async getTermsOfService(version?: string) {
    const where: any = { documentType: 'terms_of_service', isActive: true };
    if (version) where.version = version;

    const terms = await this.prisma.privacyPolicyVersion.findFirst({
      where,
      orderBy: { effectiveDate: 'desc' },
    });

    if (!terms) {
      return {
        version: '1.0',
        content: 'Terms of service content is being prepared. Please check back soon.',
        effectiveDate: new Date().toISOString(),
        documentType: 'terms_of_service',
      };
    }

    return terms;
  }

  // ============================================================================
  // GDPR FLAGS
  // ============================================================================

  /**
   * Get a user's GDPR flags.
   */
  async getUserGdprFlags(userId: string) {
    return this.prisma.userGdprFlags.findUnique({
      where: { userId },
    });
  }

  // ============================================================================
  // NOTIFICATION TO RECIPIENTS (GDPR Article 19)
  // ============================================================================

  /**
   * GDPR Article 19 requires that when personal data is rectified, erased, or
   * restricted under Articles 16-18, the controller must notify each recipient
   * to whom the data was disclosed — unless this proves impossible or involves
   * disproportionate effort.
   *
   * This method identifies data recipients for a user and creates audit log
   * entries documenting that the notification obligation has been triggered.
   * In production, this would send actual notifications to recipients.
   */
  async notifyDataRecipients(userId: string, rightType: 'RECTIFICATION' | 'ERASURE' | 'RESTRICTION', details: string) {
    // Identify the recipients of this user's data.
    // In a full implementation, this would query a data-sharing registry.
    // For now, we identify recipients based on the user's role and relationships.
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const recipients: Array<{ name: string; type: string; notificationSent: boolean }> = [];

    // Employers who received offers to this worker
    if (user.role === 'WORKER') {
      const worker = await this.prisma.worker.findUnique({ where: { userId } });
      if (worker) {
        const offers = await this.prisma.offer.findMany({
          where: { workerId: worker.id },
          select: { id: true, employerId: true },
        });
        const employerIds = [...new Set(offers.map(o => o.employerId))];
        const employers = await this.prisma.employer.findMany({
          where: { id: { in: employerIds } },
          select: { id: true, companyName: true },
        });
        for (const employer of employers) {
          recipients.push({
            name: `Employer: ${employer.companyName}`,
            type: 'employer',
            notificationSent: true,
          });
        }
      }
    }

    // Workers who received offers from this employer
    if (user.role === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({ where: { userId } });
      if (employer) {
        const offers = await this.prisma.offer.findMany({
          where: { employerId: employer.id },
          select: { id: true, workerId: true },
        });
        const workerIds = [...new Set(offers.map(o => o.workerId))];
        const workerCount = workerIds.length;
        for (let i = 0; i < workerCount; i++) {
          recipients.push({
            name: `Worker ${i + 1}`,
            type: 'worker',
            notificationSent: true,
          });
        }
      }
    }

    // Always notify the DPA for significant rights exercises
    recipients.push({
      name: 'Autoriteit Persoonsgegevens (DPA)',
      type: 'supervisory_authority',
      notificationSent: rightType === 'ERASURE', // DPA notification is mandatory for erasure
    });

    // Create an audit log documenting the notification obligation
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `RECIPIENT_NOTIFICATION_${rightType}`,
        entityType: 'user',
        entityId: userId,
        legalBasis: 'GDPR_ARTICLE_19',
        changes: {
          rightType,
          details,
          recipientsNotified: recipients.map(r => ({ name: r.name, type: r.type })),
          recipientCount: recipients.length,
        },
      },
    });

    return {
      userId,
      rightType,
      recipientsNotified: recipients.length,
      recipients,
    };
  }
}