"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { employersApi } from "@/lib/api";
import { ArrowLeft, Save, Building2 } from "lucide-react";

export default function EditCompanyProfile() {
  const router = useRouter();
  const t = useTranslations("profile.editCompany");
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    companyTradeName: "",
    kvkNumber: "",
    vatNumber: "",
    companySize: "",
    industry: "",
    foundedYear: "",
    website: "",
    phone: "",
    billingEmail: "",
    // Address fields
    street: "",
    houseNumber: "",
    houseNumberAddition: "",
    postalCode: "",
    city: "",
    country: "NL",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await employersApi.getMyProfile();
        const profile = res.data;

        setFormData({
          companyName: profile.companyName || "",
          companyTradeName: profile.companyTradeName || "",
          kvkNumber: profile.kvkNumber || "",
          vatNumber: profile.vatNumber || "",
          companySize: profile.companySize || "",
          industry: profile.industry || "",
          foundedYear: profile.foundedYear?.toString() || "",
          website: profile.website || "",
          phone: profile.phone || "",
          billingEmail: profile.billingEmail || "",
          // Parse address from JSON
          street: profile.registeredAddress?.street || "",
          houseNumber: profile.registeredAddress?.houseNumber || "",
          houseNumberAddition: profile.registeredAddress?.houseNumberAddition || "",
          postalCode: profile.registeredAddress?.postalCode || "",
          city: profile.registeredAddress?.city || "",
          country: profile.registeredAddress?.country || "NL",
        });
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.push("/profile/setup-employer");
        } else {
          setError(t("errLoad"));
        }
      } finally {
        setFetching(false);
      }
    }

    loadProfile();
  }, [router, t]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const updateData: any = {
        companyName: formData.companyName,
        companyTradeName: formData.companyTradeName || formData.companyName,
        vatNumber: formData.vatNumber || undefined,
        companySize: formData.companySize || undefined,
        industry: formData.industry || undefined,
        foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        website: formData.website || undefined,
        phone: formData.phone || undefined,
        billingEmail: formData.billingEmail || undefined,
        registeredAddress: {
          street: formData.street,
          houseNumber: formData.houseNumber,
          houseNumberAddition: formData.houseNumberAddition || undefined,
          postalCode: formData.postalCode,
          city: formData.city,
          country: formData.country,
        },
      };

      await employersApi.updateProfile(updateData);
      setSuccess(t("successUpdate"));
      setTimeout(() => router.push("/dashboard/employer"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || t("errUpdate"));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

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
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="space-y-6">
            {/* Company Info Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t("sectionCompanyInfo")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("labelCompanyName")}
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderCompanyName")}
                  />
                </div>

                <div className="md:col-span-2">
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
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-400">{t("kvkDisabled")}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("labelVat")}
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => updateField("vatNumber", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderVat")}
                  />
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
                    <option value="">{t("selectSize")}</option>
                    <option value="1-10">{t("size1_10")}</option>
                    <option value="11-50">{t("size11_50")}</option>
                    <option value="51-200">{t("size51_200")}</option>
                    <option value="201-500">{t("size201_500")}</option>
                    <option value="500+">{t("size500")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("labelFoundedYear")}
                  </label>
                  <input
                    type="number"
                    value={formData.foundedYear}
                    onChange={(e) => updateField("foundedYear", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderFoundedYear")}
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="md:col-span-2">
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
                    {t("labelPhone")}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderPhone")}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("labelBillingEmail")}
                  </label>
                  <input
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) => updateField("billingEmail", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderBillingEmail")}
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("sectionAddress")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("labelStreet")}
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderStreet")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("labelHouseNumber")}
                  </label>
                  <input
                    type="text"
                    value={formData.houseNumber}
                    onChange={(e) => updateField("houseNumber", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderHouseNumber")}
                  />
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("labelCity")}
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder={t("placeholderCity")}
                  />
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
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/dashboard/employer")}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </main>
    </div>
  );
}