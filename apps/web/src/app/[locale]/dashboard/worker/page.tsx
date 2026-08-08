"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { workersApi, offersApi } from "@/lib/api";
import { PrivateWorkerProfile, Offer } from "@/lib/types";
import { useFormat } from "@/hooks/useFormat";
import { User, MapPin, Briefcase, Euro, Calendar, Eye, MessageSquare } from "lucide-react";

export default function WorkerDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useTranslations("dashboard.worker");
  const tEnums = useTranslations("enums");
  const { currency } = useFormat();
  const [profile, setProfile] = useState<PrivateWorkerProfile | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        const [profileRes, offersRes] = await Promise.all([
          workersApi.getMyProfile().catch((err) => {
            if (err.response?.status === 404) {
              // No profile exists, redirect to setup
              router.push("/profile/setup");
            }
            return null;
          }),
          offersApi.getWorkerOffers().catch(() => ({ data: [] })),
        ]);

        if (profileRes) setProfile(profileRes.data);
        setOffers(offersRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  const pendingOffers = offers.filter((o) => o.status === "SUBMITTED" || o.status === "VIEWED");
  const shortlistedOffers = offers.filter((o) => o.status === "SHORTLISTED");
  const acceptedOffers = offers.filter((o) => o.status === "ACCEPTED");

  const renderWorkArrangement = (type?: string) => {
    if (!type) return t("recentOffers.workArrangement.HYBRID");
    try {
      return t(`recentOffers.workArrangement.${type}`);
    } catch {
      return t("recentOffers.workArrangement.HYBRID");
    }
  };

  const renderStatusLabel = (status: string) => {
    try {
      return t(`recentOffers.statusLabel.${status}`);
    } catch {
      return status;
    }
  };

  const renderAvailability = (availability?: string) => {
    if (!availability) return t("profile.availabilityNotSet");
    try {
      return tEnums(`availability.${availability}`);
    } catch {
      return availability.toLowerCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.pendingOffers")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{pendingOffers.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.shortlisted")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{shortlistedOffers.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.accepted")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{acceptedOffers.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.conversations")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {new Set(offers.map((o) => o.employerId).filter(Boolean)).size}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Status */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t("profile.title")}</h2>
                <Link
                  href={profile ? "/profile/edit" : "/profile/setup"}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {profile ? t("profile.edit") : t("profile.create")}
                </Link>
              </div>

              {profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {profile.desiredSalaryMin && profile.desiredSalaryMax
                          ? t("profile.salaryRange", {
                              min: currency(profile.desiredSalaryMin),
                              max: currency(profile.desiredSalaryMax),
                            })
                          : profile.desiredSalaryMin
                            ? t("profile.salaryFrom", { amount: currency(profile.desiredSalaryMin) })
                            : t("profile.salaryNotSet")}
                      </div>
                      <div className="text-sm text-gray-500">{t("profile.desiredSalary")}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-900">
                        {profile.region?.name || t("profile.noRegion")}
                      </div>
                      <div className="text-sm text-gray-500">{t("profile.locationPreference")}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-900">
                        {profile.skills?.length
                          ? t("profile.skillsCount", { count: profile.skills.length })
                          : t("profile.noSkills")}
                      </div>
                      <div className="text-sm text-gray-500">{t("profile.skills")}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-900 capitalize">
                        {renderAvailability(profile.availability)}
                      </div>
                      <div className="text-sm text-gray-500">{t("profile.availability")}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      {t("profile.visibility", {
                        visibility: profile.profileVisibility || t("profile.visibilityDefault"),
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">{t("profile.empty")}</p>
                  <Link
                    href="/profile/setup"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {t("profile.createProfile")}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Offers */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t("recentOffers.title")}</h2>
                <Link href="/offers" className="text-sm text-blue-600 hover:text-blue-700">
                  {t("recentOffers.viewAll")}
                </Link>
              </div>

              {offers.length > 0 ? (
                <div className="space-y-4">
                  {offers.slice(0, 5).map((offer) => (
                    <Link
                      key={offer.id}
                      href={`/offers/${offer.id}`}
                      className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {offer.jobTitle}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Euro className="w-4 h-4" />
                              {offer.compensation?.salary?.min != null && offer.compensation?.salary?.max != null
                                ? t("recentOffers.salaryRange", {
                                    min: currency(offer.compensation.salary.min),
                                    max: currency(offer.compensation.salary.max),
                                  })
                                : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {renderWorkArrangement(offer.workArrangement?.type)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {offer.employer?.companyName || t("recentOffers.company")}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.status === "SUBMITTED" || offer.status === "VIEWED"
                              ? "bg-blue-100 text-blue-700"
                              : offer.status === "SHORTLISTED"
                              ? "bg-yellow-100 text-yellow-700"
                              : offer.status === "ACCEPTED"
                              ? "bg-green-100 text-green-700"
                              : offer.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : offer.status === "COUNTERED"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {renderStatusLabel(offer.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">{t("recentOffers.empty")}</p>
                  <p className="text-sm text-gray-500">
                    {t("recentOffers.emptyDesc")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}