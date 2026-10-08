const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { ZERO, toDecimal, toMoney } = require('../utils/money');
const {
  formatMonth,
  toDateString,
  formatDateLabel,
  calculateDueDate,
  isLatePayment,
} = require('../utils/date');
const { uploadScreenshotToCloudinary, fetchScreenshot } = require('../utils/upload');

function formatVerification(v) {
  const method = v.paymentMethod || (v.screenshotUrl ? 'ONLINE' : 'CASH');
  const result = {
    id: v.id,
    contributionId: v.contributionId,
    status: v.status,
    paymentMethod: method,
    // Path relative to the API base URL if screenshot exists, or null for cash payments.
    screenshotUrl: v.screenshotUrl ? `/payment-verifications/${v.id}/screenshot` : null,
    note: v.note,
    rejectionReason: v.rejectionReason,
    submittedByRole: v.submittedByRole,
    paymentDate: v.paymentDate ? toDateString(v.paymentDate) : null,
    paymentDateLabel: v.paymentDate ? formatDateLabel(v.paymentDate) : null,
    fineAmount: toMoney(v.fineAmount ?? 0),
    totalAmount: v.totalAmount !== null && v.totalAmount !== undefined ? toMoney(v.totalAmount) : null,
    submittedAt: v.submittedAt,
    reviewedAt: v.reviewedAt,
    createdAt: v.createdAt,
  };

  if (v.submittedBy) {
    result.submittedBy = {
      id: v.submittedBy.id,
      name: v.submittedBy.name,
      role: v.submittedBy.role,
    };
  }

  if (v.reviewedBy) {
    result.reviewedBy = {
      id: v.reviewedBy.id,
      name: v.reviewedBy.name,
    };
  }

  if (v.contribution) {
    const baseAmount = toMoney(v.contribution.amount);
    const fineAmount = toMoney(v.fineAmount ?? v.contribution.fineAmount ?? 0);
    const totalPaidAmount = v.totalAmount !== null && v.totalAmount !== undefined
      ? toMoney(v.totalAmount)
      : (v.contribution.totalPaidAmount !== null && v.contribution.totalPaidAmount !== undefined
          ? toMoney(v.contribution.totalPaidAmount)
          : null);

    result.contribution = {
      id: v.contribution.id,
      month: v.contribution.month,
      year: v.contribution.year,
      label: formatMonth(v.contribution.month, v.contribution.year),
      amount: baseAmount,
      dueDate: v.contribution.dueDate ? toDateString(v.contribution.dueDate) : null,
      dueDateLabel: v.contribution.dueDate ? formatDateLabel(v.contribution.dueDate) : null,
      lateFine: toMoney(v.contribution.lateFine ?? 20),
      fineAmount,
      totalPaidAmount,
      paymentMethod: v.contribution.paymentMethod || method,
      paymentDate: v.paymentDate ? toDateString(v.paymentDate) : (v.contribution.paymentDate ? toDateString(v.contribution.paymentDate) : null),
      paymentDateLabel: v.paymentDate ? formatDateLabel(v.paymentDate) : (v.contribution.paymentDate ? formatDateLabel(v.contribution.paymentDate) : null),
      status: v.contribution.status,
      member: v.contribution.user
        ? {
            id: v.contribution.user.id,
            name: v.contribution.user.name,
            email: v.contribution.user.email,
            profileImageUrl: v.contribution.user.profileImageUrl || null,
          }
        : null,
    };
  }

  return result;
}

// Member submits a payment verification screenshot (ONLINE) or cash declaration (CASH) for an UNPAID contribution.
async function submitMemberVerification({ contributionId, userId, userRole, file, paymentDate, note, paymentMethod = 'ONLINE', includeFine = false }) {
  const method = validate.oneOf(paymentMethod || 'ONLINE', 'Payment method', ['ONLINE', 'CASH']);
  if (method === 'ONLINE' && !file) {
    throw new AppError('Payment screenshot is required for online payments', 400);
  }
  validate.id(contributionId, 'Contribution');
  const payDate = validate.paymentDate(paymentDate, 'Payment date');
  const payDateStr = toDateString(payDate);

  const contribution = await prisma.monthlyContribution.findUnique({
    where: { id: contributionId },
    include: { user: true },
  });

  if (!contribution) throw new AppError('Contribution record not found', 404);

  // Members can only submit for their own contribution
  if (userRole === 'MEMBER' && contribution.userId !== userId) {
    throw new AppError('You can only submit payment for your own contribution', 403);
  }

  if (contribution.status === 'PAID') {
    throw new AppError('This contribution is already paid', 400);
  }

  // Prevent duplicate submissions if one is already pending
  const existingPending = await prisma.paymentVerification.findFirst({
    where: {
      contributionId,
      status: 'PENDING',
    },
  });

  if (existingPending) {
    throw new AppError('A payment verification is already pending review for this month', 409);
  }

  // Calculate late fine based on actual payment date vs due date and whether fine checkbox is ticked
  const dueDateStr = toDateString(contribution.dueDate || calculateDueDate(contribution.year, contribution.month, 10));
  const isLate = isLatePayment(payDateStr, dueDateStr);
  const shouldApplyFine = isLate && (includeFine === true || includeFine === 'true' || includeFine === 1 || includeFine === '1');
  const baseVal = toDecimal(contribution.amount);
  const fineVal = shouldApplyFine ? toDecimal(contribution.lateFine ?? 20) : ZERO;
  const totalVal = baseVal.plus(fineVal);

  let screenshotUrl = null;
  if (method === 'ONLINE' && file) {
    screenshotUrl = await uploadScreenshotToCloudinary(file);
  }

  const verification = await prisma.paymentVerification.create({
    data: {
      contributionId,
      submittedById: userId,
      submittedByRole: userRole,
      paymentMethod: method,
      screenshotUrl,
      status: 'PENDING',
      paymentDate: payDate,
      fineAmount: fineVal,
      totalAmount: totalVal,
      note: note ? String(note).trim().slice(0, 500) : null,
    },
    include: {
      contribution: {
        include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true } } },
      },
      submittedBy: { select: { id: true, name: true, role: true } },
    },
  });

  return formatVerification(verification);
}

// Admin manually marks a contribution as PAID with screenshot (ONLINE) or directly (CASH).
async function adminMarkPaidWithScreenshot({ contributionId, adminUserId, file, paymentDate, note, paymentMethod = 'ONLINE', includeFine = false }) {
  const method = validate.oneOf(paymentMethod || 'ONLINE', 'Payment method', ['ONLINE', 'CASH']);
  if (method === 'ONLINE' && !file) {
    throw new AppError('Payment screenshot is required for online payments', 400);
  }
  validate.id(contributionId, 'Contribution');
  const payDate = validate.paymentDate(paymentDate, 'Payment date');
  const payDateStr = toDateString(payDate);

  const existing = await prisma.monthlyContribution.findUnique({ where: { id: contributionId }, select: { id: true } });
  if (!existing) throw new AppError('Contribution not found', 404);

  let screenshotUrl = null;
  if (method === 'ONLINE' && file) {
    screenshotUrl = await uploadScreenshotToCloudinary(file);
  }

  return prisma.$transaction(async (tx) => {
    const contribution = await tx.monthlyContribution.findUnique({
      where: { id: contributionId },
      include: { user: true },
    });

    if (!contribution) throw new AppError('Contribution not found', 404);

    const now = new Date();

    // Calculate late fine based on actual payment date vs due date and whether fine was applied
    const dueDateStr = toDateString(contribution.dueDate || calculateDueDate(contribution.year, contribution.month, 10));
    const isLate = isLatePayment(payDateStr, dueDateStr);
    const shouldApplyFine = isLate && (includeFine === true || includeFine === 'true' || includeFine === 1 || includeFine === '1');
    const baseVal = toDecimal(contribution.amount);
    const fineVal = shouldApplyFine ? toDecimal(contribution.lateFine ?? 20) : ZERO;
    const totalVal = baseVal.plus(fineVal);

    // Create an ACCEPTED verification record
    const verification = await tx.paymentVerification.create({
      data: {
        contributionId,
        submittedById: adminUserId,
        submittedByRole: 'ADMIN',
        paymentMethod: method,
        screenshotUrl,
        status: 'ACCEPTED',
        reviewedById: adminUserId,
        reviewedAt: now,
        paymentDate: payDate,
        fineAmount: fineVal,
        totalAmount: totalVal,
        note: note ? String(note).trim().slice(0, 500) : (method === 'CASH' ? 'Cash payment recorded by Admin' : 'Recorded by Admin'),
      },
      include: {
        submittedBy: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    // Update contribution to PAID with fineAmount, totalPaidAmount, paymentDate, and paymentMethod
    const updatedContribution = await tx.monthlyContribution.update({
      where: { id: contributionId },
      data: {
        status: 'PAID',
        paidAt: contribution.paidAt || now,
        paymentDate: payDate,
        paymentMethod: method,
        fineAmount: fineVal,
        totalPaidAmount: totalVal,
      },
      include: {
        user: { select: { id: true, name: true, email: true, isActive: true } },
      },
    });

    const formatContribution = require('./contributionService').formatContribution;
    return {
      contribution: formatContribution(updatedContribution),
      verification: formatVerification(verification),
      message: method === 'CASH' ? 'Marked as paid in cash' : 'Marked as paid with verification screenshot',
    };
  }, { maxWait: 10000, timeout: 20000 });
}

// Admin accepts a pending verification request.
async function acceptVerification(id, adminUserId, options = {}) {
  validate.id(id, 'Verification');

  return prisma.$transaction(async (tx) => {
    const verification = await tx.paymentVerification.findUnique({
      where: { id },
      include: { contribution: true },
    });

    if (!verification) throw new AppError('Payment verification not found', 404);
    if (verification.status !== 'PENDING') {
      throw new AppError(`Verification is already ${verification.status.toLowerCase()}`, 400);
    }

    const now = new Date();

    let fineVal = toDecimal(verification.fineAmount || 0);
    let totalVal = toDecimal(verification.totalAmount || verification.contribution.amount);

    // If admin explicitly specified an includeFine override in accept request
    if (options.includeFine !== undefined && options.includeFine !== null) {
      const applyFine = options.includeFine === true || options.includeFine === 'true' || options.includeFine === 1 || options.includeFine === '1';
      fineVal = applyFine ? toDecimal(verification.contribution.lateFine ?? 20) : ZERO;
      totalVal = toDecimal(verification.contribution.amount).plus(fineVal);
    }

    // 1. Mark contribution PAID with verification's paymentDate, fineAmount, totalAmount, and paymentMethod
    await tx.monthlyContribution.update({
      where: { id: verification.contributionId },
      data: {
        status: 'PAID',
        paidAt: now,
        paymentDate: verification.paymentDate,
        paymentMethod: verification.paymentMethod || 'ONLINE',
        fineAmount: fineVal,
        totalPaidAmount: totalVal,
      },
    });

    // 2. Mark verification ACCEPTED
    const updatedVerification = await tx.paymentVerification.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        reviewedById: adminUserId,
        reviewedAt: now,
        fineAmount: fineVal,
        totalAmount: totalVal,
      },
      include: {
        contribution: {
          include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true } } },
        },
        submittedBy: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    return formatVerification(updatedVerification);
  }, { maxWait: 10000, timeout: 20000 });
}

// Admin declines a pending verification request.
async function declineVerification(id, adminUserId, rejectionReason) {
  validate.id(id, 'Verification');

  return prisma.$transaction(async (tx) => {
    const verification = await tx.paymentVerification.findUnique({
      where: { id },
      include: { contribution: true },
    });

    if (!verification) throw new AppError('Payment verification not found', 404);
    if (verification.status !== 'PENDING') {
      throw new AppError(`Verification is already ${verification.status.toLowerCase()}`, 400);
    }

    const now = new Date();

    // Mark verification DECLINED (contribution remains UNPAID)
    const updatedVerification = await tx.paymentVerification.update({
      where: { id },
      data: {
        status: 'DECLINED',
        reviewedById: adminUserId,
        reviewedAt: now,
        rejectionReason: rejectionReason ? String(rejectionReason).trim().slice(0, 500) : null,
      },
      include: {
        contribution: {
          include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true } } },
        },
        submittedBy: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    return formatVerification(updatedVerification);
  }, { maxWait: 10000, timeout: 20000 });
}

// Admin lists verifications (with optional status filter)
async function listVerifications(query = {}) {
  const where = {};
  if (query.status) {
    where.status = validate.oneOf(query.status, 'Status', ['PENDING', 'ACCEPTED', 'DECLINED']);
  }
  if (query.contributionId) {
    where.contributionId = validate.id(query.contributionId, 'Contribution');
  }

  const items = await prisma.paymentVerification.findMany({
    where,
    include: {
      contribution: {
        include: { user: { select: { id: true, name: true, email: true, profileImageUrl: true } } },
      },
      submittedBy: { select: { id: true, name: true, role: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    items: items.map(formatVerification),
    total: items.length,
  };
}

// Loads a screenshot from Cloudinary for a logged-in user (the route requires login).
async function getScreenshot(id) {
  validate.id(id, 'Verification');

  const verification = await prisma.paymentVerification.findUnique({
    where: { id },
    select: { screenshotUrl: true },
  });

  if (!verification) throw new AppError('Payment verification not found', 404);
  if (!verification.screenshotUrl) throw new AppError('No screenshot available for cash payment verification', 404);

  return fetchScreenshot(verification.screenshotUrl);
}

module.exports = {
  submitMemberVerification,
  adminMarkPaidWithScreenshot,
  acceptVerification,
  declineVerification,
  listVerifications,
  getScreenshot,
  formatVerification,
};
