import { Test, TestingModule } from '@nestjs/testing';
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
  DSAComplaintType,
  DSAComplaintStatus,
  MisuseType,
  WarningLevel,
} from '@prisma/client';
import { DsaController } from '../dsa.controller';
import { DsaService } from '../dsa.service';

describe('DsaController', () => {
  let controller: DsaController;
  let dsaService: Partial<DsaService>;

  const mockReport = {
    id: 'report-1',
    publicId: 'RPT-ABC123',
    reporterId: 'user-1',
    targetType: ContentReportTarget.OFFER,
    targetId: 'offer-123',
    category: ContentReportCategory.FRAUD_SCAM,
    explanation: 'Fake job listing',
    goodFaithDeclaration: true,
    status: ContentReportStatus.RECEIVED,
    priority: ContentReportPriority.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    acknowledgedAt: new Date().toISOString(),
  };

  const mockComplaint = {
    id: 'complaint-1',
    complainantId: 'user-1',
    complainantEmail: 'user@example.com',
    complaintType: DSAComplaintType.CONTENT_MODERATION_DECISION,
    description: 'I disagree with the content removal',
    status: DSAComplaintStatus.SUBMITTED,
    submittedAt: new Date().toISOString(),
    acknowledgedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    dsaService = {
      submitContentReport: jest.fn().mockResolvedValue(mockReport),
      getReportByPublicId: jest.fn().mockResolvedValue(mockReport),
      getUserReports: jest.fn().mockResolvedValue({ reports: [mockReport], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      getAllReports: jest.fn().mockResolvedValue({ reports: [mockReport], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      getReportById: jest.fn().mockResolvedValue(mockReport),
      assignReport: jest.fn().mockResolvedValue({ ...mockReport, status: ContentReportStatus.ASSESSMENT }),
      assessReport: jest.fn().mockResolvedValue({ ...mockReport, assessmentResult: ContentReportAssessment.ILLEGAL_CONTENT_FOUND }),
      takeAction: jest.fn().mockResolvedValue({ ...mockReport, actionTaken: ContentReportAction.CONTENT_REMOVED }),
      resolveReport: jest.fn().mockResolvedValue({ ...mockReport, resolution: ContentReportResolution.CONTENT_TAKEN_DOWN }),
      escalateToAuthorities: jest.fn().mockResolvedValue({ ...mockReport, status: ContentReportStatus.ESCALATED }),
      createStatementOfReasons: jest.fn().mockResolvedValue({ id: 'sor-1', contentReportId: 'report-1' }),
      submitComplaint: jest.fn().mockResolvedValue(mockComplaint),
      getUserComplaints: jest.fn().mockResolvedValue({ complaints: [mockComplaint], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      getComplaintById: jest.fn().mockResolvedValue(mockComplaint),
      addComplaintMessage: jest.fn().mockResolvedValue({ id: 'msg-1', content: 'Test message' }),
      getAllComplaints: jest.fn().mockResolvedValue({ complaints: [mockComplaint], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }),
      flagMisuse: jest.fn().mockResolvedValue({ id: 'misuse-1', userId: 'user-1' }),
      getUserMisuseStatus: jest.fn().mockResolvedValue({ userId: 'user-1', totalFlags: 0, activeWarnings: 0, isReportingSuspended: false, isReportingBanned: false }),
      liftMisuseFlag: jest.fn().mockResolvedValue({ id: 'misuse-1', isLifted: true }),
      getTransparencyStatistics: jest.fn().mockResolvedValue({ isLive: true, totalReportsReceived: 42 }),
      generateTransparencyReport: jest.fn().mockResolvedValue({ id: 'trans-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DsaController],
      providers: [{ provide: DsaService, useValue: dsaService }],
    }).compile();

    controller = module.get<DsaController>(DsaController);
  });

  // ===========================================================================
  // POST /dsa/reports (public — DSA Art. 16)
  // ===========================================================================
  describe('submitContentReport', () => {
    it('should submit a content report without authentication', async () => {
      const dto = {
        targetType: ContentReportTarget.OFFER,
        targetId: 'offer-123',
        category: ContentReportCategory.FRAUD_SCAM,
        explanation: 'Fake job listing',
        goodFaithDeclaration: true,
        reporterEmail: 'anon@example.com',
      };

      const req = { ip: '127.0.0.1', headers: { 'user-agent': 'Mozilla/5.0' } };
      const result = await controller.submitContentReport(dto, req);

      expect(dsaService.submitContentReport).toHaveBeenCalledWith(
        dto,
        null, // no authenticated user
        '127.0.0.1',
        'Mozilla/5.0',
      );
      expect(result).toEqual(mockReport);
    });

    it('should include user ID when authenticated', async () => {
      const dto = {
        targetType: ContentReportTarget.USER_PROFILE,
        targetId: 'user-456',
        category: ContentReportCategory.HARASSMENT,
        explanation: 'Harassing messages',
        goodFaithDeclaration: true,
      };

      const req = { user: { id: 'reporter-1' }, ip: '192.168.1.1', headers: { 'user-agent': 'Test/1.0' } };
      const result = await controller.submitContentReport(dto, req);

      expect(dsaService.submitContentReport).toHaveBeenCalledWith(
        dto,
        'reporter-1',
        '192.168.1.1',
        'Test/1.0',
      );
    });
  });

  // ===========================================================================
  // GET /dsa/reports/:publicId/status (public)
  // ===========================================================================
  describe('getReportStatus', () => {
    it('should return report status by public ID', async () => {
      const result = await controller.getReportStatus('RPT-ABC123');

      expect(dsaService.getReportByPublicId).toHaveBeenCalledWith('RPT-ABC123');
      expect(result).toEqual(mockReport);
    });
  });

  // ===========================================================================
  // GET /dsa/reports/my-reports (authenticated)
  // ===========================================================================
  describe('getMyReports', () => {
    it('should return paginated reports for the authenticated user', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.getMyReports(req, '1', '20');

      expect(dsaService.getUserReports).toHaveBeenCalledWith('user-1', 1, 20);
      expect(result.reports).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Admin endpoints
  // ===========================================================================
  describe('admin endpoints', () => {
    const adminReq = { user: { id: 'admin-1' } };

    it('should get all reports with filters', async () => {
      const result = await controller.getAllReports('1', '20', undefined, undefined, undefined, undefined);

      expect(dsaService.getAllReports).toHaveBeenCalledWith(1, 20, {});
      expect(result.reports).toHaveLength(1);
    });

    it('should get a single report by ID', async () => {
      const result = await controller.getReportById('report-1');

      expect(dsaService.getReportById).toHaveBeenCalledWith('report-1');
    });

    it('should assign a report', async () => {
      const result = await controller.assignReport('report-1', adminReq);

      expect(dsaService.assignReport).toHaveBeenCalledWith('report-1', 'admin-1');
    });

    it('should assess a report', async () => {
      const dto = {
        assessmentResult: ContentReportAssessment.ILLEGAL_CONTENT_FOUND,
        assessmentNotes: 'Content violates Dutch law',
      };

      const result = await controller.assessReport('report-1', dto, adminReq);

      expect(dsaService.assessReport).toHaveBeenCalledWith('report-1', 'admin-1', dto);
    });

    it('should take action on a report', async () => {
      const dto = {
        actionTaken: ContentReportAction.CONTENT_REMOVED,
      };

      const result = await controller.takeAction('report-1', dto, adminReq);

      expect(dsaService.takeAction).toHaveBeenCalledWith('report-1', 'admin-1', dto);
    });

    it('should resolve a report', async () => {
      const dto = {
        resolution: ContentReportResolution.CONTENT_TAKEN_DOWN,
        resolutionNotes: 'Content removed',
      };

      const result = await controller.resolveReport('report-1', dto, adminReq);

      expect(dsaService.resolveReport).toHaveBeenCalledWith('report-1', 'admin-1', dto);
    });

    it('should escalate to authorities', async () => {
      const dto = {
        authorityReferralNotes: 'Suspected criminal activity',
      };

      const result = await controller.escalateToAuthorities('report-1', dto, adminReq);

      expect(dsaService.escalateToAuthorities).toHaveBeenCalledWith('report-1', 'admin-1', dto);
    });

    it('should create a statement of reasons', async () => {
      const dto = {
        restrictionType: ContentRestrictionType.REMOVAL,
        reasons: ['illegal_content'],
        detailedExplanation: 'Content violates Dutch criminal law',
        decisionSource: DecisionSource.USER_REPORT,
      };

      const result = await controller.createStatementOfReasons('report-1', dto, adminReq);

      expect(dsaService.createStatementOfReasons).toHaveBeenCalledWith('report-1', 'admin-1', dto);
    });
  });

  // ===========================================================================
  // Complaint endpoints
  // ===========================================================================
  describe('complaint endpoints', () => {
    it('should submit a complaint', async () => {
      const dto = {
        complaintType: DSAComplaintType.CONTENT_MODERATION_DECISION,
        description: 'I disagree with the removal of my content',
      };

      const req = { user: { id: 'user-1', email: 'user@example.com' } };
      const result = await controller.submitComplaint(dto, req);

      expect(dsaService.submitComplaint).toHaveBeenCalledWith('user-1', 'user@example.com', dto);
    });

    it('should get my complaints', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.getMyComplaints(req, '1', '20');

      expect(dsaService.getUserComplaints).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should get a complaint by ID', async () => {
      const req = { user: { id: 'user-1' } };
      const result = await controller.getComplaintById('complaint-1', req);

      expect(dsaService.getComplaintById).toHaveBeenCalledWith('complaint-1', 'user-1');
    });

    it('should add a message to a complaint', async () => {
      const dto = { content: 'I would like to appeal this decision' };
      const req = { user: { id: 'user-1' } };

      const result = await controller.addComplaintMessage('complaint-1', dto, req);

      expect(dsaService.addComplaintMessage).toHaveBeenCalledWith('complaint-1', 'user-1', dto);
    });
  });

  // ===========================================================================
  // Misuse endpoints (DSA Art. 23)
  // ===========================================================================
  describe('misuse endpoints', () => {
    const adminReq = { user: { id: 'admin-1' } };

    it('should flag a user for misuse', async () => {
      const dto = {
        misuseType: MisuseType.FRIVOLOUS_REPORTS,
        description: 'Submitted 10 unfounded reports',
        warningLevel: WarningLevel.FIRST_WARNING,
      };

      const result = await controller.flagMisuse('user-1', dto, adminReq);

      expect(dsaService.flagMisuse).toHaveBeenCalledWith('user-1', 'admin-1', dto);
    });

    it('should get user misuse status', async () => {
      const result = await controller.getUserMisuseStatus('user-1');

      expect(dsaService.getUserMisuseStatus).toHaveBeenCalledWith('user-1');
      expect(result.isReportingSuspended).toBe(false);
    });

    it('should lift a misuse flag', async () => {
      const result = await controller.liftMisuseFlag('misuse-1', adminReq);

      expect(dsaService.liftMisuseFlag).toHaveBeenCalledWith('misuse-1', 'admin-1');
    });
  });

  // ===========================================================================
  // Transparency endpoints (DSA Arts. 15/24)
  // ===========================================================================
  describe('transparency endpoints', () => {
    it('should return public transparency statistics', async () => {
      const result = await controller.getTransparencyStatistics();

      expect(dsaService.getTransparencyStatistics).toHaveBeenCalled();
      expect((result as any).isLive).toBe(true);
    });

    it('should generate a transparency report (admin)', async () => {
      const body = {
        periodStart: '2026-01-01',
        periodEnd: '2026-06-30',
      };

      const result = await controller.generateTransparencyReport(body);

      expect(dsaService.generateTransparencyReport).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );
    });
  });
});