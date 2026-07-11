'use client';

/**
 * CookieSettingsButton
 *
 * A persistent link that allows users to re-open the cookie consent banner
 * at any time — required by Telecommunicatiewet Art. 11.7a.
 *
 * Dispatches a 'consent:show' custom event that CookieConsentBanner listens for.
 */
export default function CookieSettingsButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('consent:show'));
  };

  return (
    <button
      onClick={handleClick}
      className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
      aria-label="Manage cookie settings"
    >
      🍪 Cookie Settings
    </button>
  );
}

/**
 * Programmatically show the cookie consent banner.
 * Useful for navigation links or other components.
 */
export function showConsentBanner() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('consent:show'));
  }
}