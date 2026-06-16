"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { workersApi } from "../../lib/api";
import { Search, Filter, User, MapPin, Briefcase, Star, ArrowRight, ChevronLeft, ChevronRight, X, Plus } from "lucide-react";

interface Worker {
  publicId: string;
  region: { name: string; province?: string } | null;
  yearsOfExperience?: number;
  primaryTrade?: string;
  availability: string;
  skills: any[];
  certifications: any[];
  desiredSalaryRange: { min?: number; max?: number };
  employmentTypes: string[];
  travelDistanceKm?: number;
  profileCompletenessPct: number;
  reputationScore: number;
  lastActive: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function WorkersSearch() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [showFilters, setShowFilters] = useState(false);

  const handleCreateOffer = (e: React.MouseEvent, workerPublicId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/offers/create?workerId=${workerPublicId}`);
  };

  // Filters
  const [filters, setFilters] = useState({
    trade: "",
    regionId: "",
    availability: "",
    minExperience: "",
    maxExperience: "",
  });

  const [trades, setTrades] = useState<any[]>([]);

  useEffect(() => {
    // Load available trades
    workersApi.getTrades()
      .then((res) => setTrades(res.data.currentlyAvailable || []))
      .catch(console.error);

    // Load workers
    searchWorkers();
  }, []);

  const searchWorkers = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (filters.trade) params.trade = filters.trade;
      if (filters.availability) params.availability = filters.availability;
      if (filters.minExperience) params.minExperience = parseInt(filters.minExperience);
      if (filters.maxExperience) params.maxExperience = parseInt(filters.maxExperience);

      const res = await workersApi.searchWorkers(params);
      setWorkers(res.data.workers || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error("Failed to search workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      trade: "",
      regionId: "",
      availability: "",
      minExperience: "",
      maxExperience: "",
    });
    searchWorkers(1);
  };

  const applyFilters = () => {
    searchWorkers(1);
    setShowFilters(false);
  };

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
      IMMEDIATE: "text-green-600 bg-green-50",
      ONE_MONTH: "text-blue-600 bg-blue-50",
      THREE_MONTHS: "text-yellow-600 bg-yellow-50",
      SIX_MONTHS: "text-orange-600 bg-orange-50",
      NOT_AVAILABLE: "text-gray-600 bg-gray-50",
    };
    return colors[availability] || "text-gray-600 bg-gray-50";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Find Workers</h1>
              <p className="text-gray-600 mt-1">Browse anonymous worker profiles and send offers</p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(filters.trade || filters.availability || filters.minExperience || filters.maxExperience) && (
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Search Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade / Profession
                </label>
                <select
                  value={filters.trade}
                  onChange={(e) => handleFilterChange("trade", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">All Trades</option>
                  {trades.map((trade) => (
                    <option key={trade.value} value={trade.value}>
                      {trade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => handleFilterChange("availability", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                >
                  <option value="">Any Availability</option>
                  <option value="IMMEDIATE">Immediate</option>
                  <option value="ONE_MONTH">Within 1 month</option>
                  <option value="THREE_MONTHS">Within 3 months</option>
                  <option value="SIX_MONTHS">Within 6 months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.minExperience}
                    onChange={(e) => handleFilterChange("minExperience", e.target.value)}
                    placeholder="Min"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    min="0"
                    max="50"
                  />
                  <input
                    type="number"
                    value={filters.maxExperience}
                    onChange={(e) => handleFilterChange("maxExperience", e.target.value)}
                    placeholder="Max"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    min="0"
                    max="50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={applyFilters}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="w-4 h-4" />
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading workers...</div>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workers found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search filters</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} workers
            </div>

            {/* Worker Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map((worker) => (
                <div
                  key={worker.publicId}
                  className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{worker.publicId}</h3>
                      <p className="text-sm text-gray-600">{worker.primaryTrade || "General Worker"}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getAvailabilityColor(worker.availability)}`}>
                      {worker.availability === "IMMEDIATE" ? "Immediate" : worker.availability.replace("_", " ")}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 mb-4">
                    {worker.region && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {worker.region.name}
                      </div>
                    )}
                    {worker.yearsOfExperience !== undefined && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4" />
                        {worker.yearsOfExperience} years experience
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="w-4 h-4" />
                      Reputation: {worker.reputationScore}/100
                    </div>
                  </div>

                  {/* Skills */}
                  {worker.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {worker.skills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {worker.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{worker.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Profile completeness */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Profile completeness</span>
                      <span>{worker.profileCompletenessPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${worker.profileCompletenessPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-500">
                      Active {new Date(worker.lastActive).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t">
                    <Link
                      href={`/workers/${worker.publicId}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-sm font-medium"
                    >
                      View Profile
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={(e) => handleCreateOffer(e, worker.publicId)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Create Offer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => searchWorkers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => searchWorkers(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
