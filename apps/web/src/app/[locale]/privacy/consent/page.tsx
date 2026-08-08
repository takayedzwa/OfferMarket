'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Navbar from '@/components/Navbar';
import ConsentCard from '@/components/privacy/DataSummaryCard';

export default function ConsentPage() {
  const t = useTranslations('privacy.consent');

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

        <ConsentCard />

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>{t('noteLabel')}</strong> {t('noteBody')}
          </p>
        </div>
      </div>
    </div>
  );
}