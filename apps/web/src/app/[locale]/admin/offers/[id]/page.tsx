"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
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
  const t = useTranslations("admin-detail.offerDetail");
  const tEnums = useTranslations("enums");
  const params = useParams();
  const router = useRouter();
  const { currency, date } = useFormat();
  const offerId = params.id as string;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  const statusLabel = (status: string) => {
    try {
      return tEnums("offerStatus." + status);
    } catch {
      return status;
    }
  };

  const fetchOffer = () => {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      router.push('/login');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/offers/${offerId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    if (!min && !max) return t("notSpecified");
    let salary: string;
    if (min && max) salary = t("salaryRangeFmt", { min: currency(min), max: currency(max) });
    else if (min) salary = t("salaryFrom", { amount: currency(min) });
    else salary = t("salaryUpTo", { amount: currency(max || 0) });
    return period ? t("salaryWithPeriod", { salary, period }) : salary;
  };

  const getWorkArrangementType = (remoteWorkPct?: number) => {
    if (remoteWorkPct === undefined || remoteWorkPct === null) return t("notSpecified");
    if (remoteWorkPct === 100) return t("arrangementRemote");
    if (remoteWorkPct === 0) return t("arrangementOnsite");
    return t("arrangementHybrid", { pct: remoteWorkPct });
  };

  const getContractTypeName = (type: string) => {
    try {
      return t("contractTypes." + type);
    } catch {
      return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("notFoundTitle")}</h2>
          <p className="text-gray-500 mb-4">{t("notFoundBody")}</p>
          <button
            onClick={() => router.push('/admin/offers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("backToOffers")}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("employerMissingTitle")}</h2>
          <p className="text-gray-500 mb-4">{t("employerMissingBody")}</p>
          <button
            onClick={() => router.push('/admin/offers')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t("backToOffers")}
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
                <p className="text-sm text-gray-500">{offer.employer?.companyName || t("unknownEmployer")}</p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(offer.status)}`}>
              {statusLabel(offer.status)}
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("offerDetails")}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">{t("employmentType")}</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.contractType ? getContractTypeName(offer.currentVersion.contractType) : t("notSpecified")}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t("workSchedule")}</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.scheduleType?.join(', ') || t("notSpecified")}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t("experienceRequired")}</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.requiredExperienceYears ? t("experienceYears", { years: offer.currentVersion.requiredExperienceYears }) : t("notSpecified")}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t("hoursWeek")}</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.hoursPerWeek || t("notSpecified")}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t("remoteWork")}</label>
                    <p className="font-medium text-gray-900">{getWorkArrangementType(offer.currentVersion?.remoteWorkPct)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">{t("travelRequired")}</label>
                    <p className="font-medium text-gray-900">{offer.currentVersion?.travelRequiredPct ? t("travelPct", { pct: offer.currentVersion.travelRequiredPct }) : t("notSpecified")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {offer.jobDescription && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("description")}</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{offer.jobDescription}</p>
              </div>
            )}

            {/* Requirements */}
            {offer.currentVersion?.requiredCertifications && offer.currentVersion.requiredCertifications.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("requirements")}</h2>
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
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("benefits")}</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {offer.currentVersion.vacationDays && (
                    <li>{t("vacationDays", { days: offer.currentVersion.vacationDays })}</li>
                  )}
                  {offer.currentVersion.holidayAllowancePct && (
                    <li>{t("holidayAllowance", { pct: offer.currentVersion.holidayAllowancePct })}</li>
                  )}
                  {offer.currentVersion.pensionContributionPct && (
                    <li>{t("pensionContribution", { pct: offer.currentVersion.pensionContributionPct })}</li>
                  )}
                  {offer.currentVersion.trainingBudget && offer.currentVersion.trainingBudget > 0 && (
                    <li>{t("trainingBudget", { amount: currency(offer.currentVersion.trainingBudget) })}</li>
                  )}
                  {offer.currentVersion.phoneProvided && (
                    <li>{t("phoneProvided")}</li>
                  )}
                  {offer.currentVersion.toolsProvided && (
                    <li>{t("toolsProvided")}</li>
                  )}
                  {offer.currentVersion.companyVehicle !== 'not_provided' && (
                    <li>{t("companyVehicle", { type: offer.currentVersion.companyVehicle.replace('_', ' ') })}</li>
                  )}
                  {offer.currentVersion.travelAllowanceType !== 'not_provided' && (
                    <li>{t("travelAllowance", { type: offer.currentVersion.travelAllowanceType.replace('_', ' ') })}</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary & Location */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("salaryWorkArrangement")}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    {t("salaryRange")}
                  </div>
                  <p className="font-medium text-gray-900">{formatSalary(offer.currentVersion?.salaryMin, offer.currentVersion?.salaryMax, offer.currentVersion?.salaryPeriod)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Briefcase className="w-4 h-4" />
                    {t("contractType")}
                  </div>
                  <p className="font-medium text-gray-900">{offer.currentVersion?.contractType ? getContractTypeName(offer.currentVersion.contractType) : t("notSpecified")}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <MapPin className="w-4 h-4" />
                    {t("workArrangement")}
                  </div>
                  <p className="font-medium text-gray-900">{getWorkArrangementType(offer.currentVersion?.remoteWorkPct)}</p>
                </div>
                {offer.currentVersion?.probationMonths && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Clock className="w-4 h-4" />
                      {t("probationPeriod")}
                    </div>
                    <p className="font-medium text-gray-900">{t("probationMonths", { months: offer.currentVersion.probationMonths })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Worker Info */}
            {offer.worker && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("worker")}</h2>
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
                      {t("viewWorkerDetails")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("dates")}</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Clock className="w-4 h-4" />
                    {t("posted")}
                  </div>
                  <p className="font-medium text-gray-900">{date(offer.createdAt)}</p>
                </div>
                {offer.expiresAt && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      {t("expires")}
                    </div>
                    <p className="font-medium text-gray-900">{date(offer.expiresAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Employer Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("employer")}</h2>
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
                    <span className="text-gray-500">{t("kvk")}</span> {offer.employer.kvkNumber}
                  </div>
                )}
                {offer.employer.website && (
                  <a href={offer.employer.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {t("website")}
                  </a>
                )}
                <button
                  onClick={() => router.push(`/admin/employers/${offer.employer.id}`)}
                  className="w-full mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  {t("viewEmployerDetails")}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("actions")}</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {t("viewFullDetails")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}