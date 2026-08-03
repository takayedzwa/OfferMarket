"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { employersApi } from "@/lib/api";
import { ArrowLeft, ArrowRight, Building2, FileText, CheckCircle } from "lucide-react";

export default function SetupEmployerProfile() {
  const router = useRouter();
  const t = useTranslations("profile.setupEmployer");
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    // Step 1: Company Info
    companyName: "",
    companyTradeName: "",
    kvkNumber: "",
    companySize: "1-10",
    industry: "",
    website: "",
    description: "",

    // Step 2: Address
    street: "",
    houseNumber: "",
    houseNumberAddition: "",
    postalCode: "",
    city: "",
    country: "NL",
  });

  const steps = [
    { id: 1, title: t("step1Title"), description: t("step1Desc") },
    { id: 2, title: t("step2Title"), description: t("step2Desc") },
    { id: 3, title: t("step3Title"), description: t("step3Desc") },
  ];

  // Pre-populate with saved data from registration (only on mount)
  useEffect(() => {
    const draft = localStorage.getItem('employerProfileDraft');
    if (draft) {
      try {
        const savedData = JSON.parse(draft);
        setFormData((prev) => ({ ...prev, ...savedData }));
        return;
      } catch (e) {
        console.error('Failed to load saved draft');
      }
    }

    // Pre-populate from registration data
    const companyName = localStorage.getItem('employerCompanyName');
    const kvkNumber = localStorage.getItem('employerKvkNumber');
    const website = localStorage.getItem('employerWebsite');

    if (companyName || kvkNumber || website) {
      setFormData((prev) => ({
        ...prev,
        companyName: companyName || prev.companyName,
        kvkNumber: kvkNumber || prev.kvkNumber,
        website: website || prev.website,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.companyName.trim()) errors.companyName = t("valCompanyName");
      if (!formData.kvkNumber.trim()) errors.kvkNumber = t("valKvkRequired");
      else if (formData.kvkNumber.length !== 8) errors.kvkNumber = t("valKvkDigits");
    }

    if (step === 2) {
      if (!formData.street.trim()) errors.street = t("valStreet");
      if (!formData.houseNumber.trim()) errors.houseNumber = t("valHouseNumber");
      if (!formData.postalCode.trim()) errors.postalCode = t("valPostalCode");
      if (!formData.city.trim()) errors.city = t("valCity");
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(steps.length, s + 1));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const profileData: any = {
        companyName: formData.companyName,
        companyTradeName: formData.companyTradeName || formData.companyName,
        kvkNumber: formData.kvkNumber,
        companySize: formData.companySize,
        industry: formData.industry,
        website: formData.website || undefined,
        description: formData.description || undefined,
        registeredAddress: {
          street: formData.street,
          houseNumber: formData.houseNumber,
          houseNumberAddition: formData.houseNumberAddition || undefined,
          postalCode: formData.postalCode,
          city: formData.city,
          country: formData.country,
        },
      };

      // Check if profile exists, if so update, otherwise create
      try {
        await employersApi.getMyProfile();
        await employersApi.updateProfile(profileData);
      } catch (checkErr: any) {
        if (checkErr.response?.status === 404) {
          await employersApi.createProfile(profileData);
        } else {
          throw checkErr;
        }
      }

      router.push("/dashboard/employer");
    } catch (err: any) {
      setError(err.response?.data?.message || t("errCreate"));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForLater = () => {
    // Save progress to localStorage
    localStorage.setItem('employerProfileDraft', JSON.stringify(formData));
    // Clear any existing employer profile check to allow dashboard to load
    sessionStorage.setItem('skipEmployerProfileCheck', 'true');
    router.push("/dashboard/employer");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelCompanyName")}
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => updateField("companyName", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none ${validationErrors.companyName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder={t("placeholderCompanyName")}
              />
              {validationErrors.companyName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelTradeName")}
              </label>
              <input
                type="text"
                value={formData.companyTradeName}
                onChange={(e) => updateField("companyTradeName", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder={t("placeholderTradeName")}
              />
              <p className="mt-1 text-sm text-gray-500">{t("tradeNameHint")}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelKvk")}
              </label>
              <input
                type="text"
                value={formData.kvkNumber}
                onChange={(e) => updateField("kvkNumber", e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none ${validationErrors.kvkNumber ? 'border-red-300' : 'border-gray-300'}`}
                placeholder={t("placeholderKvk")}
                maxLength={8}
              />
              {validationErrors.kvkNumber && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.kvkNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelCompanySize")}
              </label>
              <select
                value={formData.companySize}
                onChange={(e) => updateField("companySize", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="1-10">{t("size1_10")}</option>
                <option value="11-50">{t("size11_50")}</option>
                <option value="51-200">{t("size51_200")}</option>
                <option value="201-500">{t("size201_500")}</option>
                <option value="500+">{t("size500")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelIndustry")}
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder={t("placeholderIndustry")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelWebsite")}
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder={t("placeholderWebsite")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelDescription")}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder={t("placeholderDescription")}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800 font-medium">{t("addressInfoTitle")}</p>
              <p className="text-sm text-blue-700">
                {t("addressInfoDesc")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelStreet")}
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => updateField("street", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none ${validationErrors.street ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t("placeholderStreet")}
                />
                {validationErrors.street && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.street}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelHouseNumber")}
                </label>
                <input
                  type="text"
                  value={formData.houseNumber}
                  onChange={(e) => updateField("houseNumber", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none ${validationErrors.houseNumber ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t("placeholderHouseNumber")}
                />
                {validationErrors.houseNumber && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.houseNumber}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelHouseNumberAddition")}
              </label>
              <input
                type="text"
                value={formData.houseNumberAddition}
                onChange={(e) => updateField("houseNumberAddition", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder={t("placeholderHouseNumberAddition")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelPostalCode")}
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none ${validationErrors.postalCode ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t("placeholderPostalCode")}
                />
                {validationErrors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.postalCode}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("labelCity")}
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none ${validationErrors.city ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t("placeholderCity")}
                />
                {validationErrors.city && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("labelCountry")}
              </label>
              <select
                value={formData.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="NL">{t("countryNL")}</option>
                <option value="BE">{t("countryBE")}</option>
                <option value="DE">{t("countryDE")}</option>
                <option value="FR">{t("countryFR")}</option>
                <option value="UK">{t("countryUK")}</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t("reviewCompanyInfo")}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t("reviewCompanyName")}</p>
                  <p className="font-medium">{formData.companyName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("reviewTradeName")}</p>
                  <p className="font-medium">{formData.companyTradeName || formData.companyName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("reviewKvk")}</p>
                  <p className="font-medium">{formData.kvkNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("reviewCompanySize")}</p>
                  <p className="font-medium">{formData.companySize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("reviewIndustry")}</p>
                  <p className="font-medium">{formData.industry || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("reviewWebsite")}</p>
                  <p className="font-medium">{formData.website || "-"}</p>
                </div>
              </div>

              {formData.description && (
                <div>
                  <p className="text-sm text-gray-500">{t("reviewDescription")}</p>
                  <p className="font-medium">{formData.description}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">{t("reviewAddress")}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t("reviewStreetNumber")}</p>
                  <p className="font-medium">
                    {formData.street} {formData.houseNumber}{formData.houseNumberAddition}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("reviewPostalCity")}</p>
                  <p className="font-medium">
                    {formData.postalCode} {formData.city}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t("reviewCountry")}</p>
                  <p className="font-medium">
                    {formData.country === "NL" ? t("countryNL") : formData.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">{t("verificationTitle")}</p>
                  <p className="text-sm text-green-700 mt-1">
                    {t("verificationDesc")}
                  </p>
                </div>
              </div>
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
                onClick={() => router.push("/dashboard/employer")}
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
          <div className="mt-4 grid grid-cols-3 gap-2">
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
        <div className="flex items-center justify-between py-4">
          <button
            type="button"
            onClick={handleSaveForLater}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 -ml-4"
          >
            {t("saveFinishLater")}
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t("next")}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
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