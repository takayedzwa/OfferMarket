'use client';

import Navbar from '@/components/Navbar';
import DeletionCard from '@/components/privacy/DeletionCard';

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <a href="/privacy/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Back to Privacy Dashboard
          </a>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Delete Your Account</h1>
          <p className="mt-1 text-sm text-gray-600">
            Exercise your right to erasure under AVG Article 17. This will permanently delete your
            account and personal data after a 30-day grace period.
          </p>
        </div>

        <DeletionCard />

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Alternative options:</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <strong>Restrict processing</strong> — Keep your account but limit how your data is used.{' '}
                <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Learn more</a>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <strong>Export your data</strong> — Download a copy before deleting.{' '}
                <a href="/privacy/export" className="text-blue-600 hover:underline">Export data</a>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <strong>Hide your profile</strong> — Make your profile invisible without deleting your account.{' '}
                Available in your profile settings.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}