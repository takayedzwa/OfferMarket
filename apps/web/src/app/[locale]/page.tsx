import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default async function Home() {
  const t = await getTranslations("common.home");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {t("hero.title")}
                <span className="text-blue-600">{t("hero.titleHighlight")}</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register?role=worker"
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                >
                  {t("hero.ctaWorker")}
                </Link>
                <Link
                  href="/register?role=employer"
                  className="bg-white text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-600 transition-colors"
                >
                  {t("hero.ctaEmployer")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">{t("howItWorks.title")}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">👤</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("howItWorks.step1Title")}</h3>
                <p className="text-gray-600">
                  {t("howItWorks.step1Body")}
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">💼</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("howItWorks.step2Title")}</h3>
                <p className="text-gray-600">
                  {t("howItWorks.step2Body")}
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">✅</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{t("howItWorks.step3Title")}</h3>
                <p className="text-gray-600">
                  {t("howItWorks.step3Body")}
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
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t("forWorkers.title")}</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forWorkers.benefit1")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forWorkers.benefit2")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forWorkers.benefit3")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forWorkers.benefit4")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forWorkers.benefit5")}</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold text-gray-900">{t("forWorkers.privacyTitle")}</h3>
                </div>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("forWorkers.fieldName")}</span>
                    <span className="text-red-500">{t("forWorkers.hidden")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("forWorkers.fieldEmail")}</span>
                    <span className="text-red-500">{t("forWorkers.hidden")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("forWorkers.fieldPhone")}</span>
                    <span className="text-red-500">{t("forWorkers.hidden")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("forWorkers.fieldCurrentEmployer")}</span>
                    <span className="text-red-500">{t("forWorkers.hidden")}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("forWorkers.fieldRegion")}</span>
                    <span className="text-green-500">{t("forWorkers.regionExample")}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>{t("forWorkers.fieldSkills")}</span>
                    <span className="text-green-500">{t("forWorkers.visible")}</span>
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">{t("forEmployers.offerExampleTitle")}</h3>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{t("forEmployers.offerJobTitle")}</h4>
                          <p className="text-sm text-gray-500">{t("forEmployers.offerCategory")}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          {t("forEmployers.salaryRange")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">{t("forEmployers.contractLabel")}</span>
                          <span className="ml-2 text-gray-900">{t("forEmployers.contractValue")}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t("forEmployers.hoursLabel")}</span>
                          <span className="ml-2 text-gray-900">{t("forEmployers.hoursValue")}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t("forEmployers.vacationLabel")}</span>
                          <span className="ml-2 text-gray-900">{t("forEmployers.vacationValue")}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{t("forEmployers.pensionLabel")}</span>
                          <span className="ml-2 text-gray-900">{t("forEmployers.pensionValue")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">{t("forEmployers.title")}</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forEmployers.benefit1")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forEmployers.benefit2")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forEmployers.benefit3")}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 text-xl">✓</span>
                    <span className="text-gray-700">{t("forEmployers.benefit4")}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{t("cta.title")}</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register?role=worker"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                {t("cta.workerProfile")}
              </Link>
              <Link
                href="/register?role=employer"
                className="bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-blue-500 hover:bg-blue-800 transition-colors"
              >
                {t("cta.registerEmployer")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}