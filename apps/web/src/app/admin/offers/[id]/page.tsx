"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, MapPin, DollarSign, Clock, Calendar, CheckCircle, XCircle, Globe, Users, Mail, Phone } from "lucide-react";

interface OfferVersion {
  id: string;
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: string;
  contractType: string;
  contractDurationMonths?: number;
  hoursPerWeek: number;
  probationMonths: number;
  vacationDays: number;
  holidayAllowancePct: number;
  pensionContributionPct: number;
  trainingBudget: number;
  companyVehicle: string;
  travelAllowanceType: string;
  phoneProvided: boolean;
  toolsProvided: boolean;
  scheduleType: string[];
  remoteWorkPct: number;
  travelRequiredPct: number;
  physicalRequirements: string;
  requiredCertifications: string[];
  requiredExperienceYears: number;
}

interface Offer {
  id: string;
  publicId: string;
  jobTitle: string;
  jobDescription: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  currentVersion: OfferVersion | null;
  employer: {
    id: string;
    companyName: string;
    companyTradeName?: string;
    kvkNumber?: string;
    website?: string;
    user: {
      email: string;
      phoneNumber?: string;
    };
  };
  worker?: {
    id: string;
    publicId: string;
    primaryTrade?: string;
  };
}

export default function AdminOfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = params.id as string;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOffer = () => {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (!accessToken || !userId || userRole !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-User-ID': userId,
        'X-User-Role': userRole,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          router.push('/login');
          throw new Error('Unauthorized');
        }
        return res.json();
      })
      .then((data) => {
        setOffer(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          console.error(err);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOffer();
  }, [offerId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: 'bg-blue-100 text-blue-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-red-100 text-red-800',
      VIEWED: 'bg-blue-100 text-blue-800',
      SHORTLISTED: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COUNTERED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatSalary = (min?: number, max?: number, period?: string) => {
    if (!min && !max) return 'Not specified';
    const salary = min && max ? `€${min.toLocaleString()} - €${max.toLocaleString()}` : min ? `From €${min.toLocaleString()}` : `Up to €${max?.toLocaleString()}`;
    return `${salary}${period ? `/${period}` : ''}`;
  };

  const getWorkArrangementType = (remoteWorkPct?: number) => {
    if (remoteWorkPct === undefined || remoteWorkPct === null) return 'Not specified';
    if (remoteWorkPct === 100) return 'Remote';
    if (remoteWorkPct === 0) return 'On-site';
    return `Hybrid (${remoteWorkPct}% remote)`;
  };

  const getContractTypeName = (type: string) => {
    const names: Record<string, string> = {
      permanent: 'Permanent',
      fixed_term: 'Fixed Term',
      freelance: 'Freelance',
      contract: 'Contract',
      part_time: 'Part-time',
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offer details...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Offer Not Found</h2>
          <p className="text-gray-500 mb-4">This offer may have been deleted or doesn't exist.</p>
          <button
            onClick={() => router.push('/admin/offers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  if (!offer.employer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Employer Information Missing</h2>
          <p className="text-gray-500 mb-4">The employer associated with this offer could not be found.</p>
          <button
            onClick={() => router.push('/admin/offers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Offers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{offer.jobTitle}</h1>
                <p className="text-sm text-gray-500">{offer.employer?.companyName || 'Unknown Employer'}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(offer.status)}`}>
              {offer.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Offer Details */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Offer Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Employment Type</label>
                    <p className="font-medium text-gray-900">{getContractTypeName(offer.currentVersion?.contractType || 'Not specified')}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Work Schedule</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.scheduleType?.join(', ') || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Experience Required</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.requiredExperienceYears ? `${offer.currentVersion.requiredExperienceYears}+ years` : 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Hours/Week</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.hoursPerWeek || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Remote Work</label>
                    <p className="font-medium text-gray-900">{getWorkArrangementType(offer.currentVersion?.remoteWorkPct)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Travel Required</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.travelRequiredPct ? `${offer.currentVersion.travelRequiredPct}%` : 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {offer.jobDescription && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{offer.jobDescription}</p>
              </div>
            )}

            {/* Requirements */}
            {offer.currentVersion?.requiredCertifications && offer.currentVersion.requiredCertifications.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {offer.currentVersion.requiredCertifications.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {offer.currentVersion && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {offer.currentVersion.vacationDays && (
                    <li>{offer.currentVersion.vacationDays} vacation days</li>
                  )}
                  {offer.currentVersion.holidayAllowancePct && (
                    <li>{offer.currentVersion.holidayAllowancePct}% holiday allowance</li>
                  )}
                  {offer.currentVersion.pensionContributionPct && (
                    <li>{offer.currentVersion.pensionContributionPct}% pension contribution</li>
                  )}
                  {offer.currentVersion.trainingBudget && offer.currentVersion.trainingBudget > 0 && (
                    <li>€{offer.currentVersion.trainingBudget.toLocaleString()} training budget</li>
                  )}
                  {offer.currentVersion.phoneProvided && (
                    <li>Phone provided</li>
                  )}
                  {offer.currentVersion.toolsProvided && (
                    <li>Laptop/tools provided</li>
                  )}
                  {offer.currentVersion.companyVehicle !== 'not_provided' && (
                    <li>Company vehicle: {offer.currentVersion.companyVehicle.replace('_', ' ')}</li>
                  )}
                  {offer.currentVersion.travelAllowanceType !== 'not_provided' && (
                    <li>Travel allowance: {offer.currentVersion.travelAllowanceType.replace('_', ' ')}</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary & Location */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary & Work Arrangement</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Salary Range
                  </div>
                  <p className="font-medium text-gray-900">{formatSalary(offer.currentVersion?.salaryMin, offer.currentVersion?.salaryMax, offer.currentVersion?.salaryPeriod)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Briefcase className="w-4 h-4" />
                    Contract Type
                  </div>
                  <p className="font-medium text-gray-900">{getContractTypeName(offer.currentVersion?.contractType || 'Not specified')}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <MapPin className="w-4 h-4" />
                    Work Arrangement
                  </div>
                  <p className="font-medium text-gray-900">{getWorkArrangementType(offer.currentVersion?.remoteWorkPct)}</p>
                </div>
                {offer.currentVersion?.probationMonths && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                      Probation Period
                    </div>
                    <p className="font-medium text-gray-900">{offer.currentVersion.probationMonths} months</p>
                  </div>
                )}
              </div>
            </div>

            {/* Worker Info */}
            {offer.worker && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Worker</h2>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{offer.worker.publicId}</p>
                    {offer.worker.primaryTrade && (
                      <p className="text-sm text-gray-500">{offer.worker.primaryTrade}</p>
                    )}
                  </div>
                  {offer.worker && (
                    <button
                      onClick={() => router.push(`/admin/workers/${offer.worker!.id}`)}
                      className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View Worker Details
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Dates</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Clock className="w-4 h-4" />
                    Posted
                  </div>
                  <p className="font-medium text-gray-900">{new Date(offer.createdAt).toLocaleDateString()}</p>
                </div>
                {offer.expiresAt && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      Expires
                    </div>
                    <p className="font-medium text-gray-900">{new Date(offer.expiresAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Employer Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employer</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">{offer.employer.companyName}</p>
                  {offer.employer.companyTradeName && (
                    <p className="text-sm text-gray-500">{offer.employer.companyTradeName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{offer.employer.user.email}</span>
                </div>
                {offer.employer.user.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{offer.employer.user.phoneNumber}</span>
                  </div>
                )}
                {offer.employer.kvkNumber && (
                  <div className="text-sm text-gray-600">
                    <span className="text-gray-500">KvK:</span> {offer.employer.kvkNumber}
                  </div>
                )}
                {offer.employer.website && (
                  <a href={offer.employer.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
                <button
                  onClick={() => router.push(`/admin/employers/${offer.employer.id}`)}
                  className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  View Employer Details
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
