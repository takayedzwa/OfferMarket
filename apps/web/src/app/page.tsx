import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                A Reverse Talent Marketplace
                <span className="text-blue-600"> Where Workers Have Leverage</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                Create an anonymous profile. Receive structured offers with transparent salary and benefits.
                Accept when ready – your identity stays hidden until then.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register?role=worker"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Create Anonymous Profile
                </Link>
                <Link
                  href="/register?role=employer"
                  className="bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-600 transition-colors"
                >
                  Hire as Employer
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Create Anonymous Profile</h3>
                <p className="text-gray-600">
                  Your identity is hidden. Employers see your skills and experience, but not your name or current employer.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">💼</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Receive Structured Offers</h3>
                <p className="text-gray-600">
                  Every offer includes specific salary, complete benefits, and clear contract terms. No vague messages allowed.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Accept & Reveal Identity</h3>
                <p className="text-gray-600">
                  When you accept an offer, your identity is revealed. Only then can the employer contact you directly.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Workers */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">For Workers</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Complete anonymity until you choose to reveal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">All offers have transparent salary and benefits</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">No spam, no empty recruiter messages</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Compare offers side-by-side</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Block companies you don't want to see your profile</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold text-gray-900">Your Privacy is Protected</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between py-2 border-b">
                    <span>Name</span>
                    <span className="text-red-500">Hidden</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Email</span>
                    <span className="text-red-500">Hidden</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Phone</span>
                    <span className="text-red-500">Hidden</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Current Employer</span>
                    <span className="text-red-500">Hidden</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Region</span>
                    <span className="text-green-500">Visible (e.g., Rotterdam Area)</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Skills</span>
                    <span className="text-green-500">Visible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Employers */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Structured Offer Example</h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">Senior Electrician</h4>
                          <p className="text-sm text-gray-500">Industrial Projects</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          €54,000 - €58,000
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Contract:</span>
                          <span className="ml-2 text-gray-900">Permanent</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Hours:</span>
                          <span className="ml-2 text-gray-900">40/week</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Vacation:</span>
                          <span className="ml-2 text-gray-900">30 days</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pension:</span>
                          <span className="ml-2 text-gray-900">8%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">For Employers</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Access to passive candidates who aren't actively applying</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Stand out with transparent, competitive offers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Direct contact after offer acceptance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">Verified KvK registration builds trust</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Join the reverse marketplace where workers have leverage and employers compete with real offers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=worker"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Create Worker Profile
              </Link>
              <Link
                href="/register?role=employer"
                className="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-blue-500 hover:bg-blue-800 transition-colors"
              >
                Register as Employer
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">O</span>
              </div>
              <span className="text-white font-semibold">OfferMarket</span>
            </div>
            <p className="text-sm">© 2026 OfferMarket. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
