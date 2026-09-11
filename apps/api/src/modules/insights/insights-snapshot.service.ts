import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightsConfigService } from './insights-config.service';
import { MarketAggregationService } from './market-aggregation.service';
import { METHOD_VERSION, round1 } from './insights-settings';

/**
 * InsightsSnapshotService — the time-series layer (P3).
 *
 * A nightly cron computes the aggregation engine's output per
 * (profession, region) and persists one MarketSnapshot row per day. All
 * trend views (weekly / monthly / quarterly / year-over-year) are derived
 * from these rows, which keeps history cheap and every historical number
 * inspectable: each snapshot carries full provenance (method version,
 * computed-at, effective thresholds, sample sizes).
 *
 * Only professions with real marketplace activity are snapshotted — never a
 * profession nobody is hiring for (an all-zero series would be data-free
 * noise, not intelligence).
 */

export type TrendGranularity = 'day' | 'week' | 'month' | 'quarter' | 'yoy';

export interface TrendPoint {
  date: string;
  label: string;
  salaryMedian: { available: boolean; value?: number; sampleSize?: number } | null;
  offers: number;
  employers: number;
  changePct: number | null;
}

const MAX_PROFESSIONS_PER_RUN = 20;
const MAX_REGIONS_PER_PROFESSION = 6; // country + top-5 activity cities

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function quarterKey(d: Date): string {
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

@Injectable()
export class InsightsSnapshotService {
  private readonly logger = new Logger(InsightsSnapshotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: InsightsConfigService,
    private readonly aggregation: MarketAggregationService,
  ) {}

  /** Nightly job: write today's snapshot for every active (profession, region). */
  @Cron('30 2 * * *')
  async writeDailySnapshots(): Promise<{ snapshots: number }> {
    const t = await this.config.getThresholds();
    const windowStart = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    // Distinct professions = distinct worker primaryTrade among recent offers.
    const recentOffers = await this.prisma.offer.findMany({
      where: { status: { notIn: ['DRAFT', 'WITHDRAWN'] as any[] }, submittedAt: { gte: windowStart } },
      select: { worker: { select: { primaryTrade: true, regionId: true, region: { select: { name: true, type: true } } } } },
      take: 10000,
      orderBy: { submittedAt: 'desc' },
    });

    const tradeCounts = new Map<string, number>();
    const regionsByTrade = new Map<string, Map<string, number>>();
    const countryRegion = await this.prisma.region.findFirst({ where: { type: 'COUNTRY' }, select: { id: true } });

    for (const o of recentOffers) {
      const trade = o.worker?.primaryTrade;
      if (!trade) continue;
      const key = trade.toLowerCase();
      tradeCounts.set(key, (tradeCounts.get(key) ?? 0) + 1);
      const regionMap = regionsByTrade.get(key) ?? new Map<string, number>();
      if (o.worker?.regionId) regionMap.set(o.worker.regionId, (regionMap.get(o.worker.regionId) ?? 0) + 1);
      regionsByTrade.set(key, regionMap);
    }

    const topTrades = [...tradeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_PROFESSIONS_PER_RUN);
    const snapshotDate = new Date();
    let written = 0;

    for (const [trade] of topTrades) {
      const topRegionIds = [...(regionsByTrade.get(trade)?.entries() ?? [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_REGIONS_PER_PROFESSION - 1)
        .map(([id]) => id);
      // Country first, then the top-activity regions; deduped, no nulls.
      const targets = [...new Set([countryRegion?.id, ...topRegionIds].filter((id): id is string => !!id))];

      for (const regionId of targets) {
        try {
          const aggregate = await this.aggregation.getAggregate({
            profession: trade,
            regionId: regionId ?? undefined,
          });
          const existing = await this.prisma.marketSnapshot.findFirst({
            where: { profession: trade, regionId: regionId ?? null, snapshotDate },
            select: { id: true },
          });
          const data = JSON.parse(JSON.stringify({
            aggregate,
            provenance: {
              methodVersion: METHOD_VERSION,
              computedAt: snapshotDate.toISOString(),
              thresholds: aggregate.provenance.thresholds,
            },
          })) as Prisma.InputJsonValue;
          if (existing) {
            await this.prisma.marketSnapshot.update({ where: { id: existing.id }, data: { data } });
          } else {
            await this.prisma.marketSnapshot.create({
              data: { profession: trade, regionId: regionId ?? null, snapshotDate, data },
            });
          }
          written += 1;
        } catch (err) {
          this.logger.warn(`Snapshot failed for ${trade}/${regionId ?? 'country'}: ${(err as Error).message}`);
        }
      }
    }

    // Prune snapshots beyond retention — old numbers live in derived trends,
    // not in raw snapshot storage forever.
    const cutoff = new Date(Date.now() - t.SNAPSHOT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const pruned = await this.prisma.marketSnapshot.deleteMany({ where: { snapshotDate: { lt: cutoff } } });
    if (pruned.count > 0) this.logger.log(`Pruned ${pruned.count} expired market snapshots`);

    this.logger.log(`Daily market snapshots written: ${written}`);
    return { snapshots: written };
  }

  /**
   * Trend series for one (profession, region) at a given granularity.
   * Each point carries its own sample size and availability — a bucket whose
   * source snapshot was below the salary minimum stays "insufficient data",
   * even in a chart.
   */
  async getTrends(
    profession: string,
    granularity: TrendGranularity = 'month',
    regionId?: string,
  ): Promise<{ profession: string; regionId: string | null; granularity: TrendGranularity; points: TrendPoint[] }> {
    const snapshots = await this.prisma.marketSnapshot.findMany({
      where: { profession: { equals: profession, mode: 'insensitive' }, ...(regionId ? { regionId } : {}) },
      orderBy: { snapshotDate: 'asc' },
      take: 730,
    });

    // Bucket selection: last snapshot of each bucket wins.
    const buckets = new Map<string, (typeof snapshots)[number]>();
    for (const s of snapshots) {
      const date = new Date(s.snapshotDate);
      const key =
        granularity === 'day'
          ? date.toISOString().slice(0, 10)
          : granularity === 'week'
            ? isoWeekKey(date)
            : granularity === 'month'
              ? monthKey(date)
              : quarterKey(date); // yoy also buckets monthly, then is compared YoY below
      buckets.set(key, s);
    }

    let points: TrendPoint[] = [...buckets.entries()].map(([label, s]) => {
      const data = s.data as any;
      const aggregate = data?.aggregate;
      const salary = aggregate?.salary;
      return {
        date: new Date(s.snapshotDate).toISOString().slice(0, 10),
        label,
        salaryMedian: salary
          ? { available: !!salary.available, value: salary.value?.median, sampleSize: salary.sampleSize }
          : null,
        offers: aggregate?.sample?.offers ?? 0,
        employers: aggregate?.sample?.employers ?? 0,
        changePct: null as number | null,
      };
    });

    if (granularity === 'yoy') {
      // Year-over-year: each monthly point is paired with the same month one
      // year earlier; the change is only computed when both are available.
      const byMonth = new Map(points.map((p) => [p.label.slice(0, 7), p]));
      points = points.map((p) => {
        const month = p.label.slice(0, 7);
        const yearAgo = `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`;
        const base = byMonth.get(yearAgo);
        if (
          base?.salaryMedian?.available &&
          p.salaryMedian?.available &&
          base.salaryMedian.value &&
          p.salaryMedian.value
        ) {
          p.changePct = round1(((p.salaryMedian.value - base.salaryMedian.value) / base.salaryMedian.value) * 100);
        }
        return p;
      });
    } else {
      // Period-over-period change between consecutive points.
      for (let i = 1; i < points.length; i += 1) {
        const prev = points[i - 1];
        const cur = points[i];
        if (prev.salaryMedian?.available && cur.salaryMedian?.available && prev.salaryMedian.value && cur.salaryMedian.value) {
          cur.changePct = round1(((cur.salaryMedian.value - prev.salaryMedian.value) / prev.salaryMedian.value) * 100);
        }
      }
    }

    // Newest last keeps the series chronologically ordered for charts; the
    // frontend renders left → right.
    return { profession, regionId: regionId ?? null, granularity, points };
  }

  /** Admin provenance inspector: every stored snapshot for a profession. */
  async listSnapshots(profession?: string, regionId?: string, page = 1, limit = 50) {
    const where = {
      ...(profession ? { profession: { equals: profession, mode: 'insensitive' as const } } : {}),
      ...(regionId ? { regionId } : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.marketSnapshot.count({ where }),
      this.prisma.marketSnapshot.findMany({
        where,
        orderBy: { snapshotDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { region: { select: { id: true, name: true } } },
      }),
    ]);
    return { items, total, page, limit };
  }

  async getSnapshot(id: string) {
    const snapshot = await this.prisma.marketSnapshot.findUnique({
      where: { id },
      include: { region: { select: { id: true, name: true } } },
    });
    return snapshot;
  }
}