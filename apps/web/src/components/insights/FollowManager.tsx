"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, X } from "lucide-react";
import { insightsApi, type InsightFollow } from "@/lib/api";

/**
 * The reader's follow subscriptions (profession / region / skill) with an
 * email toggle and unfollow. Lives on the deep Your Market view — creation
 * happens inline from article pages via FollowPrompt.
 */
export default function FollowManager() {
  const t = useTranslations("insights.follow");
  const [follows, setFollows] = useState<InsightFollow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await insightsApi.listFollows();
        setFollows(res.data ?? []);
      } catch {
        setFollows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const unfollow = async (id: string) => {
    try {
      await insightsApi.deleteFollow(id);
      setFollows((prev) => prev.filter((follow) => follow.id !== id));
    } catch {
      // Keep the row on transient failure.
    }
  };

  const label = (follow: InsightFollow) =>
    follow.profession ?? follow.region?.name ?? follow.skillSlug ?? "";

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-600" />
        {t("myFollows")}
      </h2>
      {loading ? (
        <div className="mt-4 h-10 rounded-lg bg-gray-100 animate-pulse" />
      ) : follows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{t("noFollows")}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {follows.map((follow) => (
            <li
              key={follow.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2.5"
            >
              <div className="min-w-0 text-sm">
                <span className="font-medium text-gray-900">{label(follow)}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {follow.profession ? t("profession") : follow.region ? t("region") : t("skill")}
                </span>
                {follow.notifyEmail && <span className="ml-2 text-xs text-blue-600">{t("email")}</span>}
              </div>
              <button
                type="button"
                onClick={() => unfollow(follow.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label={t("unfollow")}
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}