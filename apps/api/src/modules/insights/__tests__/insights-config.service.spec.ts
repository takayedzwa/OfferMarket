import { InsightsConfigService, THRESHOLDS_SETTINGS_KEY, GENERATOR_SETTINGS_KEY } from '../insights-config.service';
import { DEFAULT_GENERATOR_CONFIG, DEFAULT_THRESHOLDS } from '../insights-settings';

function makePrisma(rows: Record<string, { value: unknown } | undefined> = {}) {
  return {
    adminSettings: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { key: string } }) =>
        Promise.resolve(rows[where.key] ?? null),
      ),
      upsert: jest.fn().mockImplementation(({ where, create, update }) => Promise.resolve({ key: where.key, ...(create ?? {}), ...update })),
    },
  };
}

describe('InsightsConfigService — thresholds', () => {
  it('falls back to the typed defaults when no settings row exists', async () => {
    const service = new InsightsConfigService(makePrisma() as any);
    const t = await service.getThresholds();
    expect(t).toEqual(DEFAULT_THRESHOLDS);
    expect(t.SALARY_RANGE).toBe(30);
  });

  it('merges DB overrides over the defaults, ignoring invalid values', async () => {
    const prisma = makePrisma({
      [THRESHOLDS_SETTINGS_KEY]: {
        value: {
          SALARY_RANGE: 25, // valid override
          SALARY_TREND: -5, // negative → ignored, default kept
          DEMAND_LEVEL: 'ten', // wrong type → ignored
          NOT_A_THRESHOLD: 99, // unknown key → ignored entirely
        },
      },
    });
    const service = new InsightsConfigService(prisma as any);
    const t = await service.getThresholds();

    expect(t.SALARY_RANGE).toBe(25);
    expect(t.SALARY_TREND).toBe(DEFAULT_THRESHOLDS.SALARY_TREND);
    expect(t.DEMAND_LEVEL).toBe(DEFAULT_THRESHOLDS.DEMAND_LEVEL);
    expect((t as any).NOT_A_THRESHOLD).toBeUndefined();
  });

  it('keeps serving defaults (not throwing) when the DB read fails', async () => {
    const prisma = {
      adminSettings: { findUnique: jest.fn().mockRejectedValue(new Error('db down')), upsert: jest.fn() },
    };
    const service = new InsightsConfigService(prisma as any);
    const t = await service.getThresholds();
    expect(t).toEqual(DEFAULT_THRESHOLDS);
  });

  it('persists the effective object on update and returns it', async () => {
    const prisma = makePrisma();
    const service = new InsightsConfigService(prisma as any);
    const next = await service.updateThresholds({ SALARY_RANGE: 40 });

    expect(next.SALARY_RANGE).toBe(40);
    expect(next.DEMAND_LEVEL).toBe(DEFAULT_THRESHOLDS.DEMAND_LEVEL);
    expect(prisma.adminSettings.upsert).toHaveBeenCalledTimes(1);
    const call = prisma.adminSettings.upsert.mock.calls[0][0];
    expect(call.where).toEqual({ key: THRESHOLDS_SETTINGS_KEY });
    expect(call.create.value.SALARY_RANGE).toBe(40);
  });

  it('ignores invalid values in an admin update instead of weakening the rules', async () => {
    const prisma = makePrisma();
    const service = new InsightsConfigService(prisma as any);
    const next = await service.updateThresholds({ SALARY_RANGE: -10, DEMAND_LEVEL: NaN as any });
    expect(next.SALARY_RANGE).toBe(DEFAULT_THRESHOLDS.SALARY_RANGE);
    expect(next.DEMAND_LEVEL).toBe(DEFAULT_THRESHOLDS.DEMAND_LEVEL);
  });

  it('caches reads for the TTL but invalidation forces a fresh read', async () => {
    const prisma = makePrisma({ [THRESHOLDS_SETTINGS_KEY]: { value: { SALARY_RANGE: 25 } } });
    const service = new InsightsConfigService(prisma as any);
    await service.getThresholds();
    await service.getThresholds();
    expect(prisma.adminSettings.findUnique).toHaveBeenCalledTimes(1);

    service.invalidateCache();
    await service.getThresholds();
    expect(prisma.adminSettings.findUnique).toHaveBeenCalledTimes(2);
  });
});

describe('InsightsConfigService — generator config', () => {
  it('defaults to enabled with conservative trigger levels', async () => {
    const service = new InsightsConfigService(makePrisma() as any);
    expect(await service.getGeneratorConfig()).toEqual(DEFAULT_GENERATOR_CONFIG);
  });

  it('honors a stored disabled flag', async () => {
    const service = new InsightsConfigService(
      makePrisma({ [GENERATOR_SETTINGS_KEY]: { value: { enabled: false } } }) as any,
    );
    const cfg = await service.getGeneratorConfig();
    expect(cfg.enabled).toBe(false);
    expect(cfg.salaryChangePct).toBe(DEFAULT_GENERATOR_CONFIG.salaryChangePct);
  });

  it('rejects a non-positive salaryChangePct override', async () => {
    const service = new InsightsConfigService(
      makePrisma({ [GENERATOR_SETTINGS_KEY]: { value: { salaryChangePct: 0 } } }) as any,
    );
    expect((await service.getGeneratorConfig()).salaryChangePct).toBe(DEFAULT_GENERATOR_CONFIG.salaryChangePct);
  });
});