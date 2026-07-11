import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { PrivacyService } from '../privacy.service';
import { PrismaService } from '../../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Mock PrismaService — one mock per model method used by PrivacyService
// ---------------------------------------------------------------------------
class MockPrismaService {
  consent = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  };
  user = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  worker = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  employer = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  dataExportRequest = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  dataDeletionRequest = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  dataSubjectRequest = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  dataBreach = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  dataRetentionPolicy = {
    findMany: jest.fn(),
    upsert: jest.fn(),
  };
  processingActivity = {
    findMany: jest.fn(),
    upsert: jest.fn(),
  };
  privacyPolicyVersion = {
    findFirst: jest.fn(),
  };
  userGdprFlags = {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  };
  notification = {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  };
  offer = {
    findMany: jest.fn(),
  };
  conversation = {
    findMany: jest.fn(),
  };
  rating = {
    findMany: jest.fn(),
  };
  auditLog = {
    findMany: jest.fn(),
    create: jest.fn(),
  };
}

describe('PrivacyService', () => {
  let service: PrivacyService;
  let prisma: MockPrismaService;

  const mockDate = new Date('2026-07-11T12:00:00.000Z');

  beforeEach(async () => {
    prisma = new MockPrismaService();
    jest.useFakeTimers({ now: mockDate });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // ===========================================================================
  // CONSENT MANAGEMENT
  // ===========================================================================
  describe('recordConsent', () => {
    const userId = 'user-1';
    const consentType = ConsentType.COOKIE_ANALYTICS;
    const legalBasis = LegalBasis.CONSENT;
    const version = '1.0';

    it('should create a new consent record and return derived fields', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);
      prisma.consent.create.mockResolvedValue({
        id: 'consent-1',
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
        legalBasis,
        version,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: mockDate,
        updatedAt: mockDate,
        withdrawnAt: null,
        expiresAt: null,
      });

      const result = await service.recordConsent(userId, consentType, legalBasis, version, '127.0.0.1', 'test-agent');

      expect(result).toEqual({
        id: 'consent-1',
        consentType,
        granted: true,
        status: ConsentStatus.GIVEN,
        version,
        legalBasis,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        grantedAt: mockDate.toISOString(),
        withdrawnAt: null,
        expiresAt: null,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
      });
      expect(prisma.consent.create).toHaveBeenCalledWith({
        data: {
          userId,
          consentType,
          status: ConsentStatus.GIVEN,
          legalBasis,
          version,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
        },
      });
    });

    it('should return existing consent when same version already active (idempotent)', async () => {
      const existing = {
        id: 'consent-existing',
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
        legalBasis,
        version,
        ipAddress: null,
        userAgent: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        withdrawnAt: null,
        expiresAt: null,
      };
      prisma.consent.findFirst.mockResolvedValue(existing);

      const result = await service.recordConsent(userId, consentType, legalBasis, version);

      expect(prisma.consent.create).not.toHaveBeenCalled();
      expect(result.id).toBe('consent-existing');
      expect(result.granted).toBe(true);
      expect(result.grantedAt).toBe(mockDate.toISOString());
    });

    it('should withdraw old consent and create new when version differs', async () => {
      const oldConsent = {
        id: 'consent-old',
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
        legalBasis,
        version: '0.9',
        ipAddress: null,
        userAgent: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        withdrawnAt: null,
        expiresAt: null,
      };
      prisma.consent.findFirst.mockResolvedValue(oldConsent);
      prisma.consent.update.mockResolvedValue({ ...oldConsent, status: ConsentStatus.WITHDRAWN });
      prisma.consent.create.mockResolvedValue({
        id: 'consent-new',
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
        legalBasis,
        version: '1.0',
        ipAddress: null,
        userAgent: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        withdrawnAt: null,
        expiresAt: null,
      });

      const result = await service.recordConsent(userId, consentType, legalBasis, '1.0');

      // Old consent should be withdrawn first
      expect(prisma.consent.update).toHaveBeenCalledWith({
        where: { id: 'consent-old' },
        data: { status: ConsentStatus.WITHDRAWN, withdrawnAt: expect.any(Date) },
      });
      // Then a new one created
      expect(prisma.consent.create).toHaveBeenCalled();
      expect(result.id).toBe('consent-new');
    });

    it('should return date fields as ISO strings (never {})', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);
      prisma.consent.create.mockResolvedValue({
        id: 'consent-1',
        userId,
        consentType,
        status: ConsentStatus.GIVEN,
        legalBasis,
        version,
        ipAddress: null,
        userAgent: null,
        createdAt: mockDate,
        updatedAt: mockDate,
        withdrawnAt: null,
        expiresAt: null,
      });

      const result = await service.recordConsent(userId, consentType, legalBasis, version);

      // Every date field must be a string, never an empty object {}
      expect(typeof result.grantedAt).toBe('string');
      expect(result.grantedAt).toBe(mockDate.toISOString());
      expect(typeof result.createdAt).toBe('string');
      expect(result.withdrawnAt).toBeNull();
    });
  });

  describe('withdrawConsent', () => {
    const userId = 'user-1';

    it('should withdraw active consent and set withdrawnAt', async () => {
      prisma.consent.findMany.mockResolvedValue([
        { id: 'c-1', userId, consentType: ConsentType.COOKIE_ANALYTICS, status: ConsentStatus.GIVEN },
      ]);
      prisma.consent.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.withdrawConsent(userId, ConsentType.COOKIE_ANALYTICS);

      expect(result.success).toBe(true);
      expect(result.consentType).toBe(ConsentType.COOKIE_ANALYTICS);
      expect(result.withdrawnAt).toBeInstanceOf(Date);
      expect(prisma.consent.updateMany).toHaveBeenCalledWith({
        where: { userId, consentType: ConsentType.COOKIE_ANALYTICS, status: ConsentStatus.GIVEN },
        data: { status: ConsentStatus.WITHDRAWN, withdrawnAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when no active consent exists', async () => {
      prisma.consent.findMany.mockResolvedValue([]);

      await expect(service.withdrawConsent(userId, ConsentType.COOKIE_ANALYTICS))
        .rejects.toThrow(NotFoundException);
    });

    it('should cascade: SPECIAL_CATEGORY withdrawal nulls workAuthorization', async () => {
      prisma.consent.findMany.mockResolvedValue([
        { id: 'c-1', userId, consentType: ConsentType.SPECIAL_CATEGORY, status: ConsentStatus.GIVEN },
      ]);
      prisma.consent.updateMany.mockResolvedValue({ count: 1 });
      prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId });
      prisma.worker.update.mockResolvedValue({ id: 'worker-1' });

      await service.withdrawConsent(userId, ConsentType.SPECIAL_CATEGORY);

      // Should null out workAuthorization and immigration consent on the worker
      expect(prisma.worker.update).toHaveBeenCalledWith({
        where: { id: 'worker-1' },
        data: {
          workAuthorization: null,
          immigrationConsentGiven: false,
          immigrationConsentAt: null,
        },
      });
    });

    it('should not throw when SPECIAL_CATEGORY withdrawal has no worker profile', async () => {
      prisma.consent.findMany.mockResolvedValue([
        { id: 'c-1', userId, consentType: ConsentType.SPECIAL_CATEGORY, status: ConsentStatus.GIVEN },
      ]);
      prisma.consent.updateMany.mockResolvedValue({ count: 1 });
      prisma.worker.findUnique.mockResolvedValue(null);

      // Should not throw even though worker doesn't exist
      await expect(service.withdrawConsent(userId, ConsentType.SPECIAL_CATEGORY)).resolves.toBeDefined();
      expect(prisma.worker.update).not.toHaveBeenCalled();
    });

    it('should set analyticsConsent=false on COOKIE_ANALYTICS withdrawal', async () => {
      prisma.consent.findMany.mockResolvedValue([
        { id: 'c-1', userId, consentType: ConsentType.COOKIE_ANALYTICS, status: ConsentStatus.GIVEN },
      ]);
      prisma.consent.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});

      await service.withdrawConsent(userId, ConsentType.COOKIE_ANALYTICS);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { analyticsConsent: false },
      });
    });

    it('should set marketingConsent=false on MARKETING withdrawal', async () => {
      prisma.consent.findMany.mockResolvedValue([
        { id: 'c-1', userId, consentType: ConsentType.MARKETING, status: ConsentStatus.GIVEN },
      ]);
      prisma.consent.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});

      await service.withdrawConsent(userId, ConsentType.MARKETING);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { marketingConsent: false },
      });
    });

    it('should set marketingConsent=false on EMAIL_NOTIFICATIONS withdrawal', async () => {
      prisma.consent.findMany.mockResolvedValue([
        { id: 'c-1', userId, consentType: ConsentType.EMAIL_NOTIFICATIONS, status: ConsentStatus.GIVEN },
      ]);
      prisma.consent.updateMany.mockResolvedValue({ count: 1 });
      prisma.user.update.mockResolvedValue({});

      await service.withdrawConsent(userId, ConsentType.EMAIL_NOTIFICATIONS);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { marketingConsent: false },
      });
    });
  });

  describe('hasConsent', () => {
    it('should return true when active consent exists', async () => {
      prisma.consent.findFirst.mockResolvedValue({ id: 'c-1', status: ConsentStatus.GIVEN });

      const result = await service.hasConsent('user-1', ConsentType.DATA_PROCESSING);
      expect(result).toBe(true);
    });

    it('should return false when no consent exists', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);

      const result = await service.hasConsent('user-1', ConsentType.DATA_PROCESSING);
      expect(result).toBe(false);
    });

    it('should return false when consent is WITHDRAWN (does not match GIVEN filter)', async () => {
      prisma.consent.findFirst.mockResolvedValue(null); // findFirst with status: GIVEN returns null

      const result = await service.hasConsent('user-1', ConsentType.DATA_PROCESSING);
      expect(result).toBe(false);
    });
  });

  describe('getUserConsents', () => {
    it('should return flat array with derived granted/grantedAt fields', async () => {
      const rawConsents = [
        {
          id: 'c-1',
          userId: 'user-1',
          consentType: ConsentType.COOKIE_ANALYTICS,
          status: ConsentStatus.GIVEN,
          legalBasis: LegalBasis.CONSENT,
          version: '1.0',
          ipAddress: null,
          userAgent: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          withdrawnAt: null,
          expiresAt: null,
        },
        {
          id: 'c-2',
          userId: 'user-1',
          consentType: ConsentType.MARKETING,
          status: ConsentStatus.WITHDRAWN,
          legalBasis: LegalBasis.CONSENT,
          version: '1.0',
          ipAddress: null,
          userAgent: null,
          createdAt: new Date('2026-06-01'),
          updatedAt: new Date('2026-06-15'),
          withdrawnAt: new Date('2026-06-15'),
          expiresAt: null,
        },
      ];
      prisma.consent.findMany.mockResolvedValue(rawConsents);

      const result = await service.getUserConsents('user-1');

      // Must be a flat array, NOT a grouped object
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      // First consent: GIVEN → granted=true
      expect(result[0].granted).toBe(true);
      expect(result[0].grantedAt).toBe(mockDate.toISOString());
      expect(typeof result[0].grantedAt).toBe('string'); // ISO string, never {}

      // Second consent: WITHDRAWN → granted=false
      expect(result[1].granted).toBe(false);
      expect(result[1].withdrawnAt).toBe('2026-06-15T00:00:00.000Z');
    });

    it('should return empty array when user has no consents', async () => {
      prisma.consent.findMany.mockResolvedValue([]);

      const result = await service.getUserConsents('user-1');
      expect(result).toEqual([]);
    });

    it('should serialize all Date fields as ISO strings', async () => {
      prisma.consent.findMany.mockResolvedValue([
        {
          id: 'c-1',
          userId: 'user-1',
          consentType: ConsentType.DATA_PROCESSING,
          status: ConsentStatus.GIVEN,
          legalBasis: LegalBasis.CONSENT,
          version: '1.0',
          ipAddress: null,
          userAgent: null,
          createdAt: mockDate,
          updatedAt: mockDate,
          withdrawnAt: null,
          expiresAt: null,
        },
      ]);

      const result = await service.getUserConsents('user-1');

      // Ensure no Date objects leaked through — every date must be a string
      for (const c of result) {
        expect(typeof c.grantedAt).toBe('string');
        expect(typeof c.createdAt).toBe('string');
        expect(typeof c.updatedAt).toBe('string');
        // withdrawnAt and expiresAt can be null
        if (c.withdrawnAt !== null) expect(typeof c.withdrawnAt).toBe('string');
        if (c.expiresAt !== null) expect(typeof c.expiresAt).toBe('string');
      }
    });
  });

  describe('getRequiredConsents', () => {
    it('should include SPECIAL_CATEGORY for worker users', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        privacyPolicyAcceptedAt: new Date(),
        termsOfServiceAcceptedAt: new Date(),
        analyticsConsent: false,
        marketingConsent: false,
      });
      // hasConsent for DATA_PROCESSING
      prisma.consent.findFirst.mockResolvedValue({ id: 'c-1' });
      prisma.worker.findUnique.mockResolvedValue({
        id: 'worker-1',
        userId: 'user-1',
        immigrationConsentGiven: true,
      });

      const result = await service.getRequiredConsents('user-1');

      expect(result.required).toHaveLength(4); // PRIVACY_POLICY, TERMS_OF_SERVICE, DATA_PROCESSING, SPECIAL_CATEGORY
      const specialCat = result.required.find(r => r.type === ConsentType.SPECIAL_CATEGORY);
      expect(specialCat).toBeDefined();
      expect(specialCat!.label).toBe('Immigration Status Processing');
    });

    it('should NOT include SPECIAL_CATEGORY for non-worker users', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        privacyPolicyAcceptedAt: new Date(),
        termsOfServiceAcceptedAt: new Date(),
        analyticsConsent: false,
        marketingConsent: false,
      });
      prisma.consent.findFirst.mockResolvedValue(null);
      prisma.worker.findUnique.mockResolvedValue(null);

      const result = await service.getRequiredConsents('user-1');

      expect(result.required).toHaveLength(3); // PRIVACY_POLICY, TERMS_OF_SERVICE, DATA_PROCESSING
      expect(result.required.find(r => r.type === ConsentType.SPECIAL_CATEGORY)).toBeUndefined();
    });

    it('should throw NotFoundException for missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getRequiredConsents('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ===========================================================================
  // DATA SUBJECT RIGHTS
  // ===========================================================================
  describe('requestDataExport', () => {
    it('should create export request with PENDING status', async () => {
      prisma.dataExportRequest.findFirst.mockResolvedValue(null);
      prisma.dataExportRequest.create.mockResolvedValue({
        id: 'export-1',
        userId: 'user-1',
        format: ExportFormat.JSON,
        status: ExportStatus.PENDING,
        dataCategories: ['profile', 'worker_profile'],
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

      const result = await service.requestDataExport('user-1', ExportFormat.JSON, ['profile', 'worker_profile']);

      expect(prisma.dataExportRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            status: ExportStatus.PENDING,
            format: ExportFormat.JSON,
          }),
        }),
      );
    });

    it('should throw BadRequestException if pending export already exists', async () => {
      prisma.dataExportRequest.findFirst.mockResolvedValue({ id: 'existing-export' });

      await expect(service.requestDataExport('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should use all categories by default', async () => {
      prisma.dataExportRequest.findFirst.mockResolvedValue(null);
      prisma.dataExportRequest.create.mockResolvedValue({ id: 'export-1' });

      await service.requestDataExport('user-1');

      const createCall = prisma.dataExportRequest.create.mock.calls[0][0];
      expect(createCall.data.dataCategories).toHaveLength(10); // all default categories
    });
  });

  describe('gatherAllUserData', () => {
    it('should collect all personal data categories', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1' });
      prisma.employer.findUnique.mockResolvedValue(null);
      prisma.consent.findMany.mockResolvedValue([]);
      prisma.dataSubjectRequest.findMany.mockResolvedValue([]);
      prisma.offer.findMany.mockResolvedValue([]);
      prisma.conversation.findMany.mockResolvedValue([]);
      prisma.rating.findMany.mockResolvedValue([]);
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.userGdprFlags.findUnique.mockResolvedValue(null);

      const result = await service.gatherAllUserData('user-1');

      expect(result.user).toBeDefined();
      expect(result.workerProfile).toBeDefined();
      expect(result.offers).toBeDefined();
      expect(result.conversations).toBeDefined();
      expect(result.consents).toBeDefined();
      expect(result.auditLogs).toBeDefined();
      expect(result.gdprFlags).toBeNull();
      expect(result.exportedAt).toBeDefined();
    });

    it('should throw NotFoundException for missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.gatherAllUserData('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should NOT include passwordHash in user data', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      // Mock all the parallel queries
      prisma.worker.findUnique.mockResolvedValue(null);
      prisma.employer.findUnique.mockResolvedValue(null);
      prisma.consent.findMany.mockResolvedValue([]);
      prisma.dataSubjectRequest.findMany.mockResolvedValue([]);
      prisma.offer.findMany.mockResolvedValue([]);
      prisma.conversation.findMany.mockResolvedValue([]);
      prisma.rating.findMany.mockResolvedValue([]);
      prisma.notification.findMany.mockResolvedValue([]);
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.userGdprFlags.findUnique.mockResolvedValue(null);

      await service.gatherAllUserData('user-1');

      // The select clause should not include passwordHash
      const selectArg = prisma.user.findUnique.mock.calls[0][0].select;
      expect(selectArg.passwordHash).toBeUndefined();
    });
  });

  describe('requestDeletion', () => {
    it('should create deletion request with 30-day grace period', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue(null);
      prisma.dataDeletionRequest.create.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.PENDING,
        reason: null,
        dataCategories: [],
        retentionOverrides: [],
        scheduledDeletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        confirmedAt: null,
        completedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      });
      prisma.userGdprFlags.upsert.mockResolvedValue({});

      const result = await service.requestDeletion('user-1');

      // Should upsert GDPR flags
      expect(prisma.userGdprFlags.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
      // Response should have serialized dates
      expect(result.scheduledDeletionAt).toBeDefined();
    });

    it('should throw BadRequestException if pending deletion already exists', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.requestDeletion('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should use GDPR_DELETION_GRACE_PERIOD_DAYS env var', async () => {
      process.env.GDPR_DELETION_GRACE_PERIOD_DAYS = '14';
      prisma.dataDeletionRequest.findFirst.mockResolvedValue(null);
      prisma.dataDeletionRequest.create.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.PENDING,
        reason: null,
        dataCategories: [],
        retentionOverrides: [],
        scheduledDeletionAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        confirmedAt: null,
        completedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      });
      prisma.userGdprFlags.upsert.mockResolvedValue({});

      await service.requestDeletion('user-1');

      const createCall = prisma.dataDeletionRequest.create.mock.calls[0][0];
      // 14 days from now
      const expectedDate = new Date(mockDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      expect(createCall.data.scheduledDeletionAt.getTime()).toBeCloseTo(expectedDate.getTime(), -3);

      delete process.env.GDPR_DELETION_GRACE_PERIOD_DAYS;
    });

    it('should return serialized response with ISO date strings', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue(null);
      prisma.dataDeletionRequest.create.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.PENDING,
        reason: 'test',
        dataCategories: ['user_account'],
        retentionOverrides: ['invoices'],
        scheduledDeletionAt: new Date('2026-08-10T12:00:00.000Z'),
        confirmedAt: null,
        completedAt: null,
        createdAt: mockDate,
        updatedAt: mockDate,
      });
      prisma.userGdprFlags.upsert.mockResolvedValue({});

      const result = await service.requestDeletion('user-1', 'test');

      expect(typeof result.scheduledDeletionAt).toBe('string');
      expect(typeof result.createdAt).toBe('string');
      expect(result.confirmedAt).toBeNull();
    });
  });

  describe('confirmDeletion', () => {
    it('should confirm a PENDING deletion request', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.PENDING,
      });
      prisma.dataDeletionRequest.update.mockResolvedValue({
        id: 'del-1',
        status: DeletionStatus.CONFIRMED,
        confirmedAt: new Date(),
      });

      await service.confirmDeletion('user-1', 'del-1');

      expect(prisma.dataDeletionRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'del-1' },
          data: expect.objectContaining({ status: DeletionStatus.CONFIRMED }),
        }),
      );
    });

    it('should throw NotFoundException for wrong user (IDOR prevention)', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue(null);

      await expect(service.confirmDeletion('wrong-user', 'del-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for non-PENDING status', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.CONFIRMED,
      });

      await expect(service.confirmDeletion('user-1', 'del-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelDeletion', () => {
    it('should cancel a PENDING deletion request', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.PENDING,
      });
      prisma.dataDeletionRequest.update.mockResolvedValue({
        id: 'del-1',
        status: DeletionStatus.CANCELLED,
      });
      prisma.userGdprFlags.upsert.mockResolvedValue({});

      const result = await service.cancelDeletion('user-1', 'del-1');

      expect(result.success).toBe(true);
      expect(prisma.userGdprFlags.upsert).toHaveBeenCalled();
    });

    it('should cancel a CONFIRMED deletion request', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.CONFIRMED,
      });
      prisma.dataDeletionRequest.update.mockResolvedValue({
        id: 'del-1',
        status: DeletionStatus.CANCELLED,
      });
      prisma.userGdprFlags.upsert.mockResolvedValue({});

      const result = await service.cancelDeletion('user-1', 'del-1');
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException for COMPLETED status', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.COMPLETED,
      });

      await expect(service.cancelDeletion('user-1', 'del-1')).rejects.toThrow(BadRequestException);
    });

    it('should clear GDPR flags on cancellation', async () => {
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({
        id: 'del-1',
        userId: 'user-1',
        status: DeletionStatus.PENDING,
      });
      prisma.dataDeletionRequest.update.mockResolvedValue({});
      prisma.userGdprFlags.upsert.mockResolvedValue({});

      await service.cancelDeletion('user-1', 'del-1');

      expect(prisma.userGdprFlags.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ userId: 'user-1' }),
          update: expect.objectContaining({
            deletionRequestedAt: null,
            deletionScheduledAt: null,
          }),
        }),
      );
    });
  });

  describe('executeDeletion', () => {
    const userId = 'user-1';

    it('should anonymize user PII and mark as DELETED', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({ id: 'del-1', userId, status: DeletionStatus.CONFIRMED });
      prisma.dataDeletionRequest.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});
      prisma.worker.findUnique.mockResolvedValue(null);
      prisma.employer.findUnique.mockResolvedValue(null);
      prisma.notification.deleteMany.mockResolvedValue({ count: 5 });
      prisma.consent.updateMany.mockResolvedValue({ count: 3 });

      await service.executeDeletion(userId);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          email: `deleted-${userId}@offermarket.nl`,
          phone: null,
          status: 'DELETED',
        }),
      });
    });

    it('should anonymize worker profile when it exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.dataDeletionRequest.findFirst.mockResolvedValue({ id: 'del-1', userId, status: DeletionStatus.CONFIRMED });
      prisma.dataDeletionRequest.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});
      prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId });
      prisma.worker.update.mockResolvedValue({});
      prisma.employer.findUnique.mockResolvedValue(null);
      prisma.notification.deleteMany.mockResolvedValue({ count: 0 });
      prisma.consent.updateMany.mockResolvedValue({ count: 0 });

      await service.executeDeletion(userId);

      expect(prisma.worker.update).toHaveBeenCalledWith({
        where: { id: 'worker-1' },
        data: expect.objectContaining({
          workAuthorization: null,
          summary: null,
          profileVisibility: 'HIDDEN',
        }),
      });
    });

    it('should throw NotFoundException for missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.executeDeletion(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no confirmed deletion request exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.dataDeletionRequest.findFirst.mockResolvedValue(null);

      await expect(service.executeDeletion(userId)).rejects.toThrow(BadRequestException);
    });
  });

  // ===========================================================================
  // PROCESSING RESTRICTION
  // ===========================================================================
  describe('setProcessingRestriction', () => {
    it('should set processing restriction and create audit log', async () => {
      const flags = { userId: 'user-1', processingRestricted: true, processingRestrictedAt: new Date() };
      prisma.userGdprFlags.upsert.mockResolvedValue(flags);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.setProcessingRestriction('user-1', true);

      expect(prisma.userGdprFlags.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ processingRestricted: true }),
          update: expect.objectContaining({ processingRestricted: true }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'PROCESSING_RESTRICTED',
            legalBasis: 'GDPR_ARTICLE_18',
          }),
        }),
      );
    });

    it('should remove restriction and create UNRESTRICTED audit log', async () => {
      const flags = { userId: 'user-1', processingRestricted: false, processingRestrictedAt: null };
      prisma.userGdprFlags.upsert.mockResolvedValue(flags);
      prisma.auditLog.create.mockResolvedValue({});

      await service.setProcessingRestriction('user-1', false);

      expect(prisma.userGdprFlags.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ processingRestricted: false, processingRestrictedAt: null }),
          update: expect.objectContaining({ processingRestricted: false, processingRestrictedAt: null }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'PROCESSING_UNRESTRICTED' }),
        }),
      );
    });
  });

  // ===========================================================================
  // RECTIFICATION & OBJECTION
  // ===========================================================================
  describe('requestRectification', () => {
    it('should create a RECTIFICATION DataSubjectRequest', async () => {
      prisma.dataSubjectRequest.create.mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        requestType: DataSubjectRequestType.RECTIFICATION,
      });

      const result = await service.requestRectification('user-1', 'email', 'correct@email.com', 'Typo');

      expect(prisma.dataSubjectRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          requestType: DataSubjectRequestType.RECTIFICATION,
          description: 'Request to correct field "email" to "correct@email.com". Reason: Typo',
        }),
      });
    });

    it('should default reason to "Not provided"', async () => {
      prisma.dataSubjectRequest.create.mockResolvedValue({ id: 'req-1' });

      await service.requestRectification('user-1', 'name', 'John');

      expect(prisma.dataSubjectRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Request to correct field "name" to "John". Reason: Not provided',
        }),
      });
    });
  });

  describe('objectToProcessing', () => {
    it('should create an OBJECT DataSubjectRequest', async () => {
      prisma.dataSubjectRequest.create.mockResolvedValue({
        id: 'req-1',
        userId: 'user-1',
        requestType: DataSubjectRequestType.OBJECT,
      });

      const result = await service.objectToProcessing('user-1', 'marketing', 'No interest');

      expect(prisma.dataSubjectRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          requestType: DataSubjectRequestType.OBJECT,
          description: 'Objection to processing: marketing. Reason: No interest',
        }),
      });
    });

    it('should default reason to "Not provided"', async () => {
      prisma.dataSubjectRequest.create.mockResolvedValue({ id: 'req-1' });

      await service.objectToProcessing('user-1', 'analytics');

      expect(prisma.dataSubjectRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Objection to processing: analytics. Reason: Not provided',
        }),
      });
    });
  });

  // ===========================================================================
  // DATA EXPORT STATUS
  // ===========================================================================
  describe('getExportStatus', () => {
    it('should return serialized array of exports', async () => {
      const mockExports = [
        {
          id: 'export-1',
          userId: 'user-1',
          status: ExportStatus.COMPLETED,
          createdAt: mockDate,
          updatedAt: mockDate,
          completedAt: mockDate,
          expiresAt: new Date(mockDate.getTime() + 48 * 60 * 60 * 1000),
        },
      ];
      prisma.dataExportRequest.findMany.mockResolvedValue(mockExports);

      const result = await service.getExportStatus('user-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].createdAt).toBe(mockDate.toISOString());
      expect(result[0].completedAt).toBe(mockDate.toISOString());
    });
  });

  // ===========================================================================
  // GDPR FLAGS
  // ===========================================================================
  describe('getUserGdprFlags', () => {
    it('should return flags for user', async () => {
      const flags = { userId: 'user-1', processingRestricted: true };
      prisma.userGdprFlags.findUnique.mockResolvedValue(flags);

      const result = await service.getUserGdprFlags('user-1');
      expect(result).toEqual(flags);
    });

    it('should return null when no flags exist', async () => {
      prisma.userGdprFlags.findUnique.mockResolvedValue(null);

      const result = await service.getUserGdprFlags('user-1');
      expect(result).toBeNull();
    });
  });

  // ===========================================================================
  // BREACH NOTIFICATION
  // ===========================================================================
  describe('reportBreach', () => {
    it('should create breach with INVESTIGATING status', async () => {
      prisma.dataBreach.create.mockResolvedValue({ id: 'breach-1' });

      await service.reportBreach({
        title: 'Test Breach',
        description: 'A test breach',
        severity: BreachSeverity.HIGH,
        affectedDataCategories: ['profile', 'contact'],
        estimatedAffectedUsers: 100,
        createdById: 'admin-1',
      });

      expect(prisma.dataBreach.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Test Breach',
          status: BreachStatus.INVESTIGATING,
          estimatedAffectedUsers: 100,
        }),
      });
    });

    it('should default estimatedAffectedUsers to 0', async () => {
      prisma.dataBreach.create.mockResolvedValue({ id: 'breach-1' });

      await service.reportBreach({
        title: 'Test',
        description: 'Test',
        severity: BreachSeverity.LOW,
        affectedDataCategories: ['profile'],
      });

      expect(prisma.dataBreach.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estimatedAffectedUsers: 0 }),
        }),
      );
    });
  });

  // ===========================================================================
  // RETENTION POLICIES & PROCESSING ACTIVITIES
  // ===========================================================================
  describe('seedRetentionPolicies', () => {
    it('should create all retention policies via upsert', async () => {
      prisma.dataRetentionPolicy.upsert.mockResolvedValue({});

      await service.seedRetentionPolicies();

      // Should call upsert for each policy (13 policies)
      expect(prisma.dataRetentionPolicy.upsert).toHaveBeenCalledTimes(13);
    });
  });

  describe('seedProcessingActivities', () => {
    it('should create all processing activities via upsert', async () => {
      prisma.processingActivity.upsert.mockResolvedValue({});

      await service.seedProcessingActivities();

      // Should call upsert for each activity (12 activities)
      expect(prisma.processingActivity.upsert).toHaveBeenCalledTimes(12);
    });
  });

  // ===========================================================================
  // PROCESS DATA EXPORT
  // ===========================================================================
  describe('processDataExport', () => {
    it('should throw NotFoundException for missing request', async () => {
      prisma.dataExportRequest.findUnique.mockResolvedValue(null);

      await expect(service.processDataExport('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already COMPLETED request', async () => {
      prisma.dataExportRequest.findUnique.mockResolvedValue({
        id: 'export-1',
        status: ExportStatus.COMPLETED,
      });

      await expect(service.processDataExport('export-1')).rejects.toThrow(BadRequestException);
    });
  });
});