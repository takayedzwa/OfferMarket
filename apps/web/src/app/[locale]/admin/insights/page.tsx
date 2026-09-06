"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormat } from "@/hooks/useFormat";
import { insightAdminApi } from "@/lib/api";
import { Newspaper, Plus } from "lucide-react";

/**
 * Insights CMS list: every article with its status, and the lifecycle actions
 * (publish / schedule / unpublish / archive / delete). Publish validates on
 * the server (sample-size + data-period rules) — a rejected publish surfaces
 * the backend validation message here.
 */

const STATUSES = ["DRAFT", "SCHEDULED", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"];

interface AdminArticleRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  dataClass: string;
  publishAt?: string | null;
  updatedAt?: string;
  viewCount?: number;
  _count?: { sources: number };
}

export default function AdminInsightsPage() {
  const t = useTranslations("admin-insights");
  const router = useRouter();
  const { date } = useFormat();
  const { user, loading: authLoading } = useAuth();
  const [articles, setArticles] = useState<AdminArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      const res = await insightAdminApi.listArticles({ status: statusFilter || undefined });
      setArticles(res.data.items ?? []);
    } catch {
      setError(t("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || user.role !== "ADMIN") return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, statusFilter]);

  const act = async (id: string, action: string) => {
    setBusyId(id);
    setError("");
    try {
      if (action === "publish") {
        // Publishing fans out notifications to followers — confirm first.
        if (window.confirm(t("actions.publishConfirm"))) {
          await insightAdminApi.publishArticle(id);
        }
      } else if (action === "unpublish") {
        await insightAdminApi.unpublishArticle(id);
      } else if (action === "archive") {
        await insightAdminApi.archiveArticle(id);
      } else if (action === "delete") {
        if (window.confirm(t("actions.deleteConfirm"))) {
          await insightAdminApi.deleteArticle(id);
        }
      } else if (action === "schedule") {
        const publishAt = window.prompt(t("actions.schedulePrompt"));
        if (publishAt) {
          await insightAdminApi.scheduleArticle(id, new Date(publishAt).toISOString());
        }
      }
      await load();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(", ") : message || t("errors.actionFailed"));
    } finally {
      setBusyId(null);
    }
  };

  const statusColor = (status: string) =>
    ({
      DRAFT: "bg-gray-100 text-gray-700",
      SCHEDULED: "bg-blue-100 text-blue-700",
      PUBLISHED: "bg-emerald-100 text-emerald-700",
      UNPUBLISHED: "bg-amber-100 text-amber-700",
      ARCHIVED: "bg-red-50 text-red-600",
    })[status] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Newspaper className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
              <p className="text-sm text-gray-500">{t("subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/insights/sources")}
              className="text-sm text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {t("sources")}
            </button>
            <button
              onClick={() => router.push("/admin/insights/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t("new")}
            </button>
          </div>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</p>}

        <div className="mb-4">
          <label className="text-sm text-gray-600 mr-2">{t("list.status")}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t("list.allStatuses")}</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{t(`status.${status as "DRAFT"}`)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-xl bg-white border animate-pulse" />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-sm text-gray-500">{t("list.empty")}</div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(article.status)}`}>
                        {t(`status.${article.status as "DRAFT"}`)}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{article.category}</span>
                      <span className="text-xs text-gray-400">{article.dataClass}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/admin/insights/${article.id}/edit`)}
                      className="mt-1 text-left font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {article.title}
                    </button>
                    <p className="text-xs text-gray-400">/insights/{article.slug}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("list.updated")} {date(article.updatedAt ?? "", { dateStyle: "medium" })}
                      {typeof article.viewCount === "number" && <> · {t("list.views")}: {article.viewCount}</>}
                      {article._count && <> · {t("list.sources")}: {article._count.sources}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["DRAFT", "UNPUBLISHED"].includes(article.status) && (
                      <button onClick={() => act(article.id, "publish")} disabled={busyId === article.id} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">
                        {t("actions.publish")}
                      </button>
                    )}
                    {["DRAFT", "UNPUBLISHED"].includes(article.status) && (
                      <button onClick={() => act(article.id, "schedule")} disabled={busyId === article.id} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                        {t("actions.schedule")}
                      </button>
                    )}
                    {article.status === "SCHEDULED" && article.publishAt && (
                      <span className="text-xs text-blue-700">{date(article.publishAt, { dateStyle: "medium" })}</span>
                    )}
                    {article.status === "PUBLISHED" && (
                      <button onClick={() => act(article.id, "unpublish")} disabled={busyId === article.id} className="bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-50">
                        {t("actions.unpublish")}
                      </button>
                    )}
                    {article.status !== "ARCHIVED" && (
                      <button onClick={() => act(article.id, "archive")} disabled={busyId === article.id} className="text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50">
                        {t("actions.archive")}
                      </button>
                    )}
                    <button onClick={() => act(article.id, "delete")} disabled={busyId === article.id} className="text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50 disabled:opacity-50">
                      {t("actions.delete")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}