import Link from 'next/link';

/**
 * Shared footer with legal links including DSA Art. 12-compliant
 * "easy access" to illegal content reporting.
 */
export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-white font-semibold text-lg">OfferMarket</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              A reverse talent marketplace where workers have leverage.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy/dashboard" className="hover:text-white transition-colors">
                  Privacy Dashboard
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* DSA / Reporting */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">Report & Complain</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dsa/report" className="hover:text-white transition-colors font-medium text-red-400">
                  ⚑ Report Illegal Content
                </Link>
              </li>
              <li>
                <Link href="/dsa/status" className="hover:text-white transition-colors">
                  Check Report Status
                </Link>
              </li>
              <li>
                <Link href="/dsa/transparency" className="hover:text-white transition-colors">
                  Transparency Report
                </Link>
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              DSA Art. 12 & 16 — Easy access to illegal content reporting
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium text-sm mb-3">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@offermarket.nl" className="hover:text-white transition-colors">
                  support@offermarket.nl
                </a>
              </li>
              <li>
                <a href="mailto:legal@offermarket.nl" className="hover:text-white transition-colors">
                  legal@offermarket.nl
                </a>
              </li>
              <li>
                <a href="mailto:dpo@offermarket.nl" className="hover:text-white transition-colors">
                  Data Protection Officer
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              OfferMarket B.V. · Netherlands
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} OfferMarket B.V. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-gray-300 transition-colors">Cookies</Link>
            <Link href="/dsa/report" className="hover:text-gray-300 transition-colors text-red-400">Report Illegal Content</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}