'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';

export default function TermsOfServicePage() {
  const t = useTranslations('legal.terms');

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
              <ul className="space-y-2 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4', 'item5', 'item6'] as const).map((key) => (
                  <li key={key}>{t.rich(`s1.list.${key}`, { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s2.title')}</h2>
              <p>
                {t.rich('s2.p1', { a: (chunks) => <Link href="/privacy" className="text-blue-600 hover:underline">{chunks}</Link> })}
              </p>
              <p className="mt-2">
                {t.rich('s2.p2', { a: (chunks) => <a href="#dispute-resolution" className="text-blue-600 hover:underline">{chunks}</a> })}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s3.title')}</h2>
              <p>{t('s3.intro')}</p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4', 'item5'] as const).map((key) => (
                  <li key={key}>{t(`s3.list.${key}`)}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s4.title')}</h2>
              <h3 className="font-medium text-gray-900 mt-4 mb-2">{t('s4.workersTitle')}</h3>
              <ul className="space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4', 'item5'] as const).map((key) => (
                  <li key={key}>{t(`s4.workersList.${key}`)}</li>
                ))}
              </ul>

              <h3 className="font-medium text-gray-900 mt-4 mb-2">{t('s4.employersTitle')}</h3>
              <ul className="space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4', 'item5'] as const).map((key) => (
                  <li key={key}>{t(`s4.employersList.${key}`)}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s5.title')}</h2>
              <p>
                {t('s5.p1')}
              </p>
              <p className="mt-2">
                {t('s5.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s6.title')}</h2>
              <p>{t('s6.intro')}</p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8'] as const).map((key) => (
                  <li key={key}>{t(`s6.list.${key}`)}</li>
                ))}
              </ul>
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
                {t.rich('s8.intro', { a: (chunks) => <Link href="/privacy" className="text-blue-600 hover:underline">{chunks}</Link> })}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>{t('s8.list.item1')}</li>
                <li>{t('s8.list.item2')}</li>
                <li>{t('s8.list.item3')}</li>
                <li>{t('s8.list.item4')}</li>
                <li>
                  {t.rich('s8.list.item5', { a: (chunks) => <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{chunks}</Link> })}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s9.title')}</h2>
              <p>
                {t('s9.p1')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3'] as const).map((key) => (
                  <li key={key}>{t(`s9.list.${key}`)}</li>
                ))}
              </ul>
              <p className="mt-2">
                {t('s9.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s10.title')}</h2>
              <p>
                {t('s10.p1')}
              </p>
              <p className="mt-2">
                {t('s10.p2')}
              </p>
              <p className="mt-2">
                {t('s10.p3')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s11.title')}</h2>
              <p>
                {t('s11.p1pre')}{' '}
                <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('s11.dashboardLink')}</Link>
                {t('s11.p1mid')}{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">{t('s11.privacyLink')}</Link>
                {t('s11.p1post')}
              </p>
              <p className="mt-2">
                {t('s11.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s12.title')}</h2>
              <p>
                {t('s12.p1')}
              </p>
            </section>

            {/* DSA Compliance Sections — Digital Services Act (Regulation EU 2022/2065) */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s13.title')}</h2>
              <p>
                {t.rich('s13.intro', { strong: (chunks) => <strong>{chunks}</strong> })}
              </p>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="font-medium text-blue-900">
                  <Link href="/dsa/report" className="text-blue-600 hover:underline text-lg">
                    {t('s13.reportLink')}
                  </Link>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {t.rich('s13.statusNote', { a: (chunks) => <Link href="/dsa/status" className="text-blue-600 hover:underline">{chunks}</Link> })}
                </p>
              </div>
              <ul className="mt-3 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4'] as const).map((key) => (
                  <li key={key}>{t(`s13.list.${key}`)}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s14.title')}</h2>
              <p>
                {t('s14.intro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4'] as const).map((key) => (
                  <li key={key}>{t.rich(`s14.list.${key}`, { strong: (chunks) => <strong>{chunks}</strong> })}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s15.title')}</h2>
              <p>
                {t('s15.intro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7'] as const).map((key) => (
                  <li key={key}>{t(`s15.list.${key}`)}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s16.title')}</h2>
              <p>
                {t('s16.p1')}
              </p>
              <p className="mt-2">
                {t('s16.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s17.title')}</h2>
              <p>
                {t('s17.intro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4'] as const).map((key) => (
                  <li key={key}>{t(`s17.list.${key}`)}</li>
                ))}
              </ul>
              <p className="mt-2">
                {t('s17.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s18.title')}</h2>
              <p>
                {t('s18.intro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4'] as const).map((key) => (
                  <li key={key}>{t(`s18.list.${key}`)}</li>
                ))}
              </ul>
              <p className="mt-2">
                {t('s18.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s19.title')}</h2>
              <p>
                {t('s19.intro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                {(['item1', 'item2', 'item3', 'item4', 'item5', 'item6'] as const).map((key) => (
                  <li key={key}>{t(`s19.list.${key}`)}</li>
                ))}
              </ul>
              <p className="mt-2">
                {t('s19.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s20.title')}</h2>
              <p>
                {t('s20.intro')}
              </p>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-4">
                <Link href="/dsa/transparency" className="text-blue-600 hover:underline font-medium">
                  {t('s20.transparencyLink')}
                </Link>
              </div>
              <p className="mt-2">
                {t('s20.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s21.title')}</h2>
              <p>
                {t('s21.intro')}
              </p>
              <div className="mt-2 bg-gray-50 rounded-md p-4">
                <p><strong>{t('s21.company')}</strong></p>
                <p>{t('s21.emailLabel')} <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">{t('s21.email')}</a></p>
                <p className="mt-1 text-sm text-gray-500">
                  {t('s21.urgentNote')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s22.title')}</h2>
              <p>
                {t('s22.p1')}
              </p>
              <p className="mt-2">
                {t('s22.p2')}
              </p>
              <p className="mt-2">
                {t('s22.p3')}
              </p>
            </section>

            <section id="dispute-resolution">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s23.title')}</h2>

              <h3 className="font-medium text-gray-900 mt-4 mb-2">{t('s23.governingTitle')}</h3>
              <p>
                {t('s23.governingP')}
              </p>

              <h3 className="font-medium text-gray-900 mt-4 mb-2">{t('s23.consumerTitle')}</h3>
              <p>
                {t('s23.consumerIntro')}
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>
                  {t.rich('s23.consumerList.item1', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                    a: (chunks) => <a href="https://www.degeschillencommissie.nl/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{chunks}</a>,
                  })}
                </li>
                <li>
                  {t.rich('s23.consumerList.item2', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                    a: (chunks) => <a href="https://ec.europa.eu/consumers/odr" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{chunks}</a>,
                  })}
                </li>
                <li>
                  {t.rich('s23.consumerList.item3', { strong: (chunks) => <strong>{chunks}</strong> })}
                </li>
              </ul>

              <h3 className="font-medium text-gray-900 mt-4 mb-2">{t('s23.businessTitle')}</h3>
              <p>
                {t('s23.businessP')}
              </p>

              <h3 className="font-medium text-gray-900 mt-4 mb-2">{t('s23.internalTitle')}</h3>
              <p>
                {t.rich('s23.internalP', { a: (chunks) => <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">{chunks}</a> })}
              </p>

              <h3 className="font-medium text-gray-900 mt-4 mb-2">{t('s23.limitationTitle')}</h3>
              <p>
                {t('s23.limitationP')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('s24.title')}</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p><strong>{t('s24.company')}</strong></p>
                <p>{t('s24.address')}</p>
                <p>{t('s24.kvk')}</p>
                <p>{t('s24.emailLabel')} <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">{t('s24.email')}</a></p>
              </div>
            </section>
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              {t('footer.copyright', { year: new Date().getFullYear() })}{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">{t('footer.privacyLink')}</Link> ·{' '}
              <Link href="/terms" className="text-blue-600 hover:underline">{t('footer.termsLink')}</Link> ·{' '}
              <Link href="/cookies" className="text-blue-600 hover:underline">{t('footer.cookiesLink')}</Link> ·{' '}
              <Link href="/dsa/report" className="text-blue-600 hover:underline">{t('footer.reportLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}