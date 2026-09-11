import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InsightsConfigService } from './insights-config.service';
import {
  DEMAND_BUCKETS,
  annualizeSalary,
  median,
  percentile,
  round1,
} from './insights-settings';

/**
 * Market intelligence computation for Insights.
 *
 * Everything in here is computed from Offermarket's own marketplace data
 * (data class OFFERMARKT) and every statistic is gated by the sample-size
 * rules in insights-settings.ts — when the sample is too small the field
 * comes back as { available: false, reason: 'INSUFFICIENT_DATA', ... }
 * instead of a number. We never invent data; we never show a weakly
 * supported number as fact.
 *
 * MVP computes on read over the trailing windows. When this gets hot, the
 * same computations move into the nightly MarketSnapshot engine (the table
 * already exists); the API contract does not change.
 */

/** Offer statuses that count as genuine market activity (drafts/withdrawn do not). */
const MARKET_ACTIVE_STATUSES = [
  'SUBMITTED',
  'VIEWED',
  'SHORTLISTED',
  'ACCEPTED',
  'REJECTED',
  'COUNTERED',
  'EXPIRED',
];

/** Annualization: month salaries ×12; hourly offers are excluded from salary stats. */
const annualizeSalaryMax = annualizeSalary;

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

export interface MarketValueComponent {
  key: 'EXPERIENCE' | 'SKILLS' | 'CERTIFICATIONS' | 'DEMAND' | 'COMPARABLE_OFFERS';
  points: number;
  maxPoints: number;
  detail: Record<string, unknown>;
  /** i18n key explaining WHY this component scored what it scored */
  explanationKey: string;
  explanationParams: Record<string, string | number>;
}

export interface MarketValueIndicator {
  scorePct: number;
  maxScore: number;
  components: MarketValueComponent[];
  /**
   * Where the worker's desired salary sits in the comparable-offers
   * distribution (0–100 percentile) — only when the comparable sample clears
   * the salary minimum, never estimated from small samples.
   */
  salaryPercentile: GatedValue<{ percentile: number }>;
}

export interface WorkerMarketOverview {
  profile: {
    profession: string | null;
    regionName: string | null;
    regionId: string | null;
    yearsOfExperience: number | null;
    skills: string[];
    certifications: string[];
  };
  scopeUsed: 'city' | 'province' | 'country' | null;
  scopeNote: string | null;
  demand: GatedValue<{ level: string; offers: number }>;
  salaryRange: GatedValue<{ p25: number; p75: number; currency: string }>;
  salaryTrend: GatedValue<{ changePct: number; direction: 'up' | 'down' | 'stable' }>;
  mostValuableSkills: GatedValue<Array<{ skill: string; premiumPct: number }>>;
  relevantEmployers: GatedValue<{ count: number }>;
  relevantOffers: GatedValue<{ count: number }>;
  recentChanges: Array<{ metric: string; change: number; direction: 'up' | 'down' | 'stable' }>;
  marketValue: MarketValueIndicator;
}

export interface EmployerMarketView {
  profession: string | null;
  hiringDifficulty: GatedValue<{ level: string; candidatesPerOffer: number | null }>;
  salaryCompetitiveness: GatedValue<{ yourMedian: number | null; marketMedian: number | null; position: 'above' | 'at' | 'below' | 'unknown' }>;
  demandByRegion: GatedValue<Array<{ regionName: string; offers: number }>>;
  candidateAvailability: GatedValue<{ count: number }>;
  competitorOfferRanges: GatedValue<{ p25: number; p50: number; p75: number; employersInCohort: number }>;
  timeToHire: GatedValue<{ medianDays: number }>;
  offerAcceptanceRate: GatedValue<{ ratePct: number; sampleSize: number }>;
}

@Injectable()
export class InsightsStatsService {
  private readonly logger = new Logger(InsightsStatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: InsightsConfigService,
  ) {}

  /**
   * Personalized market overview for a worker. Uses their profession, region,
   * experience, skills and certifications — computed only from real submitted
   * offers in the trailing windows.
   */
  async getWorkerMarketOverview(userId: string): Promise<WorkerMarketOverview> {
    const worker = await this.prisma.worker.findUnique({
      where: { userId },
      include: {
        region: true,
        skills: { include: { skill: true } },
        certifications: { where: { verificationStatus: 'VERIFIED' } },
      },
    });

    if (!worker) {
      return this.emptyOverview(undefined);
    }

    const profession = worker.primaryTrade;
    const overview = this.emptyOverview({
      profession,
      regionName: worker.region?.name ?? null,
      regionId: worker.regionId,
      yearsOfExperience: worker.yearsOfExperience,
      skills: worker.skills.map((s) => s.skill?.name ?? s.skillId).filter(Boolean),
      certifications: worker.certifications.map((c) => c.name),
    });

    if (!profession) {
      // No profession on the profile — nothing personalizable yet.
      return overview;
    }

    const t = await this.config.getThresholds();
    // One bounded query covers both windows and every geographic scope: we
    // fetch the trade's offers over 2× the window and slice in memory.
    const windowStart = new Date(Date.now() - 2 * t.WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const offers = await this.prisma.offer.findMany({
      where: {
        status: { in: MARKET_ACTIVE_STATUSES as any[] },
        submittedAt: { gte: windowStart },
        worker: { primaryTrade: { equals: profession, mode: 'insensitive' } },
      },
      select: {
        id: true,
        workerId: true,
        employerId: true,
        submittedAt: true,
        acceptedAt: true,
        worker: { select: { regionId: true, region: { select: { id: true, parentId: true, name: true } } } },
        currentVersion: { select: { salaryMax: true, salaryPeriod: true } },
      },
    });

    const currentStart = new Date(Date.now() - t.WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const inCurrent = offers.filter((o) => o.submittedAt && o.submittedAt >= currentStart);
    const inPrevious = offers.filter((o) => o.submittedAt && o.submittedAt < currentStart);

    // Geographic fallback ladder: worker's city → its province → country.
    const workerRegionId = worker.regionId ?? null;
    const workerRegionParentId = worker.region?.parentId ?? null;
    const scopes = [
      { level: 'city' as const, match: (o: (typeof offers)[number]) => o.worker?.regionId === workerRegionId },
      {
        level: 'province' as const,
        match: (o: (typeof offers)[number]) =>
          o.worker?.regionId === workerRegionId || o.worker?.region?.parentId === workerRegionParentId,
      },
      { level: 'country' as const, match: () => true },
    ];

    let scopeUsed: 'city' | 'province' | 'country' = 'country';
    let scopedCurrent = inCurrent;
    for (const scope of scopes) {
      const sample = inCurrent.filter(scope.match);
      // A scope qualifies when it can support the heaviest stat we show (salary).
      if (sample.length >= t.DEMAND_LEVEL) {
        scopeUsed = scope.level;
        scopedCurrent = sample;
        break;
      }
      scopeUsed = scope.level;
      scopedCurrent = sample;
      // Fall through to the next (wider) scope.
    }

    overview.scopeUsed = scopeUsed;
    if (scopeUsed !== 'city') {
      overview.scopeNote =
        scopeUsed === 'province'
          ? 'Local sample too small — showing regional data.'
          : scopeUsed === 'country'
            ? 'Local and regional samples too small — showing national data.'
            : null;
    }

    // Demand level
    overview.demand = this.classifyDemand(scopedCurrent.length, t.DEMAND_LEVEL);

    // Salary range (P25–P75 of annualized salaryMax)
    const salaries = scopedCurrent
      .map((o) => annualizeSalaryMax(o.currentVersion))
      .filter((v): v is number => v !== null);
    overview.salaryRange = {
      ...gated(
        {
          p25: Math.round(percentile(salaries, 0.25) ?? 0),
          p75: Math.round(percentile(salaries, 0.75) ?? 0),
          currency: 'EUR',
        },
        salaries.length,
        t.SALARY_RANGE,
      ),
    };

    // Salary trend: median(current window) vs median(previous window)
    const prevSalaries = inPrevious
      .map((o) => annualizeSalaryMax(o.currentVersion))
      .filter((v): v is number => v !== null);
    const curMedian = median(salaries);
    const prevMedian = median(prevSalaries);
    if (curMedian && prevMedian && salaries.length + prevSalaries.length >= t.SALARY_TREND) {
      const changePct = round1(((curMedian - prevMedian) / prevMedian) * 100);
      overview.salaryTrend = {
        available: true,
        value: {
          changePct: round1(changePct),
          direction: changePct > 1 ? 'up' : changePct < -1 ? 'down' : 'stable',
        },
        sampleSize: salaries.length + prevSalaries.length,
      };
    } else {
      overview.salaryTrend = {
        available: false,
        reason: 'INSUFFICIENT_DATA',
        sampleSize: salaries.length + prevSalaries.length,
      };
    }

    // Most valuable skills: skills on the receiving workers, ranked by salary
    // premium vs the overall median; requires the configured skill minimum.
    const overallMedian = curMedian;
    const scopedWorkerProfileIds = [
      ...new Set(scopedCurrent.map((o) => o.workerId).filter(Boolean) as string[]),
    ];
    const profileSkills = await this.prisma.profileSkill.findMany({
      where: { profileId: { in: scopedWorkerProfileIds } },
      select: { profileId: true, skill: { select: { name: true } } },
    });
    const skillsByProfile = new Map<string, string[]>();
    for (const ps of profileSkills) {
      const list = skillsByProfile.get(ps.profileId) ?? [];
      list.push(ps.skill?.name ?? ps.profileId);
      skillsByProfile.set(ps.profileId, list);
    }
    const skillAgg = new Map<string, number[]>();
    for (const offer of scopedCurrent) {
      const salary = annualizeSalaryMax(offer.currentVersion);
      if (salary === null) continue;
      const skills = skillsByProfile.get(offer.workerId) ?? [];
      for (const skill of skills) {
        const list = skillAgg.get(skill) ?? [];
        list.push(salary);
        skillAgg.set(skill, list);
      }
    }
    const valuable = [...skillAgg.entries()]
      .filter(([, sals]) => sals.length >= t.MOST_VALUABLE_SKILLS)
      .map(([skill, sals]) => ({
        skill,
        premiumPct: round1(((median(sals)! - (overallMedian ?? median(sals)!)) / (overallMedian ?? median(sals)!)) * 100),
      }))
      .sort((a, b) => b.premiumPct - a.premiumPct)
      .slice(0, 5);
    const skillOfferCount = [...skillAgg.values()].reduce((sum, sals) => sum + sals.length, 0);
    overview.mostValuableSkills = {
      ...gated(valuable, skillOfferCount, t.MOST_VALUABLE_SKILLS),
    };

    // Employers & offers
    const employerCount = new Set(scopedCurrent.map((o) => o.employerId)).size;
    overview.relevantEmployers = gated({ count: employerCount }, employerCount, t.DEMAND_LEVEL);
    overview.relevantOffers = gated(
      { count: scopedCurrent.length },
      scopedCurrent.length,
      t.DEMAND_LEVEL,
    );

    // Recent market changes: deltas vs the previous window.
    const changes: WorkerMarketOverview['recentChanges'] = [];
    const prevEmployerCount = new Set(inPrevious.map((o) => o.employerId)).size;
    const demandChange = scopedCurrent.length - inPrevious.length;
    if (Math.abs(demandChange) > 0) {
      changes.push({
        metric: 'offers',
        change: demandChange,
        direction: demandChange > 0 ? 'up' : 'down',
      });
    }
    const employerChange = employerCount - prevEmployerCount;
    if (Math.abs(employerChange) > 0) {
      changes.push({
        metric: 'employers',
        change: employerChange,
        direction: employerChange > 0 ? 'up' : 'down',
      });
    }
    overview.recentChanges = changes;

    // Explainable market-value indicator (P5): a transparent points rubric
    // over the worker's own inputs plus the sample-gated market aggregates.
    // No black box — every component carries its points, its raw inputs and an
    // i18n explanation key, so the UI can always answer "why is this my score".
    overview.marketValue = await this.computeMarketValue({
      worker,
      marketSalaries: salaries,
      demand: overview.demand,
      thresholds: t,
    });

    return overview;
  }

  /**
   * Transparent market-value rubric (max 100 points):
   *   EXPERIENCE 25 · SKILLS 25 · DEMAND 20 · CERTIFICATIONS 15 ·
   *   COMPARABLE_OFFERS 15 (how sought-after the worker currently is)
   * Every component exposes its raw inputs; the salaryPercentile is computed
   * only when the comparable-offer sample clears the salary minimum.
   */
  private async computeMarketValue(args: {
    worker: {
      yearsOfExperience: number | null;
      skills: Array<{ isVerified: boolean }>;
      certifications: Array<unknown>;
      id: string;
      desiredSalaryMax: number | null;
    };
    marketSalaries: number[];
    demand: GatedValue<{ level: string; offers: number }>;
    thresholds: { SALARY_RANGE: number; WINDOW_DAYS: number };
  }): Promise<MarketValueIndicator> {
    const { worker, marketSalaries, demand, thresholds } = args;
    const components: MarketValueComponent[] = [];

    // EXPERIENCE (25): the worker's own years — never estimated.
    const years = worker.yearsOfExperience ?? null;
    const expPoints = years === null ? 0 : years >= 11 ? 25 : years >= 6 ? 22 : years >= 3 ? 15 : 8;
    components.push({
      key: 'EXPERIENCE',
      points: expPoints,
      maxPoints: 25,
      detail: { years },
      explanationKey: years === null ? 'MARKET_VALUE.EXPERIENCE_UNKNOWN' : 'MARKET_VALUE.EXPERIENCE_BAND',
      explanationParams: { years: years ?? 0, points: expPoints },
    });

    // SKILLS (25): 5 points per profile skill, capped.
    const skillCount = worker.skills.length;
    const skillPoints = Math.min(25, skillCount * 5);
    components.push({
      key: 'SKILLS',
      points: skillPoints,
      maxPoints: 25,
      detail: { skillCount },
      explanationKey: 'MARKET_VALUE.SKILLS_COUNT',
      explanationParams: { count: skillCount, points: skillPoints },
    });

    // CERTIFICATIONS (15): 7.5 per verified certification, capped.
    const certCount = worker.certifications.length;
    const certPoints = Math.min(15, certCount * 7.5);
    components.push({
      key: 'CERTIFICATIONS',
      points: certPoints,
      maxPoints: 15,
      detail: { certCount },
      explanationKey: certCount === 0 ? 'MARKET_VALUE.CERTS_NONE' : 'MARKET_VALUE.CERTS_COUNT',
      explanationParams: { count: certCount, points: certPoints },
    });

    // DEMAND (20): the (already sample-gated) demand classification for the
    // scope that was actually used — insufficient data scores 0 and says so.
    const demandLevel = demand.available ? demand.value!.level : null;
    const demandPoints =
      demandLevel === 'VERY_HIGH' ? 20 : demandLevel === 'HIGH' ? 15 : demandLevel === 'MODERATE' ? 10 : demandLevel === 'LOW' ? 5 : 0;
    components.push({
      key: 'DEMAND',
      points: demandPoints,
      maxPoints: 20,
      detail: { level: demandLevel, offers: demand.sampleSize ?? 0 },
      explanationKey: demandLevel ? `MARKET_VALUE.DEMAND_${demandLevel}` : 'MARKET_VALUE.DEMAND_UNKNOWN',
      explanationParams: { offers: demand.sampleSize ?? 0, points: demandPoints },
    });

    // COMPARABLE_OFFERS (15): how sought-after the worker is — real offers
    // received in the window. Personal data, so no aggregation gate applies.
    const windowStart = new Date(Date.now() - thresholds.WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const offersReceived = await this.prisma.offer.count({
      where: {
        workerId: worker.id,
        status: { in: MARKET_ACTIVE_STATUSES as any[] },
        submittedAt: { gte: windowStart },
      },
    });
    const offerPoints = Math.min(15, (offersReceived ?? 0) * 3);
    components.push({
      key: 'COMPARABLE_OFFERS',
      points: offerPoints,
      maxPoints: 15,
      detail: { offersReceived },
      explanationKey: offersReceived === 0 ? 'MARKET_VALUE.OFFERS_NONE' : 'MARKET_VALUE.OFFERS_COUNT',
      explanationParams: { count: offersReceived, points: offerPoints },
    });

    // Salary percentile: where the worker's desired salary sits inside the
    // comparable-offers distribution — only with a real sample.
    const scorePct = components.reduce((sum, c) => sum + c.points, 0);
    let salaryPercentile: MarketValueIndicator['salaryPercentile'] = {
      available: false,
      reason: 'INSUFFICIENT_DATA',
      sampleSize: marketSalaries.length,
    };
    if (marketSalaries.length >= thresholds.SALARY_RANGE && worker.desiredSalaryMax) {
      const below = marketSalaries.filter((s) => s <= worker.desiredSalaryMax!).length;
      salaryPercentile = {
        available: true,
        value: { percentile: Math.round((below / marketSalaries.length) * 100) },
        sampleSize: marketSalaries.length,
      };
    }

    return { scorePct, maxScore: 100, components, salaryPercentile };
  }

  /** Generic (anonymous) market teaser — only counts that stand on their own. */
  async getMarketPreview(profession?: string) {
    const t = await this.config.getThresholds();
    const currentStart = new Date(Date.now() - t.WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const count = await this.prisma.offer.count({
      where: {
        status: { in: MARKET_ACTIVE_STATUSES as any[] },
        submittedAt: { gte: currentStart },
        ...(profession
          ? { worker: { primaryTrade: { equals: profession, mode: 'insensitive' } } }
          : {}),
      },
    });
    return {
      profession: profession ?? null,
      periodDays: t.WINDOW_DAYS,
      offers: count,
      salaryAvailable: count >= t.SALARY_RANGE,
      dataClass: 'OFFERMARKT' as const,
    };
  }

  /**
   * Employer intelligence. Cohort aggregates only — never exposes any
   * individual employer's or worker's confidential information, and every
   * cohort number is gated by EMPLOYER_COHORT / TIME_TO_HIRE sample rules.
   */
  async getEmployerMarketView(userId: string): Promise<EmployerMarketView> {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) {
      return this.emptyEmployerView(null);
    }

    // The employer's dominant hiring trade = most common primaryTrade among
    // the workers they send offers to.
    const theirOffers = await this.prisma.offer.findMany({
      where: { employerId: employer.id, status: { notIn: ['DRAFT', 'WITHDRAWN'] as any[] } },
      select: {
        worker: { select: { primaryTrade: true } },
        submittedAt: true,
        acceptedAt: true,
        currentVersion: { select: { salaryMax: true, salaryPeriod: true } },
      },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });
    const tradeCounts = new Map<string, number>();
    for (const o of theirOffers) {
      const trade = o.worker?.primaryTrade;
      if (trade) tradeCounts.set(trade, (tradeCounts.get(trade) ?? 0) + 1);
    }
    const profession =
      [...tradeCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    if (!profession) return this.emptyEmployerView(null);

    const view = this.emptyEmployerView(profession);

    const t = await this.config.getThresholds();
    const windowStart = new Date(Date.now() - t.WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const marketOffers = await this.prisma.offer.findMany({
      where: {
        status: { in: MARKET_ACTIVE_STATUSES as any[] },
        submittedAt: { gte: windowStart },
        worker: { primaryTrade: { equals: profession, mode: 'insensitive' } },
      },
      select: {
        employerId: true,
        submittedAt: true,
        acceptedAt: true,
        worker: { select: { region: { select: { name: true } } } },
        currentVersion: { select: { salaryMax: true, salaryPeriod: true } },
      },
    });

    // Hiring difficulty: candidates available per active offer in the trade.
    const candidateCount = await this.prisma.worker.count({
      where: {
        primaryTrade: { equals: profession, mode: 'insensitive' },
        availability: { not: 'NOT_AVAILABLE' },
        profileVisibility: { in: ['ALL_VERIFIED', 'SELECTED_COMPANIES'] },
      },
    });
    const offersInWindow = marketOffers.length;
    const candidatesPerOffer = offersInWindow > 0 ? round1(candidateCount / offersInWindow) : null;
    view.hiringDifficulty = {
      ...gated(
        {
          level:
            candidateCount < 10
              ? 'VERY_HARD'
              : candidateCount < 30
                ? 'HARD'
                : candidateCount < 80
                  ? 'MODERATE'
                  : 'EASY',
          candidatesPerOffer,
        },
        offersInWindow,
        t.DEMAND_LEVEL,
      ),
    };

    // Salary competitiveness: the employer's own median vs market median.
    const theirSalaries = theirOffers
      .map((o) => annualizeSalaryMax(o.currentVersion))
      .filter((v): v is number => v !== null);
    const marketSalaries = marketOffers
      .map((o) => annualizeSalaryMax(o.currentVersion))
      .filter((v): v is number => v !== null);
    const marketMedian = median(marketSalaries);
    const yourMedian = median(theirSalaries);
    if (
      marketMedian !== null &&
      theirSalaries.length > 0 &&
      marketSalaries.length >= t.SALARY_RANGE &&
      new Set(marketOffers.map((o) => o.employerId)).size >= t.EMPLOYER_COHORT
    ) {
      const yourMedianValue = yourMedian;
      view.salaryCompetitiveness = {
        available: true,
        value: {
          yourMedian: yourMedianValue,
          marketMedian,
          position:
            yourMedianValue === null
              ? 'unknown'
              : yourMedianValue > marketMedian * 1.02
                ? 'above'
                : yourMedianValue < marketMedian * 0.98
                  ? 'below'
                  : 'at',
        },
        sampleSize: marketSalaries.length,
      };
    } else {
      view.salaryCompetitiveness = {
        available: false,
        reason: 'INSUFFICIENT_DATA',
        sampleSize: marketSalaries.length,
      };
    }

    // Demand by region (top 5, city-level regions only)
    const byRegion = new Map<string, number>();
    for (const o of marketOffers) {
      const name = o.worker?.region?.name;
      if (name) byRegion.set(name, (byRegion.get(name) ?? 0) + 1);
    }
    view.demandByRegion = {
      ...gated(
        [...byRegion.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([regionName, offerCount]) => ({ regionName, offers: offerCount })),
        marketOffers.length,
        t.DEMAND_LEVEL,
      ),
    };

    // Candidate availability
    view.candidateAvailability = gated({ count: candidateCount }, candidateCount, t.DEMAND_LEVEL);

    // Competitor offer ranges (cohort-gated)
    const employersInCohort = new Set(marketOffers.map((o) => o.employerId)).size;
    if (employersInCohort >= t.EMPLOYER_COHORT && marketSalaries.length >= t.SALARY_RANGE) {
      view.competitorOfferRanges = {
        available: true,
        value: {
          p25: Math.round(percentile(marketSalaries, 0.25) ?? 0),
          p50: Math.round(percentile(marketSalaries, 0.5) ?? 0),
          p75: Math.round(percentile(marketSalaries, 0.75) ?? 0),
          employersInCohort,
        },
        sampleSize: marketSalaries.length,
      };
    } else {
      view.competitorOfferRanges = {
        available: false,
        reason: 'INSUFFICIENT_DATA',
        sampleSize: marketSalaries.length,
      };
    }

    // Time-to-hire: median days submitted → accepted (accepted offers only).
    const hireDurations = marketOffers
      .filter((o) => o.acceptedAt && o.submittedAt)
      .map((o) => (o.acceptedAt!.getTime() - o.submittedAt!.getTime()) / (24 * 60 * 60 * 1000));
    view.timeToHire = gated(
      { medianDays: Math.round(median(hireDurations) ?? 0) },
      hireDurations.length,
      t.TIME_TO_HIRE,
    );

    // Offer acceptance rate for the cohort (not this employer — no confidential exposure).
    const acceptedCount = marketOffers.filter((o) => o.acceptedAt).length;
    view.offerAcceptanceRate = gated(
      { ratePct: round1((acceptedCount / marketOffers.length) * 100), sampleSize: marketOffers.length },
      marketOffers.length,
      t.TIME_TO_HIRE,
    );

    return view;
  }

  private emptyOverview(profile?: WorkerMarketOverview['profile']): WorkerMarketOverview {
    const insufficient = <T,>(n = 0): GatedValue<T> => ({
      available: false,
      reason: 'INSUFFICIENT_DATA',
      sampleSize: n,
    });
    return {
      profile: profile ?? {
        profession: null,
        regionName: null,
        regionId: null,
        yearsOfExperience: null,
        skills: [],
        certifications: [],
      },
      scopeUsed: null,
      scopeNote: null,
      demand: insufficient(),
      salaryRange: insufficient(),
      salaryTrend: insufficient(),
      mostValuableSkills: insufficient(),
      relevantEmployers: insufficient(),
      relevantOffers: insufficient(),
      recentChanges: [],
      marketValue: {
        scorePct: 0,
        maxScore: 100,
        components: [],
        salaryPercentile: insufficient(),
      },
    };
  }

  private emptyEmployerView(profession: string | null): EmployerMarketView {
    const insufficient = <T,>(): GatedValue<T> => ({
      available: false,
      reason: 'INSUFFICIENT_DATA',
    });
    return {
      profession,
      hiringDifficulty: insufficient(),
      salaryCompetitiveness: insufficient(),
      demandByRegion: insufficient(),
      candidateAvailability: insufficient(),
      competitorOfferRanges: insufficient(),
      timeToHire: insufficient(),
      offerAcceptanceRate: insufficient(),
    };
  }

  private classifyDemand(offers: number, minDemand: number): GatedValue<{ level: string; offers: number }> {
    const bucket = DEMAND_BUCKETS.find((b) => offers >= Math.max(b.min, minDemand));
    if (!bucket) return { available: false, reason: 'INSUFFICIENT_DATA', sampleSize: offers };
    return { available: true, value: { level: bucket.level, offers }, sampleSize: offers };
  }
}