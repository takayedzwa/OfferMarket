import { InsightsSnapshotService } from '../insights-snapshot.service';
import { InsightsConfigService } from '../insights-config.service';
import { DEFAULT_THRESHOLDS } from '../insights-settings';

const DAY = 24 * 60 * 60 * 1000;

function makeConfig(): InsightsConfigService {
  return {
    getThresholds: jest.fn().mockResolvedValue({ ...DEFAULT_THRESHOLDS }),
    getGeneratorConfig: jest.fn(),
    updateThresholds: jest.fn(),
    updateGeneratorConfig: jest.fn(),
    invalidateCache: jest.fn(),
  } as any;
}

function snapshotRow(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: Math.random().toString(),
    profession: 'Electrician',
    regionId: null,
    snapshotDate: new Date(Date.now() - 10 * DAY),
    data: {
      aggregate: {
        salary: { available: true, value: { median: 48000 }, sampleSize: 30 },
        sample: { offers: 30, employers: 12 },
      },
      provenance: { methodVersion: 1, computedAt: new Date().toISOString(), thresholds: {} },
    },
    ...overrides,
  };
}

function makePrisma(rows: any[] = []) {
  return {
    marketSnapshot: {
      findMany: jest.fn().mockResolvedValue(rows),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      deleteMany: jest.fn(),
    },
    region: { findMany: jest.fn() },
    offer: { findMany: jest.fn() },
  };
}

function makeService(rows: any[]) {
  const prisma = makePrisma(rows);
  const aggregation = { getAggregate: jest.fn() };
  const service = new InsightsSnapshotService(prisma as any, makeConfig(), aggregation as any);
  return { service, prisma, aggregation };
}

describe('InsightsSnapshotService — getTrends bucketing', () => {
  it('collapses intra-month snapshots (last wins) and computes consecutive changePct', async () => {
    const june = new Date('2026-06-20T00:00:00Z');
    const juneEarly = new Date('2026-06-02T00:00:00Z');
    const july = new Date('2026-07-15T00:00:00Z');
    const { service } = makeService([
      snapshotRow({ snapshotDate: juneEarly, data: { aggregate: { salary: { available: true, value: { median: 45000 }, sampleSize: 20 }, sample: { offers: 20, employers: 8 } } } }),
      snapshotRow({ snapshotDate: june, data: { aggregate: { salary: { available: true, value: { median: 46000 }, sampleSize: 25 }, sample: { offers: 25, employers: 9 } } } }),
      snapshotRow({ snapshotDate: july, data: { aggregate: { salary: { available: true, value: { median: 48600 }, sampleSize: 30 }, sample: { offers: 30, employers: 12 } } } }),
    ]);

    const trends = await service.getTrends('Electrician', 'month');

    expect(trends.points.map((p) => p.label)).toEqual(['2026-06', '2026-07']);
    // Last snapshot of June wins (the 20th, median 46000 — not the 2nd's 45000).
    expect(trends.points[0].salaryMedian!.value).toBe(46000);
    expect(trends.points[1].salaryMedian!.value).toBe(48600);
    // (48600-46000)/46000 = 5.65%
    expect(trends.points[1].changePct).toBeCloseTo(5.7, 1);
    expect(trends.points[0].changePct).toBeNull();
  });

  it('keeps an insufficient-data bucket explicitly unavailable (never a weak number)', async () => {
    const june = new Date('2026-06-15T00:00:00Z');
    const july = new Date('2026-07-15T00:00:00Z');
    const { service } = makeService([
      snapshotRow({ snapshotDate: june, data: { aggregate: { salary: { available: false, reason: 'INSUFFICIENT_DATA', sampleSize: 4 }, sample: { offers: 4, employers: 2 } } } }),
      snapshotRow({ snapshotDate: july, data: { aggregate: { salary: { available: true, value: { median: 48000 }, sampleSize: 30 }, sample: { offers: 30, employers: 10 } } } }),
    ]);

    const trends = await service.getTrends('Electrician', 'month');

    expect(trends.points[0].salaryMedian!.available).toBe(false);
    expect(trends.points[0].salaryMedian!.value).toBeUndefined();
    // changePct stays null: a jump from "no data" to a value is not a trend.
    expect(trends.points[1].changePct).toBeNull();
  });

  it('pairs each month with the same month one year earlier for yoy', async () => {
    const jul2025 = new Date('2025-07-10T00:00:00Z');
    const jul2026 = new Date('2026-07-10T00:00:00Z');
    const { service } = makeService([
      snapshotRow({ snapshotDate: jul2025, data: { aggregate: { salary: { available: true, value: { median: 44000 }, sampleSize: 30 }, sample: { offers: 30, employers: 10 } } } }),
      snapshotRow({ snapshotDate: jul2026, data: { aggregate: { salary: { available: true, value: { median: 48400 }, sampleSize: 30 }, sample: { offers: 30, employers: 10 } } } }),
    ]);

    const trends = await service.getTrends('Electrician', 'yoy');

    expect(trends.points).toHaveLength(2);
    expect(trends.points[1].changePct).toBeCloseTo(10, 1);
  });

  it('scopes the series to a region when regionId is given', async () => {
    const { prisma } = makeService([]);
    const service = new InsightsSnapshotService(prisma as any, makeConfig(), { getAggregate: jest.fn() } as any);
    await service.getTrends('Electrician', 'week', 'region-utrecht');

    const where = prisma.marketSnapshot.findMany.mock.calls[0][0].where;
    expect(where.regionId).toBe('region-utrecht');
    expect(where.profession).toEqual({ equals: 'Electrician', mode: 'insensitive' });
  });
});

describe('InsightsSnapshotService — provenance inspection', () => {
  it('paginates the admin snapshot list', async () => {
    const prisma = makePrisma([]);
    prisma.marketSnapshot.count.mockResolvedValue(2);
    prisma.marketSnapshot.findMany.mockResolvedValue([snapshotRow(), snapshotRow()]);
    const service = new InsightsSnapshotService(prisma as any, makeConfig(), { getAggregate: jest.fn() } as any);

    const result = await service.listSnapshots('Electrician', undefined, 2, 1);

    expect(result).toMatchObject({ total: 2, page: 2, limit: 1 });
    const args = prisma.marketSnapshot.findMany.mock.calls[0][0];
    expect(args.skip).toBe(1);
    expect(args.take).toBe(1);
    expect(args.orderBy).toEqual({ snapshotDate: 'desc' });
  });
});