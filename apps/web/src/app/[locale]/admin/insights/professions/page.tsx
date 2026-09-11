"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { insightAdminApi } from "@/lib/api";
import { ArrowLeft, Plus, Power } from "lucide-react";

/**
 * Profession taxonomy admin (P4). Admin-managed reference data: adding a
 * profession (or a whole group) never requires a code change. Existing
 * free-text trades keep resolving by slug / name / EN-name / alias matching.
 * Deactivation is soft — taxonomy history is never destroyed.
 */

interface ProfessionRow {
  id: string;
  slug: string;
  name: string;
  nameEn?: string | null;
  group: string;
  description?: string | null;
  aliases: string[];
  isActive: boolean;
  sortOrder: number;
  version: number;
}

interface FormState {
  id?: string;
  name: string;
  nameEn: string;
  group: string;
  description: string;
  aliases: string;
}

const EMPTY_FORM: FormState = { name: "", nameEn: "", group: "", description: "", aliases: "" };

export default function AdminProfessionsPage() {
  const t = useTranslations("admin-insights.professions");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [professions, setProfessions] = useState<ProfessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || !user || user.role !== "ADMIN") {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const load = useCallback(async () => {
    try {
      const res = await insightAdminApi.listProfessions();
      setProfessions(res.data ?? []);
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = {
        name: form.name,
        ...(form.nameEn ? { nameEn: form.nameEn } : {}),
        group: form.group,
        ...(form.description ? { description: form.description } : {}),
        ...(form.aliases
          ? { aliases: form.aliases.split(",").map((a) => a.trim()).filter(Boolean) }
          : {}),
      };
      if (form.id) {
        await insightAdminApi.updateProfession(form.id, data);
        setMessage(t("saved"));
      } else {
        await insightAdminApi.createProfession(data);
        setMessage(t("saved"));
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err: any) {
      const code = err?.response?.data?.code;
      setError(code === "profession.slug_taken" ? t("errors.slugTaken") : t("errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    setSaving(true);
    try {
      await insightAdminApi.deactivateProfession(id);
      setMessage(t("deactivated"));
      await load();
    } catch {
      setError(t("errors.save"));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="p-8 text-gray-500">{t("loading")}</div>;
  }

  const groups = [...new Set(professions.map((p) => p.group))].sort();

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <Link href="/admin/insights" className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> {t("backToCms")}
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-sm text-gray-500">{t("subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY_FORM);
              setShowForm(true);
              setForm((f) => ({ ...f, id: undefined }));
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> {t("add")}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-2 text-sm">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 text-sm">{message}</p>}

      {showForm && (
        <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="block font-medium text-gray-700">{t("form.name")}</span>
              <input
                required
                minLength={2}
                maxLength={80}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="block font-medium text-gray-700">{t("form.nameEn")}</span>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.nameEn}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="block font-medium text-gray-700">{t("form.group")}</span>
              <input
                required
                minLength={2}
                maxLength={40}
                list="profession-groups"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={form.group}
                onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
              />
              <datalist id="profession-groups">
                {groups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
            <label className="text-sm">
              <span className="block font-medium text-gray-700">{t("form.aliases")}</span>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder={t("form.aliasesPlaceholder")}
                value={form.aliases}
                onChange={(e) => setForm((f) => ({ ...f, aliases: e.target.value }))}
              />
            </label>
          </div>
          <label className="text-sm block">
            <span className="block font-medium text-gray-700">{t("form.description")}</span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {form.id ? t("form.saveEdit") : t("form.saveNew")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
            >
              {t("form.cancel")}
            </button>
          </div>
        </form>
      )}

      {groups.map((group) => (
        <section key={group} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">{group}</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-2">{t("table.name")}</th>
                <th className="px-6 py-2">{t("table.aliases")}</th>
                <th className="px-6 py-2">{t("table.version")}</th>
                <th className="px-6 py-2">{t("table.status")}</th>
                <th className="px-6 py-2" />
              </tr>
            </thead>
            <tbody>
              {professions
                .filter((p) => p.group === group)
                .map((p) => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-6 py-2">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          setForm({
                            id: p.id,
                            name: p.name,
                            nameEn: p.nameEn ?? "",
                            group: p.group,
                            description: p.description ?? "",
                            aliases: (p.aliases ?? []).join(", "),
                          });
                          setShowForm(true);
                        }}
                      >
                        {p.name}
                      </button>
                      <span className="ml-2 text-xs text-gray-400">/{p.slug}</span>
                      {p.nameEn && <span className="ml-1 text-xs text-gray-500">({p.nameEn})</span>}
                    </td>
                    <td className="px-6 py-2 text-gray-500 text-xs max-w-xs truncate">{(p.aliases ?? []).join(", ")}</td>
                    <td className="px-6 py-2 tabular-nums text-gray-500">v{p.version}</td>
                    <td className="px-6 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {p.isActive ? t("status.active") : t("status.inactive")}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-right">
                      {p.isActive && (
                        <button
                          type="button"
                          onClick={() => deactivate(p.id)}
                          disabled={saving}
                          className="text-gray-400 hover:text-red-600"
                          title={t("table.deactivate")}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}