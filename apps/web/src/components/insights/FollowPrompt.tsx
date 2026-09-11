"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, BellRing } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { insightsApi } from "@/lib/api";

/**
 * Follow prompt on the article page: follow the article's profession and/or
 * region to get notified on future publishes in that scope. Requires sign-in —
 * for anonymous readers it links to /login instead. Failures are non-fatal.
 */
export default function FollowPrompt({
  profession,
  regionId,
  regionName,
}: {
  profession?: string | null;
  regionId?: string | null;
  regionName?: string | null;
}) {
  const t = useTranslations("insights.follow");
  const { user } = useAuth();
  const [following, setFollowing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const targets = [
    { key: "profession", label: t("followProfession"), payload: { profession: profession ?? undefined }, active: !!profession },
    { key: "region", label: t("followRegion"), payload: { regionId: regionId ?? undefined }, active: !!regionId },
  ].filter((target) => target.active);

  if (targets.length === 0) return null;

  const follow = async (target: (typeof targets)[number]) => {
    if (!user || busy) return;
    setBusy(true);
    try {
      await insightsApi.createFollow(target.payload);
      setFollowing((prev) => [...prev, target.key]);
    } catch {
      // Already following (unique constraint) or transient failure — the UI
      // treats both as "following" only on success; otherwise stays silent.
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          {t("title")}
        </h3>
        <p className="mt-1 text-sm text-gray-600">{t("body")}</p>
        <Link href="/login" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
          {t("signInToFollow")} →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Bell className="w-4 h-4 text-blue-600" />
        {t("title")}
      </h3>
      <p className="mt-1 text-sm text-gray-600">{t("body")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {targets.map((target) => {
          const isFollowing = following.includes(target.key);
          return (
            <button
              key={target.key}
              type="button"
              disabled={busy || isFollowing}
              onClick={() => follow(target)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isFollowing
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-blue-300 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {isFollowing ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {isFollowing ? t("following") : target.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}