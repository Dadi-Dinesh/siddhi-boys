const prisma = require('../config/prisma');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');
const { toMoney } = require('../utils/money');

const SETTINGS_ID = 1; // V1 uses a single settings row

// Returns the settings row, creating it with the schema defaults if it doesn't exist yet.
// Accepts a transaction client (tx) so it can be used inside prisma.$transaction.
function getSettings(db = prisma) {
  return db.groupSettings.upsert({ where: { id: SETTINGS_ID }, update: {}, create: { id: SETTINGS_ID } });
}

const { calculateDueDate } = require('../utils/date');

function formatSettings(s) {
  return {
    groupName: s.groupName,
    monthlyContribution: toMoney(s.monthlyContribution),
    dueDay: s.dueDay ?? 10,
    fineAmount: toMoney(s.fineAmount ?? 20),
    updatedAt: s.updatedAt,
  };
}

async function readSettings() {
  return formatSettings(await getSettings());
}

// Changing settings updates the default for new months.
// If month and year are specified, it also updates UNPAID contributions for that month.
// PAID contributions are NEVER altered.
async function updateSettings(body) {
  const data = {};
  if (body.groupName !== undefined) data.groupName = validate.text(body.groupName, 'Group name');
  if (body.monthlyContribution !== undefined) {
    data.monthlyContribution = validate.amount(body.monthlyContribution, 'Monthly contribution');
  }
  if (body.dueDay !== undefined) {
    data.dueDay = validate.integer(body.dueDay, 'Due day', 1, 31);
  } else if (body.dueDate !== undefined) {
    const d = validate.dateOnly(body.dueDate, 'Due date');
    data.dueDay = d.getUTCDate();
  }
  if (body.fineAmount !== undefined) {
    data.fineAmount = validate.nonNegativeAmount(body.fineAmount, 'Fine amount');
  }

  if (Object.keys(data).length === 0 && !body.month) throw new AppError('Nothing to update');

  const currentSettings = await getSettings(); // make sure the row exists
  const updated = Object.keys(data).length > 0
    ? await prisma.groupSettings.update({ where: { id: SETTINGS_ID }, data })
    : currentSettings;

  // If a target month is specified, update UNPAID records for that month
  if (body.month && body.year) {
    const m = validate.month(body.month);
    const y = validate.year(body.year);
    const day = updated.dueDay;
    const fine = updated.fineAmount;
    const dueDateStr = calculateDueDate(y, m, day);
    const dueDateObj = new Date(`${dueDateStr}T00:00:00.000Z`);

    const updateData = { dueDate: dueDateObj, lateFine: fine };
    if (data.monthlyContribution !== undefined) {
      updateData.amount = data.monthlyContribution;
    }

    await prisma.monthlyContribution.updateMany({
      where: { month: m, year: y, status: 'UNPAID' },
      data: updateData,
    });
  }

  return formatSettings(updated);
}

module.exports = { getSettings, readSettings, updateSettings };
