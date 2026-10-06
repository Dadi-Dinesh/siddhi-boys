const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { toMoney, toDecimal } = require('../utils/money');
const { formatMonth, currentMonthYear, toDateString, formatDateLabel, calculateDueDate } = require('../utils/date');
const { getSettings } = require('./settingsService');
const { getMonthSummary, getMemberTotals } = require('./summaryService');

const memberSummarySelect = { id: true, name: true, email: true, isActive: true };

// Shapes a database record into the JSON the API returns.
function formatContribution(c) {
  const baseAmount = toMoney(c.amount);
  const fineAmount = toMoney(c.fineAmount ?? 0);
  const totalPaidAmount = c.totalPaidAmount !== null && c.totalPaidAmount !== undefined
    ? toMoney(c.totalPaidAmount)
    : (c.status === 'PAID' ? toMoney(toDecimal(c.amount).plus(toDecimal(c.fineAmount || 0))) : null);

  const result = {
    id: c.id,
    month: c.month,
    year: c.year,
    label: formatMonth(c.month, c.year),
    amount: baseAmount,
    dueDate: c.dueDate ? toDateString(c.dueDate) : null,
    dueDateLabel: c.dueDate ? formatDateLabel(c.dueDate) : null,
    lateFine: toMoney(c.lateFine ?? 20),
    fineAmount,
    totalPaidAmount,
    paymentDate: c.paymentDate ? toDateString(c.paymentDate) : null,
    paymentDateLabel: c.paymentDate ? formatDateLabel(c.paymentDate) : null,
    status: c.status,
    paidAt: c.paidAt,
  };
  if (c.user) result.member = c.user;
  if (c.verifications && c.verifications.length > 0) {
    const v = c.verifications[0];
    result.verification = {
      id: v.id,
      status: v.status,
      screenshotUrl: `/api/payment-verifications/${v.id}/screenshot`,
      submittedByRole: v.submittedByRole,
      submittedAt: v.submittedAt,
      paymentDate: v.paymentDate ? toDateString(v.paymentDate) : null,
      paymentDateLabel: v.paymentDate ? formatDateLabel(v.paymentDate) : null,
      fineAmount: toMoney(v.fineAmount ?? 0),
      totalAmount: v.totalAmount !== null && v.totalAmount !== undefined ? toMoney(v.totalAmount) : null,
      rejectionReason: v.rejectionReason,
      note: v.note,
    };
  } else {
    result.verification = null;
  }
  return result;
}

// Creates UNPAID records for every active member for the given month.
// - Uses the amount from GroupSettings (never a hardcoded ₹100).
// - Stores the dueDate and lateFine applicable for this month.
// - If the month already exists, only members who are missing a record are added
//   (e.g. someone who joined after the month was created).
// - Runs inside a transaction, so it either fully succeeds or changes nothing.
async function createMonth(body) {
  const month = validate.month(body.month);
  const year = validate.year(body.year);
  const label = formatMonth(month, year);

  return prisma.$transaction(async (tx) => {
    const settings = await getSettings(tx);

    const activeMembers = await tx.user.findMany({
      where: { role: 'MEMBER', isActive: true },
      select: { id: true },
    });
    if (activeMembers.length === 0) {
      throw new AppError('There are no active members to create contributions for');
    }

    const existing = await tx.monthlyContribution.findMany({
      where: { month, year },
      select: { userId: true },
    });
    const alreadyHasRecord = new Set(existing.map((c) => c.userId));
    const missing = activeMembers.filter((m) => !alreadyHasRecord.has(m.id));

    if (missing.length === 0) {
      throw new AppError(`${label} has already been created.`, 409);
    }

    const dueDateStr = body.dueDate
      ? toDateString(validate.dateOnly(body.dueDate, 'Due date'))
      : calculateDueDate(year, month, settings.dueDay ?? 10);
    const lateFineVal = body.lateFine !== undefined
      ? validate.nonNegativeAmount(body.lateFine, 'Late fine')
      : (body.fineAmount !== undefined ? validate.nonNegativeAmount(body.fineAmount, 'Late fine') : (settings.fineAmount ?? 20));
    const dueDateObj = new Date(`${dueDateStr}T00:00:00.000Z`);

    // skipDuplicates + the unique (userId, month, year) constraint mean that even
    // two admins clicking at the same moment can't create duplicate records.
    const { count } = await tx.monthlyContribution.createMany({
      data: missing.map((m) => ({
        userId: m.id,
        month,
        year,
        amount: settings.monthlyContribution,
        dueDate: dueDateObj,
        lateFine: lateFineVal,
        fineAmount: 0,
        status: 'UNPAID',
      })),
      skipDuplicates: true,
    });

    const isNewMonth = existing.length === 0;
    return {
      result: {
        month,
        year,
        label,
        created: count,
        amount: toMoney(settings.monthlyContribution),
        dueDate: dueDateStr,
        lateFine: toMoney(lateFineVal),
      },
      message: isNewMonth
        ? `${label} created for ${count} member${count === 1 ? '' : 's'}`
        : `${label} already existed. Added ${count} new member${count === 1 ? '' : 's'}.`,
    };
  }, { maxWait: 10000, timeout: 20000 });
}

// All records for one month, with the month's summary.
// ?search=rahul filters the list; the summary always covers the whole month.
async function getMonth(yearParam, monthParam, query) {
  const year = validate.year(yearParam);
  const month = validate.month(monthParam);
  const term = validate.search(query.search);

  const where = { year, month };
  if (term) {
    where.user = {
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ],
    };
  }

  const [records, summary] = await Promise.all([
    prisma.monthlyContribution.findMany({
      where,
      include: {
        user: { select: memberSummarySelect },
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { user: { name: 'asc' } },
    }),
    getMonthSummary(year, month),
  ]);

  return {
    month,
    year,
    label: formatMonth(month, year),
    isCreated: summary.totalMembers > 0, // false → the frontend can offer "Create month"
    summary,
    items: records.map(formatContribution),
    total: records.length,
  };
}

async function findContributionOrFail(id) {
  validate.id(id, 'Contribution');
  const contribution = await prisma.monthlyContribution.findUnique({ where: { id } });
  if (!contribution) throw new AppError('Contribution not found', 404);
  return contribution;
}

// Marks the existing record as PAID (never creates a second record).
// If it is already paid, the original paid date is kept.
async function markPaid(id) {
  const contribution = await findContributionOrFail(id);
  const alreadyPaid = contribution.status === 'PAID';
  const updated = alreadyPaid
    ? await prisma.monthlyContribution.findUnique({
        where: { id },
        include: {
          user: { select: memberSummarySelect },
          verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      })
    : await prisma.monthlyContribution.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date() },
        include: {
          user: { select: memberSummarySelect },
          verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
  return { contribution: formatContribution(updated), message: alreadyPaid ? 'Already marked as paid' : 'Marked as paid' };
}

async function markUnpaid(id) {
  const contribution = await findContributionOrFail(id);
  const alreadyUnpaid = contribution.status === 'UNPAID';
  const updated = alreadyUnpaid
    ? await prisma.monthlyContribution.findUnique({
        where: { id },
        include: {
          user: { select: memberSummarySelect },
          verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      })
    : await prisma.$transaction(async (tx) => {
        await tx.paymentVerification.updateMany({
          where: { contributionId: id, status: 'ACCEPTED' },
          data: { status: 'DECLINED', rejectionReason: 'Marked unpaid by admin' },
        });
        return tx.monthlyContribution.update({
          where: { id },
          data: {
            status: 'UNPAID',
            paidAt: null,
            paymentDate: null,
            fineAmount: 0,
            totalPaidAmount: null,
          },
          include: {
            user: { select: memberSummarySelect },
            verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });
      }, { maxWait: 10000, timeout: 20000 });
  return { contribution: formatContribution(updated), message: alreadyUnpaid ? 'Already marked as unpaid' : 'Marked as unpaid' };
}

// Admin/Member: records across all months. Optional filters: year, month, memberId, status.
async function getHistory(query) {
  const where = {};
  if (query.year) where.year = validate.year(query.year);
  if (query.month) where.month = validate.month(query.month);
  if (query.memberId) where.userId = validate.id(query.memberId, 'Member');
  if (query.status) where.status = validate.oneOf(query.status, 'Status', ['PAID', 'UNPAID']);

  const records = await prisma.monthlyContribution.findMany({
    where,
    include: {
      user: { select: memberSummarySelect },
      verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { user: { name: 'asc' } }],
  });
  return { items: records.map(formatContribution), total: records.length };
}

// Member: only their own records. The user id always comes from the login token,
// never from the request, so nobody can view someone else's history.
async function getMyHistory(userId) {
  const records = await prisma.monthlyContribution.findMany({
    where: { userId },
    include: {
      verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  return { items: records.map(formatContribution), total: records.length };
}

async function getMySummary(userId) {
  const { month, year } = currentMonthYear();
  const [totals, current] = await Promise.all([
    getMemberTotals(userId),
    prisma.monthlyContribution.findUnique({
      where: { userId_month_year: { userId, month, year } },
      include: {
        verifications: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
  ]);
  return { ...totals, currentMonth: current ? formatContribution(current) : null };
}

module.exports = {
  formatContribution, createMonth, getMonth, markPaid, markUnpaid, getHistory, getMyHistory, getMySummary,
};
