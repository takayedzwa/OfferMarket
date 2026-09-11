"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormat } from "@/hooks/useFormat";
import { insightAdminApi, type MarketDashboard, type GatedValue } from "@/lib/api";
import { ArrowLeft, BarChart3, RefreshCw, Save, Sparkles } from "lucide-react";

/**
 * Admin Market Intelligence console (P7). The engine's composed view plus the
 * two runtime-control surfaces: the statistical safeguards (sample-size
 * thresholds, AdminSettings-backed) and the auto-draft generator (config +
 * run-now). Generated insights are ALWAYS drafts — review happens in the
 * article list, never here.
 */

interface SnapshotRow {
  id: string;
  profession: string;
  regionId: string | null;
  snapshotDate: string;
  data?: { aggregate?: { sample?: { offers?: number; employers?: number } } };
}

const THRESHOLD_FIELDS = [
  "SALARY_RANGE",
  "SALARY_TREND",
  "DEMAND_LEVEL",
  "MOST_VALUABLE_SKILLS",
  "EMPLOYER_COHORT",
  "TIME_TO_HIRE",
  "MIN_ARTICLE_SAMPLE",
  "WINDOW_DAYS",
  "SNAPSHOT_RETENTION_DAYS",
] as const;

const GENERATOR_FIELDS = ["salaryChangePct", "demandGrowthPct", "benefitMinSample", "benefitMinGapPct"] as const;

function GatedStat({ gated, render }: { gated: GatedValue<unknown>; render: (value: any) => React.ReactNode }) {
  if (!gated.available || gated.value === undefined) {
    return <span className="text-sm text-gray-400 italic">—</span>;
  }
  return <>{render(gated.value)}</>;
}

export default function AdminMarketIntelligencePage() {
  const t = useTranslations("admin-insights.market");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currency } = useFormat();

  const [dashboard, setDashboard] = useState<MarketDashboard | null>(null);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [thresholdsDirty, setThresholdsDirty] = useState(false);
  const [generator, setGenerator] = useState<Record<string, unknown>>({});
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [snapshotProfession, setSnapshotProfession] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || !user || user.role !== "ADMIN") {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    try {
      const [dash, th, gen, snaps] = await Promise.all([
        insightAdminApi.getMarketDashboard(),
        insightAdminApi.getThresholds(),
        insightAdminApi.getGeneratorConfig(),
        insightAdminApi.listSnapshots({ limit: 20 }),
      ]);
      setDashboard(dash.data);
      setThresholds(th.data);
      setGenerator(gen.data);
      setSnapshots(snaps.data.items ?? []);
    } catch {
      setError(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  const reloadSnapshots = useCallback(async (profession: string) => {
    try {
      const res = await insightAdminApi.listSnapshots({ profession: profession || undefined, limit: 20 });
      setSnapshots(res.data.items ?? []);
    } catch {
      setError(t("fetchError"));
    }
  }, [t]);

  const saveThresholds = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await insightAdminApi.updateThresholds(thresholds);
      setThresholds(res.data);
      setThresholdsDirty(false);
      setMessage(t("thresholdsSaved"));
      await load();
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const saveGenerator = async (next: Record<string, unknown>) => {
    setSaving(true);
    setError("");
    try {
      const res = await insightAdminApi.updateGeneratorConfig(next);
      setGenerator(res.data);
      setMessage(t("generatorSaved"));
    } catch {
      setError(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const runGenerator = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await insightAdminApi.runGenerator();
      const created = res.data.created?.length ?? 0;
      setMessage(t("generatorRun", { created, skipped: res.data.skipped ?? 0 }));
      await load();
    } catch {
      setError(t("saveError"));
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-gray-500">{t("loading")}</div>;
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <Link href="/admin/insights" className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> {t("backToCms")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" /> {t("title")}
        </h1>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
        {dashboard && (
          <p className="mt-1 text-xs text-gray-400">
            {t("provenance", { methodVersion: dashboard.methodVersion })} ·{" "}
            {t("period", { days: dashboard.period.windowDays })}
          </p>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-sm">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 text-sm">{message}</p>}

      {dashboard && (
        <>
          {/* Totals */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("totals.activeWorkers"), value: dashboard.totals.activeWorkers },
              { label: t("totals.activeEmployers"), value: dashboard.totals.activeEmployers },
              { label: t("totals.offers"), value: dashboard.totals.offersWindow },
              { label: t("totals.accepted"), value: dashboard.totals.acceptedOffersWindow },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </section>

          {/* Gated headline metrics */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("salary.median")}</p>
              <GatedStat
                gated={dashboard.salary}
                render={(v) => (
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {currency(v.median, v.currency)}
                    <span className="ml-2 text-sm font-medium text-gray-500">
                      {t("salary.range", { p25: currency(v.p25, v.currency), p75: currency(v.p75, v.currency) })}
                    </span>
                  </p>
                )}
              />
              <p className="mt-2 text-xs text-gray-400">
                {t("sampleSize", { sampleSize: dashboard.salary.sampleSize ?? 0 })}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("demand.offers")}</p>
              <GatedStat
                gated={dashboard.demand}
                render={(v) => (
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {v.offers}
                    {typeof v.growthPct === "number" && (
                      <span className={`ml-2 text-sm font-medium ${v.growthPct >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {v.growthPct >= 0 ? "+" : ""}
                        {v.growthPct}%
                      </span>
                    )}
                  </p>
                )}
              />
              <p className="mt-2 text-xs text-gray-400">
                {t("sampleSize", { sampleSize: dashboard.demand.sampleSize ?? 0 })}
              </p>
            </div>
          </section>

          {/* Skills + shortages */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900">{t("skills.inDemand")}</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {dashboard.mostInDemandSkills.map((s) => (
                  <li key={s.skill} className="flex justify-between text-gray-700">
                    <span>{s.skill}</span>
                    <span className="tabular-nums text-gray-500">{s.offers}</span>
                  </li>
                ))}
                {dashboard.mostInDemandSkills.length === 0 && <li className="text-gray-400 italic">—</li>}
              </ul>
              <h2 className="mt-5 text-sm font-semibold text-gray-900">{t("skills.growing")}</h2>
              <ul className="mt-3 space-y-1.5 text-gray-700">
                {dashboard.fastestGrowingSkills.map((s) => (
                  <li key={s.skill} className="flex justify-between">
                    <span>{s.skill}</span>
                    <span className="tabular-nums text-emerald-600">+{s.growthPct}%</span>
                  </li>
                ))}
                {dashboard.fastestGrowingSkills.length === 0 && (
                  <li className="text-sm text-gray-400">{t("skills.growingEmpty")}</li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900">{t("shortages.title")}</h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="pb-2">{t("shortages.region")}</th>
                    <th className="pb-2">{t("shortages.offers")}</th>
                    <th className="pb-2">{t("shortages.candidates")}</th>
                    <th className="pb-2">{t("shortages.level")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.regionalShortages.map((r) => (
                    <tr key={r.regionId} className="border-t border-gray-100">
                      <td className="py-1.5">{r.regionName}</td>
                      <td className="py-1.5 tabular-nums">{r.offers}</td>
                      <td className="py-1.5 tabular-nums">{r.availableCandidates}</td>
                      <td className="py-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.shortageLevel === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : r.shortageLevel === "MODERATE"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {t(`shortages.level.${r.shortageLevel}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dashboard.regionalShortages.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-2 text-gray-400">
                        —
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="mt-3 text-sm text-blue-600">
                {t("pendingDrafts", { count: dashboard.pendingDrafts })} ·{" "}
                <Link href="/admin/insights" className="hover:underline">
                  {t("reviewDrafts")}
                </Link>
              </p>
            </div>
          </section>
        </>
      )}

      {/* Thresholds — the statistical safeguards */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">{t("thresholds.title")}</h2>
        <p className="text-sm text-gray-500">{t("thresholds.subtitle")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {THRESHOLD_FIELDS.map((field) => (
            <label key={field} className="text-sm">
              <span className="block font-medium text-gray-700">{t(`thresholds.fields.${field}`)}</span>
              <input
                type="number"
                min={1}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={thresholds[field] ?? ""}
                onChange={(e) => {
                  setThresholds((prev) => ({ ...prev, [field]: Number(e.target.value) }));
                  setThresholdsDirty(true);
                }}
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={saveThresholds}
          disabled={saving || !thresholdsDirty}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {t("thresholds.save")}
        </button>
      </section>

      {/* Generator */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" /> {t("generator.title")}
        </h2>
        <p className="text-sm text-gray-500">{t("generator.subtitle")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GENERATOR_FIELDS.map((field) => (
            <label key={field} className="text-sm">
              <span className="block font-medium text-gray-700">{t(`generator.fields.${field}`)}</span>
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={String(generator[field] ?? "")}
                onChange={(e) => setGenerator((prev) => ({ ...prev, [field]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <input
              type="checkbox"
              checked={generator.enabled === true}
              onChange={(e) => setGenerator((prev) => ({ ...prev, enabled: e.target.checked }))}
            />
            {t("generator.enabled")}
          </label>
          <button
            type="button"
            onClick={() => saveGenerator(generator)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {t("generator.save")}
          </button>
          <button
            type="button"
            onClick={runGenerator}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} /> {t("generator.runNow")}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">{t("generator.draftNote")}</p>
      </section>

      {/* Snapshots — data-provenance inspection */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900">{t("snapshots.title")}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t("snapshots.filterPlaceholder")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={snapshotProfession}
              onChange={(e) => setSnapshotProfession(e.target.value)}
            />
            <button
              type="button"
              onClick={() => reloadSnapshots(snapshotProfession)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              {t("snapshots.filter")}
            </button>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2">{t("snapshots.date")}</th>
                <th className="pb-2">{t("snapshots.profession")}</th>
                <th className="pb-2">{t("snapshots.offers")}</th>
                <th className="pb-2">{t("snapshots.employers")}</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((s) => (
                <tr key={s.id} className="border-t border-gray-100">
                  <td className="py-1.5">{new Date(s.snapshotDate).toISOString().slice(0, 10)}</td>
                  <td className="py-1.5">{s.profession}</td>
                  <td className="py-1.5 tabular-nums">{s.data?.aggregate?.sample?.offers ?? 0}</td>
                  <td className="py-1.5 tabular-nums">{s.data?.aggregate?.sample?.employers ?? 0}</td>
                </tr>
              ))}
              {snapshots.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-2 text-gray-400">
                    {t("snapshots.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}