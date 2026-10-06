// The ledger: every movement of money, newest first.
//   IN  = a PAID contribution (dated by when it was paid)
//   OUT = an expense (dated by the expense date)
//   OUT = money borrowed by a member (BORROWED, dated by the borrowed date) — not an expense
//   IN  = borrowed money given back (BORROW_RETURN, dated by the returned date)
// UNPAID contributions are not transactions, because no money moved.
const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { ZERO, toMoney, toDecimal } = require('../utils/money');
const { formatMonth, toDateString, periodRange } = require('../utils/date');

async function listTransactions(query) {
  const type = query.type ? validate.oneOf(query.type, 'Type', ['CONTRIBUTION', 'EXPENSE', 'BORROWED']) : null;
  const year = query.year ? validate.year(query.year) : null;
  const month = query.month ? validate.month(query.month) : null;
  const memberId = query.memberId ? validate.id(query.memberId, 'Member') : null;
  if (month && !year) throw new AppError('Please choose a year when filtering by month');

  // A member filter applies to contributions and borrowed money (expenses don't belong to a member).
  const includeContributions = !type || type === 'CONTRIBUTION';
  const includeExpenses = (!type || type === 'EXPENSE') && !memberId;
  const includeBorrowed = !type || type === 'BORROWED';

  const contributionWhere = { status: 'PAID' };
  if (year) contributionWhere.paidAt = periodRange(year, month, { utc: false });
  if (memberId) contributionWhere.userId = memberId;

  const expenseWhere = {};
  if (year) expenseWhere.date = periodRange(year, month, { utc: true });

  // A borrowed record can add two rows (the loan and its return), each filtered by its own date.
  const borrowedWhere = memberId ? { memberId } : {};
  const inPeriod = (date) => {
    if (!year) return true;
    const range = periodRange(year, month, { utc: true });
    return date >= range.gte && date < range.lt;
  };

  let totalIn = ZERO;
  let totalOut = ZERO;

  const [contributions, expenses, borrowed] = await Promise.all([
    includeContributions
      ? prisma.monthlyContribution.findMany({ where: contributionWhere, include: { user: { select: { id: true, name: true } } } })
      : [],
    includeExpenses ? prisma.expense.findMany({ where: expenseWhere }) : [],
    includeBorrowed
      ? prisma.borrowed.findMany({ where: borrowedWhere, include: { member: { select: { id: true, name: true } } } })
      : [],
  ]);

  const borrowedRows = [];
  for (const b of borrowed) {
    if (inPeriod(b.borrowedAt)) {
      totalOut = totalOut.plus(b.amount);
      borrowedRows.push({
        id: b.id,
        type: 'BORROWED',
        direction: 'OUT',
        title: `${b.member.name} borrowed from the group`,
        description: b.purpose,
        amount: toMoney(b.amount),
        date: toDateString(b.borrowedAt),
        member: b.member,
        period: null,
        sortDate: b.borrowedAt,
        createdAt: b.createdAt,
      });
    }
    if (b.status === 'RETURNED' && b.returnedAt && inPeriod(b.returnedAt)) {
      totalIn = totalIn.plus(b.amount);
      borrowedRows.push({
        id: `${b.id}-return`,
        type: 'BORROW_RETURN',
        direction: 'IN',
        title: `${b.member.name} returned borrowed money`,
        description: b.purpose,
        amount: toMoney(b.amount),
        date: toDateString(b.returnedAt),
        member: b.member,
        period: null,
        sortDate: b.returnedAt,
        createdAt: b.updatedAt,
      });
    }
  }

  const items = [
    ...contributions.map((c) => {
      const baseVal = toDecimal(c.amount);
      const fineVal = toDecimal(c.fineAmount || 0);
      const totalPaid = baseVal.plus(fineVal);
      totalIn = totalIn.plus(totalPaid);
      const hasFine = fineVal.gt(0);
      return {
        id: c.id,
        type: 'CONTRIBUTION',
        direction: 'IN',
        title: `${c.user.name} paid ${formatMonth(c.month, c.year)} contribution`,
        description: hasFine
          ? `Contribution ₹${baseVal.toFixed(0)} + Fine ₹${fineVal.toFixed(0)} = Total ₹${totalPaid.toFixed(0)}`
          : null,
        amount: toMoney(totalPaid),
        baseAmount: toMoney(baseVal),
        fineAmount: toMoney(fineVal),
        totalAmount: toMoney(totalPaid),
        date: c.paidAt.toISOString(),
        paymentDate: c.paymentDate ? toDateString(c.paymentDate) : null,
        member: c.user,
        period: { month: c.month, year: c.year, label: formatMonth(c.month, c.year) }, // which month this payment was for
        sortDate: c.paidAt,
        createdAt: c.createdAt,
      };
    }),
    ...expenses.map((e) => {
      totalOut = totalOut.plus(e.amount);
      return {
        id: e.id,
        type: 'EXPENSE',
        direction: 'OUT',
        title: e.title,
        description: e.description,
        amount: toMoney(e.amount),
        date: toDateString(e.date),
        member: null,
        period: null,
        sortDate: e.date,
        createdAt: e.createdAt,
      };
    }),
    ...borrowedRows,
  ]
    // Newest first. If two items have the same date, the one entered later comes first.
    .sort((a, b) => b.sortDate - a.sortDate || b.createdAt - a.createdAt)
    .map(({ sortDate, createdAt, ...rest }) => rest); // eslint-disable-line no-unused-vars

  return {
    items,
    total: items.length,
    totals: { in: toMoney(totalIn), out: toMoney(totalOut), net: toMoney(totalIn.minus(totalOut)) },
  };
}

module.exports = { listTransactions };
