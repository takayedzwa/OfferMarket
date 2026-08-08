'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Shared footer with legal links including DSA Art. 12-compliant
 * "easy access" to illegal content reporting.
 */
export default function Footer() {
  const t = useTranslations('nav.footer');
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-white font-semibold text-lg">OfferMarket</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">{t('tagline')}</p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">{t('legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link href="/privacy/dashboard" className="hover:text-white transition-colors">
                  {t('privacyDashboard')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  {t('termsOfService')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  {t('cookiePolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* DSA / Reporting */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">{t('reportComplain')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dsa/report" className="hover:text-white transition-colors font-medium text-red-400">
                  ⚑ {t('reportIllegalContent')}
                </Link>
              </li>
              <li>
                <Link href="/dsa/status" className="hover:text-white transition-colors">
                  {t('checkReportStatus')}
                </Link>
              </li>
              <li>
                <Link href="/dsa/transparency" className="hover:text-white transition-colors">
                  {t('transparencyReport')}
                </Link>
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">{t('dsaNote')}</p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">{t('contact')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@offermarket.nl" className="hover:text-white transition-colors">
                  support@offermarket.nl
                </a>
              </li>
              <li>
                <a href="mailto:legal@offermarket.nl" className="hover:text-white transition-colors">
                  legal@offermarket.nl
                </a>
              </li>
              <li>
                <a href="mailto:dpo@offermarket.nl" className="hover:text-white transition-colors">
                  {t('dataProtectionOfficer')}
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">{t('companyLine')}</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">{t('copyright', { year })}</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">{t('privacy')}</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">{t('terms')}</Link>
            <Link href="/cookies" className="hover:text-gray-300 transition-colors">{t('cookies')}</Link>
            <Link href="/dsa/report" className="hover:text-gray-300 transition-colors text-red-400">{t('reportIllegalContent')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}