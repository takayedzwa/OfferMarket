"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { offersApi } from "../../../lib/api";
import { Offer, OfferVersion } from "../../../lib/types";
import {
  ArrowLeft,
  Briefcase,
  Euro,
  MapPin,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  MessageSquare,
  Building2,
  User,
  Clock,
  TrendingUp,
  Edit2,
} from "lucide-react";

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [showCounterOffer, setShowCounterOffer] = useState(false);

  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  useEffect(() => {
    async function loadOffer() {
      try {
        const userId = localStorage.getItem("userId");
        let response;

        if (userRole === "EMPLOYER") {
          response = await offersApi.getEmployerOfferDetail(params.id as string, userId!);
        } else {
          response = await offersApi.getOffer(params.id as string);
        }

        setOffer(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load offer");
      } finally {
        setLoading(false);
      }
    }

    loadOffer();
  }, [params.id, userRole]);

  const handleAccept = async () => {
    if (!confirm("Are you sure you want to accept this offer?")) return;

    setActionLoading("accept");
    try {
      await offersApi.acceptOffer(params.id as string);
      router.push("/dashboard/worker");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to accept offer");
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this offer?")) return;

    setActionLoading("reject");
    try {
      await offersApi.rejectOffer(params.id as string);
      router.push("/dashboard/worker");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject offer");
    } finally {
      setActionLoading("");
    }
  };

  const handleCounterOffer = async (counterData: any) => {
    setActionLoading("counter");
    try {
      await offersApi.counterOffer(params.id as string, counterData);
      setShowCounterOffer(false);
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send counter offer");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading offer...</div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Offer not found</h2>
            <p className="text-gray-600">This offer may have been deleted or is no longer available.</p>
          </div>
        </main>
      </div>
    );
  }

  // Use currentVersion if available, otherwise fall back to versions array
  const currentVersion = offer.currentVersion || offer.versions?.[0];

  // Build a normalized view of the offer data from currentVersion
  const offerData = {
    ...offer,
    compensation: currentVersion ? {
      salary: {
        min: currentVersion.salaryMin,
        max: currentVersion.salaryMax,
        currency: "EUR",
        period: currentVersion.salaryPeriod
      },
      signOnBonus: currentVersion.signOnBonus,
      performanceBonusPct: currentVersion.performanceBonusPct,
    } : null,
    contract: currentVersion ? {
      type: currentVersion.contractType,
      durationMonths: currentVersion.contractDurationMonths,
      hoursPerWeek: currentVersion.hoursPerWeek,
      probationMonths: currentVersion.probationMonths,
    } : null,
    benefits: currentVersion ? {
      vacationDays: currentVersion.vacationDays,
      holidayAllowancePct: currentVersion.holidayAllowancePct,
      pensionContribution: currentVersion.pensionContributionPct,
      trainingBudget: currentVersion.trainingBudget,
      companyVehicle: currentVersion.companyVehicle,
      travelAllowanceType: currentVersion.travelAllowanceType,
      phoneProvided: currentVersion.phoneProvided,
      laptopProvided: currentVersion.toolsProvided,
    } : null,
    workArrangement: currentVersion ? {
      type: "HYBRID", // derived from remoteWorkPct
      scheduleType: currentVersion.scheduleType,
      remoteWorkPct: currentVersion.remoteWorkPct,
      travelRequiredPct: currentVersion.travelRequiredPct,
      physicalRequirements: currentVersion.physicalRequirements,
    } : null,
    requirements: currentVersion ? {
      requiredCertifications: currentVersion.requiredCertifications,
      minExperienceYears: currentVersion.requiredExperienceYears,
    } : null,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-2">
              {userRole === "EMPLOYER" && offer.status !== "ACCEPTED" && offer.status !== "REJECTED" && offer.status !== "WITHDRAWN" && (
                <button
                  onClick={() => router.push(`/offers/${offer.id}/edit`)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                {offer.status}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Main Offer Details */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{offer.jobTitle}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-1">
              <Euro className="w-4 h-4" />
              €{offerData.compensation?.salary?.min?.toLocaleString()} - €
              {offerData.compensation?.salary?.max?.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {offerData.workArrangement?.remoteWorkPct === 100
                ? "Remote"
                : offerData.workArrangement?.remoteWorkPct === 0
                ? "On-site"
                : "Hybrid"}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {offerData.contract?.type?.toLowerCase() || "permanent"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Posted {new Date(offer.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="prose max-w-none mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About this role</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{offer.jobDescription}</p>
          </div>

          {/* Employer Info */}
          {offer.employer && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Posted by</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {offer.employer.companyName}
                  </div>
                  <div className="text-sm text-gray-500">
                    KvK: {offer.employer.kvkNumber}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compensation & Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Compensation
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Salary Range</span>
                <span className="font-medium">
                  €{offerData.compensation?.salary?.min?.toLocaleString()} - €
                  {offerData.compensation?.salary?.max?.toLocaleString()}
                </span>
              </div>
              {offerData.compensation?.signOnBonus && offerData.compensation.signOnBonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Sign-on Bonus</span>
                  <span className="font-medium">€{offerData.compensation.signOnBonus.toLocaleString()}</span>
                </div>
              )}
              {offerData.compensation?.performanceBonusPct && offerData.compensation.performanceBonusPct > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Performance Bonus</span>
                  <span className="font-medium">{offerData.compensation.performanceBonusPct}% of salary</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Benefits
            </h3>
            <div className="space-y-2">
              {offerData.benefits?.vacationDays && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {offerData.benefits.vacationDays} vacation days
                </div>
              )}
              {offerData.benefits?.holidayAllowancePct && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {offerData.benefits.holidayAllowancePct}% holiday allowance
                </div>
              )}
              {offerData.benefits?.pensionContribution && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {offerData.benefits.pensionContribution}% pension contribution
                </div>
              )}
              {offerData.benefits?.trainingBudget && offerData.benefits.trainingBudget > 0 && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  €{offerData.benefits.trainingBudget.toLocaleString()} training budget
                </div>
              )}
              {offerData.benefits?.companyVehicle && offerData.benefits.companyVehicle !== "not_provided" && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Company vehicle: {offerData.benefits.companyVehicle.replace("_", " ")}
                </div>
              )}
              {offerData.benefits?.travelAllowanceType && offerData.benefits.travelAllowanceType !== "not_provided" && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Travel allowance: {offerData.benefits.travelAllowanceType.replace("_", " ")}
                </div>
              )}
              {offerData.benefits?.phoneProvided && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Phone provided
                </div>
              )}
              {offerData.benefits?.laptopProvided && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Laptop provided
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Work Arrangement */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Work Arrangement
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-500">Type</span>
              <p className="font-medium capitalize">
                {offerData.workArrangement?.remoteWorkPct === 100
                  ? "Remote"
                  : offerData.workArrangement?.remoteWorkPct === 0
                  ? "On-site"
                  : "Hybrid"}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Remote Work</span>
              <p className="font-medium">{offerData.workArrangement?.remoteWorkPct || 0}% ({offerData.workArrangement?.remoteWorkPct ? Math.round(offerData.workArrangement.remoteWorkPct / 20) : 0} days/week)</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Schedule</span>
              <p className="font-medium">{offerData.workArrangement?.scheduleType?.join(", ") || "Daytime"}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Travel Required</span>
              <p className="font-medium">{offerData.workArrangement?.travelRequiredPct ? `${offerData.workArrangement.travelRequiredPct}%` : "Not specified"}</p>
            </div>
            {offerData.workArrangement?.physicalRequirements && offerData.workArrangement.physicalRequirements !== "None" && (
              <div>
                <span className="text-sm text-gray-500">Physical Requirements</span>
                <p className="font-medium">{offerData.workArrangement.physicalRequirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Requirements */}
        {offerData.requirements && (offerData.requirements.requiredCertifications?.length || offerData.requirements.minExperienceYears) && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Requirements
            </h3>
            <div className="space-y-4">
              {offerData.requirements.minExperienceYears && offerData.requirements.minExperienceYears > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Minimum Experience</span>
                  <p className="font-medium">
                    {offerData.requirements.minExperienceYears}+ years
                  </p>
                </div>
              )}
              {offerData.requirements.requiredCertifications && offerData.requirements.requiredCertifications.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Required Certifications</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {offerData.requirements.requiredCertifications.map((cert: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons for Worker */}
        {userRole === "WORKER" && offer.status === "SUBMITTED" && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Response</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAccept}
                disabled={actionLoading === "accept"}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                {actionLoading === "accept" ? "Accepting..." : "Accept Offer"}
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === "reject"}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                {actionLoading === "reject" ? "Rejecting..." : "Reject Offer"}
              </button>
              <button
                onClick={() => setShowCounterOffer(true)}
                disabled={actionLoading === "counter"}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <TrendingUp className="w-5 h-5" />
                {actionLoading === "counter" ? "Sending..." : "Counter Offer"}
              </button>
            </div>
          </div>
        )}

        {/* Version History */}
        {offer.versions && offer.versions.length > 1 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Offer History ({offer.versions.length} versions)
            </h3>
            <div className="space-y-3">
              {offer.versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`p-4 rounded-lg border ${
                    index === offer.versions.length - 1
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Version {index + 1}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {index === offer.versions.length - 1 && (
                      <span className="text-xs font-medium text-blue-600">Current</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Counter Offer Modal */}
      {showCounterOffer && (
        <CounterOfferModal
          offer={offer}
          onSubmit={handleCounterOffer}
          onCancel={() => setShowCounterOffer(false)}
          loading={actionLoading === "counter"}
        />
      )}
    </div>
  );
}

function CounterOfferModal({
  offer,
  onSubmit,
  onCancel,
  loading,
}: {
  offer: Offer;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const currentVersion = offer.currentVersion || offer.versions?.[0];
  const [salaryMin, setSalaryMin] = useState(currentVersion?.salaryMin || 60000);
  const [salaryMax, setSalaryMax] = useState(currentVersion?.salaryMax || 80000);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      compensation: {
        salary: {
          min: salaryMin,
          max: salaryMax,
          currency: "EUR",
        },
      },
      message: message || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Counter Offer</h2>
        <p className="text-gray-600 mb-4">
          Propose a different salary range to the employer.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Current offer: €
            {currentVersion?.salaryMin?.toLocaleString()} - €
            {currentVersion?.salaryMax?.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Min Salary (€)
              </label>
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Max Salary (€)
              </label>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {salaryMax - salaryMin > 5000 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              Salary range spread must not exceed €5,000
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
              placeholder="Explain your counter offer..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || salaryMax - salaryMin > 5000}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Counter Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
