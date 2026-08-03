"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { workersApi } from "@/lib/api";
import { useFormat } from "@/hooks/useFormat";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Star,
  Award,
  Calendar,
  DollarSign,
  Truck,
  CheckCircle,
  User,
  Lock,
  Shield,
  Car,
  Globe,
  GraduationCap,
  Building2,
  BadgeCheck,
} from "lucide-react";

interface WorkerProfile {
  publicId: string;
  headline?: string;
  summary?: string;
  region: { name: string; province?: string; type?: string } | null;
  yearsOfExperience?: number;
  primaryTrade?: string;
  specializations?: string[];
  availability: string;
  skills: Array<{
    id?: string;
    name: string;
    level: string;
    yearsOfExperience?: number;
    isCertified?: boolean;
    isPrimary?: boolean;
  }>;
  certifications: Array<{
    id?: string;
    name: string;
    issuingBody?: string;
    isValid: boolean;
    validUntil?: string;
    isLifetime?: boolean;
  }>;
  languages?: Array<{ language: string; level: string }>;
  education?: Array<{
    id?: string;
    qualification: string;
    institution?: string;
    country?: string;
    yearCompleted?: number;
  }>;
  projectExperiences?: Array<{
    id?: string;
    projectType: string;
    industry: string;
    durationMonths?: number;
    responsibilities?: string[];
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  hasDrivingLicense?: boolean;
  hasOwnVehicle?: boolean;
  travelDistanceKm?: number;
  workAuthorization?: string;
  desiredSalaryRange: { min?: number; max?: number };
  employmentTypes: string[];
  workSchedulePrefs?: string[];
  industryPrefs?: string[];
  careerPriorities?: string[];
  profileCompletenessPct: number;
  reputationScore: number;
  safetyScore?: number;
  badges?: string[];
  lastActive: string;
}

const BADGE_ICONS: Record<string, string> = {
  NEN_3140_CERTIFIED: "🏅",
  VCA_CERTIFIED: "🏅",
  NEN_1010_CERTIFIED: "🏅",
  FIRST_AID_CERTIFIED: "🏅",
  MULTIPLE_CERTIFIED: "🏅",
  SENIOR_EXPERT: "🏆",
  EXPERIENCED: "⭐",
  INDUSTRIAL_SPECIALIST: "🔧",
  PLC_SPECIALIST: "⚙️",
  SOLAR_SPECIALIST: "☀️",
  RENEWABLE_SPECIALIST: "🌱",
  AVAILABLE_IMMEDIATELY: "✅",
  DRIVING_LICENCE_B: "🚗",
  OWN_VEHICLE: "🚙",
  DUTCH_B2: "🇳🇱",
  ENGLISH_B2: "🇬🇧",
  EU_CITIZEN: "🇪🇺",
  WORK_PERMIT_VALID: "📋",
  VERIFIED_CREDENTIALS: "✓",
};

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, logout } = useAuth();
  const t = useTranslations("workers.profile");
  const tEnums = useTranslations("enums");
  const { currency, date } = useFormat();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publicId = params.publicId as string;

  const enumLabel = (ns: string, key: string, fallback?: string) => {
    try {
      return tEnums(`${ns}.${key}`);
    } catch {
      return fallback ?? key.replace(/_/g, " ");
    }
  };

  useEffect(() => {
    if (!publicId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        // SECURITY: employer identity comes from AuthContext (JWT via /auth/me),
        // not localStorage. The login page stores only tokens.
        const employerId = user?.id;
        const res = await workersApi.getPublicProfile(publicId, employerId);
        setWorker(res.data);
      } catch (err: any) {
        console.error("Failed to load worker profile:", err);
        setError(err.response?.data?.message || t("notFoundMessage"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [publicId, user, t]);

  const getAvailabilityColor = (availability: string) => {
    const colors: Record<string, string> = {
      IMMEDIATE: "text-green-600 bg-green-50 border-green-200",
      ONE_MONTH: "text-blue-600 bg-blue-50 border-blue-200",
      THREE_MONTHS: "text-yellow-600 bg-yellow-50 border-yellow-200",
      SIX_MONTHS: "text-orange-600 bg-orange-50 border-orange-200",
      NOT_AVAILABLE: "text-gray-600 bg-gray-50 border-gray-200",
    };
    return colors[availability] || "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getSkillLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      BEGINNER: "bg-gray-100 text-gray-700",
      INTERMEDIATE: "bg-blue-100 text-blue-700",
      ADVANCED: "bg-purple-100 text-purple-700",
      EXPERT: "bg-green-100 text-green-700",
      MASTER: "bg-yellow-100 text-yellow-800",
    };
    return colors[level] || "bg-gray-100 text-gray-700";
  };

  const handleCreateOffer = () => {
    router.push(`/offers/create?workerId=${publicId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header logout={logout} />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center text-gray-500">{t("loading")}</div>
        </main>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header logout={logout} />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl border p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("notFoundTitle")}</h2>
            <p className="text-gray-600 mb-4">{error || t("notFoundMessage")}</p>
            <Link
              href="/workers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToSearch")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header logout={logout} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToSearch")}
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {worker.headline || worker.publicId}
                </h1>
                <p className="text-gray-600">
                  {worker.primaryTrade || t("generalWorker")}
                </p>
                {worker.specializations && worker.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {worker.specializations.slice(0, 4).map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                      >
                        {enumLabel("specialization", spec)}
                      </span>
                    ))}
                    {worker.specializations.length > 4 && (
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs">
                        {t("moreCount", { count: worker.specializations.length - 4 })}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getAvailabilityColor(
                worker.availability
              )}`}
            >
              {enumLabel("availability", worker.availability)}
            </div>
          </div>

          {/* Summary */}
          {worker.summary && (
            <p className="text-gray-700 text-sm mt-3 mb-4">{worker.summary}</p>
          )}

          {/* Badges */}
          {worker.badges && worker.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 mb-4">
              {worker.badges.map((badge) => {
                const icon = BADGE_ICONS[badge];
                return (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium"
                  >
                    {icon ? `${icon} ` : ""}
                    {enumLabel("badge", badge)}
                  </span>
                );
              })}
            </div>
          )}

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">{t("experience")}</div>
                <div className="font-semibold text-gray-900">
                  {worker.yearsOfExperience != null
                    ? t("yearsValue", { years: worker.yearsOfExperience })
                    : t("na")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">{t("reputation")}</div>
                <div className="font-semibold text-gray-900">
                  {t("reputationScore", { score: worker.reputationScore })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">{t("location")}</div>
                <div className="font-semibold text-gray-900">
                  {worker.region?.name || t("notSpecified")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">{t("travelRange")}</div>
                <div className="font-semibold text-gray-900">
                  {worker.travelDistanceKm != null
                    ? t("travelRangeValue", { km: worker.travelDistanceKm })
                    : t("na")}
                </div>
              </div>
            </div>
          </div>

          {/* Mobility & Authorization Row */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
            {worker.hasDrivingLicense && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                <Car className="w-4 h-4" /> {t("drivingLicenceB")}
              </span>
            )}
            {worker.hasOwnVehicle && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                <Truck className="w-4 h-4" /> {t("ownVehicle")}
              </span>
            )}
            {worker.workAuthorization && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <Globe className="w-4 h-4" /> {enumLabel("workAuth", worker.workAuthorization)}
              </span>
            )}
          </div>
        </div>

        {/* Anonymous Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 mb-1">{t("anonymousTitle")}</h3>
              <p className="text-sm text-amber-700">{t("anonymousBody")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              {t("skills")}
            </h2>
            {worker.skills.length > 0 ? (
              <div className="space-y-3">
                {worker.skills.map((skill, idx) => (
                  <div key={skill.id || idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {skill.name}
                        {skill.isPrimary && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                            {t("primary")}
                          </span>
                        )}
                      </div>
                      {skill.yearsOfExperience !== undefined && (
                        <div className="text-sm text-gray-500">
                          {t("skillYears", { years: skill.yearsOfExperience })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getSkillLevelColor(
                          skill.level
                        )}`}
                      >
                        {enumLabel("skillLevel", skill.level)}
                      </span>
                      {skill.isCertified && (
                        <span title={t("valid")}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t("noSkills")}</p>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5" />
              {t("certifications")}
            </h2>
            {worker.certifications.length > 0 ? (
              <div className="space-y-3">
                {worker.certifications.map((cert, idx) => (
                  <div key={cert.id || idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{cert.name}</div>
                      {cert.issuingBody && (
                        <div className="text-sm text-gray-500">{cert.issuingBody}</div>
                      )}
                      {cert.validUntil && !cert.isLifetime && (
                        <div className="text-sm text-gray-500">
                          {t("validUntil", { date: date(cert.validUntil) })}
                        </div>
                      )}
                      {cert.isLifetime && (
                        <div className="text-sm text-green-600">{t("lifetimeCert")}</div>
                      )}
                    </div>
                    {cert.isValid ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        {t("valid")}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {t("expired")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t("noCerts")}</p>
            )}
          </div>

          {/* Languages */}
          {worker.languages && worker.languages.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t("languages")}
              </h2>
              <div className="space-y-2">
                {worker.languages.map((lang, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{lang.language}</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {enumLabel("languageLevel", lang.level)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {worker.education && worker.education.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                {t("education")}
              </h2>
              <div className="space-y-3">
                {worker.education.map((edu, idx) => (
                  <div key={edu.id || idx}>
                    <div className="font-medium text-gray-900">{edu.qualification}</div>
                    {edu.institution && (
                      <div className="text-sm text-gray-600">{edu.institution}</div>
                    )}
                    <div className="text-sm text-gray-500">
                      {edu.yearCompleted
                        ? t("educationMeta", { country: edu.country || "NL", year: edu.yearCompleted })
                        : edu.country || "NL"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Experience */}
          {worker.projectExperiences && worker.projectExperiences.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-6 md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {t("projectExperience")}
              </h2>
              <div className="space-y-4">
                {worker.projectExperiences.map((proj, idx) => (
                  <div key={proj.id || idx} className="border-l-2 border-blue-200 pl-4">
                    <div className="font-medium text-gray-900">{proj.projectType}</div>
                    <div className="text-sm text-blue-600">{proj.industry}</div>
                    {proj.durationMonths && (
                      <div className="text-sm text-gray-500">
                        {t("projectDuration", { months: proj.durationMonths })}
                      </div>
                    )}
                    {proj.description && (
                      <p className="text-sm text-gray-700 mt-1">{proj.description}</p>
                    )}
                    {proj.responsibilities && proj.responsibilities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {proj.responsibilities.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employment Preferences */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {t("employmentPreferences")}
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">{t("employmentTypes")}</div>
                <div className="flex flex-wrap gap-2">
                  {worker.employmentTypes.length > 0 ? (
                    worker.employmentTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {enumLabel("employmentType", type)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">{t("notSpecified")}</span>
                  )}
                </div>
              </div>
              {(worker.workSchedulePrefs && worker.workSchedulePrefs.length > 0) && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">{t("workSchedule")}</div>
                  <div className="flex flex-wrap gap-2">
                    {worker.workSchedulePrefs.map((pref, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                        {pref.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t("desiredSalaryRange")}
                </div>
                {worker.desiredSalaryRange.min || worker.desiredSalaryRange.max ? (
                  <div className="font-semibold text-gray-900">
                    {t("salaryRange", {
                      min: worker.desiredSalaryRange.min != null ? currency(worker.desiredSalaryRange.min) : t("na"),
                      max: worker.desiredSalaryRange.max != null ? currency(worker.desiredSalaryRange.max) : t("na"),
                    })}
                  </div>
                ) : (
                  <span className="text-gray-500">{t("notSpecified")}</span>
                )}
              </div>
            </div>
          </div>

          {/* Safety & Profile Info */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t("safetyProfile")}
            </h2>
            <div className="space-y-4">
              {/* Safety Score */}
              {worker.safetyScore !== undefined && worker.safetyScore > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">{t("safetyScore")}</div>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          worker.safetyScore >= 80 ? "bg-green-600" :
                          worker.safetyScore >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${worker.safetyScore}%` }}
                      />
                    </div>
                    <span className="font-semibold text-gray-900">
                      {t("safetyScoreValue", { score: worker.safetyScore })}
                    </span>
                  </div>
                </div>
              )}

              {/* Profile Completeness */}
              <div>
                <div className="text-sm text-gray-500 mb-2">{t("profileCompleteness")}</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${worker.profileCompletenessPct}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t("completenessPct", { pct: worker.profileCompletenessPct })}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-2">{t("lastActive")}</div>
                <div className="font-medium text-gray-900">
                  {date(worker.lastActive, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {t("ctaTitle")}
              </h3>
              <p className="text-gray-600">
                {t("ctaBody")}
              </p>
            </div>
            <button
              onClick={handleCreateOffer}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              {t("createOffer")}
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({ logout }: { logout: () => void }) {
  const t = useTranslations("workers.profile.header");
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard/employer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{t("brand")}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard/employer" className="text-gray-600 hover:text-gray-900">
              {t("dashboard")}
            </Link>
            <Link href="/workers" className="text-blue-600 font-medium">
              {t("findWorkers")}
            </Link>
            <Link href="/offers/create" className="text-gray-600 hover:text-gray-900">
              {t("createOffer")}
            </Link>
            <Link href="/offers" className="text-gray-600 hover:text-gray-900">
              {t("myOffers")}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
              {t("signOut")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}