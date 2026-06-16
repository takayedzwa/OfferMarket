"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import { workersApi } from "../../../lib/api";
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
} from "lucide-react";

interface WorkerProfile {
  publicId: string;
  region: { name: string; province?: string; type?: string } | null;
  yearsOfExperience?: number;
  primaryTrade?: string;
  availability: string;
  skills: Array<{
    name: string;
    level: string;
    yearsOfExperience?: number;
    isCertified?: boolean;
  }>;
  certifications: Array<{
    name: string;
    isValid: boolean;
    validUntil?: string;
  }>;
  desiredSalaryRange: { min?: number; max?: number };
  employmentTypes: string[];
  travelDistanceKm?: number;
  profileCompletenessPct: number;
  reputationScore: number;
  lastActive: string;
}

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const publicId = params.publicId as string;

  useEffect(() => {
    if (!publicId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const employerId = localStorage.getItem("userId");
        const res = await workersApi.getPublicProfile(publicId, employerId || undefined);
        setWorker(res.data);
      } catch (err: any) {
        console.error("Failed to load worker profile:", err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [publicId]);

  const getAvailabilityLabel = (availability: string) => {
    const labels: Record<string, string> = {
      IMMEDIATE: "Available Immediately",
      ONE_MONTH: "Available in 1 month",
      THREE_MONTHS: "Available in 3 months",
      SIX_MONTHS: "Available in 6 months",
      NOT_AVAILABLE: "Not available",
    };
    return labels[availability] || availability;
  };

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
    };
    return colors[level] || "bg-gray-100 text-gray-700";
  };

  const handleCreateOffer = () => {
    // Navigate to create offer page with worker info
    router.push(`/offers/create?workerId=${publicId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header logout={logout} />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center text-gray-500">Loading profile...</div>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">{error || "This worker profile could not be found"}</p>
            <Link
              href="/workers"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
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
          Back to Search
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{worker.publicId}</h1>
                <p className="text-gray-600">{worker.primaryTrade || "General Worker"}</p>
              </div>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getAvailabilityColor(
                worker.availability
              )}`}
            >
              {getAvailabilityLabel(worker.availability)}
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Experience</div>
                <div className="font-semibold text-gray-900">
                  {worker.yearsOfExperience || "N/A"} years
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Reputation</div>
                <div className="font-semibold text-gray-900">{worker.reputationScore}/100</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Location</div>
                <div className="font-semibold text-gray-900">
                  {worker.region?.name || "Not specified"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm text-gray-500">Travel Range</div>
                <div className="font-semibold text-gray-900">
                  {worker.travelDistanceKm || "N/A"} km
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Anonymous Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 mb-1">Anonymous Profile</h3>
              <p className="text-sm text-amber-700">
                This worker&apos;s identity is protected. Personal information (name, email, phone) will only be
                revealed if they accept your offer. You can still send an offer based on their skills and
                qualifications.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Skills & Certifications
            </h2>
            {worker.skills.length > 0 ? (
              <div className="space-y-3">
                {worker.skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{skill.name}</div>
                      {skill.yearsOfExperience !== undefined && (
                        <div className="text-sm text-gray-500">
                          {skill.yearsOfExperience} years
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getSkillLevelColor(
                          skill.level
                        )}`}
                      >
                        {skill.level}
                      </span>
                      {skill.isCertified && (
                        <CheckCircle className="w-4 h-4 text-green-600" title="Certified" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skills listed</p>
            )}
          </div>

          {/* Certifications */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </h2>
            {worker.certifications.length > 0 ? (
              <div className="space-y-3">
                {worker.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{cert.name}</div>
                      {cert.validUntil && (
                        <div className="text-sm text-gray-500">
                          Valid until {new Date(cert.validUntil).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {cert.isValid ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Valid
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        Expired
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No certifications listed</p>
            )}
          </div>

          {/* Employment Preferences */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Employment Preferences
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Employment Types</div>
                <div className="flex flex-wrap gap-2">
                  {worker.employmentTypes.length > 0 ? (
                    worker.employmentTypes.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {type.replace("_", " ")}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">Not specified</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Desired Salary Range
                </div>
                {worker.desiredSalaryRange.min || worker.desiredSalaryRange.max ? (
                  <div className="font-semibold text-gray-900">
                    €{worker.desiredSalaryRange.min?.toLocaleString() || "N/A"} - €
                    {worker.desiredSalaryRange.max?.toLocaleString() || "N/A"}
                  </div>
                ) : (
                  <span className="text-gray-500">Not specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Profile Info
            </h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-2">Profile Completeness</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${worker.profileCompletenessPct}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {worker.profileCompletenessPct}% complete
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Last Active</div>
                <div className="font-medium text-gray-900">
                  {new Date(worker.lastActive).toLocaleDateString("en-US", {
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
                Interested in this worker?
              </h3>
              <p className="text-gray-600">
                Send a structured offer to connect with this professional
              </p>
            </div>
            <button
              onClick={handleCreateOffer}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              Create Offer
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({ logout }: { logout: () => void }) {
  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard/employer" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold text-gray-900">OfferMarket</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard/employer" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/workers" className="text-blue-600 font-medium">
              Find Workers
            </Link>
            <Link href="/offers/create" className="text-gray-600 hover:text-gray-900">
              Create Offer
            </Link>
            <Link href="/offers" className="text-gray-600 hover:text-gray-900">
              My Offers
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
