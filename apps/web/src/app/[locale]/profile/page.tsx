"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useFormat } from "@/hooks/useFormat";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { workersApi, employersApi, api, uploadsApi, trustApi } from "@/lib/api";
import { PrivateWorkerProfile, Employer } from "@/lib/types";
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
  Upload,
  AlertCircle,
} from "lucide-react";

// Document types accepted for employer verification, mirrored from the
// Prisma DocumentType enum. Only the subset relevant to employer verification
// is offered in the UI; the backend accepts the full enum.
const DOCUMENT_TYPE_OPTIONS = [
  "BUSINESS_REGISTRATION",
  "TAX_DOCUMENT",
  "BANK_STATEMENT",
  "UTILITY_BILL",
  "ID_CARD",
  "PASSPORT",
  "CERTIFICATE",
  "DIPLOMA",
  "REFERENCE_LETTER",
  "OTHER",
] as const;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — matches backend limit

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile.view");
  const tEnums = useTranslations("enums");
  const { currency } = useFormat();
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<PrivateWorkerProfile | null>(null);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);

  // Employer verification document upload state.
  const [docType, setDocType] = useState<string>(DOCUMENT_TYPE_OPTIONS[0]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const userRole: string | null = user?.role ?? null;

  useEffect(() => {
    async function loadProfile() {
      // SECURITY: role comes from AuthContext (JWT via /auth/me), not
      // localStorage. The login page stores only tokens.
      if (authLoading) return;
      if (!user) {
        router.push("/login");
        return;
      }

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
  }, [userRole, authLoading, user, router]);

  // ============================================================================
  // EMPLOYER VERIFICATION DOCUMENT UPLOAD
  // ----------------------------------------------------------------------------
  // Flow: presign via /uploads/verification-document (employer resolved from
  // JWT server-side) → PUT file directly to S3 → compute SHA-256 via Web Crypto
  // → submit {documentType, fileUrl, fileHash, metadata.mimeType} to
  // /trust/employers/:employerId/documents (employerId is the acting
  // employer's own id; the backend re-resolves it from the JWT and rejects
  // path-param mismatches, preventing IDOR).
  // ============================================================================
  async function handleUploadDocument() {
    if (!employer || !docFile) return;
    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);
    try {
      // Client-side boundary checks mirror the backend allow-list/size limit.
      if (!ALLOWED_MIME_TYPES.includes(docFile.type as (typeof ALLOWED_MIME_TYPES)[number])) {
        throw new Error(t("errUnsupportedType"));
      }
      if (docFile.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(t("errTooLarge"));
      }

      // 1. Request a presigned PUT URL from the backend.
      const presignRes = await uploadsApi.presignVerificationDocument({
        fileName: docFile.name,
        mimeType: docFile.type,
      });
      const { uploadUrl, fileUrl } = presignRes.data;

      // 2. Upload the raw file bytes directly to S3.
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": docFile.type },
        body: docFile,
      });
      if (!putRes.ok) {
        throw new Error(t("errUploadFailed", { status: putRes.status }));
      }

      // 3. Compute a SHA-256 hash of the file for integrity tracking.
      const fileBuffer = await docFile.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", fileBuffer);
      const fileHash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // 4. Submit the document reference to the trust service. The employer's
      // own id is used; the backend re-verifies ownership from the JWT.
      await trustApi.submitEmployerDocument(employer.id, {
        documentType: docType,
        fileUrl,
        fileHash,
        metadata: { mimeType: docFile.type, fileName: docFile.name },
      });

      setUploadSuccess(t("docSubmitted"));
      setDocFile(null);
      // Reset the file input so the same file can be re-selected later.
      const input = document.getElementById("doc-file-input") as HTMLInputElement | null;
      if (input) input.value = "";

      // Refresh the employer profile so the verification status reflects the
      // newly submitted document.
      const refreshed = await api.get("/employers/me/company");
      if (refreshed.data) setEmployer(refreshed.data);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || err?.message || t("errUploadGeneric"));
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t("loading")}</div>
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
                      {profile.publicId
                        ? t("workerTitle", { id: profile.publicId.slice(0, 6) })
                        : t("workerTitleFallback")}
                    </h1>
                    <p className="text-gray-500">
                      {profile.publicId
                        ? t("publicId", { id: profile.publicId })
                        : t("publicIdNone")}
                    </p>
                    <span
                      className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                        profile.profileVisibility === "ALL_VERIFIED"
                          ? "bg-green-100 text-green-700"
                          : profile.profileVisibility === "SELECTED_COMPANIES"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {profile.profileVisibility === "ALL_VERIFIED"
                        ? `${t("visibilityAllVerified")}${t("visibilityBadgeSuffix")}`
                        : profile.profileVisibility === "SELECTED_COMPANIES"
                        ? `${t("visibilitySelected")}${t("visibilityBadgeSuffix")}`
                        : `${t("visibilityHidden")}${t("visibilityBadgeSuffix")}`}
                    </span>
                    {profile.profileVisibility === "SELECTED_COMPANIES" && (
                      <p className="text-sm text-yellow-700 mt-2">
                        {t.rich("selectedCompaniesNotice", {
                          link: (chunks) => <Link href="/profile/edit" className="underline text-blue-600">{chunks}</Link>,
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href="/profile/edit"
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" />
                  {t("editProfile")}
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
                    <span>
                      {(() => { try { return tEnums(`availability.${profile.availability}` as never); } catch { return profile.availability.replace(/_/g, " ").toLowerCase(); } })()}
                    </span>
                  </div>
                )}
                {profile.yearsOfExperience !== undefined && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <span>{t("yearsExperience", { count: profile.yearsOfExperience })}</span>
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
                    {t("sectionSkills")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((ps, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {ps.skill?.name || t("skillUnknown")} (
                        {(() => { try { return tEnums(`skillLevel.${ps.level}` as never); } catch { return ps.level?.toLowerCase() || ""; } })()})
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
                    {t("sectionRegion")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {profile.region.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Salary Expectations */}
              {profile.desiredSalaryMin && (
                <div className="bg-white rounded-xl border shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Euro className="w-5 h-5" />
                    {t("sectionSalary")}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {currency(profile.desiredSalaryMin)} - {profile.desiredSalaryMax ? currency(profile.desiredSalaryMax) : '∞'}
                  </p>
                  <p className="text-sm text-gray-500">{t("perYear")}</p>
                </div>
              )}

              {/* Bio */}
              {profile.primaryTrade && (
                <div className="bg-white rounded-xl border shadow-sm p-6 md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t("sectionAbout")}</h3>
                  <p className="text-gray-700">
                    {t("aboutText", { trade: profile.primaryTrade, years: profile.yearsOfExperience || 0 })}
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
                    <p className="text-gray-500">{t("kvk", { kvk: employer.kvkNumber })}</p>
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
                  {t("edit")}
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
                {t("sectionCompanyInfo")}
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">{t("legalName")}</span>
                  <p className="font-medium">{employer.companyName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">{t("coc")}</span>
                  <p className="font-medium">{employer.kvkNumber}</p>
                </div>
                {employer.registeredAddress && (
                  <div>
                    <span className="text-sm text-gray-500">{t("registeredAddress")}</span>
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

            {/* Verification document upload */}
            {/* Only shown when verification is not yet complete, so employers
                can submit supporting documents for review. */}
            {employer.verificationStatus !== "BASIC_VERIFIED" &&
              employer.verificationStatus !== "PREMIUM_VERIFIED" && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {t("submitVerificationDoc")}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {t("submitVerificationDesc")}
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("documentType")}
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      disabled={uploading}
                      className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {(() => { try { return tEnums(`documentType.${opt}` as never); } catch { return opt.replace(/_/g, " "); } })()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("file")}
                    </label>
                    <input
                      id="doc-file-input"
                      type="file"
                      accept=".pdf,.png,.jpeg,.jpg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                      onChange={(e) => {
                        setDocFile(e.target.files?.[0] ?? null);
                        setUploadError(null);
                        setUploadSuccess(null);
                      }}
                      disabled={uploading}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {docFile && (
                      <p className="text-xs text-gray-500 mt-1">
                        {docFile.name} ({(docFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  {uploadError && (
                    <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-lg p-3">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                  {uploadSuccess && (
                    <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3">
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{uploadSuccess}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleUploadDocument}
                    disabled={uploading || !docFile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading ? t("uploading") : t("submitDocument")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {(userRole === "SUPPORT" || userRole === "ADMIN") && user && (
          // Minimal account view for support/admin staff. /profile is
          // worker/employer-oriented; staff get a basic account card so the
          // Profile link in the Navbar isn't a dead end.
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName || user.lastName
                    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
                    : user.email.split("@")[0]}
                </h1>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    userRole === "ADMIN"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {t("staffAccount", { role: userRole })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400" />
                <span>{user.email}</span>
                {user.emailVerified ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{user.phone}</span>
                  {user.phoneVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}