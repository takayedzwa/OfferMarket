import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { OffersService } from '../offers.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BillingService } from '../../billing/billing.service';
import { NotificationEventType } from '../../notifications/notification.types';

/**
 * Mock PrismaService. Non-transactional methods (withdrawOffer,
 * getOfferForEmployer, listOffersForEmployer) use the top-level model mocks.
 * createOffer runs inside $transaction, so $transaction invokes the callback
 * with a mockTx that shares the same model mocks (reusing the established
 * repo pattern from ratings.service.spec.ts).
 */
class MockPrismaService {
  employer = { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() };
  worker = { findUnique: jest.fn() };
  offer = { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn(), create: jest.fn() };
  blockedCompany = { findFirst: jest.fn() };
  visibleCompany = { findFirst: jest.fn() };

  $queryRaw = jest.fn();
  $transaction = jest.fn(async (fn: (tx: any) => Promise<any>) => {
    const mockTx = {
      employer: this.employer,
      worker: this.worker,
      offer: this.offer,
      blockedCompany: this.blockedCompany,
      visibleCompany: this.visibleCompany,
      $queryRaw: this.$queryRaw,
    };
    return fn(mockTx);
  });
}

describe('OffersService', () => {
  let service: OffersService;
  let prisma: MockPrismaService;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    prisma = new MockPrismaService();
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OffersService,
        { provide: PrismaService, useValue: prisma },
        { provide: BillingService, useValue: {} },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<OffersService>(OffersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // E-C1: withdrawOffer must resolve the employer from the JWT subject and
  // enforce ownership — it must not trust a client-supplied id.
  // =========================================================================
  describe('withdrawOffer', () => {
    it('throws NotFoundException when no employer exists for the JWT user', async () => {
      prisma.employer.findUnique.mockResolvedValue(null);

      await expect(service.withdrawOffer('offer-1', 'user-a')).rejects.toThrow(NotFoundException);
      expect(prisma.employer.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-a' } });
    });

    it('throws ForbiddenException when the offer belongs to a different employer (IDOR)', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.offer.findUnique.mockResolvedValue({ id: 'offer-1', employerId: 'employer-b' });

      await expect(service.withdrawOffer('offer-1', 'user-a')).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when the offer is already ACCEPTED', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.offer.findUnique.mockResolvedValue({ id: 'offer-1', employerId: 'employer-a', status: 'ACCEPTED' });

      await expect(service.withdrawOffer('offer-1', 'user-a')).rejects.toThrow(BadRequestException);
    });

    it('withdraws the offer and notifies the worker for the owning employer', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.offer.findUnique.mockResolvedValue({
        id: 'offer-1',
        employerId: 'employer-a',
        status: 'SUBMITTED',
        workerId: 'worker-1',
        jobTitle: 'Engineer',
      });
      prisma.offer.update.mockResolvedValue({ id: 'offer-1', status: 'WITHDRAWN' });
      prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId: 'worker-user-1' });

      const result = await service.withdrawOffer('offer-1', 'user-a', 'no longer hiring');

      expect(result).toEqual({ success: true });
      expect(prisma.offer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: { status: 'WITHDRAWN', withdrawnAt: expect.any(Date) },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.OFFER_WITHDRAWN,
        expect.objectContaining({
          recipientUserId: 'worker-user-1',
          workerUserId: 'worker-user-1',
          reason: 'no longer hiring',
          offerId: 'offer-1',
        }),
      );
    });
  });

  // =========================================================================
  // E-C1 + E-C3: getOfferForEmployer resolves by JWT and returns an
  // anonymized worker (no userId / internal id leak).
  // =========================================================================
  describe('getOfferForEmployer', () => {
    it('looks the employer up by userId and enforces ownership', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.offer.findUnique.mockResolvedValue({ id: 'offer-1', employerId: 'employer-b' });

      await expect(service.getOfferForEmployer('offer-1', 'user-a')).rejects.toThrow(ForbiddenException);
      expect(prisma.employer.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-a' } });
    });

    it('includes the worker via an anonymized select (no userId / internal id)', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.offer.findUnique.mockResolvedValue({ id: 'offer-1', employerId: 'employer-a' });

      await service.getOfferForEmployer('offer-1', 'user-a');

      const callArg = prisma.offer.findUnique.mock.calls[0][0];
      expect(callArg.where).toEqual({ id: 'offer-1' });

      // E-C3: worker must be a select, not `true`, and must not expose userId.
      expect(callArg.include.worker).toEqual(expect.objectContaining({ select: expect.any(Object) }));
      expect(callArg.include.worker.select).toEqual(expect.objectContaining({ publicId: true }));
      expect(callArg.include.worker.select.userId).toBeUndefined();
      expect(callArg.include.worker.select.id).toBeUndefined();
    });
  });

  // =========================================================================
  // E-C3: listOffersForEmployer returns an anonymized worker for each offer.
  // =========================================================================
  describe('listOffersForEmployer', () => {
    it('scopes the query to the authenticated employer and anonymizes the worker', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.offer.findMany.mockResolvedValue([]);

      await service.listOffersForEmployer('user-a', ['SUBMITTED']);

      const callArg = prisma.offer.findMany.mock.calls[0][0];
      expect(callArg.where).toEqual({ employerId: 'employer-a', status: { in: ['SUBMITTED'] } });

      // E-C3: anonymized worker select, never the full record.
      expect(callArg.include.worker).toEqual(expect.objectContaining({ select: expect.any(Object) }));
      expect(callArg.include.worker.select.publicId).toBe(true);
      expect(callArg.include.worker.select.userId).toBeUndefined();
    });

    it('throws NotFoundException when no employer exists for the JWT user', async () => {
      prisma.employer.findUnique.mockResolvedValue(null);

      await expect(service.listOffersForEmployer('user-a')).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // E-C1: createOffer resolves the employer from the JWT subject (userId),
  // not from a client-supplied employer id.
  // =========================================================================
  describe('createOffer', () => {
    const baseDto = {
      workerId: 'worker-public-1',
      jobTitle: 'Engineer',
      jobDescription: 'desc',
      compensation: { salaryMin: 30000, salaryMax: 40000 },
      contract: { type: 'permanent', hoursPerWeek: 40 },
      benefits: { vacationDays: 25, companyVehicle: 'not_provided', travelAllowanceType: 'per_km' },
      workArrangement: { scheduleType: ['daytime'], physicalRequirements: 'none' },
      requirements: { requiredCertifications: ['AWS'] },
    };

    it('throws NotFoundException when no employer exists for the JWT user', async () => {
      prisma.employer.findUnique.mockResolvedValue(null);

      await expect(service.createOffer('user-a', baseDto as any)).rejects.toThrow(NotFoundException);
      // The lookup MUST be by userId — this is the IDOR fix at the service layer.
      expect(prisma.employer.findUnique).toHaveBeenCalledWith({ where: { userId: 'user-a' }, include: { user: true } });
    });

    it('throws ForbiddenException when the employer is not verified', async () => {
      prisma.employer.findUnique.mockResolvedValue({
        id: 'employer-a',
        userId: 'user-a',
        verificationStatus: 'PENDING',
      });

      await expect(service.createOffer('user-a', baseDto as any)).rejects.toThrow(ForbiddenException);
    });

    it('creates the offer for the employer resolved from the JWT (happy path)', async () => {
      prisma.employer.findUnique.mockResolvedValue({
        id: 'employer-a',
        userId: 'user-a',
        verificationStatus: 'BASIC_VERIFIED',
        companyName: 'Acme',
      });
      prisma.worker.findUnique.mockResolvedValue({
        id: 'worker-1',
        userId: 'worker-user-1',
        deletedAt: null,
        profileVisibility: 'ALL_VERIFIED',
      });
      prisma.blockedCompany.findFirst.mockResolvedValue(null);
      prisma.offer.count.mockResolvedValue(0);
      prisma.$queryRaw.mockResolvedValue([{ seq: 1 }]);
      const createdVersionId = 'version-1';
      prisma.offer.create.mockResolvedValue({
        id: 'offer-1',
        versions: [{ id: createdVersionId, version: 1 }],
      });
      const updatedOffer = { id: 'offer-1', currentVersionId: createdVersionId };
      prisma.offer.update.mockResolvedValue(updatedOffer);
      prisma.employer.update.mockResolvedValue({});

      const result = await service.createOffer('user-a', baseDto as any);

      expect(result).toEqual(updatedOffer);
      // The offer is created for the employer resolved from the JWT, never an
      // attacker-supplied id.
      expect(prisma.offer.create.mock.calls[0][0].data.employerId).toBe('employer-a');
      expect(prisma.employer.update).toHaveBeenCalledWith({
        where: { id: 'employer-a' },
        data: { totalOffersSent: { increment: 1 } },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.OFFER_RECEIVED,
        expect.objectContaining({ recipientUserId: 'worker-user-1' }),
      );
    });
  });
});