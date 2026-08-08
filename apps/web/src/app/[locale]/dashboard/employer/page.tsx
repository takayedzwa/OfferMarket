"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { employersApi, offersApi } from "@/lib/api";
import { Offer, Employer } from "@/lib/types";
import { useFormat } from "@/hooks/useFormat";
import { Building2, Send, Eye, UserCheck, Euro, Users } from "lucide-react";

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations("dashboard.employer");
  const tEnums = useTranslations("enums");
  const { currency, date } = useFormat();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // SECURITY: identity comes from AuthContext (resolved from the JWT via
      // /auth/me), NOT from localStorage. The login page stores only tokens —
      // it deliberately does not set userId/userRole — so the previous guard
      // (localStorage.getItem('userId')/('userRole')) always failed and bounced
      // employers straight back to /login. Wait for auth to resolve, then
      // require an EMPLOYER.
      if (authLoading) return;

      if (!user || user.role !== 'EMPLOYER') {
        router.push('/login');
        return;
      }

      // Check if user is coming from save-for-later
      const skipCheck = typeof window !== 'undefined' && sessionStorage.getItem('skipEmployerProfileCheck') === 'true';

      try {
        // Fetch employer profile
        let employerData = null;
        try {
          const employerRes = await employersApi.getMyCompany();
          employerData = employerRes.data;
        } catch (err: any) {
          if (err.response?.status === 404 && !skipCheck) {
            // No employer profile exists, redirect to setup
            router.push("/profile/setup-employer");
            return;
          }
          console.error("Failed to fetch employer profile:", err);
        }

        // Fetch offers
        let offersData = [];
        try {
          const offersRes = await offersApi.getEmployerOffers();
          offersData = offersRes.data || [];
        } catch (err: any) {
          console.error("Failed to fetch offers:", err);
        }

        if (employerData) setEmployer(employerData);
        setOffers(offersData);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, router]);

  const draftOffers = offers.filter((o) => o.status === "DRAFT");
  const submittedOffers = offers.filter((o) => o.status === "SUBMITTED" || o.status === "VIEWED");
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

  const renderOfferStatus = (status: string) => {
    try {
      return tEnums(`offerStatus.${status}`);
    } catch {
      return status;
    }
  };

  const renderVerification = (status?: string) => {
    if (!status) return "";
    try {
      return t(`company.verification.${status}`);
    } catch {
      return status.toLowerCase().replace('_', ' ');
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
        {/* Draft Profile Banner - shown when user has saved for later */}
        {!employer && typeof window !== 'undefined' && localStorage.getItem('employerProfileDraft') && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-yellow-800">{t("draftBanner.title")}</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {t("draftBanner.description")}
                </p>
              </div>
              <Link
                href="/profile/setup-employer"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm font-medium"
              >
                {t("draftBanner.continue")}
              </Link>
            </div>
          </div>
        )}

        {/* Company Status Banner */}
        {employer && (
          <div className="mb-8 p-4 bg-white border rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">{employer.companyName}</h3>
                  <p className="text-sm text-gray-500">
                    {t("company.kvk", { kvk: employer.kvkNumber })} •{" "}
                    <span
                      className={`capitalize ${
                        employer.verificationStatus === "BASIC_VERIFIED" || employer.verificationStatus === "PREMIUM_VERIFIED"
                          ? "text-green-600"
                          : employer.verificationStatus === "PENDING"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {renderVerification(employer.verificationStatus)}
                    </span>
                  </p>
                </div>
              </div>
              <Link
                href="/profile/edit-company"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t("company.edit")}
              </Link>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-gray-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.draftOffers")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{draftOffers.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.submitted")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{submittedOffers.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.shortlisted")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{shortlistedOffers.length}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">{t("stats.accepted")}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{acceptedOffers.length}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("actions.title")}</h2>

              <div className="space-y-3">
                <Link
                  href="/offers/create"
                  className="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{t("actions.createOffer")}</div>
                    <div className="text-sm text-blue-100">{t("actions.createOfferDesc")}</div>
                  </div>
                </Link>

                <Link
                  href="/workers"
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t("actions.searchWorkers")}</div>
                    <div className="text-sm text-gray-500">{t("actions.searchWorkersDesc")}</div>
                  </div>
                </Link>

                <Link
                  href="/offers"
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t("actions.viewAllOffers")}</div>
                    <div className="text-sm text-gray-500">{t("actions.viewAllOffersDesc")}</div>
                  </div>
                </Link>

                <Link
                  href="/conversations"
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserCheck className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">{t("actions.messages")}</div>
                    <div className="text-sm text-gray-500">{t("actions.messagesDesc")}</div>
                  </div>
                </Link>
              </div>
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
                            <span className="text-gray-500">
                              {renderWorkArrangement(offer.workArrangement?.type)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {t("recentOffers.created", { date: date(offer.createdAt) })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              offer.status === "DRAFT"
                                ? "bg-gray-100 text-gray-700"
                                : offer.status === "SUBMITTED"
                                ? "bg-blue-100 text-blue-700"
                                : offer.status === "VIEWED"
                                ? "bg-blue-100 text-blue-700"
                                : offer.status === "SHORTLISTED"
                                ? "bg-yellow-100 text-yellow-700"
                                : offer.status === "ACCEPTED"
                                ? "bg-green-100 text-green-700"
                                : offer.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {renderOfferStatus(offer.status)}
                          </span>
                          {offer.worker && (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-xs text-green-700 font-medium">
                                {offer.worker.publicId?.slice(0, 2).toUpperCase() || "W"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">{t("recentOffers.empty")}</p>
                  <Link
                    href="/offers/create"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    {t("recentOffers.createFirst")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}