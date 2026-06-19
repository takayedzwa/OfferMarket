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
  ];

  for (const setting of defaultSettings) {
    await prisma.adminSettings.upsert({
      where: { key: setting.key },
      create: setting,
      update: {},
    });
  }

  console.log('✅ Created default platform settings');

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
