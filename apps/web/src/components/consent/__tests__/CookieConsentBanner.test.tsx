import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CookieConsentBanner from '../CookieConsentBanner';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockReset();
  });

  // ===========================================================================
  // Banner Visibility
  // ===========================================================================
  describe('banner visibility', () => {
    it('should show banner when no stored consent', () => {
      render(<CookieConsentBanner />);
      expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
    });

    it('should hide banner when valid consent already stored', () => {
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));

      render(<CookieConsentBanner />);

      expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
    });

    it('should show banner when stored version mismatches', () => {
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '0.9',
        consent: { functional: true, analytics: false, marketing: false },
        timestamp: '2026-01-01T00:00:00.000Z',
      }));

      render(<CookieConsentBanner />);

      expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
    });

    it('should show banner when stored data is invalid JSON', () => {
      localStorageMock.setItem('offermarket_cookie_consent', 'not-json');

      render(<CookieConsentBanner />);

      expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Consent Actions
  // ===========================================================================
  describe('consent actions', () => {
    it('should save all categories on "Accept All"', () => {
      render(<CookieConsentBanner />);

      fireEvent.click(screen.getByText('Accept All'));

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls.find(
        (call: any[]) => call[0] === 'offermarket_cookie_consent'
      )![1] as string);
      expect(savedData.consent.functional).toBe(true);
      expect(savedData.consent.analytics).toBe(true);
      expect(savedData.consent.marketing).toBe(true);
      expect(savedData.version).toBe('1.0');
    });

    it('should save only functional on "Reject Optional"', () => {
      render(<CookieConsentBanner />);

      fireEvent.click(screen.getByText('Reject Optional'));

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls.find(
        (call: any[]) => call[0] === 'offermarket_cookie_consent'
      )![1] as string);
      expect(savedData.consent.functional).toBe(true);
      expect(savedData.consent.analytics).toBe(false);
      expect(savedData.consent.marketing).toBe(false);
    });

    it('should save custom preferences via "Save Preferences"', () => {
      render(<CookieConsentBanner />);

      // Open details view
      fireEvent.click(screen.getByText('Customize'));

      // Check the analytics checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      // checkboxes[0] = functional (disabled), checkboxes[1] = analytics, checkboxes[2] = marketing
      fireEvent.click(checkboxes[1]); // Enable analytics

      fireEvent.click(screen.getByText('Save Preferences'));

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls.find(
        (call: any[]) => call[0] === 'offermarket_cookie_consent'
      )![1] as string);
      expect(savedData.consent.functional).toBe(true);
      expect(savedData.consent.analytics).toBe(true);
      expect(savedData.consent.marketing).toBe(false);
    });

    it('should hide banner after saving consent', () => {
      render(<CookieConsentBanner />);

      expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText('Accept All'));

      expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // API Sync
  // ===========================================================================
  describe('API sync', () => {
    it('should sync analytics consent to API when logged in', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Accept All'));

      await waitFor(() => {
        // Should POST for COOKIE_ANALYTICS
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/consents`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('COOKIE_ANALYTICS'),
          }),
        );
      });
    });

    it('should sync marketing consent to API when logged in', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Accept All'));

      await waitFor(() => {
        // Should POST for COOKIE_MARKETING
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/consents`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('COOKIE_MARKETING'),
          }),
        );
      });
    });

    it('should NOT sync to API when not logged in', () => {
      // No accessToken in localStorage
      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Accept All'));

      // Should still save to localStorage but NOT call API
      const savedCall = localStorageMock.setItem.mock.calls.find(
        (call: any[]) => call[0] === 'offermarket_cookie_consent'
      );
      expect(savedCall).toBeDefined();
      // No fetch calls for consent syncing (only fetches from initial load if any)
      const consentCalls = mockFetch.mock.calls.filter(
        (call: any[]) => call[0]?.includes('/privacy/consents')
      );
      expect(consentCalls).toHaveLength(0);
    });

    it('should not crash when API sync fails', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Accept All'));

      // Should not throw — consent still saved locally
      const savedCall = localStorageMock.setItem.mock.calls.find(
        (call: any[]) => call[0] === 'offermarket_cookie_consent'
      );
      expect(savedCall).toBeDefined();
    });
  });

  // ===========================================================================
  // Details View
  // ===========================================================================
  describe('details view', () => {
    it('should show customization options when "Customize" clicked', () => {
      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Customize'));

      expect(screen.getByText('Cookie Preferences')).toBeInTheDocument();
      expect(screen.getByText('Functional Cookies')).toBeInTheDocument();
      expect(screen.getByText('Analytics Cookies')).toBeInTheDocument();
      expect(screen.getByText('Marketing Cookies')).toBeInTheDocument();
    });

    it('should have functional cookies checkbox disabled and checked', () => {
      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Customize'));

      const functionalCheckbox = screen.getAllByRole('checkbox')[0];
      expect(functionalCheckbox).toBeDisabled();
      expect(functionalCheckbox).toBeChecked();
    });
  });
});