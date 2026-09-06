import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create initial admin user
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@offermarket.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        phoneVerified: true,
        status: 'ACTIVE',
      },
    });

    console.log(`✅ Created admin user: ${admin.email}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // Create initial support user
  const supportEmail = process.env.INITIAL_SUPPORT_EMAIL || 'support@offermarket.com';
  const supportPassword = process.env.INITIAL_SUPPORT_PASSWORD || 'Support123!';

  const existingSupport = await prisma.user.findUnique({
    where: { email: supportEmail },
  });

  if (!existingSupport) {
    const passwordHash = await bcrypt.hash(supportPassword, 10);

    const support = await prisma.user.create({
      data: {
        email: supportEmail,
        passwordHash,
        role: 'SUPPORT',
        emailVerified: true,
        phoneVerified: true,
        status: 'ACTIVE',
      },
    });

    console.log(`✅ Created support user: ${support.email}`);
  } else {
    console.log(`ℹ️  Support user already exists: ${supportEmail}`);
  }

  // Create some default platform settings
  const defaultSettings = [
    { key: 'platform.maintenance_mode', value: false, category: 'general' },
    { key: 'platform.registration_enabled', value: true, category: 'general' },
    { key: 'platform.min_offer_salary', value: 30000, category: 'offers' },
    { key: 'platform.max_offer_salary', value: 200000, category: 'offers' },
    { key: 'platform.offer_expiry_days', value: 14, category: 'offers' },
    { key: 'email.verification_required', value: true, category: 'email' },
    { key: 'email.welcome_enabled', value: true, category: 'email' },
    // Billing settings
    { key: 'introduction_fee_cents', value: 49900, category: 'billing' },
    { key: 'vat_rate_pct', value: 21, category: 'billing' },
    { key: 'invoice_payment_terms_days', value: 14, category: 'billing' },
    { key: 'invoice_bank_account_iban', value: '', category: 'billing' },
    { key: 'invoice_bank_account_name', value: 'OfferMarket B.V.', category: 'billing' },
    { key: 'invoice_prefix', value: 'INV', category: 'billing' },
    // Referral program (single JSON knob edited from the admin console; see
    // modules/referrals/referral-settings.ts). amountMinor is integer minor
    // units (cents) — matches the billing settings convention. qualification
    // rule 'email_verified' is the only rule implemented; the value is stored
    // so future rules can be added without a settings migration.
    {
      key: 'referral_program',
      category: 'referral',
      value: {
        enabled: true,
        rewardsEnabled: true,
        recurringRewards: true,
        threshold: 5,
        rewardType: 'gift_card',
        rewardAmountMinor: 2500,
        rewardCurrency: 'EUR',
        qualificationRule: 'email_verified',
      },
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.adminSettings.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
    });
  }

  console.log('✅ Created default platform settings');

  // --------------------------------------------------------------------
  // Offermarket Insights: official source registry + editorial starter content.
  // Data-integrity rule: no market numbers are seeded. The example articles
  // are EDITORIAL (class 4) so nothing data-shaped exists until real
  // marketplace data can support it (see docs/insights-architecture.md §0).
  // --------------------------------------------------------------------
  const officialSources = [
    { name: 'CBS — Salarisindex', url: 'https://www.cbs.nl/nl-nl/onderzoek/salarisindex', publisher: 'Centraal Bureau voor de Statistiek', sourceType: 'CBS' },
    { name: 'CBS — Vacaturestatistiek', url: 'https://www.cbs.nl/nl-nl/onderzoek/vacatures', publisher: 'Centraal Bureau voor de Statistiek', sourceType: 'CBS' },
    { name: 'UWV — Arbeidsmarktinformatie', url: 'https://www.uwv.nl/overuwv/kennis-en-cijfers/arbeidsmarktinformatie', publisher: 'UWV', sourceType: 'UWV' },
    { name: 'RVO — Subsidies en regelingen', url: 'https://www.rvo.nl/subsidies-regelingen', publisher: 'Rijksdienst voor ondernemend Nederland', sourceType: 'RVO' },
    { name: 'Rijksoverheid — Arbeidsmarktbeleid', url: 'https://www.rijksoverheid.nl/onderwerpen/arbeidsmarkt', publisher: 'Rijksoverheid', sourceType: 'DUTCH_GOVERNMENT' },
    { name: 'Eurostat — Employment and wages', url: 'https://ec.europa.eu/eurostat/web/labour-market', publisher: 'European Commission — Eurostat', sourceType: 'EUROSTAT' },
    { name: 'European Commission — Skills and labour market', url: 'https://commission.europa.eu/employment-social/european-skills-agenda_en', publisher: 'European Commission', sourceType: 'EUROPEAN_COMMISSION' },
  ];
  for (const src of officialSources) {
    await prisma.insightSource.upsert({
      where: { name_url: { name: src.name, url: src.url } },
      create: src as any,
      update: {},
    });
  }
  console.log('✅ Seeded official insight sources');

  const editorialSeed = [
    {
      slug: 'why-offermarket-insights-exists',
      title: 'Why Offermarket Insights exists',
      category: 'INDUSTRY',
      summary:
        'Skilled professionals deserve the same market intelligence employers have always had. Here is how Insights works, what data we use, and what we refuse to show.',
      content:
        '## The information gap\n\nEmployers have always had salary benchmarks, headhunter reports and vacancy analytics. Skilled professionals have had job ads — written by the employer.\n\nOffermarket Insights exists to close that gap. Every insight we publish is built on four kinds of data, and we label which one you are reading:\n\n1. **Offermarket marketplace data** — aggregates computed from real, verified offers submitted on the platform.\n2. **Official public data** — CBS, UWV, RVO, the Dutch government, Eurostat and the European Commission, always linked to the original source.\n3. **Industry data** — third-party research, summarized and attributed, never republished.\n4. **Editorial analysis** — like this article: our own analysis, making no data claims.\n\n## What we refuse to do\n\nWe do not show a salary number unless enough real offers support it. We do not present third-party data as our own. We never expose an individual worker or employer. Every data-driven insight carries its sample size, data period, geographic scope and methodology.\n\nThat is the whole product: numbers you can defend, and honesty about the ones we do not have yet.',
      dataClass: 'EDITORIAL',
    },
    {
      slug: 'how-offermarket-salary-data-is-built',
      title: 'How Offermarket salary data is built (and when we show it)',
      category: 'SALARY',
      summary:
        'Offermarket salary intelligence is computed exclusively from verified offers on the platform. This editorial explains the method, and the minimum sample sizes we require before showing any number.',
      content:
        '## The method\n\nWhen you send a structured offer on Offermarket, it carries its full compensation: base salary, allowances, vehicle, tools, schedule. From submitted offers we compute percentile ranges (P25–P75) per profession and region — nothing else goes in.\n\n## The sample-size contract\n\nWe show a salary range only when at least 30 relevant offers exist in the period. A trend number requires 60 offers across both compared windows. Below those thresholds you will see "insufficient data" — by design.\n\n## What is coming\n\nAs the marketplace grows, salary intelligence will appear here per profession and per region, always labeled as Offermarket marketplace data with its sample size and period. When the sample is too small, we say so.',
      dataClass: 'EDITORIAL',
    },
    {
      slug: 'reading-offermarket-insights-data-classes',
      title: 'The four data classes on Offermarket Insights',
      category: 'CAREER',
      summary:
        'Offermarket marketplace data, official public data, industry data and editorial analysis are four different things. Learn to read the labels — it changes how you use the numbers.',
      content:
        '## Why labels matter\n\nA salary range computed from real offers and a salary figure quoted from a vendor report are not the same kind of fact. On Offermarket Insights every statistic carries a data-class badge:\n\n- **Offermarket data** — computed from verified offers on this platform, with sample size and period.\n- **Official data** — CBS, UWV, RVO, Dutch government, Eurostat, European Commission; linked to the original.\n- **Industry data** — third-party research, summarized with attribution and a link.\n- **Editorial** — our analysis and opinion; no data claims.\n\n## The practical rule\n\nTrust official data for the big picture, Offermarket data for what employers are actually offering, and editorial for interpretation. If a number has no label or no source, it should not be there — tell us.',
      dataClass: 'EDITORIAL',
    },
  ];
  for (const article of editorialSeed) {
    await prisma.insightArticle.upsert({
      where: { slug: article.slug },
      create: {
        ...article,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorName: 'Offermarket Editorial',
        metaDescription: article.summary,
        seoTitle: article.title,
      } as any,
      update: {},
    });
  }
  console.log('✅ Seeded editorial starter insights');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
