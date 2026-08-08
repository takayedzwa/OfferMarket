import { getTranslations } from "next-intl/server";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReportContentForm from '@/components/dsa/ReportContentForm';

/**
 * DSA Art. 16: Notice-and-Action — Public report page.
 * This page must be easily accessible without authentication,
 * as required by DSA Art. 16(1).
 */
export default async function ReportContentPage() {
  const t = await getTranslations("dsa.report");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t("intro")}
          </p>
        </div>

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800">{t("rightsTitle")}</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
            <li>{t("rightsAnonymous")}</li>
            <li>{t("rightsAcknowledgment")}</li>
            <li>{t("rightsDecision")}</li>
            <li>{t("rightsComplaint")}</li>
          </ul>
        </div>

        <ReportContentForm />

        <div className="mt-8 text-center text-xs text-gray-500">
          <p>
            {t("unfoundedNotice")}
          </p>
          <p className="mt-1">
            {t("contactLabel")} <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">legal@offermarket.nl</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}