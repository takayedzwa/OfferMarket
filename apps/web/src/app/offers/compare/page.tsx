"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { offersApi } from "../../../lib/api";
import { Offer } from "../../../lib/types";
import Navbar from "../../../components/Navbar";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOffers() {
      const offerIds = searchParams.get("ids")?.split(",");

      if (!offerIds || offerIds.length < 2) {
        setError("Please select at least 2 offers to compare");
        setLoading(false);
        return;
      }

      try {
        const accessToken = localStorage.getItem("accessToken");
        const userId = localStorage.getItem("userId");

        if (!accessToken || !userId) {
          router.push("/login");
          return;
        }

        // Load all offers
        const response = await offersApi.getWorkerOffers();
        const selectedOffers = response.data.filter((offer: Offer) =>
          offerIds.includes(offer.id)
        );

        if (selectedOffers.length < 2) {
          setError("Not enough offers found to compare");
          setLoading(false);
          return;
        }

        setOffers(selectedOffers);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load offers");
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading comparison...</div>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Compare</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/offers"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Back to Offers
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
              <span className="hidden sm:inline">Back to Offers</span>
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">
              Compare {offers.length} Offers
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
                    Comparison Criteria
                  </th>
                  {offers.map((offer) => (
                    <th key={offer.id} className="text-left py-4 px-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">Offer {offers.indexOf(offer) + 1}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* COMPENSATION SECTION */}
                <ComparisonSectionHeader title="💰 Compensation" />

                <ComparisonRow
                  label="Annual Salary"
                  icon={<Euro className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version) return null;
                    return `${formatCurrency(version.salaryMin)} - ${formatCurrency(version.salaryMax)}`;
                  }}
                  highlightBest
                  compareType="salary"
                />

                <ComparisonRow
                  label="Sign-on Bonus"
                  icon={<TrendingUp className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.signOnBonus ? formatCurrency(version.signOnBonus) : "Not offered";
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label="Performance Bonus"
                  icon={<Award className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.performanceBonusPct ? `${version.performanceBonusPct}% of salary` : "Not offered";
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                {/* BENEFITS SECTION */}
                <ComparisonSectionHeader title="🎁 Benefits" />

                <ComparisonRow
                  label="Vacation Days"
                  icon={<Calendar className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.vacationDays ? `${version.vacationDays} days` : "Not specified";
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label="Holiday Allowance"
                  icon={<Award className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.holidayAllowancePct ? `${version.holidayAllowancePct}%` : "Not specified";
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label="Pension Contribution"
                  icon={<Shield className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.pensionContributionPct ? `${version.pensionContributionPct}%` : "Not specified";
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label="Training Budget"
                  icon={<GraduationCap className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.trainingBudget ? formatCurrency(version.trainingBudget) : "Not specified";
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label="Company Vehicle"
                  icon={<Car className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version?.companyVehicle || version.companyVehicle === "not_provided") return "Not provided";
                    return version.companyVehicle.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
                  }}
                />

                <ComparisonRow
                  label="Phone Provided"
                  icon={<CheckCircle className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.phoneProvided ? "Yes" : "No";
                  }}
                  highlightBest
                  compareType="boolean"
                />

                <ComparisonRow
                  label="Laptop/Tools Provided"
                  icon={<CheckCircle className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.toolsProvided ? "Yes" : "No";
                  }}
                  highlightBest
                  compareType="boolean"
                />

                {/* WORK ARRANGEMENT SECTION */}
                <ComparisonSectionHeader title="🏠 Work Arrangement" />

                <ComparisonRow
                  label="Work Type"
                  icon={<Home className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    const remotePct = version?.remoteWorkPct || 0;
                    if (remotePct === 100) return "Fully Remote";
                    if (remotePct === 0) return "On-site";
                    return `Hybrid (${remotePct}% remote)`;
                  }}
                />

                <ComparisonRow
                  label="Remote Days/Week"
                  icon={<Home className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    const remotePct = version?.remoteWorkPct || 0;
                    return `${Math.round(remotePct / 20)} days`;
                  }}
                  highlightBest
                  compareType="higher-better"
                />

                <ComparisonRow
                  label="Schedule Type"
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.scheduleType?.join(", ") || "Daytime";
                  }}
                />

                <ComparisonRow
                  label="Travel Required"
                  icon={<MapPin className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    const travelPct = version?.travelRequiredPct || 0;
                    if (travelPct === 0) return "None";
                    return `${travelPct}% of time`;
                  }}
                  highlightBest
                  compareType="lower-better"
                />

                <ComparisonRow
                  label="Physical Requirements"
                  icon={<Users className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.physicalRequirements || "None specified";
                  }}
                />

                {/* CONTRACT SECTION */}
                <ComparisonSectionHeader title="📄 Contract" />

                <ComparisonRow
                  label="Contract Type"
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.contractType?.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()) || "Not specified";
                  }}
                />

                <ComparisonRow
                  label="Hours/Week"
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.hoursPerWeek ? `${version.hoursPerWeek} hours` : "Not specified";
                  }}
                />

                <ComparisonRow
                  label="Probation Period"
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.probationMonths ? `${version.probationMonths} months` : "None";
                  }}
                  highlightBest
                  compareType="lower-better"
                />

                <ComparisonRow
                  label="Start Date"
                  icon={<Calendar className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version?.startDate) return version?.startDateType === "flexible" ? "Flexible" : "Not specified";
                    return new Date(version.startDate).toLocaleDateString();
                  }}
                />

                {/* REQUIREMENTS SECTION */}
                <ComparisonSectionHeader title="✅ Requirements" />

                <ComparisonRow
                  label="Min. Experience"
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    return version?.requiredExperienceYears ? `${version.requiredExperienceYears}+ years` : "Not specified";
                  }}
                />

                <ComparisonRow
                  label="Required Certifications"
                  icon={<Award className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const version = offer.currentVersion || offer.versions?.[0];
                    if (!version?.requiredCertifications?.length) return "None";
                    return version.requiredCertifications.join(", ");
                  }}
                />

                {/* EMPLOYER SECTION */}
                <ComparisonSectionHeader title="🏢 Employer" />

                <ComparisonRow
                  label="Company"
                  icon={<Building2 className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.employer?.companyName || "Not disclosed"}
                />

                <ComparisonRow
                  label="Company Size"
                  icon={<Users className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.employer?.companySize || "Not specified"}
                />

                <ComparisonRow
                  label="Industry"
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.employer?.industry || "Not specified"}
                />

                {/* OFFER DETAILS SECTION */}
                <ComparisonSectionHeader title="📋 Offer Details" />

                <ComparisonRow
                  label="Job Title"
                  icon={<Briefcase className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.jobTitle}
                />

                <ComparisonRow
                  label="Department"
                  icon={<Users className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => offer.department || "Not specified"}
                />

                <ComparisonRow
                  label="Status"
                  icon={<Zap className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const statusColors: Record<string, string> = {
                      SUBMITTED: "🔵 New",
                      VIEWED: "🟣 Viewed",
                      SHORTLISTED: "🟡 Shortlisted",
                      ACCEPTED: "🟢 Accepted",
                      REJECTED: "🔴 Rejected",
                      COUNTERED: "🟠 Countered",
                      EXPIRED: "⚪ Expired",
                      WITHDRAWN: "⚪ Withdrawn",
                    };
                    return statusColors[offer.status] || offer.status;
                  }}
                />

                <ComparisonRow
                  label="Posted Date"
                  icon={<Calendar className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => new Date(offer.createdAt).toLocaleDateString()}
                />

                <ComparisonRow
                  label="Expires"
                  icon={<Clock className="w-4 h-4" />}
                  offers={offers}
                  getValue={(offer) => {
                    const expiresAt = new Date(offer.expiresAt);
                    const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft < 0) return "⚠️ Expired";
                    if (daysLeft === 0) return "⚠️ Today";
                    if (daysLeft <= 3) return `⚠️ ${daysLeft} days`;
                    return `${daysLeft} days`;
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
            Back to All Offers
          </Link>
          {offers.length === 2 && (
            <>
              {offers.map((offer) => (
                <Link
                  key={offer.id}
                  href={`/offers/${offer.id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  View Offer {offers.indexOf(offer) + 1} Details
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
  const version = offer.currentVersion || offer.versions?.[0];

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
          {offer.status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-4 h-4" />
          <span className="truncate">{offer.employer?.companyName || "Not disclosed"}</span>
        </div>
        {version && (
          <>
            <div className="flex items-center gap-2 text-gray-600">
              <Euro className="w-4 h-4" />
              <span>{formatCurrency(version.salaryMin)} - {formatCurrency(version.salaryMax)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Home className="w-4 h-4" />
              <span>
                {version.remoteWorkPct === 100 ? "Fully Remote" :
                 version.remoteWorkPct === 0 ? "On-site" :
                 `Hybrid (${version.remoteWorkPct}% remote)`}
              </span>
            </div>
          </>
        )}
      </div>

      <Link
        href={`/offers/${offer.id}`}
        className="mt-3 block text-center w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100"
      >
        View Details
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
      bestIndex = values.findIndex((v) => v === "Yes");
    } else if (compareType === "date") {
      // For dates, "best" is the furthest away (most time left)
      const dateValues = values.map((v, i) => {
        const str = String(v);
        const days = parseInt(str.match(/\d+/)?.[0] || "0");
        return { value: str.includes("Expired") ? -1 : days, index: i };
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CompareOffersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <CompareOffersContent />
    </Suspense>
  );
}
