import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmployersService } from '../employers.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RatingsService } from '../../ratings/ratings.service';
import { CreateEmployerProfileDto } from '../dto/create-employer-profile.dto';

class MockPrismaService {
  employer = { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() };

  $transaction = jest.fn(async (fn: (tx: any) => Promise<any>) => {
    const mockTx = { employer: this.employer };
    return fn(mockTx);
  });
}

describe('EmployersService', () => {
  let service: EmployersService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = new MockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployersService,
        { provide: PrismaService, useValue: prisma },
        { provide: RatingsService, useValue: {} },
      ],
    }).compile();

    service = module.get<EmployersService>(EmployersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // E-C2: updateEmployerProfile must only write allowlisted fields. Protected
  // fields (verificationStatus, verifiedAt, reputationScore, billingStatus,
  // subscriptionPlan, creditBalance, totalOffersSent, totalHires,
  // offerAcceptanceRate) can never reach prisma.employer.update.
  // =========================================================================
  describe('updateEmployerProfile', () => {
    it('throws NotFoundException when no employer exists for the JWT user', async () => {
      prisma.employer.findUnique.mockResolvedValue(null);

      await expect(service.updateEmployerProfile('user-a', {} as any)).rejects.toThrow(NotFoundException);
    });

    it('returns the existing employer unchanged when no updatable fields are supplied', async () => {
      const employer = { id: 'employer-a', userId: 'user-a', companyName: 'Acme' };
      prisma.employer.findUnique.mockResolvedValue(employer);

      const result = await service.updateEmployerProfile('user-a', {} as any);

      expect(result).toBe(employer);
      expect(prisma.employer.update).not.toHaveBeenCalled();
    });

    it('strips protected fields and only persists allowlisted ones (E-C2 mass assignment)', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.employer.update.mockResolvedValue({ id: 'employer-a' });

      // Simulate a malicious payload that slipped past the DTO/pipe: it mixes a
      // legitimate field with every protected field an employer must NOT control.
      const maliciousPayload = {
        companyName: 'Acme renamed',
        verificationStatus: 'PREMIUM_VERIFIED',
        verifiedAt: new Date('2024-01-01'),
        reputationScore: 99,
        offerAcceptanceRate: 1,
        totalOffersSent: 999,
        totalHires: 999,
        billingStatus: 'waived',
        subscriptionPlan: 'enterprise_unlimited',
        creditBalance: 1000000,
      } as any;

      await service.updateEmployerProfile('user-a', maliciousPayload);

      const updateCall = prisma.employer.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ userId: 'user-a' });

      const data = updateCall.data;
      // The one allowlisted field is present.
      expect(data.companyName).toBe('Acme renamed');
      // None of the protected fields are persisted.
      expect(data.verificationStatus).toBeUndefined();
      expect(data.verifiedAt).toBeUndefined();
      expect(data.reputationScore).toBeUndefined();
      expect(data.offerAcceptanceRate).toBeUndefined();
      expect(data.totalOffersSent).toBeUndefined();
      expect(data.totalHires).toBeUndefined();
      expect(data.billingStatus).toBeUndefined();
      expect(data.subscriptionPlan).toBeUndefined();
      expect(data.creditBalance).toBeUndefined();

      // Sanity: only one key made it through.
      expect(Object.keys(data)).toEqual(['companyName']);
    });

    it('persists multiple allowlisted fields and copies address objects as plain objects', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'employer-a', userId: 'user-a' });
      prisma.employer.update.mockResolvedValue({ id: 'employer-a' });

      const registeredAddress = { street: 'Main', houseNumber: '1', postalCode: '1011AA', city: 'Amsterdam', country: 'NL' };
      const payload = {
        companyName: 'Acme',
        industry: 'Tech',
        website: 'https://acme.example',
        registeredAddress,
        verificationStatus: 'PREMIUM_VERIFIED', // must be dropped
      } as any;

      await service.updateEmployerProfile('user-a', payload);

      const data = prisma.employer.update.mock.calls[0][0].data;
      expect(data.companyName).toBe('Acme');
      expect(data.industry).toBe('Tech');
      expect(data.website).toBe('https://acme.example');
      // Address copied as a plain object (not the same reference), and the
      // protected field is still dropped.
      expect(data.registeredAddress).toEqual(registeredAddress);
      expect(data.registeredAddress).not.toBe(registeredAddress);
      expect(data.verificationStatus).toBeUndefined();
    });
  });

  // =========================================================================
  // E-C2 (create path): createEmployerProfile sets verification/billing
  // defaults server-side and ignores any client-supplied protected fields.
  // =========================================================================
  describe('createEmployerProfile', () => {
    const validCreateDto: CreateEmployerProfileDto = {
      companyName: 'Acme',
      kvkNumber: '12345678',
      registeredAddress: { street: 'Main', houseNumber: '1', postalCode: '1011AA', city: 'Amsterdam', country: 'NL' },
    } as any;

    it('throws BadRequestException when the KvK number already exists', async () => {
      prisma.employer.findUnique.mockResolvedValue({ id: 'existing-employer' });

      await expect(service.createEmployerProfile('user-a', validCreateDto)).rejects.toThrow(BadRequestException);
      expect(prisma.employer.create).not.toHaveBeenCalled();
    });

    it('sets verification/billing defaults server-side and ignores client-supplied protected fields', async () => {
      prisma.employer.findUnique.mockResolvedValue(null);
      prisma.employer.create.mockResolvedValue({ id: 'employer-a' });

      const maliciousDto = {
        ...validCreateDto,
        verificationStatus: 'PREMIUM_VERIFIED', // must be overridden
        reputationScore: 99, // must be dropped
        billingStatus: 'waived', // must be overridden
        subscriptionPlan: 'enterprise', // must be overridden
        creditBalance: 1000000, // must be dropped
      } as any;

      await service.createEmployerProfile('user-a', maliciousDto);

      const data = prisma.employer.create.mock.calls[0][0].data;
      // Server-side defaults win.
      expect(data.verificationStatus).toBe('PENDING');
      expect(data.billingStatus).toBe('active');
      expect(data.subscriptionPlan).toBe('pay_per_intro');
      // Client-supplied protected fields are not persisted.
      expect(data.reputationScore).toBeUndefined();
      expect(data.creditBalance).toBeUndefined();
      // Allowlisted field passes through; address is a plain object copy.
      expect(data.companyName).toBe('Acme');
      expect(data.kvkNumber).toBe('12345678');
      expect(data.userId).toBe('user-a');
      expect(data.registeredAddress).toEqual(validCreateDto.registeredAddress);
      expect(data.registeredAddress).not.toBe(validCreateDto.registeredAddress);
    });

    it('omits businessAddress (rather than null) when not provided', async () => {
      prisma.employer.findUnique.mockResolvedValue(null);
      prisma.employer.create.mockResolvedValue({ id: 'employer-a' });

      await service.createEmployerProfile('user-a', validCreateDto);

      const data = prisma.employer.create.mock.calls[0][0].data;
      expect(data.businessAddress).toBeUndefined();
    });
  });
});