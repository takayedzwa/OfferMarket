import { MarketAggregationService, MARKET_ACTIVE_STATUSES } from '../market-aggregation.service';
import { InsightsConfigService } from '../insights-config.service';
import { DEFAULT_THRESHOLDS } from '../insights-settings';

function makeConfig(overrides: Partial<typeof DEFAULT_THRESHOLDS> = {}): InsightsConfigService {
  return {
    getThresholds: jest.fn().mockResolvedValue({ ...DEFAULT_THRESHOLDS, ...overrides }),
    getGeneratorConfig: jest.fn(),
    updateThresholds: jest.fn(),
    updateGeneratorConfig: jest.fn(),
    invalidateCache: jest.fn(),
  } as any;
}

function makePrisma(offers: any[] = [], opts: { profileSkills?: any[]; regions?: any[]; candidates?: any[] } = {}) {
  return {
    offer: { findMany: jest.fn().mockResolvedValue(offers) },
    profileSkill: { findMany: jest.fn().mockResolvedValue(opts.profileSkills ?? []) },
    worker: { groupBy: jest.fn().mockResolvedValue(opts.candidates ?? []) },
    region: { findMany: jest.fn().mockResolvedValue(opts.regions ?? []) },
  };
}

const DAY = 24 * 60 * 60 * 1000;

function makeOffer(overrides: Partial<Record<string, any>> = {}) {
  const submittedAt = new Date(Date.now() - 5 * DAY);
  return {
    id: Math.random().toString(),
    workerId: 'w1',
    employerId: 'e1',
    status: 'VIEWED',
    submittedAt,
    acceptedAt: null,
    worker: {
      primaryTrade: 'Electrician',
      yearsOfExperience: 5,
      regionId: 'region-city',
      region: { id: 'region-city', name: 'Rotterdam' },
    },
    currentVersion: {
      salaryMax: 48000,
      salaryPeriod: 'year',
      companyVehicle: 'VAN',
      toolsProvided: true,
      phoneProvided: false,
      trainingBudget: 0,
      pensionContributionPct: 0,
      travelAllowanceValue: null,
      remoteWorkPct: 0,
    },
    ...overrides,
  };
}

describe('MarketAggregationService — GatedValue contract', () => {
  it('returns INSUFFICIENT_DATA for every statistic on an empty market', async () => {
    const service = new MarketAggregationService(makePrisma([]) as any, makeConfig());
    const agg = await service.getAggregate({ profession: 'Electrician' });

    expect(agg.salary).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA', sampleSize: 0 });
    expect(agg.competitiveness.acceptanceRate).toMatchObject({ available: false });
    expect(agg.competitiveness.timeToAcceptance).toMatchObject({ available: false });
    expect(agg.provenance.methodVersion).toBe(1);
    expect(agg.provenance.thresholds).toBeDefined();
  });

  it('unlocks salary stats when the sample reaches SALARY_RANGE, with provenance', async () => {
    const offers = Array.from({ length: 30 }, (_, i) => makeOffer({ currentVersion: { ...makeOffer().currentVersion, salaryMax: 40000 + i * 1000 } }));
    const service = new MarketAggregationService(makePrisma(offers) as any, makeConfig());
    const agg = await service.getAggregate();

    expect(agg.salary.available).toBe(true);
    expect(agg.salary.value!.currency).toBe('EUR');
    expect(agg.salary.value!.median).toBe(40000 + 14.5 * 1000);
    expect(agg.sample.offers).toBe(30);
  });

  it('excludes hourly salaries from salary statistics instead of guessing', async () => {
    const offers = Array.from({ length: 30 }, () =>
      makeOffer({ currentVersion: { ...makeOffer().currentVersion, salaryPeriod: 'hour' } }),
    );
    const service = new MarketAggregationService(makePrisma(offers) as any, makeConfig());
    const agg = await service.getAggregate();

    expect(agg.salary).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA', sampleSize: 0 });
  });

  it('annualizes monthly salaries (×12) in salary statistics', async () => {
    const offers = Array.from({ length: 30 }, () =>
      makeOffer({ currentVersion: { ...makeOffer().currentVersion, salaryMax: 4000, salaryPeriod: 'month' } }),
    );
    const service = new MarketAggregationService(makePrisma(offers) as any, makeConfig());
    const agg = await service.getAggregate();

    expect(agg.salary.value!.median).toBe(48000);
  });

  it('reports demand growth only when BOTH windows clear the demand minimum', async () => {
    const current = Array.from({ length: 5 }, () => makeOffer());
    const previous = Array.from({ length: 2 }, () => makeOffer({ submittedAt: new Date(Date.now() - 100 * DAY) }));
    const service = new MarketAggregationService(makePrisma([...current, ...previous]) as any, makeConfig());
    const agg = await service.getAggregate();

    expect(agg.demand.available).toBe(true);
    expect(agg.demand.value!.growthPct).toBeUndefined();
    expect(agg.demand.value!.offers).toBe(5);
  });

  it('gates the benefit acceptance gap below TIME_TO_HIRE cohort sizes', async () => {
    // 5 current offers (≥ DEMAND_LEVEL=5) but far below TIME_TO_HIRE=20 per cohort.
    const offers = Array.from({ length: 5 }, () => makeOffer({ acceptedAt: new Date() }));
    const service = new MarketAggregationService(makePrisma(offers) as any, makeConfig());
    const agg = await service.getAggregate();

    expect(agg.competitiveness.benefitCompetitiveness.available).toBe(true);
    expect(agg.competitiveness.benefitCompetitiveness.value!.acceptanceGapPct).toBeUndefined();
  });
});

describe('MarketAggregationService — dimensions', () => {
  it('emits every group row but gates weak groups at SALARY_RANGE', async () => {
    const strong = Array.from({ length: 30 }, () => makeOffer({ worker: { primaryTrade: 'Electrician', yearsOfExperience: 5, regionId: 'r1', region: { id: 'r1', name: 'Rotterdam' } } }));
    const weak = Array.from({ length: 3 }, () => makeOffer({ worker: { primaryTrade: 'Plumber', yearsOfExperience: 2, regionId: 'r2', region: { id: 'r2', name: 'Delft' } } }));
    const service = new MarketAggregationService(makePrisma([...strong, ...weak]) as any, makeConfig());
    const rows = await service.getSalaryByDimension('profession');

    const electrician = rows.find((r) => r.group === 'electrician');
    const plumber = rows.find((r) => r.group === 'plumber');
    expect(electrician!.salary.available).toBe(true);
    expect(plumber).toBeDefined();
    expect(plumber!.offers).toBe(3);
    expect(plumber!.salary).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA' });
  });
});

describe('MarketAggregationService — skill demand', () => {
  it('returns growth only when both windows clear MOST_VALUABLE_SKILLS', async () => {
    const current = Array.from({ length: 12 }, (_, i) =>
      makeOffer({ workerId: `w${i}`, acceptedAt: undefined }),
    );
    const previous = Array.from({ length: 2 }, (_, i) => makeOffer({ workerId: `p${i}`, submittedAt: new Date(Date.now() - 100 * DAY) }));
    const profileSkills = [
      ...current.map((_, i) => ({ profileId: `w${i}`, skill: { slug: 'ev-installation' } })),
      ...previous.map((_, i) => ({ profileId: `p${i}`, skill: { slug: 'ev-installation' } })),
    ];
    const service = new MarketAggregationService(makePrisma([...current, ...previous], { profileSkills }) as any, makeConfig());
    const rows = await service.getSkillDemandStats();

    const ev = rows.find((r) => r.skill === 'ev-installation');
    expect(ev).toBeDefined();
    expect(ev!.offers).toBe(12);
    expect(ev!.prevOffers).toBe(2);
    expect(ev!.growthPct).toBeNull();
  });
});

describe('MarketAggregationService — regional shortages', () => {
  it('classifies HIGH / MODERATE / LOW by offers per available candidate', async () => {
    const offerRow = (regionId: string) => ({ worker: { regionId } });
    // DEMAND_LEVEL=5: each region needs ≥5 offers to appear at all.
    const service = new MarketAggregationService(
      {
        offer: {
          findMany: jest.fn().mockResolvedValue([
            ...Array.from({ length: 10 }, () => offerRow('r1')), // 10 offers / 1 candidate → HIGH
            ...Array.from({ length: 5 }, () => offerRow('r2')), // 5 offers / 6 candidates → LOW (<1 per candidate)
            ...Array.from({ length: 5 }, () => offerRow('r4')), // 5 offers / 0 candidates → HIGH
            ...Array.from({ length: 4 }, () => offerRow('r3')), // 4 offers → below DEMAND_LEVEL → dropped
          ]),
        },
        worker: {
          groupBy: jest.fn().mockResolvedValue([
            { regionId: 'r1', _count: { _all: 1 } },
            { regionId: 'r2', _count: { _all: 6 } },
            { regionId: 'r3', _count: { _all: 3 } },
          ]),
        },
        region: { findMany: jest.fn().mockResolvedValue([{ id: 'r1', name: 'Rotterdam', type: 'CITY' }, { id: 'r2', name: 'Delft', type: 'CITY' }, { id: 'r4', name: 'Utrecht', type: 'CITY' }]) },
      } as any,
      makeConfig(),
    );
    const rows = await service.getRegionalShortages();

    expect(rows.find((r) => r.regionId === 'r1')!.shortageLevel).toBe('HIGH');
    expect(rows.find((r) => r.regionId === 'r2')!.shortageLevel).toBe('LOW');
    expect(rows.find((r) => r.regionId === 'r4')!.shortageLevel).toBe('HIGH');
    expect(rows.find((r) => r.regionId === 'r3')).toBeUndefined();
  });
});

describe('MARKET_ACTIVE_STATUSES', () => {
  it('excludes drafts and withdrawn offers from market activity', () => {
    expect(MARKET_ACTIVE_STATUSES).not.toContain('DRAFT');
    expect(MARKET_ACTIVE_STATUSES).not.toContain('WITHDRAWN');
    expect(MARKET_ACTIVE_STATUSES).toContain('ACCEPTED');
  });
});