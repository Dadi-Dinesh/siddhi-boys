const paymentVerificationService = require('../services/paymentVerificationService');
const { sendSuccess } = require('../utils/response');

// POST /api/payment-verifications (Member submission)
async function submit(req, res) {
  const result = await paymentVerificationService.submitMemberVerification({
    contributionId: req.body?.contributionId,
    userId: req.user.id,
    userRole: req.user.role,
    file: req.file,
    paymentDate: req.body?.paymentDate,
    note: req.body?.note,
    paymentMethod: req.body?.paymentMethod,
    includeFine: req.body?.includeFine,
  });
  sendSuccess(res, result, 'Payment verification submitted successfully', 201);
}

// PATCH /api/contributions/:id/pay (Admin mark paid with screenshot or cash)
async function adminMarkPaid(req, res) {
  const result = await paymentVerificationService.adminMarkPaidWithScreenshot({
    contributionId: req.params.id,
    adminUserId: req.user.id,
    file: req.file,
    paymentDate: req.body?.paymentDate,
    note: req.body?.note,
    paymentMethod: req.body?.paymentMethod,
    includeFine: req.body?.includeFine,
  });
  sendSuccess(res, { ...result.contribution, verification: result.verification }, result.message);
}

// GET /api/admin/payment-verifications or /api/payment-verifications
async function list(req, res) {
  const result = await paymentVerificationService.listVerifications(req.query);
  sendSuccess(res, result, 'Payment verifications fetched successfully');
}

// GET /api/payment-verifications/:id/screenshot (Protected file stream)
async function getScreenshot(req, res) {
  const image = await paymentVerificationService.getScreenshot(req.params.id);
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.type(image.contentType).send(image.body);
}

// PATCH /api/admin/payment-verifications/:id/accept
async function accept(req, res) {
  const result = await paymentVerificationService.acceptVerification(req.params.id, req.user.id, {
    includeFine: req.body?.includeFine,
  });
  sendSuccess(res, result, 'Payment verification accepted. Contribution marked as paid.');
}

// PATCH /api/admin/payment-verifications/:id/decline
async function decline(req, res) {
  const result = await paymentVerificationService.declineVerification(
    req.params.id,
    req.user.id,
    req.body.rejectionReason || req.body.reason,
  );
  sendSuccess(res, result, 'Payment verification declined. Contribution remains unpaid.');
}

module.exports = {
  submit,
  adminMarkPaid,
  list,
  getScreenshot,
  accept,
  decline,
};
