"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { insightAdminApi, regionsApi } from "@/lib/api";
import type { Region } from "@/lib/types";

/**
 * The Insights CMS article editor — used by both /admin/insights/new and
 * /admin/insights/[id]/edit. Every field from the admin CMS spec is here:
 * content fields, the data-integrity fields (dataClass, sample size, data
 * period, methodology — what powers the reader-facing TransparencyBox), SEO
 * fields, and the source registry selection. Charts / statistics / keyStats
 * are JSON textareas parsed client-side (the CMS MVP contract).
 *
 * Slug auto-generates from the title when left blank. All lifecycle actions
 * (publish / schedule / unpublish / archive / delete) live on the list page,
 * not in the editor.
 */

export interface AdminInsightArticle {
  id?: string;
  title?: string;
  slug?: string;
  category?: string;
  summary?: string;
  content?: string;
  profession?: string | null;
  regionId?: string | null;
  skills?: string[];
  charts?: unknown[];
  statistics?: unknown[];
  keyStats?: unknown;
  methodology?: string | null;
  dataPeriodStart?: string | null;
  dataPeriodEnd?: string | null;
  dataClass?: string;
  sampleSize?: number | null;
  sampleDescription?: string | null;
  authorName?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  socialTitle?: string | null;
  sources?: Array<{ source: { id: string } }>;
}

const CATEGORIES = ["SALARY", "DEMAND", "EMPLOYER", "INDUSTRY", "CAREER"];
const DATA_CLASSES = ["OFFERMARKT", "OFFICIAL", "THIRD_PARTY", "EDITORIAL"];

const slugify = (title: string) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

export default function InsightArticleForm({
  initial,
  articleId,
}: {
  initial?: AdminInsightArticle | null;
  articleId?: string;
}) {
  const t = useTranslations("admin-insights.form");
  const tCommon = useTranslations("admin-insights");
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [category, setCategory] = useState(initial?.category ?? "SALARY");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [profession, setProfession] = useState(initial?.profession ?? "");
  const [regionId, setRegionId] = useState(initial?.regionId ?? "");
  const [skillsText, setSkillsText] = useState((initial?.skills ?? []).join(", "));
  const [dataClass, setDataClass] = useState(initial?.dataClass ?? "OFFERMARKT");
  const [sampleSize, setSampleSize] = useState(initial?.sampleSize != null ? String(initial.sampleSize) : "");
  const [sampleDescription, setSampleDescription] = useState(initial?.sampleDescription ?? "");
  const [dataPeriodStart, setDataPeriodStart] = useState(initial?.dataPeriodStart?.slice(0, 10) ?? "");
  const [dataPeriodEnd, setDataPeriodEnd] = useState(initial?.dataPeriodEnd?.slice(0, 10) ?? "");
  const [methodology, setMethodology] = useState(initial?.methodology ?? "");
  const [chartsText, setChartsText] = useState(
    initial?.charts && initial.charts.length > 0 ? JSON.stringify(initial.charts, null, 2) : "",
  );
  const [statisticsText, setStatisticsText] = useState(
    initial?.statistics && initial.statistics.length > 0 ? JSON.stringify(initial.statistics, null, 2) : "",
  );
  const [keyStatsText, setKeyStatsText] = useState(
    initial?.keyStats && (Array.isArray(initial.keyStats) ? initial.keyStats.length > 0 : true)
      ? JSON.stringify(initial.keyStats, null, 2)
      : "",
  );
  const [authorName, setAuthorName] = useState(initial?.authorName ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [socialTitle, setSocialTitle] = useState(initial?.socialTitle ?? "");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    (initial?.sources ?? []).map((ref) => ref.source.id),
  );

  const [regions, setRegions] = useState<Region[]>([]);
  const [sources, setSources] = useState<Array<{ id: string; name: string; sourceType: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [regionsRes, sourcesRes] = await Promise.all([
          regionsApi.getRegions(),
          insightAdminApi.listSources(),
        ]);
        if (cancelled) return;
        setRegions(regionsRes.data.data ?? regionsRes.data);
        setSources(sourcesRes.data ?? []);
      } catch {
        // Selects render empty; the form is still usable for core fields.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const slugValue = slugTouched ? slug : slugify(title);
  const effectiveSlug = slugValue || slugify(title);

  const parseJsonField = (text: string, field: string): { ok: true; value: unknown } | { ok: false } => {
    if (!text.trim()) return { ok: true, value: undefined };
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch {
      setError(t("invalidJson", { field }));
      return { ok: false };
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const charts = parseJsonField(chartsText, t("charts"));
    if (!charts.ok) return;
    const statistics = parseJsonField(statisticsText, t("statistics"));
    if (!statistics.ok) return;
    const keyStats = parseJsonField(keyStatsText, t("keyStats"));
    if (!keyStats.ok) return;

    const payload: Record<string, unknown> = {
      title,
      slug: effectiveSlug,
      category,
      summary,
      content,
      dataClass,
      sourceIds: selectedSourceIds,
    };
    if (profession.trim()) payload.profession = profession.trim();
    if (regionId) payload.regionId = regionId;
    if (skillsText.trim()) payload.skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
    if (charts.value !== undefined) payload.charts = charts.value;
    if (statistics.value !== undefined) payload.statistics = statistics.value;
    if (keyStats.value !== undefined) payload.keyStats = keyStats.value;
    if (sampleSize.trim() !== "") payload.sampleSize = Number(sampleSize);
    if (sampleDescription.trim()) payload.sampleDescription = sampleDescription.trim();
    if (dataPeriodStart) payload.dataPeriodStart = new Date(dataPeriodStart).toISOString();
    if (dataPeriodEnd) payload.dataPeriodEnd = new Date(dataPeriodEnd).toISOString();
    if (methodology.trim()) payload.methodology = methodology.trim();
    if (authorName.trim()) payload.authorName = authorName.trim();
    if (seoTitle.trim()) payload.seoTitle = seoTitle.trim();
    if (metaDescription.trim()) payload.metaDescription = metaDescription.trim();
    if (socialTitle.trim()) payload.socialTitle = socialTitle.trim();

    setSaving(true);
    try {
      if (articleId) {
        await insightAdminApi.updateArticle(articleId, payload);
      } else {
        const res = await insightAdminApi.createArticle(payload);
        router.push(`/admin/insights/${res.data.id}/edit`);
        return;
      }
      router.push("/admin/insights");
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(", ") : message || tCommon("errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</p>}

      {/* Content fields */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("title")} <span className="text-red-500">*</span>
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required minLength={3} maxLength={160} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("slug")} <span className="text-red-500">*</span>
          </label>
          <input
            value={slugTouched ? slug : slugify(title)}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputClass}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            maxLength={120}
          />
          <p className="mt-1 text-xs text-gray-500">{t("slugHint")}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("category")} <span className="text-red-500">*</span>
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("dataClass")} <span className="text-red-500">*</span>
            </label>
            <select value={dataClass} onChange={(e) => setDataClass(e.target.value)} className={inputClass}>
              {DATA_CLASSES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("summary")} <span className="text-red-500">*</span>
          </label>
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className={inputClass} rows={3} required minLength={10} maxLength={280} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("content")} <span className="text-red-500">*</span>
          </label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className={`${inputClass} font-mono`} rows={14} required minLength={20} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("profession")}</label>
            <input value={profession} onChange={(e) => setProfession(e.target.value)} className={inputClass} maxLength={80} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("region")}</label>
            <select value={regionId} onChange={(e) => setRegionId(e.target.value)} className={inputClass}>
              <option value="">—</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("skills")}</label>
            <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Data-integrity fields — these power the reader-facing transparency box */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("sampleSize")}</label>
            <input type="number" min={0} value={sampleSize} onChange={(e) => setSampleSize(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("sampleDescription")}</label>
            <input value={sampleDescription} onChange={(e) => setSampleDescription(e.target.value)} className={inputClass} maxLength={500} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("dataPeriodStart")}</label>
            <input type="date" value={dataPeriodStart} onChange={(e) => setDataPeriodStart(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("dataPeriodEnd")}</label>
            <input type="date" value={dataPeriodEnd} onChange={(e) => setDataPeriodEnd(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("methodology")}</label>
          <textarea value={methodology} onChange={(e) => setMethodology(e.target.value)} className={inputClass} rows={3} maxLength={20000} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("sources")}</label>
          {sources.length === 0 ? (
            <p className="text-sm text-gray-500">{t("noSources")}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <label key={source.id} className="flex items-center gap-2 text-sm text-gray-700 rounded-lg border border-gray-200 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedSourceIds.includes(source.id)}
                    onChange={(e) =>
                      setSelectedSourceIds((prev) =>
                        e.target.checked ? [...prev, source.id] : prev.filter((id) => id !== source.id),
                      )
                    }
                  />
                  <span className="truncate">{source.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{source.sourceType}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Structured extras (JSON) */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("charts")}</label>
          <textarea value={chartsText} onChange={(e) => setChartsText(e.target.value)} className={`${inputClass} font-mono`} rows={5} placeholder='[{ "type": "bar", "title": "…", "labels": ["…"], "values": [1] }]' />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("statistics")}</label>
          <textarea value={statisticsText} onChange={(e) => setStatisticsText(e.target.value)} className={`${inputClass} font-mono`} rows={5} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("keyStats")}</label>
          <textarea value={keyStatsText} onChange={(e) => setKeyStatsText(e.target.value)} className={`${inputClass} font-mono`} rows={4} placeholder='[{ "label": "…", "value": "…" }]' />
        </div>
      </div>

      {/* SEO + author */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">{t("seo")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("authorName")}</label>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} className={inputClass} maxLength={120} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("seoTitle")}</label>
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} maxLength={70} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("metaDescription")}</label>
            <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={inputClass} rows={2} maxLength={170} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("socialTitle")}</label>
            <input value={socialTitle} onChange={(e) => setSocialTitle(e.target.value)} className={inputClass} maxLength={120} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? t("saving") : t("save")}
        </button>
        <button type="button" onClick={() => router.push("/admin/insights")} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2">
          {tCommon("actions.cancel")}
        </button>
      </div>
    </form>
  );
}