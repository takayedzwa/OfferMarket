"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { workersApi, enumsApi, regionsApi } from "../../lib/api";
import { getProvinces, getCities, getDefaultCountryCode, type LocationOption, type CityOption } from "../../lib/location";
import {
  Search, Filter, X, MapPin, Briefcase, Star, ArrowRight,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Car,
  Shield, Globe, CheckCircle, Award, BadgeCheck,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Worker {
  publicId: string;
  headline?: string;
  region: { name: string; province?: string; type?: string } | null;
  yearsOfExperience?: number;
  primaryTrade?: string;
  specializations?: string[];
  availability: string;
  skills: any[];
  certifications: any[];
  hasDrivingLicense?: boolean;
  hasOwnVehicle?: boolean;
  travelDistanceKm?: number;
  workAuthorization?: string;
  desiredSalaryRange: { min?: number; max?: number };
  employmentTypes: string[];
  profileCompletenessPct: number;
  reputationScore: number;
  safetyScore?: number;
  badges?: string[];
  lastActive: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WorkerFilters {
  trade: string;
  regionId: string;
  availability: string;
  minExperience: string;
  maxExperience: string;
  availableImmediately: boolean;
  hasDrivingLicense: boolean | '';
  specializations: string[];
  workAuthorization: string;
  skillIds: string[];
  certificationNEN3140: boolean;
  certificationVCA: boolean;
  certificationSearch: string;
  language: string;
  languageMinLevel: string;
  employmentTypes: string[];
}

const defaultFilters: WorkerFilters = {
  trade: '',
  regionId: '',
  availability: '',
  minExperience: '',
  maxExperience: '',
  availableImmediately: false,
  hasDrivingLicense: '',
  specializations: [],
  workAuthorization: '',
  skillIds: [],
  certificationNEN3140: false,
  certificationVCA: false,
  certificationSearch: '',
  language: '',
  languageMinLevel: '',
  employmentTypes: [],
};

const SPECIALIZATION_LABELS: Record<string, string> = {
  RESIDENTIAL_INSTALLATIONS: "Residential",
  COMMERCIAL_INSTALLATIONS: "Commercial",
  INDUSTRIAL_INSTALLATIONS: "Industrial",
  MAINTENANCE: "Maintenance",
  HIGH_VOLTAGE: "High Voltage",
  LOW_VOLTAGE: "Low Voltage",
  SOLAR_PV: "Solar PV",
  EV_CHARGING: "EV Charging",
  CONTROL_PANELS: "Control Panels",
  PLC_SYSTEMS: "PLC Systems",
  AUTOMATION: "Automation",
  BUILDING_MANAGEMENT: "Building Mgmt",
  FIRE_ALARM_SYSTEMS: "Fire Alarm",
  SECURITY_SYSTEMS: "Security Systems",
  DATA_CABLING: "Data Cabling",
  MARINE_ELECTRICAL: "Marine Electrical",
  RENEWABLE_ENERGY: "Renewable Energy",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkersSearch() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [filters, setFilters] = useState<WorkerFilters>({ ...defaultFilters });

  // Enum data
  const [trades, setTrades] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  // Location filter state (Province → City cascading)
  const [locationCountry] = useState(getDefaultCountryCode());
  const [locationProvinces] = useState<LocationOption[]>(getProvinces(getDefaultCountryCode()));
  const [selectedProvince, setSelectedProvince] = useState("");
  const [locationCities, setLocationCities] = useState<CityOption[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [availabilityOptions, setAvailabilityOptions] = useState<any[]>([]);
  const [specializationOptions, setSpecializationOptions] = useState<any[]>([]);
  const [workAuthOptions, setWorkAuthOptions] = useState<any[]>([]);
  const [languageLevels, setLanguageLevels] = useState<any[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  const handleCreateOffer = (e: React.MouseEvent, workerPublicId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/offers/create?workerId=${encodeURIComponent(workerPublicId)}`);
  };

  // Build search params from a filter state object
  const buildSearchParams = (f: WorkerFilters, page = 1) => {
    const params: any = { page, limit: 20 };

    if (f.trade) params.trade = f.trade;
    if (f.regionId) params.regionId = f.regionId;

    // Available Immediately toggle overrides availability dropdown
    if (f.availableImmediately) {
      params.availability = 'IMMEDIATE';
    } else if (f.availability) {
      params.availability = f.availability;
    }

    if (f.minExperience) params.minExperience = parseInt(f.minExperience);
    if (f.maxExperience) params.maxExperience = parseInt(f.maxExperience);

    if (f.specializations.length > 0) {
      params.specializations = f.specializations.join(',');
    }

    if (f.hasDrivingLicense === true) params.hasDrivingLicense = 'true';
    else if (f.hasDrivingLicense === false) params.hasDrivingLicense = 'false';

    if (f.workAuthorization) params.workAuthorization = f.workAuthorization;

    if (f.skillIds.length > 0) {
      params.skillIds = f.skillIds.join(',');
    }

    // Merge certification shortcuts with custom searches
    const certNames: string[] = [];
    if (f.certificationNEN3140) certNames.push('NEN 3140');
    if (f.certificationVCA) certNames.push('VCA');
    if (f.certificationSearch) certNames.push(f.certificationSearch);
    if (certNames.length > 0) {
      params.certificationNames = [...new Set(certNames)].join(',');
    }

    if (f.language && f.languageMinLevel) {
      params.language = f.language;
      params.languageMinLevel = f.languageMinLevel;
    }

    if (f.employmentTypes.length > 0) {
      params.employmentTypes = f.employmentTypes.join(',');
    }

    return params;
  };

  const searchWorkers = async (page = 1, filterOverride?: WorkerFilters) => {
    const f = filterOverride ?? filters;
    setLoading(true);
    try {
      const params = buildSearchParams(f, page);
      const res = await workersApi.searchWorkers(params);
      setWorkers(res.data.workers || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error("Failed to search workers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load enum data once, then trigger initial search
  useEffect(() => {
    workersApi.getTrades()
      .then((res) => setTrades(res.data.currentlyAvailable || res.data || []))
      .catch(() => setTrades([{ value: "Electrician", label: "Electrician", available: true }]));

    workersApi.getSpecializations()
      .then((res) => setSpecializationOptions(res.data || []))
      .catch(() => setSpecializationOptions(Object.entries(SPECIALIZATION_LABELS).map(([value, label]) => ({ value, label }))));

    workersApi.getSkillsCatalog()
      .then((res) => setSkills(res.data || []))
      .catch(() => {});

    enumsApi.getAvailability()
      .then((res) => setAvailabilityOptions(res.data))
      .catch(() => setAvailabilityOptions([
        { value: "IMMEDIATE", label: "Immediately" },
        { value: "ONE_MONTH", label: "In 1 month" },
        { value: "THREE_MONTHS", label: "In 3 months" },
        { value: "SIX_MONTHS", label: "In 6 months" },
        { value: "NOT_AVAILABLE", label: "Not available" },
      ]));

    enumsApi.getWorkAuthorization()
      .then((res) => setWorkAuthOptions(res.data))
      .catch(() => setWorkAuthOptions([
        { value: 'EU_CITIZEN', label: 'EU Citizen' },
        { value: 'DUTCH_WORK_PERMIT', label: 'Dutch Work Permit' },
        { value: 'HIGHLY_SKILLED_MIGRANT', label: 'Highly Skilled Migrant Visa' },
        { value: 'REQUIRES_SPONSORSHIP', label: 'Requires Sponsorship' },
      ]));

    enumsApi.getLanguageLevel()
      .then((res) => setLanguageLevels(res.data))
      .catch(() => setLanguageLevels([
        { value: 'A1', label: 'A1 - Beginner' },
        { value: 'A2', label: 'A2 - Elementary' },
        { value: 'B1', label: 'B1 - Intermediate' },
        { value: 'B2', label: 'B2 - Upper Intermediate' },
        { value: 'C1', label: 'C1 - Advanced' },
        { value: 'C2', label: 'C2 - Proficient' },
        { value: 'NATIVE', label: 'Native Speaker' },
      ]));

    enumsApi.getEmploymentType()
      .then((res) => setEmploymentTypeOptions(res.data))
      .catch(() => setEmploymentTypeOptions([
        { value: 'FULL_TIME', label: 'Full-time' },
        { value: 'PART_TIME', label: 'Part-time' },
        { value: 'FREELANCE', label: 'Freelance' },
        { value: 'CONTRACT', label: 'Contract' },
        { value: 'TEMPORARY', label: 'Temporary' },
        { value: 'INTERNSHIP', label: 'Internship' },
      ]));

    // Province data is now loaded from world-location-data (see locationProvinces state)

    // Initial search with no filters
    searchWorkers(1, defaultFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    searchWorkers(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const emptyFilters = { ...defaultFilters };
    setFilters(emptyFilters);
    setSelectedProvince("");
    setSelectedCity("");
    setLocationCities([]);
    searchWorkers(1, emptyFilters);
    setShowFilters(false);
  };

  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSpecialization = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter((s) => s !== value)
        : [...prev.specializations, value],
    }));
  };

  const toggleSkill = (skillId: string) => {
    setFilters((prev) => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter((id) => id !== skillId)
        : [...prev.skillIds, skillId],
    }));
  };

  const toggleEmploymentType = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      employmentTypes: prev.employmentTypes.includes(value)
        ? prev.employmentTypes.filter((t) => t !== value)
        : [...prev.employmentTypes, value],
    }));
  };

  // Build active filter chips
  const getActiveChips = () => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.trade) {
      const t = trades.find((tr: any) => tr.value === filters.trade);
      chips.push({ key: 'trade', label: `Trade: ${t?.label || filters.trade}`, onRemove: () => updateFilter('trade', '') });
    }
    if (filters.regionId) {
      const cityName = selectedCity ? locationCities.find((c: CityOption) => c.id === selectedCity)?.name : null;
      const provinceName = selectedProvince ? locationProvinces.find((p: LocationOption) => p.code === selectedProvince)?.name : null;
      const locationLabel = cityName ? `${cityName}, ${provinceName}` : provinceName || filters.regionId;
      chips.push({ key: 'region', label: `Location: ${locationLabel}`, onRemove: () => {
        updateFilter('regionId', '');
        setSelectedProvince('');
        setSelectedCity('');
        setLocationCities([]);
      }});
    }
    if (filters.availableImmediately) {
      chips.push({ key: 'immediate', label: 'Available Immediately', onRemove: () => updateFilter('availableImmediately', false) });
    } else if (filters.availability) {
      const a = availabilityOptions.find((opt: any) => opt.value === filters.availability);
      chips.push({ key: 'availability', label: a?.label || filters.availability, onRemove: () => updateFilter('availability', '') });
    }
    if (filters.minExperience) {
      chips.push({ key: 'minExp', label: `Min ${filters.minExperience} yrs`, onRemove: () => updateFilter('minExperience', '') });
    }
    if (filters.maxExperience) {
      chips.push({ key: 'maxExp', label: `Max ${filters.maxExperience} yrs`, onRemove: () => updateFilter('maxExperience', '') });
    }
    if (filters.hasDrivingLicense === true) {
      chips.push({ key: 'driving', label: 'Has Driving Licence', onRemove: () => updateFilter('hasDrivingLicense', '') });
    }
    if (filters.hasDrivingLicense === false) {
      chips.push({ key: 'noDriving', label: 'No Driving Licence', onRemove: () => updateFilter('hasDrivingLicense', '') });
    }
    filters.specializations.forEach((spec) => {
      chips.push({
        key: `spec-${spec}`,
        label: SPECIALIZATION_LABELS[spec] || spec.replace(/_/g, ' '),
        onRemove: () => toggleSpecialization(spec),
      });
    });
    if (filters.workAuthorization) {
      const wa = workAuthOptions.find((w: any) => w.value === filters.workAuthorization);
      chips.push({ key: 'workAuth', label: wa?.label || filters.workAuthorization, onRemove: () => updateFilter('workAuthorization', '') });
    }
    if (filters.certificationNEN3140) {
      chips.push({ key: 'nen3140', label: 'NEN 3140', onRemove: () => updateFilter('certificationNEN3140', false) });
    }
    if (filters.certificationVCA) {
      chips.push({ key: 'vca', label: 'VCA', onRemove: () => updateFilter('certificationVCA', false) });
    }
    if (filters.certificationSearch) {
      chips.push({ key: 'certSearch', label: filters.certificationSearch, onRemove: () => updateFilter('certificationSearch', '') });
    }
    if (filters.skillIds.length > 0) {
      filters.skillIds.forEach((id) => {
        const skill = skills.find((s: any) => s.id === id);
        chips.push({
          key: `skill-${id}`,
          label: skill?.name || id,
          onRemove: () => toggleSkill(id),
        });
      });
    }
    if (filters.language && filters.languageMinLevel) {
      const level = languageLevels.find((l: any) => l.value === filters.languageMinLevel);
      chips.push({
        key: 'language',
        label: `${filters.language} ${filters.languageMinLevel}+`,
        onRemove: () => { updateFilter('language', ''); updateFilter('languageMinLevel', ''); },
      });
    }
    filters.employmentTypes.forEach((et) => {
      const etOpt = employmentTypeOptions.find((e: any) => e.value === et);
      chips.push({
        key: `et-${et}`,
        label: etOpt?.label || et.replace(/_/g, ' '),
        onRemove: () => toggleEmploymentType(et),
      });
    });

    return chips;
  };

  const activeChips = getActiveChips();
  const hasActiveFilters = activeChips.length > 0;

  const getAvailabilityLabel = (availability: string) => {
    const labels: Record<string, string> = {
      IMMEDIATE: "Available Immediately",
      ONE_MONTH: "Available in 1 month",
      THREE_MONTHS: "Available in 3 months",
      SIX_MONTHS: "Available in 6 months",
      NOT_AVAILABLE: "Not available",
    };
    return labels[availability] || availability;
  };

  const getAvailabilityColor = (availability: string) => {
    const colors: Record<string, string> = {
      IMMEDIATE: "text-green-600 bg-green-50",
      ONE_MONTH: "text-blue-600 bg-blue-50",
      THREE_MONTHS: "text-yellow-600 bg-yellow-50",
      SIX_MONTHS: "text-orange-600 bg-orange-50",
      NOT_AVAILABLE: "text-gray-600 bg-gray-50",
    };
    return colors[availability] || "text-gray-600 bg-gray-50";
  };

  const getWorkAuthLabel = (wa: string) => {
    const labels: Record<string, string> = {
      EU_CITIZEN: "EU Citizen",
      DUTCH_WORK_PERMIT: "Dutch Work Permit",
      HIGHLY_SKILLED_MIGRANT: "Highly Skilled Migrant",
      REQUIRES_SPONSORSHIP: "Requires Sponsorship",
    };
    return labels[wa] || wa.replace(/_/g, " ");
  };

  // Filtered skills for search
  const filteredSkills = skillSearch
    ? skills.filter((s: any) => s.name.toLowerCase().includes(skillSearch.toLowerCase())).slice(0, 20)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Find Workers</h1>
              <p className="text-gray-600 mt-1">Browse anonymous worker profiles and send offers</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                {chip.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            {activeChips.length > 1 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Search Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade / Profession
                </label>
                <select
                  value={filters.trade}
                  onChange={(e) => updateFilter('trade', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">All Trades</option>
                  {trades.map((trade: any) => (
                    <option key={trade.value} value={trade.value}>
                      {trade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Province)
                </label>
                <select
                  value={selectedProvince}
                  onChange={async (e) => {
                    const prov = e.target.value;
                    setSelectedProvince(prov);
                    setSelectedCity("");
                    setLocationCities(prov ? getCities(prov, locationCountry) : []);
                    if (prov) {
                      // Resolve province to a regionId for search
                      try {
                        const provinceObj = locationProvinces.find((p: LocationOption) => p.code === prov);
                        if (provinceObj) {
                          const res = await regionsApi.resolveRegion({
                            countryCode: locationCountry,
                            provinceCode: prov,
                            provinceName: provinceObj.name,
                            cityName: provinceObj.name, // province-level search
                          });
                          updateFilter('regionId', res.data.id);
                        }
                      } catch (err) {
                        console.error("Failed to resolve province:", err);
                        updateFilter('regionId', '');
                      }
                    } else {
                      updateFilter('regionId', '');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">All Locations</option>
                  {locationProvinces.map((p: LocationOption) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProvince && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    value={selectedCity}
                    onChange={async (e) => {
                      const cityId = e.target.value;
                      setSelectedCity(cityId);
                      if (cityId) {
                        // Resolve city to a regionId for search
                        try {
                          const cityObj = locationCities.find((c: CityOption) => c.id === cityId);
                          const provinceObj = locationProvinces.find((p: LocationOption) => p.code === selectedProvince);
                          if (cityObj && provinceObj) {
                            const res = await regionsApi.resolveRegion({
                              countryCode: locationCountry,
                              provinceCode: selectedProvince,
                              provinceName: provinceObj.name,
                              cityName: cityObj.name,
                              cityLatitude: cityObj.latitude,
                              cityLongitude: cityObj.longitude,
                            });
                            updateFilter('regionId', res.data.id);
                          }
                        } catch (err) {
                          console.error("Failed to resolve city:", err);
                        }
                      } else {
                        // City cleared — fall back to province-level regionId
                        try {
                          const provinceObj = locationProvinces.find((p: LocationOption) => p.code === selectedProvince);
                          if (provinceObj) {
                            const res = await regionsApi.resolveRegion({
                              countryCode: locationCountry,
                              provinceCode: selectedProvince,
                              provinceName: provinceObj.name,
                              cityName: provinceObj.name,
                            });
                            updateFilter('regionId', res.data.id);
                          }
                        } catch (err) {
                          console.error("Failed to resolve province:", err);
                          updateFilter('regionId', '');
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">All Cities</option>
                    {locationCities.map((c: CityOption) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => {
                    updateFilter('availability', e.target.value);
                    if (e.target.value) updateFilter('availableImmediately', false);
                  }}
                  disabled={filters.availableImmediately}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Any Availability</option>
                  {availabilityOptions.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.minExperience}
                    onChange={(e) => updateFilter('minExperience', e.target.value)}
                    placeholder="Min"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    value={filters.maxExperience}
                    onChange={(e) => updateFilter('maxExperience', e.target.value)}
                    placeholder="Max"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>

            {/* Quick Toggle Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => {
                  const newVal = !filters.availableImmediately;
                  updateFilter('availableImmediately', newVal);
                  if (newVal) updateFilter('availability', '');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filters.availableImmediately
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <CheckCircle className={`w-4 h-4 ${filters.availableImmediately ? 'text-green-600' : 'text-gray-400'}`} />
                Available Immediately
              </button>

              <button
                onClick={() => {
                  const next = filters.hasDrivingLicense === true ? '' : filters.hasDrivingLicense === '' ? true : false;
                  updateFilter('hasDrivingLicense', next);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  filters.hasDrivingLicense === true
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : filters.hasDrivingLicense === false
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Car className="w-4 h-4" />
                {filters.hasDrivingLicense === true ? 'Has Licence' : filters.hasDrivingLicense === false ? 'No Licence' : 'Driving Licence'}
              </button>
            </div>

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
            >
              {showMoreFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showMoreFilters ? 'Hide more filters' : 'Show more filters'}
            </button>

            {/* More Filters (collapsible) */}
            {showMoreFilters && (
              <div className="space-y-6 border-t pt-6">
                {/* Certifications & Safety */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Certifications & Safety
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    <button
                      onClick={() => updateFilter('certificationNEN3140', !filters.certificationNEN3140)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        filters.certificationNEN3140
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🏅 NEN 3140
                    </button>
                    <button
                      onClick={() => updateFilter('certificationVCA', !filters.certificationVCA)}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        filters.certificationVCA
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🏅 VCA
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Other certification</label>
                    <input
                      type="text"
                      value={filters.certificationSearch}
                      onChange={(e) => updateFilter('certificationSearch', e.target.value)}
                      placeholder="e.g., First Aid, IPAF, SCC"
                      className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Specializations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {specializationOptions.map((spec: any) => (
                      <button
                        key={spec.value}
                        onClick={() => toggleSpecialization(spec.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          filters.specializations.includes(spec.value)
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {spec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Skills
                  </h3>
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm mb-2"
                  />
                  {filteredSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {filteredSkills.map((skill: any) => (
                        <button
                          key={skill.id}
                          onClick={() => toggleSkill(skill.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            filters.skillIds.includes(skill.id)
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {skill.name}
                          {skill.category && <span className="text-gray-400 ml-1">({skill.category})</span>}
                        </button>
                      ))}
                    </div>
                  )}
                  {filters.skillIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {filters.skillIds.map((id) => {
                        const skill = skills.find((s: any) => s.id === id);
                        return (
                          <span key={id} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs flex items-center gap-1">
                            {skill?.name || id}
                            <button onClick={() => toggleSkill(id)} className="hover:text-purple-900">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Language */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Language
                  </h3>
                  <div className="flex gap-3 items-end">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Language</label>
                      <select
                        value={filters.language}
                        onChange={(e) => updateFilter('language', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      >
                        <option value="">Any Language</option>
                        <option value="Dutch">Dutch</option>
                        <option value="English">English</option>
                        <option value="Polish">Polish</option>
                        <option value="Romanian">Romanian</option>
                        <option value="German">German</option>
                        <option value="Portuguese">Portuguese</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Minimum Level</label>
                      <select
                        value={filters.languageMinLevel}
                        onChange={(e) => updateFilter('languageMinLevel', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        disabled={!filters.language}
                      >
                        <option value="">Any Level</option>
                        {languageLevels.map((level: any) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Work Authorization */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Work Authorization
                  </h3>
                  <select
                    value={filters.workAuthorization}
                    onChange={(e) => updateFilter('workAuthorization', e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">Any Authorization</option>
                    {workAuthOptions.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employment Type */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Employment Type
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {employmentTypeOptions.map((opt: any) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleEmploymentType(opt.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          filters.employmentTypes.includes(opt.value)
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Apply Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={applyFilters}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="w-4 h-4" />
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading workers...</div>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workers found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search filters</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} workers
            </div>

            {/* Worker Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker) => (
                <div
                  key={worker.publicId}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{worker.headline || worker.publicId}</h3>
                      <p className="text-sm text-gray-600">{worker.primaryTrade || "General Worker"}</p>
                      {worker.specializations && worker.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {worker.specializations.slice(0, 2).map((spec) => (
                            <span key={spec} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                              {SPECIALIZATION_LABELS[spec] || spec.replace(/_/g, " ")}
                            </span>
                          ))}
                          {worker.specializations.length > 2 && (
                            <span className="text-xs text-gray-400">+{worker.specializations.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(worker.availability)}`}>
                      {worker.availability === "IMMEDIATE" ? "Immediate" : worker.availability.replace("_", " ")}
                    </div>
                  </div>

                  {/* Badges */}
                  {worker.badges && worker.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {worker.badges.slice(0, 4).map((badge) => (
                        <span key={badge} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                          {badge.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                      ))}
                      {worker.badges.length > 4 && (
                        <span className="text-xs text-gray-400">+{worker.badges.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="space-y-2 mb-3">
                    {worker.region && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {worker.region.name}
                      </div>
                    )}
                    {worker.yearsOfExperience !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        {worker.yearsOfExperience} years experience
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4" />
                      Reputation: {worker.reputationScore}/100
                    </div>
                  </div>

                  {/* Mobility & Auth */}
                  {(worker.hasDrivingLicense || worker.hasOwnVehicle || worker.workAuthorization) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {worker.hasDrivingLicense && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          <Car className="w-3 h-3" /> Licence
                        </span>
                      )}
                      {worker.hasOwnVehicle && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          🚙 Vehicle
                        </span>
                      )}
                      {worker.workAuthorization && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {getWorkAuthLabel(worker.workAuthorization)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Skills */}
                  {worker.skills.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {worker.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {worker.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{worker.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile completeness */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Profile completeness</span>
                      <span>{worker.profileCompletenessPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${worker.profileCompletenessPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Active {new Date(worker.lastActive).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Link
                      href={`/workers/${encodeURIComponent(worker.publicId)}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm font-medium"
                    >
                      View Profile
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={(e) => handleCreateOffer(e, worker.publicId)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Create Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => searchWorkers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => searchWorkers(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}