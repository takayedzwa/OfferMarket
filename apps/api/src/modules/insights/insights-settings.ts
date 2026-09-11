/**
 * Offermarket Insights — sample-size and integrity rules.
 *
 * The core editorial contract: we never show a number the data cannot support.
 * Every statistic below carries a minimum sample; when the sample is smaller,
 * the API returns an explicit INSUFFICIENT_DATA state instead of a value and
 * the UI renders an "insufficient data" state — never a guess.
 *
 * These are deliberately conservative MVP defaults so nothing can be published
 * that can't be defended; loosen them in one place as the marketplace grows.
 * (See docs/insights-architecture.md §12.)
 */

export const SAMPLE_SIZES = {
  /** P25–P75 salary range requires this many relevant offers */
  SALARY_RANGE: 30,
  /** Salary trend (% change between two windows) requires this many offers across both */
  SALARY_TREND: 60,
  /** Demand level classification requires this many offers in the 90-day window */
  DEMAND_LEVEL: 5,
  /** A skill may appear in "most valuable skills" only with this many matching offers */
  MOST_VALUABLE_SKILLS: 10,
  /** Employer-facing cohort aggregates require this many distinct employers */
  EMPLOYER_COHORT: 8,
  /** Time-to-hire benchmark requires this many completed (accepted) offers */
  TIME_TO_HIRE: 20,
  /** An article whose dataClass != EDITORIAL must declare at least this sampleSize to publish */
  MIN_ARTICLE_SAMPLE: 30,
} as const;

/** 90-day demand window; the salary trend compares the trailing window to the one before it. */
export const MARKET_WINDOWS = {
  /** days in the "current" window */
  CURRENT_DAYS: 90,
  /** days in the comparison window (immediately precedes CURRENT_DAYS) */
  PREVIOUS_DAYS: 90,
} as const;

/** Demand classification buckets (offers in the current window). */
export const DEMAND_BUCKETS = [
  { min: 100, level: 'VERY_HIGH' },
  { min: 50, level: 'HIGH' },
  { min: 20, level: 'MODERATE' },
  { min: SAMPLE_SIZES.DEMAND_LEVEL, level: 'LOW' },
] as const;

/**
 * Geographic fallback ladder. When a worker's own region lacks the minimum
 * sample, we widen the scope — and always report which scope was used so the
 * number is never presented more precisely than it is.
 */
export const REGION_FALLBACK_LEVELS = ['city', 'province', 'country'] as const;
export type RegionFallbackLevel = (typeof REGION_FALLBACK_LEVELS)[number];

/** Cap on notification fan-out per published insight (protects the outbox). */
export const MAX_PUBLISH_FANOUT = 500;

/** Percentile helpers over a numeric sample. */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function median(values: number[]): number | null {
  return percentile(values, 0.5);
}

/** Round to at most one decimal — the precision we display in trends. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * The full threshold surface. Everything here is admin-configurable at runtime
 * (AdminSettings key `insights.thresholds`, see insights-config.service.ts);
 * SAMPLE_SIZES / MARKET_WINDOWS above are the typed fallback defaults so the
 * system behaves identically before an admin has ever touched the settings.
 * These are "engine-level" values used by the aggregation/snapshot services.
 */
export type InsightsThresholds = {
  SALARY_RANGE: number;
  SALARY_TREND: number;
  DEMAND_LEVEL: number;
  MOST_VALUABLE_SKILLS: number;
  EMPLOYER_COHORT: number;
  TIME_TO_HIRE: number;
  MIN_ARTICLE_SAMPLE: number;
  /** aggregation window in days (current period) */
  WINDOW_DAYS: number;
  /** snapshot retention: snapshots older than this many days are pruned */
  SNAPSHOT_RETENTION_DAYS: number;
};

export const DEFAULT_THRESHOLDS: InsightsThresholds = {
  SALARY_RANGE: SAMPLE_SIZES.SALARY_RANGE,
  SALARY_TREND: SAMPLE_SIZES.SALARY_TREND,
  DEMAND_LEVEL: SAMPLE_SIZES.DEMAND_LEVEL,
  MOST_VALUABLE_SKILLS: SAMPLE_SIZES.MOST_VALUABLE_SKILLS,
  EMPLOYER_COHORT: SAMPLE_SIZES.EMPLOYER_COHORT,
  TIME_TO_HIRE: SAMPLE_SIZES.TIME_TO_HIRE,
  MIN_ARTICLE_SAMPLE: SAMPLE_SIZES.MIN_ARTICLE_SAMPLE,
  WINDOW_DAYS: MARKET_WINDOWS.CURRENT_DAYS,
  SNAPSHOT_RETENTION_DAYS: 730,
};

/**
 * Auto-draft insights generator configuration (AdminSettings key
 * `insights.generator`). Generated drafts are ALWAYS DRAFT — a human reviews
 * before anything is published.
 */
export type InsightsGeneratorConfig = {
  enabled: boolean;
  /** publish a salary-change draft when |Δ%| between month windows ≥ this */
  salaryChangePct: number;
  /** publish a demand-growth draft when skill offer growth ≥ this % */
  demandGrowthPct: number;
  /** benefit-vs-acceptance draft: minimum offers in each cohort */
  benefitMinSample: number;
  /** benefit draft: minimum acceptance-rate gap in percentage points */
  benefitMinGapPct: number;
};

export const DEFAULT_GENERATOR_CONFIG: InsightsGeneratorConfig = {
  enabled: true,
  salaryChangePct: 3,
  demandGrowthPct: 15,
  benefitMinSample: 20,
  benefitMinGapPct: 5,
};

/**
 * Methodology version of the aggregation engine. Every snapshot and generated
 * article records this; when a calculation changes materially, bump it so old
 * numbers can always be traced to the exact method that produced them.
 */
export const METHOD_VERSION = 1 as const;

/**
 * Annualizes an OfferVersion salary to a yearly figure. Monthly ×12; hourly
 * and unknown periods are excluded from salary statistics (never guessed).
 */
export function annualizeSalary(version: { salaryMax: number; salaryPeriod: string } | null): number | null {
  if (!version) return null;
  if (version.salaryPeriod === 'year') return version.salaryMax;
  if (version.salaryPeriod === 'month') return version.salaryMax * 12;
  return null;
}