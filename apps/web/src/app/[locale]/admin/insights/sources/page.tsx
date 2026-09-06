"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormat } from "@/hooks/useFormat";
import { insightAdminApi } from "@/lib/api";

/**
 * Source registry: the shared citation pool for insights (CBS, UWV, RVO,
 * Dutch government, Eurostat, European Commission, industry reports). Policy
 * enforced by design: sources are linked and cited, never republished — the
 * editor stores metadata + URL only.
 */

const SOURCE_TYPES = [
  "CBS",
  "UWV",
  "RVO",
  "DUTCH_GOVERNMENT",
  "EUROSTAT",
  "EUROPEAN_COMMISSION",
  "INDUSTRY_REPORT",
  "ACADEMIC",
  "INTERNAL",
];

interface SourceRow {
  id: string;
  name: string;
  url: string;
  publisher: string;
  sourceType: string;
  publicationDate?: string | null;
  dataDate?: string | null;
  citation?: string | null;
  notes?: string | null;
}

const emptyForm = {
  name: "",
  url: "",
  publisher: "",
  sourceType: "CBS",
  publicationDate: "",
  dataDate: "",
  citation: "",
  notes: "",
};

export default function AdminInsightSourcesPage() {
  const t = useTranslations("admin-insights.sourceForm");
  const tRoot = useTranslations("admin-insights");
  const router = useRouter();
  const { date } = useFormat();
  const { user, loading: authLoading } = useAuth();

  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SourceRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || !user || user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  const load = async () => {
    try {
      const res = await insightAdminApi.listSources();
      setSources(res.data ?? []);
    } catch {
      setError(tRoot("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== "ADMIN") return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const startEdit = (source: SourceRow) => {
    setEditing(source);
    setForm({
      name: source.name,
      url: source.url,
      publisher: source.publisher,
      sourceType: source.sourceType,
      publicationDate: source.publicationDate?.slice(0, 10) ?? "",
      dataDate: source.dataDate?.slice(0, 10) ?? "",
      citation: source.citation ?? "",
      notes: source.notes ?? "",
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        url: form.url,
        publisher: form.publisher,
        sourceType: form.sourceType,
      };
      if (form.publicationDate) payload.publicationDate = new Date(form.publicationDate).toISOString();
      if (form.dataDate) payload.dataDate = new Date(form.dataDate).toISOString();
      if (form.citation.trim()) payload.citation = form.citation.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      if (editing) {
        await insightAdminApi.updateSource(editing.id, payload);
      } else {
        await insightAdminApi.createSource(payload);
      }
      resetForm();
      setSavedNote(true);
      setTimeout(() => setSavedNote(false), 2500);
      await load();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(", ") : message || tRoot("errors.saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      await insightAdminApi.deleteSource(id);
      if (editing?.id === id) resetForm();
      await load();
    } catch {
      setError(tRoot("errors.actionFailed"));
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6 text-sm">
          <Link href="/admin/insights" className="text-blue-600 hover:text-blue-700">
            {tRoot("title")}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{tRoot("sources")}</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-gray-600 max-w-3xl">{t("subtitle")}</p>
        </header>

        {error && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</p>}
        {savedNote && <p className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">{t("saved")}</p>}

        <div className="grid gap-6 lg:grid-cols-2 items-start">
          {/* Editor form */}
          <form onSubmit={submit} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">{editing ? t("edit") : t("add")}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("name")} *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required minLength={2} maxLength={200} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("url")} *</label>
              <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={inputClass} required maxLength={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("publisher")} *</label>
              <input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className={inputClass} required minLength={2} maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("sourceType")} *</label>
                <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className={inputClass}>
                  {SOURCE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("publicationDate")}</label>
                <input type="date" value={form.publicationDate} onChange={(e) => setForm({ ...form, publicationDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("dataDate")}</label>
                <input type="date" value={form.dataDate} onChange={(e) => setForm({ ...form, dataDate: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("citation")}</label>
              <input value={form.citation} onChange={(e) => setForm({ ...form, citation: e.target.value })} className={inputClass} maxLength={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("notes")}</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={3} maxLength={2000} />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={busy} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {editing ? t("edit") : t("add")}
              </button>
              {editing && (
                <button type="button" onClick={resetForm} className="text-sm text-gray-600 hover:text-gray-900">
                  {tRoot("actions.cancel")}
                </button>
              )}
            </div>
          </form>

          {/* Registry list */}
          <div className="space-y-3">
            {loading ? (
              <div className="h-40 rounded-xl bg-white border animate-pulse" />
            ) : sources.length === 0 ? (
              <div className="bg-white rounded-xl border p-8 text-center text-sm text-gray-500">{t("empty")}</div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="bg-white rounded-xl border shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {source.name}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{source.sourceType}</span>
                      </p>
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 break-all">
                        {source.url}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">
                        {t("publisher")}: {source.publisher}
                        {source.publicationDate && <> · {t("publicationDate")}: {date(source.publicationDate, { dateStyle: "medium" })}</>}
                        {source.dataDate && <> · {t("dataDate")}: {date(source.dataDate, { dateStyle: "medium" })}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => startEdit(source)} className="text-xs text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                        {t("edit")}
                      </button>
                      <button onClick={() => remove(source.id)} className="text-xs text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
                        {t("delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}