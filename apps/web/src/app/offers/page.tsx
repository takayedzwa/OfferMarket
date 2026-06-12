"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { offersApi } from "../../lib/api";
import { Offer } from "../../lib/types";
import { Briefcase, Euro, MapPin, Calendar, Filter, Search } from "lucide-react";

function OffersContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadOffers() {
      try {
        const role = localStorage.getItem("userRole");
        let response;

        if (role === "WORKER") {
          response = await offersApi.getWorkerOffers();
        } else {
          response = await offersApi.getEmployerOffers();
        }

        setOffers(response.data);
      } catch (error) {
        console.error("Failed to load offers:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOffers();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    const matchesFilter =
      filter === "all" ||
      offer.status.toLowerCase() === filter.toLowerCase();

    const matchesSearch =
      searchQuery === "" ||
      offer.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.jobDescription?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const userRole = localStorage.getItem("userRole");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading offers...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={userRole === "WORKER" ? "/dashboard/worker" : "/dashboard/employer"}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-xl font-bold text-gray-900">OfferMarket</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href={userRole === "WORKER" ? "/dashboard/worker" : "/dashboard/employer"}
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link href="/offers" className="text-blue-600 font-medium">
                Offers
              </Link>
              <Link href="/conversations" className="text-gray-600 hover:text-gray-900">
                Messages
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              {userRole === "EMPLOYER" && (
                <Link
                  href="/offers/create"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create Offer
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search offers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="all">All Offers</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="viewed">Viewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Offers List */}
        {filteredOffers.length > 0 ? (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <Link
                key={offer.id}
                href={`/offers/${offer.id}`}
                className="block bg-white rounded-xl border shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {offer.jobTitle}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
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

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {offer.jobDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Euro className="w-4 h-4" />
                          €{offer.compensation?.salary?.min?.toLocaleString()} - €
                          {offer.compensation?.salary?.max?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {offer.workArrangement?.type === "ONSITE"
                            ? "On-site"
                            : offer.workArrangement?.type === "REMOTE"
                            ? "Remote"
                            : "Hybrid"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {offer.contract?.type?.toLowerCase() || "permanent"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {userRole === "EMPLOYER" && offer.worker && (
                      <div className="ml-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-700">
                            {offer.worker.publicId?.slice(0, 2).toUpperCase() || "W"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No offers found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "Try adjusting your search or filters"
                : userRole === "EMPLOYER"
                ? "Create your first offer to start attracting talent"
                : "Offers from employers will appear here once you create your profile"}
            </p>
            {userRole === "EMPLOYER" && (
              <Link
                href="/offers/create"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Create Offer
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <OffersContent />
    </Suspense>
  );
}
