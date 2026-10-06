// All financial totals are calculated here, from the actual records,
// every time they are requested. Nothing is stored as a running total,
// so the numbers can never get out of sync with the data.
const prisma = require('../config/prisma');
const { ZERO, toDecimal, toMoney, percentage } = require('../utils/money');
const { formatMonth, currentMonthYear, toDateString } = require('../utils/date');
const { getSettings } = require('./settingsService');

function emptyMonth(month, year) {
  return {
    month, year, label: formatMonth(month, year),
    expected: 0, collected: 0, pending: 0,
    paidMembers: 0, unpaidMembers: 0, totalMembers: 0,
  };
}

// Per-month summaries, newest first. Only months that have contribution records appear.
// "Expected" uses the amount stored on each record, so old months keep their old amount
// even if the monthly contribution setting changes later.
async function getMonthlySummaries(where = {}) {
  // One query: totals grouped by (year, month, status)
  const groups = await prisma.monthlyContribution.groupBy({
    by: ['year', 'month', 'status'],
    where,
    _sum: { amount: true, fineAmount: true },
    _count: { _all: true },
  });

  const months = new Map();
  for (const g of groups) {
    const key = `${g.year}-${g.month}`;
    if (!months.has(key)) months.set(key, { month: g.month, year: g.year, expected: ZERO, collected: ZERO, paid: 0, unpaid: 0 });
    const m = months.get(key);
    const sumAmount = toDecimal(g._sum.amount);
    const sumFine = toDecimal(g._sum.fineAmount || 0);
    m.expected = m.expected.plus(sumAmount);
    if (g.status === 'PAID') {
      m.collected = m.collected.plus(sumAmount).plus(sumFine);
      m.paid += g._count._all;
    } else {
      m.unpaid += g._count._all;
    }
  }

  return [...months.values()]
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .map((m) => ({
      month: m.month,
      year: m.year,
      label: formatMonth(m.month, m.year),
      expected: toMoney(m.expected),
      collected: toMoney(m.collected),
      pending: toMoney(m.expected.minus(m.collected)),
      paidMembers: m.paid,
      unpaidMembers: m.unpaid,
      totalMembers: m.paid + m.unpaid,
      collectionPercent: percentage(m.collected, m.expected), // e.g. 87.5, or null if nothing expected
    }));
}

async function getMonthSummary(year, month) {
  const [summary] = await getMonthlySummaries({ year, month });
  return summary || emptyMonth(month, year);
}

async function getCurrentMonthSummary() {
  const { month, year } = currentMonthYear();
  return getMonthSummary(year, month);
}

// Whole-fund totals. This is the single source of truth for the group's money.
//   Total collected   = PAID contributions (base + fines). Unpaid/pending/declined never count.
//   Currently borrowed = borrowed money not yet returned (it is NOT an expense)
//   Available balance  = total collected − total expenses − currently borrowed
// (returned borrowed money is back in the fund, so it is not subtracted.)
async function getFundTotals() {
  const [activeMembers, expected, collected, expenses, borrowed, pendingVerifications] = await Promise.all([
    prisma.user.count({ where: { role: 'MEMBER', isActive: true } }),
    prisma.monthlyContribution.aggregate({ _sum: { amount: true } }),
    prisma.monthlyContribution.aggregate({ where: { status: 'PAID' }, _sum: { amount: true, fineAmount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.borrowed.groupBy({ by: ['status'], _sum: { amount: true } }),
    prisma.paymentVerification.count({ where: { status: 'PENDING' } }),
  ]);

  const totalExpected = toDecimal(expected._sum.amount);
  const totalBaseCollected = toDecimal(collected._sum.amount);
  const totalFinesCollected = toDecimal(collected._sum.fineAmount || 0);
  const totalCollected = totalBaseCollected.plus(totalFinesCollected);
  const totalExpenses = toDecimal(expenses._sum.amount);
  const borrowedSum = (status) => toDecimal(borrowed.find((b) => b.status === status)?._sum.amount);
  const currentlyBorrowed = borrowedSum('BORROWED');
  const totalReturnedBorrowed = borrowedSum('RETURNED');

  return {
    totalMembers: activeMembers,
    totalExpected: toMoney(totalExpected),
    totalBaseCollected: toMoney(totalBaseCollected),
    totalFinesCollected: toMoney(totalFinesCollected),
    totalCollected: toMoney(totalCollected),
    totalPending: toMoney(totalExpected.minus(totalBaseCollected)),
    totalExpenses: toMoney(totalExpenses),
    totalBorrowed: toMoney(currentlyBorrowed.plus(totalReturnedBorrowed)), // every amount ever lent
    totalReturnedBorrowed: toMoney(totalReturnedBorrowed),
    currentlyBorrowed: toMoney(currentlyBorrowed),
    currentBalance: toMoney(totalCollected.minus(totalExpenses).minus(currentlyBorrowed)), // available balance
    pendingVerifications,
  };
}

// One member's personal totals.
async function getMemberTotals(userId) {
  const [paid, unpaid, paidCount, unpaidCount] = await Promise.all([
    prisma.monthlyContribution.aggregate({ where: { userId, status: 'PAID' }, _sum: { amount: true, fineAmount: true } }),
    prisma.monthlyContribution.aggregate({ where: { userId, status: 'UNPAID' }, _sum: { amount: true } }),
    prisma.monthlyContribution.count({ where: { userId, status: 'PAID' } }),
    prisma.monthlyContribution.count({ where: { userId, status: 'UNPAID' } }),
  ]);
  const totalBaseContributed = toDecimal(paid._sum.amount);
  const totalFinesPaid = toDecimal(paid._sum.fineAmount || 0);
  const totalContributed = totalBaseContributed.plus(totalFinesPaid);
  return {
    totalContributed: toMoney(totalContributed),
    totalBaseContributed: toMoney(totalBaseContributed),
    totalFinesPaid: toMoney(totalFinesPaid),
    totalPending: toMoney(unpaid._sum.amount), // what this member still owes (all unpaid months)
    monthsPaid: paidCount,
    monthsUnpaid: unpaidCount,
  };
}


// What any logged-in member may see about the group: totals, this month's progress,
// and recent expenses. No individual members' payment details are included.
async function getGroupSummary() {
  const [settings, totals, currentMonth, recentExpenses] = await Promise.all([
    getSettings(),
    getFundTotals(),
    getCurrentMonthSummary(),
    prisma.expense.findMany({ orderBy: [{ date: 'desc' }, { createdAt: 'desc' }], take: 10 }),
  ]);

  return {
    groupName: settings.groupName,
    monthlyContribution: toMoney(settings.monthlyContribution),
    activeMembers: totals.totalMembers,
    totalCollected: totals.totalCollected,
    totalExpenses: totals.totalExpenses,
    currentlyBorrowed: totals.currentlyBorrowed,
    currentBalance: totals.currentBalance,
    currentMonth,
    recentExpenses: recentExpenses.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      amount: toMoney(e.amount),
      date: toDateString(e.date),
    })),
  };
}

module.exports = {
  getMonthlySummaries, getMonthSummary, getCurrentMonthSummary, getFundTotals, getMemberTotals, getGroupSummary,
};
