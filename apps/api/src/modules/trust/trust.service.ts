import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VerificationLevel,
  RiskLevel,
  BackgroundCheckStatus,
  ReferenceCheckStatus,
  SeverityLevel,
  ActivityStatus,
  EntityType,
  DocumentType,
  VerificationStatus,
  IdentityCheckResult,
  FraudIndicatorType,
  DuplicateMatchType,
} from '@prisma/client';
import {
  SubmitEmployerVerificationDto,
  SubmitEmployerDocumentDto,
  ReviewEmployerVerificationDto,
  SubmitWorkerVerificationDto,
  SubmitWorkerDocumentDto,
  SubmitBackgroundCheckDto,
  SubmitReferenceCheckDto,
  ReviewWorkerVerificationDto,
  InitiateIdentityCheckDto,
  SubmitIdentityCheckResultDto,
} from './dto/verification.dto';
import {
  ReportSuspiciousActivityDto,
  ReviewSuspiciousActivityDto,
  CreateFraudIndicatorDto,
  UpdateFraudIndicatorDto,
  DuplicateAccountMatchDto,
  ReviewDuplicateAccountDto,
  AddToBlacklistDto,
  ReviewBlacklistEntryDto,
} from './dto/fraud.dto';
import { CalculateReputationScoreDto, UpdateReputationScoreDto } from './dto/reputation.dto';

/**
 * TRUST SERVICE
 *
 * Comprehensive trust layer for the OfferMarket platform:
 * - Employer verification (KvK, VAT, company documents)
 * - Worker verification (identity, background, references, certifications)
 * - Fraud prevention (suspicious activity, fraud indicators)
 * - Duplicate account prevention
 * - Identity validation
 * - Reputation scoring
 * - Suspicious activity detection
 */
@Injectable()
export class TrustService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // EMPLOYER VERIFICATION
  // ============================================================================

  /**
   * Initialize employer verification record
   */
  async initializeEmployerVerification(employerId: string) {
    const existing = await this.prisma.employerVerification.findUnique({
      where: { employerId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.employerVerification.create({
      data: {
        employerId,
        riskLevel: RiskLevel.UNKNOWN,
        riskScore: 50,
        verificationLevel: VerificationLevel.NONE,
      },
    });
  }

  /**
   * Submit employer verification data (KvK, VAT, company info)
   */
  async submitEmployerVerification(
    employerId: string,
    dto: SubmitEmployerVerificationDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      let verification = await tx.employerVerification.findUnique({
        where: { employerId },
      });

      if (!verification) {
        verification = await tx.employerVerification.create({
          data: {
            employerId,
            riskLevel: RiskLevel.UNKNOWN,
            riskScore: 50,
            verificationLevel: VerificationLevel.NONE,
          },
        });
      }

      const updateData: any = {};

      // Handle KvK verification
      if (dto.kvkNumber) {
        const employer = await tx.employer.findUnique({
          where: { id: employerId },
        });

        if (employer && employer.kvkNumber === dto.kvkNumber) {
          updateData.kvkVerified = true;
          updateData.kvkVerifiedAt = new Date();
          updateData.kvkData = {
            kvkNumber: dto.kvkNumber,
            verifiedAt: new Date(),
            source: 'manual_submission',
          };
        }
      }

      // Handle VAT verification
      if (dto.vatNumber) {
        updateData.vatVerified = true;
        updateData.vatVerifiedAt = new Date();
      }

      // Handle company data verification
      if (dto.companyData) {
        updateData.companyVerified = true;
        updateData.companyVerifiedAt = new Date();
      }

      // Update verification level based on what was submitted
      if (updateData.kvkVerified && updateData.vatVerified) {
        updateData.verificationLevel = VerificationLevel.BASIC;
      }

      if (Object.keys(updateData).length > 0) {
        verification = await tx.employerVerification.update({
          where: { employerId },
          data: updateData,
        });

        // Log the verification submission
        await tx.verificationLog.create({
          data: {
            entityType: 'EMPLOYER',
            entityId: employerId,
            action: 'SUBMITTED',
            newStatus: 'PENDING',
            reason: 'Verification data submitted',
            metadata: { submittedData: Object.keys(updateData) },
          },
        });
      }

      return verification;
    });
  }

  /**
   * Submit employer verification document
   */
  async submitEmployerDocument(
    employerId: string,
    dto: SubmitEmployerDocumentDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.employerVerification.findUnique({
        where: { employerId },
      });

      if (!verification) {
        throw new NotFoundException('Employer verification record not found');
      }

      const document = await tx.verificationDocument.create({
        data: {
          entityType: 'EMPLOYER',
          entityId: employerId,
          documentType: dto.documentType as DocumentType,
          documentSubtype: dto.documentSubtype,
          fileUrl: dto.fileUrl,
          fileHash: dto.fileHash,
          mimeType: dto.metadata?.['mimeType'] || 'application/pdf',
          metadata: dto.metadata,
        },
      });

      // Log the document submission
      await tx.verificationLog.create({
        data: {
          entityType: 'EMPLOYER',
          entityId: employerId,
          action: 'SUBMITTED',
          newStatus: 'PENDING',
          reason: `Document submitted: ${dto.documentType}`,
          performedBy: userId,
        },
      });

      return document;
    });
  }

  /**
   * Review employer verification (admin function)
   */
  async reviewEmployerVerification(
    employerId: string,
    dto: ReviewEmployerVerificationDto,
    adminUserId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.employerVerification.findUnique({
        where: { employerId },
      });

      if (!verification) {
        throw new NotFoundException('Employer verification record not found');
      }

      const updateData: any = {
        verificationLevel: dto.verificationLevel,
        lastReviewAt: new Date(),
        lastReviewBy: adminUserId,
        rejectionReason: dto.rejectionReason,
        notes: dto.notes,
      };

      if (dto.isApproved) {
        // Update employer verification status
        const employerUpdate: any = {
          verificationStatus:
            dto.verificationLevel === VerificationLevel.PREMIUM
              ? 'PREMIUM_VERIFIED'
              : 'BASIC_VERIFIED',
          verifiedAt: new Date(),
          verifiedBy: adminUserId,
        };

        await tx.employer.update({
          where: { id: employerId },
          data: employerUpdate,
        });

        // Update risk level
        updateData.riskLevel = RiskLevel.LOW;
        updateData.riskScore = Math.max(0, verification.riskScore - 20);
      } else {
        updateData.riskLevel = RiskLevel.HIGH;
        updateData.riskScore = Math.min(100, verification.riskScore + 30);
      }

      const updated = await tx.employerVerification.update({
        where: { employerId },
        data: updateData,
      });

      // Log the review
      await tx.verificationLog.create({
        data: {
          entityType: 'EMPLOYER',
          entityId: employerId,
          action: dto.isApproved ? 'APPROVED' : 'REJECTED',
          previousStatus: VerificationStatus.PENDING,
          newStatus: dto.isApproved ? VerificationStatus.VERIFIED : VerificationStatus.REVOKED,
          reason: dto.rejectionReason || dto.notes,
          performedBy: adminUserId,
          performedById: adminUserId,
        },
      });

      return updated;
    });
  }

  /**
   * Get employer verification status
   */
  async getEmployerVerification(employerId: string) {
    const verification = await this.prisma.employerVerification.findUnique({
      where: { employerId },
      include: {
        verificationDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        verificationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!verification) {
      return this.initializeEmployerVerification(employerId);
    }

    return verification;
  }

  // ============================================================================
  // WORKER VERIFICATION
  // ============================================================================

  /**
   * Initialize worker verification record
   */
  async initializeWorkerVerification(workerId: string) {
    const existing = await this.prisma.workerVerification.findUnique({
      where: { workerId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.workerVerification.create({
      data: {
        workerId,
        riskLevel: RiskLevel.UNKNOWN,
        riskScore: 50,
        verificationLevel: VerificationLevel.NONE,
        backgroundCheckStatus: BackgroundCheckStatus.NOT_STARTED,
        referenceCheckStatus: ReferenceCheckStatus.NOT_STARTED,
      },
    });
  }

  /**
   * Submit worker verification data
   */
  async submitWorkerVerification(
    workerId: string,
    dto: SubmitWorkerVerificationDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      let verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        verification = await tx.workerVerification.create({
          data: {
            workerId,
            riskLevel: RiskLevel.UNKNOWN,
            riskScore: 50,
            verificationLevel: VerificationLevel.NONE,
            backgroundCheckStatus: BackgroundCheckStatus.NOT_STARTED,
            referenceCheckStatus: ReferenceCheckStatus.NOT_STARTED,
          },
        });
      }

      const updateData: any = {};

      if (dto.identityMethod) {
        updateData.identityMethod = dto.identityMethod;
      }

      if (Object.keys(updateData).length > 0) {
        verification = await tx.workerVerification.update({
          where: { workerId },
          data: updateData,
        });

        await tx.verificationLog.create({
          data: {
            entityType: 'WORKER',
            entityId: workerId,
            action: 'SUBMITTED',
            newStatus: 'PENDING',
            reason: 'Verification data submitted',
            performedBy: userId,
          },
        });
      }

      return verification;
    });
  }

  /**
   * Submit worker verification document
   */
  async submitWorkerDocument(
    workerId: string,
    dto: SubmitWorkerDocumentDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        throw new NotFoundException('Worker verification record not found');
      }

      const document = await tx.verificationDocument.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          documentType: dto.documentType as DocumentType,
          documentSubtype: dto.documentSubtype,
          fileUrl: dto.fileUrl,
          fileHash: dto.fileHash,
          mimeType: dto.metadata?.['mimeType'] || 'application/pdf',
          metadata: dto.metadata,
        },
      });

      await tx.verificationLog.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          action: 'SUBMITTED',
          newStatus: 'PENDING',
          reason: `Document submitted: ${dto.documentType}`,
          performedBy: userId,
        },
      });

      return document;
    });
  }

  /**
   * Initiate identity check for worker
   */
  async initiateIdentityCheck(
    workerId: string,
    dto: InitiateIdentityCheckDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        throw new NotFoundException('Worker verification record not found');
      }

      const identityCheck = await tx.identityCheck.create({
        data: {
          workerId,
          checkType: dto.checkType as any,
          provider: dto.provider,
          status: VerificationStatus.PENDING,
          requestPayload: dto.payload,
        },
      });

      await tx.verificationLog.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          action: 'SUBMITTED',
          newStatus: 'PENDING',
          reason: `Identity check initiated: ${dto.checkType}`,
          performedBy: userId,
        },
      });

      return identityCheck;
    });
  }

  /**
   * Submit identity check result
   */
  async submitIdentityCheckResult(
    workerId: string,
    checkId: string,
    dto: SubmitIdentityCheckResultDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const identityCheck = await tx.identityCheck.findUnique({
        where: { id: checkId },
      });

      if (!identityCheck) {
        throw new NotFoundException('Identity check not found');
      }

      const updateData: any = {
        status:
          dto.result === 'PASS'
            ? VerificationStatus.VERIFIED
            : VerificationStatus.REVOKED,
        result: dto.result as IdentityCheckResult,
        confidenceScore: dto.confidenceScore,
        failureReason: dto.failureReason,
        responsePayload: dto.responsePayload,
        checkedAt: new Date(),
      };

      const updated = await tx.identityCheck.update({
        where: { id: checkId },
        data: updateData,
      });

      // Update worker verification if check passed
      if (dto.result === 'PASS') {
        await tx.workerVerification.update({
          where: { workerId },
          data: {
            identityVerified: true,
            identityVerifiedAt: new Date(),
          },
        });
      }

      return updated;
    });
  }

  /**
   * Submit background check for worker
   */
  async submitBackgroundCheck(
    workerId: string,
    dto: SubmitBackgroundCheckDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        throw new NotFoundException('Worker verification record not found');
      }

      const updateData: any = {
        backgroundCheckStatus: BackgroundCheckStatus.IN_PROGRESS,
      };

      if (dto.provider) {
        updateData.notes = `Provider: ${dto.provider}`;
      }

      const updated = await tx.workerVerification.update({
        where: { workerId },
        data: updateData,
      });

      await tx.verificationLog.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          action: 'SUBMITTED',
          newStatus: VerificationStatus.PENDING,
          reason: 'Background check initiated',
          performedBy: userId,
        },
      });

      return updated;
    });
  }

  /**
   * Complete background check for worker
   */
  async completeBackgroundCheck(
    workerId: string,
    status: BackgroundCheckStatus,
    adminUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        throw new NotFoundException('Worker verification record not found');
      }

      const updateData: any = {
        backgroundCheckStatus: status,
        backgroundCheckAt: new Date(),
      };

      if (status === BackgroundCheckStatus.CLEAR) {
        updateData.verificationLevel = VerificationLevel.ENHANCED;
        updateData.riskLevel = RiskLevel.LOW;
        updateData.riskScore = Math.max(0, verification.riskScore - 25);
      } else if (
        status === BackgroundCheckStatus.FLAGS_FOUND ||
        status === BackgroundCheckStatus.FAILED
      ) {
        updateData.riskLevel = RiskLevel.HIGH;
        updateData.riskScore = Math.min(100, verification.riskScore + 40);
      }

      const updated = await tx.workerVerification.update({
        where: { workerId },
        data: updateData,
      });

      await tx.verificationLog.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          action: 'REVIEWED',
          previousStatus: VerificationStatus.PENDING,
          newStatus: status === BackgroundCheckStatus.CLEAR ? VerificationStatus.VERIFIED : VerificationStatus.REVOKED,
          reason: 'Background check completed',
          performedBy: adminUserId,
          performedById: adminUserId,
        },
      });

      return updated;
    });
  }

  /**
   * Submit reference check for worker
   */
  async submitReferenceCheck(
    workerId: string,
    dto: SubmitReferenceCheckDto,
    userId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        throw new NotFoundException('Worker verification record not found');
      }

      const updateData: any = {
        referenceCheckStatus: ReferenceCheckStatus.IN_PROGRESS,
      };

      const updated = await tx.workerVerification.update({
        where: { workerId },
        data: updateData,
      });

      await tx.verificationLog.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          action: 'SUBMITTED',
          newStatus: VerificationStatus.PENDING,
          reason: 'Reference check initiated',
          performedBy: userId,
        },
      });

      return updated;
    });
  }

  /**
   * Complete reference check for worker
   */
  async completeReferenceCheck(
    workerId: string,
    status: ReferenceCheckStatus,
    adminUserId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        throw new NotFoundException('Worker verification record not found');
      }

      const updateData: any = {
        referenceCheckStatus: status,
        referenceCheckAt: new Date(),
      };

      if (status === ReferenceCheckStatus.POSITIVE) {
        updateData.verificationLevel = VerificationLevel.STANDARD;
        updateData.riskLevel = RiskLevel.LOW;
        updateData.riskScore = Math.max(0, verification.riskScore - 15);
      } else if (
        status === ReferenceCheckStatus.NEGATIVE ||
        status === ReferenceCheckStatus.FAILED
      ) {
        updateData.riskLevel = RiskLevel.HIGH;
        updateData.riskScore = Math.min(100, verification.riskScore + 30);
      }

      const updated = await tx.workerVerification.update({
        where: { workerId },
        data: updateData,
      });

      await tx.verificationLog.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          action: 'REVIEWED',
          previousStatus: VerificationStatus.PENDING,
          newStatus: status === ReferenceCheckStatus.POSITIVE ? VerificationStatus.VERIFIED : VerificationStatus.REVOKED,
          reason: 'Reference check completed',
          performedBy: adminUserId,
          performedById: adminUserId,
        },
      });

      return updated;
    });
  }

  /**
   * Review worker verification (admin function)
   */
  async reviewWorkerVerification(
    workerId: string,
    dto: ReviewWorkerVerificationDto,
    adminUserId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const verification = await tx.workerVerification.findUnique({
        where: { workerId },
      });

      if (!verification) {
        throw new NotFoundException('Worker verification record not found');
      }

      const updateData: any = {
        verificationLevel: dto.verificationLevel,
        lastReviewAt: new Date(),
        lastReviewBy: adminUserId,
        rejectionReason: dto.rejectionReason,
        notes: dto.notes,
      };

      if (dto.isApproved) {
        updateData.riskLevel =
          dto.verificationLevel === VerificationLevel.PREMIUM
            ? RiskLevel.VERY_LOW
            : RiskLevel.LOW;
        updateData.riskScore = Math.max(0, verification.riskScore - 20);
      } else {
        updateData.riskLevel = RiskLevel.HIGH;
        updateData.riskScore = Math.min(100, verification.riskScore + 30);
      }

      const updated = await tx.workerVerification.update({
        where: { workerId },
        data: updateData,
      });

      await tx.verificationLog.create({
        data: {
          entityType: 'WORKER',
          entityId: workerId,
          action: dto.isApproved ? 'APPROVED' : 'REJECTED',
          previousStatus: VerificationStatus.PENDING,
          newStatus: dto.isApproved ? VerificationStatus.VERIFIED : VerificationStatus.REVOKED,
          reason: dto.rejectionReason || dto.notes,
          performedBy: adminUserId,
          performedById: adminUserId,
        },
      });

      return updated;
    });
  }

  /**
   * Get worker verification status
   */
  async getWorkerVerification(workerId: string) {
    const verification = await this.prisma.workerVerification.findUnique({
      where: { workerId },
      include: {
        verificationDocuments: {
          orderBy: { createdAt: 'desc' },
        },
        verificationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        identityChecks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!verification) {
      return this.initializeWorkerVerification(workerId);
    }

    return verification;
  }

  // ============================================================================
  // FRAUD PREVENTION
  // ============================================================================

  /**
   * Report suspicious activity
   */
  async reportSuspiciousActivity(
    dto: ReportSuspiciousActivityDto,
    reporterId?: string,
  ) {
    return this.prisma.suspiciousActivity.create({
      data: {
        entityType: dto.entityType as EntityType,
        entityId: dto.entityId,
        userId: dto.userId,
        activityType: dto.activityType as any,
        severity: dto.severity || SeverityLevel.MEDIUM,
        riskScore: this.calculateActivityRiskScore(dto),
        description: dto.description,
        details: dto.details,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        fingerprint: dto.fingerprint,
        status: ActivityStatus.NEW,
      },
    });
  }

  /**
   * Review suspicious activity
   */
  async reviewSuspiciousActivity(
    activityId: string,
    dto: ReviewSuspiciousActivityDto,
    reviewerId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const activity = await tx.suspiciousActivity.findUnique({
        where: { id: activityId },
      });

      if (!activity) {
        throw new NotFoundException('Activity not found');
      }

      const updateData: any = {
        status: dto.status as ActivityStatus,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
        reviewNotes: dto.reviewNotes,
        actionTaken: dto.actionTaken,
        isFalsePositive: dto.isFalsePositive || false,
      };

      // If confirmed fraud, create fraud indicator
      if (dto.status === 'CONFIRMED' && activity.entityId) {
        await tx.fraudIndicator.create({
          data: {
            entityType: activity.entityType as EntityType,
            entityId: activity.entityId,
            indicatorType: this.mapActivityToFraudIndicator(activity.activityType),
            description: activity.description,
            severity: activity.severity,
            isConfirmed: true,
            confidenceScore: 90,
            details: activity.details || {},
          },
        });
      }

      return tx.suspiciousActivity.update({
        where: { id: activityId },
        data: updateData,
      });
    });
  }

  /**
   * Create fraud indicator
   */
  async createFraudIndicator(dto: CreateFraudIndicatorDto, creatorId?: string) {
    return this.prisma.fraudIndicator.create({
      data: {
        entityType: dto.entityType as EntityType,
        entityId: dto.entityId,
        indicatorType: dto.indicatorType as FraudIndicatorType,
        description: dto.description,
        severity: dto.severity,
        isConfirmed: dto.isConfirmed || false,
        confidenceScore: dto.confidenceScore || 50,
        details: dto.details,
      },
    });
  }

  /**
   * Update fraud indicator
   */
  async updateFraudIndicator(
    indicatorId: string,
    dto: UpdateFraudIndicatorDto,
    updaterId?: string,
  ) {
    return this.prisma.fraudIndicator.update({
      where: { id: indicatorId },
      data: dto,
    });
  }

  /**
   * Get fraud indicators for entity
   */
  async getFraudIndicators(entityType: string, entityId: string) {
    return this.prisma.fraudIndicator.findMany({
      where: { entityType: entityType as EntityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Calculate risk score for activity
   */
  private calculateActivityRiskScore(dto: ReportSuspiciousActivityDto): number {
    let score = 50;

    // Severity factor
    switch (dto.severity) {
      case SeverityLevel.CRITICAL:
        score += 40;
        break;
      case SeverityLevel.HIGH:
        score += 25;
        break;
      case SeverityLevel.MEDIUM:
        score += 10;
        break;
      case SeverityLevel.LOW:
        score -= 10;
        break;
    }

    // Activity type factor
    const highRiskTypes = [
      'FAKE_DOCUMENT_UPLOAD',
      'IDENTITY_MISMATCH',
      'ACCOUNT_TAKEOVER',
      'CIRCUMVENTION_ATTEMPT',
    ];
    if (highRiskTypes.includes(dto.activityType)) {
      score += 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Map activity type to fraud indicator type
   */
  private mapActivityToFraudIndicator(
    activityType: string,
  ): FraudIndicatorType {
    const mapping: Record<string, FraudIndicatorType> = {
      FAKE_DOCUMENT_UPLOAD: FraudIndicatorType.DOCUMENT_FRAUD,
      IDENTITY_MISMATCH: FraudIndicatorType.IDENTITY_FRAUD,
      PAYMENT_ANOMALY: FraudIndicatorType.PAYMENT_FRAUD,
      MULTIPLE_FAILED_LOGINS: FraudIndicatorType.ACCOUNT_TAKEOVER,
      UNUSUAL_LOGIN_LOCATION: FraudIndicatorType.ACCOUNT_TAKEOVER,
      DUPLICATE_ACCOUNT: FraudIndicatorType.SYNTHETIC_IDENTITY,
      REVIEW_MANIPULATION: FraudIndicatorType.REVIEW_MANIPULATION,
    };

    return mapping[activityType] || FraudIndicatorType.IDENTITY_FRAUD;
  }

  // ============================================================================
  // DUPLICATE ACCOUNT PREVENTION
  // ============================================================================

  /**
   * Check for duplicate accounts
   */
  async checkForDuplicates(userId: string, checkFields?: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employer: true,
        worker: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const duplicates: Array<{
      suspectedUserId: string;
      matchType: DuplicateMatchType;
      matchFields: string[];
      confidenceScore: number;
    }> = [];

    // Check email duplicates (case-insensitive)
    const emailMatches = await this.prisma.user.findMany({
      where: {
        email: { equals: user.email.toLowerCase(), mode: 'insensitive' },
        id: { not: userId },
      },
    });

    for (const match of emailMatches) {
      duplicates.push({
        suspectedUserId: match.id,
        matchType: DuplicateMatchType.EMAIL,
        matchFields: ['email'],
        confidenceScore: 95,
      });
    }

    // Check phone duplicates
    if (user.phone) {
      const phoneMatches = await this.prisma.user.findMany({
        where: {
          phone: user.phone,
          id: { not: userId },
        },
      });

      for (const match of phoneMatches) {
        duplicates.push({
          suspectedUserId: match.id,
          matchType: DuplicateMatchType.PHONE,
          matchFields: ['phone'],
          confidenceScore: 90,
        });
      }
    }

    // Check for existing duplicate records
    const existingDuplicates = await this.prisma.duplicateAccountCheck.findMany({
      where: {
        OR: [{ primaryUserId: userId }, { suspectedUserId: userId }],
        isConfirmed: true,
      },
    });

    return {
      userId,
      duplicates,
      existingDuplicates,
      totalFound: duplicates.length,
    };
  }

  /**
   * Record duplicate account match
   */
  async recordDuplicateMatch(dto: DuplicateAccountMatchDto) {
    // Check if already recorded
    const existing = await this.prisma.duplicateAccountCheck.findUnique({
      where: {
        primaryUserId_suspectedUserId: {
          primaryUserId: dto.primaryUserId,
          suspectedUserId: dto.suspectedUserId,
        },
      },
    });

    if (existing) {
      return this.prisma.duplicateAccountCheck.update({
        where: {
          primaryUserId_suspectedUserId: {
            primaryUserId: dto.primaryUserId,
            suspectedUserId: dto.suspectedUserId,
          },
        },
        data: {
          confidenceScore: Math.max(
            existing.confidenceScore,
            dto.confidenceScore,
          ),
          matchType: dto.matchType as DuplicateMatchType,
          matchFields: dto.matchFields,
          details: dto.details,
        },
      });
    }

    return this.prisma.duplicateAccountCheck.create({
      data: {
        primaryUserId: dto.primaryUserId,
        suspectedUserId: dto.suspectedUserId,
        matchType: dto.matchType as DuplicateMatchType,
        matchFields: dto.matchFields,
        confidenceScore: dto.confidenceScore,
        details: dto.details,
      },
    });
  }

  /**
   * Review duplicate account
   */
  async reviewDuplicateAccount(
    primaryUserId: string,
    suspectedUserId: string,
    dto: ReviewDuplicateAccountDto,
    reviewerId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const duplicate = await tx.duplicateAccountCheck.findUnique({
        where: {
          primaryUserId_suspectedUserId: {
            primaryUserId,
            suspectedUserId,
          },
        },
      });

      if (!duplicate) {
        throw new NotFoundException('Duplicate record not found');
      }

      const updateData: any = {
        isConfirmed: dto.isConfirmed,
        isFalsePositive: dto.isFalsePositive || false,
        actionTaken: dto.actionTaken,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      };

      const updated = await tx.duplicateAccountCheck.update({
        where: {
          primaryUserId_suspectedUserId: {
            primaryUserId,
            suspectedUserId,
          },
        },
        data: updateData,
      });

      // If confirmed, take action on the suspected account
      if (dto.isConfirmed && dto.actionTaken) {
        await tx.user.update({
          where: { id: suspectedUserId },
          data: {
            status: 'SUSPENDED',
          },
        });

        // Report suspicious activity
        await tx.suspiciousActivity.create({
          data: {
            entityType: 'USER',
            userId: suspectedUserId,
            activityType: 'DUPLICATE_ACCOUNT',
            severity: SeverityLevel.HIGH,
            riskScore: 80,
            description: 'Confirmed duplicate account',
            status: ActivityStatus.CONFIRMED,
            actionTaken: dto.actionTaken,
          },
        });
      }

      return updated;
    });
  }

  // ============================================================================
  // BLACKLIST MANAGEMENT
  // ============================================================================

  /**
   * Add entity to blacklist
   */
  async addToBlacklist(dto: AddToBlacklistDto, addedBy?: string) {
    // Check if already blacklisted
    const existing = await this.prisma.blacklistEntry.findUnique({
      where: {
        entityType_entityId: {
          entityType: dto.entityType as EntityType,
          entityId: dto.entityId,
        },
      },
    });

    if (existing && existing.isActive) {
      throw new BadRequestException('Entity is already blacklisted');
    }

    return this.prisma.blacklistEntry.create({
      data: {
        entityType: dto.entityType as EntityType,
        entityId: dto.entityId,
        reason: dto.reason,
        severity: dto.severity,
        source: dto.source,
        evidence: dto.evidence,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  /**
   * Review blacklist entry
   */
  async reviewBlacklistEntry(
    entityType: string,
    entityId: string,
    dto: ReviewBlacklistEntryDto,
    reviewerId: string,
  ) {
    return this.prisma.blacklistEntry.update({
      where: {
        entityType_entityId: {
          entityType: entityType as EntityType,
          entityId,
        },
      },
      data: {
        isActive: dto.isActive,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });
  }

  /**
   * Check if entity is blacklisted
   */
  async isBlacklisted(entityType: string, entityId: string): Promise<boolean> {
    const entry = await this.prisma.blacklistEntry.findUnique({
      where: {
        entityType_entityId: {
          entityType: entityType as EntityType,
          entityId,
        },
      },
    });

    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      return false;
    }

    return entry.isActive;
  }

  /**
   * Get blacklist entries for user
   */
  async getBlacklistEntries(userId: string) {
    return this.prisma.blacklistEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================================
  // REPUTATION SCORING
  // ============================================================================

  /**
   * Calculate reputation score for employer or worker
   */
  async calculateReputationScore(dto: CalculateReputationScoreDto) {
    if (dto.employerId) {
      return this.calculateEmployerReputationScore(dto.employerId);
    }

    if (dto.workerId) {
      return this.calculateWorkerReputationScore(dto.workerId);
    }

    throw new BadRequestException('Either employerId or workerId must be provided');
  }

  /**
   * Calculate employer reputation score
   */
  private async calculateEmployerReputationScore(employerId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        verification: true,
        ratings: {
          where: { isPublished: true },
        },
        offersSent: {
          select: {
            status: true,
            submittedAt: true,
            acceptedAt: true,
          },
        },
      },
    });

    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const scores = {
      verificationScore: this.calculateEmployerVerificationScore(employer),
      behaviorScore: this.calculateEmployerBehaviorScore(employer),
      reputationScore: this.calculateEmployerReputationComponent(employer),
      activityScore: this.calculateEmployerActivityScore(employer),
      consistencyScore: this.calculateEmployerConsistencyScore(employer),
    };

    // Weighted average
    const overallScore = Math.round(
      scores.verificationScore * 0.25 +
      scores.behaviorScore * 0.20 +
      scores.reputationScore * 0.30 +
      scores.activityScore * 0.10 +
      scores.consistencyScore * 0.15,
    );

    const scoreGrade = this.getScoreGrade(overallScore);

    // Update or create trust score record
    await this.upsertTrustScore({
      entityType: 'EMPLOYER',
      entityId: employerId,
      overallScore,
      scoreGrade,
      employerScore: overallScore,
      verificationScore: scores.verificationScore,
      behaviorScore: scores.behaviorScore,
      reputationScore: scores.reputationScore,
    });

    return {
      entityId: employerId,
      entityType: 'EMPLOYER' as const,
      overallScore,
      scoreGrade,
      scoreBreakdown: scores,
      riskAdjustedScore: this.applyRiskAdjustment(overallScore, employer.verification?.riskLevel),
      factors: this.getEmployerScoreFactors(employer, scores),
      lastCalculatedAt: new Date(),
    };
  }

  /**
   * Calculate worker reputation score
   */
  private async calculateWorkerReputationScore(workerId: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        verification: true,
        offersReceived: {
          select: {
            status: true,
            submittedAt: true,
            acceptedAt: true,
          },
        },
      },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    const scores = {
      verificationScore: this.calculateWorkerVerificationScore(worker),
      behaviorScore: this.calculateWorkerBehaviorScore(worker),
      reputationScore: this.calculateWorkerReputationComponent(worker),
      activityScore: this.calculateWorkerActivityScore(worker),
      consistencyScore: 50, // Default for workers
    };

    // Weighted average
    const overallScore = Math.round(
      scores.verificationScore * 0.30 +
      scores.behaviorScore * 0.20 +
      scores.reputationScore * 0.25 +
      scores.activityScore * 0.10 +
      scores.consistencyScore * 0.15,
    );

    const scoreGrade = this.getScoreGrade(overallScore);

    // Update or create trust score record
    await this.upsertTrustScore({
      entityType: 'WORKER',
      entityId: workerId,
      overallScore,
      scoreGrade,
      workerScore: overallScore,
      verificationScore: scores.verificationScore,
      behaviorScore: scores.behaviorScore,
      reputationScore: scores.reputationScore,
    });

    return {
      entityId: workerId,
      entityType: 'WORKER' as const,
      overallScore,
      scoreGrade,
      scoreBreakdown: scores,
      riskAdjustedScore: this.applyRiskAdjustment(overallScore, worker.verification?.riskLevel),
      factors: this.getWorkerScoreFactors(worker, scores),
      lastCalculatedAt: new Date(),
    };
  }

  // ============================================================================
  // SCORE CALCULATION HELPERS
  // ============================================================================

  private calculateEmployerVerificationScore(employer: any): number {
    let score = 0;

    // Base score for having a profile
    score += 10;

    // Verification status (max 40 points)
    switch (employer.verificationStatus) {
      case 'PREMIUM_VERIFIED':
        score += 40;
        break;
      case 'BASIC_VERIFIED':
        score += 30;
        break;
      case 'PENDING':
        score += 10;
        break;
    }

    // KvK verified (15 points)
    if (employer.verification?.kvkVerified) {
      score += 15;
    }

    // VAT verified (10 points)
    if (employer.verification?.vatVerified) {
      score += 10;
    }

    // Document verified (15 points)
    if (employer.verification?.documentVerified) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private calculateEmployerBehaviorScore(employer: any): number {
    let score = 50;

    const offers = employer.offersSent || [];
    const totalOffers = offers.length;

    if (totalOffers > 0) {
      // Acceptance rate (max 30 points)
      const acceptedCount = offers.filter((o: any) => o.status === 'ACCEPTED').length;
      const acceptanceRate = acceptedCount / totalOffers;
      score += Math.round(acceptanceRate * 30);

      // Response activity (max 20 points)
      const recentOffers = offers.filter(
        (o: any) => o.submittedAt && new Date(o.submittedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      );
      if (recentOffers.length > 0) {
        score += 20;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateEmployerReputationComponent(employer: any): number {
    const ratings = employer.ratings || [];
    const totalRatings = ratings.length;

    if (totalRatings === 0) {
      return 50; // Default for no ratings
    }

    // Average rating (max 70 points)
    const avgRating = ratings.reduce((sum: number, r: any) => sum + r.ratingOverall, 0) / totalRatings;
    let score = (avgRating / 5) * 70;

    // Would work again (max 20 points)
    const wouldWorkAgainCount = ratings.filter((r: any) => r.wouldWorkAgain === true).length;
    score += (wouldWorkAgainCount / totalRatings) * 20;

    // Verified hires bonus (max 10 points)
    const verifiedCount = ratings.filter((r: any) => r.isVerifiedHire).length;
    score += Math.min(10, verifiedCount * 2);

    return Math.min(100, score);
  }

  private calculateEmployerActivityScore(employer: any): number {
    const offers = employer.offersSent || [];
    const totalOffers = offers.length;

    if (totalOffers === 0) {
      return 20; // Base score for having a profile
    }

    let score = 20;

    // Volume bonus
    if (totalOffers >= 50) score += 40;
    else if (totalOffers >= 20) score += 30;
    else if (totalOffers >= 10) score += 20;
    else if (totalOffers >= 5) score += 10;
    else score += 5;

    // Recent activity bonus
    const recentOffers = offers.filter(
      (o: any) => o.submittedAt && new Date(o.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    );
    if (recentOffers.length > 0) {
      score += 20;
    }

    return Math.min(100, score);
  }

  private calculateEmployerConsistencyScore(employer: any): number {
    const ratings = employer.ratings || [];
    const totalRatings = ratings.length;

    if (totalRatings < 3) {
      return 50; // Not enough data
    }

    const avgRating = ratings.reduce((sum: number, r: any) => sum + r.ratingOverall, 0) / totalRatings;
    const variance = ratings.reduce(
      (sum: number, r: any) => sum + Math.pow(r.ratingOverall - avgRating, 2),
      0,
    ) / totalRatings;
    const stdDev = Math.sqrt(variance);

    // Low variance = consistent (max 60 points)
    let consistencyPoints = 0;
    if (stdDev <= 0.5) consistencyPoints = 60;
    else if (stdDev <= 1.0) consistencyPoints = 45;
    else if (stdDev <= 1.5) consistencyPoints = 30;
    else if (stdDev <= 2.0) consistencyPoints = 15;

    // Volume confidence (max 40 points)
    let volumePoints = 0;
    if (totalRatings >= 50) volumePoints = 40;
    else if (totalRatings >= 25) volumePoints = 30;
    else if (totalRatings >= 10) volumePoints = 20;
    else if (totalRatings >= 5) volumePoints = 10;
    else volumePoints = 5;

    return consistencyPoints + volumePoints;
  }

  private calculateWorkerVerificationScore(worker: any): number {
    let score = 0;

    // Base score for having a profile
    score += 10;

    const verification = worker.verification;
    if (!verification) {
      return score;
    }

    // Identity verified (25 points)
    if (verification.identityVerified) {
      score += 25;
    }

    // Document verified (20 points)
    if (verification.documentVerified) {
      score += 20;
    }

    // Background check (25 points)
    switch (verification.backgroundCheckStatus) {
      case 'CLEAR':
        score += 25;
        break;
      case 'IN_PROGRESS':
        score += 10;
        break;
    }

    // Reference check (20 points)
    switch (verification.referenceCheckStatus) {
      case 'POSITIVE':
        score += 20;
        break;
      case 'MIXED':
        score += 10;
        break;
      case 'IN_PROGRESS':
        score += 5;
        break;
    }

    return Math.min(100, score);
  }

  private calculateWorkerBehaviorScore(worker: any): number {
    // Default score - can be enhanced with message response data, etc.
    return 70;
  }

  private calculateWorkerReputationComponent(worker: any): number {
    // Default score - can be enhanced with offer acceptance data
    return 60;
  }

  private calculateWorkerActivityScore(worker: any): number {
    const offers = worker.offersReceived || [];
    const totalOffers = offers.length;

    if (totalOffers === 0) {
      return 30; // Base score for having a profile
    }

    let score = 30;

    // Acceptance rate bonus
    const acceptedCount = offers.filter((o: any) => o.status === 'ACCEPTED').length;
    const acceptanceRate = acceptedCount / totalOffers;
    score += Math.round(acceptanceRate * 30);

    // Recent activity
    const recentOffers = offers.filter(
      (o: any) => o.submittedAt && new Date(o.submittedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    );
    if (recentOffers.length > 0) {
      score += 20;
    }

    return Math.min(100, score);
  }

  private getScoreGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private applyRiskAdjustment(score: number, riskLevel?: RiskLevel): number {
    if (!riskLevel) {
      return score;
    }

    const adjustments: Record<RiskLevel, number> = {
      [RiskLevel.VERY_LOW]: 10,
      [RiskLevel.LOW]: 5,
      [RiskLevel.MEDIUM]: 0,
      [RiskLevel.HIGH]: -10,
      [RiskLevel.VERY_HIGH]: -20,
      [RiskLevel.CRITICAL]: -30,
      [RiskLevel.UNKNOWN]: 0,
    };

    return Math.min(100, Math.max(0, score + (adjustments[riskLevel] || 0)));
  }

  private getEmployerScoreFactors(employer: any, scores: any): {
    positive: string[];
    negative: string[];
    neutral: string[];
  } {
    const positive: string[] = [];
    const negative: string[] = [];
    const neutral: string[] = [];

    if (employer.verificationStatus === 'PREMIUM_VERIFIED') {
      positive.push('Premium verified employer');
    } else if (employer.verificationStatus === 'BASIC_VERIFIED') {
      positive.push('Verified employer');
    } else {
      neutral.push('Verification pending');
    }

    if (scores.verificationScore >= 70) {
      positive.push('Strong verification profile');
    }

    if (scores.reputationScore >= 70) {
      positive.push('Positive worker reviews');
    } else if (scores.reputationScore < 40) {
      negative.push('Below average reviews');
    }

    if (employer.ratings?.length >= 25) {
      positive.push(`${employer.ratings.length} verified reviews`);
    } else if (employer.ratings?.length === 0) {
      neutral.push('No reviews yet');
    }

    return { positive, negative, neutral };
  }

  private getWorkerScoreFactors(worker: any, scores: any): {
    positive: string[];
    negative: string[];
    neutral: string[];
  } {
    const positive: string[] = [];
    const negative: string[] = [];
    const neutral: string[] = [];

    const verification = worker.verification;

    if (verification?.identityVerified) {
      positive.push('Identity verified');
    } else {
      neutral.push('Identity not verified');
    }

    if (verification?.backgroundCheckStatus === 'CLEAR') {
      positive.push('Clear background check');
    } else if (verification?.backgroundCheckStatus === 'NOT_STARTED') {
      neutral.push('Background check not started');
    }

    if (verification?.referenceCheckStatus === 'POSITIVE') {
      positive.push('Positive references');
    }

    if (scores.verificationScore >= 70) {
      positive.push('Strong verification profile');
    } else if (scores.verificationScore < 40) {
      negative.push('Incomplete verification');
    }

    return { positive, negative, neutral };
  }

  private async upsertTrustScore(data: {
    entityType: string;
    entityId: string;
    overallScore: number;
    scoreGrade: string;
    employerScore?: number;
    workerScore?: number;
    verificationScore?: number;
    behaviorScore?: number;
    reputationScore?: number;
  }) {
    const existing = await this.prisma.trustScore.findUnique({
      where: { entityId: data.entityId },
    });

    if (existing) {
      // Store history
      const history = (existing.scoreHistory as any[]) || [];
      history.push({
        date: existing.lastCalculatedAt,
        score: existing.overallScore,
        grade: existing.scoreGrade,
      });

      // Keep only last 50 entries
      while (history.length > 50) {
        history.shift();
      }

      return this.prisma.trustScore.update({
        where: { id: existing.id },
        data: {
          overallScore: data.overallScore,
          scoreGrade: data.scoreGrade,
          employerScore: data.employerScore,
          workerScore: data.workerScore,
          verificationScore: data.verificationScore,
          behaviorScore: data.behaviorScore,
          reputationScore: data.reputationScore,
          scoreHistory: history,
          entityType: data.entityType as EntityType,
          lastCalculatedAt: new Date(),
        },
      });
    }

    return this.prisma.trustScore.create({
      data: {
        entityType: data.entityType as EntityType,
        entityId: data.entityId,
        overallScore: data.overallScore,
        scoreGrade: data.scoreGrade,
        employerScore: data.employerScore,
        workerScore: data.workerScore,
        verificationScore: data.verificationScore,
        behaviorScore: data.behaviorScore,
        reputationScore: data.reputationScore,
        scoreHistory: [],
      },
    });
  }

  // ============================================================================
  // GET TRUST SCORE
  // ============================================================================

  /**
   * Get trust score for entity
   */
  async getTrustScore(entityType: string, entityId: string) {
    return this.prisma.trustScore.findUnique({
      where: { entityId },
    });
  }

  // ============================================================================
  // AUTOMATED DETECTION
  // ============================================================================

  /**
   * Check for suspicious login patterns
   */
  async checkSuspiciousLogin(userId: string, ipAddress: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { isSuspicious: false };
    }

    const activities: string[] = [];
    let riskScore = 0;

    // Check for multiple failed logins (would need login attempt logging)
    // Check for unusual location based on IP
    // Check for rapid successive logins

    // For now, check against known suspicious patterns
    const recentActivities = await this.prisma.suspiciousActivity.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentActivities.length >= 5) {
      activities.push('Multiple suspicious activities in 24 hours');
      riskScore += 30;
    }

    // Check if user is blacklisted
    const isBlacklisted = await this.isBlacklisted('USER', userId);
    if (isBlacklisted) {
      activities.push('User is blacklisted');
      riskScore += 50;
    }

    return {
      isSuspicious: riskScore >= 50,
      riskScore,
      activities,
      isBlacklisted,
    };
  }

  /**
   * Detect rapid account creation from same IP
   */
  async detectRapidAccountCreation(ipAddress: string, timeWindowMinutes: number = 60) {
    const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const recentAccounts = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: timeWindow },
        lastLoginIp: ipAddress,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    if (recentAccounts.length >= 5) {
      // Report suspicious activity for each account
      for (const account of recentAccounts) {
        await this.reportSuspiciousActivity({
          entityType: 'USER',
          userId: account.id,
          activityType: 'RAPID_ACCOUNT_CREATION',
          severity: SeverityLevel.HIGH,
          description: `Account created during rapid creation event from IP ${ipAddress}`,
          ipAddress,
        });
      }

      return {
        isSuspicious: true,
        accountCount: recentAccounts.length,
        accounts: recentAccounts,
      };
    }

    return {
      isSuspicious: false,
      accountCount: recentAccounts.length,
    };
  }

  /**
   * Get suspicious activities dashboard data
   */
  async getSuspiciousActivitiesDashboard() {
    const [total, newActivities, confirmed, falsePositives] = await Promise.all([
      this.prisma.suspiciousActivity.count(),
      this.prisma.suspiciousActivity.count({ where: { status: ActivityStatus.NEW } }),
      this.prisma.suspiciousActivity.count({ where: { status: ActivityStatus.CONFIRMED } }),
      this.prisma.suspiciousActivity.count({ where: { isFalsePositive: true } }),
    ]);

    const recentActivities = await this.prisma.suspiciousActivity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const fraudIndicators = await this.prisma.fraudIndicator.findMany({
      where: { isConfirmed: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const blacklistCount = await this.prisma.blacklistEntry.count({
      where: { isActive: true },
    });

    return {
      totalActivities: total,
      newActivities,
      confirmedFraud: confirmed,
      falsePositives,
      recentActivities,
      fraudIndicators,
      blacklistCount,
    };
  }
}
