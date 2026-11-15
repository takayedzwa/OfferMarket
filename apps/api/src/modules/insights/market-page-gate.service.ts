import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

// ============================================================================
// MARKET PAGE GATE SERVICE (T11) — indexability gate for /market/* pages
// ----------------------------------------------------------------------------
// Implements the ratified Q12/Δ4 gate as a PURE function + a persistence layer:
//
//   enter:  latest monthly salary sampleSize ≥ INDEXABLE_MIN_SAMPLES (30)
//           AND for city pages: editorial sign-off + distinct source
//           (the city region has its own salary data, not province fallback)
//   exit:   two consecutive monthly re-checks below EXIT_MIN_SAMPLES (20)
//           — hysteresis, no gate flapping (quality M1)
//   ≥2-employer condition: OFF by default (feasibility of the aggregation
//           query unverified — quality Q12; the distinct-source check is the
//           active proxy until the ≥2-distinct-employers metric exists)
//
// State lives in the AdminSettings key/value store (NO schema change — quality
// M3): sign-offs in MARKET_PAGE_GATE_SIGNOFFS_KEY, derived gate state
// (incl. the monthly hysteresis history) in MARKET_PAGE_GATE_STATE_KEY.
// The daily snapshot cron calls refreshState() so the monthly checks have data.
// ============================================================================

const INDEXABLE_MIN_SAMPLES = 30;
const EXIT_MIN_SAMPLES = 20;
const REQUIRE_TWO_EMPLOYERS = false;

export const MARKET_PAGE_GATE_STATE_KEY = 'market_page_gate_state';
export const MARKET_PAGE_GATE_SIGNOFFS_KEY = 'market_page_gate_signoffs';

export interface CitySignOff {
  profession: string;
  citySlug: string;
  signedOffBy: string;
  signedOffAt: string;
}

export interface MonthlySample {
  month: string; // 'YYYY-MM'
  sampleSize: number | null;
}

export interface GateStateEntry {
  profession: string;
  citySlug: string | null; // null = profession-level page
  monthly: MonthlySample[];
  indexable: boolean;
  indexableSince?: string;
  exitReason?: string;
}

export type GateVerdict =
  | 'INDEXABLE'
  | 'HOLD_NO_DATA'
  | 'HOLD_BELOW_THRESHOLD'
  | 'HOLD_AWAIT_SIGNOFF'
  | 'HOLD_NO_DISTINCT_SOURCE'
  | 'EXIT_HYSTERESIS'
  | 'HOLD_2_EMPLOYER_RULE';

export interface GateInput {
  isCity: boolean;
  signedOff: boolean;
  distinctSource: boolean;
  currentSampleSize: number | null;
  monthlyHistory: MonthlySample[]; // ascending by month, incl. current
  currentlyIndexable: boolean;
}

export interface GateResult {
  verdict: GateVerdict;
  indexable: boolean;
}

/**
 * PURE gate evaluation — unit-tested in isolation. Monthly history includes
 * the current month's sample (the persistence layer upserts it first).
 */
export function evaluateMarketGate(input: GateInput): GateResult {
  const { isCity, signedOff, distinctSource, currentSampleSize, monthlyHistory } = input;

  if (currentSampleSize === null) {
    return { verdict: 'HOLD_NO_DATA', indexable: false };
  }

  // Exit path first: once indexable, hysteresis keeps it indexable until TWO
  // consecutive monthly checks fall below the exit floor (never a one-month dip).
  if (input.currentlyIndexable) {
    const lastTwo = monthlyHistory.slice(-2);
    const exited =
      lastTwo.length === 2 &&
      lastTwo.every((m) => m.sampleSize !== null && m.sampleSize < EXIT_MIN_SAMPLES);
    if (exited) return { verdict: 'EXIT_HYSTERESIS', indexable: false };
    return { verdict: 'INDEXABLE', indexable: true };
  }

  // Enter path.
  if (currentSampleSize < INDEXABLE_MIN_SAMPLES) {
    return { verdict: 'HOLD_BELOW_THRESHOLD', indexable: false };
  }
  void REQUIRE_TWO_EMPLOYERS; // off by default — see header comment (Q12)
  if (isCity && !signedOff) {
    return { verdict: 'HOLD_AWAIT_SIGNOFF', indexable: false };
  }
  if (isCity && !distinctSource) {
    return { verdict: 'HOLD_NO_DISTINCT_SOURCE', indexable: false };
  }
  return { verdict: 'INDEXABLE', indexable: true };
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** City slug convention for the /market family — matches the repo's existing slugify behaviour (accents folded). */
export function citySlugOf(name: string | null | undefined): string {
  return (name ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class MarketPageGateService {
  private readonly logger = new Logger(MarketPageGateService.name);

  constructor(private readonly prisma: PrismaService) {}

  // --------------------------------------------------------------------------
  // PERSISTENCE (AdminSettings key/value — validated store, no schema change)
  // --------------------------------------------------------------------------

  private async readSetting<T>(key: string, fallback: T): Promise<T> {
    const row = await this.prisma.adminSettings.findUnique({ where: { key } });
    return (row?.value as T) ?? fallback;
  }

  private async writeSetting(key: string, value: unknown): Promise<void> {
    await this.prisma.adminSettings.upsert({
      where: { key },
      update: { value: value as object, category: 'market_gate' },
      create: { key, value: value as object, category: 'market_gate' },
    });
  }

  // --------------------------------------------------------------------------
  // SIGN-OFFS (Admin CRUD surface lives in admin.controller via these methods)
  // --------------------------------------------------------------------------

  async listSignOffs(): Promise<CitySignOff[]> {
    return this.readSetting<CitySignOff[]>(MARKET_PAGE_GATE_SIGNOFFS_KEY, []);
  }

  async addSignOff(
    entry: Omit<CitySignOff, 'signedOffAt'> & { signedOffAt?: string },
  ): Promise<CitySignOff[]> {
    const list = await this.listSignOffs();
    const signOff: CitySignOff = {
      profession: entry.profession.trim().toLowerCase(),
      citySlug: entry.citySlug.trim().toLowerCase(),
      signedOffBy: entry.signedOffBy,
      signedOffAt: (entry.signedOffAt ? new Date(entry.signedOffAt) : new Date()).toISOString(),
    };
    const next = [
      ...list.filter(
        (s) => !(s.profession === signOff.profession && s.citySlug === signOff.citySlug),
      ),
      signOff,
    ];
    await this.writeSetting(MARKET_PAGE_GATE_SIGNOFFS_KEY, next);
    await this.refreshState();
    return next;
  }

  async removeSignOff(profession: string, citySlug: string): Promise<CitySignOff[]> {
    const next = (await this.listSignOffs()).filter(
      (s) =>
        !(
          s.profession === profession.toLowerCase() &&
          s.citySlug === citySlug.toLowerCase()
        ),
    );
    await this.writeSetting(MARKET_PAGE_GATE_SIGNOFFS_KEY, next);
    await this.refreshState();
    return next;
  }

  // --------------------------------------------------------------------------
  // GATE LOOK-UP (used by the public page endpoint + the snapshots cron)
  // --------------------------------------------------------------------------

  /** Latest snapshot sample for (profession, regionId) — null when absent. */
  async latestSample(
    profession: string,
    regionId: string | null,
  ): Promise<{
    sampleSize: number | null;
    snapshotData: Record<string, unknown> | null;
    snapshotDate: Date | null;
  }> {
    const snapshot = await this.prisma.marketSnapshot.findFirst({
      where: { profession: { equals: profession, mode: 'insensitive' }, regionId },
      orderBy: { snapshotDate: 'desc' },
    });
    if (!snapshot) return { sampleSize: null, snapshotData: null, snapshotDate: null };
    const data = snapshot.data as {
      salary?: { available?: boolean; sampleSize?: number };
      provenance?: Record<string, unknown>;
    };
    const present = data?.salary?.available === true;
    return {
      sampleSize: present ? (data.salary!.sampleSize ?? null) : null,
      snapshotData: snapshot.data as Record<string, unknown>,
      snapshotDate: snapshot.snapshotDate,
    };
  }

  /**
   * Full gate evaluation for one slug pair, with state read + persisted.
   * Returns indexable + verdict + the snapshot payload to render.
   */
  async evaluatePage(
    profession: string,
    citySlug: string | null,
  ): Promise<{
    verdict: GateVerdict;
    indexable: boolean;
    sampleSize: number | null;
    snapshotData: Record<string, unknown> | null;
    snapshotDate: Date | null;
  }> {
    const professionKey = profession.toLowerCase();
    const entryKey = `${professionKey}:${citySlug ?? ''}`;

    // City pages look up their region from the slug; profession pages use the
    // nation-wide aggregate (regionId null).
    let regionId: string | null = null;
    if (citySlug) {
      const city = await this.findCityRegion(citySlug);
      if (!city) {
        return {
          verdict: 'HOLD_NO_DATA',
          indexable: false,
          sampleSize: null,
          snapshotData: null,
          snapshotDate: null,
        };
      }
      regionId = city.id;
    }
    const { sampleSize, snapshotData, snapshotDate } = await this.latestSample(
      professionKey,
      regionId,
    );

    const [state, signOffs] = await Promise.all([
      this.readSetting<Record<string, GateStateEntry>>(MARKET_PAGE_GATE_STATE_KEY, {}),
      this.listSignOffs(),
    ]);
    const entry = state[entryKey];
    const signedOff = signOffs.some(
      (s) => s.profession === professionKey && s.citySlug === (citySlug ?? '').toLowerCase(),
    );
    // Distinct-source proxy (Q12): the CITY region has its own salary-bearing
    // snapshot row (not a province fallback). Replace with the ≥2-distinct-
    // employers aggregation when its feasibility is settled.
    const distinctSource = citySlug !== null && sampleSize !== null && sampleSize > 0;

    const currentMonthly: MonthlySample = { month: currentMonth(), sampleSize };
    const monthlyHistory = this.mergeMonthly(entry?.monthly ?? [], currentMonthly);

    const result = evaluateMarketGate({
      isCity: citySlug !== null,
      signedOff,
      distinctSource,
      currentSampleSize: sampleSize,
      monthlyHistory,
      currentlyIndexable: entry?.indexable ?? false,
    });

    // Persist derived state (hysteresis history + status) for the next run.
    const nextEntry: GateStateEntry = {
      profession: professionKey,
      citySlug,
      monthly: monthlyHistory,
      indexable: result.indexable,
      indexableSince:
        result.indexable && !entry?.indexable
          ? new Date().toISOString()
          : result.indexable
            ? entry?.indexableSince
            : undefined,
      exitReason: result.indexable ? undefined : result.verdict,
    };
    const next = { ...state, [entryKey]: nextEntry };
    await this.writeSetting(MARKET_PAGE_GATE_STATE_KEY, next);

    return {
      verdict: result.verdict,
      indexable: result.indexable,
      sampleSize,
      snapshotData,
      snapshotDate,
    };
  }

  /** List every (profession, citySlug) pair currently marked indexable. */
  async listIndexable(): Promise<Array<{ profession: string; citySlug: string | null }>> {
    const state = await this.readSetting<Record<string, GateStateEntry>>(
      MARKET_PAGE_GATE_STATE_KEY,
      {},
    );
    return Object.values(state)
      .filter((e) => e.indexable)
      .map((e) => ({ profession: e.profession, citySlug: e.citySlug }));
  }

  /**
   * Refresh gate state for ALL known entries after the daily snapshot write —
   * so monthly checks keep being recorded even for currently-exited pages.
   */
  @Cron('40 2 * * *', { timeZone: 'UTC' })
  async refreshState(): Promise<void> {
    try {
      await this.seedStateFromSnapshots();
      const state = await this.readSetting<Record<string, GateStateEntry>>(
        MARKET_PAGE_GATE_STATE_KEY,
        {},
      );
      for (const entry of Object.values(state)) {
        await this.evaluatePage(entry.profession, entry.citySlug);
      }
    } catch (error) {
      // Never break the snapshot cron because of gate bookkeeping.
      this.logger.warn(`Market gate state refresh failed: ${error}`);
    }
  }

  /**
   * First-run/discovery: derive gate entries from the recent MarketSnapshot
   * rows (they exist only where real marketplace activity happened — the
   * snapshot service's own policy), so the gate state is never permanently
   * empty. Bounded: at most 30 new entries per run.
   */
  private async seedStateFromSnapshots(): Promise<void> {
    const since = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const state = await this.readSetting<Record<string, GateStateEntry>>(
      MARKET_PAGE_GATE_STATE_KEY,
      {},
    );
    const existing = new Set(Object.keys(state));
    let seeded = 0;

    const professionRows = await this.prisma.marketSnapshot.groupBy({
      by: ['profession'],
      where: { snapshotDate: { gte: since } },
    });
    for (const row of professionRows) {
      const key = `${row.profession.toLowerCase()}:`;
      if (!existing.has(key)) {
        await this.evaluatePage(row.profession, null);
        existing.add(key);
        if (++seeded >= 30) return;
      }
    }

    const cityRows = await this.prisma.marketSnapshot.groupBy({
      by: ['profession', 'regionId'],
      where: { snapshotDate: { gte: since }, regionId: { not: null } },
    });
    const regionIds = [...new Set(cityRows.map((r) => r.regionId!))].filter(Boolean);
    const cities = regionIds.length
      ? await this.prisma.region.findMany({ where: { id: { in: regionIds }, type: 'CITY' } })
      : [];
    const cityById = new Map(cities.map((c) => [c.id, c]));
    for (const row of cityRows) {
      const city = row.regionId ? cityById.get(row.regionId) : null;
      if (!city) continue;
      const key = `${row.profession.toLowerCase()}:${citySlugOf(city.name)}`;
      if (!existing.has(key)) {
        await this.evaluatePage(row.profession, citySlugOf(city.name));
        existing.add(key);
        if (++seeded >= 30) return;
      }
    }
  }

  // --------------------------------------------------------------------------

  private async findCityRegion(citySlug: string) {
    const cities = await this.prisma.region.findMany({ where: { type: 'CITY' } });
    return (
      cities.find(
        (c) => citySlugOf(c.name) === citySlug || (c.nameEn && citySlugOf(c.nameEn) === citySlug),
      ) ?? null
    );
  }

  /** Publicly usable region lookup for the /market page payload. */
  async findCityRegionForSlug(citySlug: string) {
    return this.findCityRegion(citySlug);
  }

  private mergeMonthly(existing: MonthlySample[], current: MonthlySample): MonthlySample[] {
    const withoutCurrentMonth = existing.filter((m) => m.month !== current.month);
    // Keep the last 24 months only — bounded storage in the settings blob.
    return [...withoutCurrentMonth, current].slice(-24);
  }
}
