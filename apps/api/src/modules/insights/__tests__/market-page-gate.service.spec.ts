import {
  evaluateMarketGate,
  citySlugOf,
  MarketPageGateService,
  MARKET_PAGE_GATE_STATE_KEY,
  MARKET_PAGE_GATE_SIGNOFFS_KEY,
} from '../market-page-gate.service';
import type { MonthlySample } from '../market-page-gate.service';

// ============================================================================
// MARKET PAGE GATE (T11) — ratified Q12/Δ4 rules, as pure-function contracts:
//   enter at ≥30; exit only after two consecutive monthly checks <20
//   (hysteresis, quality M1); city pages need editorial sign-off + distinct
//   source; no data → hold; the ≥2-employer condition is off by default.
// ============================================================================

const MONTH = (offset: number, sampleSize: number | null): MonthlySample => {
  // Deterministic month labels, oldest → newest.
  const labels = ['2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
  return { month: labels[offset], sampleSize };
};

describe('evaluateMarketGate — profession-level page (isCity=false)', () => {
  it('holds when there is no snapshot data at all', () => {
    const r = evaluateMarketGate({
      isCity: false, signedOff: false, distinctSource: false,
      currentSampleSize: null, monthlyHistory: [MONTH(0, null)], currentlyIndexable: false,
    });
    expect(r).toEqual({ verdict: 'HOLD_NO_DATA', indexable: false });
  });

  it('holds below the 30-sample threshold', () => {
    const r = evaluateMarketGate({
      isCity: false, signedOff: false, distinctSource: false,
      currentSampleSize: 12, monthlyHistory: [MONTH(0, 12)], currentlyIndexable: false,
    });
    expect(r).toEqual({ verdict: 'HOLD_BELOW_THRESHOLD', indexable: false });
  });

  it('becomes indexable at exactly 30 samples (no sign-off required, not a city page)', () => {
    const r = evaluateMarketGate({
      isCity: false, signedOff: false, distinctSource: false,
      currentSampleSize: 30, monthlyHistory: [MONTH(0, 30)], currentlyIndexable: false,
    });
    expect(r).toEqual({ verdict: 'INDEXABLE', indexable: true });
  });

  it('HYSTERESIS: one month below 20 does NOT exit', () => {
    const r = evaluateMarketGate({
      isCity: false, signedOff: false, distinctSource: false,
      currentSampleSize: 8, monthlyHistory: [MONTH(0, 40), MONTH(1, 48), MONTH(2, 8)],
      currentlyIndexable: true,
    });
    expect(r).toEqual({ verdict: 'INDEXABLE', indexable: true });
  });

  it('HYSTERESIS: two consecutive months below 20 DOES exit', () => {
    const r = evaluateMarketGate({
      isCity: false, signedOff: false, distinctSource: false,
      currentSampleSize: 5, monthlyHistory: [MONTH(0, 40), MONTH(1, 15), MONTH(2, 5)],
      currentlyIndexable: true,
    });
    expect(r).toEqual({ verdict: 'EXIT_HYSTERESIS', indexable: false });
  });
});

describe('evaluateMarketGate — city-level page (isCity=true)', () => {
  const base = {
    isCity: true,
    distinctSource: true,
    currentSampleSize: 30 as number | null,
    monthlyHistory: [MONTH(0, 30)],
    currentlyIndexable: false,
  };

  it('holds without editorial sign-off even with enough data', () => {
    expect(evaluateMarketGate({ ...base, signedOff: false })).toEqual({
      verdict: 'HOLD_AWAIT_SIGNOFF',
      indexable: false,
    });
  });

  it('becomes indexable with sign-off + distinct source', () => {
    expect(evaluateMarketGate({ ...base, signedOff: true })).toEqual({
      verdict: 'INDEXABLE',
      indexable: true,
    });
  });

  it('holds when city data is a province fallback (no distinct source)', () => {
    expect(
      evaluateMarketGate({ ...base, signedOff: true, distinctSource: false }),
    ).toEqual({ verdict: 'HOLD_NO_DISTINCT_SOURCE', indexable: false });
  });

  it('unknown slug (no snapshot row) holds with no data', () => {
    expect(
      evaluateMarketGate({ ...base, signedOff: true, currentSampleSize: null, monthlyHistory: [MONTH(0, null)] }),
    ).toEqual({ verdict: 'HOLD_NO_DATA', indexable: false });
  });
});

describe('citySlugOf', () => {
  it('matches the repo slug convention (accents folded, separators collapsed)', () => {
    expect(citySlugOf('Den Haag')).toBe('den-haag');
    expect(citySlugOf("'s-Gravenhage")).toBe('s-gravenhage');
    expect(citySlugOf('Rotterdam')).toBe('rotterdam');
    expect(citySlugOf('  --')).toBe('');
  });
});

// ============================================================================
// SERVICE persistence (mocked Prisma AdminSettings store)
// ============================================================================

function makeService(adminSettings: Map<string, unknown>) {
  const store: { key: string; value: unknown }[] = [];
  const prisma = {
    adminSettings: {
      findUnique: jest.fn(async ({ where }: { where: { key: string } }) => {
        return store.find((r) => r.key === where.key) ?? null;
      }),
      upsert: jest.fn(async ({ where, create }: { where: { key: string }; create: { key: string; value: unknown } }) => {
        const existing = store.find((r) => r.key === where.key);
        if (existing) existing.value = create.value;
        else store.push({ key: where.key, value: create.value });
        adminSettings.set(where.key, create.value);
        return { key: where.key, value: create.value };
      }),
    },
    marketSnapshot: {
      findFirst: jest.fn(async ({ where }: { where: { profession: unknown; regionId: string | null } }) => {
        const regionId = (where.regionId as string | null) ?? null;
        const rows = [
          {
            snapshotDate: new Date('2026-11-01'),
            data: { salary: { available: true, sampleSize: 42, value: {} }, provenance: {} },
          },
        ];
        return regionId === null ? rows[0] : null;
      }),
      groupBy: jest.fn(async () => []),
      },
    region: { findMany: jest.fn(async () => []) },
  };
  const service = new MarketPageGateService(prisma as never);
  return { service, prisma, store };
}

describe('MarketPageGateService persistence', () => {
  it('evaluatePage records monthly history and updates state; sign-off flip then re-evaluates the city', async () => {
    const { service, store } = makeService(new Map());

    // Profession-level page with a 42-sample snapshot → indexable immediately.
    const prof = await service.evaluatePage('elektricien', null);
    expect(prof.verdict).toBe('INDEXABLE');
    const stateKey = store.find((r) => r.key === MARKET_PAGE_GATE_STATE_KEY);
    expect(stateKey).toBeTruthy();

    // City page: unknown city → HOLD_NO_DATA, no crash.
    const city = await service.evaluatePage('elektricien', 'neverland');
    expect(city.indexable).toBe(false);
    expect(city.verdict).toBe('HOLD_NO_DATA');
  });

  it('addSignOff stores the entry and removeSignOff deletes it', async () => {
    const { service } = makeService(new Map());
    await service.addSignOff({ profession: 'elektricien', citySlug: ' Amsterdam ', signedOffBy: 'admin-1' });
    const list = await service.listSignOffs();
    expect(list).toHaveLength(1);
    expect(list[0].citySlug).toBe('amsterdam');
    await service.removeSignOff('elektricien', 'amsterdam');
    expect(await service.listSignOffs()).toHaveLength(0);
  });

  it('state and signoffs keys are the documented adminSettings keys', () => {
    expect(MARKET_PAGE_GATE_STATE_KEY).toBe('market_page_gate_state');
    expect(MARKET_PAGE_GATE_SIGNOFFS_KEY).toBe('market_page_gate_signoffs');
  });
});
