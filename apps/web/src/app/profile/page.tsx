"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";
import { workersApi, employersApi, api } from "../../lib/api";
import { PublicWorkerProfile, Employer } from "../../lib/types";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Euro,
  Edit,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<PublicWorkerProfile | null>(null);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);

  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

  useEffect(() => {
    async function loadProfile() {
      try {
        if (userRole === "WORKER") {
          const response = await workersApi.getMyProfile();
          if (response.data) {
            setProfile(response.data);
          } else {
            // No profile exists, redirect to setup
            router.push("/profile/setup");
          }
        } else if (userRole === "EMPLOYER") {
          const response = await api.get('/employers/me/company');
          setEmployer(response.data);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          // No profile exists, redirect to setup
          router.push("/profile/setup");
        } else {
          console.error("Failed to load profile:", error);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [userRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userRole === "WORKER" && profile && (
          <>
            {/* Profile Header */}
            <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Worker {profile.publicId?.slice(0, 6) || "Profile"}
                    </h1>
                    <p className="text-gray-500">
                      Public ID: {profile.publicId || "Not generated"}
                    </p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        profile.profileVisibility === "PUBLIC"
                          ? "bg-green-100 text-green-700"
                          : profile.profileVisibility === "SHORTLIST"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {profile.profileVisibility || "PRIVATE"} Profile
                    </span>
                  </div>
                </div>
                <Link
                  href="/profile/edit"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user?.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user?.email && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                )}
                {profile.availability && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="capitalize">{profile.availability.toLowerCase()}</span>
                  </div>
                )}
                {profile.yearsOfExperience !== undefined && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <span>{profile.yearsOfExperience} years experience</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((ps, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {ps.name} ({ps.level?.toLowerCase()})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Region */}
              {profile.region && (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Preferred Region
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {profile.region.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Salary Expectations */}
              {profile.desiredSalaryRange?.min && (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Euro className="w-5 h-5" />
                    Salary Expectation
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    €{profile.desiredSalaryRange.min.toLocaleString()} - €{profile.desiredSalaryRange.max?.toLocaleString() || '∞'}
                  </p>
                  <p className="text-sm text-gray-500">per year</p>
                </div>
              )}

              {/* Bio */}
              {profile.primaryTrade && (
                <div className="bg-white rounded-xl border shadow-sm p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About Me</h3>
                  <p className="text-gray-700">
                    {profile.primaryTrade} with {profile.yearsOfExperience || 0} years of experience.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {userRole === "EMPLOYER" && employer && (
          <>
            {/* Company Header */}
            <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {employer.companyName}
                    </h1>
                    <p className="text-gray-500">KvK: {employer.kvkNumber}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          employer.verificationStatus === "BASIC_VERIFIED" || employer.verificationStatus === "PREMIUM_VERIFIED"
                            ? "bg-green-100 text-green-700"
                            : employer.verificationStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {(employer.verificationStatus === "BASIC_VERIFIED" || employer.verificationStatus === "PREMIUM_VERIFIED") && (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {employer.verificationStatus === "PENDING" && (
                          <Clock className="w-3 h-3 inline mr-1" />
                        )}
                        {employer.verificationStatus === "REJECTED" && (
                          <XCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {employer.verificationStatus?.replace('_', ' ') || "PENDING"}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href="/profile/company/edit"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user?.email && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{user.email}</span>
                  </div>
                )}
                {employer.website && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <a
                      href={employer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {employer.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Company Information
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Legal Name</span>
                  <p className="font-medium">{employer.companyName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Chamber of Commerce (KvK)</span>
                  <p className="font-medium">{employer.kvkNumber}</p>
                </div>
                {employer.registeredAddress && (
                  <div>
                    <span className="text-sm text-gray-500">Registered Address</span>
                    <p className="font-medium">
                      {employer.registeredAddress.street}
                      {employer.registeredAddress.postalCode &&
                        `, ${employer.registeredAddress.postalCode}`}
                      {employer.registeredAddress.city &&
                        ` ${employer.registeredAddress.city}`}
                      {employer.registeredAddress.country &&
                        `, ${employer.registeredAddress.country}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
