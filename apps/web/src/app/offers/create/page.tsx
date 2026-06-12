"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { offersApi } from "../../../lib/api";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Euro,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  CheckCircle2,
  X,
  Building2,
} from "lucide-react";

const steps = [
  { id: 1, title: "Job Details", icon: Briefcase },
  { id: 2, title: "Compensation", icon: Euro },
  { id: 3, title: "Contract", icon: Calendar },
  { id: 4, title: "Benefits", icon: Award },
  { id: 5, title: "Work Setup", icon: MapPin },
  { id: 6, title: "Requirements", icon: CheckCircle2 },
];

export default function CreateOfferPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Job Details
    jobTitle: "",
    description: "",
    workerId: "",

    // Compensation
    salaryMin: 60000,
    salaryMax: 80000,
    currency: "EUR",
    equity: 0,
    bonus: 0,
    bonusType: "" as "annual" | "performance" | "signing" | "",

    // Contract
    contractType: "PERMANENT" as "PERMANENT" | "FIXED_TERM" | "FREELANCE" | "CONTRACT",
    durationMonths: 12,
    probationMonths: 2,
    noticePeriodMonths: 1,

    // Benefits
    vacationDays: 25,
    pensionContribution: 5,
    healthInsurance: false,
    travelAllowance: false,
    mealAllowance: false,
    phoneProvided: false,
    laptopProvided: true,
    educationBudget: 0,
    otherBenefits: "",

    // Work Arrangement
    workArrangementType: "HYBRID" as "REMOTE" | "HYBRID" | "ONSITE",
    officeLocation: "",
    remoteDaysPerWeek: 3,
    travelRequired: false,
    relocationAssistance: false,

    // Requirements
    requiredSkills: [] as string[],
    preferredSkills: [] as string[],
    minExperienceYears: 0,
    educationLevel: "" as "HIGH_SCHOOL" | "BACHELOR" | "MASTER" | "PHD" | "",
    languages: [] as { language: string; level: string }[],
    certifications: [] as string[],
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError("");

    try {
      const offerData = buildOfferData();
      await offersApi.createOffer({ ...offerData, status: "DRAFT" });
      router.push("/offers");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const offerData = buildOfferData();
      await offersApi.createOffer({ ...offerData, status: "SUBMITTED" });
      router.push("/offers");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit offer");
    } finally {
      setSubmitting(false);
    }
  };

  const buildOfferData = () => ({
    jobTitle: formData.jobTitle,
    description: formData.description,
    workerId: formData.workerId || undefined,
    compensation: {
      salary: {
        min: formData.salaryMin,
        max: formData.salaryMax,
        currency: formData.currency,
      },
      equity: formData.equity || undefined,
      bonus: formData.bonus
        ? {
            amount: formData.bonus,
            type: formData.bonusType,
          }
        : undefined,
    },
    contract: {
      type: formData.contractType,
      durationMonths: formData.contractType === "FIXED_TERM" ? formData.durationMonths : undefined,
      probationPeriodMonths: formData.probationMonths,
      noticePeriodMonths: formData.noticePeriodMonths,
    },
    benefits: {
      vacationDays: formData.vacationDays,
      pensionContribution: formData.pensionContribution,
      healthInsurance: formData.healthInsurance,
      travelAllowance: formData.travelAllowance,
      mealAllowance: formData.mealAllowance,
      phoneProvided: formData.phoneProvided,
      laptopProvided: formData.laptopProvided,
      educationBudget: formData.educationBudget || undefined,
      otherBenefits: formData.otherBenefits || undefined,
    },
    workArrangement: {
      type: formData.workArrangementType,
      officeLocation: formData.officeLocation || undefined,
      remoteDaysPerWeek:
        formData.workArrangementType !== "ONSITE" ? formData.remoteDaysPerWeek : undefined,
      travelRequired: formData.travelRequired,
      relocationAssistance: formData.relocationAssistance,
    },
    requirements: {
      skills: formData.requiredSkills.map((s) => ({ skill: s, required: true })),
      preferredSkills: formData.preferredSkills.map((s) => ({ skill: s, required: false })),
      minExperienceYears: formData.minExperienceYears,
      educationLevel: formData.educationLevel || undefined,
      languages: formData.languages,
      certifications: formData.certifications,
    },
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => updateField("jobTitle", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Senior Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Worker (optional)
              </label>
              <input
                type="text"
                value={formData.workerId}
                onChange={(e) => updateField("workerId", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="Worker public ID or leave empty for open offer"
              />
              <p className="mt-1 text-sm text-gray-500">
                Leave empty to make this offer visible to all matching workers
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder="Describe the role, responsibilities, team, and company culture..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">Salary Range Rule</p>
              <p className="text-sm text-blue-700">
                The difference between min and max salary must not exceed €5,000
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Salary (€)
                </label>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => updateField("salaryMin", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Salary (€)
                </label>
                <input
                  type="number"
                  value={formData.salaryMax}
                  onChange={(e) => updateField("salaryMax", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {formData.salaryMax - formData.salaryMin > 5000 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                Salary range spread ({(formData.salaryMax - formData.salaryMin).toLocaleString()}€)
                exceeds maximum allowed (€5,000)
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equity / Stock Options (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.equity}
                onChange={(e) => updateField("equity", parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Amount (€)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bonus}
                  onChange={(e) => updateField("bonus", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Type
                </label>
                <select
                  value={formData.bonusType}
                  onChange={(e) =>
                    updateField("bonusType", e.target.value as "annual" | "performance" | "signing")
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">Select type</option>
                  <option value="annual">Annual</option>
                  <option value="performance">Performance</option>
                  <option value="signing">Signing</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contract Type
              </label>
              <select
                value={formData.contractType}
                onChange={(e) =>
                  updateField("contractType", e.target.value as "PERMANENT" | "FIXED_TERM" | "FREELANCE" | "CONTRACT")
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="PERMANENT">Permanent (Indefinite)</option>
                <option value="FIXED_TERM">Fixed Term</option>
                <option value="FREELANCE">Freelance</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            {formData.contractType === "FIXED_TERM" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={formData.durationMonths}
                  onChange={(e) => updateField("durationMonths", parseInt(e.target.value) || 12)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Probation Period (months)
              </label>
              <input
                type="number"
                min="0"
                max="6"
                value={formData.probationMonths}
                onChange={(e) => updateField("probationMonths", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notice Period (months)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={formData.noticePeriodMonths}
                onChange={(e) => updateField("noticePeriodMonths", parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vacation Days
                </label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={formData.vacationDays}
                  onChange={(e) => updateField("vacationDays", parseInt(e.target.value) || 25)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pension Contribution (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.pensionContribution}
                  onChange={(e) =>
                    updateField("pensionContribution", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-3">Standard Benefits</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.healthInsurance}
                    onChange={(e) => updateField("healthInsurance", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Health insurance contribution</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.travelAllowance}
                    onChange={(e) => updateField("travelAllowance", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Travel allowance</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.mealAllowance}
                    onChange={(e) => updateField("mealAllowance", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Meal allowance / Lunch provided</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.phoneProvided}
                    onChange={(e) => updateField("phoneProvided", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Phone provided</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.laptopProvided}
                    onChange={(e) => updateField("laptopProvided", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">Laptop provided</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Budget (€)
              </label>
              <input
                type="number"
                min="0"
                value={formData.educationBudget}
                onChange={(e) => updateField("educationBudget", parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Benefits
              </label>
              <textarea
                value={formData.otherBenefits}
                onChange={(e) => updateField("otherBenefits", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder="Gym membership, flexible hours, etc."
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Arrangement
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => updateField("workArrangementType", "REMOTE")}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    formData.workArrangementType === "REMOTE"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">Remote</div>
                </button>
                <button
                  type="button"
                  onClick={() => updateField("workArrangementType", "HYBRID")}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    formData.workArrangementType === "HYBRID"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Briefcase className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">Hybrid</div>
                </button>
                <button
                  type="button"
                  onClick={() => updateField("workArrangementType", "ONSITE")}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    formData.workArrangementType === "ONSITE"
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-sm font-medium">On-site</div>
                </button>
              </div>
            </div>

            {(formData.workArrangementType === "HYBRID" ||
              formData.workArrangementType === "ONSITE") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Location
                </label>
                <input
                  type="text"
                  value={formData.officeLocation}
                  onChange={(e) => updateField("officeLocation", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="Amsterdam, Netherlands"
                />
              </div>
            )}

            {formData.workArrangementType !== "ONSITE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remote Days per Week
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.remoteDaysPerWeek}
                  onChange={(e) =>
                    updateField("remoteDaysPerWeek", parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.travelRequired}
                  onChange={(e) => updateField("travelRequired", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                />
                <span className="text-sm text-gray-700">Position requires occasional travel</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.relocationAssistance}
                  onChange={(e) => updateField("relocationAssistance", e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                />
                <span className="text-sm text-gray-700">Relocation assistance provided</span>
              </label>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 font-medium mb-2">Required Skills</p>
              <input
                type="text"
                placeholder="Add a skill and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !formData.requiredSkills.includes(value)) {
                      updateField("requiredSkills", [...formData.requiredSkills, value]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
              />
              {formData.requiredSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "requiredSkills",
                            formData.requiredSkills.filter((_, idx) => idx !== i)
                          )
                        }
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Preferred Skills (Nice to Have)</p>
              <input
                type="text"
                placeholder="Add a skill and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = (e.target as HTMLInputElement).value.trim();
                    if (value && !formData.preferredSkills.includes(value)) {
                      updateField("preferredSkills", [...formData.preferredSkills, value]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
              {formData.preferredSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.preferredSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "preferredSkills",
                            formData.preferredSkills.filter((_, idx) => idx !== i)
                          )
                        }
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Years of Experience
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.minExperienceYears}
                onChange={(e) =>
                  updateField("minExperienceYears", parseInt(e.target.value) || 0)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Level
              </label>
              <select
                value={formData.educationLevel}
                onChange={(e) =>
                  updateField("educationLevel", e.target.value as "HIGH_SCHOOL" | "BACHELOR" | "MASTER" | "PHD")
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="">No preference</option>
                <option value="HIGH_SCHOOL">High School</option>
                <option value="BACHELOR">Bachelor's Degree</option>
                <option value="MASTER">Master's Degree</option>
                <option value="PHD">PhD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Certifications
              </label>
              <textarea
                value={formData.certifications.join("\n")}
                onChange={(e) =>
                  updateField(
                    "certifications",
                    e.target.value.split("\n").filter(Boolean)
                  )
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder="One certification per line"
              />
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
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Create New Offer</h1>
                <p className="text-sm text-gray-500">Step {currentStep} of {steps.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={saving || currentStep === 1}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save Draft</span>
              </button>
              {currentStep === steps.length && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.jobTitle || !formData.description}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Submit Offer
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-16 h-1 ${
                        currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
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
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !formData.jobTitle || !formData.description}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Offer"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
