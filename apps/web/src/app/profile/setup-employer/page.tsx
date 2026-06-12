"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { employersApi } from "../../../lib/api";
import { ArrowLeft, ArrowRight, Building2, FileText, CheckCircle } from "lucide-react";

const steps = [
  { id: 1, title: "Company Info", description: "Basic company details" },
  { id: 2, title: "Address", description: "Registered address" },
  { id: 3, title: "Review", description: "Review and submit" },
];

export default function SetupEmployerProfile() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const createData: any = {
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

      await employersApi.createProfile(createData);

      router.push("/dashboard/employer");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create company profile");
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade Name (optional)
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
                KvK Number *
              </label>
              <input
                type="text"
                value={formData.kvkNumber}
                onChange={(e) => updateField("kvkNumber", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="12345678"
                maxLength={8}
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
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>

            <div>
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
                Company Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                placeholder="Tell us about your company..."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-sm text-blue-800 font-medium">Registered Address</p>
              <p className="text-sm text-blue-700">
                This is the official address registered with the Chamber of Commerce
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                House Number Addition (optional)
              </label>
              <input
                type="text"
                value={formData.houseNumberAddition}
                onChange={(e) => updateField("houseNumberAddition", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                placeholder="A, B, bis, etc."
              />
            </div>

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
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Company Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium">{formData.companyName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trade Name</p>
                  <p className="font-medium">{formData.companyTradeName || formData.companyName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">KvK Number</p>
                  <p className="font-medium">{formData.kvkNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company Size</p>
                  <p className="font-medium">{formData.companySize}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium">{formData.industry || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <p className="font-medium">{formData.website || "-"}</p>
                </div>
              </div>

              {formData.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{formData.description}</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Registered Address</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Street & Number</p>
                  <p className="font-medium">
                    {formData.street} {formData.houseNumber}{formData.houseNumberAddition}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Postal Code & City</p>
                  <p className="font-medium">
                    {formData.postalCode} {formData.city}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-medium">
                    {formData.country === "NL" ? "Netherlands" : formData.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Verification Process</p>
                  <p className="text-sm text-green-700 mt-1">
                    After submission, your company will be verified using the KvK number.
                    This typically takes 1-2 business days.
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
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Create Company Profile</h1>
              <p className="text-sm text-gray-500">Step {currentStep} of {steps.length}</p>
            </div>
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
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.companyName || !formData.kvkNumber || !formData.street || !formData.postalCode || !formData.city}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Profile..." : "Create Company Profile"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
