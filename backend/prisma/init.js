// Production database initialisation. Never runs automatically: start it yourself.
//
//   npm run db:init                  Safe. Creates the group settings and the admin account
//                                    if they don't exist yet. Never deletes anything.
//
//   npm run db:reset-data -- --yes   DESTRUCTIVE. Deletes ALL data (members, contributions,
//                                    payment verifications, expenses, borrowed records,
//                                    settings), then creates only the admin account.
//                                    Tables and migrations are kept.
//
// The admin login comes from ADMIN_EMAIL and ADMIN_PASSWORD in the .env file,
// so no password is ever written in the code. No demo data is ever created.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
require('dotenv').config({ quiet: true });

const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/utils/password');

const ADMIN_NAME = 'SiddhiBoys Admin';
const reset = process.argv.includes('--reset');
const confirmed = process.argv.includes('--yes');

function adminDetails() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the .env file.');
  }
  return { email, password };
}

// Deletes every row, children before parents, in one transaction (all or nothing).
async function clearAllData() {
  await prisma.$transaction([
    prisma.paymentVerification.deleteMany(),
    prisma.borrowed.deleteMany(),
    prisma.monthlyContribution.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.user.deleteMany(),
    prisma.groupSettings.deleteMany(),
  ]);
}

async function main() {
  const admin = adminDetails();

  if (reset) {
    if (!confirmed) {
      console.error('This deletes ALL data in the database. To continue run:  npm run db:reset-data -- --yes');
      process.exitCode = 1;
      return;
    }
    await clearAllData();
    console.log('All existing data deleted.');
  }

  // Group settings: one row with the schema defaults (SiddhiBoys, ₹100, due on the 10th, ₹20 fine).
  await prisma.groupSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });

  // Admin: created only if missing. An existing admin's password is never changed.
  const existing = await prisma.user.findUnique({ where: { email: admin.email } });
  if (existing) {
    console.log(`Admin account already exists: ${admin.email}`);
  } else {
    await prisma.user.create({
      data: { name: ADMIN_NAME, email: admin.email, role: 'ADMIN', password: await hashPassword(admin.password) },
    });
    console.log(`Admin account created: ${admin.email}`);
  }

  const counts = {
    users: await prisma.user.count(),
    contributions: await prisma.monthlyContribution.count(),
    paymentVerifications: await prisma.paymentVerification.count(),
    expenses: await prisma.expense.count(),
    borrowed: await prisma.borrowed.count(),
  };
  console.log('Database now contains:', counts);
}

main()
  .catch((err) => {
    console.error('Initialisation failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
