"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/i18n/navigation";
import InsightArticleForm from "@/components/insights/admin/InsightArticleForm";

// New-insight editor: the shared form starts empty, creating a DRAFT. The
// lifecycle actions (publish/schedule/…) are on the list page after save.
export default function AdminNewInsightPage() {
  const t = useTranslations("admin-insights");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken || !user || user.role !== "ADMIN") {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6 text-sm">
          <Link href="/admin/insights" className="text-blue-600 hover:text-blue-700">
            {t("title")}
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{t("new")}</span>
        </nav>
        <h1 className="text-xl font-bold text-gray-900 mb-6">{t("new")}</h1>
        <InsightArticleForm />
      </main>
    </div>
  );
}