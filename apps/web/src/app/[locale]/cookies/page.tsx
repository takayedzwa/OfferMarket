'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';

export default function CookiePolicyPage() {
  const t = useTranslations('legal.cookies');

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
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s1.title')}</h2>
              <p>
                {t('s1.p1')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s2.title')}</h2>
              <p>
                {t.rich('s2.p1', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <p className="mt-2">
                {t.rich('s2.p2', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <p className="mt-2">
                {t.rich('s2.p3', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                  a: (chunks) => <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{chunks}</Link>,
                })}
              </p>
              <p className="mt-2">
                {t.rich('s2.p4', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <p className="mt-2">
                {t('s2.p5')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s3.title')}</h2>

              <div className="mt-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {t('s3.essential.badge')}
                    </span>
                    <h3 className="font-medium text-gray-900">{t('s3.essential.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('s3.essential.description')}
                  </p>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('s3.essential.tableHeaders.cookie')}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('s3.essential.tableHeaders.purpose')}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('s3.essential.tableHeaders.duration')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(['row1', 'row2', 'row3'] as const).map((key) => (
                        <tr key={key}>
                          <td className="px-3 py-2">{t(`s3.essential.rows.${key}.cookie`)}</td>
                          <td className="px-3 py-2">{t(`s3.essential.rows.${key}.purpose`)}</td>
                          <td className="px-3 py-2">{t(`s3.essential.rows.${key}.duration`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {t('s3.analytics.badge')}
                    </span>
                    <h3 className="font-medium text-gray-900">{t('s3.analytics.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('s3.analytics.description')}
                  </p>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('s3.analytics.tableHeaders.cookie')}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('s3.analytics.tableHeaders.purpose')}</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('s3.analytics.tableHeaders.duration')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(['row1'] as const).map((key) => (
                        <tr key={key}>
                          <td className="px-3 py-2">{t(`s3.analytics.rows.${key}.cookie`)}</td>
                          <td className="px-3 py-2">{t(`s3.analytics.rows.${key}.purpose`)}</td>
                          <td className="px-3 py-2">{t(`s3.analytics.rows.${key}.duration`)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {t('s3.marketing.badge')}
                    </span>
                    <h3 className="font-medium text-gray-900">{t('s3.marketing.title')}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('s3.marketing.description')}
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    {t('s3.marketing.italicNote')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s4.title')}</h2>
              <p>
                {t('s4.intro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>
                  {t.rich('s4.list.item1', { a: (chunks) => <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{chunks}</Link> })}
                </li>
                <li>
                  {t('s4.list.item2')}
                </li>
                <li>
                  {t.rich('s4.list.item3', { strong: (chunks) => <strong>{chunks}</strong> })}
                </li>
                <li>
                  {t('s4.list.item4')}
                </li>
              </ul>
              <p className="mt-3">
                {t('s4.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s5.title')}</h2>
              <p>
                {t.rich('s5.intro', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>{t('s5.list.item1')}</li>
                <li>{t('s5.list.item2')}</li>
                <li>{t('s5.list.item3')}</li>
                <li>{t('s5.list.item4')}</li>
                <li>
                  {t.rich('s5.list.item5', { a: (chunks) => <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{chunks}</Link> })}
                </li>
                <li>{t('s5.list.item6')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s6.title')}</h2>
              <p>
                {t('s6.intro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3'] as const).map((key) => (
                  <li key={key}>{t.rich(`s6.list.${key}`, { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                ))}
              </ul>
              <p className="mt-2">
                {t('s6.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s7.title')}</h2>
              <p>
                {t('s7.p1')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s8.title')}</h2>
              <p>
                {t.rich('s8.p1', { a: (chunks) => <a href="mailto:dpo@offermarket.nl" className="text-blue-600 hover:underline">{chunks}</a> })}
              </p>
            </section>
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              {t('footer.copyright', { year: new Date().getFullYear() })}{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">{t('footer.privacyLink')}</Link> ·{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">{t('footer.termsLink')}</Link> ·{' '}
              <Link href="/cookies" className="text-blue-600 hover:underline">{t('footer.cookiesLink')}</Link> ·{' '}
              <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('footer.dashboardLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}