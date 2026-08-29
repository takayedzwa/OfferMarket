"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormat } from "@/hooks/useFormat";
import Navbar from "@/components/Navbar";
import { referralsApi } from "@/lib/api";
import { AxiosError } from "axios";
import {
  Gift,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Check,
  Share2,
  Trophy,
} from "lucide-react";

interface ReferralReward {
  id: string;
  sequenceNumber: number;
  rewardType: string;
  amountMinor: number;
  currency: string;
  status: string;
  createdAt: string;
  fulfilledAt: string | null;
}

interface ReferralInfo {
  programEnabled: boolean;
  rewardsEnabled: boolean;
  referralCode: string;
  referralLink: string;
  config: {
    threshold: number;
    rewardType: string;
    rewardAmountMinor: number;
    rewardCurrency: string;
    recurringRewards: boolean;
  };
  stats: { pending: number; qualified: number; invalidated: number; rewardsIssued: number };
  progress: { successfulReferrals: number; nextMilestoneAt: number | null; remaining: number | null };
  rewards: ReferralReward[];
}

export default function ReferralsPage() {
  const t = useTranslations("referrals");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currency, date } = useFormat();

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  useEffect(() => {
    // Wait for the auth context to resolve before deciding to redirect.
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    let cancelled = false;
    referralsApi
      .getMyReferralInfo()
      .then((response) => {
        if (!cancelled) setInfo(response.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message || axiosError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  async function copyText(text: string, which: "link" | "code") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API unavailable (permissions/insecure context) — the link is
      // displayed in a read-only input so it can still be selected manually.
      setError(tErrors("referrals.clipboard_unavailable"));
    }
  }

  async function share() {
    if (!info) return;
    // Web Share API when available (mobile), clipboard fallback otherwise.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("shareTitle"), text: t("shareText"), url: info.referralLink });
      } catch {
        // User dismissed the share sheet — nothing to do.
      }
    } else {
      await copyText(info.referralLink, "link");
    }
  }

  function rewardStatusLabel(status: string) {
    // Localized labels for the known statuses; unknown statuses render raw.
    try {
      return t(`status.${status}` as never);
    } catch {
      return status.charAt(0) + status.slice(1).toLowerCase();
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  const rewardAmount = info ? currency(info.config.rewardAmountMinor / 100, info.config.rewardCurrency) : "";
  // Progress within the current milestone window (resets after each reward).
  // remaining === null means no outstanding milestone → full bar; the modulo
  // path is guarded against divide-by-zero even though the server clamps
  // threshold >= 1.
  const progressPercent = !info || !info.config.threshold
    ? 0
    : info.progress.remaining === null
      ? 100
      : Math.min(100, Math.round(((info.progress.successfulReferrals % info.config.threshold) / info.config.threshold) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("title")}</h1>
        <p className="text-gray-600 mb-8">{t("subtitle")}</p>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        ) : info && !info.programEnabled ? (
          <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 text-sm">
            {t("programDisabled")}
          </div>
        ) : info ? (
          <div className="space-y-6">
            {/* Reward summary banner */}
            <div className="bg-blue-600 text-white rounded-2xl p-6 flex items-center gap-4">
              <Gift className="w-10 h-10 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold text-lg">
                  {t("earnBanner", { amount: rewardAmount, count: info.config.threshold })}
                </p>
              </div>
            </div>

            {/* Referral link */}
            <section className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" aria-hidden /> {t("yourLink")}
              </h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  readOnly
                  type="text"
                  value={info.referralLink}
                  aria-label={t("yourLink")}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm font-mono outline-none min-w-0"
                />
                <button
                  onClick={() => copyText(info.referralLink, "link")}
                  className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 shrink-0"
                >
                  {copied === "link" ? <Check className="w-4 h-4" aria-hidden /> : <Copy className="w-4 h-4" aria-hidden />}
                  {copied === "link" ? t("copied") : t("copyLink")}
                </button>
                <button
                  onClick={share}
                  className="px-5 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2 shrink-0"
                >
                  <Users className="w-4 h-4" aria-hidden />
                  {t("share")}
                </button>
              </div>
              <button
                onClick={() => copyText(info.referralCode, "code")}
                className="mt-3 text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {t("copyCode")} <span className="font-mono font-semibold">{info.referralCode}</span>
                {copied === "code" && <Check className="w-3 h-3" aria-hidden />}
              </button>
            </section>

            {/* Progress */}
            <section className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4">{t("progressTitle")}</h2>
              <div className="mb-3 flex justify-between text-sm text-gray-600 gap-3 flex-wrap">
                <span>
                  {t("progressOf", {
                    successful: info.stats.qualified,
                    target: info.config.threshold,
                  })}
                </span>
                <span className="font-semibold text-gray-900">
                  {t("rewardsEarned", { count: info.stats.rewardsIssued })}
                </span>
              </div>
              <div
                className="h-3 w-full bg-gray-100 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={info.progress.successfulReferrals}
                aria-valuemin={0}
                aria-valuemax={info.config.threshold}
              >
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {info.progress.remaining !== null && info.progress.remaining > 0
                  ? t("moreReferralsNeeded", {
                      count: info.progress.remaining,
                      amount: rewardAmount,
                    })
                  : t("rewardEarnedMessage")}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{info.stats.qualified}</p>
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" aria-hidden /> {t("statsQualified")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{info.stats.pending}</p>
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden /> {t("statsPending")}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{info.stats.rewardsIssued}</p>
                  <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Trophy className="w-3 h-3" aria-hidden /> {t("statsRewards")}
                  </p>
                </div>
              </div>
            </section>

            {/* Reward history */}
            <section className="bg-white rounded-2xl shadow p-6 border border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5" aria-hidden /> {t("rewardHistory")}
              </h2>
              {info.rewards.length === 0 ? (
                <p className="text-sm text-gray-500">{t("noRewards", { threshold: info.config.threshold })}</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {info.rewards.map((reward) => (
                    <li key={reward.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {currency(reward.amountMinor / 100, reward.currency)} ·{" "}
                          {t("rewardOrdinal", { number: reward.sequenceNumber })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reward.fulfilledAt
                            ? t("fulfilledOn", { date: date(reward.fulfilledAt) })
                            : t("createdOn", { date: date(reward.createdAt) })}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                          reward.status === "FULFILLED"
                            ? "bg-green-100 text-green-800"
                            : reward.status === "FAILED" || reward.status === "CANCELLED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {rewardStatusLabel(reward.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {t("loadFailed")}
          </div>
        )}
      </main>
    </div>
  );
}