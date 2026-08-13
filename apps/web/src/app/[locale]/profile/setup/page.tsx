"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { workersApi, enumsApi, regionsApi } from "@/lib/api";
import { getCountries, getProvinces, getCities, getDefaultCountryCode, type LocationOption, type CityOption } from "@/lib/location";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";

// Enums matching backend Prisma definitions
enum Availability {
  IMMEDIATE = "IMMEDIATE",
  ONE_MONTH = "ONE_MONTH",
  THREE_MONTHS = "THREE_MONTHS",
  SIX_MONTHS = "SIX_MONTHS",
  NOT_AVAILABLE = "NOT_AVAILABLE",
}

enum SkillLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
  MASTER = "MASTER",
}

interface EnumOption {
  value: string;
  label: string;
  description?: string;
}

const SKILL_LEVEL_VALUES: string[] = [
  "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT", "MASTER",
];

export default function SetupWorkerProfile() {
  const router = useRouter();
  const t = useTranslations("profile.setup");
  const tEnums = useTranslations("enums");
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trades, setTrades] = useState<any[]>([]);
  const [workScheduleOptions, setWorkScheduleOptions] = useState<EnumOption[]>([]);
  const [industryOptions, setIndustryOptions] = useState<EnumOption[]>([]);
  const [careerPriorityOptions, setCareerPriorityOptions] = useState<EnumOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<EnumOption[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<any[]>([]);

  // Location state (Country → Province → City cascading dropdowns)
  const [selectedCountry, setSelectedCountry] = useState(getDefaultCountryCode());
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);

  // Add-form state for skills
  const [newSkillId, setNewSkillId] = useState("");
  const [newSkillText, setNewSkillText] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState<string>("INTERMEDIATE");

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    availability: Availability.IMMEDIATE,
    yearsOfExperience: 0,
    primaryTrade: "",
    noticePeriodDays: 0,

    // Step 2: Skills (collected locally, sent via separate API after profile creation).
    // Each entry is either a catalog skill (skillId) or a custom skill (name);
    // the backend creates the catalog entry on the fly when `name` is sent.
    skills: [] as { skillId?: string; name?: string; level: string }[],

    // Step 3: Preferences
    postalCode: "",
    regionId: "",
    desiredSalaryMin: 50000,
    desiredSalaryMax: 70000,
    employmentTypes: ["FULL_TIME"],
    travelDistanceKm: 30,
    workSchedulePrefs: [] as string[],
    industryPrefs: [] as string[],
    careerPriorities: [] as string[],

    // Step 4: Privacy
    profileVisibility: "ALL_VERIFIED" as "ALL_VERIFIED" | "SELECTED_COMPANIES" | "HIDDEN",
  });

  const steps = [
    { id: 1, title: t("step1Title"), description: t("step1Desc") },
    { id: 2, title: t("step2Title"), description: t("step2Desc") },
    { id: 3, title: t("step3Title"), description: t("step3Desc") },
    { id: 4, title: t("step4Title"), description: t("step4Desc") },
  ];

  // Load enums and trades from backend
  useEffect(() => {
    workersApi.getTrades()
      .then((res) => setTrades(res.data.trades || []))
      .catch(() => {
        setTrades([{ value: "Electrician", label: "Electrician", available: true }]);
      });

    enumsApi.getWorkSchedule()
      .then((res) => setWorkScheduleOptions(res.data))
      .catch(() => {
        setWorkScheduleOptions([
          { value: "STANDARD", label: "Standard" },
          { value: "FLEXIBLE", label: "Flexible" },
          { value: "WEEKEND", label: "Weekend" },
          { value: "EVENING", label: "Evening" },
          { value: "ROTATING", label: "Rotating" },
        ]);
      });

    enumsApi.getIndustry()
      .then((res) => setIndustryOptions(res.data))
      .catch(() => {
        setIndustryOptions([
          { value: "CONSTRUCTION", label: "Construction" },
          { value: "INDUSTRIAL", label: "Industrial" },
          { value: "RESIDENTIAL", label: "Residential" },
          { value: "COMMERCIAL", label: "Commercial" },
          { value: "INFRASTRUCTURE", label: "Infrastructure" },
          { value: "ENERGY", label: "Energy" },
          { value: "TELECOM", label: "Telecom" },
        ]);
      });

    enumsApi.getCareerPriority()
      .then((res) => setCareerPriorityOptions(res.data))
      .catch(() => {
        setCareerPriorityOptions([
          { value: "WORK_LIFE_BALANCE", label: "Work Life Balance" },
          { value: "HIGH_SALARY", label: "High Salary" },
          { value: "CAREER_GROWTH", label: "Career Growth" },
          { value: "REMOTE_FLEXIBILITY", label: "Remote Flexibility" },
          { value: "JOB_SECURITY", label: "Job Security" },
          { value: "IMPACTFUL_WORK", label: "Impactful Work" },
        ]);
      });

    enumsApi.getEmploymentType()
      .then((res) => setEmploymentTypeOptions(res.data))
      .catch(() => {
        setEmploymentTypeOptions([
          { value: "FULL_TIME", label: "Full-time" },
          { value: "PART_TIME", label: "Part-time" },
          { value: "FREELANCE", label: "Freelance" },
          { value: "CONTRACT", label: "Contract" },
        ]);
      });

    // Load provinces for location dropdown
    setProvinces(getProvinces(getDefaultCountryCode()));

    // Load skills catalog for dropdown
    workersApi.getSkillsCatalog()
      .then((res) => setSkillsCatalog(res.data || []))
      .catch(() => {
        setSkillsCatalog([]);
      });
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // As the user types a skill, match it against the catalog so an existing
  // skill is referenced by id (avoiding duplicates in the catalog) while a
  // non-matching value is sent as a custom `name` for the backend to create.
  const handleSkillTextChange = (text: string) => {
    setNewSkillText(text);
    const match = skillsCatalog.find((s: any) => s.name && s.name.toLowerCase() === text.toLowerCase());
    setNewSkillId(match ? match.id : "");
  };

  const handleAddSkill = () => {
    const trimmed = newSkillText.trim();
    if (!newSkillId && !trimmed) return;
    if (newSkillId) {
      // Prevent duplicates
      if (formData.skills.some((s) => s.skillId === newSkillId)) return;
      updateField("skills", [...formData.skills, { skillId: newSkillId, level: newSkillLevel }]);
    } else {
      if (formData.skills.some((s) => s.name?.toLowerCase() === trimmed.toLowerCase())) return;
      updateField("skills", [...formData.skills, { name: trimmed, level: newSkillLevel }]);
    }
    setNewSkillId("");
    setNewSkillText("");
    setNewSkillLevel("INTERMEDIATE");
  };

  const handleRemoveSkill = (key: string) => {
    updateField("skills", formData.skills.filter((s) => (s.skillId || s.name) !== key));
  };

  const skillLevelLabel = (level: string) => {
    try { return tEnums(`skillLevel.${level}` as never); } catch { return level; }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Resolve location to a regionId via the backend
      let regionId = formData.regionId || undefined;
      if (selectedProvince && selectedCity) {
        const provinceObj = provinces.find((p: LocationOption) => p.code === selectedProvince);
        const cityObj = cities.find((c: CityOption) => c.id === selectedCity);
        if (provinceObj && cityObj) {
          try {
            const countryObj = getCountries().find((c: LocationOption) => c.code === selectedCountry);
            const res = await regionsApi.resolveRegion({
              countryCode: selectedCountry,
              countryName: countryObj?.name || selectedCountry,
              provinceCode: selectedProvince,
              provinceName: provinceObj.name,
              cityName: cityObj.name,
              cityLatitude: cityObj.latitude,
              cityLongitude: cityObj.longitude,
            });
            regionId = res.data.id;
          } catch (err) {
            console.error("Failed to resolve region:", err);
          }
        }
      } else if (selectedProvince && !selectedCity) {
        const provinceObj = provinces.find((p: LocationOption) => p.code === selectedProvince);
        if (provinceObj) {
          try {
            const countryObj = getCountries().find((c: LocationOption) => c.code === selectedCountry);
            const res = await regionsApi.resolveRegion({
              countryCode: selectedCountry,
              countryName: countryObj?.name || selectedCountry,
              provinceCode: selectedProvince,
              provinceName: provinceObj.name,
              cityName: provinceObj.name,
            });
            regionId = res.data.id;
          } catch (err) {
            console.error("Failed to resolve region:", err);
          }
        }
      }

      // Map frontend fields to backend DTO
      const profileData: any = {
        availability: formData.availability,
        yearsOfExperience: formData.yearsOfExperience,
        primaryTrade: formData.primaryTrade,
        noticePeriodDays: formData.noticePeriodDays,
        postalCode: formData.postalCode || undefined,
        regionId,
        desiredSalaryMin: formData.desiredSalaryMin,
        desiredSalaryMax: formData.desiredSalaryMax,
        employmentTypes: formData.employmentTypes,
        travelDistanceKm: formData.travelDistanceKm,
        workSchedulePrefs: formData.workSchedulePrefs,
        industryPrefs: formData.industryPrefs,
        careerPriorities: formData.careerPriorities,
        profileVisibility: formData.profileVisibility,
      };

      // Create or update profile
      try {
        await workersApi.getMyProfile();
        await workersApi.updateProfile(profileData);
      } catch (checkErr: any) {
        if (checkErr.response?.status === 404) {
          await workersApi.createProfile(profileData);
        } else {
          throw checkErr;
        }
      }

      // Send skills via separate API calls (after profile exists)
      for (const skill of formData.skills) {
        try {
          const payload: { skillId?: string; name?: string; level: string } = { level: skill.level };
          if (skill.skillId) payload.skillId = skill.skillId;
          else if (skill.name) payload.name = skill.name;
          await workersApi.addSkill(payload);
        } catch (e) {
          console.error("Failed to add skill:", skill.skillId || skill.name, e);
          // Continue with other skills — don't block profile creation
        }
      }

      router.push("/dashboard/worker");
    } catch (err: any) {
      setError(err.response?.data?.message || t("errCreate"));
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("availabilityLabel")}
              </label>
              <select
                value={formData.availability}
                onChange={(e) => updateField("availability", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value={Availability.IMMEDIATE}>{t("selectAvailabilityImmediate")}</option>
                <option value={Availability.ONE_MONTH}>{t("selectAvailabilityOneMonth")}</option>
                <option value={Availability.THREE_MONTHS}>{t("selectAvailabilityThreeMonths")}</option>
                <option value={Availability.SIX_MONTHS}>{t("selectAvailabilitySixMonths")}</option>
                <option value={Availability.NOT_AVAILABLE}>{t("selectAvailabilityNotAvailable")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelYearsExp")}
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={formData.yearsOfExperience}
                onChange={(e) => updateField("yearsOfExperience", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelPrimaryTrade")}
              </label>
              <input
                type="text"
                value={formData.primaryTrade}
                onChange={(e) => updateField("primaryTrade", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder={t("placeholderPrimaryTrade")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelNoticePeriod")}
              </label>
              <input
                type="number"
                min="0"
                max="90"
                value={formData.noticePeriodDays}
                onChange={(e) => updateField("noticePeriodDays", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelPrimaryTradeRequired")}
              </label>
              <select
                value={formData.primaryTrade}
                onChange={(e) => updateField("primaryTrade", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="">{t("selectTrade")}</option>
                {trades.map((trade) => (
                  trade.available ? (
                    <option key={trade.value} value={trade.value}>
                      {trade.label}
                    </option>
                  ) : (
                    <option key={trade.value} value={trade.value} disabled>
                      {trade.label} {trade.comingSoon && t("comingSoon")}
                    </option>
                  )
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {t("tradeNote")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelSkills")}
              </label>
              <p className="text-sm text-gray-500 mb-3">
                {t("skillsHint")}
              </p>

              {/* Add skill form */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t("labelSkill")}</label>
                    {/* Combo: free-text input with catalog suggestions via datalist.
                        The catalog may be empty (e.g. fresh DB), so the user can
                        type any skill; the backend creates the catalog entry from
                        `name` when there's no `skillId` match. */}
                    <input
                      list="skill-suggestions"
                      type="text"
                      value={newSkillText}
                      onChange={(e) => handleSkillTextChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                      placeholder={t("placeholderSkillInput")}
                    />
                    <datalist id="skill-suggestions">
                      {skillsCatalog.map((skill: any) => (
                        <option key={skill.id} value={skill.name} />
                      ))}
                    </datalist>
                    {newSkillText && !newSkillId && (
                      <p className="mt-1 text-xs text-amber-600">
                        {t("customSkillNote", { name: newSkillText })}
                      </p>
                    )}
                    {newSkillId && (
                      <p className="mt-1 text-xs text-green-600">
                        {t("matchedCatalog")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t("labelLevel")}</label>
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm"
                    >
                      {SKILL_LEVEL_VALUES.map((key) => (
                        <option key={key} value={key}>{skillLevelLabel(key)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={!newSkillId && !newSkillText.trim()}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> {t("addSkill")}
                </button>
              </div>

              {/* Skill chips */}
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((s) => {
                    const skillName = s.name || skillsCatalog.find((sk: any) => sk.id === s.skillId)?.name || s.skillId || s.name;
                    return (
                      <span
                        key={s.skillId || s.name}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {skillName}
                        <span className="text-xs text-blue-500">({skillLevelLabel(s.level)})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s.skillId || s.name || "")}
                          className="text-blue-400 hover:text-blue-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelCountry")}
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => {
                    const country = e.target.value;
                    setSelectedCountry(country);
                    setSelectedProvince("");
                    setSelectedCity("");
                    setProvinces(getProvinces(country));
                    setCities([]);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  {getCountries().map((c: LocationOption) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelProvince")}
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => {
                    const prov = e.target.value;
                    setSelectedProvince(prov);
                    setSelectedCity("");
                    if (prov) {
                      setCities(getCities(prov, selectedCountry));
                    } else {
                      setCities([]);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">{t("selectProvince")}</option>
                  {provinces.map((p: LocationOption) => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelCity")}
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  disabled={!selectedProvince}
                >
                  <option value="">{t("selectCity")}</option>
                  {cities.map((c: CityOption) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelPostalCode")}
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder={t("placeholderPostalCode")}
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelWorkRadius")}
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={formData.travelDistanceKm}
                onChange={(e) => updateField("travelDistanceKm", parseInt(e.target.value) || 30)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                {t("workRadiusHint", { km: formData.travelDistanceKm })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelMinSalary")}
                </label>
                <input
                  type="number"
                  min="20000"
                  max="200000"
                  step="1000"
                  value={formData.desiredSalaryMin}
                  onChange={(e) => updateField("desiredSalaryMin", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelMaxSalary")}
                </label>
                <input
                  type="number"
                  min="20000"
                  max="200000"
                  step="1000"
                  value={formData.desiredSalaryMax}
                  onChange={(e) => updateField("desiredSalaryMax", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelEmploymentTypes")}
              </label>
              <div className="space-y-2">
                {employmentTypeOptions.map((type) => (
                  <label key={type.value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.employmentTypes.includes(type.value)}
                      onChange={(e) => {
                        const types = e.target.checked
                          ? [...formData.employmentTypes, type.value]
                          : formData.employmentTypes.filter((t) => t !== type.value);
                        updateField("employmentTypes", types);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelWorkSchedule")}
              </label>
              <div className="space-y-2">
                {workScheduleOptions.map((schedule) => (
                  <label key={schedule.value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.workSchedulePrefs.includes(schedule.value)}
                      onChange={(e) => {
                        const prefs = e.target.checked
                          ? [...formData.workSchedulePrefs, schedule.value]
                          : formData.workSchedulePrefs.filter((p) => p !== schedule.value);
                        updateField("workSchedulePrefs", prefs);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                    />
                    {schedule.label}
                    {schedule.description && (
                      <span className="text-xs text-gray-500 ml-1">- {schedule.description}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelIndustryPrefs")}
              </label>
              <div className="space-y-2">
                {industryOptions.map((industry) => (
                  <label key={industry.value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.industryPrefs.includes(industry.value)}
                      onChange={(e) => {
                        const prefs = e.target.checked
                          ? [...formData.industryPrefs, industry.value]
                          : formData.industryPrefs.filter((p) => p !== industry.value);
                        updateField("industryPrefs", prefs);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                    />
                    {industry.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelProfileVisibility")}
              </label>
              <p className="text-sm text-gray-500 mb-3">
                {t("visControlHint")}
              </p>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="ALL_VERIFIED"
                    checked={formData.profileVisibility === "ALL_VERIFIED"}
                    onChange={(e) => updateField("profileVisibility", e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{t("visAllVerified")}</p>
                    <p className="text-sm text-gray-600">{t("visDescAllVerified")}</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="SELECTED_COMPANIES"
                    checked={formData.profileVisibility === "SELECTED_COMPANIES"}
                    onChange={(e) => updateField("profileVisibility", e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{t("visSelected")}</p>
                    <p className="text-sm text-gray-600">{t("visDescSelected")}</p>
                    {formData.profileVisibility === "SELECTED_COMPANIES" && (
                      <p className="text-sm text-yellow-700 mt-2 bg-yellow-50 p-2 rounded">
                        {t("visSelectedWarning")}
                      </p>
                    )}
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="profileVisibility"
                    value="HIDDEN"
                    checked={formData.profileVisibility === "HIDDEN"}
                    onChange={(e) => updateField("profileVisibility", e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{t("visHidden")}</p>
                    <p className="text-sm text-gray-600">{t("visDescHidden")}</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelCareerPriorities")}
              </label>
              <div className="space-y-2">
                {careerPriorityOptions.map((priority) => (
                  <label key={priority.value} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.careerPriorities.includes(priority.value)}
                      onChange={(e) => {
                        const priorities = e.target.checked
                          ? [...formData.careerPriorities, priority.value]
                          : formData.careerPriorities.filter((p) => p !== priority.value);
                        updateField("careerPriorities", priorities);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                    />
                    {priority.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">{t("privacyGuarantee")}</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>{t("privacy1")}</li>
                <li>{t("privacy2")}</li>
                <li>{t("privacy3")}</li>
                <li>{t("privacy4")}</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard/worker")}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title={t("backToDashboard")}
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{t("headerTitle")}</h1>
                <p className="text-sm text-gray-500">{t("stepOf", { current: currentStep, total: steps.length })}</p>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                router.push("/login");
              }}
              className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
            >
              {t("signOut")}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <div
                  className={`text-xs font-medium ${
                    currentStep >= step.id ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-400 hidden sm:block">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("previous")}
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(steps.length, s + 1))}
              disabled={currentStep === 2 && !formData.primaryTrade}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.primaryTrade}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("creating") : t("create")}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}