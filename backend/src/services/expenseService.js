const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { toMoney } = require('../utils/money');
const { toDateString } = require('../utils/date');

// Only the creator's id and name are returned, nothing else about them.
const include = { createdBy: { select: { id: true, name: true } } };

function formatExpense(e) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    amount: toMoney(e.amount),
    date: toDateString(e.date), // "2026-10-05"
    createdBy: e.createdBy,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// Used by both create and update, so the rules are always the same.
function validateExpense(body) {
  return {
    title: validate.text(body.title, 'Title'),
    description: validate.text(body.description, 'Description', { required: false, max: 500 }),
    amount: validate.amount(body.amount),
    date: validate.dateOnly(body.date),
  };
}

async function findExpenseOrFail(id) {
  validate.id(id, 'Expense');
  const expense = await prisma.expense.findUnique({ where: { id }, include });
  if (!expense) throw new AppError('Expense not found', 404);
  return expense;
}

async function listExpenses() {
  const expenses = await prisma.expense.findMany({
    include,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
  return { items: expenses.map(formatExpense), total: expenses.length };
}

async function getExpense(id) {
  return formatExpense(await findExpenseOrFail(id));
}

// createdById always comes from the logged-in admin (req.user.id),
// never from the request body, so it can't be faked.
async function createExpense(body, adminId) {
  const expense = await prisma.expense.create({
    data: { ...validateExpense(body), createdById: adminId },
    include,
  });
  return formatExpense(expense);
}

async function updateExpense(id, body) {
  await findExpenseOrFail(id);
  const expense = await prisma.expense.update({ where: { id }, data: validateExpense(body), include });
  return formatExpense(expense);
}

async function deleteExpense(id) {
  await findExpenseOrFail(id);
  await prisma.expense.delete({ where: { id } });
}

module.exports = { formatExpense, listExpenses, getExpense, createExpense, updateExpense, deleteExpense };
