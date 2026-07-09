import { Test, TestingModule } from '@nestjs/testing';
import { RegionsService } from '../regions.service';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Mock Prisma Service for unit tests
 */
class MockPrismaService {
  region = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
}

describe('RegionsService', () => {
  let service: RegionsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = new MockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RegionsService>(RegionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // RESOLVE OR CREATE REGION
  // ============================================================================

  describe('resolveOrCreateRegion', () => {
    const mockCountry = { id: 'country-1', name: 'Netherlands', type: 'COUNTRY', parentId: null };
    const mockProvince = { id: 'province-1', name: 'Zuid-Holland', type: 'PROVINCE', parentId: 'country-1', province: 'ZH' };
    const mockCity = { id: 'city-1', name: 'Rotterdam', type: 'CITY', parentId: 'province-1', province: 'Zuid-Holland' };

    it('should find existing country with case-insensitive match', async () => {
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry); // country lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince); // province lookup
      // cityName !== provinceName so we proceed to city lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockCity); // city lookup

      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'netherlands', // lowercase
        provinceCode: 'ZH',
        provinceName: 'zuid-holland', // lowercase
        cityName: 'rotterdam', // lowercase
        cityLatitude: '51.9244',
        cityLongitude: '4.4777',
      });

      // Country findFirst should be called with case-insensitive mode
      expect(prisma.region.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'COUNTRY',
            name: { equals: 'netherlands', mode: 'insensitive' },
          }),
        }),
      );
      expect(result.id).toBe('city-1');
    });

    it('should create country when not found', async () => {
      const newCountry = { id: 'new-country', name: 'NL', type: 'COUNTRY', parentId: null };
      prisma.region.findFirst.mockResolvedValueOnce(null); // country not found
      prisma.region.create.mockResolvedValueOnce(newCountry); // create country
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince); // province lookup (will use newCountry as parent)
      prisma.region.findFirst.mockResolvedValueOnce(mockCity); // city lookup

      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        provinceCode: 'ZH',
        provinceName: 'Zuid-Holland',
        cityName: 'Rotterdam',
      });

      // countryName defaults to countryCode when not provided
      expect(prisma.region.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'NL',
            type: 'COUNTRY',
          }),
        }),
      );
    });

    it('should find province by name or code (OR filter)', async () => {
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry); // country lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince); // province lookup

      // Province-as-city: cityName === provinceName → return province directly
      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'Netherlands',
        provinceCode: 'ZH',
        provinceName: 'Zuid-Holland',
        cityName: 'Zuid-Holland',
      });

      // Province findFirst should use OR filter with name and province code
      const provinceCall = prisma.region.findFirst.mock.calls[1][0];
      expect(provinceCall.where).toHaveProperty('OR');
      expect(provinceCall.where.OR).toEqual(
        expect.arrayContaining([
          { name: { equals: 'Zuid-Holland', mode: 'insensitive' } },
          { province: { equals: 'ZH', mode: 'insensitive' } },
        ]),
      );
    });

    it('should find province by name only when no province code', async () => {
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry); // country lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince); // province lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockCity); // city lookup

      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'Netherlands',
        provinceCode: '',
        provinceName: 'Zuid-Holland',
        cityName: 'Rotterdam',
      });

      // Province findFirst should use name-only filter (no OR)
      const provinceCall = prisma.region.findFirst.mock.calls[1][0];
      expect(provinceCall.where.OR).toBeUndefined();
      expect(provinceCall.where.name).toEqual({ equals: 'Zuid-Holland', mode: 'insensitive' });
      expect(result.id).toBe('city-1');
    });

    it('should create province when not found', async () => {
      const newProvince = { id: 'new-province', name: 'Utrecht', type: 'PROVINCE', parentId: 'country-1', province: 'UT' };
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry); // country found
      prisma.region.findFirst.mockResolvedValueOnce(null); // province not found
      prisma.region.create.mockResolvedValueOnce(newProvince); // create province
      prisma.region.findFirst.mockResolvedValueOnce({ id: 'utrecht-city', name: 'Utrecht', type: 'CITY' }); // city lookup

      await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'Netherlands',
        provinceCode: 'UT',
        provinceName: 'Utrecht',
        cityName: 'Utrecht City',
      });

      expect(prisma.region.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Utrecht',
            type: 'PROVINCE',
            parentId: 'country-1',
            province: 'UT',
          }),
        }),
      );
    });

    it('should return province directly when cityName matches provinceName (case-insensitive)', async () => {
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry); // country lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince); // province lookup

      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'Netherlands',
        provinceCode: 'ZH',
        provinceName: 'Zuid-Holland',
        cityName: 'zuid-holland', // lowercase, should still match
      });

      // Should return the province, not look for or create a city
      expect(result.id).toBe('province-1');
      expect(result.type).toBe('PROVINCE');
      // Only 2 findFirst calls (country + province), no city lookup
      expect(prisma.region.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.region.create).not.toHaveBeenCalled();
    });

    it('should find existing city with case-insensitive match', async () => {
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry); // country lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince); // province lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockCity); // city lookup

      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'Netherlands',
        provinceCode: 'ZH',
        provinceName: 'Zuid-Holland',
        cityName: 'rotterdam', // lowercase
      });

      // City findFirst should use case-insensitive match
      const cityCall = prisma.region.findFirst.mock.calls[2][0];
      expect(cityCall.where.name).toEqual({ equals: 'rotterdam', mode: 'insensitive' });
      expect(cityCall.where.parentId).toBe('province-1');
      expect(cityCall.where.type).toBe('CITY');
      expect(result.id).toBe('city-1');
    });

    it('should create city when not found', async () => {
      const newCity = { id: 'new-city', name: 'Delft', type: 'CITY', parentId: 'province-1', province: 'Zuid-Holland' };
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry); // country lookup
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince); // province lookup
      prisma.region.findFirst.mockResolvedValueOnce(null); // city not found
      prisma.region.create.mockResolvedValueOnce(newCity); // create city

      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'Netherlands',
        provinceCode: 'ZH',
        provinceName: 'Zuid-Holland',
        cityName: 'Delft',
        cityLatitude: '52.0116',
        cityLongitude: '4.3571',
      });

      expect(prisma.region.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Delft',
            nameEn: 'Delft',
            type: 'CITY',
            parentId: 'province-1',
            province: 'Zuid-Holland',
            latitude: 52.0116,
            longitude: 4.3571,
          }),
        }),
      );
      expect(result.id).toBe('new-city');
    });

    it('should set latitude and longitude to null when not provided', async () => {
      const newCity = { id: 'new-city', name: 'Delft', type: 'CITY', parentId: 'province-1' };
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry);
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince);
      prisma.region.findFirst.mockResolvedValueOnce(null);
      prisma.region.create.mockResolvedValueOnce(newCity);

      await service.resolveOrCreateRegion({
        countryCode: 'NL',
        countryName: 'Netherlands',
        provinceCode: 'ZH',
        provinceName: 'Zuid-Holland',
        cityName: 'Delft',
      });

      expect(prisma.region.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            latitude: null,
            longitude: null,
          }),
        }),
      );
    });

    it('should use countryCode as countryName when countryName is not provided', async () => {
      prisma.region.findFirst.mockResolvedValueOnce(mockCountry);
      prisma.region.findFirst.mockResolvedValueOnce(mockProvince);
      // Province-as-city shortcut
      const result = await service.resolveOrCreateRegion({
        countryCode: 'NL',
        provinceCode: 'ZH',
        provinceName: 'Zuid-Holland',
        cityName: 'Zuid-Holland',
      });

      // Country findFirst should use 'NL' as name (countryName || countryCode)
      expect(prisma.region.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { equals: 'NL', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  // ============================================================================
  // GET DESCENDANT IDS
  // ============================================================================

  describe('getDescendantIds', () => {
    it('should return only the city ID for a CITY type', async () => {
      prisma.region.findUnique.mockResolvedValueOnce({
        id: 'city-1', name: 'Rotterdam', type: 'CITY', parentId: 'province-1',
      });

      const result = await service.getDescendantIds('city-1');

      expect(result).toEqual(['city-1']);
      expect(prisma.region.findMany).not.toHaveBeenCalled();
    });

    it('should return self and child city IDs for a PROVINCE type', async () => {
      prisma.region.findUnique.mockResolvedValueOnce({
        id: 'province-1', name: 'Zuid-Holland', type: 'PROVINCE', parentId: 'country-1',
      });
      prisma.region.findMany.mockResolvedValueOnce([
        { id: 'city-1', type: 'CITY' },
        { id: 'city-2', type: 'CITY' },
      ]);

      const result = await service.getDescendantIds('province-1');

      expect(result).toEqual(['province-1', 'city-1', 'city-2']);
      expect(prisma.region.findMany).toHaveBeenCalledWith({
        where: { parentId: 'province-1' },
        select: { id: true, type: true },
      });
    });

    it('should return self, provinces, and cities for a COUNTRY type', async () => {
      prisma.region.findUnique.mockResolvedValueOnce({
        id: 'country-1', name: 'Netherlands', type: 'COUNTRY', parentId: null,
      });
      prisma.region.findMany.mockResolvedValueOnce([
        { id: 'province-1', type: 'PROVINCE' },
        { id: 'province-2', type: 'PROVINCE' },
      ]);
      // Grandchildren (cities under provinces)
      prisma.region.findMany.mockResolvedValueOnce([
        { id: 'city-1' },
        { id: 'city-2' },
        { id: 'city-3' },
      ]);

      const result = await service.getDescendantIds('country-1');

      expect(result).toEqual(['country-1', 'province-1', 'province-2', 'city-1', 'city-2', 'city-3']);
    });

    it('should return [regionId] as fallback when region is not found', async () => {
      prisma.region.findUnique.mockResolvedValueOnce(null);

      const result = await service.getDescendantIds('nonexistent-id');

      expect(result).toEqual(['nonexistent-id']);
    });
  });

  // ============================================================================
  // GET ANCESTOR IDS
  // ============================================================================

  describe('getAncestorIds', () => {
    it('should return [provinceId, countryId] for a CITY', async () => {
      prisma.region.findUnique
        .mockResolvedValueOnce({ id: 'city-1', name: 'Rotterdam', type: 'CITY', parentId: 'province-1' })
        .mockResolvedValueOnce({ id: 'province-1', name: 'Zuid-Holland', type: 'PROVINCE', parentId: 'country-1' })
        .mockResolvedValueOnce({ id: 'country-1', name: 'Netherlands', type: 'COUNTRY', parentId: null });

      const result = await service.getAncestorIds('city-1');

      expect(result).toEqual(['province-1', 'country-1']);
    });

    it('should return [countryId] for a PROVINCE', async () => {
      prisma.region.findUnique
        .mockResolvedValueOnce({ id: 'province-1', name: 'Zuid-Holland', type: 'PROVINCE', parentId: 'country-1' })
        .mockResolvedValueOnce({ id: 'country-1', name: 'Netherlands', type: 'COUNTRY', parentId: null });

      const result = await service.getAncestorIds('province-1');

      expect(result).toEqual(['country-1']);
    });

    it('should return [] for a COUNTRY (no parent)', async () => {
      prisma.region.findUnique.mockResolvedValueOnce({
        id: 'country-1', name: 'Netherlands', type: 'COUNTRY', parentId: null,
      });

      const result = await service.getAncestorIds('country-1');

      expect(result).toEqual([]);
    });

    it('should return [] when region is not found', async () => {
      prisma.region.findUnique.mockResolvedValueOnce(null);

      const result = await service.getAncestorIds('nonexistent-id');

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // GET REGIONS
  // ============================================================================

  describe('getRegions', () => {
    it('should filter by type', async () => {
      prisma.region.findMany.mockResolvedValueOnce([
        { id: 'c1', name: 'Netherlands', type: 'COUNTRY' },
      ]);

      await service.getRegions({ type: 'COUNTRY' });

      expect(prisma.region.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'COUNTRY' }),
        }),
      );
    });

    it('should filter by parentId', async () => {
      prisma.region.findMany.mockResolvedValueOnce([]);

      await service.getRegions({ parentId: 'province-1' });

      expect(prisma.region.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ parentId: 'province-1' }),
        }),
      );
    });

    it('should filter by province with case-insensitive contains', async () => {
      prisma.region.findMany.mockResolvedValueOnce([]);

      await service.getRegions({ province: 'zh' });

      expect(prisma.region.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            province: { contains: 'zh', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should order by province asc, name asc', async () => {
      prisma.region.findMany.mockResolvedValueOnce([]);

      await service.getRegions({});

      expect(prisma.region.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ province: 'asc' }, { name: 'asc' }],
        }),
      );
    });

    it('should return select fields', async () => {
      prisma.region.findMany.mockResolvedValueOnce([]);

      await service.getRegions({});

      expect(prisma.region.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            name: true,
            nameEn: true,
            type: true,
            province: true,
            parentId: true,
          },
        }),
      );
    });
  });
});