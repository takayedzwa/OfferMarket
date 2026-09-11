import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en';
import MarketValueCard from '../MarketValueCard';
import { makeMarketValue } from '../test-fixtures';

jest.mock('@/i18n/navigation', () => ({
  Link: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../InsufficientData', () => {
  // Same contract the real component renders, kept simple for assertions.
  return function MockInsufficientData() {
    return <p>Insufficient data</p>;
  };
});

function renderCard(marketValue = makeMarketValue()) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <MarketValueCard marketValue={marketValue} />
    </NextIntlClientProvider>,
  );
}

describe('MarketValueCard — explainable market value', () => {
  it('shows the transparent rubric: score, all five components and their points', () => {
    renderCard();

    expect(screen.getByLabelText('Market value indicator')).toBeInTheDocument();
    expect(screen.getByTestId('market-value-score')).toHaveTextContent('56');
    expect(screen.getByTestId('market-value-experience')).toHaveTextContent('15/25');
    expect(screen.getByTestId('market-value-skills')).toHaveTextContent('20/25');
    expect(screen.getByTestId('market-value-certifications')).toHaveTextContent('15/15');
    // Insufficient demand scores 0 and the breakdown says why, after expanding.
    expect(screen.getByTestId('market-value-demand')).toHaveTextContent('0/20');
    expect(screen.getByTestId('market-value-comparable_offers')).toHaveTextContent('6/15');
  });

  it('explains each component when expanded — no black box', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /How this score is calculated/i }));

    expect(screen.getByText(/worth 15 of 25 points/i)).toBeInTheDocument();
    expect(screen.getByText(/Not enough marketplace data yet/i)).toBeInTheDocument();
    // The honesty note is always part of the explanation.
    expect(screen.getByText(/No hidden model/i)).toBeInTheDocument();
  });

  it('shows the gated salary percentile only when the sample supports it', () => {
    renderCard(
      makeMarketValue({
        salaryPercentile: { available: true, value: { percentile: 37 }, sampleSize: 30 },
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: /How this score is calculated/i }));

    expect(screen.getByText(/37th percentile/)).toBeInTheDocument();
  });

  it('renders the explicit insufficient-data state for the percentile otherwise', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /How this score is calculated/i }));

    expect(screen.getByText('Insufficient data')).toBeInTheDocument();
  });
});