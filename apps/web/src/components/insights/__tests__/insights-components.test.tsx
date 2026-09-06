import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en';
import DataClassBadge from '../DataClassBadge';
import InsufficientData from '../InsufficientData';
import MarkdownContent from '../MarkdownContent';
import TransparencyBox from '../TransparencyBox';
import ShareBar from '../ShareBar';

jest.mock('@/lib/api', () => ({
  // ShareBar calls trackEvent on share clicks; never let it hit axios here.
  insightsApi: { trackEvent: jest.fn().mockResolvedValue({}) },
  getInsightsSessionKey: () => 'test-session-key-00000000',
  // useFormat (used by TransparencyBox) re-exports these real formatters.
  formatDate: (date: string | Date) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date)),
  formatCurrency: (amount: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(amount),
}));

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('DataClassBadge', () => {
  it('renders the Offermarket marketplace-data label', () => {
    renderWithIntl(<DataClassBadge dataClass="OFFERMARKT" />);
    expect(screen.getByText('Offermarket marketplace data')).toBeInTheDocument();
  });

  it('renders the editorial label', () => {
    renderWithIntl(<DataClassBadge dataClass="EDITORIAL" />);
    expect(screen.getByText('Editorial analysis')).toBeInTheDocument();
  });
});

describe('InsufficientData', () => {
  it('explains the gate and shows the sample count', () => {
    renderWithIntl(<InsufficientData sampleSize={17} />);
    expect(screen.getByText('Insufficient data')).toBeInTheDocument();
    expect(screen.getByText('17 verified offers so far')).toBeInTheDocument();
  });

  it('omits the sample line when no count is known', () => {
    renderWithIntl(<InsufficientData />);
    expect(screen.getByText('Insufficient data')).toBeInTheDocument();
    expect(screen.queryByText(/verified offers so far/)).not.toBeInTheDocument();
  });
});

describe('MarkdownContent', () => {
  it('renders headings, bold and lists without raw markdown markers', () => {
    renderWithIntl(
      <MarkdownContent
        content={[
          '## Salary outlook',
          'Electricians are **in demand**.',
          '- Check certificates\n- Compare regions',
          'Second paragraph.',
        ].join('\n\n')}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Salary outlook' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });
});

describe('TransparencyBox', () => {
  it('shows sample size, data period and data class for marketplace data', () => {
    renderWithIntl(
      <TransparencyBox
        dataClass="OFFERMARKT"
        sampleSize={247}
        dataPeriodStart="2026-07-01"
        dataPeriodEnd="2026-08-31"
        profession="Electrician"
        methodology="Percentiles of verified offers"
      />,
    );
    expect(screen.getByText('About this data')).toBeInTheDocument();
    expect(screen.getByText(/247 observations/)).toBeInTheDocument();
    expect(screen.getByText('Electrician')).toBeInTheDocument();
    expect(screen.getByText('Offermarket marketplace data')).toBeInTheDocument();
  });

  it('makes no sample claims for editorial analysis', () => {
    renderWithIntl(<TransparencyBox dataClass="EDITORIAL" />);
    expect(screen.getByText('This is editorial analysis — it makes no data claims.')).toBeInTheDocument();
    expect(screen.queryByText(/observations/)).not.toBeInTheDocument();
  });
});

describe('ShareBar', () => {
  it('renders the three share networks', () => {
    renderWithIntl(<ShareBar url="https://offermarket.eu/insights/x" title="T" articleId="a1" />);
    expect(screen.getByText('Share on LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('Share on Facebook')).toBeInTheDocument();
    expect(screen.getByText('Share on WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Copy link')).toBeInTheDocument();
  });
});