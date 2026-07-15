import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReportStatusChecker from '@/components/dsa/ReportStatusChecker';

/**
 * DSA Art. 16(4): Reporters must be able to track the status of their submissions.
 * This page allows users to check their report status using the public reference ID.
 */
export default function ReportStatusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report Status</h1>
          <p className="mt-2 text-sm text-gray-600">
            Check the status of your content report using the reference number you received
            when submitting your report.
          </p>
        </div>

        <ReportStatusChecker />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            If you have questions about your report, contact us at{' '}
            <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">legal@offermarket.nl</a>
          </p>
          <p className="mt-1">
            <a href="/dsa/report" className="text-blue-600 hover:underline">Submit a new report →</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}