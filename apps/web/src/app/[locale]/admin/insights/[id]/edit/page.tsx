"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { insightAdminApi } from "@/lib/api";
import InsightArticleForm, { type AdminInsightArticle } from "@/components/insights/admin/InsightArticleForm";

// Edit-insight editor: loads the admin payload (including selected sources)
// and hands it to the shared form. Publish/schedule actions stay on the list.
export default function AdminEditInsightPage() {
  const t = useTranslations("admin-insights");
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [article, setArticle] = useState<AdminInsightArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || !user || user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await insightAdminApi.getArticle(params.id);
        if (!cancelled) setArticle(res.data);
      } catch {
        if (!cancelled) setError(t("fetchError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, params.id, t]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6 text-sm">
          <Link href="/admin/insights" className="text-blue-600 hover:text-blue-700">
            {t("title")}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{t("edit")}</span>
        </nav>

        {loading ? (
          <div className="h-64 rounded-xl bg-white border animate-pulse" />
        ) : error ? (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</p>
        ) : (
          <InsightArticleForm initial={article} articleId={params.id} />
        )}
      </main>
    </div>
  );
}