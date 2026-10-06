const contributionService = require('../services/contributionService');
const { sendSuccess } = require('../utils/response');

// POST /api/contributions/create-month  { month, year }
async function createMonth(req, res) {
  const { result, message } = await contributionService.createMonth(req.body || {});
  sendSuccess(res, result, message, 201);
}

// GET /api/contributions/month/:year/:month?search=
async function getMonth(req, res) {
  const data = await contributionService.getMonth(req.params.year, req.params.month, req.query);
  sendSuccess(res, data, 'Month fetched successfully');
}

// PATCH /api/contributions/:id/pay
async function markPaid(req, res) {
  const { contribution, message } = await contributionService.markPaid(req.params.id);
  sendSuccess(res, contribution, message);
}

// PATCH /api/contributions/:id/unpay
async function markUnpaid(req, res) {
  const { contribution, message } = await contributionService.markUnpaid(req.params.id);
  sendSuccess(res, contribution, message);
}

// GET /api/contributions/history?year=&month=&memberId=&status=
async function history(req, res) {
  sendSuccess(res, await contributionService.getHistory(req.query), 'Contribution history fetched successfully');
}

// GET /api/contributions/my-history  (logged-in user only)
async function myHistory(req, res) {
  sendSuccess(res, await contributionService.getMyHistory(req.user.id), 'Payment history fetched successfully');
}

// GET /api/contributions/my-summary  (logged-in user only)
async function mySummary(req, res) {
  sendSuccess(res, await contributionService.getMySummary(req.user.id), 'Summary fetched successfully');
}

module.exports = { createMonth, getMonth, markPaid, markUnpaid, history, myHistory, mySummary };
