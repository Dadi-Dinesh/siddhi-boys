// Financial reports for the admin. Everything here is worked out from the existing
// MonthlyContribution and Expense records — nothing is stored separately.
const prisma = require('../config/prisma');
const validate = require('../utils/validate');
const { toDecimal, toMoney, percentage } = require('../utils/money');
const { currentMonthYear, toDateString } = require('../utils/date');
const { getMonthlySummaries, getFundTotals } = require('./summaryService');

const PERIODS = ['3', '6', '12']; // "last N months"; anything else means all time

// The calendar window for "last N months", ending with the current month (inclusive).
// Returns Prisma filters for contributions (by their month) and expenses (by their date).
function periodFilters(months) {
  if (!months) return { contributionWhere: {}, expenseWhere: {} };

  const { month: cm, year: cy } = currentMonthYear();
  const start = new Date(Date.UTC(cy, cm - 1 - (months - 1), 1)); // first day of the first month
  const end = new Date(Date.UTC(cy, cm, 1)); // first day after the current month
  const sy = start.getUTCFullYear();
  const sm = start.getUTCMonth() + 1;

  return {
    contributionWhere: {
      AND: [
        { OR: [{ year: { gt: sy } }, { year: sy, month: { gte: sm } }] }, // on/after the start month
        { OR: [{ year: { lt: cy } }, { year: cy, month: { lte: cm } }] }, // on/before the current month
      ],
    },
    expenseWhere: { date: { gte: start, lt: end } },
  };
}

function formatExpense(e) {
  return e ? { title: e.title, amount: toMoney(e.amount), date: toDateString(e.date) } : null;
}

async function getReport(query) {
  const months = query.months && query.months !== 'all' ? Number(validate.oneOf(query.months, 'Period', PERIODS)) : null;
  const { contributionWhere, expenseWhere } = periodFilters(months);
  const paidWhere = { ...contributionWhere, status: 'PAID' };
  const unpaidWhere = { ...contributionWhere, status: 'UNPAID' };

  const [monthly, expected, collected, paidCount, unpaidCount, expenseTotals, highest, latest, fund, anyContribution, anyExpense] =
    await Promise.all([
      getMonthlySummaries(contributionWhere), // one grouped query for every month
      prisma.monthlyContribution.aggregate({ where: contributionWhere, _sum: { amount: true } }),
      prisma.monthlyContribution.aggregate({ where: paidWhere, _sum: { amount: true, fineAmount: true } }),
      prisma.monthlyContribution.count({ where: paidWhere }),
      prisma.monthlyContribution.count({ where: unpaidWhere }),
      prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true }, _count: { _all: true } }),
      prisma.expense.findFirst({ where: expenseWhere, orderBy: [{ amount: 'desc' }, { date: 'desc' }] }),
      prisma.expense.findFirst({ where: expenseWhere, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
      getFundTotals(), // all-time balance, same numbers as the dashboard
      prisma.monthlyContribution.count(),
      prisma.expense.count(),
    ]);

  const totalExpected = toDecimal(expected._sum.amount);
  const totalBaseCollected = toDecimal(collected._sum.amount);
  const totalFinesCollected = toDecimal(collected._sum.fineAmount || 0);
  const totalCollected = totalBaseCollected.plus(totalFinesCollected);
  const totalExpenses = toDecimal(expenseTotals._sum.amount);

  // Best / lowest month: only months that have started (not months created in advance,
  // where nothing is due yet), where something was expected, and only if there are 2+.
  const { month: nowMonth, year: nowYear } = currentMonthYear();
  const started = (m) => m.year < nowYear || (m.year === nowYear && m.month <= nowMonth);
  const comparable = monthly.filter((m) => m.collectionPercent !== null && started(m)); // newest first
  let bestMonth = null;
  let lowestMonth = null;
  if (comparable.length >= 2) {
    bestMonth = comparable.reduce((best, m) => (m.collectionPercent > best.collectionPercent ? m : best));
    lowestMonth = comparable.reduce((low, m) => (m.collectionPercent < low.collectionPercent ? m : low));
    if (bestMonth.collectionPercent === lowestMonth.collectionPercent) bestMonth = lowestMonth = null; // all equal: no insight
  }
  const pick = (m) => m && { month: m.month, year: m.year, label: m.label, collectionPercent: m.collectionPercent };

  return {
    period: months ? String(months) : 'all',
    hasData: anyContribution > 0 || anyExpense > 0, // anything recorded at all (for the empty state)
    totals: {
      totalExpected: toMoney(totalExpected),
      totalBaseCollected: toMoney(totalBaseCollected),
      totalFinesCollected: toMoney(totalFinesCollected),
      totalCollected: toMoney(totalCollected),
      totalPending: toMoney(totalExpected.minus(totalBaseCollected)),
      totalExpenses: toMoney(totalExpenses),
      net: toMoney(totalCollected.minus(totalExpenses)), // collected − spent within the period
      currentBalance: fund.currentBalance, // all-time balance (same as the dashboard)
    },
    contributions: {
      paidRecords: paidCount,
      unpaidRecords: unpaidCount,
      collectionPercent: percentage(totalCollected, totalExpected),
    },
    expenses: {
      count: expenseTotals._count._all,
      total: toMoney(totalExpenses),
      highest: formatExpense(highest),
      latest: formatExpense(latest),
    },
    monthly, // newest first
    bestMonth: pick(bestMonth),
    lowestMonth: pick(lowestMonth),
  };
}

module.exports = { getReport };
