'use client';

import Navbar from '@/components/Navbar';
import DataExportCard from '@/components/privacy/DataExportCard';

export default function DataExportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a href="/privacy/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to Privacy Dashboard
          </a>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Data Export</h1>
          <p className="mt-1 text-sm text-gray-600">
            Exercise your right to data portability under AVG Article 20. Download all personal data
            we hold about you in a machine-readable format.
          </p>
        </div>

        <DataExportCard />

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">What&apos;s included in your export:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>Profile information (name, email, phone)</li>
            <li>Worker/Employer profile data</li>
            <li>Skills, certifications, education, work experience</li>
            <li>Offers sent and received</li>
            <li>Messages (anonymized for other parties)</li>
            <li>Notifications</li>
            <li>Consent records</li>
            <li>Account activity logs</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            Your export is provided in JSON format for maximum portability. Download links expire after 30 days.
            You can request a new export at any time.
          </p>
        </div>
      </div>
    </div>
  );
}