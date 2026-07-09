import {
  getCountries,
  getProvinces,
  getCities,
  searchCitiesByName,
  getDefaultCountryCode,
  COUNTRY_NAMES,
} from '../location';

describe('location module', () => {
  // ============================================================================
  // getCountries
  // ============================================================================

  describe('getCountries', () => {
    it('should return array with NL entry', () => {
      const countries = getCountries();
      expect(countries).toEqual([{ id: 'NL', name: 'Netherlands', code: 'NL' }]);
    });

    it('should return a stable reference across calls', () => {
      const first = getCountries();
      const second = getCountries();
      expect(first).toBe(second); // same reference since it's a constant
    });
  });

  // ============================================================================
  // getProvinces
  // ============================================================================

  describe('getProvinces', () => {
    it('should return all 12 NL provinces sorted alphabetically (locale-aware)', () => {
      const provinces = getProvinces('NL');
      expect(provinces.length).toBe(12);

      // Verify alphabetical ordering using localeCompare (same as the implementation)
      const names = provinces.map(p => p.name);
      for (let i = 1; i < names.length; i++) {
        expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0);
      }
    });

    it('should include Zuid-Holland (not South Holland)', () => {
      const provinces = getProvinces('NL');
      const zhProvince = provinces.find(p => p.code === 'ZH');
      expect(zhProvince).toBeDefined();
      expect(zhProvince!.name).toBe('Zuid-Holland');
    });

    it('should include Noord-Holland (not North Holland)', () => {
      const provinces = getProvinces('NL');
      const nhProvince = provinces.find(p => p.code === 'NH');
      expect(nhProvince).toBeDefined();
      expect(nhProvince!.name).toBe('Noord-Holland');
    });

    it('should include Noord-Brabant (not North Brabant)', () => {
      const provinces = getProvinces('NL');
      const nbProvince = provinces.find(p => p.code === 'NB');
      expect(nbProvince).toBeDefined();
      expect(nbProvince!.name).toBe('Noord-Brabant');
    });

    it('should return each province with id, name, and code', () => {
      const provinces = getProvinces('NL');
      for (const province of provinces) {
        expect(province).toHaveProperty('id');
        expect(province).toHaveProperty('name');
        expect(province).toHaveProperty('code');
        expect(typeof province.name).toBe('string');
        expect(typeof province.code).toBe('string');
      }
    });

    it('should return empty array for non-NL country code', () => {
      expect(getProvinces('DE')).toEqual([]);
      expect(getProvinces('US')).toEqual([]);
    });

    it('should default to NL when called without arguments', () => {
      const withNL = getProvinces('NL');
      const withoutArg = getProvinces();
      expect(withoutArg).toEqual(withNL);
    });
  });

  // ============================================================================
  // getCities
  // ============================================================================

  describe('getCities', () => {
    it('should return cities for Zuid-Holland (ZH)', () => {
      const cities = getCities('ZH', 'NL');
      expect(cities.length).toBeGreaterThan(0);

      // Verify all cities have the ZH state code
      for (const city of cities) {
        expect(city.stateCode).toBe('ZH');
      }
    });

    it('should return cities sorted alphabetically (locale-aware)', () => {
      const cities = getCities('ZH', 'NL');
      const names = cities.map(c => c.name);
      // The function uses localeCompare, so we verify ordering is consistent
      // by checking that each successive name is >= the previous one
      for (let i = 1; i < names.length; i++) {
        expect(names[i - 1].localeCompare(names[i])).toBeLessThanOrEqual(0);
      }
    });

    it('should include Rotterdam in ZH cities', () => {
      const cities = getCities('ZH', 'NL');
      const rotterdam = cities.find(c => c.name === 'Rotterdam');
      expect(rotterdam).toBeDefined();
      expect(rotterdam!.stateCode).toBe('ZH');
    });

    it('should return each city with required fields', () => {
      const cities = getCities('ZH', 'NL');
      for (const city of cities) {
        expect(city).toHaveProperty('id');
        expect(city).toHaveProperty('name');
        expect(city).toHaveProperty('stateCode');
        expect(city).toHaveProperty('countryCode');
        expect(city).toHaveProperty('latitude');
        expect(city).toHaveProperty('longitude');
        expect(city.countryCode).toBe('NL');
      }
    });

    it('should return empty array for non-NL country code', () => {
      expect(getCities('ZH', 'DE')).toEqual([]);
    });

    it('should return empty array for unknown state code', () => {
      expect(getCities('XX', 'NL')).toEqual([]);
    });
  });

  // ============================================================================
  // searchCitiesByName
  // ============================================================================

  describe('searchCitiesByName', () => {
    it('should find Amsterdam with case-insensitive search', () => {
      const results = searchCitiesByName('amster', 'NL');
      expect(results.length).toBeGreaterThan(0);
      const amsterdam = results.find(c => c.name === 'Amsterdam');
      expect(amsterdam).toBeDefined();
    });

    it('should find Amsterdam with uppercase query', () => {
      const results = searchCitiesByName('AMSTER', 'NL');
      expect(results.length).toBeGreaterThan(0);
      const amsterdam = results.find(c => c.name === 'Amsterdam');
      expect(amsterdam).toBeDefined();
    });

    it('should respect the limit parameter', () => {
      const results = searchCitiesByName('a', 'NL', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should default to limit of 20', () => {
      const results = searchCitiesByName('a', 'NL');
      expect(results.length).toBeLessThanOrEqual(20);
    });

    it('should return empty array for non-NL country code', () => {
      expect(searchCitiesByName('amster', 'DE')).toEqual([]);
    });

    it('should return results with correct structure', () => {
      const results = searchCitiesByName('Rotterdam', 'NL');
      const rotterdam = results.find(c => c.name === 'Rotterdam');
      expect(rotterdam).toBeDefined();
      expect(rotterdam!.stateCode).toBe('ZH');
      expect(rotterdam!.countryCode).toBe('NL');
      expect(typeof rotterdam!.latitude).toBe('string');
      expect(typeof rotterdam!.longitude).toBe('string');
    });
  });

  // ============================================================================
  // COUNTRY_NAMES
  // ============================================================================

  describe('COUNTRY_NAMES', () => {
    it('should map NL to Netherlands', () => {
      expect(COUNTRY_NAMES['NL']).toBe('Netherlands');
    });

    it('should not contain South Holland as a value', () => {
      const values = Object.values(COUNTRY_NAMES);
      expect(values).not.toContain('South Holland');
    });
  });

  // ============================================================================
  // getDefaultCountryCode
  // ============================================================================

  describe('getDefaultCountryCode', () => {
    it('should return NL', () => {
      expect(getDefaultCountryCode()).toBe('NL');
    });
  });
});