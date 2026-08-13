import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostHogProvider from '../PostHogProvider';

// Mock posthog-js — the provider dynamically imports it. The provider uses
// `init`, `capture`, and `shutdown` (NOT opt_in_capturing/capture_pageview):
// it is fully consent-gated and initialises directly once consent is granted.
const mockInit = jest.fn();
const mockCapture = jest.fn();
const mockShutdown = jest.fn();

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: mockInit,
    capture: mockCapture,
    shutdown: mockShutdown,
  },
}));

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

function grantAnalyticsConsent() {
  localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
    version: '1.0',
    consent: { functional: true, analytics: true, marketing: false },
    timestamp: '2026-07-11T12:00:00.000Z',
  }));
}

describe('PostHogProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  // ===========================================================================
  // Initialization — consent gating per Telecommunicatiewet Art. 11.7a
  // ===========================================================================
  describe('consent-gated initialization', () => {
    it('should NOT initialize PostHog when NEXT_PUBLIC_POSTHOG_KEY is not set', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('should NOT initialize PostHog when analytics consent has not been granted', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      // No consent in localStorage.

      render(<PostHogProvider>children</PostHogProvider>);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockInit).not.toHaveBeenCalled();
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it('should initialize PostHog with opt_out_capturing_by_default: false once consent is granted', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          'phk_test_key',
          expect.objectContaining({
            opt_out_capturing_by_default: false,
          }),
        );
      });
    });

    it('should enable pageview capture and session recording once consent is granted', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          'phk_test_key',
          expect.objectContaining({
            capture_pageview: true,
            disable_session_recording: false,
          }),
        );
      });
    });

    it('should use eu.posthog.com as default API host', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          'phk_test_key',
          expect.objectContaining({
            api_host: 'https://eu.posthog.com',
          }),
        );
      });
    });

    it('should use NEXT_PUBLIC_POSTHOG_HOST when set', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      process.env.NEXT_PUBLIC_POSTHOG_HOST = 'https://custom.posthog.com';
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          'phk_test_key',
          expect.objectContaining({
            api_host: 'https://custom.posthog.com',
          }),
        );
      });
    });

    it('should capture the initial $pageview after init', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockCapture).toHaveBeenCalledWith('$pageview');
      });
    });
  });

  // ===========================================================================
  // Analytics consent from localStorage on mount
  // ===========================================================================
  describe('existing analytics consent', () => {
    it('should initialize PostHog when analytics consent was previously granted', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalled();
        expect(mockCapture).toHaveBeenCalledWith('$pageview');
      });
    });

    it('should NOT initialize when analytics consent is not granted', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: false, marketing: false },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));

      render(<PostHogProvider>children</PostHogProvider>);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('should NOT initialize when localStorage has no consent data', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      // localStorageMock is empty

      render(<PostHogProvider>children</PostHogProvider>);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('should NOT crash when localStorage has invalid JSON consent data', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      localStorageMock.setItem('offermarket_cookie_consent', 'not-json');

      render(<PostHogProvider>children</PostHogProvider>);

      // Should not throw, should not initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockInit).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // consent:change event — live opt-in / opt-out
  // ===========================================================================
  describe('consent:change event', () => {
    it('should initialize PostHog when a consent:change event grants analytics', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      // No consent on mount — provider must NOT init yet.
      render(<PostHogProvider>children</PostHogProvider>);

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockInit).not.toHaveBeenCalled();

      // CookieConsentBanner dispatches this event on save.
      act(() => {
        window.dispatchEvent(new CustomEvent('consent:change', {
          detail: { analytics: true, marketing: false },
        }));
      });

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalled();
        expect(mockCapture).toHaveBeenCalledWith('$pageview');
      });
    });

    it('should shut down PostHog when a consent:change event withdraws analytics', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      grantAnalyticsConsent();

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalled();
      });

      act(() => {
        window.dispatchEvent(new CustomEvent('consent:change', {
          detail: { analytics: false, marketing: false },
        }));
      });

      await waitFor(() => {
        expect(mockShutdown).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // Children rendering
  // ===========================================================================
  describe('children rendering', () => {
    it('should render children when PostHog key is set', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';

      render(<PostHogProvider>Test Content</PostHogProvider>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render children when PostHog key is NOT set', async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;

      render(<PostHogProvider>Test Content</PostHogProvider>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});