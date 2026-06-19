"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, MapPin, DollarSign, Clock, Calendar, CheckCircle, XCircle, Globe, Users, Mail, Phone } from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  status: string;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  employmentTypes?: string[];
  workSchedules?: string[];
  industries?: string[];
  experienceLevel?: string;
  educationLevel?: string;
  remoteOption?: string;
  travelRequirement?: string;
  createdAt: string;
  expiresAt?: string;
  employer: {
    id: string;
    companyName: string;
    companyTradeName?: string;
    kvkNumber?: string;
    website?: string;
    phone?: string;
    billingEmail?: string;
    user: {
      email: string;
      phoneNumber?: string;
    };
  };
  applications?: any[];
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
      ACTIVE: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-red-100 text-red-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      FILLED: 'bg-blue-100 text-blue-800',
      DELETED: 'bg-gray-100 text-gray-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
    if (min) return `From €${min.toLocaleString()}`;
    return `Up to €${max?.toLocaleString()}`;
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
                <h1 className="text-lg font-semibold text-gray-900">{offer.title}</h1>
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
                    <p className="font-medium text-gray-900">{offer.employmentTypes?.join(', ') || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Work Schedule</label>
                    <p className="font-medium text-gray-900">{offer.workSchedules?.join(', ') || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Experience Level</label>
                    <p className="font-medium text-gray-900">{offer.experienceLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Education Level</label>
                    <p className="font-medium text-gray-900">{offer.educationLevel || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Remote Option</label>
                    <p className="font-medium text-gray-900">{offer.remoteOption || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Travel Required</label>
                    <p className="font-medium text-gray-900">{offer.travelRequirement || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {offer.description && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{offer.description}</p>
              </div>
            )}

            {/* Requirements */}
            {offer.requirements && offer.requirements.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {offer.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {offer.benefits && offer.benefits.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {offer.benefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salary & Location */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary & Location</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Salary Range
                  </div>
                  <p className="font-medium text-gray-900">{formatSalary(offer.minSalary, offer.maxSalary)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </div>
                  <p className="font-medium text-gray-900">{offer.location || 'Not specified'}</p>
                </div>
              </div>
            </div>

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
                {offer.status === 'ACTIVE' && (
                  <button className="w-full px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pause Offer
                  </button>
                )}
                {offer.status === 'PAUSED' && (
                  <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Reactivate Offer
                  </button>
                )}
                <button className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Delete Offer
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
