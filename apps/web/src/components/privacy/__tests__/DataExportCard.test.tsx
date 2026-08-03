import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataExportCard from '../DataExportCard';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en';

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
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';


// Wraps a node in the provider the components need for useTranslations/useLocale.
function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
describe('DataExportCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    jest.useFakeTimers();
    localStorageMock.setItem('accessToken', 'test-token');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ===========================================================================
  // Export Request Flow
  // ===========================================================================
  describe('export request flow', () => {
    it('should show "Request Data Export" button in idle state', () => {
      renderWithIntl(<DataExportCard />);
      expect(screen.getByText('Request Data Export')).toBeInTheDocument();
    });

    it('should POST to /privacy/export with format JSON on request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'export-1', status: 'PENDING' }),
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/export`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ format: 'JSON' }),
          }),
        );
      });
    });

    it('should show user-friendly message for 400 "already pending" error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'You already have a pending data export request' }),
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      await waitFor(() => {
        expect(screen.getByText(/already have a pending/i)).toBeInTheDocument();
      });
    });

    it('should show generic error for other HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      await waitFor(() => {
        expect(screen.getByText(/Internal server error|An error occurred/i)).toBeInTheDocument();
      });
    });

    it('should show "Try Again" button on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Status Polling
  // ===========================================================================
  describe('status polling', () => {
    it('should transition to "ready" state when export is COMPLETED', async () => {
      // First call: POST export request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'export-1', status: 'PENDING' }),
      });

      // Second call: GET export status — completed
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'export-1', status: 'COMPLETED' }],
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      // Advance timers to trigger polling
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Your data export is ready/i)).toBeInTheDocument();
      });
    });

    it('should handle array response from export status API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'export-1', status: 'PENDING' }),
      });

      // Status endpoint returns array
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'export-1', status: 'COMPLETED' },
        ],
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Your data export is ready/i)).toBeInTheDocument();
      });
    });

    it('should show error when export FAILED', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'export-1', status: 'PENDING' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'export-1', status: 'FAILED' }],
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByText(/Export failed/i)).toBeInTheDocument();
      });
    });

    it('should reset to idle when no exports found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'export-1', status: 'PENDING' }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      renderWithIntl(<DataExportCard />);
      fireEvent.click(screen.getByText('Request Data Export'));

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Should go back to showing request button
      await waitFor(() => {
        expect(screen.getByText('Request Data Export')).toBeInTheDocument();
      });
    });
  });
});