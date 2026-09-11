import { InsightsStatsService } from '../insights-stats.service';
import { InsightsConfigService } from '../insights-config.service';
import { DEFAULT_THRESHOLDS, SAMPLE_SIZES } from '../insights-settings';

function makeConfig(): InsightsConfigService {
  return {
    getThresholds: jest.fn().mockResolvedValue({ ...DEFAULT_THRESHOLDS }),
    getGeneratorConfig: jest.fn().mockResolvedValue({ enabled: true }),
    updateThresholds: jest.fn(),
    updateGeneratorConfig: jest.fn(),
    invalidateCache: jest.fn(),
  } as any;
}

function makePrisma() {
  return {
    worker: { findUnique: jest.fn(), count: jest.fn() },
    employer: { findUnique: jest.fn() },
    offer: { findMany: jest.fn(), count: jest.fn() },
    profileSkill: { findMany: jest.fn() },
  };
}

function offer(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: Math.random().toString(),
    workerId: 'worker-1',
    employerId: 'employer-1',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    acceptedAt: null,
    worker: { regionId: 'region-city', region: { id: 'region-city', parentId: 'region-prov', name: 'Rotterdam' } },
    currentVersion: { salaryMax: 48000, salaryPeriod: 'year' },
    ...overrides,
  };
}

describe('InsightsStatsService — worker market overview sample-size gating', () => {
  it('returns INSUFFICIENT_DATA for every statistic when there are no offers', async () => {
    const prisma = makePrisma();
    prisma.worker.findUnique.mockResolvedValue({
      userId: 'u1',
      primaryTrade: 'Electrician',
      regionId: 'region-city',
      region: { id: 'region-city', parentId: 'region-prov', name: 'Rotterdam' },
      yearsOfExperience: 5,
      skills: [],
      certifications: [],
    });
    prisma.offer.findMany.mockResolvedValue([]);
    prisma.profileSkill.findMany.mockResolvedValue([]);
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const overview = await service.getWorkerMarketOverview('u1');

    expect(overview.profile.profession).toBe('Electrician');
    expect(overview.demand).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA' });
    expect(overview.salaryRange).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA' });
    expect(overview.salaryTrend).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA' });
    expect(overview.mostValuableSkills).toMatchObject({ available: false });
    expect(overview.relevantEmployers).toMatchObject({ available: false });
  });

  it('shows a salary range once the sample reaches the minimum, with region fallback used', async () => {
    const prisma = makePrisma();
    prisma.worker.findUnique.mockResolvedValue({
      userId: 'u1',
      primaryTrade: 'Electrician',
      regionId: 'region-city',
      region: { id: 'region-city', parentId: 'region-prov', name: 'Rotterdam' },
      yearsOfExperience: 5,
      skills: [],
      certifications: [],
    });
    // 40 offers all on the worker's own city region → city scope qualifies.
    prisma.offer.findMany.mockResolvedValue(
      Array.from({ length: 40 }, () =>
        offer({ workerId: 'worker-1', employerId: 'employer-1' }),
      ),
    );
    prisma.profileSkill.findMany.mockResolvedValue([]);
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const overview = await service.getWorkerMarketOverview('u1');

    expect(overview.scopeUsed).toBe('city');
    expect(overview.salaryRange).toMatchObject({ available: true, value: { currency: 'EUR' } });
    expect(overview.salaryRange.sampleSize).toBe(40);
    // Trend still gated: only 40 offers total vs the 60 needed across both windows.
    expect(overview.salaryTrend).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA' });
  });

  it('widen to province when the city sample is too small, and set the scope note', async () => {
    const prisma = makePrisma();
    prisma.worker.findUnique.mockResolvedValue({
      userId: 'u1',
      primaryTrade: 'Electrician',
      regionId: 'region-city',
      region: { id: 'region-city', parentId: 'region-prov', name: 'Rotterdam' },
      yearsOfExperience: 5,
      skills: [],
      certifications: [],
    });
    // Only 2 city offers; 40 province offers (parentId match) → province fallback.
    prisma.offer.findMany.mockResolvedValue([
      offer({ id: 'c1' }),
      offer({ id: 'c2' }),
      ...Array.from({ length: 40 }, (_, i) =>
        offer({
          id: `p${i}`,
          worker: {
            regionId: 'other-city',
            region: { id: 'other-city', parentId: 'region-prov', name: 'The Hague' },
          },
        }),
      ),
    ]);
    prisma.profileSkill.findMany.mockResolvedValue([]);
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const overview = await service.getWorkerMarketOverview('u1');

    expect(overview.scopeUsed).toBe('province');
    expect(overview.scopeNote).toContain('regional');
    expect(overview.salaryRange).toMatchObject({ available: true });
  });

  it('annualizes monthly salaries for the range', async () => {
    const prisma = makePrisma();
    prisma.worker.findUnique.mockResolvedValue({
      userId: 'u1',
      primaryTrade: 'Electrician',
      regionId: 'region-city',
      region: { id: 'region-city', parentId: 'region-prov', name: 'Rotterdam' },
      yearsOfExperience: 5,
      skills: [],
      certifications: [],
    });
    prisma.offer.findMany.mockResolvedValue(
      Array.from({ length: SAMPLE_SIZES.SALARY_RANGE }, () =>
        offer({ currentVersion: { salaryMax: 4000, salaryPeriod: 'month' } }),
      ),
    );
    prisma.profileSkill.findMany.mockResolvedValue([]);
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const overview = await service.getWorkerMarketOverview('u1');

    expect(overview.salaryRange).toMatchObject({
      available: true,
      value: { p25: 48000, p75: 48000 },
    });
  });
});

describe('InsightsStatsService — employer market view cohort gating', () => {
  it('gates competitor ranges below the employer-cohort minimum', async () => {
    const prisma = makePrisma();
    prisma.employer.findUnique.mockResolvedValue({ id: 'e1', userId: 'u1' });
    // Employer's own offers establish their dominant trade.
    prisma.offer.findMany
      .mockResolvedValueOnce([
        offer({
          worker: { primaryTrade: 'Electrician', regionId: 'r', region: { id: 'r', parentId: null, name: 'X' } },
        }),
      ])
      // Market offers: 5 employers only → below EMPLOYER_COHORT (8).
      .mockResolvedValueOnce(
        Array.from({ length: 40 }, (_, i) =>
          offer({ employerId: `employer-${i % 5}` }),
        ),
      );
    prisma.worker.count.mockResolvedValue(25);
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const view = await service.getEmployerMarketView('u1');

    expect(view.profession).toBe('Electrician');
    expect(view.competitorOfferRanges).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA' });
    expect(view.salaryCompetitiveness).toMatchObject({ available: false });
  });

  it('returns an empty view when the employer has no offers (no dominant trade)', async () => {
    const prisma = makePrisma();
    prisma.employer.findUnique.mockResolvedValue({ id: 'e1', userId: 'u1' });
    prisma.offer.findMany.mockResolvedValue([]);
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const view = await service.getEmployerMarketView('u1');
    expect(view.profession).toBeNull();
    expect(view.hiringDifficulty).toMatchObject({ available: false });
  });
});
describe('InsightsStatsService — explainable market-value indicator', () => {
  it('scores the transparent rubric from the worker profile + gated demand', async () => {
    const prisma = makePrisma();
    prisma.worker.findUnique.mockResolvedValue({
      userId: 'u1',
      primaryTrade: 'Electrician',
      regionId: 'region-city',
      region: { id: 'region-city', parentId: 'region-prov', name: 'Rotterdam' },
      yearsOfExperience: 5, // → 15 points
      skills: [{ isVerified: true }, { isVerified: true }, { isVerified: true }, { isVerified: true }], // 4 × 5 = 20
      certifications: [{ id: 'c1' }, { id: 'c2' }], // 2 × 7.5 = 15
      desiredSalaryMax: 50000,
    });
    prisma.offer.findMany.mockResolvedValue([]);
    prisma.profileSkill.findMany.mockResolvedValue([]);
    prisma.offer.count.mockResolvedValue(2); // 2 × 3 = 6 COMPARABLE_OFFERS points
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const overview = await service.getWorkerMarketOverview('u1');

    const mv = overview.marketValue;
    expect(mv.maxScore).toBe(100);
    expect(mv.components.map((c) => c.key)).toEqual([
      'EXPERIENCE', 'SKILLS', 'CERTIFICATIONS', 'DEMAND', 'COMPARABLE_OFFERS',
    ]);
    // Demand insufficient → 0 points, but explicitly labeled.
    const demandComponent = mv.components.find((c) => c.key === 'DEMAND')!;
    expect(demandComponent.points).toBe(0);
    expect(demandComponent.explanationKey).toBe('MARKET_VALUE.DEMAND_UNKNOWN');
    const exp = mv.components.find((c) => c.key === 'EXPERIENCE')!;
    expect(exp.points).toBe(15);
    expect(exp.explanationKey).toBe('MARKET_VALUE.EXPERIENCE_BAND');
    // 15 + 20 + 15 + 0 + 6
    expect(mv.scorePct).toBe(56);
    // Percentile stays gated: no market salary sample.
    expect(mv.salaryPercentile).toMatchObject({ available: false, reason: 'INSUFFICIENT_DATA' });
  });

  it('computes the salary percentile only when the market sample clears SALARY_RANGE', async () => {
    const prisma = makePrisma();
    prisma.worker.findUnique.mockResolvedValue({
      userId: 'u1',
      primaryTrade: 'Electrician',
      regionId: 'region-city',
      region: { id: 'region-city', parentId: 'region-prov', name: 'Rotterdam' },
      yearsOfExperience: 12,
      skills: [],
      certifications: [],
      desiredSalaryMax: 50000,
    });
    // 30 offers with salaries 40_000…69_000 → 50_000 sits at the 37th percentile.
    prisma.offer.findMany.mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => offer({ currentVersion: { salaryMax: 40000 + i * 1000, salaryPeriod: 'year' } })),
    );
    prisma.profileSkill.findMany.mockResolvedValue([]);
    prisma.offer.count.mockResolvedValue(0);
    const service = new InsightsStatsService(prisma as any, makeConfig());

    const overview = await service.getWorkerMarketOverview('u1');

    expect(overview.marketValue.salaryPercentile).toMatchObject({
      available: true,
      value: { percentile: 37 },
      sampleSize: 30,
    });
  });
});
