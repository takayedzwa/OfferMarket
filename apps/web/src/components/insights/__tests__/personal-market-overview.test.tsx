import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en';
import PersonalMarketOverview from '../PersonalMarketOverview';
import type { WorkerMarketOverview } from '@/lib/api';

jest.mock('@/i18n/navigation', () => ({
  Link: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() }),
}));

const gated = <T,>(value: T) => ({ available: true, value });

function makeOverview(overrides: Partial<WorkerMarketOverview> = {}): WorkerMarketOverview {
  return {
    profile: {
      profession: 'Electrician',
      regionName: 'Rotterdam',
      regionId: 'r1',
      yearsOfExperience: 5,
      skills: [],
      certifications: [],
    },
    scopeUsed: 'city',
    scopeNote: null,
    demand: gated({ level: 'VERY_HIGH', offers: 120 }),
    salaryRange: gated({ p25: 44000, p75: 60000, currency: 'EUR' }),
    salaryTrend: gated({ changePct: 4.2, direction: 'up' }),
    mostValuableSkills: gated([{ skill: 'Solar installation', premiumPct: 8.5 }]),
    relevantEmployers: gated({ count: 12 }),
    relevantOffers: gated({ count: 30 }),
    recentChanges: [],
    ...overrides,
  };
}

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe('PersonalMarketOverview', () => {
  it('renders demand, salary range and trend when the sample supports them', () => {
    renderWithIntl(<PersonalMarketOverview overview={makeOverview()} />);
    expect(screen.getByText('Your Market')).toBeInTheDocument();
    expect(screen.getByText('Very high')).toBeInTheDocument();
    expect(screen.getByText(/44,000/)).toBeInTheDocument();
    expect(screen.getByText('Solar installation +8.5%')).toBeInTheDocument();
  });

  it('never shows a number the sample cannot support — renders the insufficient state instead', () => {
    const overview = makeOverview({
      salaryRange: { available: false, reason: 'INSUFFICIENT_DATA', sampleSize: 17 },
      salaryTrend: { available: false, reason: 'INSUFFICIENT_DATA', sampleSize: 17 },
    });
    renderWithIntl(<PersonalMarketOverview overview={overview} />);
    // The gated stats show the honest empty state, not a salary figure.
    expect(screen.getAllByText('Insufficient data')).toHaveLength(2);
    expect(screen.getAllByText(/17 verified offers so far/)).toHaveLength(2);
    expect(screen.queryByText(/44,000/)).not.toBeInTheDocument();
  });

  it('prompts a worker without a profession to complete their profile', () => {
    renderWithIntl(
      <PersonalMarketOverview
        overview={makeOverview({
          profile: {
            profession: null,
            regionName: null,
            regionId: null,
            yearsOfExperience: null,
            skills: [],
            certifications: [],
          },
        })}
      />,
    );
    expect(screen.getByText(/Complete your profile/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Set up your profile' })).toHaveAttribute('href', '/profile');
  });
});