'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';
import DataExportCard from '@/components/privacy/DataExportCard';

export default function DataExportPage() {
  const t = useTranslations('privacy.export');

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

        <DataExportCard />

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">{t('includedTitle')}</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            <li>{t('item1')}</li>
            <li>{t('item2')}</li>
            <li>{t('item3')}</li>
            <li>{t('item4')}</li>
            <li>{t('item5')}</li>
            <li>{t('item6')}</li>
            <li>{t('item7')}</li>
            <li>{t('item8')}</li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            {t('footnote')}
          </p>
        </div>
      </div>
    </div>
  );
}