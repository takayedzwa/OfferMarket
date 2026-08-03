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
  offer = { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), count: jest.fn(), create: jest.fn() };
  offerVersion = { findMany: jest.fn(), create: jest.fn() };
  blockedCompany = { findFirst: jest.fn() };
  visibleCompany = { findFirst: jest.fn() };
  userGdprFlags = { findUnique: jest.fn() };

  $queryRaw = jest.fn();
  $transaction = jest.fn(async (fn: (tx: any) => Promise<any>) => {
    const mockTx = {
      employer: this.employer,
      worker: this.worker,
      offer: this.offer,
      offerVersion: this.offerVersion,
      blockedCompany: this.blockedCompany,
      visibleCompany: this.visibleCompany,
      userGdprFlags: this.userGdprFlags,
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

    // E-C3: withdrawing must not be allowed from any terminal state. Previously
    // only ACCEPTED was blocked, so an EXPIRED/REJECTED/already-WITHDRAWN offer
    // could be "withdrawn" again — a spurious backward transition that
    // re-stamped withdrawnAt and obscured the offer's real outcome.
    it.each(['EXPIRED', 'REJECTED', 'WITHDRAWN'])(
      'throws BadRequestException when the offer is already in terminal state %s',
      async (status) => {
        prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
        prisma.offer.findUnique.mockResolvedValue({ id: 'offer-1', employerId: 'employer-a', status });

        await expect(service.withdrawOffer('offer-1', 'user-a')).rejects.toThrow(BadRequestException);
        expect(prisma.offer.update).not.toHaveBeenCalled();
      },
    );

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

    // E-H8: a worker who has exercised their GDPR Article 18 right to restrict
    // processing must not have an offer created against them — creating the
    // offer and notifying them is processing of their data. The check happens
    // at the service layer because the global guard only covers the *acting*
    // user (the employer), not the *target* worker.
    it('throws ForbiddenException when the target worker has restricted processing (E-H8)', async () => {
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
      prisma.userGdprFlags.findUnique.mockResolvedValue({ processingRestricted: true });

      await expect(service.createOffer('user-a', baseDto as any)).rejects.toThrow(ForbiddenException);
      // The restriction reason is not leaked — the generic message is used.
      await expect(prisma.userGdprFlags.findUnique.mock.calls[0][0].where).toEqual({ userId: 'worker-user-1' });
      // No offer or notification is created for the restricted worker.
      expect(prisma.offer.create).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // E-M4: counterOffer versions the counter onto the SAME offer (no separate
  // DRAFT offer is created), and submitOffer accepts the COUNTERED -> SUBMITTED
  // transition so the employer can send the (optionally revised) offer back.
  // =========================================================================
  describe('counterOffer', () => {
    const currentVersion = {
      id: 'v1',
      version: 1,
      salaryMin: 30000,
      salaryMax: 40000,
      salaryPeriod: 'year',
      hourlyRate: null,
      signOnBonus: 0,
      performanceBonusPct: 0,
      overtimeRate: null,
      weekendRate: null,
      contractType: 'permanent',
      contractDurationMonths: null,
      hoursPerWeek: 40,
      startDateType: 'flexible',
      startDate: null,
      probationMonths: 2,
      holidayAllowancePct: 8,
      pensionContributionPct: 0,
      trainingBudget: 0,
      companyVehicle: 'not_provided',
      vehicleType: null,
      vehicleValueEst: null,
      travelAllowanceType: 'per_km',
      travelAllowanceValue: null,
      phoneProvided: false,
      toolsProvided: false,
      scheduleType: ['daytime'],
      onCallDetails: null,
      remoteWorkPct: 0,
      travelRequiredPct: 0,
      travelRegion: null,
      physicalRequirements: 'none',
      requiredCertifications: ['AWS'],
      requiredExperienceYears: 3,
    };

    it('versions the counter onto the same offer and does NOT create a new offer (E-M4)', async () => {
      prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId: 'worker-user-1' });
      prisma.offer.findUnique.mockResolvedValue({
        id: 'offer-1',
        workerId: 'worker-1',
        employerId: 'employer-a',
        status: 'SUBMITTED',
        jobTitle: 'Engineer',
        currentVersion,
      });
      prisma.offerVersion.findMany.mockResolvedValue([{ version: 1 }]);
      prisma.offerVersion.create.mockResolvedValue({ id: 'v2', version: 2 });
      prisma.offer.update.mockResolvedValue({});
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'employer-user-a' });
      const counteredOffer = { id: 'offer-1', status: 'COUNTERED', currentVersionId: 'v2' };
      // Final findUnique (return) resolves to the countered offer.
      prisma.offer.findUnique
        .mockResolvedValueOnce({ id: 'offer-1', workerId: 'worker-1', employerId: 'employer-a', status: 'SUBMITTED', jobTitle: 'Engineer', currentVersion })
        .mockResolvedValueOnce(counteredOffer);

      const result = await service.counterOffer('offer-1', 'worker-user-1', { salaryMin: 35000, salaryMax: 45000 });

      expect(result).toEqual(counteredOffer);
      // No new offer record is created — the counter is a version on offer-1.
      expect(prisma.offer.create).not.toHaveBeenCalled();
      // The new version is attached to the SAME offer, version 2, with the counter values.
      expect(prisma.offerVersion.create.mock.calls[0][0].data).toEqual(expect.objectContaining({
        offerId: 'offer-1',
        version: 2,
        salaryMin: 35000,
        salaryMax: 45000,
      }));
      // Offer is marked COUNTERED and currentVersionId points at the new version.
      expect(prisma.offer.update).toHaveBeenCalledWith({ where: { id: 'offer-1' }, data: { status: 'COUNTERED', counteredAt: expect.any(Date) } });
      expect(prisma.offer.update).toHaveBeenCalledWith({ where: { id: 'offer-1' }, data: { currentVersionId: 'v2' } });
      // Employer is notified about the SAME offer (deep-link, not a separate counter offer id).
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.OFFER_COUNTERED,
        expect.objectContaining({ offerId: 'offer-1', actionUrl: '/offers/offer-1' }),
      );
    });

    it('rejects countering an offer that is not in an active state', async () => {
      prisma.worker.findUnique.mockResolvedValue({ id: 'worker-1', userId: 'worker-user-1' });
      prisma.offer.findUnique.mockResolvedValue({
        id: 'offer-1',
        workerId: 'worker-1',
        employerId: 'employer-a',
        status: 'ACCEPTED',
        currentVersion,
      });

      await expect(service.counterOffer('offer-1', 'worker-user-1', { salaryMin: 35000, salaryMax: 45000 }))
        .rejects.toThrow(BadRequestException);
      expect(prisma.offerVersion.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Offer expiry cron: offers past their expiresAt that are still in an
  // active (non-terminal) state are transitioned to EXPIRED. DRAFT is excluded
  // so an employer mid-edit is not expired out from under them.
  // =========================================================================
  describe('expireOffers', () => {
    it('transitions active offers past expiresAt to EXPIRED (cron)', async () => {
      prisma.offer.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.expireOffers();

      expect(count).toBe(3);
      const callArg = prisma.offer.updateMany.mock.calls[0][0];
      // Only offers whose expiresAt is in the past AND are still active.
      expect(callArg.where.expiresAt).toEqual({ lt: expect.any(Date) });
      expect(callArg.where.status.in).toEqual(
        expect.arrayContaining(['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'COUNTERED']),
      );
      expect(callArg.where.status.in).not.toContain('DRAFT');
      expect(callArg.where.status.in).not.toContain('ACCEPTED');
      expect(callArg.where.status.in).not.toContain('EXPIRED');
      expect(callArg.data).toEqual({ status: 'EXPIRED' });
    });

    it('returns 0 and does not throw when the update fails', async () => {
      prisma.offer.updateMany.mockRejectedValue(new Error('db down'));
      await expect(service.expireOffers()).resolves.toBe(0);
    });
  });

  describe('submitOffer', () => {
    it('accepts the COUNTERED -> SUBMITTED transition so the employer can respond to a counter (E-M4)', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a', companyName: 'Acme' });
      prisma.offer.findUnique.mockResolvedValue({
        id: 'offer-1',
        employerId: 'employer-a',
        status: 'COUNTERED',
        jobTitle: 'Engineer',
        currentVersion: { id: 'v2', version: 2, salaryMin: 35000 },
        worker: { userId: 'worker-user-1' },
      });
      prisma.offer.update.mockResolvedValue({});
      const submitted = { id: 'offer-1', status: 'SUBMITTED' };
      prisma.offer.findUnique
        .mockResolvedValueOnce({
          id: 'offer-1', employerId: 'employer-a', status: 'COUNTERED', jobTitle: 'Engineer',
          currentVersion: { id: 'v2', version: 2, salaryMin: 35000 }, worker: { userId: 'worker-user-1' },
        })
        .mockResolvedValueOnce(submitted);

      const result = await service.submitOffer('offer-1', 'user-a');

      expect(result).toEqual(submitted);
      expect(prisma.offer.update).toHaveBeenCalledWith({ where: { id: 'offer-1' }, data: { status: 'SUBMITTED', submittedAt: expect.any(Date) } });
      // Worker is notified that the (revised) offer is back.
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        NotificationEventType.OFFER_RECEIVED,
        expect.objectContaining({ recipientUserId: 'worker-user-1', offerId: 'offer-1' }),
      );
    });

    it('still rejects submitting from a terminal status', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.offer.findUnique.mockResolvedValue({
        id: 'offer-1', employerId: 'employer-a', status: 'WITHDRAWN',
        currentVersion: { id: 'v1' }, worker: { userId: 'worker-user-1' },
      });

      await expect(service.submitOffer('offer-1', 'user-a')).rejects.toThrow(BadRequestException);
      expect(prisma.offer.update).not.toHaveBeenCalled();
    });
  });
});