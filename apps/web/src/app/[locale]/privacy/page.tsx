'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';

export default function PrivacyPolicyPage() {
  const t = useTranslations('privacy.overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {t('lastUpdated')}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              <span lang="nl">{t('dutchTitle')}</span> · {t('companyName')}
            </p>
          </div>

          <div className="px-8 py-6 space-y-8 text-gray-700 text-sm leading-relaxed">
            {/* 1. Controller */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section1.title')}</h2>
              <p>
                {t('section1.intro')}
              </p>
              <div className="mt-2 bg-gray-50 rounded-md p-4">
                <p className="font-medium">{t('section1.company')}</p>
                <p>{t('section1.kvk')}</p>
                <p>{t('section1.address')}</p>
                <p>{t('section1.dpoLabel')} <a href="mailto:dpo@offermarket.nl" className="text-blue-600 hover:underline">{t('section1.dpoEmail')}</a></p>
              </div>
              <p className="mt-3">
                {t('section1.contactQuestion')}
              </p>
            </section>

            {/* 2. Data We Process */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section2.title')}</h2>
              <p>{t('section2.intro')}</p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('section2.tableHeaders.category')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('section2.tableHeaders.examples')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('section2.tableHeaders.legalBasis')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(['identity', 'profile', 'special', 'professional', 'communication', 'company', 'verification', 'financial', 'technical', 'usage'] as const).map((key, idx) => (
                      <tr key={key} className={key === 'special' ? 'bg-amber-50' : undefined}>
                        <td className={`px-4 py-3 text-sm ${key === 'special' ? 'font-medium' : ''}`}>{t(`section2.rows.${key}.category`)}</td>
                        <td className="px-4 py-3 text-sm">{t(`section2.rows.${key}.examples`)}</td>
                        <td className="px-4 py-3 text-sm">{t(`section2.rows.${key}.legalBasis`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Special Category Data */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section3.title')}</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="font-medium text-amber-900">{t('section3.important')}</p>
                <p className="mt-2 text-amber-800">
                  {t('section3.p1')}
                </p>
                <p className="mt-2 text-amber-800">
                  {t.rich('section3.p2', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
                <p className="mt-2 text-amber-800">
                  {t('section3.p3')}
                </p>
              </div>
            </section>

            {/* 4. Legal Bases */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section4.title')}</h2>
              <p>{t('section4.intro')}</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>{t.rich('section4.consent', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section4.contract', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section4.obligation', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section4.interest', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
              </ul>
            </section>

            {/* 5. Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section5.title')}</h2>
              <p>{t('section5.intro')}</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>{t.rich('section5.employers', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section5.aws', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section5.stripe', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section5.posthog', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section5.twilio', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section5.sentry', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
              </ul>
              <p className="mt-3">
                {t('section5.dpaNote')}
              </p>
            </section>

            {/* 6. Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section6.title')}</h2>
              <p>{t('section6.intro')}</p>
              <ul className="mt-3 space-y-1 list-disc pl-5">
                <li>{t.rich('section6.activeAccounts', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.invoices', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.kvk', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.messages', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.verification', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.consentRecords', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.ipAddresses', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.auditLogs', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                <li>{t.rich('section6.analytics', { strong: (chunks) => <strong>{chunks}</strong> })}</li>
              </ul>
            </section>

            {/* 7. Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section7.title')}</h2>
              <p>{t('section7.intro')}</p>

              <div className="mt-4 space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{t('section7.accessTitle')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('section7.accessBody')}{' '}
                    <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('section7.accessLink')}</Link>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{t('section7.rectificationTitle')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('section7.rectificationBody')}
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{t('section7.erasureTitle')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('section7.erasureBody')}{' '}
                    <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('section7.erasureLink')}</Link>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{t('section7.restrictionTitle')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('section7.restrictionBody')}{' '}
                    <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('section7.restrictionLink')}</Link>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{t('section7.portabilityTitle')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('section7.portabilityBody')}{' '}
                    <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('section7.portabilityLink')}</Link>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{t('section7.objectTitle')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('section7.objectBody')}
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">{t('section7.withdrawTitle')}</h3>
                  <p className="text-sm text-gray-600">
                    {t('section7.withdrawBody')}{' '}
                    <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('section7.withdrawLink')}</Link>
                  </p>
                </div>
              </div>

              <p className="mt-4">
                {t('section7.exerciseIntro')}{' '}
                <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('section7.privacyDashboardLink')}</Link>{' '}
                {t('section7.exerciseMid')}{' '}
                <a href="mailto:dpo@offermarket.nl" className="text-blue-600 hover:underline">{t('section7.dpoEmail')}</a>.
              </p>
              <p className="mt-2">
                {t('section7.complaintIntro')}{' '}
                <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {t('section7.apLink')}
                </a>{' '}
                {t('section7.complaintOutro')}
              </p>
            </section>

            {/* 8. Automated Decision-Making */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section8.title')}</h2>
              <p>
                {t('section8.p1')}
              </p>
              <p className="mt-2">
                {t('section8.p2')}
              </p>
            </section>

            {/* 9. International Transfers */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section9.title')}</h2>
              <p>
                {t('section9.p1')}
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('section9.tableHeaders.processor')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('section9.tableHeaders.processing')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('section9.tableHeaders.country')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('section9.tableHeaders.safeguard')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(['aws', 'posthog', 'stripe', 'twilio', 'sentry'] as const).map((key) => (
                      <tr key={key}>
                        <td className="px-4 py-3 text-sm">{t(`section9.rows.${key}.processor`)}</td>
                        <td className="px-4 py-3 text-sm">{t(`section9.rows.${key}.processing`)}</td>
                        <td className="px-4 py-3 text-sm">{t(`section9.rows.${key}.country`)}</td>
                        <td className="px-4 py-3 text-sm">{t(`section9.rows.${key}.safeguard`)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                {t('section9.sccNote')}
              </p>
            </section>

            {/* 10. Security */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section10.title')}</h2>
              <p>{t('section10.intro')}</p>
              <ul className="mt-3 space-y-1 list-disc pl-5">
                <li>{t('section10.encryption')}</li>
                <li>{t('section10.rbac')}</li>
                <li>{t('section10.anonymized')}</li>
                <li>{t('section10.audits')}</li>
                <li>{t('section10.breach')}</li>
                <li>{t('section10.tfa')}</li>
                <li>{t('section10.ipHashing')}</li>
              </ul>
            </section>

            {/* 11. Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section11.title')}</h2>
              <p>
                {t('section11.intro')}{' '}
                <Link href="/cookies" className="text-blue-600 hover:underline">{t('section11.cookiePolicyLink')}</Link>.
              </p>
            </section>

            {/* 12. Changes */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section12.title')}</h2>
              <p>
                {t('section12.body')}
              </p>
            </section>

            {/* 13. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('section13.title')}</h2>
              <p>
                {t('section13.intro')}
              </p>
              <div className="mt-2 bg-gray-50 rounded-md p-4">
                <p><strong>{t('section13.dpoLabel')}</strong> {t('section13.dpoValue')}</p>
                <p><strong>{t('section13.companyLabel')}</strong></p>
                <p>{t('section13.address')}</p>
                <p><strong>{t('section13.kvkLabel')}</strong> {t('section13.kvkValue')}</p>
              </div>
            </section>
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              {t('footer.copyright', { year: new Date().getFullYear() })}{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">{t('footer.privacyLink')}</Link> ·{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">{t('footer.termsLink')}</Link> ·{' '}
              <Link href="/cookies" className="text-blue-600 hover:underline">{t('footer.cookiesLink')}</Link> ·{' '}
              <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('footer.dashboardLink')}</Link> ·{' '}
              <Link href="/dsa/report" className="text-red-600 hover:underline">{t('footer.reportLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}