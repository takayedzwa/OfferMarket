"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { workersApi, enumsApi, regionsApi } from "../../../lib/api";
import {
  ArrowLeft, Save, ChevronDown, ChevronUp,
  Plus, X, Car, Shield, GraduationCap, Briefcase,
  Globe, Award, Languages, User
} from "lucide-react";

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

interface ProfileSkill {
  id: string;
  skillId: string;
  level: string;
  yearsOfExperience?: number;
  isPrimary: boolean;
  skill?: { id: string; name: string; category?: string };
}

interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  certificationNumber?: string;
  validFrom?: string;
  validUntil?: string;
  isLifetime?: boolean;
}

interface WorkerLanguage {
  id: string;
  language: string;
  level: string;
}

interface Education {
  id: string;
  qualification: string;
  institution?: string;
  country?: string;
  yearCompleted?: number;
}

interface ProjectExperience {
  id: string;
  projectType: string;
  industry: string;
  durationMonths?: number;
  responsibilities?: string[];
  description?: string;
  startDate?: string;
  endDate?: string;
}

type SectionKey =
  | "basicInfo"
  | "location"
  | "salary"
  | "skills"
  | "certifications"
  | "languages"
  | "education"
  | "projects"
  | "privacy";

const SKILL_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  EXPERT: "Expert",
  MASTER: "Master",
};

const LANGUAGE_OPTIONS = [
  "Dutch", "English", "German", "French", "Spanish", "Italian", "Polish",
  "Turkish", "Arabic", "Russian", "Portuguese", "Mandarin",
];

const LANGUAGE_LEVEL_OPTIONS = [
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper Intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficient" },
  { value: "NATIVE", label: "Native" },
];

export default function EditWorkerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingSection, setSavingSection] = useState<string | null>(null);

  // Enum data
  const [trades, setTrades] = useState<any[]>([]);
  const [workScheduleOptions, setWorkScheduleOptions] = useState<EnumOption[]>([]);
  const [industryOptions, setIndustryOptions] = useState<EnumOption[]>([]);
  const [careerPriorityOptions, setCareerPriorityOptions] = useState<EnumOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<EnumOption[]>([]);
  const [specializationOptions, setSpecializationOptions] = useState<EnumOption[]>([]);
  const [workAuthorizationOptions, setWorkAuthorizationOptions] = useState<EnumOption[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [skillsCatalog, setSkillsCatalog] = useState<any[]>([]);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    new Set(["basicInfo", "location", "salary"])
  );

  // Sub-resource state
  const [profileSkills, setProfileSkills] = useState<ProfileSkill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [languages, setLanguages] = useState<WorkerLanguage[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [projectExperiences, setProjectExperiences] = useState<ProjectExperience[]>([]);

  // Add-form state
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillText, setNewSkillText] = useState("");
  const [newSkillId, setNewSkillId] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("INTERMEDIATE");
  const [newSkillYears, setNewSkillYears] = useState(0);
  const [newSkillIsPrimary, setNewSkillIsPrimary] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  const [newCert, setNewCert] = useState({ name: "", issuingBody: "", certificationNumber: "", validFrom: "", validUntil: "", isLifetime: false });
  const [showAddLang, setShowAddLang] = useState(false);
  const [newLang, setNewLang] = useState({ language: "Dutch", level: "B2" });
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEdu, setNewEdu] = useState({ qualification: "", institution: "", country: "NL", yearCompleted: "" });
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ projectType: "", industry: "", durationMonths: "", description: "" });

  const [formData, setFormData] = useState({
    // Basic Info
    headline: "",
    summary: "",
    primaryTrade: "",
    availability: Availability.IMMEDIATE,
    yearsOfExperience: 0,
    noticePeriodDays: 0,
    specializations: [] as string[],
    // Location & Mobility
    postalCode: "",
    regionId: "",
    travelDistanceKm: 30,
    hasDrivingLicense: false,
    hasOwnVehicle: false,
    workAuthorization: "",
    // Salary & Employment
    desiredSalaryMin: 50000,
    desiredSalaryMax: 70000,
    desiredHourlyRate: 0,
    employmentTypes: ["FULL_TIME"] as string[],
    workSchedulePrefs: [] as string[],
    industryPrefs: [] as string[],
    careerPriorities: [] as string[],
    // Privacy
    profileVisibility: "ALL_VERIFIED" as "ALL_VERIFIED" | "SELECTED_COMPANIES" | "HIDDEN",
  });

  const toggleSection = useCallback((key: SectionKey) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Load all data on mount
  useEffect(() => {
    workersApi.getTrades()
      .then((res) => setTrades(res.data.trades || []))
      .catch(() => setTrades([{ value: "Electrician", label: "Electrician", available: true }]));

    enumsApi.getWorkSchedule()
      .then((res) => setWorkScheduleOptions(res.data))
      .catch(() => setWorkScheduleOptions([
        { value: "STANDARD", label: "Standard" },
        { value: "FLEXIBLE", label: "Flexible" },
        { value: "WEEKEND", label: "Weekend" },
        { value: "EVENING", label: "Evening" },
        { value: "ROTATING", label: "Rotating" },
      ]));

    enumsApi.getIndustry()
      .then((res) => setIndustryOptions(res.data))
      .catch(() => setIndustryOptions([
        { value: "CONSTRUCTION", label: "Construction" },
        { value: "INDUSTRIAL", label: "Industrial" },
        { value: "RESIDENTIAL", label: "Residential" },
        { value: "COMMERCIAL", label: "Commercial" },
        { value: "INFRASTRUCTURE", label: "Infrastructure" },
        { value: "ENERGY", label: "Energy" },
        { value: "TELECOM", label: "Telecom" },
      ]));

    enumsApi.getCareerPriority()
      .then((res) => setCareerPriorityOptions(res.data))
      .catch(() => setCareerPriorityOptions([
        { value: "WORK_LIFE_BALANCE", label: "Work Life Balance" },
        { value: "HIGH_SALARY", label: "High Salary" },
        { value: "CAREER_GROWTH", label: "Career Growth" },
        { value: "REMOTE_FLEXIBILITY", label: "Remote Flexibility" },
        { value: "JOB_SECURITY", label: "Job Security" },
        { value: "IMPACTFUL_WORK", label: "Impactful Work" },
      ]));

    enumsApi.getEmploymentType()
      .then((res) => setEmploymentTypeOptions(res.data))
      .catch(() => setEmploymentTypeOptions([
        { value: "FULL_TIME", label: "Full-time" },
        { value: "PART_TIME", label: "Part-time" },
        { value: "FREELANCE", label: "Freelance" },
        { value: "CONTRACT", label: "Contract" },
      ]));

    enumsApi.getSpecialization()
      .then((res) => setSpecializationOptions(res.data))
      .catch(() => setSpecializationOptions([
        { value: "INDUSTRIAL_INSTALLATIONS", label: "Industrial Installations" },
        { value: "RESIDENTIAL_ELECTRICAL", label: "Residential Electrical" },
        { value: "SOLAR_PV", label: "Solar PV" },
        { value: "PLC_SYSTEMS", label: "PLC Systems" },
        { value: "RENEWABLE_ENERGY", label: "Renewable Energy" },
        { value: "DATA_CENTERS", label: "Data Centers" },
      ]));

    enumsApi.getWorkAuthorization()
      .then((res) => setWorkAuthorizationOptions(res.data))
      .catch(() => setWorkAuthorizationOptions([
        { value: "EU_CITIZEN", label: "EU Citizen" },
        { value: "DUTCH_WORK_PERMIT", label: "Dutch Work Permit" },
        { value: "SCHENGEN_VISA", label: "Schengen Visa" },
        { value: "OTHER", label: "Other" },
      ]));

    regionsApi.getRegions()
      .then((res) => setRegions(res.data || []))
      .catch(() => {});

    workersApi.getSkillsCatalog()
      .then((res) => {
        const data = res.data;
        // API might return array directly or wrapped in { skills: [...] }
        const skills = Array.isArray(data) ? data : (data.skills || data.items || []);
        setSkillsCatalog(skills);
      })
      .catch(() => {});

    // Load profile data
    workersApi.getMyProfile()
      .then((res) => {
        const p = res.data;
        setFormData({
          headline: p.headline || "",
          summary: p.summary || "",
          primaryTrade: p.primaryTrade || "",
          availability: p.availability || Availability.IMMEDIATE,
          yearsOfExperience: p.yearsOfExperience || 0,
          noticePeriodDays: p.noticePeriodDays || 0,
          specializations: p.specializations || [],
          postalCode: p.postalCode || "",
          regionId: p.regionId || "",
          travelDistanceKm: p.travelDistanceKm || 30,
          hasDrivingLicense: p.hasDrivingLicense || false,
          hasOwnVehicle: p.hasOwnVehicle || false,
          workAuthorization: p.workAuthorization || "",
          desiredSalaryMin: p.desiredSalaryMin || 50000,
          desiredSalaryMax: p.desiredSalaryMax || 70000,
          desiredHourlyRate: p.desiredHourlyRate || 0,
          employmentTypes: p.employmentTypes || ["FULL_TIME"],
          workSchedulePrefs: p.workSchedulePrefs || [],
          industryPrefs: p.industryPrefs || [],
          careerPriorities: p.careerPriorities || [],
          profileVisibility: p.profileVisibility || "ALL_VERIFIED",
        });
        setProfileSkills(p.skills || []);
        setCertifications(p.certifications || []);
        setLanguages(p.languages || []);
        setEducation(p.education || []);
        setProjectExperiences(p.projectExperiences || []);
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
      });
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await workersApi.updateProfile(formData);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // When user selects or types a skill, resolve it to a catalog ID (or keep custom text)
  const handleSkillTextChange = (text: string) => {
    setNewSkillText(text);
    // Check if it matches a catalog skill
    const match = skillsCatalog.find((s: any) => s.name && s.name.toLowerCase() === text.toLowerCase());
    if (match) {
      setNewSkillId(match.id);
    } else {
      setNewSkillId(""); // custom text, no catalog match
    }
  };

  const handleSkillCatalogSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      setNewSkillId(selectedId);
      const skill = skillsCatalog.find((s: any) => s.id === selectedId);
      if (skill) {
        setNewSkillText(skill.name || "");
      }
    }
  };

  // --- Sub-resource handlers ---

  const handleAddSkill = async () => {
    if (!newSkillId && !newSkillText.trim()) return;
    try {
      setSavingSection("skills");
      const payload: any = {
        level: newSkillLevel,
      };
      if (newSkillId) {
        payload.skillId = newSkillId;
      } else {
        payload.name = newSkillText.trim();
      }
      if (newSkillYears > 0) payload.yearsOfExperience = newSkillYears;
      if (newSkillIsPrimary) payload.isPrimary = true;
      await workersApi.addSkill(payload);
      const res = await workersApi.getMyProfile();
      setProfileSkills(res.data.skills || []);
      setShowAddSkill(false);
      setNewSkillText("");
      setNewSkillId("");
      setNewSkillLevel("INTERMEDIATE");
      setNewSkillYears(0);
      setNewSkillIsPrimary(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add skill");
    } finally {
      setSavingSection(null);
    }
  };

  const handleRemoveSkill = async (id: string) => {
    try {
      await workersApi.removeSkill(id);
      setProfileSkills((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove skill");
    }
  };

  const handleAddCertification = async () => {
    if (!newCert.name || !newCert.issuingBody) return;
    try {
      setSavingSection("certifications");
      await workersApi.addCertification(newCert);
      const res = await workersApi.getMyProfile();
      setCertifications(res.data.certifications || []);
      setShowAddCert(false);
      setNewCert({ name: "", issuingBody: "", certificationNumber: "", validFrom: "", validUntil: "", isLifetime: false });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add certification");
    } finally {
      setSavingSection(null);
    }
  };

  const handleRemoveCertification = async (id: string) => {
    try {
      await workersApi.removeCertification(id);
      setCertifications((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove certification");
    }
  };

  const handleAddLanguage = async () => {
    try {
      setSavingSection("languages");
      await workersApi.addLanguage(newLang);
      const res = await workersApi.getMyProfile();
      setLanguages(res.data.languages || []);
      setShowAddLang(false);
      setNewLang({ language: "Dutch", level: "B2" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add language");
    } finally {
      setSavingSection(null);
    }
  };

  const handleRemoveLanguage = async (id: string) => {
    try {
      await workersApi.removeLanguage(id);
      setLanguages((prev) => prev.filter((l) => l.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove language");
    }
  };

  const handleAddEducation = async () => {
    if (!newEdu.qualification) return;
    try {
      setSavingSection("education");
      const payload: any = { qualification: newEdu.qualification };
      if (newEdu.institution) payload.institution = newEdu.institution;
      if (newEdu.country) payload.country = newEdu.country;
      if (newEdu.yearCompleted) payload.yearCompleted = parseInt(newEdu.yearCompleted);
      await workersApi.addEducation(payload);
      const res = await workersApi.getMyProfile();
      setEducation(res.data.education || []);
      setShowAddEdu(false);
      setNewEdu({ qualification: "", institution: "", country: "NL", yearCompleted: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add education");
    } finally {
      setSavingSection(null);
    }
  };

  const handleRemoveEducation = async (id: string) => {
    try {
      await workersApi.removeEducation(id);
      setEducation((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove education");
    }
  };

  const handleAddProject = async () => {
    if (!newProject.projectType || !newProject.industry) return;
    try {
      setSavingSection("projects");
      const payload: any = { projectType: newProject.projectType, industry: newProject.industry };
      if (newProject.durationMonths) payload.durationMonths = parseInt(newProject.durationMonths);
      if (newProject.description) payload.description = newProject.description;
      await workersApi.addProjectExperience(payload);
      const res = await workersApi.getMyProfile();
      setProjectExperiences(res.data.projectExperiences || []);
      setShowAddProject(false);
      setNewProject({ projectType: "", industry: "", durationMonths: "", description: "" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add project");
    } finally {
      setSavingSection(null);
    }
  };

  const handleRemoveProject = async (id: string) => {
    try {
      await workersApi.removeProjectExperience(id);
      setProjectExperiences((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove project");
    }
  };

  // Derive whether a section is open (useful for rendering)
  const isOpen = (key: SectionKey) => openSections.has(key);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
              <p className="text-sm text-gray-500">Update your worker profile</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
        )}

        {/* ===== Basic Info ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("basicInfo")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Basic Info</h3>
            </div>
            {isOpen("basicInfo") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("basicInfo") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => updateField("headline", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="e.g., Senior Industrial Electrician"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About / Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => updateField("summary", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Tell employers about your experience and strengths..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Trade / Profession</label>
                <select
                  value={formData.primaryTrade}
                  onChange={(e) => updateField("primaryTrade", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">Select trade...</option>
                  {trades.map((trade) => (
                    trade.available ? (
                      <option key={trade.value} value={trade.value}>{trade.label}</option>
                    ) : (
                      <option key={trade.value} value={trade.value} disabled>{trade.label} {trade.comingSoon && "(Coming Soon)"}</option>
                    )
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {specializationOptions.map((spec) => (
                    <label key={spec.value} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec.value)}
                        onChange={(e) => {
                          const specs = e.target.checked
                            ? [...formData.specializations, spec.value]
                            : formData.specializations.filter((s) => s !== spec.value);
                          updateField("specializations", specs);
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                      />
                      {spec.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => updateField("availability", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value={Availability.IMMEDIATE}>Immediately</option>
                    <option value={Availability.ONE_MONTH}>In 1 month</option>
                    <option value={Availability.THREE_MONTHS}>In 3 months</option>
                    <option value={Availability.SIX_MONTHS}>In 6 months</option>
                    <option value={Availability.NOT_AVAILABLE}>Not available</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period (days)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.noticePeriodDays}
                    onChange={(e) => updateField("noticePeriodDays", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.yearsOfExperience}
                  onChange={(e) => updateField("yearsOfExperience", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* ===== Location & Mobility ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("location")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Location & Mobility</h3>
            </div>
            {isOpen("location") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("location") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="1234 AB"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={formData.regionId}
                    onChange={(e) => updateField("regionId", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">Select region...</option>
                    {regions.map((region: any) => (
                      <option key={region.id} value={region.id}>
                        {region.province ? `${region.name} (${region.province})` : region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Radius (km)</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={formData.travelDistanceKm}
                  onChange={(e) => updateField("travelDistanceKm", parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Willing to work within {formData.travelDistanceKm} km of your location
                </p>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.hasDrivingLicense}
                    onChange={(e) => updateField("hasDrivingLicense", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  Has Driving Licence
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={formData.hasOwnVehicle}
                    onChange={(e) => updateField("hasOwnVehicle", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  Has Own Vehicle
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Authorization</label>
                <select
                  value={formData.workAuthorization}
                  onChange={(e) => updateField("workAuthorization", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">Select...</option>
                  {workAuthorizationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ===== Salary & Employment ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("salary")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Salary & Employment</h3>
            </div>
            {isOpen("salary") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("salary") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (€/year)</label>
                  <input
                    type="number"
                    min="20000"
                    max="200000"
                    step="1000"
                    value={formData.desiredSalaryMin}
                    onChange={(e) => updateField("desiredSalaryMin", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (€/year)</label>
                  <input
                    type="number"
                    min="20000"
                    max="200000"
                    step="1000"
                    value={formData.desiredSalaryMax}
                    onChange={(e) => updateField("desiredSalaryMax", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desired Hourly Rate (€)</label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="5"
                  value={formData.desiredHourlyRate}
                  onChange={(e) => updateField("desiredHourlyRate", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="0 if not specified"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employment Types</label>
                <div className="flex flex-wrap gap-2">
                  {employmentTypeOptions.map((type) => (
                    <label key={type.value} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.employmentTypes.includes(type.value)}
                        onChange={(e) => {
                          const types = e.target.checked
                            ? [...formData.employmentTypes, type.value]
                            : formData.employmentTypes.filter((t) => t !== type.value);
                          updateField("employmentTypes", types);
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                      />
                      {type.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Schedule Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {workScheduleOptions.map((schedule) => (
                    <label key={schedule.value} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.workSchedulePrefs.includes(schedule.value)}
                        onChange={(e) => {
                          const prefs = e.target.checked
                            ? [...formData.workSchedulePrefs, schedule.value]
                            : formData.workSchedulePrefs.filter((p) => p !== schedule.value);
                          updateField("workSchedulePrefs", prefs);
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                      />
                      {schedule.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry Preferences</label>
                <div className="flex flex-wrap gap-2">
                  {industryOptions.map((industry) => (
                    <label key={industry.value} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.industryPrefs.includes(industry.value)}
                        onChange={(e) => {
                          const prefs = e.target.checked
                            ? [...formData.industryPrefs, industry.value]
                            : formData.industryPrefs.filter((p) => p !== industry.value);
                          updateField("industryPrefs", prefs);
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                      />
                      {industry.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Career Priorities</label>
                <div className="flex flex-wrap gap-2">
                  {careerPriorityOptions.map((priority) => (
                    <label key={priority.value} className="flex items-center gap-1.5 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.careerPriorities.includes(priority.value)}
                        onChange={(e) => {
                          const priorities = e.target.checked
                            ? [...formData.careerPriorities, priority.value]
                            : formData.careerPriorities.filter((p) => p !== priority.value);
                          updateField("careerPriorities", priorities);
                        }}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                      />
                      {priority.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== Skills ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("skills")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Skills ({profileSkills.length})</h3>
            </div>
            {isOpen("skills") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("skills") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              {profileSkills.length > 0 && (
                <div className="space-y-2">
                  {profileSkills.map((ps) => (
                    <div key={ps.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{ps.skill?.name || ps.skillId}</span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {SKILL_LEVEL_LABELS[ps.level] || ps.level}
                        </span>
                        {ps.isPrimary && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">Primary</span>
                        )}
                        {ps.yearsOfExperience ? (
                          <span className="text-sm text-gray-500">{ps.yearsOfExperience} yrs</span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(ps.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showAddSkill ? (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                    {/* Combo: text input for free text + datalist for catalog suggestions */}
                    <input
                      list="skill-suggestions"
                      type="text"
                      value={newSkillText}
                      onChange={(e) => handleSkillTextChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      placeholder="Type a skill or select from list..."
                    />
                    <datalist id="skill-suggestions">
                      {skillsCatalog.map((skill: any) => (
                        <option key={skill.id} value={skill.name} />
                      ))}
                    </datalist>
                    {newSkillText && !newSkillId && (
                      <p className="mt-1 text-xs text-amber-600">
                        Custom skill — will be added as "{newSkillText}"
                      </p>
                    )}
                    {newSkillId && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Matched from skills catalog
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <select
                        value={newSkillLevel}
                        onChange={(e) => setNewSkillLevel(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      >
                        {Object.entries(SKILL_LEVEL_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years Exp</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={newSkillYears}
                        onChange={(e) => setNewSkillYears(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={newSkillIsPrimary}
                          onChange={(e) => setNewSkillIsPrimary(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        Primary skill
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      disabled={savingSection === "skills" || (!newSkillId && !newSkillText.trim())}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      {savingSection === "skills" ? "Adding..." : "Add Skill"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddSkill(false); setNewSkillText(""); setNewSkillId(""); setNewSkillLevel("INTERMEDIATE"); setNewSkillYears(0); setNewSkillIsPrimary(false); }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddSkill(true)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add Skill
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== Certifications ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("certifications")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Certifications ({certifications.length})</h3>
            </div>
            {isOpen("certifications") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("certifications") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              {certifications.length > 0 && (
                <div className="space-y-2">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{cert.name}</span>
                        <span className="text-sm text-gray-500 ml-2">by {cert.issuingBody}</span>
                        {cert.isLifetime && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Lifetime</span>}
                      </div>
                      <button type="button" onClick={() => handleRemoveCertification(cert.id)} className="text-red-500 hover:text-red-700 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showAddCert ? (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name *</label>
                      <input type="text" value={newCert.name} onChange={(e) => setNewCert((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g., NEN 3140" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Body *</label>
                      <input type="text" value={newCert.issuingBody} onChange={(e) => setNewCert((prev) => ({ ...prev, issuingBody: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g., ISO" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certification Number</label>
                    <input type="text" value={newCert.certificationNumber} onChange={(e) => setNewCert((prev) => ({ ...prev, certificationNumber: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Optional" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                      <input type="date" value={newCert.validFrom} onChange={(e) => setNewCert((prev) => ({ ...prev, validFrom: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                      <input type="date" value={newCert.validUntil} onChange={(e) => setNewCert((prev) => ({ ...prev, validUntil: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={newCert.isLifetime} onChange={(e) => setNewCert((prev) => ({ ...prev, isLifetime: e.target.checked }))} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                    Lifetime certification (no expiry)
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddCertification} disabled={savingSection === "certifications" || !newCert.name || !newCert.issuingBody} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                      {savingSection === "certifications" ? "Adding..." : "Add Certification"}
                    </button>
                    <button type="button" onClick={() => { setShowAddCert(false); setNewCert({ name: "", issuingBody: "", certificationNumber: "", validFrom: "", validUntil: "", isLifetime: false }); }} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAddCert(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" /> Add Certification
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== Languages ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("languages")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Languages ({languages.length})</h3>
            </div>
            {isOpen("languages") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("languages") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              {languages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="font-medium text-gray-900">{lang.language}</span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">{lang.level}</span>
                      <button type="button" onClick={() => handleRemoveLanguage(lang.id)} className="text-red-500 hover:text-red-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showAddLang ? (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select value={newLang.language} onChange={(e) => setNewLang((prev) => ({ ...prev, language: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                        {LANGUAGE_OPTIONS.map((l) => (<option key={l} value={l}>{l}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <select value={newLang.level} onChange={(e) => setNewLang((prev) => ({ ...prev, level: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none">
                        {LANGUAGE_LEVEL_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddLanguage} disabled={savingSection === "languages"} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                      {savingSection === "languages" ? "Adding..." : "Add Language"}
                    </button>
                    <button type="button" onClick={() => { setShowAddLang(false); setNewLang({ language: "Dutch", level: "B2" }); }} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAddLang(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h--4" /> Add Language
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== Education ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("education")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Education ({education.length})</h3>
            </div>
            {isOpen("education") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("education") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              {education.length > 0 && (
                <div className="space-y-2">
                  {education.map((edu) => (
                    <div key={edu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{edu.qualification}</span>
                        {edu.institution && <span className="text-sm text-gray-500 ml-2">at {edu.institution}</span>}
                        {edu.yearCompleted && <span className="text-sm text-gray-400 ml-2">({edu.yearCompleted})</span>}
                      </div>
                      <button type="button" onClick={() => handleRemoveEducation(edu.id)} className="text-red-500 hover:text-red-700 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showAddEdu ? (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
                    <input type="text" value={newEdu.qualification} onChange={(e) => setNewEdu((prev) => ({ ...prev, qualification: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g., MBO Electrical Engineering" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                      <input type="text" value={newEdu.institution} onChange={(e) => setNewEdu((prev) => ({ ...prev, institution: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Optional" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input type="text" value={newEdu.country} onChange={(e) => setNewEdu((prev) => ({ ...prev, country: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Completed</label>
                      <input type="number" value={newEdu.yearCompleted} onChange={(e) => setNewEdu((prev) => ({ ...prev, yearCompleted: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="2024" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddEducation} disabled={savingSection === "education" || !newEdu.qualification} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                      {savingSection === "education" ? "Adding..." : "Add Education"}
                    </button>
                    <button type="button" onClick={() => { setShowAddEdu(false); setNewEdu({ qualification: "", institution: "", country: "NL", yearCompleted: "" }); }} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAddEdu(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" /> Add Education
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== Project Experience ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("projects")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Project Experience ({projectExperiences.length})</h3>
            </div>
            {isOpen("projects") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("projects") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              {projectExperiences.length > 0 && (
                <div className="space-y-2">
                  {projectExperiences.map((proj) => (
                    <div key={proj.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{proj.projectType}</span>
                        <span className="text-sm text-gray-500 ml-2">in {proj.industry}</span>
                        {proj.durationMonths && <span className="text-sm text-gray-400 ml-2">({proj.durationMonths} months)</span>}
                        {proj.description && <p className="text-sm text-gray-600 mt-1">{proj.description}</p>}
                      </div>
                      <button type="button" onClick={() => handleRemoveProject(proj.id)} className="text-red-500 hover:text-red-700 p-1 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showAddProject ? (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Type *</label>
                      <input type="text" value={newProject.projectType} onChange={(e) => setNewProject((prev) => ({ ...prev, projectType: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g., New Construction" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
                      <input type="text" value={newProject.industry} onChange={(e) => setNewProject((prev) => ({ ...prev, industry: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="e.g., Industrial" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                      <input type="number" value={newProject.durationMonths} onChange={(e) => setNewProject((prev) => ({ ...prev, durationMonths: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Optional" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={newProject.description} onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Brief description of the project and your role..." />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleAddProject} disabled={savingSection === "projects" || !newProject.projectType || !newProject.industry} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                      {savingSection === "projects" ? "Adding..." : "Add Project"}
                    </button>
                    <button type="button" onClick={() => { setShowAddProject(false); setNewProject({ projectType: "", industry: "", durationMonths: "", description: "" }); }} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setShowAddProject(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" /> Add Project Experience
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== Privacy ===== */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("privacy")}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">Privacy & Visibility</h3>
            </div>
            {isOpen("privacy") ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {isOpen("privacy") && (
            <div className="px-6 pb-6 space-y-4 border-t">
              <div className="space-y-3">
                {(["ALL_VERIFIED", "SELECTED_COMPANIES", "HIDDEN"] as const).map((visibility) => (
                  <label key={visibility} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="profileVisibility"
                      value={visibility}
                      checked={formData.profileVisibility === visibility}
                      onChange={(e) => updateField("profileVisibility", e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {visibility === "ALL_VERIFIED" ? "All Verified Employers" :
                         visibility === "SELECTED_COMPANIES" ? "Selected Companies Only" : "Hidden"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {visibility === "ALL_VERIFIED" ? "Any verified employer can discover your profile" :
                         visibility === "SELECTED_COMPANIES" ? "Only employers you approve can view your profile" :
                         "Your profile is hidden from discovery"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Privacy Guarantee</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ Your identity is hidden until you accept an offer</li>
                  <li>✓ Employers only see anonymized profile data</li>
                  <li>✓ Your contact info is never shared automatically</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Save Profile Button */}
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Profile Changes"}
        </button>
      </main>
    </div>
  );
}