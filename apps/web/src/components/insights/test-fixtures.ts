// Shared fixtures for the insights component tests.
// Lives outside the *.test.tsx files so suites don't import each other
// (importing a test file would re-run its suites inside the importer).
import type { MarketValueIndicator } from '@/lib/api';

export function makeMarketValue(overrides: Partial<MarketValueIndicator> = {}): MarketValueIndicator {
  return {
    scorePct: 56,
    maxScore: 100,
    components: [
      { key: 'EXPERIENCE', points: 15, maxPoints: 25, detail: { years: 5 }, explanationKey: 'MARKET_VALUE.EXPERIENCE_BAND', explanationParams: { years: 5, points: 15 } },
      { key: 'SKILLS', points: 20, maxPoints: 25, detail: { skillCount: 4 }, explanationKey: 'MARKET_VALUE.SKILLS_COUNT', explanationParams: { count: 4, points: 20 } },
      { key: 'CERTIFICATIONS', points: 15, maxPoints: 15, detail: { certCount: 2 }, explanationKey: 'MARKET_VALUE.CERTS_COUNT', explanationParams: { count: 2, points: 15 } },
      { key: 'DEMAND', points: 0, maxPoints: 20, detail: { level: null, offers: 0 }, explanationKey: 'MARKET_VALUE.DEMAND_UNKNOWN', explanationParams: { offers: 0, points: 0 } },
      { key: 'COMPARABLE_OFFERS', points: 6, maxPoints: 15, detail: { offersReceived: 2 }, explanationKey: 'MARKET_VALUE.OFFERS_COUNT', explanationParams: { count: 2, points: 6 } },
    ],
    salaryPercentile: { available: false, reason: 'INSUFFICIENT_DATA', sampleSize: 0 },
    ...overrides,
  };
}