// Location helper module using pre-generated Netherlands location data
// Provides cascading Country → Province → City data for dropdowns
// Data sourced from world-location-data, filtered to NL only for browser use

import nlData from '../data/nl-locations.json';

export interface LocationOption {
  id: string;
  name: string;
  code: string;
}

export interface CityOption {
  id: string;
  name: string;
  stateCode: string;
  countryCode: string;
  latitude: string;
  longitude: string;
}

const DEFAULT_COUNTRY_CODE = 'NL';

const COUNTRIES: LocationOption[] = [
  { id: 'NL', name: 'Netherlands', code: 'NL' },
];

/** The canonical country name for NL, used when resolving regions */
export const COUNTRY_NAMES: Record<string, string> = {
  NL: 'Netherlands',
};

/**
 * Get available countries (currently only Netherlands, expandable)
 */
export function getCountries(): LocationOption[] {
  return COUNTRIES;
}

/**
 * Get provinces/states for a country (defaults to NL)
 */
export function getProvinces(countryCode: string = DEFAULT_COUNTRY_CODE): LocationOption[] {
  if (countryCode !== 'NL') return [];
  return nlData.states.map((s) => ({
    id: String(s.id),
    name: s.name,
    code: s.iso2 || '',
  })).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get cities for a province/state
 */
export function getCities(stateCode: string, countryCode: string = DEFAULT_COUNTRY_CODE): CityOption[] {
  if (countryCode !== 'NL') return [];
  return nlData.cities
    .filter((c) => c.state_code === stateCode)
    .map((c) => ({
      id: String(c.id),
      name: c.name,
      stateCode: c.state_code,
      countryCode: 'NL',
      latitude: c.latitude,
      longitude: c.longitude,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search for cities by name across all provinces in a country
 */
export function searchCitiesByName(query: string, countryCode: string = DEFAULT_COUNTRY_CODE, limit: number = 20): CityOption[] {
  if (countryCode !== 'NL') return [];
  const lowerQuery = query.toLowerCase();
  return nlData.cities
    .filter((c) => c.name.toLowerCase().includes(lowerQuery))
    .slice(0, limit)
    .map((c) => ({
      id: String(c.id),
      name: c.name,
      stateCode: c.state_code,
      countryCode: 'NL',
      latitude: c.latitude,
      longitude: c.longitude,
    }));
}

/**
 * Get the default country code (for pre-filling forms)
 */
export function getDefaultCountryCode(): string {
  return DEFAULT_COUNTRY_CODE;
}