import { Test, TestingModule } from '@nestjs/testing';
import { WorkersController } from '../workers.controller';
import { WorkersService } from '../workers.service';

describe('WorkersController', () => {
  let controller: WorkersController;
  let workersService: Partial<WorkersService>;

  beforeEach(async () => {
    workersService = {
      searchWorkers: jest.fn().mockResolvedValue({
        workers: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkersController],
      providers: [
        { provide: WorkersService, useValue: workersService },
      ],
    }).compile();

    controller = module.get<WorkersController>(WorkersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper to call searchWorkers with named params in the correct position order:
  // trade, regionId, availability, minExperience, maxExperience,
  // specializations, hasDrivingLicense, workAuthorization, skillIds,
  // certificationNames, language, languageMinLevel, employmentTypes, page, limit
  function callSearch(params: Record<string, string | undefined> = {}) {
    return controller.searchWorkers(
      params.trade,
      params.regionId,
      params.availability,
      params.minExperience,
      params.maxExperience,
      params.specializations,
      params.hasDrivingLicense,
      params.workAuthorization,
      params.skillIds,
      params.certificationNames,
      params.language,
      params.languageMinLevel,
      params.employmentTypes,
      params.page,
      params.limit,
    );
  }

  // ============================================================================
  // LANGUAGE PARAM CONSTRUCTION
  // ============================================================================

  describe('searchWorkers — language param construction', () => {
    it('should create languageMinLevel when both language and languageMinLevel provided', async () => {
      await callSearch({ language: 'Dutch', languageMinLevel: 'B2' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          languageMinLevel: { language: 'Dutch', level: 'B2' },
        }),
      );
      const callArgs = (workersService.searchWorkers as jest.Mock).mock.calls[0][0];
      expect(callArgs.languageFilter).toBeUndefined();
    });

    it('should create languageFilter when language is provided without languageMinLevel', async () => {
      await callSearch({ language: 'English' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          languageFilter: { language: 'English' },
        }),
      );
      const callArgs = (workersService.searchWorkers as jest.Mock).mock.calls[0][0];
      expect(callArgs.languageMinLevel).toBeUndefined();
    });

    it('should not create language filters when no language param provided', async () => {
      await callSearch();

      const callArgs = (workersService.searchWorkers as jest.Mock).mock.calls[0][0];
      expect(callArgs.languageMinLevel).toBeUndefined();
      expect(callArgs.languageFilter).toBeUndefined();
    });
  });

  // ============================================================================
  // NUMERIC PARSING
  // ============================================================================

  describe('searchWorkers — numeric parsing', () => {
    it('should parse minExperience and maxExperience as numbers', async () => {
      await callSearch({ minExperience: '3', maxExperience: '10' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          minExperience: 3,
          maxExperience: 10,
        }),
      );
    });

    it('should set minExperience to undefined for non-numeric strings', async () => {
      await callSearch({ minExperience: 'abc', maxExperience: '10' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          minExperience: undefined,
          maxExperience: 10,
        }),
      );
    });

    it('should set both to undefined when not provided', async () => {
      await callSearch();

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          minExperience: undefined,
          maxExperience: undefined,
        }),
      );
    });
  });

  // ============================================================================
  // COMMA-SEPARATED PARSING
  // ============================================================================

  describe('searchWorkers — comma-separated parsing', () => {
    it('should split specializations by comma', async () => {
      await callSearch({ specializations: 'INDUSTRIAL_INSTALLATIONS,PLC_SYSTEMS' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          specializations: ['INDUSTRIAL_INSTALLATIONS', 'PLC_SYSTEMS'],
        }),
      );
    });

    it('should split skillIds by comma', async () => {
      await callSearch({ skillIds: 'skill-1,skill-2,skill-3' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          skillIds: ['skill-1', 'skill-2', 'skill-3'],
        }),
      );
    });

    it('should split certificationNames by comma', async () => {
      await callSearch({ certificationNames: 'NEN 3140,VCA' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          certificationNames: ['NEN 3140', 'VCA'],
        }),
      );
    });

    it('should split employmentTypes by comma', async () => {
      await callSearch({ employmentTypes: 'FULL_TIME,PART_TIME' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          employmentTypes: ['FULL_TIME', 'PART_TIME'],
        }),
      );
    });

    it('should not set specializations/skillIds/certificationNames/employmentTypes when not provided', async () => {
      await callSearch();

      const callArgs = (workersService.searchWorkers as jest.Mock).mock.calls[0][0];
      expect(callArgs.specializations).toBeUndefined();
      expect(callArgs.skillIds).toBeUndefined();
      expect(callArgs.certificationNames).toBeUndefined();
      expect(callArgs.employmentTypes).toBeUndefined();
    });
  });

  // ============================================================================
  // BOOLEAN PARSING
  // ============================================================================

  describe('searchWorkers — boolean parsing', () => {
    it('should parse hasDrivingLicense "true" as boolean true', async () => {
      await callSearch({ hasDrivingLicense: 'true' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          hasDrivingLicense: true,
        }),
      );
    });

    it('should parse hasDrivingLicense "false" as boolean false', async () => {
      await callSearch({ hasDrivingLicense: 'false' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          hasDrivingLicense: false,
        }),
      );
    });

    it('should leave hasDrivingLicense undefined when not provided', async () => {
      await callSearch();

      const callArgs = (workersService.searchWorkers as jest.Mock).mock.calls[0][0];
      expect(callArgs.hasDrivingLicense).toBeUndefined();
    });
  });

  // ============================================================================
  // PAGINATION DEFAULTS
  // ============================================================================

  describe('searchWorkers — pagination defaults', () => {
    it('should default to page=1 and limit=20', async () => {
      await callSearch();

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
        }),
      );
    });

    it('should parse custom page and limit', async () => {
      await callSearch({ page: '3', limit: '10' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
          limit: 10,
        }),
      );
    });
  });

  // ============================================================================
  // OTHER PARAMS
  // ============================================================================

  describe('searchWorkers — other params', () => {
    it('should pass trade directly', async () => {
      await callSearch({ trade: 'Electrician' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          trade: 'Electrician',
        }),
      );
    });

    it('should pass regionId directly', async () => {
      await callSearch({ regionId: 'region-123' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          regionId: 'region-123',
        }),
      );
    });

    it('should pass workAuthorization directly', async () => {
      await callSearch({ workAuthorization: 'EU_CITIZEN' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          workAuthorization: 'EU_CITIZEN',
        }),
      );
    });

    it('should pass availability directly', async () => {
      await callSearch({ availability: 'IMMEDIATE' });

      expect(workersService.searchWorkers).toHaveBeenCalledWith(
        expect.objectContaining({
          availability: 'IMMEDIATE',
        }),
      );
    });
  });
});