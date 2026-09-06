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