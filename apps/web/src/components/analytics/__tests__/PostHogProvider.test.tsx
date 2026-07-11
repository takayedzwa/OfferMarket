import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostHogProvider from '../PostHogProvider';

// Mock posthog-js module — since it's dynamically imported and may not be installed,
// we mock it at the module level.
const mockInit = jest.fn();
const mockOptIn = jest.fn();
const mockCapturePageview = jest.fn();

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: {
    init: mockInit,
    opt_in_capturing: mockOptIn,
    capture_pageview: mockCapturePageview,
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

      render(<PostHogProvider>children</PostHogProvider>);

      // Wait for dynamic import to resolve (or not)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockInit).not.toHaveBeenCalled();
    });

    it('should initialize PostHog with opt_out_capturing_by_default: true', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          'phk_test_key',
          expect.objectContaining({
            opt_out_capturing_by_default: true,
          }),
        );
      });
    });

    it('should disable autocapture and session recording by default', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          'phk_test_key',
          expect.objectContaining({
            disable_session_recording: true,
            capture_pageview: false,
            autocapture: false,
          }),
        );
      });
    });

    it('should use eu.posthog.com as default API host', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';

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

    it('should use localStorage persistence', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalledWith(
          'phk_test_key',
          expect.objectContaining({
            persistence: 'localStorage',
          }),
        );
      });
    });
  });

  // ===========================================================================
  // Analytics consent opt-in from localStorage
  // ===========================================================================
  describe('existing analytics consent', () => {
    it('should opt in to PostHog when analytics consent was previously granted', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: true, marketing: false },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockOptIn).toHaveBeenCalled();
        expect(mockCapturePageview).toHaveBeenCalled();
      });
    });

    it('should NOT opt in when analytics consent is not granted', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      localStorageMock.setItem('offermarket_cookie_consent', JSON.stringify({
        version: '1.0',
        consent: { functional: true, analytics: false, marketing: false },
        timestamp: '2026-07-11T12:00:00.000Z',
      }));

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalled();
      });

      // Give a small window for the opt-in check to run
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockOptIn).not.toHaveBeenCalled();
    });

    it('should NOT opt in when localStorage has no consent data', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      // localStorageMock is empty

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockOptIn).not.toHaveBeenCalled();
    });

    it('should NOT crash when localStorage has invalid JSON consent data', async () => {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phk_test_key';
      localStorageMock.setItem('offermarket_cookie_consent', 'not-json');

      render(<PostHogProvider>children</PostHogProvider>);

      await waitFor(() => {
        expect(mockInit).toHaveBeenCalled();
      });

      // Should not throw, should not opt in
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(mockOptIn).not.toHaveBeenCalled();
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