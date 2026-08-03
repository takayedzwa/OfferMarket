"use client";

import { useEffect, useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { offersApi } from "@/lib/api";
import { Offer } from "@/lib/types";
import { Briefcase, Euro, MapPin, Calendar, Filter, Search, GitCompare, X } from "lucide-react";

function OffersContent() {
  const t = useTranslations("offers.list");
  const tEnums = useTranslations("enums");
  const { user, loading: authLoading } = useAuth();
  const { currency, date } = useFormat();
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareBar, setShowCompareBar] = useState(false);
  const router = useRouter();

  const userRole: string | null = user?.role ?? null;

  useEffect(() => {
    // Load previously selected offers for comparison from sessionStorage
    const saved = sessionStorage.getItem("selectedForCompare");
    if (saved) {
      setSelectedForCompare(JSON.parse(saved));
    }

    async function loadOffers() {
      // SECURITY: identity/role come from AuthContext (JWT via /auth/me), not
      // localStorage. The login page stores only tokens.
      if (authLoading) return;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        let response;

        if (userRole === "WORKER") {
          response = await offersApi.getWorkerOffers();
        } else {
          response = await offersApi.getEmployerOffers();
        }

        setOffers(response.data);
      } catch (error) {
        console.error("Failed to load offers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [user, authLoading, userRole, router]);

  // Persist selected offers to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("selectedForCompare", JSON.stringify(selectedForCompare));
    setShowCompareBar(selectedForCompare.length >= 2);
  }, [selectedForCompare]);

  const toggleCompareSelection = (offerId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(offerId)) {
        return prev.filter((id) => id !== offerId);
      }
      if (prev.length >= 3) {
        alert(t("compareLimitAlert"));
        return prev;
      }
      return [...prev, offerId];
    });
  };

  const clearCompareSelection = () => {
    setSelectedForCompare([]);
    sessionStorage.removeItem("selectedForCompare");
  };

  const goToComparison = () => {
    if (selectedForCompare.length >= 2) {
      router.push(`/offers/compare?ids=${selectedForCompare.join(",")}`);
    }
  };

  const filteredOffers = offers.filter((offer) => {
    let matchesFilter = filter === "all";

    if (!matchesFilter && userRole) {
      if (userRole === "WORKER") {
        // Worker-friendly filter mapping
        if (filter === "submitted") {
          matchesFilter = offer.status === "SUBMITTED" || offer.status === "VIEWED";
        } else if (filter === "rejected") {
          matchesFilter = offer.status === "REJECTED";
        } else if (filter === "countered") {
          matchesFilter = offer.status === "COUNTERED";
        } else {
          matchesFilter = offer.status === filter.toUpperCase();
        }
      } else {
        matchesFilter = offer.status.toLowerCase() === filter.toLowerCase();
      }
    }

    const matchesSearch =
      searchQuery === "" ||
      offer.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.jobDescription?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Worker-facing status labels collapse SUBMITTED/VIEWED into "New Offer";
  // other roles see the canonical `enums.offerStatus` label.
  const getStatusLabel = (status: string) => {
    if (userRole === "WORKER") {
      if (status === "SUBMITTED" || status === "VIEWED") return t("statusWorker.new");
      if (status === "SHORTLISTED") return t("statusWorker.shortlisted");
      if (status === "ACCEPTED") return t("statusWorker.accepted");
      if (status === "REJECTED") return t("statusWorker.declined");
      if (status === "COUNTERED") return t("statusWorker.counterOfferSent");
      if (status === "WITHDRAWN") return t("statusWorker.withdrawn");
      if (status === "EXPIRED") return t("statusWorker.expired");
    }
    return tEnums(`offerStatus.${status}` as any);
  };

  const getStatusColor = (status: string) => {
    if (status === "SUBMITTED" || status === "VIEWED") return "bg-blue-100 text-blue-700";
    if (status === "DRAFT") return "bg-gray-100 text-gray-700";
    if (status === "SHORTLISTED") return "bg-yellow-100 text-yellow-700";
    if (status === "ACCEPTED") return "bg-green-100 text-green-700";
    if (status === "REJECTED") return "bg-red-100 text-red-700";
    if (status === "COUNTERED") return "bg-purple-100 text-purple-700";
    if (status === "WITHDRAWN" || status === "EXPIRED") return "bg-gray-100 text-gray-700";
    return "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("loadingOffers")}</div>
      </div>
    );
  }

  // Only show comparison features for workers
  const isWorker = userRole === "WORKER";

  const wholeEuro = { minimumFractionDigits: 0, maximumFractionDigits: 0 } as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Comparison Bar - shown when 2+ offers selected */}
      {isWorker && showCompareBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <GitCompare className="w-6 h-6" />
                <span className="font-medium">
                  {t("offersSelected", { count: selectedForCompare.length })}
                </span>
                {selectedForCompare.length < 2 && (
                  <span className="text-blue-200 text-sm">
                    {t("selectMore", { count: 2 - selectedForCompare.length })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearCompareSelection}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t("clear")}
                </button>
                <button
                  onClick={goToComparison}
                  disabled={selectedForCompare.length < 2}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <GitCompare className="w-4 h-4" />
                  {t("compareNow")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${showCompareBar ? "mb-24" : ""}`}>
        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="all">{t("filter.all")}</option>
                {userRole ? (
                  userRole === "WORKER" ? (
                    <>
                      <option value="submitted">{t("filter.new")}</option>
                      <option value="viewed">{t("filter.viewed")}</option>
                      <option value="shortlisted">{t("filter.shortlisted")}</option>
                      <option value="accepted">{t("filter.accepted")}</option>
                      <option value="rejected">{t("filter.declined")}</option>
                      <option value="countered">{t("filter.counterOfferSent")}</option>
                    </>
                  ) : (
                    <>
                      <option value="draft">{t("filter.draft")}</option>
                      <option value="submitted">{t("filter.submitted")}</option>
                      <option value="viewed">{t("filter.viewed")}</option>
                      <option value="shortlisted">{t("filter.shortlisted")}</option>
                      <option value="accepted">{t("filter.accepted")}</option>
                      <option value="rejected">{t("filter.rejected")}</option>
                      <option value="countered">{t("filter.countered")}</option>
                    </>
                  )
                ) : null}
              </select>
            </div>
          </div>
        </div>

        {/* Offers List */}
        {filteredOffers.length > 0 ? (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <div
                key={offer.id}
                className={`bg-white rounded-xl border shadow-sm hover:border-blue-300 hover:shadow-md transition-all ${
                  isWorker && selectedForCompare.includes(offer.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {offer.jobTitle}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}
                        >
                          {getStatusLabel(offer.status)}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {offer.jobDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Euro className="w-4 h-4" />
                          {currency(offer.compensation?.salary?.min ?? 0, "EUR", wholeEuro)} - {currency(offer.compensation?.salary?.max ?? 0, "EUR", wholeEuro)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {offer.workArrangement?.type === "ONSITE"
                            ? t("workArrangement.onsite")
                            : offer.workArrangement?.type === "REMOTE"
                            ? t("workArrangement.remote")
                            : t("workArrangement.hybrid")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {offer.contract?.type?.toLowerCase() || t("contractPermanent")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {date(offer.createdAt, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center gap-4">
                      {/* Compare Checkbox - Workers only */}
                      {isWorker && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleCompareSelection(offer.id);
                          }}
                          className={`p-2 rounded-lg border transition-colors ${
                            selectedForCompare.includes(offer.id)
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "bg-white border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500"
                          }`}
                          title={
                            selectedForCompare.includes(offer.id)
                              ? t("removeFromComparison")
                              : t("addToComparison")
                          }
                        >
                          <GitCompare className="w-5 h-5" />
                        </button>
                      )}

                      {userRole === "EMPLOYER" && offer.worker && (
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-700">
                            {offer.worker.publicId?.slice(0, 2).toUpperCase() || "W"}
                          </span>
                        </div>
                      )}

                      <Link
                        href={`/offers/${offer.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        {t("view")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("noOffers")}</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? t("adjustSearch")
                : userRole === "EMPLOYER"
                ? t("createFirstOffer")
                : t("offersWillAppear")}
            </p>
            {userRole === "EMPLOYER" && (
              <Link
                href="/offers/create"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                {t("createOffer")}
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <OffersContent />
    </Suspense>
  );
}