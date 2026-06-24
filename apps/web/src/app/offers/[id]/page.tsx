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
  GitCompare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Shield,
  Info,
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
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [employerStats, setEmployerStats] = useState<any>(null);
  const [employerRatings, setEmployerRatings] = useState<any[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  // Load selected offers for comparison
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("selectedForCompare");
      if (saved) {
        setSelectedForCompare(JSON.parse(saved));
      }
    }
  }, []);

  const toggleCompareSelection = () => {
    if (!offer) return;

    const newSelection = selectedForCompare.includes(offer.id)
      ? selectedForCompare.filter((id) => id !== offer.id)
      : [...selectedForCompare, offer.id];

    setSelectedForCompare(newSelection);
    sessionStorage.setItem("selectedForCompare", JSON.stringify(newSelection));
  };

  const goToComparison = () => {
    if (!offer) return;

    if (selectedForCompare.includes(offer.id)) {
      const others = selectedForCompare.filter((id) => id !== offer.id);
      if (others.length >= 1) {
        router.push(`/offers/compare?ids=${[offer.id, ...others].join(",")}`);
      }
    } else if (selectedForCompare.length >= 1) {
      router.push(`/offers/compare?ids=${[offer.id, ...selectedForCompare].join(",")}`);
    }
  };

  // Helper to get worker-friendly status labels
  const getStatusLabel = (status: string) => {
    if (userRole === "WORKER") {
      if (status === "SUBMITTED" || status === "VIEWED") return "New Offer";
      if (status === "SHORTLISTED") return "Shortlisted";
      if (status === "ACCEPTED") return "Accepted";
      if (status === "REJECTED") return "Declined";
      if (status === "COUNTERED") return "Counter Offer Sent";
      if (status === "WITHDRAWN") return "Withdrawn";
      if (status === "EXPIRED") return "Expired";
    }
    return status;
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

        // Load employer ratings if we have an employer
        if (response.data?.employer?.id) {
          loadEmployerRatings(response.data.employer.id);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load offer");
      } finally {
        setLoading(false);
      }
    }

    loadOffer();
  }, [params.id, userRole]);

  const loadEmployerRatings = async (employerId: string) => {
    setLoadingRatings(true);
    try {
      const [statsRes, ratingsRes, myRatingsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/v1/ratings/employer/${employerId}/stats`),
        fetch(`http://localhost:3001/api/v1/ratings/employer/${employerId}?limit=5`),
        fetch(`http://localhost:3001/api/v1/ratings/my`, {
          headers: { 'x-user-id': localStorage.getItem('userId') || '' }
        })
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setEmployerStats(stats);
      }

      if (ratingsRes.ok) {
        const ratings = await ratingsRes.json();
        setEmployerRatings(ratings);
      }

      if (myRatingsRes.ok) {
        const myRatings = await myRatingsRes.json();
        // Check if user already rated this employer
        const hasRatedThisEmployer = myRatings.some((r: any) => r.employerId === employerId);
        setHasRated(hasRatedThisEmployer);
      }
    } catch (err) {
      console.error("Failed to load employer ratings:", err);
    } finally {
      setLoadingRatings(false);
    }
  };

  const handleSubmitRating = async (ratingData: any) => {
    try {
      const userId = localStorage.getItem('userId');
      console.log('Submitting rating for offer:', params.id, 'userId:', userId);

      const response = await fetch('http://localhost:3001/api/v1/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify({
          offerId: params.id,
          ...ratingData
        })
      });

      const responseData = await response.json();
      console.log('Rating response:', response.status, responseData);

      if (response.ok) {
        setHasRated(true);
        setShowRateModal(false);
        // Reload ratings
        if (offer?.employer?.id) {
          loadEmployerRatings(offer.employer.id);
        }
      } else {
        setError(responseData.message || 'Failed to submit rating');
      }
    } catch (err: any) {
      console.error('Rating submission error:', err);
      setError(err.message || 'Failed to submit rating');
    }
  };

  const handleAccept = async () => {
    if (!confirm("Are you sure you want to accept this offer?")) return;

    setActionLoading("accept");
    try {
      await offersApi.acceptOffer(params.id as string);
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to accept offer");
      // Refresh to get current status
      setTimeout(() => router.refresh(), 2000);
    } finally {
      setActionLoading("");
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this offer?")) return;

    setActionLoading("reject");
    try {
      await offersApi.rejectOffer(params.id as string);
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject offer");
      // Refresh to get current status
      setTimeout(() => router.refresh(), 2000);
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
              {userRole === "EMPLOYER" && offer.status !== "ACCEPTED" && offer.status !== "REJECTED" && offer.status !== "WITHDRAWN" && offer.status !== "EXPIRED" && (
                <button
                  onClick={() => router.push(`/offers/${offer.id}/edit`)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {userRole === "WORKER" && (
                <button
                  onClick={toggleCompareSelection}
                  className={`flex items-center gap-1 px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedForCompare.includes(offer.id)
                      ? "bg-blue-500 text-white"
                      : "text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  {selectedForCompare.includes(offer.id) ? "Selected" : "Compare"}
                </button>
              )}
              {userRole === "WORKER" && selectedForCompare.length >= 1 && (
                <button
                  onClick={goToComparison}
                  disabled={!selectedForCompare.includes(offer.id) && selectedForCompare.length < 1}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <GitCompare className="w-4 h-4" />
                  Compare Now
                </button>
              )}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusLabel(offer.status) === offer.status ? getStatusColor(offer.status) : getStatusColor(offer.status)}`}
              >
                {getStatusLabel(offer.status)}
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

          {/* Employer Reputation / Ratings */}
          {userRole === "WORKER" && offer.employer && (
            <div className="border-t pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Company Reputation
                </h3>
                {/* Rate Button - Show if offer is in final state and user hasn't rated */}
                {['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'].includes(offer.status) && !hasRated && (
                  <button
                    onClick={() => setShowRateModal(true)}
                    className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    Rate this Company
                  </button>
                )}
                {hasRated && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    You rated this company
                  </span>
                )}
              </div>

              {loadingRatings ? (
                <div className="text-gray-500 text-sm">Loading reputation data...</div>
              ) : employerStats ? (
                <div className="space-y-4">
                  {/* Trust Score Badge */}
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl ${
                      employerStats.trustScore >= 80 ? 'bg-green-500' :
                      employerStats.trustScore >= 60 ? 'bg-yellow-500' :
                      employerStats.trustScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {employerStats.trustScoreGrade !== 'N/A' ? employerStats.trustScoreGrade : '-'}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {employerStats.trustScore}/100
                      </div>
                      <div className="text-sm text-gray-500">
                        Trust Score ({employerStats.totalRatings} reviews)
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="grid grid-cols-2 gap-3">
                    {employerStats.averageOverall > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-1 text-yellow-500 mb-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium text-gray-700">Overall</span>
                        </div>
                        <div className="text-lg font-semibold">{employerStats.averageOverall}/5</div>
                      </div>
                    )}
                    {employerStats.averageCommunication > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Communication</div>
                        <div className="text-lg font-semibold">{employerStats.averageCommunication}/5</div>
                      </div>
                    )}
                    {employerStats.averageTransparency > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Transparency</div>
                        <div className="text-lg font-semibold">{employerStats.averageTransparency}/5</div>
                      </div>
                    )}
                    {employerStats.averageInterviewExperience > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Interview</div>
                        <div className="text-lg font-semibold">{employerStats.averageInterviewExperience}/5</div>
                      </div>
                    )}
                    {employerStats.averageWorkLifeBalance > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Work-Life</div>
                        <div className="text-lg font-semibold">{employerStats.averageWorkLifeBalance}/5</div>
                      </div>
                    )}
                    {employerStats.averageOfferAccuracy > 0 && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Offer Accuracy</div>
                        <div className="text-lg font-semibold">{employerStats.averageOfferAccuracy}/5</div>
                      </div>
                    )}
                  </div>

                  {/* Would Work Again */}
                  {employerStats.wouldWorkAgainPercentage !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      <ThumbsUp className={`w-4 h-4 ${
                        (employerStats.wouldWorkAgainPercentage || 0) >= 70 ? 'text-green-500' : 'text-gray-400'
                      }`} />
                      <span className="text-gray-600">
                        {employerStats.wouldWorkAgainPercentage}% would work here again
                      </span>
                    </div>
                  )}

                  {/* Trust Score Factors */}
                  {employerStats.factors && (
                    <div className="space-y-2">
                      {employerStats.factors.positive?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {employerStats.factors.positive.slice(0, 3).map((factor: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                              <CheckCircle className="w-3 h-3" />
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                      {employerStats.factors.negative?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {employerStats.factors.negative.slice(0, 2).map((factor: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                              <Info className="w-3 h-3" />
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Reviews */}
                  {employerRatings.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-xs font-medium text-gray-500 mb-2">Recent Reviews</h4>
                      <div className="space-y-2">
                        {employerRatings.slice(0, 3).map((rating: any) => (
                          <div key={rating.id} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{rating.reviewTitle || 'Anonymous Review'}</span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < rating.ratingOverall ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {rating.reviewText && (
                              <p className="text-sm text-gray-600 line-clamp-2">{rating.reviewText}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                              {rating.isVerifiedHire && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                  Verified Hire
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  No reviews yet for this company
                </div>
              )}
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
        {userRole === "WORKER" && (offer.status === "SUBMITTED" || offer.status === "VIEWED") && (
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

      {/* Rate Employer Modal */}
      {showRateModal && (
        <RateEmployerModal
          employerName={offer.employer?.companyName || 'This Company'}
          onSubmit={handleSubmitRating}
          onCancel={() => setShowRateModal(false)}
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

function RateEmployerModal({
  employerName,
  onSubmit,
  onCancel,
}: {
  employerName: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingInterviewExperience, setRatingInterviewExperience] = useState(0);
  const [ratingTransparency, setRatingTransparency] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [ratingOfferAccuracy, setRatingOfferAccuracy] = useState(0);
  const [ratingWorkLifeBalance, setRatingWorkLifeBalance] = useState(0);
  const [wouldWorkAgain, setWouldWorkAgain] = useState(true);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  // Individual hover states for each rating category
  const [hoveredOverall, setHoveredOverall] = useState(0);
  const [hoveredInterview, setHoveredInterview] = useState(0);
  const [hoveredTransparency, setHoveredTransparency] = useState(0);
  const [hoveredCommunication, setHoveredCommunication] = useState(0);
  const [hoveredOfferAccuracy, setHoveredOfferAccuracy] = useState(0);
  const [hoveredWorkLifeBalance, setHoveredWorkLifeBalance] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingOverall === 0) {
      alert("Please select an overall rating");
      return;
    }
    onSubmit({
      ratingOverall,
      ratingInterviewExperience: ratingInterviewExperience || undefined,
      ratingTransparency: ratingTransparency || undefined,
      ratingCommunication: ratingCommunication || undefined,
      ratingOfferAccuracy: ratingOfferAccuracy || undefined,
      ratingWorkLifeBalance: ratingWorkLifeBalance || undefined,
      wouldWorkAgain,
      reviewTitle: reviewTitle || undefined,
      reviewText: reviewText || undefined,
    });
  };

  const StarRating = ({
    value,
    onChange,
    label,
    hovered,
    setHovered
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
    hovered: number;
    setHovered: (v: number) => void;
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hovered || value)
                  ? 'text-yellow-500 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Rate {employerName}</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Share your experience to help other workers make informed decisions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Overall Rating - Required */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <StarRating
              value={ratingOverall}
              onChange={setRatingOverall}
              label="Overall Rating *"
              hovered={hoveredOverall}
              setHovered={setHoveredOverall}
            />
          </div>

          {/* Category Ratings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StarRating
              value={ratingInterviewExperience}
              onChange={setRatingInterviewExperience}
              label="Interview Experience"
              hovered={hoveredInterview}
              setHovered={setHoveredInterview}
            />
            <StarRating
              value={ratingTransparency}
              onChange={setRatingTransparency}
              label="Transparency"
              hovered={hoveredTransparency}
              setHovered={setHoveredTransparency}
            />
            <StarRating
              value={ratingCommunication}
              onChange={setRatingCommunication}
              label="Communication"
              hovered={hoveredCommunication}
              setHovered={setHoveredCommunication}
            />
            <StarRating
              value={ratingOfferAccuracy}
              onChange={setRatingOfferAccuracy}
              label="Offer Accuracy"
              hovered={hoveredOfferAccuracy}
              setHovered={setHoveredOfferAccuracy}
            />
            <StarRating
              value={ratingWorkLifeBalance}
              onChange={setRatingWorkLifeBalance}
              label="Work-Life Balance"
              hovered={hoveredWorkLifeBalance}
              setHovered={setHoveredWorkLifeBalance}
            />
          </div>

          {/* Would Work Again */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Would you work there again?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wouldWorkAgain"
                  checked={wouldWorkAgain === true}
                  onChange={() => setWouldWorkAgain(true)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="flex items-center gap-1 text-gray-700">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  Yes
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="wouldWorkAgain"
                  checked={wouldWorkAgain === false}
                  onChange={() => setWouldWorkAgain(false)}
                  className="w-4 h-4 text-red-600"
                />
                <span className="flex items-center gap-1 text-gray-700">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  No
                </span>
              </label>
            </div>
          </div>

          {/* Review Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title (optional)
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              maxLength={200}
              placeholder="e.g., Professional and transparent"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
            <span className="text-xs text-gray-500">{reviewTitle.length}/200</span>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Share details of your experience with the interview process, company culture, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
            <span className="text-xs text-gray-500">{reviewText.length}/2000</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={ratingOverall === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Rating
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
