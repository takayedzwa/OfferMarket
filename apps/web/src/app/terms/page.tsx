'use client';

import Navbar from '@/components/Navbar';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="mt-2 text-sm text-gray-500">
              Last updated: July 11, 2026 · Version 1.0
            </p>
            <p className="mt-1 text-sm text-gray-500">
              <span lang="nl">Algemene Voorwaarden</span> · OfferMarket B.V.
            </p>
          </div>

          <div className="px-8 py-6 space-y-8 text-gray-700 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Definitions</h2>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>&quot;OfferMarket&quot;</strong> means OfferMarket B.V., registered in the Netherlands.</li>
                <li><strong>&quot;Platform&quot;</strong> means the OfferMarket web application and related services.</li>
                <li><strong>&quot;Worker&quot;</strong> means a professional who creates a profile to receive offers from employers.</li>
                <li><strong>&quot;Employer&quot;</strong> means a company or individual who sends offers to workers through the platform.</li>
                <li><strong>&quot;Offer&quot;</strong> means a proposal sent by an employer to a worker containing employment terms.</li>
                <li><strong>&quot;User&quot;</strong> means any person who uses the platform, including workers and employers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Acceptance of Terms</h2>
              <p>
                By creating an account or using the OfferMarket platform, you agree to these Terms of Service
                and our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                If you do not agree, you must not use the platform.
              </p>
              <p className="mt-2">
                These terms are governed by Dutch law. Any disputes will be resolved by the competent courts
                in the Netherlands.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
              <p>You must register to use the platform. By registering you represent and warrant that:</p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>You are at least 18 years old</li>
                <li>You provide accurate and complete information</li>
                <li>You will keep your information up to date</li>
                <li>You will maintain the security of your account credentials</li>
                <li>You will not create multiple accounts or impersonate others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Platform Use</h2>
              <h3 className="font-medium text-gray-900 mt-4 mb-2">4.1 For Workers</h3>
              <ul className="space-y-1 list-disc pl-5">
                <li>You create a professional profile that employers can discover</li>
                <li>Your profile is anonymous until you accept an offer — your name, email, and contact details are hidden</li>
                <li>You may receive offers from verified employers</li>
                <li>You are not obligated to accept any offer</li>
                <li>Upon accepting an offer, your identity is revealed to the employer for contract purposes</li>
              </ul>

              <h3 className="font-medium text-gray-900 mt-4 mb-2">4.2 For Employers</h3>
              <ul className="space-y-1 list-disc pl-5">
                <li>You can search anonymous worker profiles based on skills, experience, and preferences</li>
                <li>You can send offers to workers with employment terms</li>
                <li>You must be a registered business (KvK number required)</li>
                <li>Offer terms must comply with Dutch employment law</li>
                <li>Upon offer acceptance, the worker&apos;s identity is revealed for contract purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Billing & Payments</h2>
              <p>
                Employers are charged an introduction fee when a worker accepts an offer. Payment terms
                are as specified in the invoice. All prices include VAT where applicable.
              </p>
              <p className="mt-2">
                Late payments may incur interest at the statutory rate (Wet Handelscrediteuren).
                OfferMarket reserves the right to suspend accounts with overdue invoices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Prohibited Conduct</h2>
              <p>You must not:</p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>Use the platform for any unlawful purpose</li>
                <li>Discriminate against workers based on protected characteristics</li>
                <li>Share or distribute worker personal data outside the platform without consent</li>
                <li>Attempt to de-anonymize workers before offer acceptance</li>
                <li>Create fake profiles or misrepresent your identity</li>
                <li>Use automated systems (bots, scrapers) to extract data from the platform</li>
                <li>Circumvent the platform to avoid introduction fees</li>
                <li>Upload special category data (nationality, health, union membership) into profile free-text fields</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>
              <p>
                The platform, its design, and its content (excluding user-generated content) are owned by
                OfferMarket B.V. You retain ownership of your profile content and offers. By posting content,
                you grant OfferMarket a limited, non-exclusive license to display it on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Privacy & Data Protection</h2>
              <p>
                Our processing of personal data is governed by our{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>,
                which forms part of these terms. Key points:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>We process your data lawfully, fairly, and transparently (AVG Art. 5)</li>
                <li>We only collect data necessary for the purposes stated</li>
                <li>Worker profiles are anonymous by default — identity is only revealed upon offer acceptance</li>
                <li>Work authorization status is special category data processed only with explicit consent</li>
                <li>You can exercise your AVG rights through the <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Privacy Dashboard</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Liability</h2>
              <p>
                OfferMarket acts as an intermediary connecting workers and employers. We are not a party
                to any employment contract between users. OfferMarket is not liable for:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>The quality, legality, or accuracy of offers or profiles</li>
                <li>Any employment disputes between workers and employers</li>
                <li>Losses arising from reliance on information on the platform</li>
              </ul>
              <p className="mt-2">
                Our total liability is limited to the fees you paid in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
              <p>
                You may close your account at any time through the{' '}
                <a href="/privacy/dashboard" className="text-blue-600 hover:underline">Privacy Dashboard</a>.
                Upon account deletion, your personal data will be handled in accordance with our retention
                policy (see <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>).
              </p>
              <p className="mt-2">
                OfferMarket may suspend or terminate accounts that violate these terms, with prior notice
                where possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes</h2>
              <p>
                We may update these terms. Significant changes will be communicated via email. Continued
                use of the platform after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p><strong>OfferMarket B.V.</strong></p>
                <p>[Address], [City], Netherlands</p>
                <p>KvK: [Number]</p>
                <p>Email: <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">legal@offermarket.nl</a></p>
              </div>
            </section>
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} OfferMarket B.V. ·{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> ·{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> ·{' '}
              <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}