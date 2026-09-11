import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DEFAULT_GENERATOR_CONFIG,
  DEFAULT_THRESHOLDS,
  InsightsGeneratorConfig,
  InsightsThresholds,
} from './insights-settings';

/**
 * Runtime-configurable integrity thresholds and generator settings.
 *
 * Stored as JSON in AdminSettings (one row per key, category 'insights') —
 * the same pattern the referral program uses — so administrators can tighten
 * or loosen sample-size rules and generation triggers without a deploy.
 *
 * The DEFAULT_* constants in insights-settings.ts are the typed fallbacks:
 * if no settings row exists (or a field is missing) the engine behaves exactly
 * as it does with the built-in conservative defaults. A short-lived in-memory
 * cache keeps the per-request DB cost at zero while still picking up admin
 * edits within a minute.
 */

export const THRESHOLDS_SETTINGS_KEY = 'insights.thresholds';
export const GENERATOR_SETTINGS_KEY = 'insights.generator';
const CACHE_TTL_MS = 60_000;

@Injectable()
export class InsightsConfigService {
  private readonly logger = new Logger(InsightsConfigService.name);
  private thresholdsCache: { value: InsightsThresholds; loadedAt: number } | null = null;
  private generatorCache: { value: InsightsGeneratorConfig; loadedAt: number } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Effective thresholds: DB override merged over the typed defaults. */
  async getThresholds(): Promise<InsightsThresholds> {
    const cached = this.thresholdsCache;
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached.value;

    let value = { ...DEFAULT_THRESHOLDS };
    try {
      const row = await this.prisma.adminSettings.findUnique({ where: { key: THRESHOLDS_SETTINGS_KEY } });
      if (row && row.value && typeof row.value === 'object') {
        for (const [key, def] of Object.entries(DEFAULT_THRESHOLDS)) {
          const override = (row.value as Record<string, unknown>)[key];
          // Only positive finite numbers are honored; a bad override must never
          // weaken integrity (falls back to the default instead).
          if (typeof override === 'number' && Number.isFinite(override) && override >= 0) {
            (value as any)[key] = override;
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to load insights thresholds, using defaults: ${(err as Error).message}`);
    }
    this.thresholdsCache = { value, loadedAt: Date.now() };
    return value;
  }

  async getGeneratorConfig(): Promise<InsightsGeneratorConfig> {
    const cached = this.generatorCache;
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) return cached.value;

    let value = { ...DEFAULT_GENERATOR_CONFIG };
    try {
      const row = await this.prisma.adminSettings.findUnique({ where: { key: GENERATOR_SETTINGS_KEY } });
      if (row && row.value && typeof row.value === 'object') {
        const stored = row.value as Partial<InsightsGeneratorConfig>;
        value = {
          enabled: typeof stored.enabled === 'boolean' ? stored.enabled : value.enabled,
          salaryChangePct:
            typeof stored.salaryChangePct === 'number' && stored.salaryChangePct > 0
              ? stored.salaryChangePct
              : value.salaryChangePct,
          demandGrowthPct:
            typeof stored.demandGrowthPct === 'number' && stored.demandGrowthPct > 0
              ? stored.demandGrowthPct
              : value.demandGrowthPct,
          benefitMinSample:
            typeof stored.benefitMinSample === 'number' && stored.benefitMinSample >= 0
              ? Math.round(stored.benefitMinSample)
              : value.benefitMinSample,
          benefitMinGapPct:
            typeof stored.benefitMinGapPct === 'number' && stored.benefitMinGapPct >= 0
              ? stored.benefitMinGapPct
              : value.benefitMinGapPct,
        };
      }
    } catch (err) {
      this.logger.warn(`Failed to load generator config, using defaults: ${(err as Error).message}`);
    }
    this.generatorCache = { value, loadedAt: Date.now() };
    return value;
  }

  /** Admin write: stores the effective object (defaults + overrides) wholesale. */
  async updateThresholds(partial: Partial<InsightsThresholds>): Promise<InsightsThresholds> {
    const current = await this.getThresholds();
    const next: InsightsThresholds = { ...current };
    for (const [key, def] of Object.entries(DEFAULT_THRESHOLDS)) {
      const incoming = (partial as Record<string, unknown>)[key];
      if (typeof incoming === 'number' && Number.isFinite(incoming) && incoming >= 0) {
        (next as any)[key] = incoming;
      }
    }
    await this.prisma.adminSettings.upsert({
      where: { key: THRESHOLDS_SETTINGS_KEY },
      create: { key: THRESHOLDS_SETTINGS_KEY, value: next, category: 'insights' },
      update: { value: next },
    });
    this.thresholdsCache = { value: next, loadedAt: Date.now() };
    return next;
  }

  async updateGeneratorConfig(partial: Partial<InsightsGeneratorConfig>): Promise<InsightsGeneratorConfig> {
    const current = await this.getGeneratorConfig();
    const next: InsightsGeneratorConfig = {
      enabled: typeof partial.enabled === 'boolean' ? partial.enabled : current.enabled,
      salaryChangePct:
        typeof partial.salaryChangePct === 'number' && partial.salaryChangePct > 0
          ? partial.salaryChangePct
          : current.salaryChangePct,
      demandGrowthPct:
        typeof partial.demandGrowthPct === 'number' && partial.demandGrowthPct > 0
          ? partial.demandGrowthPct
          : current.demandGrowthPct,
      benefitMinSample:
        typeof partial.benefitMinSample === 'number' && partial.benefitMinSample >= 0
          ? Math.round(partial.benefitMinSample)
          : current.benefitMinSample,
      benefitMinGapPct:
        typeof partial.benefitMinGapPct === 'number' && partial.benefitMinGapPct >= 0
          ? partial.benefitMinGapPct
          : current.benefitMinGapPct,
    };
    await this.prisma.adminSettings.upsert({
      where: { key: GENERATOR_SETTINGS_KEY },
      create: { key: GENERATOR_SETTINGS_KEY, value: next, category: 'insights' },
      update: { value: next },
    });
    this.generatorCache = { value: next, loadedAt: Date.now() };
    return next;
  }

  /** Forces the next read to hit the DB (used after admin writes / in tests). */
  invalidateCache() {
    this.thresholdsCache = null;
    this.generatorCache = null;
  }
}