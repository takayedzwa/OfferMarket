'use client';

import Navbar from '@/components/Navbar';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: July 11, 2026 · Version 1.0
            </p>
            <p className="mt-1 text-sm text-gray-500">
              <span lang="nl">Privacyverklaring</span> · OfferMarket B.V.
            </p>
          </div>

          <div className="px-8 py-6 space-y-8 text-gray-700 text-sm leading-relaxed">
            {/* 1. Controller */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Controller</h2>
              <p>
                The data controller responsible for your personal data is:
              </p>
              <div className="mt-2 bg-gray-50 rounded-md p-4">
                <p className="font-medium">OfferMarket B.V.</p>
                <p>[KvK Number]</p>
                <p>[Address]</p>
                <p>Data Protection Officer: <a href="mailto:dpo@offermarket.nl" className="text-blue-600 hover:underline">dpo@offermarket.nl</a></p>
              </div>
              <p className="mt-3">
                For questions about this privacy policy or your rights under the AVG (Algemene Verordening Gegevensbescherming),
                contact our DPO at the email above.
              </p>
            </section>

            {/* 2. Data We Process */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Personal Data We Process</h2>
              <p>We process the following categories of personal data:</p>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Examples</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Legal Basis</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm">Identity data</td>
                      <td className="px-4 py-3 text-sm">Name, email, phone number</td>
                      <td className="px-4 py-3 text-sm">Contract performance (Art. 6(1)(b))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Profile data</td>
                      <td className="px-4 py-3 text-sm">Skills, experience, education, certifications</td>
                      <td className="px-4 py-3 text-sm">Contract performance (Art. 6(1)(b))</td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td className="px-4 py-3 text-sm font-medium">Special category data</td>
                      <td className="px-4 py-3 text-sm">Work authorization status (immigration data)</td>
                      <td className="px-4 py-3 text-sm">Explicit consent (Art. 9(2)(a))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Professional data</td>
                      <td className="px-4 py-3 text-sm">Work preferences, salary expectations, availability</td>
                      <td className="px-4 py-3 text-sm">Contract performance (Art. 6(1)(b))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Communication data</td>
                      <td className="px-4 py-3 text-sm">Messages between users, notifications</td>
                      <td className="px-4 py-3 text-sm">Contract performance (Art. 6(1)(b))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Company data</td>
                      <td className="px-4 py-3 text-sm">KvK number, company name, billing info</td>
                      <td className="px-4 py-3 text-sm">Legal obligation (Art. 6(1)(c))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Verification documents</td>
                      <td className="px-4 py-3 text-sm">ID copies, certificates, diplomas</td>
                      <td className="px-4 py-3 text-sm">Legal obligation (Art. 6(1)(c))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Financial data</td>
                      <td className="px-4 py-3 text-sm">Invoices, payment records</td>
                      <td className="px-4 py-3 text-sm">Legal obligation (Art. 6(1)(c))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Technical data</td>
                      <td className="px-4 py-3 text-sm">IP address, browser, device info</td>
                      <td className="px-4 py-3 text-sm">Legitimate interest (Art. 6(1)(f))</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Usage data</td>
                      <td className="px-4 py-3 text-sm">Page views, feature usage, search history</td>
                      <td className="px-4 py-3 text-sm">Consent (Art. 6(1)(a))</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 3. Special Category Data */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Special Category Data</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <p className="font-medium text-amber-900">⚠️ Important — AVG Article 9</p>
                <p className="mt-2 text-amber-800">
                  We process work authorization status (EU citizen, work permit holder, etc.) which may reveal
                  immigration status and, by extension, national origin. This constitutes special category data
                  under AVG Article 9.
                </p>
                <p className="mt-2 text-amber-800">
                  We only process this data with your <strong>explicit consent</strong>. You may withdraw this
                  consent at any time through your privacy settings. If consent is withdrawn, your work authorization
                  status will not be shown to employers, though a simple yes/no flag (hasWorkAuthorization)
                  may still be displayed.
                </p>
                <p className="mt-2 text-amber-800">
                  We strongly advise against including other special category data (nationality, gender, health
                  information, union membership) in your profile. Our free-text fields are not designed for this
                  type of data, and we are not authorized to process it.
                </p>
              </div>
            </section>

            {/* 4. Legal Bases */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Bases for Processing</h2>
              <p>We process your personal data on the following legal bases:</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li><strong>Consent (Art. 6(1)(a))</strong> — Analytics, marketing communications, work authorization processing, cookie usage</li>
                <li><strong>Contract performance (Art. 6(1)(b))</strong> — Providing the platform, matching workers with employers, processing offers, messaging</li>
                <li><strong>Legal obligation (Art. 6(1)(c))</strong> — KvK verification, tax record retention (7 years), fraud prevention</li>
                <li><strong>Legitimate interest (Art. 6(1)(f))</strong> — Security, platform improvement, audit logging, anonymized analytics</li>
              </ul>
            </section>

            {/* 5. Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing & Recipients</h2>
              <p>We share your personal data with the following categories of recipients:</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li><strong>Employers/Workers</strong> — Anonymized profile data until offer acceptance, then identity data as agreed</li>
                <li><strong>Amazon Web Services (AWS)</strong> — Cloud infrastructure, file storage (S3), email (SES)</li>
                <li><strong>Stripe</strong> — Payment processing and invoicing</li>
                <li><strong>PostHog</strong> — Anonymized analytics (only with your consent)</li>
                <li><strong>Twilio</strong> — SMS notifications</li>
                <li><strong>Sentry</strong> — Error monitoring (minimal personal data)</li>
              </ul>
              <p className="mt-3">
                We have Data Processing Agreements (DPAs) with all processors. We do not sell your personal data.
              </p>
            </section>

            {/* 6. Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
              <p>We retain your personal data only as long as necessary:</p>
              <ul className="mt-3 space-y-1 list-disc pl-5">
                <li><strong>Active accounts</strong> — Until account deletion</li>
                <li><strong>Invoices & financial records</strong> — 7 years (Dutch tax obligation)</li>
                <li><strong>KvK verification data</strong> — 7 years after account closure</li>
                <li><strong>Messages</strong> — 2 years after conversation closure</li>
                <li><strong>Verification documents</strong> — 30 days after verification complete</li>
                <li><strong>Consent records</strong> — 7 years after consent withdrawal</li>
                <li><strong>IP addresses</strong> — 6 months</li>
                <li><strong>Audit logs</strong> — 7 years (anonymized after account deletion)</li>
                <li><strong>Analytics data (PostHog)</strong> — Until consent withdrawal</li>
              </ul>
            </section>

            {/* 7. Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights Under the AVG</h2>
              <p>You have the following rights regarding your personal data:</p>

              <div className="mt-4 space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Right of Access (Art. 15)</h3>
                  <p className="text-sm text-gray-600">
                    You can request a copy of all personal data we hold about you.{' '}
                    <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Request your data →</a>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Right to Rectification (Art. 16)</h3>
                  <p className="text-sm text-gray-600">
                    You can correct inaccurate personal data through your profile settings or by contacting us.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Right to Erasure (Art. 17)</h3>
                  <p className="text-sm text-gray-600">
                    You can request deletion of your personal data. Some data must be retained by law.{' '}
                    <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Request deletion →</a>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Right to Restriction (Art. 18)</h3>
                  <p className="text-sm text-gray-600">
                    You can request that we restrict the processing of your data while a dispute is resolved.{' '}
                    <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Restrict processing →</a>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Right to Data Portability (Art. 20)</h3>
                  <p className="text-sm text-gray-600">
                    You can receive your data in a machine-readable format (JSON/CSV).{' '}
                    <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Export your data →</a>
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Right to Object (Art. 21)</h3>
                  <p className="text-sm text-gray-600">
                    You can object to processing based on legitimate interest or for direct marketing purposes.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-medium text-gray-900">Right to Withdraw Consent (Art. 7(3))</h3>
                  <p className="text-sm text-gray-600">
                    Where processing is based on consent, you can withdraw it at any time.{' '}
                    <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Manage consents →</a>
                  </p>
                </div>
              </div>

              <p className="mt-4">
                To exercise any of these rights, use your{' '}
                <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Privacy Dashboard</a> or
                contact our DPO at{' '}
                <a href="mailto:dpo@offermarket.nl" className="text-blue-600 hover:underline">dpo@offermarket.nl</a>.
              </p>
              <p className="mt-2">
                If you are not satisfied with our response, you have the right to lodge a complaint with the{' '}
                <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Autoriteit Persoonsgegevens
                </a>{' '}
                (Dutch Data Protection Authority).
              </p>
            </section>

            {/* 8. Automated Decision-Making */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Automated Decision-Making & Profiling</h2>
              <p>
                We use automated systems to match workers with employers based on skills, experience, and preferences.
                These are not decisions that produce legal effects or significantly affect you. Our matching algorithm
                does not use special category data (such as nationality or health data) as input factors.
              </p>
              <p className="mt-2">
                Workers can always control their profile visibility and what information employers can see.
                Our anonymous profile system ensures that employers cannot identify you until you accept an offer.
              </p>
            </section>

            {/* 9. International Transfers */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
              <p>
                Our primary infrastructure is hosted within the European Union (AWS EU regions).
                Where data is transferred outside the EU, we ensure appropriate safeguards are in place:
              </p>
              <ul className="mt-3 space-y-1 list-disc pl-5">
                <li>Standard Contractual Clauses (SCCs) with all non-EU processors</li>
                <li>Adequacy decisions where applicable</li>
                <li>Data Processing Agreements with all processors</li>
              </ul>
            </section>

            {/* 10. Security */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Security Measures</h2>
              <p>We implement appropriate technical and organizational measures to protect your data:</p>
              <ul className="mt-3 space-y-1 list-disc pl-5">
                <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Role-based access control for admin access</li>
                <li>Anonymized worker profiles until offer acceptance</li>
                <li>Regular security audits and penetration testing</li>
                <li>Breach notification within 72 hours to the Dutch DPA</li>
                <li>Two-factor authentication available for all accounts</li>
                <li>IP address hashing for analytics</li>
              </ul>
            </section>

            {/* 11. Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Cookies</h2>
              <p>
                For detailed information about the cookies we use, please see our{' '}
                <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>.
              </p>
            </section>

            {/* 12. Changes */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of significant changes
                via email and through a prominent notice on our website. We will always obtain your consent
                for any new processing that requires it.
              </p>
            </section>

            {/* 13. Contact */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact</h2>
              <p>
                For any questions about this privacy policy or your data protection rights:
              </p>
              <div className="mt-2 bg-gray-50 rounded-md p-4">
                <p><strong>Data Protection Officer:</strong> dpo@offermarket.nl</p>
                <p><strong>OfferMarket B.V.</strong></p>
                <p>[Address], [City], Netherlands</p>
                <p><strong>KvK:</strong> [Number]</p>
              </div>
            </section>
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} OfferMarket B.V. ·{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> ·{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> ·{' '}
              <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a> ·{' '}
              <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Privacy Dashboard</a> ·{' '}
              <a href="/dsa/report" className="text-red-600 hover:underline">Report Illegal Content</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}