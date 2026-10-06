const transactionService = require('../services/transactionService');
const { sendSuccess } = require('../utils/response');

// GET /api/transactions?year=&month=&type=&memberId=
async function list(req, res) {
  sendSuccess(res, await transactionService.listTransactions(req.query), 'Transactions fetched successfully');
}

module.exports = { list };
