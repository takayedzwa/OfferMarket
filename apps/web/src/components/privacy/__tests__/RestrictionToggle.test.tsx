import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RestrictionToggle from '../RestrictionToggle';

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

describe('RestrictionToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('accessToken', 'test-token');
  });

  // ===========================================================================
  // Initial Load
  // ===========================================================================
  describe('initial load', () => {
    it('should fetch restriction status on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: false,
          processingRestrictedAt: null,
        }),
      });

      render(<RestrictionToggle />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/restriction-status`,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer test-token',
            }),
          }),
        );
      });
    });

    it('should display current restriction status from API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: true,
          processingRestrictedAt: '2026-07-01T12:00:00.000Z',
        }),
      });

      render(<RestrictionToggle />);

      await waitFor(() => {
        // Toggle should be ON (amber)
        const toggle = screen.getByRole('button');
        expect(toggle.className).toContain('bg-amber-500');
      });
    });

    it('should show unrestricted toggle when not restricted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: false,
          processingRestrictedAt: null,
        }),
      });

      render(<RestrictionToggle />);

      await waitFor(() => {
        const toggle = screen.getByRole('button');
        expect(toggle.className).toContain('bg-gray-200');
      });
    });
  });

  // ===========================================================================
  // Toggle ON (Restrict Processing)
  // ===========================================================================
  describe('toggling restriction ON', () => {
    it('should POST to /privacy/request/restrict with restricted: true', async () => {
      // Initial load: not restricted
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: false,
          processingRestrictedAt: null,
        }),
      });

      // Toggle ON
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: true,
          processingRestrictedAt: '2026-07-11T12:00:00.000Z',
        }),
      });

      render(<RestrictionToggle />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Processing Restriction Status')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      // Verify POST was made to restrict endpoint
      await waitFor(() => {
        const postCall = mockFetch.mock.calls.find(
          (call: any[]) => call[0] === `${API_BASE}/privacy/request/restrict` && call[1]?.method === 'POST'
        );
        expect(postCall).toBeDefined();
        expect(JSON.parse(postCall![1].body)).toEqual({ restricted: true, reason: '' });
      });
    });
  });

  // ===========================================================================
  // Toggle OFF (Remove Restriction)
  // ===========================================================================
  describe('toggling restriction OFF', () => {
    it('should DELETE to /privacy/request/restrict', async () => {
      // Initial load: restricted
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: true,
          processingRestrictedAt: '2026-07-01T12:00:00.000Z',
        }),
      });

      // Toggle OFF
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: false,
          processingRestrictedAt: null,
        }),
      });

      render(<RestrictionToggle />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Processing Restriction Status')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      // Verify DELETE was made to restrict endpoint
      await waitFor(() => {
        const deleteCall = mockFetch.mock.calls.find(
          (call: any[]) => call[0] === `${API_BASE}/privacy/request/restrict` && call[1]?.method === 'DELETE'
        );
        expect(deleteCall).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // Error Handling
  // ===========================================================================
  describe('error handling', () => {
    it('should show error message on API failure', async () => {
      // Initial load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processingRestricted: false,
          processingRestrictedAt: null,
        }),
      });

      // Toggle fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });

      render(<RestrictionToggle />);

      await waitFor(() => {
        expect(screen.getByText('Processing Restriction Status')).toBeInTheDocument();
      });

      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);

      await waitFor(() => {
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });
    });
  });
});