"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { offersApi, employersApi } from "@/lib/api";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
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
  AlertTriangle,
  Loader,
} from "lucide-react";

const steps = [
  { id: 1, icon: Briefcase },
  { id: 2, icon: Euro },
  { id: 3, icon: Calendar },
  { id: 4, icon: Award },
  { id: 5, icon: MapPin },
  { id: 6, icon: CheckCircle2 },
];

function CreateOfferContent() {
  const router = useRouter();
  const searchParams = useSearchParams()!;
  const { user, logout } = useAuth();
  const t = useTranslations("offers.create");
  const apiError = useApiErrorMessage();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"PENDING" | "VERIFIED" | "EXPIRED" | "REVOKED" | "UNVERIFIED" | null>(null);
  const [loadingVerification, setLoadingVerification] = useState(true);

  // Check employer verification status on mount
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const res = await employersApi.getVerificationStatus();
        const status = res.data.status || res.data.verificationStatus || "UNVERIFIED";
        // Map backend statuses to frontend values
        if (status === "BASIC_VERIFIED" || status === "FULL_VERIFIED" || status === "PREMIUM_VERIFIED") {
          setVerificationStatus("VERIFIED");
        } else if (status === "PENDING") {
          setVerificationStatus("PENDING");
        } else if (status === "REJECTED") {
          setVerificationStatus("EXPIRED");
        } else {
          setVerificationStatus("UNVERIFIED");
        }
      } catch (err) {
        setVerificationStatus("UNVERIFIED");
      } finally {
        setLoadingVerification(false);
      }
    };
    checkVerification();
  }, []);

  // Read workerId from query params on mount
  useEffect(() => {
    const workerIdFromQuery = searchParams.get("workerId");
    if (workerIdFromQuery) {
      // Decode the workerId since it may be URL-encoded (e.g., "Profile #2" becomes "Profile%20%232")
      setFormData(prev => ({ ...prev, workerId: decodeURIComponent(workerIdFromQuery) }));
    }
  }, [searchParams]);

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
    hoursPerWeek: 40,

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
    holidayAllowancePct: 8,
    trainingBudget: 0,
    companyVehicle: "not_provided" as "full_use" | "work_only" | "not_provided",
    travelAllowanceType: "not_provided" as "per_km" | "ns_card" | "monthly" | "not_provided",

    // Work Arrangement
    workArrangementType: "HYBRID" as "REMOTE" | "HYBRID" | "ONSITE",
    officeLocation: "",
    remoteDaysPerWeek: 3,
    travelRequired: false,
    relocationAssistance: false,
    scheduleType: ["daytime"] as string[],
    remoteWorkPct: 50,
    physicalRequirements: "",

    // Requirements
    requiredSkills: [] as string[],
    preferredSkills: [] as string[],
    minExperienceYears: 0,
    educationLevel: "" as "HIGH_SCHOOL" | "BACHELOR" | "MASTER" | "PHD" | "",
    languages: [] as { language: string; level: string }[],
    certifications: [] as string[],
    requiredCertifications: [] as string[],
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
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Check verification status before submitting
    if (verificationStatus !== "VERIFIED") {
      setError(t("verification.submitBlocked"));
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const offerData = buildOfferData();
      await offersApi.createOffer({ ...offerData, status: "SUBMITTED" });
      router.push("/dashboard/employer");
    } catch (err: any) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const buildOfferData = () => ({
    jobTitle: formData.jobTitle,
    jobDescription: formData.description,
    workerId: formData.workerId || undefined,
    compensation: {
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
      salaryPeriod: "year",
      signOnBonus: formData.bonus || 0,
      performanceBonusPct: 0,
    },
    contract: {
      type: formData.contractType.toLowerCase(),
      hoursPerWeek: formData.hoursPerWeek,
      probationMonths: formData.probationMonths,
    },
    benefits: {
      vacationDays: formData.vacationDays,
      holidayAllowancePct: formData.holidayAllowancePct,
      pensionContributionPct: formData.pensionContribution,
      trainingBudget: formData.educationBudget || 0,
      companyVehicle: formData.companyVehicle,
      travelAllowanceType: formData.travelAllowanceType,
      phoneProvided: formData.phoneProvided,
      toolsProvided: formData.laptopProvided,
    },
    workArrangement: {
      scheduleType: formData.scheduleType,
      remoteWorkPct: formData.remoteWorkPct,
      physicalRequirements: formData.physicalRequirements || "None",
    },
    requirements: {
      requiredCertifications: formData.requiredCertifications.length > 0 ? formData.requiredCertifications : ["Relevant trade certification"],
      requiredExperienceYears: formData.minExperienceYears,
    },
  });

  const isSubmitDisabled = loadingVerification ||
    submitting ||
    !formData.jobTitle ||
    !formData.description ||
    verificationStatus !== "VERIFIED";

  const getVerificationMessage = () => {
    if (loadingVerification) return { text: t("verification.checking"), color: "text-gray-600" };
    switch (verificationStatus) {
      case "VERIFIED":
        return { text: t("verification.verified"), color: "text-green-600" };
      case "PENDING":
        return { text: t("verification.pending"), color: "text-yellow-600" };
      case "EXPIRED":
      case "REVOKED":
        return { text: t("verification.expired"), color: "text-red-600" };
      default:
        return { text: t("verification.notVerified"), color: "text-red-600" };
    }
  };

  const verifMsg = getVerificationMessage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title={t("back")}
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{t("brand")}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className={`text-sm ${verifMsg.color} flex items-center gap-1`}>
                {verificationStatus === "VERIFIED" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {verifMsg.text}
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {t("signOut")}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Verification Warning Banner */}
      {verificationStatus !== "VERIFIED" && !loadingVerification && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{t("verification.bannerTitle")}</span>
                <span className="text-yellow-600">-</span>
                <span className="text-yellow-600">{t("verification.bannerText")}</span>
              </div>
              <button
                onClick={() => router.push("/profile/edit-company")}
                className="text-sm text-yellow-800 hover:text-yellow-900 font-medium"
              >
                {t("verification.verifyNow")}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Job Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("jobTitle")}
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={(e) => updateField("jobTitle", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder={t("jobTitlePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("targetWorker")}
                </label>
                <input
                  type="text"
                  value={formData.workerId}
                  onChange={(e) => updateField("workerId", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder={t("targetWorkerPlaceholder")}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t("targetWorkerHint")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("jobDescription")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                  placeholder={t("jobDescriptionPlaceholder")}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t("jobDescriptionHint")}
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Compensation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("minSalary")}
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => updateField("salaryMin", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="60000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("maxSalary")}
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => updateField("salaryMax", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="80000"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {t("salaryHint")}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("signOnBonus")}
                </label>
                <input
                  type="number"
                  value={formData.bonus}
                  onChange={(e) => updateField("bonus", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          {/* Step 3: Contract */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("contractType")}
                </label>
                <select
                  value={formData.contractType}
                  onChange={(e) => updateField("contractType", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="PERMANENT">{t("contractTypes.permanent")}</option>
                  <option value="FIXED_TERM">{t("contractTypes.fixed_term")}</option>
                  <option value="FREELANCE">{t("contractTypes.freelance")}</option>
                  <option value="CONTRACT">{t("contractTypes.contract")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("hoursPerWeek")}
                </label>
                <input
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={(e) => updateField("hoursPerWeek", parseInt(e.target.value) || 40)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="12"
                  max="40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("probationPeriod")}
                </label>
                <input
                  type="number"
                  value={formData.probationMonths}
                  onChange={(e) => updateField("probationMonths", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="0"
                  max="6"
                />
              </div>
            </div>
          )}

          {/* Step 4: Benefits */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("vacationDays")}
                </label>
                <input
                  type="number"
                  value={formData.vacationDays}
                  onChange={(e) => updateField("vacationDays", parseInt(e.target.value) || 25)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="20"
                  max="40"
                />
                <p className="mt-1 text-sm text-gray-500">{t("vacationDaysHint")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("holidayAllowance")}
                </label>
                <input
                  type="number"
                  value={formData.holidayAllowancePct}
                  onChange={(e) => updateField("holidayAllowancePct", parseInt(e.target.value) || 8)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="0"
                  max="12"
                />
                <p className="mt-1 text-sm text-gray-500">{t("holidayAllowanceHint")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("pensionContribution")}
                </label>
                <input
                  type="number"
                  value={formData.pensionContribution}
                  onChange={(e) => updateField("pensionContribution", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="0"
                  max="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("trainingBudget")}
                </label>
                <input
                  type="number"
                  value={formData.educationBudget}
                  onChange={(e) => updateField("educationBudget", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("companyVehicle")}
                </label>
                <select
                  value={formData.companyVehicle}
                  onChange={(e) => updateField("companyVehicle", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="not_provided">{t("companyVehicleOptions.not_provided")}</option>
                  <option value="work_only">{t("companyVehicleOptions.work_only")}</option>
                  <option value="full_use">{t("companyVehicleOptions.full_use")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("travelAllowance")}
                </label>
                <select
                  value={formData.travelAllowanceType}
                  onChange={(e) => updateField("travelAllowanceType", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="not_provided">{t("travelAllowanceOptions.not_provided")}</option>
                  <option value="per_km">{t("travelAllowanceOptions.per_km")}</option>
                  <option value="ns_card">{t("travelAllowanceOptions.ns_card")}</option>
                  <option value="monthly">{t("travelAllowanceOptions.monthly")}</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.phoneProvided}
                    onChange={(e) => updateField("phoneProvided", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">{t("phoneProvided")}</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.laptopProvided}
                    onChange={(e) => updateField("laptopProvided", e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700">{t("laptopProvided")}</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 5: Work Setup */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("workArrangement")}
                </label>
                <select
                  value={formData.workArrangementType}
                  onChange={(e) => updateField("workArrangementType", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="ONSITE">{t("workArrangementOptions.onsite")}</option>
                  <option value="HYBRID">{t("workArrangementOptions.hybrid")}</option>
                  <option value="REMOTE">{t("workArrangementOptions.remote")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("remoteWorkPct")}
                </label>
                <input
                  type="number"
                  value={formData.remoteWorkPct}
                  onChange={(e) => updateField("remoteWorkPct", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("officeLocation")}
                </label>
                <input
                  type="text"
                  value={formData.officeLocation}
                  onChange={(e) => updateField("officeLocation", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder={t("officeLocationPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("physicalRequirements")}
                </label>
                <textarea
                  value={formData.physicalRequirements}
                  onChange={(e) => updateField("physicalRequirements", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                  placeholder={t("physicalRequirementsPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("scheduleType")}
                </label>
                <div className="space-y-2">
                  {["daytime", "shift", "weekend", "on_call"].map((type) => (
                    <label key={type} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.scheduleType.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateField("scheduleType", [...formData.scheduleType, type]);
                          } else {
                            updateField("scheduleType", formData.scheduleType.filter((s) => s !== type));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">{t(`scheduleTypeOptions.${type}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Requirements */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("requiredCertifications")}
                </label>
                <input
                  type="text"
                  value={formData.requiredCertifications.join(", ")}
                  onChange={(e) => updateField("requiredCertifications", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  placeholder={t("requiredCertificationsPlaceholder")}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {t("requiredCertificationsHint")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("minExperience")}
                </label>
                <input
                  type="number"
                  value={formData.minExperienceYears}
                  onChange={(e) => updateField("minExperienceYears", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  min="0"
                />
              </div>
            </div>
          )}
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

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{t("saveDraft")}</span>
            </button>
            {currentStep === steps.length && (
              <button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? t("submitting") : t("submitOffer")}
              </button>
            )}
          </div>

          {currentStep < steps.length && (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(steps.length, s + 1))}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t("next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CreateOfferPage() {
  const t = useTranslations("offers.create");
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">{t("loading")}</div>}>
      <CreateOfferContent />
    </Suspense>
  );
}