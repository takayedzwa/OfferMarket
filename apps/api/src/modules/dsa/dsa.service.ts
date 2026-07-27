import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ContentReportTarget,
  ContentReportCategory,
  ContentReportStatus,
  ContentReportPriority,
  ContentReportAssessment,
  ContentReportAction,
  ContentReportResolution,
  ContentRestrictionType,
  DecisionSource,
  AppealStatus,
  DSAComplaintType,
  DSAComplaintStatus,
  MisuseType,
  WarningLevel,
} from '@prisma/client';
import {
  CreateContentReportDto,
  AssessContentReportDto,
  TakeActionDto,
  ResolveContentReportDto,
  EscalateToAuthoritiesDto,
  CreateStatementOfReasonsDto,
  FlagMisuseDto,
  CreateDSAComplaintDto,
  ComplaintMessageDto,
  AppealDecisionDto,
} from './dto/dsa.dto';

/**
 * DSA (Digital Services Act) Service
 *
 * Implements DSA compliance for OfferMarket as an online platform and marketplace:
 * - Art. 16: Notice-and-action mechanism for illegal content
 * - Art. 17: Statement of reasons when restricting content
 * - Art. 18: Referral of criminal offences to authorities
 * - Art. 20: Internal complaint-handling system
 * - Art. 23: Measures against misuse
 * - Art. 30: Trader traceability (marketplace obligations)
 * - Art. 15/24: Transparency reporting
 */

@Injectable()
export class DsaService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // CONTENT REPORTS — DSA Art. 16: Notice-and-Action
  // ============================================================================

  /**
   * Submit an illegal content notice.
   * Per DSA Art. 16, this must be easy to access, user-friendly, and
   * allow submission by electronic means. Anonymous reports are permitted.
   */
  async submitContentReport(
    dto: CreateContentReportDto,
    reporterId: string | null,
    reporterIp?: string,
    reporterUserAgent?: string,
  ) {
    // DSA Art. 16(3): require explanation and good faith declaration for non-anonymous
    if (!reporterId && !dto.reporterEmail) {
      throw new BadRequestException(
        'Anonymous reports must provide an email address for acknowledgment',
      );
    }

    // Capture a snapshot of the reported content for evidence
    let targetSnapshot: Record<string, any> | null = null;
    try {
      targetSnapshot = await this.captureContentSnapshot(dto.targetType, dto.targetId);
    } catch {
      // Snapshot capture failure should not block the report
    }

    const report = await this.prisma.contentReport.create({
      data: {
        reporterId,
        reporterEmail: dto.reporterEmail,
        reporterIp,
        reporterUserAgent,
        targetType: dto.targetType,
        targetId: dto.targetId,
        targetUrl: dto.url || this.buildTargetUrl(dto.targetType, dto.targetId),
        targetSnapshot: targetSnapshot ?? undefined,
        category: dto.category,
        illegalContentType: dto.illegalContentType,
        explanation: dto.explanation,
        goodFaithDeclaration: dto.goodFaithDeclaration ?? false,
        evidence: dto.evidence ?? undefined,
        status: ContentReportStatus.RECEIVED,
        priority: this.determinePriority(dto.category),
      },
    });

    // DSA Art. 16(4): acknowledge receipt without undue delay
    const acknowledged = await this.acknowledgeReport(report.id);

    return this.serializeReport(acknowledged);
  }

  /**
   * Acknowledge receipt of a content report.
   * DSA Art. 16(4): acknowledge without undue delay.
   */
  private async acknowledgeReport(reportId: string) {
    return this.prisma.contentReport.update({
      where: { id: reportId },
      data: { acknowledgedAt: new Date() },
    });
  }

  /**
   * Get a content report by ID (for status checking).
   * Accessible by the reporter or by publicId.
   */
  async getReportByPublicId(publicId: string) {
    const report = await this.prisma.contentReport.findUnique({
      where: { publicId },
    });

    if (!report) throw new NotFoundException('Report not found');

    return this.serializeReport(report);
  }

  /**
   * Get reports submitted by a specific user.
   */
  async getUserReports(userId: string, page: number = 1, limit: number = 20) {
    const [reports, total] = await Promise.all([
      this.prisma.contentReport.findMany({
        where: { reporterId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contentReport.count({ where: { reporterId: userId } }),
    ]);

    return {
      reports: reports.map(this.serializeReport),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================================
  // ADMIN: CONTENT MODERATION
  // ============================================================================

  /**
   * Get all content reports (admin view, paginated).
   */
  async getAllReports(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: ContentReportStatus;
      category?: ContentReportCategory;
      priority?: ContentReportPriority;
      targetType?: ContentReportTarget;
    },
  ) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.targetType) where.targetType = filters.targetType;

    const [reports, total] = await Promise.all([
      this.prisma.contentReport.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reporter: { select: { id: true, email: true, role: true } },
          assignedTo: { select: { id: true, email: true } },
          statementOfReasons: true,
        },
      }),
      this.prisma.contentReport.count({ where }),
    ]);

    return {
      reports: reports.map(this.serializeReport),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single report with full details.
   */
  async getReportById(id: string) {
    const report = await this.prisma.contentReport.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, email: true, role: true } },
        assignedTo: { select: { id: true, email: true } },
        statementOfReasons: true,
        dsaComplaints: true,
        misuseRecords: true,
      },
    });

    if (!report) throw new NotFoundException('Report not found');
    return this.serializeReport(report);
  }

  /**
   * Assign a report to a staff member.
   */
  async assignReport(reportId: string, adminId: string) {
    const report = await this.prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    return this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        assignedToId: adminId,
        status: ContentReportStatus.ASSESSMENT,
      },
    });
  }

  /**
   * Assess a content report — determine if it violates terms/law.
   */
  async assessReport(reportId: string, adminId: string, dto: AssessContentReportDto) {
    const report = await this.prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    if (report.status !== ContentReportStatus.RECEIVED && report.status !== ContentReportStatus.ASSESSMENT) {
      throw new BadRequestException(`Report cannot be assessed in status: ${report.status}`);
    }

    return this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        assessmentResult: dto.assessmentResult,
        assessmentNotes: dto.assessmentNotes,
        assessedAt: new Date(),
        assessedBy: adminId,
        status: ContentReportStatus.ASSESSMENT,
        ...(dto.priority ? { priority: dto.priority } : {}),
      },
    });
  }

  /**
   * Take action on a content report — remove, hide, suspend, etc.
   * Creates a statement of reasons if action restricts content (DSA Art. 17).
   */
  async takeAction(reportId: string, adminId: string, dto: TakeActionDto) {
    const report = await this.prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    // A-H5: only reports under assessment (or already acted on, to re-act)
    // can have an action taken. Terminal states (RESOLVED/DISMISSED/ESCALATED)
    // and the initial RECEIVED state are rejected to enforce the state machine.
    if (
      report.status !== ContentReportStatus.ASSESSMENT &&
      report.status !== ContentReportStatus.ACTION_TAKEN
    ) {
      throw new BadRequestException(`Report cannot have action taken in status: ${report.status}`);
    }

    const updated = await this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        actionTaken: dto.actionTaken,
        actionDetails: dto.actionDetails ?? undefined,
        actionTakenAt: new Date(),
        actionTakenBy: adminId,
        status: ContentReportStatus.ACTION_TAKEN,
      },
    });

    // DSA Art. 18: If criminal offence involving threat to life, escalate to authorities
    if (dto.actionTaken === ContentReportAction.ESCALATED_TO_AUTHORITIES) {
      await this.prisma.contentReport.update({
        where: { id: reportId },
        data: {
          referredToAuthorities: true,
          status: ContentReportStatus.ESCALATED,
        },
      });
    }

    return this.serializeReport(updated);
  }

  /**
   * Resolve a content report.
   */
  async resolveReport(reportId: string, adminId: string, dto: ResolveContentReportDto) {
    const report = await this.prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    // A-H5: a report can only be resolved once it has been assessed and/or had
    // an action taken. Reject resolving from RECEIVED (not yet assessed) or
    // from terminal states (already RESOLVED/DISMISSED/ESCALATED).
    if (
      report.status !== ContentReportStatus.ASSESSMENT &&
      report.status !== ContentReportStatus.ACTION_TAKEN
    ) {
      throw new BadRequestException(`Report cannot be resolved in status: ${report.status}`);
    }

    return this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        resolution: dto.resolution,
        resolutionNotes: dto.resolutionNotes,
        resolvedAt: new Date(),
        resolvedBy: adminId,
        status: ContentReportStatus.RESOLVED,
      },
    });
  }

  /**
   * Escalate a report to authorities (DSA Art. 18).
   * Required when suspecting criminal offences involving threat to life or safety.
   */
  async escalateToAuthorities(reportId: string, adminId: string, dto: EscalateToAuthoritiesDto) {
    const report = await this.prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    // A-H5: escalation to authorities can happen from any pre-terminal state
    // (RECEIVED/ASSESSMENT/ACTION_TAKEN) but not from an already-terminal
    // state (RESOLVED/DISMISSED/ESCALATED).
    if (
      report.status === ContentReportStatus.RESOLVED ||
      report.status === ContentReportStatus.DISMISSED ||
      report.status === ContentReportStatus.ESCALATED
    ) {
      throw new BadRequestException(`Report cannot be escalated in status: ${report.status}`);
    }

    return this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        referredToAuthorities: true,
        authorityReferralNotes: dto.authorityReferralNotes,
        status: ContentReportStatus.ESCALATED,
        priority: ContentReportPriority.URGENT,
      },
    });
  }

  // ============================================================================
  // STATEMENT OF REASONS — DSA Art. 17
  // ============================================================================

  /**
   * Create a statement of reasons when content is restricted.
   * DSA Art. 17 requires providing the affected user with a clear, specific
   * statement of reasons containing: type of restriction, territorial scope,
   * facts/circumstances, source of decision, whether automated means were used,
   * legal/contractual ground, and redress options.
   */
  async createStatementOfReasons(reportId: string, adminId: string, dto: CreateStatementOfReasonsDto) {
    const report = await this.prisma.contentReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    // Calculate appeal deadline: 6 months from now (DSA Art. 20)
    const appealDeadline = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);

    const sor = await this.prisma.statementOfReasons.create({
      data: {
        contentReportId: reportId,
        restrictionType: dto.restrictionType,
        restrictedContentId: dto.restrictedContentId,
        restrictedContentType: dto.restrictedContentType,
        reasons: dto.reasons,
        detailedExplanation: dto.detailedExplanation,
        decisionSource: dto.decisionSource,
        legalBasis: dto.legalBasis,
        contractualBasis: dto.contractualBasis,
        territorialScope: dto.territorialScope ?? 'NL',
        restrictionDuration: dto.restrictionDuration,
        notificationMethod: dto.notificationMethod ?? 'email',
        appealDeadline,
      },
    });

    // Update the report with the statement of reasons and automated means flag
    await this.prisma.contentReport.update({
      where: { id: reportId },
      data: {
        statementOfReasonsId: sor.id,
        automatedMeans: dto.automatedMeans ?? false,
      },
    });

    return sor;
  }

  // ============================================================================
  // DSA COMPLAINTS — Art. 20: Internal Complaint-Handling
  // ============================================================================

  /**
   * Submit a complaint about a content moderation decision.
   * DSA Art. 20: must be electronic, free of charge, and handled within
   * a reasonable timeframe by qualified staff (not solely automated).
   */
  async submitComplaint(userId: string, email: string | undefined, dto: CreateDSAComplaintDto) {
    // A-H6: resolve the complainant email authoritatively from the user record
    // when it is not carried on the JWT. Never fall back to dto.contentReportId
    // — that is a report ID, not an email address.
    let complainantEmail = email;
    if (!complainantEmail) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      complainantEmail = user?.email;
    }
    if (!complainantEmail) {
      throw new BadRequestException('Complainant email is required to submit a DSA complaint');
    }

    // Calculate response deadline: 15 business days from now
    const targetResponseAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const complaint = await this.prisma.dSAComplaint.create({
      data: {
        complainantId: userId,
        complainantEmail,
        contentReportId: dto.contentReportId,
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        complaintType: dto.complaintType,
        description: dto.description,
        resolutionSought: dto.resolutionSought,
        status: DSAComplaintStatus.SUBMITTED,
        targetResponseAt,
      },
    });

    // Acknowledge within 24 hours (DSA Art. 20(3))
    await this.prisma.dSAComplaint.update({
      where: { id: complaint.id },
      data: { acknowledgedAt: new Date() },
    });

    return this.serializeComplaint(complaint);
  }

  /**
   * Get a user's own complaints.
   */
  async getUserComplaints(userId: string, page: number = 1, limit: number = 20) {
    const [complaints, total] = await Promise.all([
      this.prisma.dSAComplaint.findMany({
        where: { complainantId: userId },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.dSAComplaint.count({ where: { complainantId: userId } }),
    ]);

    return {
      complaints: complaints.map(this.serializeComplaint),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a complaint by ID.
   */
  async getComplaintById(id: string, userId: string) {
    const complaint = await this.prisma.dSAComplaint.findUnique({
      where: { id },
      include: { messages: true },
    });

    if (!complaint) throw new NotFoundException('Complaint not found');

    // Only the complainant or admin/support can view
    if (complaint.complainantId !== userId) {
      throw new ForbiddenException('You can only view your own complaints');
    }

    return this.serializeComplaint(complaint);
  }

  /**
   * Add a message to a complaint.
   */
  async addComplaintMessage(complaintId: string, senderId: string, dto: ComplaintMessageDto) {
    const complaint = await this.prisma.dSAComplaint.findUnique({ where: { id: complaintId } });
    if (!complaint) throw new NotFoundException('Complaint not found');

    return this.prisma.complaintMessage.create({
      data: {
        complaintId,
        senderId,
        content: dto.content,
        isInternal: dto.isInternal ?? false,
        attachments: dto.attachments ?? undefined,
      },
    });
  }

  /**
   * Admin: get all complaints (paginated).
   */
  async getAllComplaints(
    page: number = 1,
    limit: number = 20,
    filters?: { status?: DSAComplaintStatus; complaintType?: DSAComplaintType },
  ) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.complaintType) where.complaintType = filters.complaintType;

    const [complaints, total] = await Promise.all([
      this.prisma.dSAComplaint.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          complainant: { select: { id: true, email: true, role: true } },
          assignedTo: { select: { id: true, email: true } },
        },
      }),
      this.prisma.dSAComplaint.count({ where }),
    ]);

    return {
      complaints: complaints.map(this.serializeComplaint),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ============================================================================
  // MISUSE TRACKING — DSA Art. 23
  // ============================================================================

  /**
   * Flag a user for misuse of the notice-and-action mechanism.
   * DSA Art. 23: platforms may suspend accounts of users who frequently
   * submit manifestly unfounded notices or manifestly illegal content.
   */
  async flagMisuse(userId: string, adminId: string, dto: FlagMisuseDto) {
    return this.prisma.noticeMisuseRecord.create({
      data: {
        userId,
        contentReportId: undefined,
        misuseType: dto.misuseType,
        description: dto.description,
        warningLevel: dto.warningLevel ?? WarningLevel.FIRST_WARNING,
      },
    });
  }

  /**
   * Check if a user has active misuse flags.
   */
  async getUserMisuseStatus(userId: string) {
    const records = await this.prisma.noticeMisuseRecord.findMany({
      where: { userId, isLifted: false },
      orderBy: { createdAt: 'desc' },
    });

    const activeWarnings = records.filter(r =>
      r.warningLevel === WarningLevel.FIRST_WARNING ||
      r.warningLevel === WarningLevel.SECOND_WARNING,
    );
    const isSuspended = records.some(r =>
      r.warningLevel === WarningLevel.TEMPORARY_REPORTING_SUSPENSION && !r.isLifted,
    );
    const isBanned = records.some(r =>
      r.warningLevel === WarningLevel.PERMANENT_REPORTING_BAN,
    );

    return {
      userId,
      totalFlags: records.length,
      activeWarnings: activeWarnings.length,
      isReportingSuspended: isSuspended,
      isReportingBanned: isBanned,
      records,
    };
  }

  /**
   * Lift a misuse flag (e.g., temporary suspension expired).
   */
  async liftMisuseFlag(recordId: string, adminId: string) {
    const record = await this.prisma.noticeMisuseRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Misuse record not found');

    return this.prisma.noticeMisuseRecord.update({
      where: { id: recordId },
      data: {
        isLifted: true,
        liftedAt: new Date(),
        liftedBy: adminId,
      },
    });
  }

  // ============================================================================
  // TRANSPARENCY — DSA Arts. 15, 24
  // ============================================================================

  /**
   * Get public transparency statistics.
   */
  async getTransparencyStatistics() {
    const latestReport = await this.prisma.transparencyReport.findFirst({
      where: { isPublished: true },
      orderBy: { periodStart: 'desc' },
    });

    if (latestReport) {
      return latestReport;
    }

    // If no published report, generate live statistics from content reports
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      escalatedReports,
    ] = await Promise.all([
      this.prisma.contentReport.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.contentReport.count({
        where: { status: { in: [ContentReportStatus.RECEIVED, ContentReportStatus.ASSESSMENT] } },
      }),
      this.prisma.contentReport.count({ where: { status: ContentReportStatus.RESOLVED } }),
      this.prisma.contentReport.count({ where: { status: ContentReportStatus.DISMISSED } }),
      this.prisma.contentReport.count({ where: { status: ContentReportStatus.ESCALATED } }),
    ]);

    return {
      periodStart: thirtyDaysAgo.toISOString(),
      periodEnd: now.toISOString(),
      isLive: true,
      totalReportsReceived: totalReports,
      pendingReports,
      resolvedReports,
      dismissedReports,
      escalatedReports,
      contentRemoved: await this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.CONTENT_REMOVED },
      }),
      accountsSuspended: await this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.ACCOUNT_SUSPENDED },
      }),
      accountsTerminated: await this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.ACCOUNT_BANNED },
      }),
      noActionTaken: await this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.NO_ACTION },
      }),
    };
  }

  /**
   * Generate a transparency report for a given period (admin).
   */
  async generateTransparencyReport(periodStart: Date, periodEnd: Date) {
    const [
      totalReportsReceived,
      reportsByCategory,
      contentRemoved,
      accessDisabled,
      accountsSuspended,
      accountsTerminated,
      noActionTaken,
      misuseNoticesIssued,
      accountsSuspendedForMisuse,
      complaintsReceived,
      complaintsResolved,
    ] = await Promise.all([
      this.prisma.contentReport.count({
        where: { createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.getReportsByCategory(periodStart, periodEnd),
      this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.CONTENT_REMOVED, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.CONTENT_HIDDEN, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.ACCOUNT_SUSPENDED, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.ACCOUNT_BANNED, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.contentReport.count({
        where: { actionTaken: ContentReportAction.NO_ACTION, createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.noticeMisuseRecord.count({
        where: { createdAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.noticeMisuseRecord.count({
        where: {
          warningLevel: { in: [WarningLevel.TEMPORARY_REPORTING_SUSPENSION, WarningLevel.PERMANENT_REPORTING_BAN] },
          createdAt: { gte: periodStart, lte: periodEnd },
        },
      }),
      this.prisma.dSAComplaint.count({
        where: { submittedAt: { gte: periodStart, lte: periodEnd } },
      }),
      this.prisma.dSAComplaint.count({
        where: { status: { in: [DSAComplaintStatus.RESOLVED, DSAComplaintStatus.CLOSED] }, submittedAt: { gte: periodStart, lte: periodEnd } },
      }),
    ]);

    // Calculate average response time
    const resolvedReports = await this.prisma.contentReport.findMany({
      where: {
        acknowledgedAt: { not: null },
        resolvedAt: { not: null },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { acknowledgedAt: true, resolvedAt: true },
    });

    const responseTimesHours = resolvedReports.map(r => {
      if (r.acknowledgedAt && r.resolvedAt) {
        return (r.resolvedAt.getTime() - r.acknowledgedAt.getTime()) / (1000 * 60 * 60);
      }
      return 0;
    });

    const avgResponseTimeHours = responseTimesHours.length > 0
      ? responseTimesHours.reduce((a, b) => a + b, 0) / responseTimesHours.length
      : 0;
    const medianResponseTimeHours = responseTimesHours.length > 0
      ? responseTimesHours.sort((a, b) => a - b)[Math.floor(responseTimesHours.length / 2)]
      : 0;

    return this.prisma.transparencyReport.create({
      data: {
        periodStart,
        periodEnd,
        totalReportsReceived,
        reportsByCategory,
        contentRemoved,
        accessDisabled,
        accountsSuspended,
        accountsTerminated,
        noActionTaken,
        avgResponseTimeHours,
        medianResponseTimeHours,
        misuseNoticesIssued,
        accountsSuspendedForMisuse,
        complaintsReceived,
        complaintsResolved,
      },
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Determine report priority based on category.
   * DSA Art. 18: reports involving threat to life get URGENT priority.
   */
  private determinePriority(category: ContentReportCategory): ContentReportPriority {
    const urgentCategories: ContentReportCategory[] = [
      ContentReportCategory.CHILD_SAFETY,
      ContentReportCategory.TERRORISM,
    ];
    const highCategories: ContentReportCategory[] = [
      ContentReportCategory.FRAUD_SCAM,
      ContentReportCategory.HARASSMENT,
      ContentReportCategory.HATE_SPEECH,
      ContentReportCategory.PRIVACY_VIOLATION,
    ];

    if (urgentCategories.includes(category)) return ContentReportPriority.URGENT;
    if (highCategories.includes(category)) return ContentReportPriority.HIGH;
    return ContentReportPriority.MEDIUM;
  }

  /**
   * Capture a snapshot of the reported content for evidence preservation.
   */
  private async captureContentSnapshot(
    targetType: ContentReportTarget,
    targetId: string,
  ): Promise<Record<string, any> | null> {
    try {
      switch (targetType) {
        case ContentReportTarget.OFFER: {
          const offer = await this.prisma.offer.findUnique({
            where: { id: targetId },
            select: {
              id: true,
              jobTitle: true,
              jobDescription: true,
              status: true,
              createdAt: true,
            },
          });
          return offer;
        }
        case ContentReportTarget.USER_PROFILE:
        case ContentReportTarget.WORKER_PROFILE:
        case ContentReportTarget.EMPLOYER_PROFILE: {
          const user = await this.prisma.user.findUnique({
            where: { id: targetId },
            select: {
              id: true,
              role: true,
              status: true,
              createdAt: true,
            },
          });
          return user;
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Build a URL for the reported content.
   */
  private buildTargetUrl(targetType: ContentReportTarget, targetId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://offermarket.nl';
    switch (targetType) {
      case ContentReportTarget.OFFER:
        return `${baseUrl}/offers/${targetId}`;
      case ContentReportTarget.WORKER_PROFILE:
        return `${baseUrl}/workers/${targetId}`;
      case ContentReportTarget.EMPLOYER_PROFILE:
        return `${baseUrl}/profile/${targetId}`;
      case ContentReportTarget.USER_PROFILE:
        return `${baseUrl}/profile/${targetId}`;
      case ContentReportTarget.MESSAGE:
        return `${baseUrl}/conversations/${targetId}`;
      default:
        return `${baseUrl}/`;
    }
  }

  /**
   * Get reports grouped by category for transparency reporting.
   */
  private async getReportsByCategory(start: Date, end: Date): Promise<Record<string, number>> {
    const reports = await this.prisma.contentReport.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { category: true },
    });

    const counts: Record<string, number> = {};
    for (const report of reports) {
      counts[report.category] = (counts[report.category] || 0) + 1;
    }
    return counts;
  }

  /**
   * Serialize a ContentReport for API responses.
   */
  private serializeReport(report: any) {
    return {
      ...report,
      createdAt: report.createdAt?.toISOString?.() ?? report.createdAt,
      updatedAt: report.updatedAt?.toISOString?.() ?? report.updatedAt,
      acknowledgedAt: report.acknowledgedAt?.toISOString?.() ?? report.acknowledgedAt ?? null,
      assessedAt: report.assessedAt?.toISOString?.() ?? report.assessedAt ?? null,
      actionTakenAt: report.actionTakenAt?.toISOString?.() ?? report.actionTakenAt ?? null,
      resolvedAt: report.resolvedAt?.toISOString?.() ?? report.resolvedAt ?? null,
      notifierNotifiedAt: report.notifierNotifiedAt?.toISOString?.() ?? report.notifierNotifiedAt ?? null,
      affectedUserNotifiedAt: report.affectedUserNotifiedAt?.toISOString?.() ?? report.affectedUserNotifiedAt ?? null,
    };
  }

  /**
   * Serialize a DSAComplaint for API responses.
   */
  private serializeComplaint(complaint: any) {
    return {
      ...complaint,
      submittedAt: complaint.submittedAt?.toISOString?.() ?? complaint.submittedAt,
      acknowledgedAt: complaint.acknowledgedAt?.toISOString?.() ?? complaint.acknowledgedAt ?? null,
      targetResponseAt: complaint.targetResponseAt?.toISOString?.() ?? complaint.targetResponseAt ?? null,
      respondedAt: complaint.respondedAt?.toISOString?.() ?? complaint.respondedAt ?? null,
      resolvedAt: complaint.resolvedAt?.toISOString?.() ?? complaint.resolvedAt ?? null,
      appealDeadline: complaint.appealDeadline?.toISOString?.() ?? complaint.appealDeadline ?? null,
      appealDecidedAt: complaint.appealDecidedAt?.toISOString?.() ?? complaint.appealDecidedAt ?? null,
      createdAt: complaint.createdAt?.toISOString?.() ?? complaint.createdAt,
      updatedAt: complaint.updatedAt?.toISOString?.() ?? complaint.updatedAt,
    };
  }
}