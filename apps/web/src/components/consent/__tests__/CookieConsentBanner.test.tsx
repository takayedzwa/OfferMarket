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

    it('should sync to anonymous endpoint when not logged in (Telecommunicatiewet audit trail)', async () => {
      // No accessToken in localStorage — should use anonymous endpoint
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Accept All'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/consents/anonymous`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('COOKIE_ANALYTICS'),
          }),
        );
      });

      // Should NOT include Authorization header
      const analyticsCall = mockFetch.mock.calls.find(
        (call: any[]) => call[0] === `${API_BASE}/privacy/consents/anonymous`
      );
      expect(analyticsCall![1]!.headers).not.toHaveProperty('Authorization');
    });

    it('should use authenticated endpoint when logged in', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Accept All'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/consents`,
          expect.objectContaining({
            method: 'POST',
          }),
        );
      });

      // Should include Authorization header
      const authCall = mockFetch.mock.calls.find(
        (call: any[]) => call[0] === `${API_BASE}/privacy/consents`
      );
      expect(authCall![1]!.headers).toMatchObject({
        Authorization: 'Bearer test-token',
      });
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

  // ===========================================================================
  // 13-Month Consent Expiry (Telecommunicatiewet Art. 11.7a)
  // ===========================================================================
  describe('13-month consent expiry', () => {
    it('should re-show banner when stored consent is older than 13 months', () => {
      // Set consent timestamp to 14 months ago
      const fourteenMonthsAgo = new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: fourteenMonthsAgo,
      }));

      render(<CookieConsentBanner />);

      // Banner should re-appear because consent expired
      expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
    });

    it('should NOT re-show banner when consent is within 13 months', () => {
      // Set consent timestamp to 6 months ago (well within 13 months)
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: sixMonthsAgo,
      }));

      render(<CookieConsentBanner />);

      // Banner should NOT appear — consent is still valid
      expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Cookie Settings Re-access (consent:show event)
  // ===========================================================================
  describe('consent:show event', () => {
    it('should re-show banner when consent:show event is dispatched', () => {
      // First, store valid consent so banner is hidden
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));

      render(<CookieConsentBanner />);

      // Banner should be hidden initially
      expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();

      // Dispatch the consent:show event (as CookieSettingsButton would)
      fireEvent(window, new CustomEvent('consent:show'));

      // Banner should now be visible
      expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Compliance Note
  // ===========================================================================
  describe('compliance note', () => {
    it('should display a note about changing preferences via Cookie Settings', () => {
      render(<CookieConsentBanner />);
      expect(screen.getByText(/You can change your preferences at any time via Cookie Settings/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Equal Prominence (Telecommunicatiewet)
  // ===========================================================================
  describe('equal prominence buttons', () => {
    it('should render "Reject Optional" button with equal visual weight to "Accept All"', () => {
      render(<CookieConsentBanner />);
      const rejectButton = screen.getByText('Reject Optional');
      // The "Reject Optional" button should have font-semibold class for equal prominence
      expect(rejectButton.className).toContain('font-semibold');
    });

    it('should render "Reject Optional" with border-gray-900 for equal visual weight', () => {
      render(<CookieConsentBanner />);
      const rejectButton = screen.getByText('Reject Optional');
      expect(rejectButton.className).toContain('border-gray-900');
    });

    it('should render "Reject Optional" with text-gray-900 for readability', () => {
      render(<CookieConsentBanner />);
      const rejectButton = screen.getByText('Reject Optional');
      expect(rejectButton.className).toContain('text-gray-900');
    });

    it('should render both "Accept All" and "Reject Optional" in summary view', () => {
      render(<CookieConsentBanner />);
      expect(screen.getByText('Accept All')).toBeInTheDocument();
      expect(screen.getByText('Reject Optional')).toBeInTheDocument();
    });

    it('should render both buttons in details view too', () => {
      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Customize'));

      // In details view, both buttons should still be present
      const acceptAllButtons = screen.getAllByText('Accept All');
      const rejectButtons = screen.getAllByText('Reject Optional');
      expect(acceptAllButtons.length).toBeGreaterThanOrEqual(1);
      expect(rejectButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // consent:change event on save — PostHogProvider listens for this
  // ===========================================================================
  describe('consent:change event on save', () => {
    it('should dispatch consent:change with analytics:true when analytics consent is granted', () => {
      const handler = jest.fn();
      window.addEventListener('consent:change', handler);

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Accept All'));

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(expect.objectContaining({ analytics: true }));

      window.removeEventListener('consent:change', handler);
    });

    it('should dispatch consent:change with analytics:false when analytics consent is rejected', () => {
      const handler = jest.fn();
      window.addEventListener('consent:change', handler);

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Reject Optional'));

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0] as CustomEvent;
      // Reject Optional rejects analytics, so the event must carry analytics:false
      expect(event.detail).toEqual(expect.objectContaining({ analytics: false }));

      window.removeEventListener('consent:change', handler);
    });

    it('should not crash when no consent:change listener is registered', () => {
      render(<CookieConsentBanner />);
      // No listener — dispatching the event must still be safe
      expect(() => fireEvent.click(screen.getByText('Accept All'))).not.toThrow();
    });

    it('should dispatch consent:change with analytics:false when customizing with analytics unchecked', () => {
      const handler = jest.fn();
      window.addEventListener('consent:change', handler);

      render(<CookieConsentBanner />);
      fireEvent.click(screen.getByText('Customize'));
      // Analytics is unchecked by default in customize view, so saving without
      // it should dispatch analytics:false
      fireEvent.click(screen.getByText('Save Preferences'));

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(expect.objectContaining({ analytics: false }));

      window.removeEventListener('consent:change', handler);
    });
  });

  // ===========================================================================
  // 13-Month Expiry — localStorage Cleanup
  // ===========================================================================
  describe('13-month expiry localStorage cleanup', () => {
    it('should remove expired consent from localStorage when it is older than 13 months', () => {
      // Set consent timestamp to 14 months ago
      const fourteenMonthsAgo = new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: fourteenMonthsAgo,
      }));

      render(<CookieConsentBanner />);

      // Should have called removeItem to clear expired consent
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('offermarket_cookie_consent');
    });

    it('should NOT remove consent from localStorage when within 13 months', () => {
      // Set consent timestamp to 6 months ago (well within 13 months)
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: sixMonthsAgo,
      }));

      render(<CookieConsentBanner />);

      // Should NOT have called removeItem — consent is still valid
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('offermarket_cookie_consent');
    });
  });

  // ===========================================================================
  // Initial Mount — syncConsentToApi
  // ===========================================================================
  describe('initial mount sync', () => {
    it('should sync existing consent to API on mount when logged in', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        // Should have synced analytics consent to the authenticated endpoint
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/consents`,
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('COOKIE_ANALYTICS'),
          }),
        );
      });
    });

    it('should sync existing consent to anonymous endpoint on mount when not logged in', async () => {
      // No accessToken — should use anonymous endpoint
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<CookieConsentBanner />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/consents/anonymous`,
          expect.objectContaining({
            method: 'POST',
          }),
        );
      });
    });
  });

  // ===========================================================================
  // consent:show — re-reads stored preferences
  // ===========================================================================
  describe('consent:show event re-reads preferences', () => {
    it('should populate checkboxes with previously stored consent values', () => {
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: true },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));

      render(<CookieConsentBanner />);

      // Banner is hidden because valid consent exists
      expect(screen.queryByText(/We value your privacy/i)).not.toBeInTheDocument();

      // Dispatch consent:show to re-open the banner
      fireEvent(window, new CustomEvent('consent:show'));

      // Banner should be visible now
      expect(screen.getByText(/We value your privacy/i)).toBeInTheDocument();

      // Open details to see checkboxes
      fireEvent.click(screen.getByText('Customize'));

      const checkboxes = screen.getAllByRole('checkbox');
      // Analytics and marketing should reflect previously stored values
      expect(checkboxes[1]).toBeChecked(); // analytics was true
      expect(checkboxes[2]).toBeChecked(); // marketing was true
    });
  });

  // ===========================================================================
  // Anonymous Endpoint — No Sync for Rejected Categories
  // ===========================================================================
  describe('anonymous endpoint — no sync for rejected categories', () => {
    it('should NOT call API for analytics when analytics is rejected', async () => {
      // No accessToken — uses anonymous endpoint
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

      render(<CookieConsentBanner />);
      // "Reject Optional" means analytics=false, marketing=false
      fireEvent.click(screen.getByText('Reject Optional'));

      // Give the async function time to run
      await waitFor(() => {
        // Should not have called fetch at all — nothing to sync for rejected categories
        const analyticsCalls = mockFetch.mock.calls.filter(
          (call: any[]) => call[0]?.includes('COOKIE_ANALYTICS')
        );
        expect(analyticsCalls).toHaveLength(0);

        const marketingCalls = mockFetch.mock.calls.filter(
          (call: any[]) => call[0]?.includes('COOKIE_MARKETING')
        );
        expect(marketingCalls).toHaveLength(0);
      });
    });
  });
});