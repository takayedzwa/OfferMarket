"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Building2, CheckCircle, XCircle, Globe, Users, Mail, Phone, Calendar, Briefcase } from "lucide-react";

interface Employer {
  id: string;
  userId: string;
  companyName: string;
  companyTradeName?: string;
  kvkNumber: string;
  vatNumber?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  foundedYear?: number;
  phone?: string;
  billingEmail?: string;
  registeredAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  businessAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  isVerified: boolean;
  verifiedAt?: string;
  verificationStatus: string;
  user: {
    email: string;
    phoneNumber?: string;
    status: string;
    createdAt: string;
  };
}

interface Offer {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

export default function AdminEmployerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employerId = params.id as string;
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");

  const fetchEmployer = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/employers/${employerId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setEmployer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchOffers = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/offers?employerId=${employerId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': 'ADMIN',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setOffers(data.offers || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchEmployer();
    fetchOffers();
  }, [employerId]);

  const handleVerify = () => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/employers/${employerId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({ notes: verificationNotes }),
    })
      .then((res) => {
        if (res.ok) {
          setShowVerifyModal(false);
          fetchEmployer();
        } else {
          alert('Failed to verify employer');
        }
      })
      .catch(() => alert('Failed to verify employer'));
  };

  const handleReject = () => {
    const adminUserId = localStorage.getItem('userId');
    if (!adminUserId) return;

    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/employers/${employerId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': adminUserId,
        'X-User-Role': 'ADMIN',
      },
      body: JSON.stringify({ reason }),
    })
      .then((res) => {
        if (res.ok) {
          fetchEmployer();
        } else {
          alert('Failed to reject employer');
        }
      })
      .catch(() => alert('Failed to reject employer'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Employer not found</div>
      </div>
    );
  }

  // Derive isVerified from verificationStatus
  const isVerified = employer.verificationStatus === 'BASIC_VERIFIED' || employer.verificationStatus === 'FULL_VERIFIED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/admin/employers')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{employer.companyName}</h1>
                <p className="text-sm text-gray-500">{employer.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isVerified ? (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                  {employer.verifiedAt && (
                    <span className="text-xs text-green-600">
                      {new Date(employer.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setShowVerifyModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verify
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Company Name</div>
                    <div className="font-medium text-gray-900">{employer.companyName}</div>
                  </div>
                </div>
                {employer.companyTradeName && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Trading Name</div>
                      <div className="font-medium text-gray-900">{employer.companyTradeName}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">KvK Number</div>
                    <div className="font-medium text-gray-900">{employer.kvkNumber}</div>
                  </div>
                </div>
                {employer.vatNumber && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">VAT Number</div>
                      <div className="font-medium text-gray-900">{employer.vatNumber}</div>
                    </div>
                  </div>
                )}
                {employer.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Website</div>
                      <a href={employer.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                        {employer.website}
                      </a>
                    </div>
                  </div>
                )}
                {employer.industry && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Industry</div>
                      <div className="font-medium text-gray-900">{employer.industry}</div>
                    </div>
                  </div>
                )}
                {employer.companySize && (
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Company Size</div>
                      <div className="font-medium text-gray-900">{employer.companySize}</div>
                    </div>
                  </div>
                )}
                {employer.foundedYear && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Founded</div>
                      <div className="font-medium text-gray-900">{employer.foundedYear}</div>
                    </div>
                  </div>
                )}
                {employer.registeredAddress && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Registered Address</div>
                    <p className="text-gray-900">
                      {[employer.registeredAddress.street, employer.registeredAddress.postalCode, employer.registeredAddress.city, employer.registeredAddress.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                {employer.businessAddress && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Business Address</div>
                    <p className="text-gray-900">
                      {[employer.businessAddress.street, employer.businessAddress.postalCode, employer.businessAddress.city, employer.businessAddress.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-gray-900">{employer.user.email}</div>
                  </div>
                </div>
                {employer.billingEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Billing Email</div>
                      <div className="font-medium text-gray-900">{employer.billingEmail}</div>
                    </div>
                  </div>
                )}
                {employer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Company Phone</div>
                      <div className="font-medium text-gray-900">{employer.phone}</div>
                    </div>
                  </div>
                )}
                {employer.user.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Personal Phone</div>
                      <div className="font-medium text-gray-900">{employer.user.phoneNumber}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-500">Joined</div>
                    <div className="font-medium text-gray-900">{new Date(employer.user.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Offers */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Offers ({offers.length})</h2>
              {offers.length === 0 ? (
                <p className="text-sm text-gray-500">No offers posted yet</p>
              ) : (
                <div className="space-y-2">
                  {offers.map((offer) => (
                    <div key={offer.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{offer.title}</div>
                        <div className="text-xs text-gray-500">Posted {new Date(offer.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        offer.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {offer.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h2>
              <div className={`p-4 rounded-lg ${isVerified ? 'bg-green-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {isVerified ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-gray-400" />
                  )}
                  <span className={`font-medium ${isVerified ? 'text-green-800' : 'text-gray-800'}`}>
                    {isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                {isVerified && employer.verifiedAt && (
                  <p className="text-sm text-green-600">
                    Verified on {new Date(employer.verifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  employer.verificationStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  employer.verificationStatus === 'BASIC_VERIFIED' ? 'bg-green-100 text-green-800' :
                  employer.verificationStatus === 'FULL_VERIFIED' ? 'bg-green-100 text-green-800' :
                  employer.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {employer.verificationStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h2>
              <div className={`p-4 rounded-lg ${
                employer.user.status === 'ACTIVE' ? 'bg-green-50' :
                employer.user.status === 'BANNED' ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <span className={`font-medium ${
                  employer.user.status === 'ACTIVE' ? 'text-green-800' :
                  employer.user.status === 'BANNED' ? 'text-red-800' : 'text-yellow-800'
                }`}>
                  {employer.user.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Employer</h3>
            <p className="text-sm text-gray-600 mb-4">Confirm that this employer has been verified through your verification process.</p>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Add verification notes (optional)..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Verify Employer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
