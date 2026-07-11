'use client';

import Navbar from '@/components/Navbar';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: July 11, 2026 · Version 1.0
            </p>
            <p className="mt-1 text-sm text-gray-500">
              <span lang="nl">Cookiebeleid</span> · OfferMarket B.V.
            </p>
          </div>

          <div className="px-8 py-6 space-y-8 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What Are Cookies</h2>
              <p>
                Cookies are small text files stored on your device when you visit our website. They help us
                provide you with a better experience by remembering your preferences, enabling essential
                functionality, and helping us understand how you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Types of Cookies We Use</h2>

              <div className="mt-4 space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Essential
                    </span>
                    <h3 className="font-medium text-gray-900">Essential Cookies</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    These cookies are strictly necessary for the website to function. They cannot be disabled.
                  </p>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cookie</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2">accessToken</td>
                        <td className="px-3 py-2">Authentication session</td>
                        <td className="px-3 py-2">Session</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">refreshToken</td>
                        <td className="px-3 py-2">Session persistence</td>
                        <td className="px-3 py-2">30 days</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">offermarket_cookie_consent</td>
                        <td className="px-3 py-2">Stores your cookie preferences</td>
                        <td className="px-3 py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Analytics
                    </span>
                    <h3 className="font-medium text-gray-900">Analytics Cookies</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    These cookies help us understand how visitors interact with our website. We use PostHog
                    for anonymized analytics. These cookies require your consent.
                  </p>
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cookie</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2">ph_*</td>
                        <td className="px-3 py-2">PostHog analytics — page views, feature usage</td>
                        <td className="px-3 py-2">1 year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Marketing
                    </span>
                    <h3 className="font-medium text-gray-900">Marketing Cookies</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    These cookies are used to track visitors across websites for advertising purposes.
                    We do not currently use any marketing cookies, but this category is available if we
                    introduce them in the future.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    No marketing cookies are currently in use.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How to Manage Cookies</h2>
              <p>
                You can manage your cookie preferences at any time:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>
                  Through our <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Privacy Dashboard</a> — consent management section
                </li>
                <li>
                  By clicking the cookie banner that appears on your first visit
                </li>
                <li>
                  Through your browser settings — most browsers allow you to block or delete cookies
                </li>
              </ul>
              <p className="mt-3">
                Please note that disabling essential cookies may prevent the platform from functioning correctly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. PostHog Analytics</h2>
              <p>
                We use PostHog for product analytics. When analytics cookies are enabled:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>Page views and feature usage are tracked</li>
                <li>IP addresses are collected but we configure PostHog to mask them</li>
                <li>Data is stored on EU-based servers</li>
                <li>We have a Data Processing Agreement with PostHog</li>
                <li>You can opt out at any time through the cookie banner or Privacy Dashboard</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Local Storage</h2>
              <p>
                In addition to cookies, we use browser local storage for:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li><strong>Authentication tokens</strong> — to maintain your login session</li>
                <li><strong>User preferences</strong> — such as theme and notification settings</li>
                <li><strong>Cookie consent preferences</strong> — to remember your choices</li>
              </ul>
              <p className="mt-2">
                Local storage data is not shared with third parties and does not track you across websites.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Changes to This Policy</h2>
              <p>
                We may update this cookie policy from time to time. Changes will be reflected in the
                &quot;Last updated&quot; date at the top. If we introduce new non-essential cookies,
                we will seek your consent again through the cookie banner.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
              <p>
                For questions about our use of cookies, contact our Data Protection Officer at{' '}
                <a href="mailto:dpo@offermarket.nl" className="text-blue-600 hover:underline">dpo@offermarket.nl</a>.
              </p>
            </section>
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} OfferMarket B.V. ·{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> ·{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> ·{' '}
              <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a> ·{' '}
              <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Privacy Dashboard</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}