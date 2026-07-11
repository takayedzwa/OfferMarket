import { Test, TestingModule } from '@nestjs/testing';
import { PrivacyController } from '../privacy.controller';
import { PrivacyService } from '../privacy.service';
import { RetentionService } from '../retention.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConsentType, LegalBasis, ExportFormat } from '@prisma/client';

describe('PrivacyController', () => {
  let controller: PrivacyController;
  let privacyService: Partial<PrivacyService>;
  let retentionService: Partial<RetentionService>;
  let prismaService: Partial<PrismaService>;

  beforeEach(async () => {
    privacyService = {
      getUserConsents: jest.fn().mockResolvedValue([]),
      getRequiredConsents: jest.fn().mockResolvedValue({ required: [], optional: [] }),
      recordConsent: jest.fn().mockResolvedValue({ id: 'c-1', granted: true }),
      withdrawConsent: jest.fn().mockResolvedValue({ success: true }),
      gatherAllUserData: jest.fn().mockResolvedValue({}),
      requestDataExport: jest.fn().mockResolvedValue({ id: 'export-1' }),
      getExportStatus: jest.fn().mockResolvedValue([]),
      processDataExport: jest.fn().mockResolvedValue({}),
      requestDeletion: jest.fn().mockResolvedValue({ id: 'del-1' }),
      confirmDeletion: jest.fn().mockResolvedValue({}),
      cancelDeletion: jest.fn().mockResolvedValue({ success: true }),
      setProcessingRestriction: jest.fn().mockResolvedValue({
        processingRestricted: true,
        processingRestrictedAt: new Date(),
      }),
      getUserGdprFlags: jest.fn().mockResolvedValue(null),
      requestRectification: jest.fn().mockResolvedValue({}),
      objectToProcessing: jest.fn().mockResolvedValue({}),
      getUserRequests: jest.fn().mockResolvedValue([]),
      getAllRequests: jest.fn().mockResolvedValue({ requests: [], pagination: {} }),
      getBreaches: jest.fn().mockResolvedValue({ breaches: [], pagination: {} }),
      reportBreach: jest.fn().mockResolvedValue({}),
      getRetentionPolicies: jest.fn().mockResolvedValue([]),
      getProcessingActivities: jest.fn().mockResolvedValue([]),
      seedRetentionPolicies: jest.fn().mockResolvedValue(undefined),
      seedProcessingActivities: jest.fn().mockResolvedValue(undefined),
      getPrivacyPolicy: jest.fn().mockResolvedValue({ version: '1.0', content: 'Privacy policy content' }),
      getTermsOfService: jest.fn().mockResolvedValue({ version: '1.0', content: 'Terms of service content' }),
    };

    retentionService = {
      runAllRetentionTasks: jest.fn().mockResolvedValue({}),
    };

    prismaService = {
      dataDeletionRequest: { count: jest.fn().mockResolvedValue(0) } as any,
      dataExportRequest: { count: jest.fn().mockResolvedValue(0) } as any,
      dataRetentionPolicy: { count: jest.fn().mockResolvedValue(0) } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrivacyController],
      providers: [
        { provide: PrivacyService, useValue: privacyService },
        { provide: RetentionService, useValue: retentionService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    controller = module.get<PrivacyController>(PrivacyController);
  });

  // ===========================================================================
  // IDOR PREVENTION — userId must come from JWT, never from query params
  // ===========================================================================
  describe('IDOR prevention — getAuthenticatedUserId', () => {
    it('should extract userId from req.user.id', () => {
      const req = { user: { id: 'jwt-user-1' } };
      const result = (controller as any).getAuthenticatedUserId(req);
      expect(result).toBe('jwt-user-1');
    });

    it('should fall back to req.user.sub when id is missing', () => {
      const req = { user: { sub: 'jwt-user-2' } };
      const result = (controller as any).getAuthenticatedUserId(req);
      expect(result).toBe('jwt-user-2');
    });

    it('should fall back to req.user.userId when id and sub are missing', () => {
      const req = { user: { userId: 'jwt-user-3' } };
      const result = (controller as any).getAuthenticatedUserId(req);
      expect(result).toBe('jwt-user-3');
    });

    it('should prefer req.user.id over sub and userId', () => {
      const req = { user: { id: 'primary', sub: 'secondary', userId: 'tertiary' } };
      const result = (controller as any).getAuthenticatedUserId(req);
      expect(result).toBe('primary');
    });
  });

  // ===========================================================================
  // CONSENT ENDPOINTS
  // ===========================================================================
  describe('getUserConsents', () => {
    it('should use authenticated userId, not query params', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      await controller.getUserConsents(req);
      expect(privacyService.getUserConsents).toHaveBeenCalledWith('jwt-user-1');
    });
  });

  describe('recordConsent', () => {
    it('should extract userId from JWT and pass IP + user-agent', async () => {
      const req = {
        user: { id: 'jwt-user-1' },
        ip: '127.0.0.1',
        headers: { 'user-agent': 'TestBrowser/1.0' },
      };
      const dto = {
        consentType: ConsentType.COOKIE_ANALYTICS,
        legalBasis: LegalBasis.CONSENT,
        version: '1.0',
        granted: true,
      };

      await controller.recordConsent(dto, req);

      expect(privacyService.recordConsent).toHaveBeenCalledWith(
        'jwt-user-1',
        ConsentType.COOKIE_ANALYTICS,
        LegalBasis.CONSENT,
        '1.0',
        '127.0.0.1',
        'TestBrowser/1.0',
      );
    });

    it('should use x-forwarded-for header when ip is not available', async () => {
      const req = {
        user: { id: 'jwt-user-1' },
        headers: {
          'x-forwarded-for': '10.0.0.1, 10.0.0.2',
          'user-agent': 'TestBrowser',
        },
      };
      const dto = {
        consentType: ConsentType.DATA_PROCESSING,
        legalBasis: LegalBasis.CONSENT,
        version: '1.0',
        granted: true,
      };

      await controller.recordConsent(dto, req);

      expect(privacyService.recordConsent).toHaveBeenCalledWith(
        'jwt-user-1',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        '10.0.0.1', // First IP from x-forwarded-for
        'TestBrowser',
      );
    });
  });

  describe('withdrawConsent', () => {
    it('should use authenticated userId from JWT', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      await controller.withdrawConsent(ConsentType.COOKIE_ANALYTICS, req);
      expect(privacyService.withdrawConsent).toHaveBeenCalledWith('jwt-user-1', ConsentType.COOKIE_ANALYTICS);
    });
  });

  // ===========================================================================
  // DATA SUBJECT RIGHTS ENDPOINTS
  // ===========================================================================
  describe('requestErasure', () => {
    it('should use authenticated userId from JWT (IDOR prevention)', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      await controller.requestErasure(req, { reason: 'test' });
      expect(privacyService.requestDeletion).toHaveBeenCalledWith('jwt-user-1', 'test');
    });
  });

  describe('confirmErasure', () => {
    it('should use authenticated userId from JWT (IDOR prevention)', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      await controller.confirmErasure(req, 'del-1');
      expect(privacyService.confirmDeletion).toHaveBeenCalledWith('jwt-user-1', 'del-1');
    });
  });

  describe('cancelErasure', () => {
    it('should use authenticated userId from JWT (IDOR prevention)', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      await controller.cancelErasure(req, 'del-1');
      expect(privacyService.cancelDeletion).toHaveBeenCalledWith('jwt-user-1', 'del-1');
    });
  });

  describe('requestRestriction', () => {
    it('should use authenticated userId from JWT and return serialized response', async () => {
      const restrictedAt = new Date('2026-07-11T12:00:00.000Z');
      (privacyService.setProcessingRestriction as jest.Mock).mockResolvedValue({
        processingRestricted: true,
        processingRestrictedAt: restrictedAt,
      });

      const req = { user: { id: 'jwt-user-1' } };
      const dto = { restricted: true };
      const result = await controller.requestRestriction(req, dto);

      expect(privacyService.setProcessingRestriction).toHaveBeenCalledWith('jwt-user-1', true);
      // Response should have ISO string date, not Date object
      expect(result.processingRestrictedAt).toBe(restrictedAt.toISOString());
    });
  });

  describe('removeRestriction', () => {
    it('should set restriction to false and return serialized response', async () => {
      (privacyService.setProcessingRestriction as jest.Mock).mockResolvedValue({
        processingRestricted: false,
        processingRestrictedAt: null,
      });

      const req = { user: { id: 'jwt-user-1' } };
      const result = await controller.removeRestriction(req);

      expect(privacyService.setProcessingRestriction).toHaveBeenCalledWith('jwt-user-1', false);
      expect(result.processingRestricted).toBe(false);
      expect(result.processingRestrictedAt).toBeNull();
    });
  });

  describe('getRestrictionStatus', () => {
    it('should return processingRestricted and processingRestrictedAt from flags', async () => {
      const restrictedAt = new Date('2026-07-11T12:00:00.000Z');
      (privacyService.getUserGdprFlags as jest.Mock).mockResolvedValue({
        processingRestricted: true,
        processingRestrictedAt: restrictedAt,
      });

      const req = { user: { id: 'jwt-user-1' } };
      const result = await controller.getRestrictionStatus(req);

      expect(result.processingRestricted).toBe(true);
      expect(result.processingRestrictedAt).toBe(restrictedAt.toISOString());
    });

    it('should return default values when no flags exist', async () => {
      (privacyService.getUserGdprFlags as jest.Mock).mockResolvedValue(null);

      const req = { user: { id: 'jwt-user-1' } };
      const result = await controller.getRestrictionStatus(req);

      expect(result.processingRestricted).toBe(false);
      expect(result.processingRestrictedAt).toBeNull();
    });
  });

  describe('requestDataExport', () => {
    it('should default to JSON format when no format specified', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      await controller.requestDataExport(req);
      expect(privacyService.requestDataExport).toHaveBeenCalledWith('jwt-user-1', ExportFormat.JSON, undefined);
    });
  });

  describe('requestRectification', () => {
    it('should use authenticated userId from JWT', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      const dto = { field: 'email', correctedValue: 'new@email.com', reason: 'typo' };
      await controller.requestRectification(req, dto);
      expect(privacyService.requestRectification).toHaveBeenCalledWith('jwt-user-1', 'email', 'new@email.com', 'typo');
    });
  });

  describe('requestObject', () => {
    it('should use authenticated userId from JWT', async () => {
      const req = { user: { id: 'jwt-user-1' } };
      const body = { processingType: 'marketing', reason: 'no interest' };
      await controller.requestObject(req, body);
      expect(privacyService.objectToProcessing).toHaveBeenCalledWith('jwt-user-1', 'marketing', 'no interest');
    });
  });

  // ===========================================================================
  // PUBLIC ENDPOINTS
  // ===========================================================================
  describe('public endpoints', () => {
    it('getPrivacyPolicy should not require authentication', async () => {
      const result = await controller.getPrivacyPolicy();
      // Should call service without any userId
      expect(privacyService.getPrivacyPolicy).toHaveBeenCalled();
    });

    it('getTermsOfService should not require authentication', async () => {
      const result = await controller.getTermsOfService();
      expect(privacyService.getTermsOfService).toHaveBeenCalled();
    });
  });
});