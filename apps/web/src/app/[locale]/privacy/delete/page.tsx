'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';
import DeletionCard from '@/components/privacy/DeletionCard';

export default function DeleteAccountPage() {
  const t = useTranslations('privacy.delete');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/privacy/dashboard" className="text-sm text-blue-600 hover:underline">
            {t('back')}
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        <DeletionCard />

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">{t('alternativesTitle')}</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <strong>{t('restrictTitle')}</strong> {t('restrictBody')}{' '}
                <Link href="/privacy/dashboard" className="text-blue-600 hover:underline">{t('restrictLink')}</Link>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <strong>{t('exportTitle')}</strong> {t('exportBody')}{' '}
                <Link href="/privacy/export" className="text-blue-600 hover:underline">{t('exportLink')}</Link>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">→</span>
              <div>
                <strong>{t('hideTitle')}</strong> {t('hideBody')}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}