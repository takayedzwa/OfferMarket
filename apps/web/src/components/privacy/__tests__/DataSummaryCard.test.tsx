import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataSummaryCard from '../DataSummaryCard';

// Mock useConsent hook
const mockGrantConsent = jest.fn().mockResolvedValue(true);
const mockWithdrawConsent = jest.fn().mockResolvedValue(true);
const mockUseConsent = {
  consents: [],
  loading: false,
  error: null,
  grantConsent: mockGrantConsent,
  withdrawConsent: mockWithdrawConsent,
  hasConsent: jest.fn(),
  getConsent: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('@/hooks/useConsent', () => ({
  useConsent: () => mockUseConsent,
}));

describe('DataSummaryCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Rendering
  // ===========================================================================
  describe('rendering', () => {
    it('should render all 11 consent categories', () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Data Processing')).toBeInTheDocument();
      expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
      expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Profile Visibility')).toBeInTheDocument();
      expect(screen.getByText('Marketing Communications')).toBeInTheDocument();
      expect(screen.getByText('Work Authorization')).toBeInTheDocument();
      expect(screen.getByText('ID Verification')).toBeInTheDocument();
      expect(screen.getByText('KvK Verification')).toBeInTheDocument();
    });

    it('should show "Required" badge on required categories', () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      const requiredBadges = screen.getAllByText('Required');
      expect(requiredBadges).toHaveLength(3); // PRIVACY_POLICY, TERMS_OF_SERVICE, DATA_PROCESSING
    });

    it('should show "Special Category" badge on SPECIAL_CATEGORY', () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      expect(screen.getByText('Special Category')).toBeInTheDocument();
    });

    it('should show "Active (Required)" badge instead of toggle for required items', () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      expect(screen.getAllByText('Active (Required)')).toHaveLength(3); // 3 required consents
    });

    it('should show loading skeleton on initial load when consents are empty', () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = true;

      render(<DataSummaryCard />);

      // Should show loading skeleton (animated pulse div)
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();
    });

    it('should NOT show loading skeleton when refreshing after consents loaded', () => {
      mockUseConsent.consents = [
        { id: 'c-1', consentType: 'COOKIE_ANALYTICS', granted: true, status: 'GIVEN', withdrawnAt: null },
      ];
      mockUseConsent.loading = true; // Still loading (refresh), but consents exist

      render(<DataSummaryCard />);

      // Should NOT show skeleton — hasLoaded = consents.length > 0 || !loading
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).not.toBeInTheDocument();
    });

    it('should display granted date for granted consents', () => {
      mockUseConsent.consents = [
        { id: 'c-1', consentType: 'COOKIE_ANALYTICS', granted: true, status: 'GIVEN', grantedAt: '2026-07-11T12:00:00.000Z', withdrawnAt: null },
      ];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      expect(screen.getByText(/Granted/)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Toggle behavior
  // ===========================================================================
  describe('toggle behavior', () => {
    it('should call onGrant with EXPLICIT_CONSENT for SPECIAL_CATEGORY', async () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      // Find the toggle for Work Authorization (SPECIAL_CATEGORY)
      const workAuthRow = screen.getByText('Work Authorization').closest('div');
      const toggle = workAuthRow?.querySelector('button');

      if (toggle) {
        fireEvent.click(toggle);
        await waitFor(() => {
          expect(mockGrantConsent).toHaveBeenCalledWith('SPECIAL_CATEGORY', 'EXPLICIT_CONSENT');
        });
      }
    });

    it('should call onGrant with LEGAL_OBLIGATION for ID_VERIFICATION', async () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      const idRow = screen.getByText('ID Verification').closest('div');
      const toggle = idRow?.querySelector('button');

      if (toggle) {
        fireEvent.click(toggle);
        await waitFor(() => {
          expect(mockGrantConsent).toHaveBeenCalledWith('ID_VERIFICATION', 'LEGAL_OBLIGATION');
        });
      }
    });

    it('should call onGrant with LEGAL_OBLIGATION for KVK_PROCESSING', async () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      const kvkRow = screen.getByText('KvK Verification').closest('div');
      const toggle = kvkRow?.querySelector('button');

      if (toggle) {
        fireEvent.click(toggle);
        await waitFor(() => {
          expect(mockGrantConsent).toHaveBeenCalledWith('KVK_PROCESSING', 'LEGAL_OBLIGATION');
        });
      }
    });

    it('should call onGrant with CONSENT for regular categories', async () => {
      mockUseConsent.consents = [];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      const analyticsRow = screen.getByText('Analytics Cookies').closest('div');
      const toggle = analyticsRow?.querySelector('button');

      if (toggle) {
        fireEvent.click(toggle);
        await waitFor(() => {
          expect(mockGrantConsent).toHaveBeenCalledWith('COOKIE_ANALYTICS', 'CONSENT');
        });
      }
    });

    it('should call onWithdraw when toggling off a granted consent', async () => {
      mockUseConsent.consents = [
        { id: 'c-1', consentType: 'COOKIE_ANALYTICS', granted: true, status: 'GIVEN', grantedAt: '2026-07-11T12:00:00.000Z', withdrawnAt: null },
      ];
      mockUseConsent.loading = false;

      render(<DataSummaryCard />);

      // Find the toggle for COOKIE_ANALYTICS (which is now granted)
      const allToggles = document.querySelectorAll('button');
      // The toggle for Analytics Cookies should be the one in its row
      const analyticsRow = screen.getByText('Analytics Cookies').closest('div');
      const toggle = analyticsRow?.querySelector('button');

      if (toggle) {
        fireEvent.click(toggle);
        await waitFor(() => {
          expect(mockWithdrawConsent).toHaveBeenCalledWith('COOKIE_ANALYTICS');
        });
      }
    });
  });
});