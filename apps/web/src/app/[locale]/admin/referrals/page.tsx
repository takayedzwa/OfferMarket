"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormat } from "@/hooks/useFormat";
import { referralAdminApi } from "@/lib/api";
import { AxiosError } from "axios";
import {
  Activity,
  ArrowLeft,
  Check,
  Gift,
  Save,
  Settings,
  Users,
  XCircle,
} from "lucide-react";

interface ReferralProgramSettings {
  enabled: boolean;
  rewardsEnabled: boolean;
  recurringRewards: boolean;
  threshold: number;
  rewardType: string;
  rewardAmountMinor: number;
  rewardCurrency: string;
  qualificationRule: string;
}

interface AdminReferral {
  id: string;
  status: string;
  referralCode: string;
  attributedAt: string;
  qualifiedAt: string | null;
  invalidatedReason: string | null;
  referrer: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
  referredUser: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
}

interface AdminReward {
  id: string;
  sequenceNumber: number;
  rewardType: string;
  amountMinor: number;
  currency: string;
  status: string;
  thresholdSnapshot: number;
  rewardProvider: string;
  providerReference: string | null;
  lastError: string | null;
  createdAt: string;
  fulfilledAt: string | null;
  owner: { id: string; email: string; firstName: string | null; lastName: string | null } | null;
}

const DEFAULT_SETTINGS: ReferralProgramSettings = {
  enabled: true,
  rewardsEnabled: true,
  recurringRewards: true,
  threshold: 5,
  rewardType: "gift_card",
  rewardAmountMinor: 2500,
  rewardCurrency: "EUR",
  qualificationRule: "email_verified",
};

function userName(u: { email: string; firstName: string | null; lastName: string | null } | null) {
  if (!u) return "—";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || u.email;
}

export default function AdminReferralsPage() {
  const t = useTranslations("admin-list.referrals");
  const tEnums = useTranslations("enums");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currency, date } = useFormat();

  const [settings, setSettings] = useState<ReferralProgramSettings>(DEFAULT_SETTINGS);
  const [amountMajor, setAmountMajor] = useState<string>("25.00");
  const [providers, setProviders] = useState<{ id: string; displayName: string }[]>([]);
  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [rewards, setRewards] = useState<AdminReward[]>([]);
  const [referralStatus, setReferralStatus] = useState("");
  const [rewardStatus, setRewardStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [settingsRes, referralsRes, rewardsRes] = await Promise.all([
        referralAdminApi.getSettings(),
        referralAdminApi.listReferrals({ page: 1, limit: 25, ...(referralStatus ? { status: referralStatus } : {}) }),
        referralAdminApi.listRewards({ page: 1, limit: 25, ...(rewardStatus ? { status: rewardStatus } : {}) }),
      ]);
      const s = settingsRes.data.settings as ReferralProgramSettings;
      setSettings(s);
      setAmountMajor((s.rewardAmountMinor / 100).toFixed(2));
      setProviders(settingsRes.data.fulfillmentProviders || []);
      setReferrals(referralsRes.data.referrals || []);
      setRewards(rewardsRes.data.rewards || []);
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setMessage({
        kind: "error",
        text: axiosError.response?.data?.message || t("errors.loadFailed"),
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralStatus, rewardStatus]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !(user as { role?: string }).role || (user as { role?: string }).role !== "ADMIN") {
      router.push("/");
      return;
    }
    load();
  }, [authLoading, user, router, load]);

  function flash(kind: "success" | "error", text: string) {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function saveSettings() {
    const major = Number(amountMajor);
    if (!Number.isFinite(major) || major <= 0) {
      flash("error", t("errors.invalidAmount"));
      return;
    }
    setSaving(true);
    try {
      await referralAdminApi.updateSettings({
        ...settings,
        // Currency amounts cross the API boundary in integer minor units.
        rewardAmountMinor: Math.round(major * 100),
      });
      flash("success", t("settings.saved"));
      await load();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      flash("error", axiosError.response?.data?.message || t("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function act(action: () => Promise<unknown>, successText: string) {
    try {
      await action();
      flash("success", successText);
      await load();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      flash("error", axiosError.response?.data?.message || t("errors.actionFailed"));
    } finally {
      setBusyId(null);
    }
  }

  function referralStatusLabel(status: string) {
    try {
      return t(`referralStatus.${status}` as never);
    } catch {
      return status;
    }
  }

  function rewardStatusLabel(status: string) {
    try {
      return t(`rewardStatus.${status}` as never);
    } catch {
      return status;
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const good = status === "QUALIFIED" || status === "FULFILLED";
    const bad = status === "INVALIDATED" || status === "FAILED" || status === "CANCELLED";
    return `text-xs font-semibold px-2.5 py-1 rounded-full ${
      good ? "bg-green-100 text-green-800" : bad ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — matches the admin console shell */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin")}
                className="text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
                aria-label={t("backToAdmin")}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{t("header.title")}</h1>
                  <p className="text-xs text-gray-500">{t("header.subtitle")}</p>
                </div>
              </div>
            </div>
            <span className="text-sm text-gray-600">{user?.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {message && (
          <div
            className={`p-4 rounded-lg text-sm ${
              message.kind === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
            role="status"
          >
            {message.text}
          </div>
        )}

        {/* Program configuration */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" aria-hidden /> {t("settings.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <Toggle
              label={t("settings.enabled")}
              hint={t("settings.enabledHint")}
              checked={settings.enabled}
              onChange={(v) => setSettings({ ...settings, enabled: v })}
            />
            <Toggle
              label={t("settings.rewardsEnabled")}
              hint={t("settings.rewardsEnabledHint")}
              checked={settings.rewardsEnabled}
              onChange={(v) => setSettings({ ...settings, rewardsEnabled: v })}
            />
            <Toggle
              label={t("settings.recurringRewards")}
              hint={t("settings.recurringRewardsHint")}
              checked={settings.recurringRewards}
              onChange={(v) => setSettings({ ...settings, recurringRewards: v })}
            />
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">{t("settings.qualificationRule")}</span>
              <select
                value={settings.qualificationRule}
                onChange={(e) => setSettings({ ...settings, qualificationRule: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="email_verified">{t("settings.rule.email_verified")}</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">{t("settings.threshold")}</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={settings.threshold}
                onChange={(e) => setSettings({ ...settings, threshold: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <span className="mt-1 block text-xs text-gray-500">{t("settings.thresholdHint")}</span>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">{t("settings.rewardAmount")}</span>
              <input
                type="number"
                step="0.01"
                min={0.01}
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <span className="mt-1 block text-xs text-gray-500">
                {t("settings.rewardAmountHint", { currency: settings.rewardCurrency })}
              </span>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">{t("settings.rewardCurrency")}</span>
              <input
                type="text"
                maxLength={3}
                value={settings.rewardCurrency}
                onChange={(e) => setSettings({ ...settings, rewardCurrency: e.target.value.toUpperCase() })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">{t("settings.rewardType")}</span>
              <input
                type="text"
                value={settings.rewardType}
                onChange={(e) => setSettings({ ...settings, rewardType: e.target.value })}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-gray-500">{t("settings.fulfillmentNote", { providers: providers.map((p) => p.id).join(", ") || "—" })}</p>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" aria-hidden /> {saving ? t("settings.saving") : t("settings.save")}
            </button>
          </div>
        </section>

        {/* Referrals ledger */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5" aria-hidden /> {t("referrals.title")}
            </h2>
            <select
              value={referralStatus}
              onChange={(e) => setReferralStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              aria-label={t("referrals.filter")}
            >
              <option value="">{t("statusFilter.all")}</option>
              <option value="PENDING">{t("referralStatus.PENDING")}</option>
              <option value="QUALIFIED">{t("referralStatus.QUALIFIED")}</option>
              <option value="INVALIDATED">{t("referralStatus.INVALIDATED")}</option>
            </select>
          </div>
          {referrals.length === 0 ? (
            <p className="text-sm text-gray-500">{t("referrals.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b">
                    <th className="py-2 pr-4">{t("referrals.referredUser")}</th>
                    <th className="py-2 pr-4">{t("referrals.referrer")}</th>
                    <th className="py-2 pr-4">{t("referrals.code")}</th>
                    <th className="py-2 pr-4">{t("referrals.status")}</th>
                    <th className="py-2 pr-4">{t("referrals.attributedAt")}</th>
                    <th className="py-2">{t("referrals.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {referrals.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 pr-4">
                        <p className="text-gray-900">{userName(r.referredUser)}</p>
                        <p className="text-xs text-gray-500">{r.referredUser?.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-gray-900">{userName(r.referrer)}</p>
                        <p className="text-xs text-gray-500">{r.referrer?.email}</p>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">{r.referralCode}</td>
                      <td className="py-3 pr-4">
                        <span className={statusBadge(r.status)}>{referralStatusLabel(r.status)}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 text-xs">{date(r.attributedAt)}</td>
                      <td className="py-3">
                        {r.status !== "INVALIDATED" ? (
                          <button
                            disabled={busyId === r.id}
                            onClick={() => {
                              setBusyId(r.id);
                              act(
                                () => referralAdminApi.invalidateReferral(r.id),
                                t("referrals.invalidated"),
                              );
                            }}
                            className="text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            {t("referrals.invalidate")}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">{t("referrals.noActions")}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Rewards ledger */}
        <section className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5" aria-hidden /> {t("rewards.title")}
            </h2>
            <select
              value={rewardStatus}
              onChange={(e) => setRewardStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              aria-label={t("rewards.filter")}
            >
              <option value="">{t("statusFilter.all")}</option>
              <option value="PENDING">{t("rewardStatus.PENDING")}</option>
              <option value="PROCESSING">{t("rewardStatus.PROCESSING")}</option>
              <option value="FULFILLED">{t("rewardStatus.FULFILLED")}</option>
              <option value="FAILED">{t("rewardStatus.FAILED")}</option>
              <option value="CANCELLED">{t("rewardStatus.CANCELLED")}</option>
            </select>
          </div>
          {rewards.length === 0 ? (
            <p className="text-sm text-gray-500">{t("rewards.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b">
                    <th className="py-2 pr-4">{t("rewards.owner")}</th>
                    <th className="py-2 pr-4">{t("rewards.amount")}</th>
                    <th className="py-2 pr-4">{t("rewards.milestone")}</th>
                    <th className="py-2 pr-4">{t("rewards.status")}</th>
                    <th className="py-2 pr-4">{t("rewards.provider")}</th>
                    <th className="py-2">{t("rewards.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rewards.map((w) => (
                    <tr key={w.id}>
                      <td className="py-3 pr-4">
                        <p className="text-gray-900">{userName(w.owner)}</p>
                        <p className="text-xs text-gray-500">{w.owner?.email}</p>
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {currency(w.amountMinor / 100, w.currency)}
                      </td>
                      <td className="py-3 pr-4 text-gray-600 text-xs">
                        {tEnums("referral.rewardMilestone", {
                          number: w.sequenceNumber,
                          threshold: w.thresholdSnapshot,
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={statusBadge(w.status)}>{rewardStatusLabel(w.status)}</span>
                        {w.lastError && <p className="mt-1 text-xs text-red-600 max-w-xs truncate" title={w.lastError}>{w.lastError}</p>}
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-600">
                        {w.rewardProvider}
                        {w.providerReference && <p className="text-gray-400 font-mono">{w.providerReference}</p>}
                      </td>
                      <td className="py-3">
                        {w.status === "FULFILLED" || w.status === "CANCELLED" ? (
                          <span className="text-xs text-gray-400">{t("rewards.noActions")}</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={busyId === w.id}
                              onClick={() => {
                                setBusyId(w.id);
                                act(
                                  () => referralAdminApi.fulfillReward(w.id),
                                  t("rewards.fulfilled"),
                                );
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" aria-hidden /> {t("rewards.fulfill")}
                            </button>
                            <button
                              disabled={busyId === w.id}
                              onClick={() => {
                                setBusyId(w.id);
                                act(
                                  () => referralAdminApi.cancelReward(w.id),
                                  t("rewards.cancelled"),
                                );
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              <XCircle className="w-3 h-3" aria-hidden /> {t("rewards.cancel")}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-gray-500">{t("rewards.fulfillmentHint")}</p>
        </section>
      </main>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
      />
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}