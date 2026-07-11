'use client';

import Navbar from '@/components/Navbar';
import ConsentCard from '@/components/privacy/DataSummaryCard';

export default function ConsentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a href="/privacy/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to Privacy Dashboard
          </a>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Consent Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your consent preferences for each type of data processing. Under the AVG (GDPR),
            you have the right to withdraw consent at any time.
          </p>
        </div>

        <ConsentCard />

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Withdrawing consent for required processing (such as data processing for
            contract performance) may limit your ability to use certain features. Special category consent
            (work authorization) can be withdrawn at any time without affecting core functionality — your
            profile will simply not show your work authorization status to employers.
          </p>
        </div>
      </div>
    </div>
  );
}