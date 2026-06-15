"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { employersApi } from "../../../lib/api";
import { ArrowLeft, Save, Building2 } from "lucide-react";

export default function EditCompanyProfile() {
  const router = useRouter();
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
          setError("Failed to load company profile");
        }
      } finally {
        setFetching(false);
      }
    }

    loadProfile();
  }, [router]);

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
      setSuccess("Company profile updated successfully!");
      setTimeout(() => router.push("/dashboard/employer"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update company profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
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
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Edit Company Profile</h1>
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
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name (Legal) *
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Your Company B.V."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trade Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyTradeName}
                    onChange={(e) => updateField("companyTradeName", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Your Company"
                  />
                  <p className="mt-1 text-sm text-gray-500">Leave empty to use legal name</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KvK Number
                  </label>
                  <input
                    type="text"
                    value={formData.kvkNumber}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-400">KvK number cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VAT Number
                  </label>
                  <input
                    type="text"
                    value={formData.vatNumber}
                    onChange={(e) => updateField("vatNumber", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="NL123456789B01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => updateField("companySize", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="500+">500+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={formData.foundedYear}
                    onChange={(e) => updateField("foundedYear", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="2020"
                    min="1800"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => updateField("industry", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="e.g., Technology, Healthcare, Construction"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateField("website", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="https://yourcompany.nl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="+31 6 12345678"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) => updateField("billingEmail", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="billing@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Registered Address</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Main Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Number
                  </label>
                  <input
                    type="text"
                    value={formData.houseNumber}
                    onChange={(e) => updateField("houseNumber", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Number Addition
                  </label>
                  <input
                    type="text"
                    value={formData.houseNumberAddition}
                    onChange={(e) => updateField("houseNumberAddition", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="A, B, bis"
                  />
                </div>
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Amsterdam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="UK">United Kingdom</option>
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </main>
    </div>
  );
}
