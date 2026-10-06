const summaryService = require('../services/summaryService');
const { sendSuccess } = require('../utils/response');

// GET /api/dashboard/summary
async function summary(req, res) {
  const [totals, currentMonth] = await Promise.all([
    summaryService.getFundTotals(),
    summaryService.getCurrentMonthSummary(),
  ]);
  sendSuccess(res, { ...totals, currentMonth }, 'Dashboard summary fetched successfully');
}

// GET /api/dashboard/monthly-summary
async function monthlySummary(req, res) {
  const items = await summaryService.getMonthlySummaries();
  sendSuccess(res, { items, total: items.length }, 'Monthly summary fetched successfully');
}

module.exports = { summary, monthlySummary };
