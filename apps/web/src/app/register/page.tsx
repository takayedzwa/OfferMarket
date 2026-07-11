"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi, workersApi, employersApi } from "../../lib/api";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "";

  const [role, setRole] = useState<"worker" | "employer">(initialRole as "worker" | "employer" || "worker");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [kvkNumber, setKvkNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // GDPR consent checkboxes
  const [privacyPolicyConsent, setPrivacyPolicyConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [immigrationConsent, setImmigrationConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!privacyPolicyConsent) {
      setError("You must accept the Privacy Policy to continue");
      return;
    }

    if (!termsConsent) {
      setError("You must accept the Terms of Service to continue");
      return;
    }

    if (!dataProcessingConsent) {
      setError("You must consent to data processing to use OfferMarket");
      return;
    }

    setLoading(true);

    try {
      let response;

      if (role === "worker") {
        // Register worker
        response = await authApi.registerWorker(email, password, phone || undefined);
        const { user, tokens } = response.data;

        // Store auth data
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userPhone", phone || '');

        // Record GDPR consents
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const consentHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        };

        const consentsToRecord = [
          { consentType: 'PRIVACY_POLICY', legalBasis: 'CONSENT', version: '1.0', granted: true },
          { consentType: 'TERMS_OF_SERVICE', legalBasis: 'CONSENT', version: '1.0', granted: true },
          { consentType: 'DATA_PROCESSING', legalBasis: 'CONSENT', version: '1.0', granted: true },
        ];

        if (immigrationConsent) {
          consentsToRecord.push({ consentType: 'SPECIAL_CATEGORY', legalBasis: 'EXPLICIT_CONSENT', version: '1.0', granted: true });
        }

        if (analyticsConsent) {
          consentsToRecord.push({ consentType: 'COOKIE_ANALYTICS', legalBasis: 'CONSENT', version: '1.0', granted: true });
        }

        if (marketingConsent) {
          consentsToRecord.push({ consentType: 'MARKETING', legalBasis: 'CONSENT', version: '1.0', granted: true });
        }

        // Fire and forget — don't block registration on consent recording
        consentsToRecord.forEach(consent => {
          fetch(`${apiBase}/privacy/consents`, {
            method: 'POST',
            headers: consentHeaders,
            body: JSON.stringify(consent),
          }).catch(() => {/* silently fail */});
        });

        // Redirect to create worker profile
        router.push("/profile/setup");
      } else {
        // Register employer
        if (!companyName || !kvkNumber) {
          setError("Company name and KvK number are required");
          setLoading(false);
          return;
        }

        response = await authApi.registerEmployer(email, password, phone, {
          name: companyName,
          kvkNumber,
          website: website || undefined,
        });
        const { user, tokens } = response.data;

        // Store auth data
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("userId", user.id);
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userPhone", phone || '');

        // Store company data for pre-population
        localStorage.setItem("employerCompanyName", companyName);
        localStorage.setItem("employerKvkNumber", kvkNumber);
        localStorage.setItem("employerWebsite", website || '');

        // Record GDPR consents
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const consentHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        };

        const consentsToRecord = [
          { consentType: 'PRIVACY_POLICY', legalBasis: 'CONSENT', version: '1.0', granted: true },
          { consentType: 'TERMS_OF_SERVICE', legalBasis: 'CONSENT', version: '1.0', granted: true },
          { consentType: 'DATA_PROCESSING', legalBasis: 'CONSENT', version: '1.0', granted: true },
          { consentType: 'KVK_PROCESSING', legalBasis: 'LEGAL_OBLIGATION', version: '1.0', granted: true },
        ];

        if (analyticsConsent) {
          consentsToRecord.push({ consentType: 'COOKIE_ANALYTICS', legalBasis: 'CONSENT', version: '1.0', granted: true });
        }

        if (marketingConsent) {
          consentsToRecord.push({ consentType: 'MARKETING', legalBasis: 'CONSENT', version: '1.0', granted: true });
        }

        // Fire and forget — don't block registration on consent recording
        consentsToRecord.forEach(consent => {
          fetch(`${apiBase}/privacy/consents`, {
            method: 'POST',
            headers: consentHeaders,
            body: JSON.stringify(consent),
          }).catch(() => {/* silently fail */});
        });

        // Redirect to create employer profile
        router.push("/profile/setup-employer");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">OfferMarket</span>
            </Link>
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Register Form */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Create your account</h1>
              <p className="text-gray-600">Join OfferMarket today</p>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === "worker"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-semibold text-gray-900">Worker</div>
                <div className="text-xs text-gray-500">Find better offers</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("employer")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role === "employer"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-semibold text-gray-900">Employer</div>
                <div className="text-xs text-gray-500">Hire talent</div>
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="+31 6 12345678"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              {role === "employer" && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Company Information</h3>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      Company name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required={role === "employer"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="Your Company B.V."
                    />
                  </div>

                  <div>
                    <label htmlFor="kvkNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      KvK number <span className="text-gray-400">(Dutch Chamber of Commerce)</span>
                    </label>
                    <input
                      id="kvkNumber"
                      type="text"
                      value={kvkNumber}
                      onChange={(e) => setKvkNumber(e.target.value)}
                      required={role === "employer"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      Website <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder="https://yourcompany.nl"
                    />
                  </div>
                </>
              )}

              {/* GDPR Consent Section */}
              <div className="border-t pt-4 mt-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Privacy & Consent</h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyPolicyConsent}
                    onChange={(e) => setPrivacyPolicyConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I have read and accept the{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                      Privacy Policy
                    </Link>{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsConsent}
                    onChange={(e) => setTermsConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I have read and accept the{' '}
                    <Link href="/terms" className="text-blue-600 hover:underline" target="_blank">
                      Terms of Service
                    </Link>{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataProcessingConsent}
                    onChange={(e) => setDataProcessingConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I consent to the processing of my personal data for the purpose of providing OfferMarket services{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>

                {role === "worker" && (
                  <label className="flex items-start gap-3 cursor-pointer bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <input
                      type="checkbox"
                      checked={immigrationConsent}
                      onChange={(e) => setImmigrationConsent(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-amber-900">
                      <strong>Optional — Special Category Data (AVG Article 9):</strong> I consent to the processing
                      of my work authorization status (which may reveal immigration status) for matching with
                      employers. This can be withdrawn at any time in your{' '}
                      <Link href="/privacy/dashboard" className="text-amber-700 hover:underline font-medium" target="_blank">
                        Privacy Dashboard
                      </Link>.
                    </span>
                  </label>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={analyticsConsent}
                    onChange={(e) => setAnalyticsConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    <strong>Optional:</strong> I consent to the use of analytics cookies to help improve OfferMarket
                    (PostHog, anonymized).
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    <strong>Optional:</strong> I consent to receiving marketing communications about new features
                    and updates.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? "Creating account..." : `Create ${role === "worker" ? "Worker" : "Employer"} Account`}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
