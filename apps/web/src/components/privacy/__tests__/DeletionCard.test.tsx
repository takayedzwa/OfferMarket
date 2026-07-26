import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeletionCard from '../DeletionCard';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] ?? null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

describe('DeletionCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('accessToken', 'test-token');
  });

  // ===========================================================================
  // Deletion Request Flow
  // ===========================================================================
  describe('deletion request flow', () => {
    it('should show "Request Account Deletion" button in idle state', () => {
      render(<DeletionCard />);
      expect(screen.getByText('Request Account Deletion')).toBeInTheDocument();
    });

    it('should show confirmation form after clicking request', () => {
      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      expect(screen.getByText('Yes, delete my account')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reason for deletion/i)).toBeInTheDocument();
    });

    it('should POST to /privacy/request/erasure with reason', async () => {
      // Mock: request deletion returns PENDING, then confirm returns CONFIRMED
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-1',
            status: 'PENDING',
            scheduledDeletionAt: '2026-08-10T12:00:00.000Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-1',
            status: 'CONFIRMED',
          }),
        });

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));

      const reasonInput = screen.getByLabelText(/Reason for deletion/i);
      fireEvent.change(reasonInput, { target: { value: 'No longer needed' } });
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/request/erasure`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ reason: 'No longer needed' }),
          }),
        );
      });
    });

    it('should confirm deletion request after creating it', async () => {
      // Step 1: Request deletion (returns PENDING)
      // Step 2: Confirm deletion (returns CONFIRMED)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-confirm-1',
            status: 'PENDING',
            scheduledDeletionAt: '2026-08-10T12:00:00.000Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-confirm-1',
            status: 'CONFIRMED',
          }),
        });

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        // First call: create deletion request
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/request/erasure`,
          expect.objectContaining({ method: 'POST' }),
        );
      });

      await waitFor(() => {
        // Second call: confirm deletion request
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_BASE}/privacy/request/erasure/del-confirm-1/confirm`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    it('should still show grace period even if confirm call fails', async () => {
      // Step 1: Request deletion succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-confirm-fail',
            status: 'PENDING',
            scheduledDeletionAt: '2026-08-10T12:00:00.000Z',
          }),
        })
        // Step 2: Confirm call fails
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ message: 'Internal server error' }),
        });

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        expect(screen.getByText(/Deletion Request Submitted/i)).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to confirm deletion request'),
        expect.anything(),
      );

      consoleSpy.mockRestore();
    });

    it('should store deletionRequestId from response for cancellation', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-abc-123',
            status: 'PENDING',
            scheduledDeletionAt: '2026-08-10T12:00:00.000Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-abc-123',
            status: 'CONFIRMED',
          }),
        });

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        expect(screen.getByText(/Deletion Request Submitted/i)).toBeInTheDocument();
      });

      // Now cancel should use the stored requestId
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      fireEvent.click(screen.getByText('Cancel Deletion Request'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          `${API_BASE}/privacy/request/erasure/del-abc-123/cancel`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    it('should display scheduled deletion date from API response', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-1',
            status: 'PENDING',
            scheduledDeletionAt: '2026-08-10T12:00:00.000Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-1',
            status: 'CONFIRMED',
          }),
        });

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        expect(screen.getByText(/10 augustus 2026/i)).toBeInTheDocument();
      });
    });

    it('should show error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'You already have a pending deletion request' }),
      });

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        expect(screen.getByText(/already have a pending deletion request/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // Cancellation Flow
  // ===========================================================================
  describe('cancellation flow', () => {
    it('should POST to /privacy/request/erasure/:id/cancel', async () => {
      // Step 1: Request deletion
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-cancel-1',
            status: 'PENDING',
            scheduledDeletionAt: '2026-08-10T12:00:00.000Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-cancel-1',
            status: 'CONFIRMED',
          }),
        });

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        expect(screen.getByText(/Deletion Request Submitted/i)).toBeInTheDocument();
      });

      // Step 2: Cancel
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Deletion request cancelled' }),
      });

      fireEvent.click(screen.getByText('Cancel Deletion Request'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenLastCalledWith(
          `${API_BASE}/privacy/request/erasure/del-cancel-1/cancel`,
          expect.objectContaining({ method: 'POST' }),
        );
      });
    });

    it('should show "Deletion Cancelled" state after successful cancel', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-1',
            status: 'PENDING',
            scheduledDeletionAt: '2026-08-10T12:00:00.000Z',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'del-1',
            status: 'CONFIRMED',
          }),
        });

      render(<DeletionCard />);
      fireEvent.click(screen.getByText('Request Account Deletion'));
      fireEvent.click(screen.getByText('Yes, delete my account'));

      await waitFor(() => {
        expect(screen.getByText(/Deletion Request Submitted/i)).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      fireEvent.click(screen.getByText('Cancel Deletion Request'));

      await waitFor(() => {
        expect(screen.getByText('Deletion Cancelled')).toBeInTheDocument();
      });
    });
  });
});