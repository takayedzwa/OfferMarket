import { renderHook, act, waitFor } from '@testing-library/react';
import { useConsent, useCookieConsent } from '../useConsent';

// Mock fetch globally
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

describe('useConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockFetch.mockReset();
  });

  // ===========================================================================
  // fetchConsents
  // ===========================================================================
  describe('fetchConsents', () => {
    it('should fetch consents on mount with auth header', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      const mockConsents = [
        { id: 'c-1', consentType: 'COOKIE_ANALYTICS', granted: true, status: 'GIVEN', withdrawnAt: null },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConsents,
      });

      const { result } = renderHook(() => useConsent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE}/privacy/consents`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
      expect(result.current.consents).toEqual(mockConsents);
    });

    it('should handle non-array response gracefully (fallback to empty array)', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      // Simulate API returning a grouped object (the bug we fixed)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ COOKIE_ANALYTICS: [{ id: 'c-1' }] }),
      });

      const { result } = renderHook(() => useConsent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should fall back to empty array, not crash with .find()
      expect(Array.isArray(result.current.consents)).toBe(true);
      expect(result.current.consents).toEqual([]);
    });

    it('should set consents to empty array when no auth token', async () => {
      // No token in localStorage
      const { result } = renderHook(() => useConsent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.consents).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should set error state on fetch failure', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useConsent());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  // ===========================================================================
  // grantConsent
  // ===========================================================================
  describe('grantConsent', () => {
    it('should POST to /privacy/consents with correct body', async () => {
      localStorageMock.setItem('accessToken', 'test-token');

      // First call: fetchConsents on mount
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useConsent());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Second call: grantConsent POST
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'c-new', granted: true }),
      });
      // Third call: refresh after grant
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'c-new', consentType: 'COOKIE_ANALYTICS', granted: true }],
      });

      let grantResult: boolean | undefined;
      await act(async () => {
        grantResult = await result.current.grantConsent('COOKIE_ANALYTICS', 'CONSENT');
      });

      expect(mockFetch).toHaveBeenNthCalledWith(2, `${API_BASE}/privacy/consents`, expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          consentType: 'COOKIE_ANALYTICS',
          legalBasis: 'CONSENT',
          version: '1.0',
          granted: true,
        }),
      }));
      expect(grantResult).toBe(true);
    });

    it('should default legalBasis to CONSENT', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'c-1' }) });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      const { result } = renderHook(() => useConsent());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.grantConsent('MARKETING');
      });

      const postCall = mockFetch.mock.calls.find(
        (call: any[]) => call[1]?.method === 'POST'
      );
      const body = JSON.parse(postCall![1].body);
      expect(body.legalBasis).toBe('CONSENT');
    });

    it('should return false on error', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });

      const { result } = renderHook(() => useConsent());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let grantResult: boolean | undefined;
      await act(async () => {
        grantResult = await result.current.grantConsent('MARKETING');
      });

      expect(grantResult).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  // ===========================================================================
  // withdrawConsent
  // ===========================================================================
  describe('withdrawConsent', () => {
    it('should DELETE to /privacy/consents/:consentType', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      const { result } = renderHook(() => useConsent());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let withdrawResult: boolean | undefined;
      await act(async () => {
        withdrawResult = await result.current.withdrawConsent('COOKIE_ANALYTICS');
      });

      expect(mockFetch).toHaveBeenNthCalledWith(2, `${API_BASE}/privacy/consents/COOKIE_ANALYTICS`, expect.objectContaining({
        method: 'DELETE',
      }));
      expect(withdrawResult).toBe(true);
    });

    it('should return false on error', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

      const { result } = renderHook(() => useConsent());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let withdrawResult: boolean | undefined;
      await act(async () => {
        withdrawResult = await result.current.withdrawConsent('COOKIE_ANALYTICS');
      });

      expect(withdrawResult).toBe(false);
    });
  });

  // ===========================================================================
  // hasConsent
  // ===========================================================================
  describe('hasConsent', () => {
    it('should return true when active consent exists', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'c-1', consentType: 'COOKIE_ANALYTICS', granted: true, status: 'GIVEN', withdrawnAt: null },
        ],
      });

      const { result } = renderHook(() => useConsent());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasConsent('COOKIE_ANALYTICS')).toBe(true);
    });

    it('should return false when consent is withdrawn', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'c-1', consentType: 'COOKIE_ANALYTICS', granted: false, status: 'WITHDRAWN', withdrawnAt: '2026-07-11T12:00:00.000Z' },
        ],
      });

      const { result } = renderHook(() => useConsent());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasConsent('COOKIE_ANALYTICS')).toBe(false);
    });

    it('should return false when consent type not found', async () => {
      localStorageMock.setItem('accessToken', 'test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'c-1', consentType: 'MARKETING', granted: true, status: 'GIVEN', withdrawnAt: null },
        ],
      });

      const { result } = renderHook(() => useConsent());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.hasConsent('COOKIE_ANALYTICS')).toBe(false);
    });
  });
});

describe('useCookieConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('should read consent from localStorage on mount', async () => {
    localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
      consent: { functional: true, analytics: true, marketing: false },
      version: '1.0',
      timestamp: '2026-07-11T12:00:00.000Z',
    }));

    const { result } = renderHook(() => useCookieConsent());

    await waitFor(() => {
      expect(result.current.hasGivenConsent).toBe(true);
      expect(result.current.hasAnalyticsConsent).toBe(true);
      expect(result.current.hasMarketingConsent).toBe(false);
    });
  });

  it('should save cookie consent to localStorage', async () => {
    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {
      result.current.saveCookieConsent(true, false);
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'offermarket_cookie_consent',
      expect.any(String),
    );
    const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(savedData.consent.functional).toBe(true);
    expect(savedData.consent.analytics).toBe(true);
    expect(savedData.consent.marketing).toBe(false);
  });

  it('should not crash on invalid stored JSON', async () => {
    localStorageMock.setItem('offermarket_cookie_consent', 'not-json');

    const { result } = renderHook(() => useCookieConsent());

    // Should not throw, hasGivenConsent should be false
    expect(result.current.hasGivenConsent).toBe(false);
  });

  it('should have hasGivenConsent as true after saving', async () => {
    const { result } = renderHook(() => useCookieConsent());

    await act(async () => {
      result.current.saveCookieConsent(false, false);
    });

    expect(result.current.hasGivenConsent).toBe(true);
  });

  // ===========================================================================
  // 13-Month Consent Expiry (Telecommunicatiewet Art. 11.7a)
  // ===========================================================================
  describe('13-month consent expiry', () => {
    it('should clear localStorage when stored consent is older than 13 months', async () => {
      // Set consent timestamp to 14 months ago (> 13-month Telecommunicatiewet max)
      const fourteenMonthsAgo = new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        consent: { functional: true, analytics: true, marketing: false },
        version: '1.0',
        timestamp: fourteenMonthsAgo,
      }));

      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        // Should have called removeItem to clear expired consent
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('offermarket_cookie_consent');
      });

      // hasGivenConsent should be false because expired consent was cleared
      expect(result.current.hasGivenConsent).toBe(false);
    });

    it('should keep consent when stored consent is within 13 months', async () => {
      // Set consent timestamp to 6 months ago (well within 13 months)
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        consent: { functional: true, analytics: true, marketing: false },
        version: '1.0',
        timestamp: sixMonthsAgo,
      }));

      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        // Should NOT have called removeItem — consent is still valid
        expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('offermarket_cookie_consent');
      });

      // hasGivenConsent should be true
      expect(result.current.hasGivenConsent).toBe(true);
      expect(result.current.hasAnalyticsConsent).toBe(true);
    });

    it('should clear consent exactly at the 13-month boundary', async () => {
      // Set consent timestamp to 14 months ago (past the 13-month max)
      const fourteenMonthsAgo = new Date(Date.now() - 14 * 30 * 24 * 60 * 60 * 1000).toISOString();
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        consent: { functional: true, analytics: true, marketing: true },
        version: '1.0',
        timestamp: fourteenMonthsAgo,
      }));

      const { result } = renderHook(() => useCookieConsent());

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('offermarket_cookie_consent');
      });

      // All consent should be cleared
      expect(result.current.hasAnalyticsConsent).toBe(false);
      expect(result.current.hasMarketingConsent).toBe(false);
    });
  });

  // ===========================================================================
  // saveCookieConsent structure
  // ===========================================================================
  describe('saveCookieConsent', () => {
    it('should store consent with version and timestamp', async () => {
      const { result } = renderHook(() => useCookieConsent());

      await act(async () => {
        result.current.saveCookieConsent(true, false);
      });

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData.version).toBe('1.0');
      expect(savedData.consent.functional).toBe(true);
      expect(savedData.consent.analytics).toBe(true);
      expect(savedData.consent.marketing).toBe(false);
      // Timestamp should be a valid ISO date
      expect(savedData.consent.timestamp).toBeTruthy();
      expect(new Date(savedData.consent.timestamp).toISOString()).toBe(savedData.consent.timestamp);
    });
  });
});