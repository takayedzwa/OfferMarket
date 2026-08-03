"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import Navbar from "@/components/Navbar";
import { workersApi, enumsApi, regionsApi } from "@/lib/api";
import { getProvinces, getCities, getDefaultCountryCode, COUNTRY_NAMES, type LocationOption, type CityOption } from "@/lib/location";
import {
  Search, Filter, X, MapPin, Briefcase, Star, ArrowRight,
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Car,
  Shield, Globe, CheckCircle, Award,
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
  languages?: { language: string; level: string }[];
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

// Specialization values that map to the `enums.specialization` namespace.
const SPECIALIZATION_KEYS = [
  "RESIDENTIAL_INSTALLATIONS",
  "COMMERCIAL_INSTALLATIONS",
  "INDUSTRIAL_INSTALLATIONS",
  "MAINTENANCE",
  "HIGH_VOLTAGE",
  "LOW_VOLTAGE",
  "SOLAR_PV",
  "EV_CHARGING",
  "CONTROL_PANELS",
  "PLC_SYSTEMS",
  "AUTOMATION",
  "BUILDING_MANAGEMENT",
  "FIRE_ALARM_SYSTEMS",
  "SECURITY_SYSTEMS",
  "DATA_CABLING",
  "MARINE_ELECTRICAL",
  "RENEWABLE_ENERGY",
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WorkersSearch() {
  const t = useTranslations("workers.search");
  const tEnums = useTranslations("enums");
  const { date } = useFormat();
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
  const [locationError, setLocationError] = useState("");
  const [availabilityOptions, setAvailabilityOptions] = useState<any[]>([]);
  const [specializationOptions, setSpecializationOptions] = useState<any[]>([]);
  const [workAuthOptions, setWorkAuthOptions] = useState<any[]>([]);
  const [languageLevels, setLanguageLevels] = useState<any[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  // Resolve a specialization value to a localized label via the enums
  // namespace; falls back to a humanized value for unknown keys.
  const specializationLabel = (spec: string) => {
    if (SPECIALIZATION_KEYS.includes(spec as any)) {
      return tEnums(`specialization.${spec}` as any);
    }
    return spec.replace(/_/g, " ");
  };

  // Resolve an enum value to a localized label via the enums namespace, with
  // fallback to a provided option label or humanized value.
  const enumLabel = (namespace: "availability" | "workAuth" | "employmentType", value: string, fallback?: string) => {
    try {
      return tEnums(`${namespace}.${value}` as any);
    } catch {
      return fallback || value.replace(/_/g, " ");
    }
  };

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

    if (f.language) {
      params.language = f.language;
      if (f.languageMinLevel) {
        params.languageMinLevel = f.languageMinLevel;
      }
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
      .catch(() => setSpecializationOptions(SPECIALIZATION_KEYS.map((value) => ({ value, label: specializationLabel(value) }))));

    workersApi.getSkillsCatalog()
      .then((res) => setSkills(res.data || []))
      .catch(() => {});

    enumsApi.getAvailability()
      .then((res) => setAvailabilityOptions(res.data))
      .catch(() => setAvailabilityOptions([
        { value: "IMMEDIATE", label: tEnums("availability.IMMEDIATE") },
        { value: "ONE_MONTH", label: tEnums("availability.ONE_MONTH") },
        { value: "THREE_MONTHS", label: tEnums("availability.THREE_MONTHS") },
        { value: "SIX_MONTHS", label: tEnums("availability.SIX_MONTHS") },
        { value: "NOT_AVAILABLE", label: tEnums("availability.NOT_AVAILABLE") },
      ]));

    enumsApi.getWorkAuthorization()
      .then((res) => setWorkAuthOptions(res.data))
      .catch(() => setWorkAuthOptions([
        { value: 'EU_CITIZEN', label: tEnums("workAuth.EU_CITIZEN") },
        { value: 'DUTCH_WORK_PERMIT', label: tEnums("workAuth.DUTCH_WORK_PERMIT") },
        { value: 'HIGHLY_SKILLED_MIGRANT', label: tEnums("workAuth.HIGHLY_SKILLED_MIGRANT") },
        { value: 'REQUIRES_SPONSORSHIP', label: tEnums("workAuth.REQUIRES_SPONSORSHIP") },
      ]));

    enumsApi.getLanguageLevel()
      .then((res) => setLanguageLevels(res.data))
      .catch(() => setLanguageLevels([
        { value: 'A1', label: tEnums("languageLevel.A1") },
        { value: 'A2', label: tEnums("languageLevel.A2") },
        { value: 'B1', label: tEnums("languageLevel.B1") },
        { value: 'B2', label: tEnums("languageLevel.B2") },
        { value: 'C1', label: tEnums("languageLevel.C1") },
        { value: 'C2', label: tEnums("languageLevel.C2") },
        { value: 'NATIVE', label: tEnums("languageLevel.NATIVE") },
      ]));

    enumsApi.getEmploymentType()
      .then((res) => setEmploymentTypeOptions(res.data))
      .catch(() => setEmploymentTypeOptions([
        { value: 'FULL_TIME', label: tEnums("employmentType.FULL_TIME") },
        { value: 'PART_TIME', label: tEnums("employmentType.PART_TIME") },
        { value: 'FREELANCE', label: tEnums("employmentType.FREELANCE") },
        { value: 'CONTRACT', label: tEnums("employmentType.CONTRACT") },
        { value: 'TEMPORARY', label: tEnums("employmentType.TEMPORARY") },
        { value: 'INTERNSHIP', label: tEnums("employmentType.INTERNSHIP") },
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
    setLocationError("");
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
        ? prev.employmentTypes.filter((tt) => tt !== value)
        : [...prev.employmentTypes, value],
    }));
  };

  // Build active filter chips
  const getActiveChips = () => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.trade) {
      const tr = trades.find((tt: any) => tt.value === filters.trade);
      chips.push({ key: 'trade', label: t("chipTrade", { label: tr?.label || filters.trade }), onRemove: () => updateFilter('trade', '') });
    }
    if (filters.regionId) {
      const cityName = selectedCity ? locationCities.find((c: CityOption) => c.id === selectedCity)?.name : null;
      const provinceName = selectedProvince ? locationProvinces.find((p: LocationOption) => p.code === selectedProvince)?.name : null;
      const locationLabel = cityName ? `${cityName}, ${provinceName}` : provinceName || filters.regionId;
      chips.push({ key: 'region', label: t("chipLocation", { label: locationLabel }), onRemove: () => {
        updateFilter('regionId', '');
        setSelectedProvince('');
        setSelectedCity('');
        setLocationCities([]);
      }});
    }
    if (filters.availableImmediately) {
      chips.push({ key: 'immediate', label: t("availableImmediately"), onRemove: () => updateFilter('availableImmediately', false) });
    } else if (filters.availability) {
      const a = availabilityOptions.find((opt: any) => opt.value === filters.availability);
      chips.push({ key: 'availability', label: enumLabel("availability", filters.availability, a?.label), onRemove: () => updateFilter('availability', '') });
    }
    if (filters.minExperience) {
      chips.push({ key: 'minExp', label: t("minExperience", { years: filters.minExperience }), onRemove: () => updateFilter('minExperience', '') });
    }
    if (filters.maxExperience) {
      chips.push({ key: 'maxExp', label: t("maxExperience", { years: filters.maxExperience }), onRemove: () => updateFilter('maxExperience', '') });
    }
    if (filters.hasDrivingLicense === true) {
      chips.push({ key: 'driving', label: t("hasDrivingLicence"), onRemove: () => updateFilter('hasDrivingLicense', '') });
    }
    if (filters.hasDrivingLicense === false) {
      chips.push({ key: 'noDriving', label: t("noDrivingLicence"), onRemove: () => updateFilter('hasDrivingLicense', '') });
    }
    filters.specializations.forEach((spec) => {
      chips.push({
        key: `spec-${spec}`,
        label: specializationLabel(spec),
        onRemove: () => toggleSpecialization(spec),
      });
    });
    if (filters.workAuthorization) {
      const wa = workAuthOptions.find((w: any) => w.value === filters.workAuthorization);
      chips.push({ key: 'workAuth', label: enumLabel("workAuth", filters.workAuthorization, wa?.label), onRemove: () => updateFilter('workAuthorization', '') });
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
    if (filters.language) {
      if (filters.languageMinLevel) {
        const level = languageLevels.find((l: any) => l.value === filters.languageMinLevel);
        chips.push({
          key: 'language',
          label: `${filters.language} ${level?.label || filters.languageMinLevel}+`,
          onRemove: () => { updateFilter('language', ''); updateFilter('languageMinLevel', ''); },
        });
      } else {
        chips.push({
          key: 'language',
          label: `${filters.language}`,
          onRemove: () => { updateFilter('language', ''); },
        });
      }
    }
    filters.employmentTypes.forEach((et) => {
      const etOpt = employmentTypeOptions.find((e: any) => e.value === et);
      chips.push({
        key: `et-${et}`,
        label: enumLabel("employmentType", et, etOpt?.label),
        onRemove: () => toggleEmploymentType(et),
      });
    });

    return chips;
  };

  const activeChips = getActiveChips();
  const hasActiveFilters = activeChips.length > 0;

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
              <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
              <p className="text-gray-600 mt-1">{t("subtitle")}</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              {t("filters")}
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
                {t("clearAll")}
              </button>
            )}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t("searchFilters")}</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                {t("clearAll")}
              </button>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("tradeProfession")}
                </label>
                <select
                  value={filters.trade}
                  onChange={(e) => updateFilter('trade', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">{t("allTrades")}</option>
                  {trades.map((trade: any) => (
                    <option key={trade.value} value={trade.value}>
                      {trade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("locationProvince")}
                </label>
                <select
                  value={selectedProvince}
                  onChange={async (e) => {
                    const prov = e.target.value;
                    setSelectedProvince(prov);
                    setSelectedCity("");
                    setLocationCities(prov ? getCities(prov, locationCountry) : []);
                    setLocationError("");
                    if (prov) {
                      // Resolve province to a regionId for search
                      try {
                        const provinceObj = locationProvinces.find((p: LocationOption) => p.code === prov);
                        if (provinceObj) {
                          const res = await regionsApi.resolveRegion({
                            countryCode: locationCountry,
                            countryName: COUNTRY_NAMES[locationCountry],
                            provinceCode: prov,
                            provinceName: provinceObj.name,
                            cityName: provinceObj.name, // province-level search
                          });
                          updateFilter('regionId', res.data.id);
                        }
                      } catch (err) {
                        console.error("Failed to resolve province:", err);
                        setLocationError(t("locationError"));
                        updateFilter('regionId', '');
                      }
                    } else {
                      updateFilter('regionId', '');
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">{t("allLocations")}</option>
                  {locationProvinces.map((p: LocationOption) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProvince && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("city")}
                  </label>
                  <select
                    value={selectedCity}
                    onChange={async (e) => {
                      const cityId = e.target.value;
                      setSelectedCity(cityId);
                      setLocationError("");
                      if (cityId) {
                        // Resolve city to a regionId for search
                        try {
                          const cityObj = locationCities.find((c: CityOption) => c.id === cityId);
                          const provinceObj = locationProvinces.find((p: LocationOption) => p.code === selectedProvince);
                          if (cityObj && provinceObj) {
                            const res = await regionsApi.resolveRegion({
                              countryCode: locationCountry,
                              countryName: COUNTRY_NAMES[locationCountry],
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
                          setLocationError(t("locationError"));
                        }
                      } else {
                        // City cleared — fall back to province-level regionId
                        try {
                          const provinceObj = locationProvinces.find((p: LocationOption) => p.code === selectedProvince);
                          if (provinceObj) {
                            const res = await regionsApi.resolveRegion({
                              countryCode: locationCountry,
                              countryName: COUNTRY_NAMES[locationCountry],
                              provinceCode: selectedProvince,
                              provinceName: provinceObj.name,
                              cityName: provinceObj.name,
                            });
                            updateFilter('regionId', res.data.id);
                          }
                        } catch (err) {
                          console.error("Failed to resolve province:", err);
                          setLocationError(t("locationError"));
                          updateFilter('regionId', '');
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">{t("allCities")}</option>
                    {locationCities.map((c: CityOption) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {locationError && (
                <div className="col-span-full text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {locationError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("availability")}
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
                  <option value="">{t("anyAvailability")}</option>
                  {availabilityOptions.map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("yearsExperience")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.minExperience}
                    onChange={(e) => updateFilter('minExperience', e.target.value)}
                    placeholder={t("min")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    value={filters.maxExperience}
                    onChange={(e) => updateFilter('maxExperience', e.target.value)}
                    placeholder={t("max")}
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
                {t("availableImmediately")}
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
                {filters.hasDrivingLicense === true ? t("hasLicence") : filters.hasDrivingLicense === false ? t("noLicence") : t("drivingLicence")}
              </button>
            </div>

            {/* More Filters Toggle */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
            >
              {showMoreFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showMoreFilters ? t("hideMoreFilters") : t("showMoreFilters")}
            </button>

            {/* More Filters (collapsible) */}
            {showMoreFilters && (
              <div className="space-y-6 border-t pt-6">
                {/* Certifications & Safety */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {t("certsSafety")}
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
                    <label className="block text-sm text-gray-600 mb-1">{t("otherCertification")}</label>
                    <input
                      type="text"
                      value={filters.certificationSearch}
                      onChange={(e) => updateFilter('certificationSearch', e.target.value)}
                      placeholder={t("certPlaceholder")}
                      className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Specializations */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    {t("specializations")}
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
                    {t("skills")}
                  </h3>
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder={t("searchSkills")}
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
                    {t("language")}
                  </h3>
                  <div className="flex gap-3 items-end">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t("language")}</label>
                      <select
                        value={filters.language}
                        onChange={(e) => {
                          updateFilter('language', e.target.value);
                          if (!e.target.value) updateFilter('languageMinLevel', '');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                      >
                        <option value="">{t("anyLanguage")}</option>
                        <option value="Dutch">Dutch</option>
                        <option value="English">English</option>
                        <option value="German">German</option>
                        <option value="French">French</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Italian">Italian</option>
                        <option value="Polish">Polish</option>
                        <option value="Turkish">Turkish</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Russian">Russian</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Mandarin">Mandarin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">{t("minimumLevel")}</label>
                      <select
                        value={filters.languageMinLevel}
                        onChange={(e) => updateFilter('languageMinLevel', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                        disabled={!filters.language}
                      >
                        <option value="">{t("anyLevel")}</option>
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
                    {t("workAuthorization")}
                  </h3>
                  <select
                    value={filters.workAuthorization}
                    onChange={(e) => updateFilter('workAuthorization', e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">{t("anyAuthorization")}</option>
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
                    {t("employmentType")}
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
                {t("applyFilters")}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">{t("loading")}</div>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("noWorkers")}</h3>
            <p className="text-gray-600 mb-4">{t("adjustFilters")}</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t("clearFilters")}
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              {t("showing", {
                from: ((pagination.page - 1) * pagination.limit) + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
              })}
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
                      <p className="text-sm text-gray-600">{worker.primaryTrade || t("generalWorker")}</p>
                      {worker.specializations && worker.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {worker.specializations.slice(0, 2).map((spec) => (
                            <span key={spec} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                              {specializationLabel(spec)}
                            </span>
                          ))}
                          {worker.specializations.length > 2 && (
                            <span className="text-xs text-gray-400">+{worker.specializations.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(worker.availability)}`}>
                      {worker.availability === "IMMEDIATE" ? t("immediate") : enumLabel("availability", worker.availability, worker.availability.replace("_", " "))}
                    </div>
                  </div>

                  {/* Badges */}
                  {worker.badges && worker.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {worker.badges.slice(0, 4).map((badge) => (
                        <span key={badge} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                          {(() => { try { return tEnums(`badge.${badge}` as any); } catch { return badge.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); } })()}
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
                        {worker.region.name}{worker.region.province && worker.region.type === 'CITY' ? `, ${worker.region.province}` : ''}
                      </div>
                    )}
                    {worker.languages && worker.languages.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        <div className="flex flex-wrap gap-1">
                          {worker.languages.slice(0, 3).map((lang: any, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {lang.language} {lang.level}
                            </span>
                          ))}
                          {worker.languages.length > 3 && (
                            <span className="text-xs text-gray-400">+{worker.languages.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {worker.yearsOfExperience !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        {t("yearsExp", { years: worker.yearsOfExperience })}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4" />
                      {t("reputation", { score: worker.reputationScore })}
                    </div>
                  </div>

                  {/* Mobility & Auth */}
                  {(worker.hasDrivingLicense || worker.hasOwnVehicle || worker.workAuthorization) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {worker.hasDrivingLicense && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          <Car className="w-3 h-3" /> {t("licence")}
                        </span>
                      )}
                      {worker.hasOwnVehicle && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                          🚙 {t("vehicle")}
                        </span>
                      )}
                      {worker.workAuthorization && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {enumLabel("workAuth", worker.workAuthorization, worker.workAuthorization.replace(/_/g, " "))}
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
                            {t("moreCount", { count: worker.skills.length - 5 })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile completeness */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>{t("profileCompleteness")}</span>
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
                      {t("activeOn", { date: date(worker.lastActive, { year: "numeric", month: "short", day: "numeric" }) })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Link
                      href={`/workers/${encodeURIComponent(worker.publicId)}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm font-medium"
                    >
                      {t("viewProfile")}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={(e) => handleCreateOffer(e, worker.publicId)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      {t("createOffer")}
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
                  {t("previous")}
                </button>
                <span className="text-sm text-gray-600">
                  {t("pageOf", { page: pagination.page, total: pagination.totalPages })}
                </span>
                <button
                  onClick={() => searchWorkers(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("next")}
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