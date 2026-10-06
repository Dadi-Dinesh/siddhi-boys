// Development seed data. Safe to run more than once (it uses upserts),
// so running it again will not create duplicates.
//
//   npm run db:seed
//
// ⚠️  These are DEVELOPMENT credentials only. Change them before real use.

const path = require('path');
// Load the single unified .env from the project root, with fallback to local backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
require('dotenv').config({ quiet: true });

// Never put the well-known development logins into a production database by accident.
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_SEED !== 'true') {
  console.error('Refusing to seed: NODE_ENV is production. This script creates development accounts with known passwords.');
  process.exit(1);
}

const prisma = require('../src/config/prisma');
const { hashPassword } = require('../src/utils/password');

const ADMIN = { name: 'Batch Admin', email: 'admin@batchfund.local', password: 'ChangeMe123!' };
const MEMBER_PASSWORD = 'Member123!';

// Sample month: October 2026. paidDay = day of the month they paid, null = unpaid.
const SAMPLE_MONTH = 10;
const SAMPLE_YEAR = 2026;
const MEMBERS = [
  { name: 'Rahul', paidDay: 1 },
  { name: 'Arjun', paidDay: 2 },
  { name: 'Sai', paidDay: null },
  { name: 'Kiran', paidDay: 3 },
  { name: 'Vamsi', paidDay: null },
];

const EXPENSES = [
  { title: 'Birthday Cake', description: "Cake for Rahul's birthday", amount: '500', date: '2026-10-02' },
  { title: 'Decoration', description: 'Balloons and banners', amount: '300', date: '2026-10-02' },
  { title: 'Snacks', description: 'Snacks for the get-together', amount: '200', date: '2026-10-03' },
];

// Create the user if missing. If they already exist, leave them unchanged
// (so re-running the seed never resets a password someone changed).
async function upsertUser({ name, email, password, role }) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, role, password: await hashPassword(password) },
  });
}

async function main() {
  // 1. Group settings (single row, id = 1)
  const settings = await prisma.groupSettings.upsert({
    where: { id: 1 },
    update: { groupName: 'SiddhiBoys' },
    create: { id: 1, groupName: 'SiddhiBoys', monthlyContribution: '100' },
  });

  // 2. Admin
  const admin = await upsertUser({ ...ADMIN, role: 'ADMIN' });

  // 3. Members + their October contribution
  for (const m of MEMBERS) {
    const user = await upsertUser({
      name: m.name,
      email: `${m.name.toLowerCase()}@batchfund.local`,
      password: MEMBER_PASSWORD,
      role: 'MEMBER',
    });

    const isPaid = m.paidDay !== null;
    await prisma.monthlyContribution.upsert({
      where: { userId_month_year: { userId: user.id, month: SAMPLE_MONTH, year: SAMPLE_YEAR } },
      update: {},
      create: {
        userId: user.id,
        month: SAMPLE_MONTH,
        year: SAMPLE_YEAR,
        amount: settings.monthlyContribution, // taken from settings, not hardcoded
        status: isPaid ? 'PAID' : 'UNPAID',
        paidAt: isPaid ? new Date(Date.UTC(SAMPLE_YEAR, SAMPLE_MONTH - 1, m.paidDay, 5, 30)) : null,
      },
    });
  }

  // 4. Expenses (expenses have no natural unique key, so check before creating)
  for (const e of EXPENSES) {
    const date = new Date(e.date);
    const exists = await prisma.expense.findFirst({ where: { title: e.title, date } });
    if (!exists) {
      await prisma.expense.create({ data: { ...e, date, createdById: admin.id } });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    contributions: await prisma.monthlyContribution.count(),
    expenses: await prisma.expense.count(),
    settings: await prisma.groupSettings.count(),
  };
  console.log('Seed complete:', counts);
  console.log('\n⚠️  Development logins (change before real use):');
  console.log(`   Admin:   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`   Members: rahul@batchfund.local (etc.) / ${MEMBER_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
