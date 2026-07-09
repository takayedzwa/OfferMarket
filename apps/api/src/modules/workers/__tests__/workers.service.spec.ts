import { Test, TestingModule } from '@nestjs/testing';
import { WorkersService } from '../workers.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Mock Prisma Service for unit tests
 */
class MockPrismaService {
  worker = {
    findMany: jest.fn(),
    count: jest.fn(),
  };
  region = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  };
}

describe('WorkersService', () => {
  let service: WorkersService;
  let prisma: MockPrismaService;

  const mockWorkerData = {
    id: 'worker-1',
    userId: 'user-1',
    publicId: 'W-123',
    headline: 'Electrician',
    primaryTrade: 'Electrician',
    yearsOfExperience: 5,
    availability: 'IMMEDIATE',
    hasDrivingLicense: true,
    hasOwnVehicle: true,
    travelDistanceKm: 30,
    workAuthorization: 'EU_CITIZEN',
    specializations: ['RESIDENTIAL_INSTALLATIONS'],
    employmentTypes: ['FULL_TIME'],
    profileVisibility: 'ALL_VERIFIED',
    deletedAt: null,
    reputationScore: 80,
    safetyScore: 90,
    profileCompletenessPct: 75,
    lastActive: new Date(),
    desiredSalaryRange: { min: 3000, max: 5000 },
    region: { id: 'region-1', name: 'Rotterdam', province: 'Zuid-Holland', type: 'CITY' },
    skills: [{ id: 'skill-1', skill: { name: 'Wiring' }, level: 'INTERMEDIATE', yearsOfExperience: 3, isVerified: true, isPrimary: false }],
    certifications: [],
    languages: [{ language: 'Dutch', level: 'B2' }, { language: 'English', level: 'C1' }],
    education: [],
    projectExperiences: [],
  };

  beforeEach(async () => {
    prisma = new MockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WorkersService>(WorkersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // SEARCH WORKERS — REGION FILTER
  // ============================================================================

  describe('searchWorkers — region filter', () => {
    it('should use descendant and ancestor IDs for region filter', async () => {
      // Mock region hierarchy: province → 2 cities
      const provinceRegion = { id: 'province-1', name: 'Zuid-Holland', type: 'PROVINCE', parentId: 'country-1' };
      const city1 = { id: 'city-1', type: 'CITY' };
      const city2 = { id: 'city-2', type: 'CITY' };
      const countryRegion = { id: 'country-1', name: 'Netherlands', type: 'COUNTRY', parentId: null };

      // getDescendantIds: findUnique for province, findMany for children
      prisma.region.findUnique
        .mockResolvedValueOnce(provinceRegion); // for getDescendantIds
      prisma.region.findMany
        .mockResolvedValueOnce([city1, city2]); // children of province

      // getAncestorIds: findUnique for province → country
      prisma.region.findUnique
        .mockResolvedValueOnce(provinceRegion) // start: province
        .mockResolvedValueOnce(countryRegion); // parent: country (parentId: null → stop)

      prisma.worker.findMany.mockResolvedValueOnce([mockWorkerData]);
      prisma.worker.count.mockResolvedValueOnce(1);

      await service.searchWorkers({ regionId: 'province-1' });

      // Verify the region filter includes descendants + ancestors
      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      const regionIds = whereCall.where.regionId.in;
      expect(regionIds).toContain('province-1');
      expect(regionIds).toContain('city-1');
      expect(regionIds).toContain('city-2');
      expect(regionIds).toContain('country-1');
    });

    it('should deduplicate region IDs', async () => {
      // Province that is also in the ancestor list (overlapping IDs)
      const cityRegion = { id: 'city-1', name: 'Rotterdam', type: 'CITY', parentId: 'province-1' };

      // getDescendantIds for city: just [city-1]
      prisma.region.findUnique.mockResolvedValueOnce(cityRegion);
      // getAncestorIds: city → province, province → country
      prisma.region.findUnique
        .mockResolvedValueOnce(cityRegion) // start: city
        .mockResolvedValueOnce({ id: 'province-1', name: 'ZH', type: 'PROVINCE', parentId: 'country-1' })
        .mockResolvedValueOnce({ id: 'country-1', name: 'NL', type: 'COUNTRY', parentId: null });

      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({ regionId: 'city-1' });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      const regionIds = whereCall.where.regionId.in;
      // Should be deduplicated: city-1 appears only once
      const city1Count = regionIds.filter((id: string) => id === 'city-1').length;
      expect(city1Count).toBe(1);
    });

    it('should not apply region filter when regionId is undefined', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({});

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.regionId).toBeUndefined();
      // Should not call region lookups
      expect(prisma.region.findUnique).not.toHaveBeenCalled();
      expect(prisma.region.findMany).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SEARCH WORKERS — LANGUAGE FILTER
  // ============================================================================

  describe('searchWorkers — language filter with minimum level', () => {
    it('should include qualifying levels from B2 upward', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageMinLevel: { language: 'Dutch', level: 'B2' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages).toEqual({
        some: {
          language: { equals: 'Dutch', mode: 'insensitive' },
          level: { in: ['B2', 'C1', 'C2', 'NATIVE'] },
        },
      });
    });

    it('should include all levels from A1', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageMinLevel: { language: 'English', level: 'A1' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages.some.level.in).toEqual(
        ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'],
      );
    });

    it('should include only NATIVE when min level is NATIVE', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageMinLevel: { language: 'Dutch', level: 'NATIVE' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages.some.level.in).toEqual(['NATIVE']);
    });

    it('should use case-insensitive language matching with languageMinLevel', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageMinLevel: { language: 'dutch', level: 'B1' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages.some.language).toEqual({
        equals: 'dutch',
        mode: 'insensitive',
      });
    });

    it('should not apply language filter when level is not recognized', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageMinLevel: { language: 'Dutch', level: 'UNKNOWN_LEVEL' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages).toBeUndefined();
    });
  });

  describe('searchWorkers — language-only filter', () => {
    it('should match language at any level with languageFilter', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageFilter: { language: 'English' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages).toEqual({
        some: {
          language: { equals: 'English', mode: 'insensitive' },
        },
      });
    });

    it('should use case-insensitive matching with languageFilter', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageFilter: { language: 'dutch' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages.some.language).toEqual({
        equals: 'dutch',
        mode: 'insensitive',
      });
    });

    it('should prefer languageMinLevel over languageFilter when both are provided', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({
        languageMinLevel: { language: 'Dutch', level: 'B2' },
        languageFilter: { language: 'Dutch' },
      });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      // languageMinLevel takes precedence (checked first with `if/else if`)
      expect(whereCall.where.languages.some.level).toEqual({ in: ['B2', 'C1', 'C2', 'NATIVE'] });
      expect(whereCall.where.languages.some.language).toEqual({
        equals: 'Dutch',
        mode: 'insensitive',
      });
    });

    it('should not apply any language filter when neither is provided', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({});

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.languages).toBeUndefined();
    });
  });

  // ============================================================================
  // SEARCH WORKERS — PAGINATION
  // ============================================================================

  describe('searchWorkers — pagination', () => {
    it('should use default page=1 and limit=20', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({});

      const findManyCall = prisma.worker.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(0);
      expect(findManyCall.take).toBe(20);
    });

    it('should calculate skip from custom page and limit', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(50);

      await service.searchWorkers({ page: 3, limit: 10 });

      const findManyCall = prisma.worker.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(20); // (3-1) * 10
      expect(findManyCall.take).toBe(10);
    });

    it('should return pagination metadata', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([mockWorkerData]);
      prisma.worker.count.mockResolvedValueOnce(25);

      const result = await service.searchWorkers({ page: 1, limit: 20 });

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2, // Math.ceil(25/20)
      });
    });
  });

  // ============================================================================
  // SEARCH WORKERS — OTHER FILTERS
  // ============================================================================

  describe('searchWorkers — other filters', () => {
    it('should filter by trade', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({ trade: 'Electrician' });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.primaryTrade).toBe('Electrician');
    });

    it('should filter by availability', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({ availability: 'IMMEDIATE' });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.availability).toBe('IMMEDIATE');
    });

    it('should filter by experience range', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({ minExperience: 2, maxExperience: 10 });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.yearsOfExperience).toEqual({ gte: 2, lte: 10 });
    });

    it('should filter by specializations', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({ specializations: ['INDUSTRIAL_INSTALLATIONS', 'PLC_SYSTEMS'] });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.specializations).toEqual({ hasEvery: ['INDUSTRIAL_INSTALLATIONS', 'PLC_SYSTEMS'] });
    });

    it('should filter by hasDrivingLicense', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({ hasDrivingLicense: true });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.hasDrivingLicense).toBe(true);
    });

    it('should filter by employmentTypes', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({ employmentTypes: ['FULL_TIME', 'PART_TIME'] });

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.employmentTypes).toEqual({ hasEvery: ['FULL_TIME', 'PART_TIME'] });
    });

    it('should always filter by deletedAt: null and profileVisibility: ALL_VERIFIED', async () => {
      prisma.worker.findMany.mockResolvedValueOnce([]);
      prisma.worker.count.mockResolvedValueOnce(0);

      await service.searchWorkers({});

      const whereCall = prisma.worker.findMany.mock.calls[0][0];
      expect(whereCall.where.deletedAt).toBeNull();
      expect(whereCall.where.profileVisibility).toBe('ALL_VERIFIED');
    });
  });

  // ============================================================================
  // SEARCH WORKERS — ANONYMIZATION
  // ============================================================================

  describe('searchWorkers — anonymous profile', () => {
    it('should strip userId, postalCode, and deletedAt from results', async () => {
      const workerWithSensitive = {
        ...mockWorkerData,
        postalCode: '1234AB',
      };
      prisma.worker.findMany.mockResolvedValueOnce([workerWithSensitive]);
      prisma.worker.count.mockResolvedValueOnce(1);

      const result = await service.searchWorkers({});

      const profile = result.workers[0];
      expect(profile).not.toHaveProperty('userId');
      expect(profile).not.toHaveProperty('postalCode');
      expect(profile).not.toHaveProperty('deletedAt');
    });
  });
});