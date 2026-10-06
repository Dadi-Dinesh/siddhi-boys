// Money temporarily borrowed from the group by a member.
// Borrowed money is NOT an expense: while a record is BORROWED its amount is subtracted
// from the available balance (see getFundTotals); once RETURNED it no longer is.
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { toDecimal, toMoney } = require('../utils/money');
const { toDateString, isFutureDate } = require('../utils/date');
const { getFundTotals } = require('./summaryService');

const include = { member: { select: { id: true, name: true } } };

function formatBorrowed(b) {
  return {
    id: b.id,
    member: b.member,
    amount: toMoney(b.amount),
    borrowedAt: toDateString(b.borrowedAt), // "2026-10-10"
    purpose: b.purpose,
    status: b.status,
    returnedAt: b.returnedAt ? toDateString(b.returnedAt) : null,
    createdAt: b.createdAt,
  };
}

// A date that is valid and not later than today.
function pastOrToday(value, field) {
  const date = validate.dateOnly(value, field);
  if (isFutureDate(value)) throw new AppError(`${field} cannot be in the future`);
  return date;
}

function summaryFrom(totals) {
  return {
    totalBorrowed: totals.totalBorrowed,
    totalReturned: totals.totalReturnedBorrowed,
    currentlyBorrowed: totals.currentlyBorrowed,
    availableBalance: totals.currentBalance,
  };
}

// Every record (newest first) plus the summary totals. Visible to all logged-in users.
async function listBorrowed() {
  const [records, totals] = await Promise.all([
    prisma.borrowed.findMany({ include, orderBy: [{ borrowedAt: 'desc' }, { createdAt: 'desc' }] }),
    getFundTotals(),
  ]);
  return { items: records.map(formatBorrowed), total: records.length, summary: summaryFrom(totals) };
}

async function findBorrowedOrFail(id) {
  validate.id(id, 'Borrowed record');
  const record = await prisma.borrowed.findUnique({ where: { id }, include });
  if (!record) throw new AppError('Borrowed record not found', 404);
  return record;
}

async function getBorrowed(id) {
  return formatBorrowed(await findBorrowedOrFail(id));
}

// Admin records money given to an active member.
async function createBorrowed(body) {
  const memberId = validate.id(body.memberId, 'Member');
  const amount = validate.amount(body.amount);
  const borrowedAt = pastOrToday(body.borrowedAt, 'Borrowed date');
  const purpose = validate.text(body.purpose, 'Purpose', { required: false, max: 300 });

  const member = await prisma.user.findFirst({ where: { id: memberId, role: 'MEMBER' }, select: { isActive: true } });
  if (!member) throw new AppError('Member not found', 404);
  if (!member.isActive) throw new AppError('This member is inactive');

  // The group can't lend money it doesn't have.
  const { currentBalance } = await getFundTotals();
  if (amount.gt(toDecimal(currentBalance))) {
    throw new AppError(`Amount is more than the available balance (₹${currentBalance})`);
  }

  const record = await prisma.borrowed.create({
    data: { memberId, amount, borrowedAt, purpose, status: 'BORROWED' },
    include,
  });
  return formatBorrowed(record);
}

// Admin marks the full amount as returned. No expense or other record is created:
// the status change alone puts the money back into the available balance.
async function markReturned(id, body) {
  const record = await findBorrowedOrFail(id);
  if (record.status === 'RETURNED') throw new AppError('This amount is already marked as returned');

  const returnedAt = pastOrToday(body.returnedAt, 'Returned date');
  if (returnedAt < record.borrowedAt) throw new AppError('Returned date cannot be before the borrowed date');

  const updated = await prisma.borrowed.update({
    where: { id },
    data: { status: 'RETURNED', returnedAt },
    include,
  });
  return formatBorrowed(updated);
}

// Admin removes a record entered by mistake.
async function deleteBorrowed(id) {
  await findBorrowedOrFail(id);
  await prisma.borrowed.delete({ where: { id } });
}

module.exports = { listBorrowed, getBorrowed, createBorrowed, markReturned, deleteBorrowed, formatBorrowed };
