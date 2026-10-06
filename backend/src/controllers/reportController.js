const reportService = require('../services/reportService');
const { sendSuccess } = require('../utils/response');

// GET /api/reports/summary?months=3|6|12   (omit for all time)
async function summary(req, res) {
  sendSuccess(res, await reportService.getReport(req.query), 'Report fetched successfully');
}

module.exports = { summary };
