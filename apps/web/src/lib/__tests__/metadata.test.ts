import { buildSharedAlternates } from '../metadata';

// ============================================================================
// SHARED-TEMPLATE METADATA CONTRACT (URL_ARCHITECTURE Δ5 + audit T2)
// - self-canonical on the locale's own domain
// - languages: same path on each locale domain; x-default → EN domain
// - derived statically from locale (no request-time API) → real prod domains
//   when NODE_ENV is not development (jest runs with NODE_ENV=test).
// ============================================================================

describe('buildSharedAlternates', () => {
  it('canonicalises EN on offermarket.eu with the full hreflang matrix', () => {
    const alternates = buildSharedAlternates('en', '/');
    expect(alternates).toEqual({
      canonical: 'https://offermarket.eu/',
      languages: {
        en: 'https://offermarket.eu/',
        nl: 'https://offermarket.nl/',
        'x-default': 'https://offermarket.eu/',
      },
    });
  });

  it('canonicalises NL on offermarket.nl with the same alternates target set', () => {
    const alternates = buildSharedAlternates('nl', '/pricing');
    expect(alternates).toEqual({
      canonical: 'https://offermarket.nl/pricing',
      languages: {
        en: 'https://offermarket.eu/pricing',
        nl: 'https://offermarket.nl/pricing',
        'x-default': 'https://offermarket.eu/pricing',
      },
    });
  });

  it('normalises a path without a leading slash', () => {
    const alternates = buildSharedAlternates('en', 'pricing');
    expect(alternates.canonical).toBe('https://offermarket.eu/pricing');
    const languages = alternates.languages ?? {};
    expect(languages['x-default']).toBe('https://offermarket.eu/pricing');
  });

  it('uses the EN domain for x-default regardless of serving locale', () => {
    expect(buildSharedAlternates('nl', '/').languages?.['x-default']).toBe(
      'https://offermarket.eu/',
    );
    expect(buildSharedAlternates('en', '/insights').languages?.['x-default']).toBe(
      'https://offermarket.eu/insights',
    );
  });
});
