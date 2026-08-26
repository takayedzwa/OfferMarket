"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { authApi } from "@/lib/api";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";

// Post-registration email verification. The backend already dispatched a
// 6-digit code (auth.service sendRegistrationVerificationEmail) right after the
// register transaction committed; this page lets the user enter it, verify, and
// continue to profile setup. "Resend" hits the same send-verification-code
// endpoint. All endpoints are JWT-guarded — the token is in localStorage from
// registration, and the axios `api` instance attaches it automatically.
function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");
  const apiError = useApiErrorMessage();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState("");
  const [verified, setVerified] = useState(false);

  // Where to go after a successful verification. Mirror the register page's
  // post-register redirect: workers → /profile/setup, employers →
  // /profile/setup-employer. Falls back to /dashboard when the role isn't
  // known (e.g. the user returned to this page later).
  const nextStep = () => {
    if (typeof window === "undefined") return "/dashboard";
    const role = window.localStorage.getItem("userRole");
    if (role === "EMPLOYER") return "/profile/setup-employer";
    if (role === "WORKER") return "/profile/setup";
    return "/dashboard";
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResendNote("");
    if (!/^\d{6}$/.test(code)) {
      setError(t("codeHint"));
      return;
    }
    setVerifying(true);
    try {
      await authApi.verifyEmail(code);
      setVerified(true);
      // Brief confirmation, then continue to the next step.
      setTimeout(() => router.push(nextStep()), 1200);
    } catch (err: any) {
      setError(apiError(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendNote("");
    setResending(true);
    try {
      await authApi.sendVerificationCode("EMAIL");
      setResendNote(t("resendHint"));
    } catch (err: any) {
      setError(apiError(err));
    } finally {
      setResending(false);
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
          </div>
        </div>
      </header>

      {/* Verify Form */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {verified ? t("successTitle") : t("title")}
              </h1>
              <p className="text-gray-600">
                {verified ? t("successBody") : t("subtitle")}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {verified ? (
              <button
                onClick={() => router.push(nextStep())}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t("continue")}
              </button>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                    {t("codeLabel")}
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder={t("codePlaceholder")}
                  />
                  <p className="mt-2 text-sm text-gray-500">{t("codeHint")}</p>
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {verifying ? t("verifying") : t("verify")}
                </button>

                <div className="pt-2 text-center">
                  <p className="text-sm text-gray-500 mb-2">{t("resendHint")}</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {resending ? t("resending") : t("resend")}
                  </button>
                  {resendNote && (
                    <p className="mt-2 text-sm text-green-600">{resendNote}</p>
                  )}
                </div>
              </form>
            )}

            {process.env.NODE_ENV !== "production" && (
              <p className="mt-6 text-xs text-gray-400 text-center">{t("devNote")}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default VerifyEmailPage;