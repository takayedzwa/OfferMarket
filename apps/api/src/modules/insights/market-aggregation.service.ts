import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightsConfigService } from './insights-config.service';
import {
  METHOD_VERSION,
  annualizeSalary,
  median,
  percentile,
  round1,
} from './insights-settings';

/**
 * MarketAggregationService — the general aggregation layer that converts
 * marketplace activity (offers) into dimension-parameterized market
 * intelligence. Every output is:
 *
 *   - computed from real submitted offers only (data class OFFERMARKT),
 *   - gated by the admin-configurable sample-size thresholds
 *     (InsightsConfigService → `insights.thresholds` in AdminSettings),
 *   - accompanied by full provenance (method version, period, sample sizes,
 *     computed-at timestamp, the effective thresholds) so any number can be
 *     traced to exactly how it was produced.
 *
 * The snapshot engine (insights-snapshot.service.ts) persists the output of
 * `getAggregate` per (profession, region, day); the dashboard and the
 * auto-draft generator build on the same aggregates, so there is exactly one
 * definition of every metric in the product.
 */

/** Offer statuses that count as genuine market activity (drafts/withdrawn do not). */
export const MARKET_ACTIVE_STATUSES = [
  'SUBMITTED',
  'VIEWED',
  'SHORTLISTED',
  'ACCEPTED',
  'REJECTED',
  'COUNTERED',
  'EXPIRED',
] as const;

/** MVP safety bound: aggregation reads at most this many offers per query. */
const MAX_OFFERS_PER_QUERY = 5000;

export interface GatedValue<T> {
  available: boolean;
  reason?: 'INSUFFICIENT_DATA';
  value?: T;
  sampleSize?: number;
}

function gated<T>(value: T, sampleSize: number, min: number): GatedValue<T> {
  if (sampleSize < min) return { available: false, reason: 'INSUFFICIENT_DATA', sampleSize };
  return { available: true, value, sampleSize };
}

export interface AggregationQuery {
  profession?: string;
  regionId?: string;
  skillSlugs?: string[];
  experienceMin?: number;
  experienceMax?: number;
  /** window length in days (defaults to the configured WINDOW_DAYS) */
  windowDays?: number;
}

export interface SalaryStats {
  mean: number;
  median: number;
  p25: number;
  p50: number;
  p75: number;
  currency: string;
}

export interface BenefitStats {
  medianBenefitScore: number;
  benefitScoreMax: number;
  prevalence: { vehicle: number; tools: number; phone: number; trainingBudget: number; pension: number; travel: number; remote: number };
  acceptanceWithBenefitsPct?: number;
  acceptanceWithoutBenefitsPct?: number;
  acceptanceGapPct?: number;
}

export interface MarketAggregate {
  query: AggregationQuery;
  period: { start: string; end: string; windowDays: number };
  sample: { offers: number; workers: number; employers: number };
  salary: GatedValue<SalaryStats>;
  demand: GatedValue<{ offers: number; employers: number; growthPct?: number }>;
  competitiveness: {
    acceptanceRate: GatedValue<{ ratePct: number }>;
    rejectionRate: GatedValue<{ ratePct: number }>;
    avgOffer: GatedValue<{ mean: number; currency: string }>;
    timeToAcceptance: GatedValue<{ medianDays: number }>;
    benefitCompetitiveness: GatedValue<BenefitStats>;
  };
  provenance: {
    methodVersion: number;
    computedAt: string;
    thresholds: Record<string, number>;
  };
}

export type SalaryDimension = 'profession' | 'region' | 'skill' | 'experience';

export interface DimensionRow {
  group: string;
  label: string | null;
  salary: GatedValue<SalaryStats>;
  offers: number;
}

export interface SkillDemandRow {
  skill: string;
  offers: number;
  prevOffers: number;
  growthPct: number | null;
}

export interface RegionalShortageRow {
  regionId: string;
  regionName: string;
  offers: number;
  availableCandidates: number;
  offersPerCandidate: number | null;
  shortageLevel: 'HIGH' | 'MODERATE' | 'LOW' | null;
}

const EXPERIENCE_BANDS = [
  { key: '0-2', min: 0, max: 2 },
  { key: '3-5', min: 3, max: 5 },
  { key: '6-10', min: 6, max: 10 },
  { key: '11+', min: 11, max: 999 },
] as const;

/** Count of benefit indicators present on an offer version (0..8). */
function benefitScore(v: {
  companyVehicle: string;
  toolsProvided: boolean;
  phoneProvided: boolean;
  trainingBudget: number;
  pensionContributionPct: number;
  travelAllowanceValue: number | null;
  remoteWorkPct: number;
}): number {
  let score = 0;
  if (v.companyVehicle && v.companyVehicle !== 'NONE') score += 1;
  if (v.toolsProvided) score += 1;
  if (v.phoneProvided) score += 1;
  if (v.trainingBudget > 0) score += 1;
  if (v.pensionContributionPct > 0) score += 1;
  if ((v.travelAllowanceValue ?? 0) > 0) score += 1;
  if (v.remoteWorkPct > 0) score += 1;
  if (score >= 4) score += 1; // "strong package" bonus indicator
  return score;
}

@Injectable()
export class MarketAggregationService {
  private readonly logger = new Logger(MarketAggregationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: InsightsConfigService,
  ) {}

  /**
   * Core aggregate for one market slice. Current window + the window before
   * it (for growth) are fetched in one bounded query and sliced in memory —
   * the same pattern as the personalized dashboards.
   */
  async getAggregate(query: AggregationQuery = {}): Promise<MarketAggregate> {
    const t = await this.config.getThresholds();
    const windowDays = query.windowDays ?? t.WINDOW_DAYS;
    const end = new Date();
    const currentStart = new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const prevStart = new Date(currentStart.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const offers = await this.fetchOffers(
      {
        profession: query.profession,
        regionId: query.regionId,
        skillSlugs: query.skillSlugs,
        experienceMin: query.experienceMin,
        experienceMax: query.experienceMax,
      },
      prevStart,
    );

    const current = offers.filter((o) => o.submittedAt && o.submittedAt >= currentStart);
    const previous = offers.filter((o) => o.submittedAt && o.submittedAt < currentStart);

    const currentSalaries = current.map((o) => annualizeSalary(o.currentVersion)).filter((s): s is number => s !== null);
    const employerCount = new Set(current.map((o) => o.employerId)).size;
    const workerCount = new Set(current.map((o) => o.workerId)).size;

    // Demand: offer volume + growth vs the previous window. Growth is only
    // reported when BOTH windows clear the demand minimum — a growth number
    // from tiny samples is noise presented as fact.
    let demand: MarketAggregate['demand'];
    if (current.length < t.DEMAND_LEVEL) {
      demand = { available: false, reason: 'INSUFFICIENT_DATA', sampleSize: current.length };
    } else if (previous.length >= t.DEMAND_LEVEL) {
      const growthPct = round1(((current.length - previous.length) / previous.length) * 100);
      demand = { available: true, value: { offers: current.length, employers: employerCount, growthPct }, sampleSize: current.length };
    } else {
      demand = { available: true, value: { offers: current.length, employers: employerCount }, sampleSize: current.length };
    }

    const accepted = current.filter((o) => o.acceptedAt);
    const rejected = current.filter((o) => o.status === 'REJECTED');
    const resolved = accepted.length + rejected.length;
    const hireDurations = accepted
      .filter((o) => o.submittedAt)
      .map((o) => (o.acceptedAt!.getTime() - o.submittedAt!.getTime()) / (24 * 60 * 60 * 1000));

    // Benefits: score each offer's package; the acceptance gap between
    // offers with a strong package vs the rest is only shown when both
    // cohorts clear the time-to-hire minimum. Offers without a current
    // version carry no benefit data and are excluded from benefit stats.
    const benefitable = current.filter((o) => o.currentVersion !== null);
    const scores = benefitable.map((o) => benefitScore(o.currentVersion as any));
    const prevalence = this.benefitPrevalence(benefitable);
    let benefitCompetitiveness: GatedValue<BenefitStats> = {
      available: false,
      reason: 'INSUFFICIENT_DATA',
      sampleSize: benefitable.length,
    };
    if (benefitable.length >= t.DEMAND_LEVEL) {
      const thresholdScore = median(scores) ?? 0;
      const strongPool = benefitable.filter((o) => benefitScore(o.currentVersion as any) >= thresholdScore);
      const weakPool = benefitable.filter((o) => benefitScore(o.currentVersion as any) < thresholdScore);
      const strongAccepted = strongPool.filter((o) => o.acceptedAt).length;
      const weakAccepted = weakPool.filter((o) => o.acceptedAt).length;
      const value: BenefitStats = {
        medianBenefitScore: round1(thresholdScore),
        benefitScoreMax: 8,
        prevalence,
      };
      if (strongPool.length >= t.TIME_TO_HIRE && weakPool.length >= t.TIME_TO_HIRE) {
        value.acceptanceWithBenefitsPct = round1((strongAccepted / strongPool.length) * 100);
        value.acceptanceWithoutBenefitsPct = round1((weakAccepted / weakPool.length) * 100);
        value.acceptanceGapPct = round1(
          (value.acceptanceWithBenefitsPct ?? 0) - (value.acceptanceWithoutBenefitsPct ?? 0),
        );
      }
      benefitCompetitiveness = { available: true, value, sampleSize: benefitable.length };
    }

    return {
      query,
      period: { start: currentStart.toISOString(), end: end.toISOString(), windowDays },
      sample: { offers: current.length, workers: workerCount, employers: employerCount },
      salary: gated(
        {
          mean: Math.round(currentSalaries.reduce((s, v) => s + v, 0) / currentSalaries.length),
          median: Math.round(median(currentSalaries) ?? 0),
          p25: Math.round(percentile(currentSalaries, 0.25) ?? 0),
          p50: Math.round(median(currentSalaries) ?? 0),
          p75: Math.round(percentile(currentSalaries, 0.75) ?? 0),
          currency: 'EUR',
        },
        currentSalaries.length,
        t.SALARY_RANGE,
      ),
      demand,
      competitiveness: {
        acceptanceRate: gated(
          { ratePct: round1((accepted.length / Math.max(resolved, 1)) * 100) },
          resolved,
          t.TIME_TO_HIRE,
        ),
        rejectionRate: gated(
          { ratePct: round1((rejected.length / Math.max(resolved, 1)) * 100) },
          resolved,
          t.TIME_TO_HIRE,
        ),
        avgOffer: gated(
          {
            mean: Math.round(currentSalaries.reduce((s, v) => s + v, 0) / currentSalaries.length),
            currency: 'EUR',
          },
          currentSalaries.length,
          t.SALARY_RANGE,
        ),
        timeToAcceptance: gated(
          { medianDays: Math.round(median(hireDurations) ?? 0) },
          hireDurations.length,
          t.TIME_TO_HIRE,
        ),
        benefitCompetitiveness,
      },
      provenance: {
        methodVersion: METHOD_VERSION,
        computedAt: end.toISOString(),
        thresholds: t as unknown as Record<string, number>,
      },
    };
  }

  /**
   * Salary stats broken down by a dimension. A row is emitted for every
   * observed group; only rows whose sample clears SALARY_RANGE carry values
   * (the rest carry an explicit INSUFFICIENT_DATA state — never a weak number).
   */
  async getSalaryByDimension(dimension: SalaryDimension, base: AggregationQuery = {}): Promise<DimensionRow[]> {
    const t = await this.config.getThresholds();
    const windowDays = base.windowDays ?? t.WINDOW_DAYS;
    const currentStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const offers = await this.fetchOffers(base, currentStart);

    const groups = new Map<string, { label: string | null; salaries: number[]; offers: number }>();
    const add = (key: string, label: string | null, salary: number | null) => {
      const g = groups.get(key) ?? { label, salaries: [], offers: 0 };
      g.offers += 1;
      if (salary !== null) g.salaries.push(salary);
      groups.set(key, g);
    };

    if (dimension === 'skill') {
      const skillIdsByWorker = await this.workerSkillsBySlug(offers);
      for (const o of offers) {
        const salary = annualizeSalary(o.currentVersion);
        const slugs = skillIdsByWorker.get(o.workerId) ?? [];
        for (const slug of slugs) add(slug, null, salary);
      }
    } else {
      for (const o of offers) {
        const salary = annualizeSalary(o.currentVersion);
        if (dimension === 'profession') {
          add((o.worker?.primaryTrade ?? 'unknown').toLowerCase(), o.worker?.primaryTrade ?? null, salary);
        } else if (dimension === 'region') {
          const key = o.worker?.regionId ?? 'unknown';
          add(key, o.worker?.region?.name ?? null, salary);
        } else {
          const years = o.worker?.yearsOfExperience ?? null;
          const band = years === null ? null : EXPERIENCE_BANDS.find((b) => years >= b.min && years <= b.max);
          add(band ? band.key : 'unknown', band ? band.key : null, salary);
        }
      }
    }

    return [...groups.entries()].map(([group, g]) => ({
      group,
      label: g.label,
      offers: g.offers,
      salary: gated(
        {
          mean: Math.round(g.salaries.reduce((s, v) => s + v, 0) / g.salaries.length),
          median: Math.round(median(g.salaries) ?? 0),
          p25: Math.round(percentile(g.salaries, 0.25) ?? 0),
          p50: Math.round(median(g.salaries) ?? 0),
          p75: Math.round(percentile(g.salaries, 0.75) ?? 0),
          currency: 'EUR',
        },
        g.salaries.length,
        t.SALARY_RANGE,
      ),
    }));
  }

  /**
   * Per-skill demand (offer counts) for the current and previous window.
   * Powers "fastest-growing skills", the generator's demand-growth rule and
   * the dashboard. Only skills with at least one offer in either window are
   * returned; growth requires the skill minimum in both windows.
   */
  async getSkillDemandStats(base: AggregationQuery = {}): Promise<SkillDemandRow[]> {
    const t = await this.config.getThresholds();
    const windowDays = base.windowDays ?? t.WINDOW_DAYS;
    const currentStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const prevStart = new Date(currentStart.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const offers = await this.fetchOffers(base, prevStart);
    const skillIdsByWorker = await this.workerSkillsBySlug(offers);

    const counts = new Map<string, { current: number; previous: number }>();
    for (const o of offers) {
      const bucket = o.submittedAt && o.submittedAt >= currentStart ? 'current' : 'previous';
      for (const slug of skillIdsByWorker.get(o.workerId) ?? []) {
        const c = counts.get(slug) ?? { current: 0, previous: 0 };
        c[bucket] += 1;
        counts.set(slug, c);
      }
    }
    return [...counts.entries()]
      .map(([skill, c]) => ({
        skill,
        offers: c.current,
        prevOffers: c.previous,
        growthPct:
          c.current >= t.MOST_VALUABLE_SKILLS && c.previous >= t.MOST_VALUABLE_SKILLS
            ? round1(((c.current - c.previous) / c.previous) * 100)
            : null,
      }))
      .sort((a, b) => b.offers - a.offers);
  }

  /**
   * Regional shortage: demand (offers in window) vs available, visible
   * candidates per city region. High offers-per-candidate = shortage. Only
   * regions with at least DEMAND_LEVEL offers are returned.
   */
  async getRegionalShortages(): Promise<RegionalShortageRow[]> {
    const t = await this.config.getThresholds();
    const windowStart = new Date(Date.now() - t.WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [offersByRegion, candidatesByRegion, regions] = await Promise.all([
      this.prisma.offer.findMany({
        where: {
          status: { in: [...MARKET_ACTIVE_STATUSES] as any[] },
          submittedAt: { gte: windowStart },
        },
        select: { worker: { select: { regionId: true, region: { select: { name: true } } } } },
      }),
      this.prisma.worker.groupBy({
        by: ['regionId'],
        where: {
          deletedAt: null,
          regionId: { not: null },
          availability: { not: 'NOT_AVAILABLE' },
          profileVisibility: { in: ['ALL_VERIFIED', 'SELECTED_COMPANIES'] },
        },
        _count: { _all: true },
      }),
      this.prisma.region.findMany({ select: { id: true, name: true, type: true } }),
    ]);

    const demandByRegion = new Map<string, number>();
    for (const o of offersByRegion) {
      const regionId = o.worker?.regionId;
      if (regionId) demandByRegion.set(regionId, (demandByRegion.get(regionId) ?? 0) + 1);
    }
    const candidateCounts = new Map(candidatesByRegion.map((c) => [c.regionId as string, c._count._all]));
    const regionNames = new Map(regions.map((r) => [r.id, r.name] as const));

    const rows: RegionalShortageRow[] = [];
    for (const [regionId, offers] of demandByRegion.entries()) {
      if (offers < t.DEMAND_LEVEL) continue;
      const candidates = candidateCounts.get(regionId) ?? 0;
      rows.push({
        regionId,
        regionName: regionNames.get(regionId) ?? regionId,
        offers,
        availableCandidates: candidates,
        offersPerCandidate: candidates > 0 ? round1(offers / candidates) : null,
        shortageLevel: candidates === 0 ? 'HIGH' : offers / candidates >= 2 ? 'HIGH' : offers / candidates >= 1 ? 'MODERATE' : 'LOW',
      });
    }
    return rows.sort((a, b) => b.offers - a.offers);
  }

  // ==========================================================================
  // INTERNALS
  // ==========================================================================

  /** One bounded fetch covering current + previous windows. */
  private async fetchOffers(
    query: AggregationQuery,
    since: Date,
  ) {
    // Worker-level filters are combined into ONE object — separate `worker:`
    // keys would silently overwrite each other.
    const workerWhere: Record<string, unknown> = {};
    if (query.profession) {
      workerWhere['primaryTrade'] = { equals: query.profession, mode: 'insensitive' };
    }
    if (query.regionId) workerWhere['regionId'] = query.regionId;
    if (query.skillSlugs?.length) {
      workerWhere['skills'] = { some: { skill: { slug: { in: query.skillSlugs } } } };
    }
    if (query.experienceMin !== undefined || query.experienceMax !== undefined) {
      workerWhere['yearsOfExperience'] = {
        ...(query.experienceMin !== undefined ? { gte: query.experienceMin } : {}),
        ...(query.experienceMax !== undefined ? { lte: query.experienceMax } : {}),
      };
    }

    return this.prisma.offer.findMany({
      where: {
        status: { in: [...MARKET_ACTIVE_STATUSES] as any[] },
        submittedAt: { gte: since },
        ...(Object.keys(workerWhere).length > 0 ? { worker: workerWhere } : {}),
      },
      select: {
        id: true,
        workerId: true,
        employerId: true,
        status: true,
        submittedAt: true,
        acceptedAt: true,
        worker: {
          select: {
            primaryTrade: true,
            yearsOfExperience: true,
            regionId: true,
            region: { select: { id: true, name: true } },
          },
        },
        currentVersion: {
          select: {
            salaryMax: true,
            salaryPeriod: true,
            companyVehicle: true,
            toolsProvided: true,
            phoneProvided: true,
            trainingBudget: true,
            pensionContributionPct: true,
            travelAllowanceValue: true,
            remoteWorkPct: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: MAX_OFFERS_PER_QUERY,
    });
  }

  /** Map of workerId → skill slugs for the given offers (one query). */
  private async workerSkillsBySlug(
    offers: Array<{ workerId: string }>,
  ): Promise<Map<string, string[]>> {
    const workerIds = [...new Set(offers.map((o) => o.workerId))];
    if (workerIds.length === 0) return new Map();
    const rows = await this.prisma.profileSkill.findMany({
      where: { profileId: { in: workerIds } },
      select: { profileId: true, skill: { select: { slug: true } } },
    });
    const map = new Map<string, string[]>();
    for (const row of rows) {
      if (!row.skill?.slug) continue;
      const list = map.get(row.profileId) ?? [];
      list.push(row.skill.slug);
      map.set(row.profileId, list);
    }
    return map;
  }

  private benefitPrevalence(
    offers: Array<{ currentVersion: Record<string, unknown> | null }>,
  ): BenefitStats['prevalence'] {
    const n = offers.length || 1;
    const count = (pred: (v: any) => boolean) =>
      round1((offers.filter((o) => o.currentVersion && pred(o.currentVersion)).length / n) * 100);
    return {
      vehicle: count((v) => v.companyVehicle && v.companyVehicle !== 'NONE'),
      tools: count((v) => v.toolsProvided === true),
      phone: count((v) => v.phoneProvided === true),
      trainingBudget: count((v) => (v.trainingBudget ?? 0) > 0),
      pension: count((v) => (v.pensionContributionPct ?? 0) > 0),
      travel: count((v) => (v.travelAllowanceValue ?? 0) > 0),
      remote: count((v) => (v.remoteWorkPct ?? 0) > 0),
    };
  }
}