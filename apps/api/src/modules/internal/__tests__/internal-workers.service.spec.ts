import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { InternalWorkersService } from '../internal-workers.service';
import { AuthService } from '../../auth/auth.service';
import { WorkersService } from '../../workers/workers.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Unit tests for the acquisition boundary orchestration. Domain logic itself
 * is delegated (and tested in workers/auth specs); here we verify the
 * boundary rules: idempotent replays, phone conflicts, worker resolution,
 * activate defaults, audit writes, and orphan-account cleanup.
 */
describe('InternalWorkersService', () => {
  let service: InternalWorkersService;
  let prisma: any;
  let workersService: { createWorkerProfile: jest.Mock; updateWorkerProfile: jest.Mock; getPrivateProfile: jest.Mock };
  let authService: { registerWorkerFromAcquisition: jest.Mock };

  beforeEach(async () => {
    prisma = {
      worker: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };
    workersService = {
      createWorkerProfile: jest.fn(),
      updateWorkerProfile: jest.fn(),
      getPrivateProfile: jest.fn(),
    };
    authService = { registerWorkerFromAcquisition: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        InternalWorkersService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkersService, useValue: workersService },
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    service = moduleRef.get(InternalWorkersService);
  });

  const baseDto = { phone: '+31612345678', idempotencyKey: 'conv-key-1234' };

  describe('createWorker', () => {
    it('creates account + profile and returns the reference on the happy path', async () => {
      prisma.worker.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      authService.registerWorkerFromAcquisition.mockResolvedValue({ user: { id: 'u1', email: 'e', phone: baseDto.phone, role: 'WORKER', emailVerified: false } });
      workersService.createWorkerProfile.mockResolvedValue({
        publicId: 'W-000123', availability: 'NOT_AVAILABLE', profileVisibility: 'ALL_VERIFIED',
        isProfileComplete: false, profileCompletenessPct: 40, acquisitionSource: 'AI_ACQUISITION',
      });

      const result = await service.createWorker(baseDto);

      expect(authService.registerWorkerFromAcquisition).toHaveBeenCalledWith(
        expect.objectContaining({ phone: baseDto.phone }),
      );
      expect(workersService.createWorkerProfile).toHaveBeenCalledWith(
        'u1', expect.anything(),
        expect.objectContaining({
          acquisition: expect.objectContaining({ idempotencyKey: baseDto.idempotencyKey, source: 'AI_ACQUISITION' }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'INTERNAL_ACQUISITION_WORKER_CREATED' }) }),
      );
      expect(result).toEqual(expect.objectContaining({ workerId: 'W-000123', replayed: false }));
    });

    it('passes attribution platform/names through to the worker columns (prompt 9)', async () => {
      prisma.worker.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      authService.registerWorkerFromAcquisition.mockResolvedValue({ user: { id: 'u1b', email: 'e', phone: baseDto.phone, role: 'WORKER', emailVerified: false } });
      workersService.createWorkerProfile.mockResolvedValue({
        publicId: 'W-000124', availability: 'NOT_AVAILABLE', profileVisibility: 'ALL_VERIFIED',
        isProfileComplete: false, profileCompletenessPct: 40, acquisitionSource: 'AI_ACQUISITION',
      });

      await service.createWorker({
        ...baseDto,
        platform: 'META',
        campaignId: '789',
        campaignName: 'Elektricien Rotterdam',
        adSetId: '456',
        adSetName: 'Rotterdam',
        adId: '123',
        adName: 'Zonnepanelen creatief',
      } as any);

      expect(workersService.createWorkerProfile).toHaveBeenCalledWith(
        'u1b', expect.anything(),
        expect.objectContaining({
          acquisition: expect.objectContaining({
            platform: 'META',
            campaignName: 'Elektricien Rotterdam',
            adSetName: 'Rotterdam',
            adName: 'Zonnepanelen creatief',
          }),
        }),
      );
    });

    it('replays by idempotency key without creating anything', async () => {
      prisma.worker.findUnique.mockResolvedValueOnce({
        publicId: 'W-000001', availability: 'IMMEDIATE', profileVisibility: 'ALL_VERIFIED',
        isProfileComplete: true, profileCompletenessPct: 100,
      });

      await expect(service.createWorker(baseDto)).resolves.toEqual(
        expect.objectContaining({ workerId: 'W-000001', replayed: true }),
      );
      expect(authService.registerWorkerFromAcquisition).not.toHaveBeenCalled();
      expect(workersService.createWorkerProfile).not.toHaveBeenCalled();
    });

    it('replays by phone when the phone already has a worker', async () => {
      prisma.worker.findUnique.mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'u2', phone: baseDto.phone,
        worker: { publicId: 'W-000002', availability: 'IMMEDIATE', profileVisibility: 'ALL_VERIFIED', isProfileComplete: true, profileCompletenessPct: 90 },
      });

      await expect(service.createWorker(baseDto)).resolves.toEqual(
        expect.objectContaining({ workerId: 'W-000002', replayed: true }),
      );
      expect(authService.registerWorkerFromAcquisition).not.toHaveBeenCalled();
    });

    it('throws 409 when the phone exists but has no worker profile', async () => {
      prisma.worker.findUnique.mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'u3', phone: baseDto.phone, worker: null });

      await expect(service.createWorker(baseDto)).rejects.toThrow(ConflictException);
      expect(authService.registerWorkerFromAcquisition).not.toHaveBeenCalled();
    });

    it('resolves to the winner on a concurrent idempotency-key race (P2002)', async () => {
      prisma.worker.findUnique
        // lookup before create
        .mockResolvedValueOnce(null)
        // lookup after P2002
        .mockResolvedValueOnce({
          publicId: 'W-000123', availability: 'NOT_AVAILABLE', profileVisibility: 'ALL_VERIFIED',
          isProfileComplete: false, profileCompletenessPct: 0,
        });
      prisma.user.findUnique.mockResolvedValueOnce(null);
      authService.registerWorkerFromAcquisition.mockResolvedValue({ user: { id: 'u4', email: 'e', phone: baseDto.phone, role: 'WORKER', emailVerified: false } });
      const race = Object.assign(new Error('dup'), { code: 'P2002' });
      workersService.createWorkerProfile.mockRejectedValue(race);

      await expect(service.createWorker(baseDto)).resolves.toEqual(
        expect.objectContaining({ workerId: 'W-000123', replayed: true }),
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('deletes the orphan account when profile creation fails for a non-race reason', async () => {
      prisma.worker.findUnique.mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValueOnce(null);
      authService.registerWorkerFromAcquisition.mockResolvedValue({ user: { id: 'u5', email: 'e', phone: baseDto.phone, role: 'WORKER', emailVerified: false } });
      workersService.createWorkerProfile.mockRejectedValue(new Error('boom'));
      prisma.user.delete.mockResolvedValue({});

      await expect(service.createWorker(baseDto)).rejects.toThrow('boom');
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u5' } });
    });
  });

  describe('getWorkerProfile', () => {
    it('returns only the whitelisted view', async () => {
      const now = new Date();
      prisma.worker.findUnique.mockResolvedValue({ userId: 'u1', publicId: 'W-000123', deletedAt: null });
      workersService.getPrivateProfile.mockResolvedValue({
        publicId: 'W-000123', id: 'internal-uuid', userId: 'u1', regionId: 'r1', postalCode: '3011AA',
        availability: 'IMMEDIATE', profileVisibility: 'ALL_VERIFIED', isProfileComplete: true,
        profileCompletenessPct: 95, primaryTrade: 'ELEKTRO', specializations: ['INDUSTRIE'],
        yearsOfExperience: 7, headline: null, summary: null, employmentTypes: ['FULLTIME'],
        workAuthorization: null, certifications: [{ name: 'NEN3140', verificationStatus: 'PENDING' }],
        languages: [{ language: 'NL', level: 'NATIVE' }], skills: [{ skill: { name: 'Meetwerk' }, level: 'EXPERT' }],
        updatedAt: now,
      });

      const view = (await service.getWorkerProfile('W-000123')) as any;

      expect(view).toEqual(expect.objectContaining({ workerId: 'W-000123', availability: 'IMMEDIATE' }));
      expect(view.id).toBeUndefined();
      expect(view.userId).toBeUndefined();
      expect(view.postalCode).toBeUndefined();
      expect(view.regionId).toBeUndefined();
      expect(view.certifications).toEqual([{ name: 'NEN3140', verificationStatus: 'PENDING' }]);
    });

    it('throws NotFound for missing or soft-deleted workers', async () => {
      prisma.worker.findUnique.mockResolvedValueOnce(null);
      await expect(service.getWorkerProfile('W-999999')).rejects.toThrow(NotFoundException);

      prisma.worker.findUnique.mockResolvedValueOnce({ userId: 'u', deletedAt: new Date() });
      await expect(service.getWorkerProfile('W-000123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsertWorkerProfile', () => {
    it('delegates to WorkersService with the target user id and audits', async () => {
      prisma.worker.findUnique.mockResolvedValue({ userId: 'u1', publicId: 'W-000123', id: 'w-uuid', deletedAt: null });
      workersService.updateWorkerProfile.mockResolvedValue({
        publicId: 'W-000123', isProfileComplete: true, profileCompletenessPct: 90,
        availability: 'NOT_AVAILABLE', profileVisibility: 'ALL_VERIFIED',
      });

      const result = await service.upsertWorkerProfile('W-000123', { yearsOfExperience: 7 } as any, { ipAddress: '10.0.0.9' });

      expect(workersService.updateWorkerProfile).toHaveBeenCalledWith('u1', { yearsOfExperience: 7 });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'INTERNAL_ACQUISITION_PROFILE_UPDATED',
            ipAddress: '10.0.0.9',
          }),
        }),
      );
      expect(result).toEqual(expect.objectContaining({ workerId: 'W-000123', isProfileComplete: true }));
    });

    it('throws NotFound when the worker does not exist', async () => {
      prisma.worker.findUnique.mockResolvedValue(null);
      await expect(service.upsertWorkerProfile('W-000123', {} as any)).rejects.toThrow(NotFoundException);
      expect(workersService.updateWorkerProfile).not.toHaveBeenCalled();
    });
  });

  describe('activateWorker', () => {
    it('defaults to IMMEDIATE + ALL_VERIFIED and audits', async () => {
      prisma.worker.findUnique.mockResolvedValue({ userId: 'u1', publicId: 'W-000123', id: 'w-uuid', deletedAt: null });
      prisma.worker.update.mockResolvedValue({ publicId: 'W-000123', availability: 'IMMEDIATE', profileVisibility: 'ALL_VERIFIED' });

      const result = await service.activateWorker('W-000123', {}, {});

      expect(prisma.worker.update).toHaveBeenCalledWith({
        where: { id: 'w-uuid' },
        data: { availability: 'IMMEDIATE', profileVisibility: 'ALL_VERIFIED' },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'INTERNAL_ACQUISITION_PROFILE_ACTIVATED' }),
        }),
      );
      expect(result).toEqual(expect.objectContaining({ workerId: 'W-000123' }));
    });

    it('honours explicitly supplied activation overrides', async () => {
      prisma.worker.findUnique.mockResolvedValue({ userId: 'u1', publicId: 'W-000123', id: 'w-uuid', deletedAt: null });
      prisma.worker.update.mockResolvedValue({ publicId: 'W-000123', availability: 'ONE_MONTH', profileVisibility: 'SELECTED_COMPANIES' });

      await service.activateWorker('W-000123', { availability: 'ONE_MONTH', profileVisibility: 'SELECTED_COMPANIES' } as any, {});

      expect(prisma.worker.update).toHaveBeenCalledWith({
        where: { id: 'w-uuid' },
        data: { availability: 'ONE_MONTH', profileVisibility: 'SELECTED_COMPANIES' },
      });
    });

    it('throws NotFound for an unknown worker', async () => {
      prisma.worker.findUnique.mockResolvedValue(null);
      await expect(service.activateWorker('W-000123')).rejects.toThrow(NotFoundException);
      expect(prisma.worker.update).not.toHaveBeenCalled();
    });
  });

  describe('audit', () => {
    it('never fails the business operation when the audit write fails', async () => {
      prisma.worker.findUnique.mockResolvedValue({ userId: 'u1', publicId: 'W-000123', id: 'w-uuid', deletedAt: null });
      prisma.worker.update.mockResolvedValue({ publicId: 'W-000123', availability: 'IMMEDIATE', profileVisibility: 'ALL_VERIFIED' });
      prisma.auditLog.create.mockRejectedValue(new Error('audit down'));

      await expect(service.activateWorker('W-000123', {}, {})).resolves.toEqual(
        expect.objectContaining({ workerId: 'W-000123' }),
      );
    });
  });
});