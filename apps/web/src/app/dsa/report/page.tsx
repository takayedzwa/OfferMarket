import Navbar from '@/components/Navbar';
import ReportContentForm from '@/components/dsa/ReportContentForm';

/**
 * DSA Art. 16: Notice-and-Action — Public report page.
 * This page must be easily accessible without authentication,
 * as required by DSA Art. 16(1).
 */
export default function ReportContentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Report Illegal Content</h1>
          <p className="mt-2 text-sm text-gray-600">
            Under the Digital Services Act (DSA, Regulation EU 2022/2065), you have the right
            to notify us of content that you consider to be illegal. Your report will be
            processed in accordance with our notice-and-action procedure.
          </p>
        </div>

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800">Your rights under the DSA</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
            <li>You may submit reports anonymously by providing an email address for acknowledgment.</li>
            <li>You will receive an acknowledgment of your report without undue delay (DSA Art. 16(4)).</li>
            <li>You will be notified of the decision taken on your report.</li>
            <li>If you disagree with a decision, you may submit a complaint through our internal complaint-handling system.</li>
          </ul>
        </div>

        <ReportContentForm />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            DSA Art. 16(3)(d): Submitting manifestly unfounded notices may result in reporting
            restrictions under DSA Art. 23.
          </p>
          <p className="mt-1">
            Contact: <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">legal@offermarket.nl</a>
          </p>
        </div>
      </div>
    </div>
  );
}