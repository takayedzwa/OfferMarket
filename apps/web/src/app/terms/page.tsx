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
              Last updated: July 12, 2026 · Version 2.0
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
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Force Majeure</h2>
              <p>
                Neither party shall be liable for any failure or delay in performing its obligations under
                these terms where such failure or delay results from circumstances beyond its reasonable control,
                including but not limited to: natural disasters, pandemics, war, terrorism, riots, strikes or
                other labour disputes, fire, flood, interruption or failure of internet service providers,
                telecommunications networks, power utilities, or cloud infrastructure providers, and
                governmental actions or orders.
              </p>
              <p className="mt-2">
                If a force majeure event continues for more than 30 consecutive days, either party may
                terminate these terms with immediate effect by written notice to the other party, without
                liability for such termination.
              </p>
              <p className="mt-2">
                OfferMarket B.V. will make reasonable efforts to notify users of the nature and expected
                duration of any force majeure event affecting the platform via email or a notice on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes</h2>
              <p>
                We may update these terms. Significant changes will be communicated via email. Continued
                use of the platform after changes constitutes acceptance.
              </p>
            </section>

            {/* DSA Compliance Sections — Digital Services Act (Regulation EU 2022/2065) */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Illegal Content Reporting (DSA Art. 16)</h2>
              <p>
                Under the <strong>Digital Services Act</strong> (Regulation EU 2022/2065), you have the right
                to notify us of content on OfferMarket that you believe to be illegal. Our notice-and-action
                mechanism is available at:
              </p>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="font-medium text-blue-900">
                  <a href="/dsa/report" className="text-blue-600 hover:underline text-lg">
                    Report Illegal Content →
                  </a>
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  You can also check the status of a report at{' '}
                  <a href="/dsa/status" className="text-blue-600 hover:underline">Report Status</a>.
                </p>
              </div>
              <ul className="mt-3 space-y-1 list-disc pl-5">
                <li>You may report content anonymously by providing an email address for acknowledgment.</li>
                <li>You must provide a sufficiently detailed explanation of why you believe the content is illegal (DSA Art. 16(3)(a)).</li>
                <li>You must confirm that your notice is submitted in good faith (DSA Art. 16(3)(d)).</li>
                <li>We will acknowledge your report without undue delay and inform you of the decision.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Content Moderation (DSA Art. 14)</h2>
              <p>
                OfferMarket uses a combination of human review and automated systems to moderate content
                on the platform. Our content moderation policies and procedures include:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li><strong>Human review</strong> — All content reports are assessed by trained staff members.</li>
                <li><strong>Automated detection</strong> — We use automated systems to detect potentially illegal content (e.g., known illegal patterns, spam detection). Automated actions are reviewed by a human within 24 hours.</li>
                <li><strong>Notice-and-action procedure</strong> — We follow the procedure described in Section 12 when processing illegal content reports.</li>
                <li><strong>Statement of reasons</strong> — When we restrict content, we provide the affected user with a clear statement of reasons (DSA Art. 17).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Statement of Reasons (DSA Art. 17)</h2>
              <p>
                When we restrict content on the platform (removal, visibility limitation, account suspension,
                etc.), we will provide the affected user with a statement of reasons that includes:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>The type of restriction applied (removal, visibility limitation, geo-blocking, etc.)</li>
                <li>The factual circumstances and reasons for the decision</li>
                <li>The source of the decision (user report, own investigation, authority order, trusted flagger)</li>
                <li>Whether automated means were used in the decision</li>
                <li>The legal or contractual ground for the restriction</li>
                <li>The territorial scope of the restriction</li>
                <li>Information on how to submit a complaint (see Section 17)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Referral to Authorities (DSA Art. 18)</h2>
              <p>
                Where we have reasonable grounds to believe that a report concerns an offence involving
                a threat to the life or safety of persons, we will promptly refer the matter to the
                relevant law enforcement authorities in the Netherlands.
              </p>
              <p className="mt-2">
                Reports involving suspected child safety concerns or terrorism-related content are
                escalated as a matter of priority.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">17. Complaint-Handling (DSA Art. 20)</h2>
              <p>
                If you disagree with a content moderation decision, you may submit a complaint through
                our internal complaint-handling system. Complaints are:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>Free of charge</li>
                <li>Handled by qualified staff who were not involved in the original decision</li>
                <li>Acknowledged within 24 hours</li>
                <li>Resolved within a reasonable timeframe</li>
              </ul>
              <p className="mt-2">
                You may also seek out-of-court dispute settlement through certified bodies as provided
                for under DSA Art. 21, once such bodies are available.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">18. Misuse of Notice-and-Action (DSA Art. 23)</h2>
              <p>
                Submitting manifestly unfounded notices or notices containing manifestly illegal content
                may result in:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>A first warning</li>
                <li>A second warning</li>
                <li>Temporary suspension of your ability to submit reports</li>
                <li>Permanent ban from the notice-and-action mechanism</li>
              </ul>
              <p className="mt-2">
                Misuse warnings are lifted after a reasonable period, provided no further misuse occurs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">19. Trader Traceability (DSA Art. 30)</h2>
              <p>
                As an online marketplace, OfferMarket collects and verifies information about employers
                (traders) who use the platform. Before an employer can publish offers, we collect:
              </p>
              <ul className="mt-2 space-y-1 list-disc pl-5">
                <li>Full name or company name</li>
                <li>KvK (Chamber of Commerce) number</li>
                <li>Physical address</li>
                <li>Contact email and phone number</li>
                <li>VAT identification number (where applicable)</li>
                <li>Self-certification that the trader complies with applicable EU rules</li>
              </ul>
              <p className="mt-2">
                This information is displayed on employer profiles and is stored for 6 months after
                the end of the contractual relationship, in accordance with DSA Art. 30(4).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">20. Transparency Reporting (DSA Arts. 15, 24)</h2>
              <p>
                OfferMarket publishes transparency reports on content moderation activities, available at:
              </p>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-4">
                <a href="/dsa/transparency" className="text-blue-600 hover:underline font-medium">
                  Transparency Report →
                </a>
              </div>
              <p className="mt-2">
                These reports include information on the number of notices received, content removed,
                accounts suspended, response times, and the use of automated means for content moderation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">21. Single Point of Contact</h2>
              <p>
                For all matters related to the Digital Services Act, you may contact:
              </p>
              <div className="mt-2 bg-gray-50 rounded-md p-4">
                <p><strong>OfferMarket B.V.</strong> — DSA Single Point of Contact</p>
                <p>Email: <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">legal@offermarket.nl</a></p>
                <p className="mt-1 text-sm text-gray-500">
                  For urgent matters involving threats to life or safety, contact the relevant
                  law enforcement authorities directly.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">22. Severability</h2>
              <p>
                If any provision of these terms is held to be invalid, illegal, or unenforceable by a court
                of competent jurisdiction, such provision shall be modified to the minimum extent necessary
                to make it valid and enforceable, or if modification is not possible, shall be severed from
                these terms. The invalidity of any provision shall not affect the validity or enforceability
                of any other provision, which shall remain in full force and effect.
              </p>
              <p className="mt-2">
                These terms shall be interpreted so as to best effect the parties&apos; intentions, and any
                provisions that are found to be invalid or unenforceable shall be replaced by valid provisions
                that most closely match the intent of the original provisions.
              </p>
              <p className="mt-2">
                This applies in particular to the limitation of liability provisions in Section 9, which shall
                be reduced to the maximum extent permitted under applicable mandatory law, including but not
                limited to Dutch Book 6 Article 7:658 (employer liability) and Article 6:248 BW (reasonableness
                and fairness).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">23. Contact</h2>
              <div className="bg-gray-50 rounded-md p-4">
                <p><strong>OfferMarket B.V.</strong></p>
                <p>Herengracht 420, 1017 Amsterdam, Netherlands</p>
                <p>KvK: 93075284</p>
                <p>Email: <a href="mailto:legal@offermarket.nl" className="text-blue-600 hover:underline">legal@offermarket.nl</a></p>
              </div>
            </section>
          </div>

          <div className="px-8 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              © {new Date().getFullYear()} OfferMarket B.V. ·{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> ·{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> ·{' '}
              <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a> ·{' '}
              <a href="/dsa/report" className="text-blue-600 hover:underline">Report Illegal Content</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}