"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { workersApi } from "../../../lib/api";
import { ArrowLeft, ArrowRight } from "lucide-react";

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

const steps = [
  { id: 1, title: "Basic Info", description: "Availability and experience" },
  { id: 2, title: "Trade & Skills", description: "Primary trade and skills" },
  { id: 3, title: "Preferences", description: "Location, salary, and work preferences" },
  { id: 4, title: "Privacy", description: "Profile visibility settings" },
];

export default function SetupWorkerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trades, setTrades] = useState<any[]>([]);

  // Load available trades from backend and pre-populate user data
  useEffect(() => {
    workersApi.getTrades()
      .then((res) => setTrades(res.data.trades || []))
      .catch(() => {
        // Fallback if API fails
        setTrades([
          { value: "Electrician", label: "Electrician", available: true },
        ]);
      });

    // Pre-populate with saved user data from registration
    const savedPhone = localStorage.getItem('userPhone');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail && !formData.postalCode) {
      // Could use email to infer region if needed
    }
  }, []);

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    availability: Availability.IMMEDIATE,
    yearsOfExperience: 0,
    primaryTrade: "",
    noticePeriodDays: 0,

    // Step 2: Skills (stored but sent separately via skills API)
    skills: [] as { skillId: string; level: SkillLevel }[],
    certifications: [] as { name: string; issuer: string; date: string }[],

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

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Map frontend fields to backend DTO
      const profileData: any = {
        availability: formData.availability,
        yearsOfExperience: formData.yearsOfExperience,
        primaryTrade: formData.primaryTrade,
        noticePeriodDays: formData.noticePeriodDays,
        postalCode: formData.postalCode || undefined,
        regionId: formData.regionId || undefined,
        desiredSalaryMin: formData.desiredSalaryMin,
        desiredSalaryMax: formData.desiredSalaryMax,
        employmentTypes: formData.employmentTypes,
        travelDistanceKm: formData.travelDistanceKm,
        workSchedulePrefs: formData.workSchedulePrefs,
        industryPrefs: formData.industryPrefs,
        careerPriorities: formData.careerPriorities,
        profileVisibility: formData.profileVisibility,
      };

      // Try to get existing profile first
      try {
        await workersApi.getMyProfile();
        // Profile exists, use update
        await workersApi.updateProfile(profileData);
      } catch (checkErr: any) {
        if (checkErr.response?.status === 404) {
          // No profile exists, create new one
          await workersApi.createProfile(profileData);
        } else {
          throw checkErr;
        }
      }

      router.push("/dashboard/worker");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create profile");
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
                Availability (When can you start?)
              </label>
              <select
                value={formData.availability}
                onChange={(e) => updateField("availability", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value={Availability.IMMEDIATE}>Immediately</option>
                <option value={Availability.ONE_MONTH}>In 1 month</option>
                <option value={Availability.THREE_MONTHS}>In 3 months</option>
                <option value={Availability.SIX_MONTHS}>In 6 months</option>
                <option value={Availability.NOT_AVAILABLE}>Not available</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
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
                Primary Trade / Profession
              </label>
              <input
                type="text"
                value={formData.primaryTrade}
                onChange={(e) => updateField("primaryTrade", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="e.g., Software Engineer, Plumber, Electrician"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notice Period (days)
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
                Primary Trade / Profession *
              </label>
              <select
                value={formData.primaryTrade}
                onChange={(e) => updateField("primaryTrade", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="">Select your trade</option>
                {trades.map((trade) => (
                  trade.available ? (
                    <option key={trade.value} value={trade.value}>
                      {trade.label}
                    </option>
                  ) : (
                    <option key={trade.value} value={trade.value} disabled>
                      {trade.label} {trade.comingSoon && "(Coming Soon)"}
                    </option>
                  )
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Currently available for Electricians. More trades coming soon.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Skills</p>
              <p className="text-sm text-blue-700">
                Add your key skills. This helps employers find and match with your profile.
                <br/>
                <span className="text-xs">(Note: Skills are managed separately in the full implementation)</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  const skillName = prompt("Enter skill name:");
                  if (skillName) {
                    updateField("skills", [
                      ...formData.skills,
                      { skillId: skillName, level: SkillLevel.INTERMEDIATE },
                    ]);
                  }
                }}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add a skill (demo: enter skill name)
              </button>
              {formData.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                    >
                      {s.skillId} ({s.level.toLowerCase()})
                    </span>
                  ))}
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
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="1234 AB"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region (optional)
                </label>
                <input
                  type="text"
                  value={formData.regionId}
                  onChange={(e) => updateField("regionId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="e.g., Amsterdam"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Radius / Travel Distance (km)
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
                You are willing to work or be found by employers within {formData.travelDistanceKm} km of your location
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Desired Salary (€)
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
                  Max Desired Salary (€)
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
                Employment Types
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.employmentTypes.includes("FULL_TIME")}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...formData.employmentTypes, "FULL_TIME"]
                        : formData.employmentTypes.filter((t) => t !== "FULL_TIME");
                      updateField("employmentTypes", types);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Full-time</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.employmentTypes.includes("PART_TIME")}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...formData.employmentTypes, "PART_TIME"]
                        : formData.employmentTypes.filter((t) => t !== "PART_TIME");
                      updateField("employmentTypes", types);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Part-time</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.employmentTypes.includes("FREELANCE")}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...formData.employmentTypes, "FREELANCE"]
                        : formData.employmentTypes.filter((t) => t !== "FREELANCE");
                      updateField("employmentTypes", types);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Freelance</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.employmentTypes.includes("CONTRACT")}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...formData.employmentTypes, "CONTRACT"]
                        : formData.employmentTypes.filter((t) => t !== "CONTRACT");
                      updateField("employmentTypes", types);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Contract</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Visibility
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Control which employers can discover your profile
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
                    <p className="font-medium text-gray-900">All Verified Employers</p>
                    <p className="text-sm text-gray-600">Any verified employer can discover and view your profile</p>
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
                    <p className="font-medium text-gray-900">Selected Companies Only</p>
                    <p className="text-sm text-gray-600">Only employers you approve can view your profile</p>
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
                    <p className="font-medium text-gray-900">Hidden</p>
                    <p className="text-sm text-gray-600">Your profile is hidden from discovery</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Career Priorities (optional)
              </label>
              <div className="space-y-2">
                {["WORK_LIFE_BALANCE", "HIGH_SALARY", "CAREER_GROWTH", "REMOTE_FLEXIBILITY", "JOB_SECURITY", "IMPACTFUL_WORK"].map((priority) => (
                  <label key={priority} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.careerPriorities.includes(priority)}
                      onChange={(e) => {
                        const priorities = e.target.checked
                          ? [...formData.careerPriorities, priority]
                          : formData.careerPriorities.filter((p) => p !== priority);
                        updateField("careerPriorities", priorities);
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                    />
                    {priority.replace(/_/g, " ")}
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Privacy Guarantee</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✓ Your identity is hidden until you accept an offer</li>
                <li>✓ Employers only see anonymized profile data</li>
                <li>✓ Your contact info is never shared automatically</li>
                <li>✓ Blocked companies cannot see your profile</li>
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
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Create Your Profile</h1>
                <p className="text-sm text-gray-500">Step {currentStep} of {steps.length}</p>
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
              Sign Out
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
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(steps.length, s + 1))}
              disabled={currentStep === 2 && !formData.primaryTrade}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.primaryTrade}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Profile..." : "Create Profile"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
