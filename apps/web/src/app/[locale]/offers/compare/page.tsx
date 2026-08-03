"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { offersApi } from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import { useApiErrorMessage } from "@/hooks/useApiErrorMessage";
import { Offer } from "@/lib/types";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft,
  Euro,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  Building2,
  Clock,
  TrendingUp,
  GraduationCap,
  Car,
  Home,
  Star,
  ThumbsUp,
  Briefcase,
  Shield,
  Users,
  Zap,
} from "lucide-react";

// ============================================================================
// COMPARISON DATA MODEL
// ============================================================================

interface ComparisonCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: ComparisonItem[];
}

interface ComparisonItem {
  id: string;
  label: string;
  values: (string | number | boolean | null | undefined)[];
  bestValueIndex?: number;
  format?: (value: any) => string;
}

function CompareOffersContent() {
  const t = useTranslations("offers.compare");
  const tEnums = useTranslations("enums");
  const apiError = useApiErrorMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { currency, date } = useFormat();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Safe lookup helpers for backend-driven enum-like values not in the enums
  // namespace. Falls back to a humanized version of the raw value.
  const safeT = (key: string, fallback: string) => {
    try { return t(key as any); } catch { return fallback; }
  };
  const contractTypeLabel = (val: string | undefined) => {
    const v = val?.toLowerCase();
    if (!v) return t("value.notSpecified");
    return safeT(`contractType.${v}`, v.replace("_", " "));
  };
  const companyVehicleLabel = (val: string) =>
    safeT(`companyVehicleType.${val}`, val.replace("_", " "));
  const scheduleLabel = (val: string) =>
    safeT(`scheduleType.${val}`, val.replace("_", " "));
  const statusBadgeLabel = (status: string) =>
    safeT(`statusBadge.${status}`, status);
  const offerStatusLabel = (status: string) => {
    try { return tEnums(`offerStatus.${status}` as any); } catch { return status; }
  };

  useEffect(() => {
    async function loadOffers() {
      const offerIds = searchParams.get("ids")?.split(",");

      if (!offerIds || offerIds.length < 2) {
        setError(t("errorMinSelected"));
        setLoading(false);
        return;
      }

      // SECURITY: identity comes from AuthContext (JWT via /auth/me), not
      // localStorage. The login page stores only tokens.
      if (authLoading) return;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // Load all offers
        const response = await offersApi.getWorkerOffers();
        const selectedOffers = response.data.filter((offer: Offer) =>
          offerIds.includes(offer.id)
        );

        if (selectedOffers.length < 2) {
          setError(t("errorNotEnough"));
          setLoading(false);
          return;
        }

        setOffers(selectedOffers);
      } catch (err: any) {
        setError(apiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [searchParams, router, user, authLoading, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("errorTitle")}</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/offers"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              {t("backToOffers")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/offers"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t("backToOffers")}</span>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">
              {t("title", { count: offers.length })}
            </h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {offers.map((offer, index) => (
            <OfferSummaryCard key={offer.id} offer={offer} rank={index + 1} />
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-4 px-4 font-semibold text-gray-900 w-48 sticky left-0 bg-gray-50">
                    {t("comparisonCriteria")}
                  </th>
                  {offers.map((offer) => (
                    <th key={offer.id} className="text-left py-4 px-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{t("offerLabel", { number: offers.indexOf(offer) + 1 })}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* COMPENSATION SECTION */}
                <ComparisonSectionHeader title={t("section.compensation")} />

                <ComparisonRow
                  label={t("row.annualSalary")}
                  icon={<Euro className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version) return null;
                    return `${currency(version.salaryMin, "EUR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - ${currency(version.salaryMax, "EUR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                  }}
                  highlightBest
                  compareType="salary"
                />

                <ComparisonRow
                  label={t("row.signOnBonus")}
                  icon={<TrendingUp className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.signOnBonus ? currency(version.signOnBonus, "EUR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : t("value.notOffered");
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label={t("row.performanceBonus")}
                  icon={<Award className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.performanceBonusPct ? t("value.percentOfSalary", { pct: version.performanceBonusPct }) : t("value.notOffered");
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                {/* BENEFITS SECTION */}
                <ComparisonSectionHeader title={t("section.benefits")} />

                <ComparisonRow
                  label={t("row.vacationDays")}
                  icon={<Calendar className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.vacationDays ? t("value.days", { count: version.vacationDays }) : t("value.notSpecified");
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label={t("row.holidayAllowance")}
                  icon={<Award className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.holidayAllowancePct ? t("value.percent", { pct: version.holidayAllowancePct }) : t("value.notSpecified");
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label={t("row.pensionContribution")}
                  icon={<Shield className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.pensionContributionPct ? t("value.percent", { pct: version.pensionContributionPct }) : t("value.notSpecified");
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label={t("row.trainingBudget")}
                  icon={<GraduationCap className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.trainingBudget ? currency(version.trainingBudget, "EUR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : t("value.notSpecified");
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label={t("row.companyVehicle")}
                  icon={<Car className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version?.companyVehicle || version.companyVehicle === "not_provided") return t("value.notProvided");
                    return companyVehicleLabel(version.companyVehicle);
                  }}
                />

                <ComparisonRow
                  label={t("row.phoneProvided")}
                  icon={<CheckCircle className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.phoneProvided ? t("value.yes") : t("value.no");
                  }}
                  highlightBest
                  compareType="boolean"
                />

                <ComparisonRow
                  label={t("row.laptopToolsProvided")}
                  icon={<CheckCircle className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.toolsProvided ? t("value.yes") : t("value.no");
                  }}
                  highlightBest
                  compareType="boolean"
                />

                {/* WORK ARRANGEMENT SECTION */}
                <ComparisonSectionHeader title={t("section.workArrangement")} />

                <ComparisonRow
                  label={t("row.workType")}
                  icon={<Home className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    const remotePct = version?.remoteWorkPct || 0;
                    if (remotePct === 100) return t("value.fullyRemote");
                    if (remotePct === 0) return t("value.onsite");
                    return t("value.hybridRemote", { pct: remotePct });
                  }}
                />

                <ComparisonRow
                  label={t("row.remoteDaysPerWeek")}
                  icon={<Home className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    const remotePct = version?.remoteWorkPct || 0;
                    return t("value.days", { count: Math.round(remotePct / 20) });
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label={t("row.scheduleType")}
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.scheduleType?.map(scheduleLabel).join(", ") || scheduleLabel("daytime");
                  }}
                />

                <ComparisonRow
                  label={t("row.travelRequired")}
                  icon={<MapPin className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    const travelPct = version?.travelRequiredPct || 0;
                    if (travelPct === 0) return t("value.none");
                    return t("value.percentOfTime", { pct: travelPct });
                  }}
                  highlightBest
                  compareType="lower-better"
                />

                <ComparisonRow
                  label={t("row.physicalRequirements")}
                  icon={<Users className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.physicalRequirements || t("value.noneSpecified");
                  }}
                />

                {/* CONTRACT SECTION */}
                <ComparisonSectionHeader title={t("section.contract")} />

                <ComparisonRow
                  label={t("row.contractType")}
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return contractTypeLabel(version?.contractType);
                  }}
                />

                <ComparisonRow
                  label={t("row.hoursPerWeek")}
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.hoursPerWeek ? t("value.hours", { count: version.hoursPerWeek }) : t("value.notSpecified");
                  }}
                />

                <ComparisonRow
                  label={t("row.probationPeriod")}
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.probationMonths ? t("value.months", { count: version.probationMonths }) : t("value.none");
                  }}
                  highlightBest
                  compareType="lower-better"
                />

                <ComparisonRow
                  label={t("row.startDate")}
                  icon={<Calendar className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version?.startDate) return version?.startDateType === "flexible" ? t("value.flexible") : t("value.notSpecified");
                    return date(version.startDate);
                  }}
                />

                {/* REQUIREMENTS SECTION */}
                <ComparisonSectionHeader title={t("section.requirements")} />

                <ComparisonRow
                  label={t("row.minExperience")}
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.requiredExperienceYears ? t("value.yearsExperience", { count: version.requiredExperienceYears }) : t("value.notSpecified");
                  }}
                />

                <ComparisonRow
                  label={t("row.requiredCertifications")}
                  icon={<Award className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version?.requiredCertifications?.length) return t("value.none");
                    return version.requiredCertifications.join(", ");
                  }}
                />

                {/* EMPLOYER SECTION */}
                <ComparisonSectionHeader title={t("section.employer")} />

                <ComparisonRow
                  label={t("row.company")}
                  icon={<Building2 className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.employer?.companyName || t("value.notDisclosed")}
                />

                <ComparisonRow
                  label={t("row.companySize")}
                  icon={<Users className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.employer?.companySize || t("value.notSpecified")}
                />

                <ComparisonRow
                  label={t("row.industry")}
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.employer?.industry || t("value.notSpecified")}
                />

                {/* OFFER DETAILS SECTION */}
                <ComparisonSectionHeader title={t("section.offerDetails")} />

                <ComparisonRow
                  label={t("row.jobTitle")}
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.jobTitle}
                />

                <ComparisonRow
                  label={t("row.department")}
                  icon={<Users className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.department || t("value.notSpecified")}
                />

                <ComparisonRow
                  label={t("row.status")}
                  icon={<Zap className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => statusBadgeLabel(offer.status)}
                />

                <ComparisonRow
                  label={t("row.postedDate")}
                  icon={<Calendar className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => date(offer.createdAt)}
                />

                <ComparisonRow
                  label={t("row.expires")}
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const expiresAt = new Date(offer.expiresAt);
                    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft < 0) return t("value.expired");
                    if (daysLeft === 0) return t("value.today");
                    if (daysLeft <= 3) return t("value.expiresSoon", { count: daysLeft });
                    return t("value.days", { count: daysLeft });
                  }}
                  highlightBest
                  compareType="date"
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/offers"
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("backToAllOffers")}
          </Link>
          {offers.length === 2 && (
            <>
              {offers.map((offer) => (
                <Link
                  key={offer.id}
                  href={`/offers/${offer.id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  {t("viewOfferDetails", { number: offers.indexOf(offer) + 1 })}
                </Link>
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function OfferSummaryCard({ offer, rank }: { offer: Offer; rank: number }) {
  const t = useTranslations("offers.compare");
  const tEnums = useTranslations("enums");
  const version = offer.currentVersion || offer.versions?.[0];
  const { currency } = useFormat();

  const statusLabel = (() => {
    try { return tEnums(`offerStatus.${offer.status}` as any); } catch { return offer.status; }
  })();

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600">#{rank}</span>
          </div>
          <h3 className="font-semibold text-gray-900">{offer.jobTitle}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          offer.status === "SUBMITTED" || offer.status === "VIEWED" ? "bg-blue-100 text-blue-700" :
          offer.status === "SHORTLISTED" ? "bg-yellow-100 text-yellow-700" :
          offer.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
          "bg-gray-100 text-gray-700"
        }`}>
          {statusLabel}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-4 h-4" />
          <span className="truncate">{offer.employer?.companyName || t("value.notDisclosed")}</span>
        </div>
        {version && (
          <>
            <div className="flex items-center gap-2 text-gray-600">
              <Euro className="w-4 h-4" />
              <span>{currency(version.salaryMin, "EUR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} - {currency(version.salaryMax, "EUR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Home className="w-4 h-4" />
              <span>
                {version.remoteWorkPct === 100 ? t("value.fullyRemote") :
                 version.remoteWorkPct === 0 ? t("value.onsite") :
                 t("value.hybridRemote", { pct: version.remoteWorkPct })}
              </span>
            </div>
          </>
        )}
      </div>

      <Link
        href={`/offers/${offer.id}`}
        className="mt-3 block text-center w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
      >
        {t("viewDetails")}
      </Link>
    </div>
  );
}

function ComparisonSectionHeader({ title }: { title: string }) {
  return (
    <tr className="bg-gray-100 border-b">
      <td colSpan={100} className="py-3 px-4 font-semibold text-gray-900">
        {title}
      </td>
    </tr>
  );
}

function ComparisonRow({
  offers,
  label,
  icon,
  getValue,
  highlightBest = false,
  compareType,
}: {
  offers: Offer[];
  label: string;
  icon: React.ReactNode;
  getValue: (offer: Offer) => string | number | null | undefined;
  highlightBest?: boolean;
  compareType?: "higher-better" | "lower-better" | "salary" | "boolean" | "date";
}) {
  const t = useTranslations("offers.compare");
  const values = offers.map(getValue);

  // Determine best value for highlighting
  let bestIndex: number | undefined;
  if (highlightBest && compareType) {
    if (compareType === "higher-better") {
      const numericValues = values.map((v, i) => ({
        value: typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0,
        index: i,
      }));
      const max = Math.max(...numericValues.map((v) => v.value));
      bestIndex = numericValues.find((v) => v.value === max)?.index;
    } else if (compareType === "lower-better") {
      const numericValues = values.map((v, i) => ({
        value: typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.-]/g, "")) || Infinity,
        index: i,
      }));
      const min = Math.min(...numericValues.map((v) => v.value));
      bestIndex = numericValues.find((v) => v.value === min)?.index;
    } else if (compareType === "salary") {
      const salaryValues = values.map((v, i) => ({
        value: parseFloat(String(v).replace(/[^0-9.-]/g, "")) || 0,
        index: i,
      }));
      const max = Math.max(...salaryValues.map((v) => v.value));
      bestIndex = salaryValues.find((v) => v.value === max)?.index;
    } else if (compareType === "boolean") {
      bestIndex = values.findIndex((v) => v === t("value.yes"));
    } else if (compareType === "date") {
      // For dates, "best" is the furthest away (most time left)
      const expiredMarker = t("value.expired");
      const dateValues = values.map((v, i) => {
        const str = String(v);
        const days = parseInt(str.match(/\d+/)?.[0] || "0");
        return { value: str.includes(expiredMarker) ? -1 : days, index: i };
      });
      const max = Math.max(...dateValues.map((v) => v.value));
      bestIndex = dateValues.find((v) => v.value === max)?.index;
    }
  }

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-3 px-4 sticky left-0 bg-white">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-gray-400">{icon}</span>
          <span className="font-medium">{label}</span>
        </div>
      </td>
      {values.map((value, index) => (
        <td
          key={index}
          className={`py-3 px-4 ${
            highlightBest && index === bestIndex ? "bg-green-50" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {highlightBest && index === bestIndex && (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            )}
            <span className={highlightBest && index === bestIndex ? "font-semibold text-green-700" : "text-gray-900"}>
              {value}
            </span>
          </div>
        </td>
      ))}
    </tr>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

export default function CompareOffersPage() {
  const t = useTranslations("offers.compare");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">{t("loadingFallback")}</div>
        </div>
      }
    >
      <CompareOffersContent />
    </Suspense>
  );
}