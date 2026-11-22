import { COMPANY, companyAddressLine } from '../company';

// ============================================================================
// COMPANY is the single source of truth for legal-identity facts — these
// guards keep its values well-formed, and structured-data's tests assert
// against the module itself (see structured-data.test.ts).
// ============================================================================

describe('COMPANY (single source of entity facts)', () => {
  it('KvK number is a Dutch 8-digit KvK number', () => {
    expect(COMPANY.kvk).toMatch(/^\d{8}$/);
  });

  it('emails are hosted on the owned domains', () => {
    for (const email of Object.values(COMPANY.emails)) {
      expect(email).toMatch(/^[\w.+-]+@offermarket\.(nl|eu)$/);
    }
  });

  it('phone is in international E.164 format', () => {
    expect(COMPANY.phone).toMatch(/^\+31\d{9}$/);
  });

  it('address fields are non-empty and non-placeholder', () => {
    // countryCode is a 2-character ISO code; everything else is a display string.
    for (const [key, value] of Object.entries(COMPANY.address)) {
      expect(String(value).trim().length).toBeGreaterThanOrEqual(key === 'countryCode' ? 2 : 3);
      expect(String(value).toLowerCase()).not.toContain('todo');
    }
  });

  it('address line matches the published imprint per locale', () => {
    expect(companyAddressLine('nl')).toBe('Tulastraat 17, 3084BZ, Rotterdam, Nederland');
    expect(companyAddressLine('en')).toBe('Tulastraat 17, 3084BZ, Rotterdam, Netherlands');
  });

  it('brand name and imprint name are distinct concepts but both present', () => {
    expect(COMPANY.name).toBe('OfferMarket');
    expect(COMPANY.legalName).toBe('Offermarket');
  });
});
