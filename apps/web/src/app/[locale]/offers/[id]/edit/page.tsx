"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { offersApi } from "@/lib/api";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import {
  ArrowLeft,
  Save,
  Euro,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const steps = [
  { id: 1, key: "jobDetails", icon: Briefcase },
  { id: 2, key: "compensation", icon: Euro },
  { id: 3, key: "contract", icon: Calendar },
  { id: 4, key: "benefits", icon: Award },
  { id: 5, key: "workSetup", icon: MapPin },
  { id: 6, key: "requirements", icon: CheckCircle2 },
];

function EditOfferContent() {
  const router = useRouter();
  const params = useParams();
  const { user, logout } = useAuth();
  const t = useTranslations("offers.edit");
  const apiError = useApiErrorMessage();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [offer, setOffer] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Job Details
    jobTitle: "",
    description: "",

    // Compensation
    salaryMin: 60000,
    salaryMax: 80000,
    currency: "EUR",
    signOnBonus: 0,
    performanceBonusPct: 0,

    // Contract
    contractType: "PERMANENT" as "PERMANENT" | "FIXED_TERM" | "FREELANCE" | "CONTRACT",
    durationMonths: 12,
    probationMonths: 2,
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
    requiredCertifications: [] as string[],
    minExperienceYears: 0,
  });

  useEffect(() => {
    async function loadOffer() {
      try {
        const response = await offersApi.getEmployerOfferDetail(params.id as string);
        const offerData = response.data;
        setOffer(offerData);

        // Use currentVersion if available, otherwise fall back to first version in versions array
        const cv = offerData.currentVersion || (offerData.versions && offerData.versions[0]);
        if (cv) {
          setFormData({
            jobTitle: offerData.jobTitle,
            description: offerData.jobDescription,
            salaryMin: cv.salaryMin,
            salaryMax: cv.salaryMax,
            currency: "EUR",
            signOnBonus: cv.signOnBonus || 0,
            performanceBonusPct: cv.performanceBonusPct || 0,
            contractType: cv.contractType?.toUpperCase() || "PERMANENT",
            durationMonths: cv.contractDurationMonths || 12,
            probationMonths: cv.probationMonths || 2,
            hoursPerWeek: cv.hoursPerWeek || 40,
            vacationDays: cv.vacationDays || 25,
            pensionContribution: cv.pensionContributionPct || 5,
            healthInsurance: false,
            travelAllowance: false,
            mealAllowance: false,
            phoneProvided: cv.phoneProvided || false,
            laptopProvided: cv.toolsProvided || true,
            educationBudget: cv.trainingBudget || 0,
            holidayAllowancePct: cv.holidayAllowancePct || 8,
            trainingBudget: cv.trainingBudget || 0,
            companyVehicle: cv.companyVehicle || "not_provided",
            travelAllowanceType: cv.travelAllowanceType || "not_provided",
            workArrangementType: cv.remoteWorkPct === 100 ? "REMOTE" : cv.remoteWorkPct === 0 ? "ONSITE" : "HYBRID",
            officeLocation: "",
            remoteDaysPerWeek: cv.remoteWorkPct ? cv.remoteWorkPct / 20 : 3,
            travelRequired: cv.travelRequiredPct > 0,
            relocationAssistance: false,
            scheduleType: cv.scheduleType || ["daytime"],
            remoteWorkPct: cv.remoteWorkPct || 50,
            physicalRequirements: cv.physicalRequirements || "",
            requiredCertifications: cv.requiredCertifications || [],
            minExperienceYears: cv.requiredExperienceYears || 0,
          });
        }
      } catch (err: any) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadOffer();
  }, [params.id]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildOfferData = () => ({
    jobTitle: formData.jobTitle,
    jobDescription: formData.description,
    compensation: {
      salaryMin: formData.salaryMin,
      salaryMax: formData.salaryMax,
      salaryPeriod: "year",
      signOnBonus: formData.signOnBonus,
      performanceBonusPct: formData.performanceBonusPct,
    },
    contract: {
      type: formData.contractType.toLowerCase(),
      hoursPerWeek: formData.hoursPerWeek,
      probationMonths: formData.probationMonths,
      durationMonths: formData.durationMonths,
    },
    benefits: {
      vacationDays: formData.vacationDays,
      holidayAllowancePct: formData.holidayAllowancePct,
      pensionContributionPct: formData.pensionContribution,
      trainingBudget: formData.educationBudget,
      companyVehicle: formData.companyVehicle,
      travelAllowanceType: formData.travelAllowanceType,
      phoneProvided: formData.phoneProvided,
      toolsProvided: formData.laptopProvided,
    },
    workArrangement: {
      scheduleType: formData.scheduleType,
      remoteWorkPct: formData.remoteWorkPct,
      physicalRequirements: formData.physicalRequirements || "None",
      travelRequiredPct: formData.travelRequired ? 25 : 0,
    },
    requirements: {
      requiredCertifications: formData.requiredCertifications.length > 0 ? formData.requiredCertifications : ["Relevant trade certification"],
      requiredExperienceYears: formData.minExperienceYears,
    },
  });

  const handleSave = async (submitOffer: boolean = false) => {
    setSaving(true);
    setError("");

    try {
      if (submitOffer) {
        // First save changes, then submit
        const offerData = buildOfferData();
        await offersApi.updateOffer(params.id as string, offerData);
        // Then submit the offer
        await offersApi.submitOffer(params.id as string);
      } else {
        const offerData = buildOfferData();
        await offersApi.updateOffer(params.id as string, offerData);
      }

      router.push(`/offers/${params.id}`);
    } catch (err: any) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const isSubmitDisabled =
    saving ||
    !formData.jobTitle ||
    !formData.description;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  const offerStatus = offer?.status;
  const cannotEdit = offerStatus === "ACCEPTED" || offerStatus === "REJECTED" || offerStatus === "WITHDRAWN" || offerStatus === "EXPIRED";

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
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{t("brand")}</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {t("editing", { jobTitle: offer?.jobTitle })}
                {offer?.status && <span className="ml-2 text-gray-400">{t("statusParens", { status: offer.status })}</span>}
              </span>
              <button
                onClick={() => handleSave(false)}
                disabled={isSubmitDisabled || cannotEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? t("saving") : t("saveChanges")}
              </button>
              {(offer?.status === "DRAFT" || offer?.status === "COUNTERED") && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSubmitDisabled || cannotEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? t("submitting") : t("submitOffer")}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {cannotEdit && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span>{t("cannotEdit", { status: offerStatus })}</span>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 border"
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{t(`steps.${step.key}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Job Details */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("jobTitle")}
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => updateField("jobTitle", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder={t("jobTitlePlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("jobDescription")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder={t("jobDescriptionPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Step 2: Compensation */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("minSalary")}
                </label>
                <input
                  type="number"
                  value={formData.salaryMin}
                  onChange={(e) => updateField("salaryMin", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {formData.salaryMax - formData.salaryMin > 5000 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {t("salaryRangeError")}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("signOnBonus")}
                </label>
                <input
                  type="number"
                  value={formData.signOnBonus}
                  onChange={(e) => updateField("signOnBonus", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("performanceBonus")}
                </label>
                <input
                  type="number"
                  value={formData.performanceBonusPct}
                  onChange={(e) => updateField("performanceBonusPct", parseInt(e.target.value) || 0)}
                  min="0"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contract */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("contractType")}
              </label>
              <select
                value={formData.contractType}
                onChange={(e) => updateField("contractType", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="PERMANENT">{t("contractTypes.permanent")}</option>
                <option value="FIXED_TERM">{t("contractTypes.fixed_term")}</option>
                <option value="FREELANCE">{t("contractTypes.freelance")}</option>
                <option value="CONTRACT">{t("contractTypes.contract")}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("hoursPerWeek")}
                </label>
                <input
                  type="number"
                  value={formData.hoursPerWeek}
                  onChange={(e) => updateField("hoursPerWeek", parseInt(e.target.value) || 40)}
                  min="12"
                  max="40"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
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
                  min="0"
                  max="6"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Benefits */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("vacationDays")}
                </label>
                <input
                  type="number"
                  value={formData.vacationDays}
                  onChange={(e) => updateField("vacationDays", parseInt(e.target.value) || 25)}
                  min="20"
                  max="40"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("holidayAllowance")}
                </label>
                <input
                  type="number"
                  value={formData.holidayAllowancePct}
                  onChange={(e) => updateField("holidayAllowancePct", parseInt(e.target.value) || 8)}
                  min="0"
                  max="12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("pensionContribution")}
                </label>
                <input
                  type="number"
                  value={formData.pensionContribution}
                  onChange={(e) => updateField("pensionContribution", parseInt(e.target.value) || 0)}
                  min="0"
                  max="15"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("trainingBudget")}
                </label>
                <input
                  type="number"
                  value={formData.trainingBudget}
                  onChange={(e) => updateField("trainingBudget", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.phoneProvided}
                  onChange={(e) => updateField("phoneProvided", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{t("phoneProvided")}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.laptopProvided}
                  onChange={(e) => updateField("laptopProvided", e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">{t("laptopProvided")}</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Work Setup */}
        {currentStep === 5 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("workArrangement")}
              </label>
              <select
                value={formData.workArrangementType}
                onChange={(e) => {
                  const val = e.target.value as "REMOTE" | "HYBRID" | "ONSITE";
                  updateField("workArrangementType", val);
                  updateField("remoteWorkPct", val === "REMOTE" ? 100 : val === "ONSITE" ? 0 : 50);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="REMOTE">{t("workArrangementOptions.remote")}</option>
                <option value="HYBRID">{t("workArrangementOptions.hybrid")}</option>
                <option value="ONSITE">{t("workArrangementOptions.onsite")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("remoteWorkPctLabel", { pct: formData.remoteWorkPct })}
              </label>
              <input
                type="range"
                value={formData.remoteWorkPct}
                onChange={(e) => updateField("remoteWorkPct", parseInt(e.target.value))}
                min="0"
                max="100"
                step="10"
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{t("rangeLabels.onsite")}</span>
                <span>{t("rangeLabels.hybrid")}</span>
                <span>{t("rangeLabels.remote")}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("scheduleType")}
              </label>
              <select
                value={formData.scheduleType[0]}
                onChange={(e) => updateField("scheduleType", [e.target.value])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="daytime">{t("scheduleTypeOptions.daytime")}</option>
                <option value="shift">{t("scheduleTypeOptions.shift")}</option>
                <option value="weekend">{t("scheduleTypeOptions.weekend")}</option>
                <option value="on_call">{t("scheduleTypeOptions.on_call")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("physicalRequirements")}
              </label>
              <textarea
                value={formData.physicalRequirements}
                onChange={(e) => updateField("physicalRequirements", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder={t("physicalRequirementsPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Step 6: Requirements */}
        {currentStep === 6 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("minExperience")}
              </label>
              <input
                type="number"
                value={formData.minExperienceYears}
                onChange={(e) => updateField("minExperienceYears", parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("requiredCertifications")}
              </label>
              <input
                type="text"
                value={formData.requiredCertifications.join(", ")}
                onChange={(e) => updateField("requiredCertifications", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder={t("requiredCertificationsPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50"
          >
            {t("previous")}
          </button>

          {currentStep < 6 ? (
            <button
              onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              {t("next")}
            </button>
          ) : (
            <>
              {(offer?.status === "DRAFT" || offer?.status === "COUNTERED") ? (
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSubmitDisabled || cannotEdit}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? t("submitting") : t("submitOffer")}
                </button>
              ) : (
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSubmitDisabled || cannotEdit}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? t("saving") : t("saveChanges")}
                </button>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EditOfferPage() {
  const t = useTranslations("offers.edit");
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("fallbackLoading")}</div>
      </div>
    }>
      <EditOfferContent />
    </Suspense>
  );
}