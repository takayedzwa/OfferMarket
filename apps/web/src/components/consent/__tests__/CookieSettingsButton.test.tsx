import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CookieSettingsButton, { showConsentBanner } from '../CookieSettingsButton';

describe('CookieSettingsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Rendering
  // ===========================================================================
  describe('rendering', () => {
    it('should render the Cookie Settings button', () => {
      render(<CookieSettingsButton />);
      expect(screen.getByLabelText('Manage cookie settings')).toBeInTheDocument();
    });

    it('should display the cookie emoji and label text', () => {
      render(<CookieSettingsButton />);
      const button = screen.getByLabelText('Manage cookie settings');
      expect(button).toHaveTextContent('🍪 Cookie Settings');
    });

    it('should have hover styling classes', () => {
      render(<CookieSettingsButton />);
      const button = screen.getByLabelText('Manage cookie settings');
      expect(button.className).toContain('hover:text-gray-700');
      expect(button.className).toContain('hover:underline');
    });

    it('should have text-sm class for subtle styling', () => {
      render(<CookieSettingsButton />);
      const button = screen.getByLabelText('Manage cookie settings');
      expect(button.className).toContain('text-sm');
    });
  });

  // ===========================================================================
  // Event Dispatch (Telecommunicatiewet Art. 11.7a — re-access requirement)
  // ===========================================================================
  describe('consent:show event dispatch', () => {
    it('should dispatch consent:show custom event on click', () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

      render(<CookieSettingsButton />);
      fireEvent.click(screen.getByLabelText('Manage cookie settings'));

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const dispatchedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(dispatchedEvent.type).toBe('consent:show');
    });

    it('should allow the CookieConsentBanner to re-show on click', () => {
      let eventReceived = false;
      const handler = () => { eventReceived = true; };
      window.addEventListener('consent:show', handler);

      render(<CookieSettingsButton />);
      fireEvent.click(screen.getByLabelText('Manage cookie settings'));

      expect(eventReceived).toBe(true);
      window.removeEventListener('consent:show', handler);
    });
  });

  // ===========================================================================
  // showConsentBanner() utility function
  // ===========================================================================
  describe('showConsentBanner', () => {
    it('should dispatch consent:show event programmatically', () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

      showConsentBanner();

      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const dispatchedEvent = dispatchSpy.mock.calls[0][0] as CustomEvent;
      expect(dispatchedEvent.type).toBe('consent:show');
    });

    it('should not throw when window is defined', () => {
      expect(() => showConsentBanner()).not.toThrow();
    });
  });
});