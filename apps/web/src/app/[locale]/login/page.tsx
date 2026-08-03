"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { authApi, workersApi, employersApi, api } from "@/lib/api";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const apiError = useApiErrorMessage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      const { user, tokens } = response.data;

      // Store auth data — SECURITY: Only tokens are stored in localStorage.
      // userId and userRole are NOT stored here; they come from the JWT
      // payload and /auth/me endpoint, preventing source-of-truth conflicts.
      localStorage.setItem("accessToken", tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem("refreshToken", tokens.refreshToken);
      }

      // Redirect based on role - profile check happens on the dashboard
      // Use window.location.href for a full page reload to ensure AuthContext re-initializes
      if (user.role === "ADMIN") {
        window.location.href = "/admin";
      } else if (user.role === "SUPPORT") {
        window.location.href = "/support";
      } else if (user.role === "WORKER") {
        window.location.href = "/dashboard/worker";
      } else if (user.role === "EMPLOYER") {
        window.location.href = "/dashboard/employer";
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(apiError(err));
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
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {t("createAccount")}
            </Link>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("welcomeBack")}</h1>
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
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("passwordLabel")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder={t("passwordPlaceholder")}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">{t("rememberMe")}</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  {t("forgotPassword")}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t("signingIn") : t("signIn")}
              </button>
            </form>

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