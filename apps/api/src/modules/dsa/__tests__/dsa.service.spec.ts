import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  DSAComplaintStatus,
  MisuseType,
  WarningLevel,
} from '@prisma/client';
import { DsaService } from '../dsa.service';
import { PrismaService } from '../../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Mock PrismaService — one mock per model method used by DsaService
// ---------------------------------------------------------------------------
class MockPrismaService {
  contentReport = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  statementOfReasons = {
    create: jest.fn(),
  };

  dSAComplaint = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  complaintMessage = {
    create: jest.fn(),
  };

  noticeMisuseRecord = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  transparencyReport = {
    findFirst: jest.fn(),
    create: jest.fn(),
  };

  offer = {
    findUnique: jest.fn(),
  };

  user = {
    findUnique: jest.fn(),
  };
}

describe('DsaService', () => {
  let service: DsaService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = new MockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DsaService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DsaService>(DsaService);
  });

  // ===========================================================================
  // submitContentReport — DSA Art. 16
  // ===========================================================================
  describe('submitContentReport', () => {
    const baseDto = {
      targetType: ContentReportTarget.OFFER,
      targetId: 'offer-123',
      category: ContentReportCategory.FRAUD_SCAM,
      explanation: 'This is a fake job listing',
      goodFaithDeclaration: true,
    };

    it('should create a report with authenticated user', async () => {
      const mockReport = {
        id: 'report-1',
        publicId: 'RPT-ABC123',
        reporterId: 'user-1',
        ...baseDto,
        status: ContentReportStatus.RECEIVED,
        priority: ContentReportPriority.HIGH,
        acknowledgedAt: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.contentReport.create.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({ ...mockReport, acknowledgedAt: new Date() });
      prisma.offer.findUnique.mockResolvedValue({ id: 'offer-123', jobTitle: 'Test' });

      const result = await service.submitContentReport(baseDto, 'user-1', '127.0.0.1', 'Mozilla/5.0');

      expect(prisma.contentReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reporterId: 'user-1',
            reporterIp: '127.0.0.1',
            targetType: ContentReportTarget.OFFER,
            targetId: 'offer-123',
            category: ContentReportCategory.FRAUD_SCAM,
            explanation: 'This is a fake job listing',
            goodFaithDeclaration: true,
            status: ContentReportStatus.RECEIVED,
          }),
        }),
      );
    });

    it('should throw BadRequestException for anonymous report without email', async () => {
      await expect(
        service.submitContentReport(baseDto, null, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow anonymous report with reporter email', async () => {
      const dtoWithEmail = { ...baseDto, reporterEmail: 'anon@example.com' };
      const mockReport = {
        id: 'report-2',
        publicId: 'RPT-DEF456',
        reporterId: null,
        reporterEmail: 'anon@example.com',
        ...baseDto,
        status: ContentReportStatus.RECEIVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.contentReport.create.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({ ...mockReport, acknowledgedAt: new Date() });

      const result = await service.submitContentReport(dtoWithEmail, null);

      expect(prisma.contentReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reporterId: null,
            reporterEmail: 'anon@example.com',
          }),
        }),
      );
    });

    it('should set URGENT priority for child safety reports', async () => {
      const childSafetyDto = {
        ...baseDto,
        category: ContentReportCategory.CHILD_SAFETY,
      };
      const mockReport = {
        id: 'report-3',
        ...childSafetyDto,
        status: ContentReportStatus.RECEIVED,
        priority: ContentReportPriority.URGENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.contentReport.create.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({ ...mockReport, acknowledgedAt: new Date() });

      await service.submitContentReport(childSafetyDto, 'user-1');

      expect(prisma.contentReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: ContentReportPriority.URGENT,
          }),
        }),
      );
    });

    it('should set HIGH priority for harassment reports', async () => {
      const harassmentDto = {
        ...baseDto,
        category: ContentReportCategory.HARASSMENT,
      };
      const mockReport = {
        id: 'report-4',
        ...harassmentDto,
        status: ContentReportStatus.RECEIVED,
        priority: ContentReportPriority.HIGH,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.contentReport.create.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({ ...mockReport, acknowledgedAt: new Date() });

      await service.submitContentReport(harassmentDto, 'user-1');

      expect(prisma.contentReport.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            priority: ContentReportPriority.HIGH,
          }),
        }),
      );
    });

    it('should acknowledge report immediately (DSA Art. 16(4))', async () => {
      const mockReport = {
        id: 'report-5',
        publicId: 'RPT-GHI789',
        ...baseDto,
        reporterId: 'user-1',
        status: ContentReportStatus.RECEIVED,
        acknowledgedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.contentReport.create.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({ ...mockReport, acknowledgedAt: new Date() });

      await service.submitContentReport(baseDto, 'user-1');

      // The acknowledgeReport method calls prisma.contentReport.update
      expect(prisma.contentReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'report-5' },
          data: expect.objectContaining({
            acknowledgedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // getReportByPublicId
  // ===========================================================================
  describe('getReportByPublicId', () => {
    it('should return a report by public ID', async () => {
      const mockReport = {
        id: 'report-1',
        publicId: 'RPT-ABC123',
        status: ContentReportStatus.RECEIVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.contentReport.findUnique.mockResolvedValue(mockReport);

      const result = await service.getReportByPublicId('RPT-ABC123');

      expect(result).toBeDefined();
      expect(prisma.contentReport.findUnique).toHaveBeenCalledWith({
        where: { publicId: 'RPT-ABC123' },
      });
    });

    it('should throw NotFoundException for non-existent report', async () => {
      prisma.contentReport.findUnique.mockResolvedValue(null);

      await expect(service.getReportByPublicId('NONEXISTENT')).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // assessReport — admin moderation
  // ===========================================================================
  describe('assessReport', () => {
    it('should assess a report and update its status', async () => {
      const mockReport = {
        id: 'report-1',
        status: ContentReportStatus.RECEIVED,
      };
      prisma.contentReport.findUnique.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({
        ...mockReport,
        status: ContentReportStatus.ASSESSMENT,
        assessmentResult: ContentReportAssessment.ILLEGAL_CONTENT_FOUND,
      });

      const result = await service.assessReport('report-1', 'admin-1', {
        assessmentResult: ContentReportAssessment.ILLEGAL_CONTENT_FOUND,
        assessmentNotes: 'Content violates Dutch law',
      });

      expect(prisma.contentReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'report-1' },
          data: expect.objectContaining({
            assessmentResult: ContentReportAssessment.ILLEGAL_CONTENT_FOUND,
            assessmentNotes: 'Content violates Dutch law',
            assessedAt: expect.any(Date),
            assessedBy: 'admin-1',
            status: ContentReportStatus.ASSESSMENT,
          }),
        }),
      );
    });

    it('should throw BadRequestException if report is already resolved', async () => {
      const resolvedReport = {
        id: 'report-1',
        status: ContentReportStatus.RESOLVED,
      };
      prisma.contentReport.findUnique.mockResolvedValue(resolvedReport);

      await expect(
        service.assessReport('report-1', 'admin-1', {
          assessmentResult: ContentReportAssessment.ILLEGAL_CONTENT_FOUND,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if report does not exist', async () => {
      prisma.contentReport.findUnique.mockResolvedValue(null);

      await expect(
        service.assessReport('nonexistent', 'admin-1', {
          assessmentResult: ContentReportAssessment.ILLEGAL_CONTENT_FOUND,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // takeAction — DSA Art. 16/17
  // ===========================================================================
  describe('takeAction', () => {
    it('should take action on a report and set status to ACTION_TAKEN', async () => {
      const mockReport = { id: 'report-1', status: ContentReportStatus.ASSESSMENT };
      prisma.contentReport.findUnique.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({
        ...mockReport,
        status: ContentReportStatus.ACTION_TAKEN,
        actionTaken: ContentReportAction.CONTENT_REMOVED,
      });

      const result = await service.takeAction('report-1', 'admin-1', {
        actionTaken: ContentReportAction.CONTENT_REMOVED,
      });

      expect(prisma.contentReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionTaken: ContentReportAction.CONTENT_REMOVED,
            actionTakenAt: expect.any(Date),
            actionTakenBy: 'admin-1',
            status: ContentReportStatus.ACTION_TAKEN,
          }),
        }),
      );
    });

    it('should escalate to authorities for ESCALATED_TO_AUTHORITIES action', async () => {
      const mockReport = { id: 'report-1', status: ContentReportStatus.ASSESSMENT };
      prisma.contentReport.findUnique.mockResolvedValue(mockReport);

      // First update call is the takeAction, second is the escalation status update
      prisma.contentReport.update
        .mockResolvedValueOnce({
          ...mockReport,
          status: ContentReportStatus.ACTION_TAKEN,
          actionTaken: ContentReportAction.ESCALATED_TO_AUTHORITIES,
        })
        .mockResolvedValueOnce({
          ...mockReport,
          status: ContentReportStatus.ESCALATED,
          referredToAuthorities: true,
        });

      await service.takeAction('report-1', 'admin-1', {
        actionTaken: ContentReportAction.ESCALATED_TO_AUTHORITIES,
        actionDetails: { reason: 'Suspected criminal activity involving threat to life' },
      });

      // Second update should set referredToAuthorities and ESCALATED status
      expect(prisma.contentReport.update).toHaveBeenCalledTimes(2);
      expect(prisma.contentReport.update).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          where: { id: 'report-1' },
          data: expect.objectContaining({
            referredToAuthorities: true,
            status: ContentReportStatus.ESCALATED,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // resolveReport
  // ===========================================================================
  describe('resolveReport', () => {
    it('should resolve a report with resolution notes', async () => {
      const mockReport = { id: 'report-1', status: ContentReportStatus.ACTION_TAKEN };
      prisma.contentReport.findUnique.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({
        ...mockReport,
        status: ContentReportStatus.RESOLVED,
        resolution: ContentReportResolution.CONTENT_TAKEN_DOWN,
      });

      await service.resolveReport('report-1', 'admin-1', {
        resolution: ContentReportResolution.CONTENT_TAKEN_DOWN,
        resolutionNotes: 'Content removed for violating ToS',
      });

      expect(prisma.contentReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resolution: ContentReportResolution.CONTENT_TAKEN_DOWN,
            resolutionNotes: 'Content removed for violating ToS',
            resolvedAt: expect.any(Date),
            resolvedBy: 'admin-1',
            status: ContentReportStatus.RESOLVED,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // escalateToAuthorities — DSA Art. 18
  // ===========================================================================
  describe('escalateToAuthorities', () => {
    it('should set URGENT priority and ESCALATED status', async () => {
      const mockReport = { id: 'report-1', status: ContentReportStatus.ASSESSMENT };
      prisma.contentReport.findUnique.mockResolvedValue(mockReport);
      prisma.contentReport.update.mockResolvedValue({
        ...mockReport,
        status: ContentReportStatus.ESCALATED,
        referredToAuthorities: true,
        priority: ContentReportPriority.URGENT,
      });

      await service.escalateToAuthorities('report-1', 'admin-1', {
        authorityReferralNotes: 'Suspected child exploitation content',
      });

      expect(prisma.contentReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referredToAuthorities: true,
            authorityReferralNotes: 'Suspected child exploitation content',
            status: ContentReportStatus.ESCALATED,
            priority: ContentReportPriority.URGENT,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // createStatementOfReasons — DSA Art. 17
  // ===========================================================================
  describe('createStatementOfReasons', () => {
    it('should create a statement of reasons and link it to the report', async () => {
      const mockReport = { id: 'report-1' };
      const mockStatement = {
        id: 'sor-1',
        contentReportId: 'report-1',
        restrictionType: ContentRestrictionType.REMOVAL,
        reasons: ['illegal_content', 'terms_violation'],
        detailedExplanation: 'This content violates Dutch criminal law Art. 137c',
        decisionSource: DecisionSource.USER_REPORT,
      };

      prisma.contentReport.findUnique.mockResolvedValue(mockReport);
      prisma.statementOfReasons.create.mockResolvedValue(mockStatement);
      prisma.contentReport.update.mockResolvedValue({ ...mockReport, statementOfReasonsId: 'sor-1' });

      const result = await service.createStatementOfReasons('report-1', 'admin-1', {
        restrictionType: ContentRestrictionType.REMOVAL,
        reasons: ['illegal_content', 'terms_violation'],
        detailedExplanation: 'This content violates Dutch criminal law Art. 137c',
        decisionSource: DecisionSource.USER_REPORT,
      });

      expect(prisma.statementOfReasons.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentReportId: 'report-1',
            restrictionType: ContentRestrictionType.REMOVAL,
            reasons: ['illegal_content', 'terms_violation'],
            detailedExplanation: 'This content violates Dutch criminal law Art. 137c',
            decisionSource: DecisionSource.USER_REPORT,
            appealDeadline: expect.any(Date),
          }),
        }),
      );

      // Should also update the report
      expect(prisma.contentReport.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'report-1' },
          data: expect.objectContaining({
            statementOfReasonsId: 'sor-1',
          }),
        }),
      );
    });

    it('should throw NotFoundException if report does not exist', async () => {
      prisma.contentReport.findUnique.mockResolvedValue(null);

      await expect(
        service.createStatementOfReasons('nonexistent', 'admin-1', {
          restrictionType: ContentRestrictionType.REMOVAL,
          reasons: ['illegal_content'],
          detailedExplanation: 'test',
          decisionSource: DecisionSource.USER_REPORT,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // submitComplaint — DSA Art. 20
  // ===========================================================================
  describe('submitComplaint', () => {
    it('should create a complaint and acknowledge it', async () => {
      const mockComplaint = {
        id: 'complaint-1',
        complainantId: 'user-1',
        complainantEmail: 'user@example.com',
        complaintType: 'CONTENT_MODERATION_DECISION',
        description: 'I disagree with the removal of my content',
        status: DSAComplaintStatus.SUBMITTED,
        submittedAt: new Date(),
        acknowledgedAt: new Date(),
      };

      prisma.dSAComplaint.create.mockResolvedValue(mockComplaint);
      prisma.dSAComplaint.update.mockResolvedValue({ ...mockComplaint, acknowledgedAt: new Date() });

      const result = await service.submitComplaint('user-1', 'user@example.com', {
        complaintType: 'CONTENT_MODERATION_DECISION' as any,
        description: 'I disagree with the removal of my content',
      });

      expect(prisma.dSAComplaint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            complainantId: 'user-1',
            complainantEmail: 'user@example.com',
            complaintType: 'CONTENT_MODERATION_DECISION',
            description: 'I disagree with the removal of my content',
            status: DSAComplaintStatus.SUBMITTED,
          }),
        }),
      );

      // Should acknowledge within 24 hours (DSA Art. 20(3))
      expect(prisma.dSAComplaint.update).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // flagMisuse — DSA Art. 23
  // ===========================================================================
  describe('flagMisuse', () => {
    it('should create a misuse record for a user', async () => {
      const mockRecord = {
        id: 'misuse-1',
        userId: 'user-1',
        misuseType: MisuseType.FRIVOLOUS_REPORTS,
        description: 'Submitted 10 manifestly unfounded reports in 24 hours',
        warningLevel: WarningLevel.FIRST_WARNING,
      };

      prisma.noticeMisuseRecord.create.mockResolvedValue(mockRecord);

      const result = await service.flagMisuse('user-1', 'admin-1', {
        misuseType: MisuseType.FRIVOLOUS_REPORTS,
        description: 'Submitted 10 manifestly unfounded reports in 24 hours',
        warningLevel: WarningLevel.FIRST_WARNING,
      });

      expect(prisma.noticeMisuseRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            misuseType: MisuseType.FRIVOLOUS_REPORTS,
            description: 'Submitted 10 manifestly unfounded reports in 24 hours',
            warningLevel: WarningLevel.FIRST_WARNING,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // getUserMisuseStatus
  // ===========================================================================
  describe('getUserMisuseStatus', () => {
    it('should return correct misuse status', async () => {
      prisma.noticeMisuseRecord.findMany.mockResolvedValue([
        { warningLevel: WarningLevel.FIRST_WARNING, isLifted: false },
        { warningLevel: WarningLevel.SECOND_WARNING, isLifted: false },
      ]);

      const status = await service.getUserMisuseStatus('user-1');

      expect(status.userId).toBe('user-1');
      expect(status.totalFlags).toBe(2);
      expect(status.activeWarnings).toBe(2);
      expect(status.isReportingSuspended).toBe(false);
      expect(status.isReportingBanned).toBe(false);
    });

    it('should detect suspended users', async () => {
      prisma.noticeMisuseRecord.findMany.mockResolvedValue([
        { warningLevel: WarningLevel.TEMPORARY_REPORTING_SUSPENSION, isLifted: false },
      ]);

      const status = await service.getUserMisuseStatus('user-1');

      expect(status.isReportingSuspended).toBe(true);
    });

    it('should detect banned users', async () => {
      prisma.noticeMisuseRecord.findMany.mockResolvedValue([
        { warningLevel: WarningLevel.PERMANENT_REPORTING_BAN, isLifted: false },
      ]);

      const status = await service.getUserMisuseStatus('user-1');

      expect(status.isReportingBanned).toBe(true);
    });
  });

  // ===========================================================================
  // liftMisuseFlag
  // ===========================================================================
  describe('liftMisuseFlag', () => {
    it('should lift a misuse flag', async () => {
      const mockRecord = { id: 'misuse-1', isLifted: false };
      prisma.noticeMisuseRecord.findUnique.mockResolvedValue(mockRecord);
      prisma.noticeMisuseRecord.update = jest.fn().mockResolvedValue({ ...mockRecord, isLifted: true });

      await service.liftMisuseFlag('misuse-1', 'admin-1');

      expect(prisma.noticeMisuseRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'misuse-1' },
          data: expect.objectContaining({
            isLifted: true,
            liftedAt: expect.any(Date),
            liftedBy: 'admin-1',
          }),
        }),
      );
    });

    it('should throw NotFoundException if record does not exist', async () => {
      prisma.noticeMisuseRecord.findUnique.mockResolvedValue(null);

      await expect(service.liftMisuseFlag('nonexistent', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // getTransparencyStatistics
  // ===========================================================================
  describe('getTransparencyStatistics', () => {
    it('should return live statistics when no published report exists', async () => {
      prisma.transparencyReport.findFirst.mockResolvedValue(null);
      prisma.contentReport.count.mockResolvedValue(42);
      prisma.noticeMisuseRecord.count.mockResolvedValue(3);

      const stats = await service.getTransparencyStatistics() as any;

      expect(stats.isLive).toBe(true);
      expect(stats.totalReportsReceived).toBe(42);
    });

    it('should return published report when one exists', async () => {
      const publishedReport = {
        id: 'report-1',
        isPublished: true,
        totalReportsReceived: 100,
        periodStart: '2026-01-01',
        periodEnd: '2026-06-30',
      };
      prisma.transparencyReport.findFirst.mockResolvedValue(publishedReport);

      const stats = await service.getTransparencyStatistics();

      expect(stats).toEqual(publishedReport);
    });
  });

  // ===========================================================================
  // getUserReports
  // ===========================================================================
  describe('getUserReports', () => {
    it('should return paginated reports for a user', async () => {
      const mockReports = [
        { id: 'report-1', reporterId: 'user-1', createdAt: new Date() },
        { id: 'report-2', reporterId: 'user-1', createdAt: new Date() },
      ];

      prisma.contentReport.findMany.mockResolvedValue(mockReports);
      prisma.contentReport.count.mockResolvedValue(2);

      const result = await service.getUserReports('user-1', 1, 20);

      expect(result.reports).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });
  });

  // ===========================================================================
  // getAllReports (admin)
  // ===========================================================================
  describe('getAllReports', () => {
    it('should return paginated reports with filters', async () => {
      prisma.contentReport.findMany.mockResolvedValue([]);
      prisma.contentReport.count.mockResolvedValue(0);

      const result = await service.getAllReports(1, 20, {
        status: ContentReportStatus.RECEIVED,
      });

      expect(result.reports).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should apply category filter', async () => {
      prisma.contentReport.findMany.mockResolvedValue([]);
      prisma.contentReport.count.mockResolvedValue(0);

      await service.getAllReports(1, 20, {
        category: ContentReportCategory.FRAUD_SCAM,
      });

      expect(prisma.contentReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: ContentReportCategory.FRAUD_SCAM,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // submitComplaint
  // ===========================================================================
  describe('submitComplaint and getComplaintById', () => {
    it('should throw ForbiddenException when non-owner tries to view complaint', async () => {
      const mockComplaint = {
        id: 'complaint-1',
        complainantId: 'user-1',
        messages: [],
      };

      prisma.dSAComplaint.findUnique.mockResolvedValue(mockComplaint);

      await expect(
        service.getComplaintById('complaint-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return complaint when owner views it', async () => {
      const mockComplaint = {
        id: 'complaint-1',
        complainantId: 'user-1',
        submittedAt: new Date(),
        messages: [],
      };

      prisma.dSAComplaint.findUnique.mockResolvedValue(mockComplaint);

      const result = await service.getComplaintById('complaint-1', 'user-1');

      expect(result).toBeDefined();
    });
  });
});