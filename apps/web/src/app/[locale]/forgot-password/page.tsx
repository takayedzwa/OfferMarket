"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      // In development, the API returns the token directly for testing.
      // In production, this would be sent via email.
      const token = response.data?.token;
      if (token) {
        setResetToken(token);
      }
      setSubmitted(true);
    } catch (err: any) {
      // Always show success message to prevent email enumeration
      setSubmitted(true);
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
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t("signIn")}
            </Link>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border">
            {!submitted ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("title")}</h1>
                  <p className="text-gray-600">{t("subtitle")}</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      {t("emailLabel")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                      placeholder={t("emailPlaceholder")}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? t("sending") : t("send")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("checkEmailTitle")}</h1>
                  <p className="text-gray-600">
                    {t("checkEmailBody", { email })}
                  </p>
                </div>

                {/* Development-only: show the reset token and link */}
                {resetToken && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      {t("devModeTitle")}
                    </p>
                    <p className="text-sm text-yellow-700 mb-3">
                      {t("devModeBody")}
                    </p>
                    <Link
                      href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                      className="inline-block text-sm text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                      {t("resetLink")}
                    </Link>
                  </div>
                )}

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {t("backToSignIn")}
                  </Link>
                </div>
              </>
            )}

            <div className="mt-6 text-center text-sm text-gray-600">
              {t("noAccount")}{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                {t("createOne")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}