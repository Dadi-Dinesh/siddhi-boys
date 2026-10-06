const summaryService = require('../services/summaryService');
const { sendSuccess } = require('../utils/response');

// GET /api/group/summary  (any logged-in user)
async function summary(req, res) {
  sendSuccess(res, await summaryService.getGroupSummary(), 'Group summary fetched successfully');
}

module.exports = { summary };
