const expenseService = require('../services/expenseService');
const { sendSuccess } = require('../utils/response');

// GET /api/expenses
async function list(req, res) {
  sendSuccess(res, await expenseService.listExpenses(), 'Expenses fetched successfully');
}

// GET /api/expenses/:id
async function getOne(req, res) {
  sendSuccess(res, await expenseService.getExpense(req.params.id), 'Expense fetched successfully');
}

// POST /api/expenses
async function create(req, res) {
  const expense = await expenseService.createExpense(req.body || {}, req.user.id);
  sendSuccess(res, expense, 'Expense added successfully', 201);
}

// PUT /api/expenses/:id
async function update(req, res) {
  const expense = await expenseService.updateExpense(req.params.id, req.body || {});
  sendSuccess(res, expense, 'Expense updated successfully');
}

// DELETE /api/expenses/:id
async function remove(req, res) {
  await expenseService.deleteExpense(req.params.id);
  sendSuccess(res, null, 'Expense deleted successfully');
}

module.exports = { list, getOne, create, update, remove };
