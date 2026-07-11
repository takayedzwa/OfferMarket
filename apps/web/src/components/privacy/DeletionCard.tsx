'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function DeletionCard() {
  const [step, setStep] = useState<'idle' | 'confirm' | 'processing' | 'grace' | 'cancelled' | 'error'>('idle');
  const [reason, setReason] = useState('');
  const [deletionDate, setDeletionDate] = useState<string | null>(null);
  const [deletionRequestId, setDeletionRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestDeletion = async () => {
    setStep('processing');
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/privacy/request/erasure`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to request account deletion');
      }

      const data = await response.json();
      // Store the request ID for cancellation
      setDeletionRequestId(data.id);

      // Use scheduledDeletionAt from the response, or default to 30 days
      const scheduledDate = data.scheduledDeletionAt
        ? new Date(data.scheduledDeletionAt)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setDeletionDate(scheduledDate.toLocaleDateString('nl-NL', {
        year: 'numeric', month: 'long', day: 'numeric',
      }));
      setStep('grace');
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const cancelDeletion = async () => {
    if (!deletionRequestId) return;
    setStep('processing');
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/privacy/request/erasure/${deletionRequestId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to cancel deletion');
      }

      setStep('cancelled');
    } catch (err) {
      setStep('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-red-700">Account Deletion</h3>
        <p className="mt-1 text-sm text-gray-500">
          Request permanent deletion of your account and personal data — GDPR Article 17 (Right to Erasure).
        </p>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Warning box */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">Important — Read before proceeding</h4>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your account and personal data will be permanently deleted.</li>
                  <li>You have a <strong>30-day grace period</strong> to cancel this request.</li>
                  <li>Some data must be retained by law (invoices for 7 years, KvK numbers).</li>
                  <li>This action cannot be undone after the grace period ends.</li>
                  <li>Your anonymous profile, offers, and messages will be anonymized.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="bg-gray-50 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">What happens to your data:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-red-700 mb-1">Will be deleted:</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Email address</li>
                <li>• Phone number</li>
                <li>• Profile information</li>
                <li>• Work history & education</li>
                <li>• Skills & certifications</li>
                <li>• Messages</li>
                <li>• Notifications</li>
                <li>• Verification documents</li>
                <li>• Login credentials</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-green-700 mb-1">Retained by law:</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Anonymized invoices (7 years — tax obligation)</li>
                <li>• KvK registration numbers (legal obligation)</li>
                <li>• Audit logs (anonymized, 7 years)</li>
                <li>• Consent records (7 years after withdrawal)</li>
              </ul>
            </div>
          </div>
        </div>

        {step === 'idle' && (
          <button
            onClick={() => setStep('confirm')}
            className="w-full px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Request Account Deletion
          </button>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                Reason for deletion (optional)
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                placeholder="Tell us why you're leaving (this helps us improve)..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={requestDeletion}
                className="flex-1 px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Yes, delete my account
              </button>
              <button
                onClick={() => setStep('idle')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Processing your deletion request...</p>
          </div>
        )}

        {step === 'grace' && (
          <div className="text-center py-4">
            <svg className="h-12 w-12 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-900">Deletion Request Submitted</p>
            <p className="mt-1 text-sm text-gray-600">
              Your account will be permanently deleted on <strong>{deletionDate}</strong>.
            </p>
            <p className="mt-2 text-sm text-amber-700">
              You can cancel this request within the 30-day grace period.
            </p>
            <button
              onClick={cancelDeletion}
              className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel Deletion Request
            </button>
          </div>
        )}

        {step === 'cancelled' && (
          <div className="text-center py-4">
            <svg className="h-12 w-12 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-lg font-medium text-gray-900">Deletion Cancelled</p>
            <p className="mt-1 text-sm text-gray-600">Your account is safe. Your data will not be deleted.</p>
            <button
              onClick={() => { setStep('idle'); setReason(''); }}
              className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error || 'An error occurred. Please try again.'}</p>
            </div>
            <button
              onClick={() => { setStep('idle'); setError(null); }}
              className="mt-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}