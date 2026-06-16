"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { workersApi, enumsApi } from "../../../lib/api";
import { ArrowLeft, Save } from "lucide-react";

enum Availability {
  IMMEDIATE = "IMMEDIATE",
  ONE_MONTH = "ONE_MONTH",
  THREE_MONTHS = "THREE_MONTHS",
  SIX_MONTHS = "SIX_MONTHS",
  NOT_AVAILABLE = "NOT_AVAILABLE",
}

interface EnumOption {
  value: string;
  label: string;
  description?: string;
}

export default function EditWorkerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [trades, setTrades] = useState<any[]>([]);
  const [workScheduleOptions, setWorkScheduleOptions] = useState<EnumOption[]>([]);
  const [industryOptions, setIndustryOptions] = useState<EnumOption[]>([]);
  const [careerPriorityOptions, setCareerPriorityOptions] = useState<EnumOption[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<EnumOption[]>([]);

  const [formData, setFormData] = useState({
    availability: Availability.IMMEDIATE,
    yearsOfExperience: 0,
    primaryTrade: "",
    noticePeriodDays: 0,
    postalCode: "",
    regionId: "",
    desiredSalaryMin: 50000,
    desiredSalaryMax: 70000,
    employmentTypes: ["FULL_TIME"],
    travelDistanceKm: 30,
    workSchedulePrefs: [] as string[],
    industryPrefs: [] as string[],
    careerPriorities: [] as string[],
    profileVisibility: "ALL_VERIFIED" as "ALL_VERIFIED" | "SELECTED_COMPANIES" | "HIDDEN",
  });

  // Load trades, enums, and current profile
  useEffect(() => {
    // Load available trades
    workersApi.getTrades()
      .then((res) => setTrades(res.data.trades || []))
      .catch(() => {
        setTrades([{ value: "Electrician", label: "Electrician", available: true }]);
      });

    // Load enum options from backend
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

    workersApi.getMyProfile()
      .then((res) => {
        const profile = res.data;
        setFormData({
          availability: profile.availability || Availability.IMMEDIATE,
          yearsOfExperience: profile.yearsOfExperience || 0,
          primaryTrade: profile.primaryTrade || "",
          noticePeriodDays: profile.noticePeriodDays || 0,
          postalCode: profile.postalCode || "",
          regionId: profile.regionId || "",
          desiredSalaryMin: profile.desiredSalaryMin || 50000,
          desiredSalaryMax: profile.desiredSalaryMax || 70000,
          employmentTypes: profile.employmentTypes || ["FULL_TIME"],
          travelDistanceKm: profile.travelDistanceKm || 30,
          workSchedulePrefs: profile.workSchedulePrefs || [],
          industryPrefs: profile.industryPrefs || [],
          careerPriorities: profile.careerPriorities || [],
          profileVisibility: profile.profileVisibility || "ALL_VERIFIED",
        });
      })
      .catch((err) => {
        console.error("Failed to load profile:", err);
      });
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await workersApi.updateProfile(formData);
      setSuccess("Profile updated successfully!");
      setTimeout(() => router.push("/dashboard/worker"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Edit Profile</h1>
              <p className="text-sm text-gray-500">Update your worker profile</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 space-y-6">
          {/* Primary Trade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Trade / Profession
            </label>
            <select
              value={formData.primaryTrade}
              onChange={(e) => updateField("primaryTrade", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            >
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
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
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

          {/* Location */}
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
                City
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
              Work Radius (km)
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

          {/* Years of Experience */}
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

          {/* Notice Period */}
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

          {/* Salary Range */}
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

          {/* Employment Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employment Types
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

          {/* Work Schedule Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Schedule Preferences (optional)
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

          {/* Industry Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry Preferences (optional)
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

          {/* Career Priorities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Career Priorities (optional)
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

          {/* Profile Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Visibility
            </label>
            <div className="space-y-3">
              {["ALL_VERIFIED", "SELECTED_COMPANIES", "HIDDEN"].map((visibility) => (
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
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </main>
    </div>
  );
}
