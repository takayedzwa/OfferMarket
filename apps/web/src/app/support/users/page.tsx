"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, User, Mail, Phone, Ticket } from "lucide-react";

interface SearchResult {
  id: string;
  email: string;
  phoneNumber?: string;
  role: string;
  status: string;
  createdAt: string;
  worker?: any;
  employer?: any;
}

export default function SupportUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (!search.trim()) return;

    setLoading(true);
    setHasSearched(true);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/support/users?search=${encodeURIComponent(search)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-User-ID': localStorage.getItem('userId') || '',
        'X-User-Role': localStorage.getItem('userRole') || '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setSearchResults(data.users || []);
        setLoading(false);
      })
      .catch(() => {
        setSearchResults([]);
        setLoading(false);
      });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/support')} className="p-2 hover:bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">User Lookup</h1>
                <p className="text-sm text-gray-500">Search for users to view their profile and tickets</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Box */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by Email or User ID
          </label>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter email address or user ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !search.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">
                {searchResults.length === 0 ? 'No Results Found' : `Found ${searchResults.length} Result(s)`}
              </h2>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p>No users found matching your search</p>
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-6 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/support/users/${user.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{user.email}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'SUPPORT' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'EMPLOYER' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                              user.status === 'BANNED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {user.phoneNumber && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                <span>{user.phoneNumber}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600">
                        <span className="text-sm font-medium">View Profile</span>
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Tips */}
        {!hasSearched && (
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
            <h3 className="font-semibold text-blue-900 mb-2">User Lookup Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Search by full email address for best results</li>
              <li>• You can also search by user ID (UUID)</li>
              <li>• Partial email matches will return multiple results</li>
              <li>• Click on any user to view their full profile and ticket history</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
