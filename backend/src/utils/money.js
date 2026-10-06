const { Prisma } = require('@prisma/client');

// All money maths uses Prisma.Decimal (exact), never plain JS numbers.
// Only at the very end do we convert to a JSON number like 100 or 650.5,
// so the frontend always receives the same simple format.

const ZERO = new Prisma.Decimal(0);

function toDecimal(value) {
  return value === null || value === undefined ? ZERO : new Prisma.Decimal(value);
}

// Decimal → number with at most 2 decimal places (for API responses only)
function toMoney(value) {
  return Number(toDecimal(value).toFixed(2));
}

// part / whole × 100, rounded to 1 decimal place (e.g. 87.5). null when whole is 0,
// so "nothing expected" never turns into NaN or Infinity.
function percentage(part, whole) {
  const w = toDecimal(whole);
  if (w.lte(0)) return null;
  return Number(toDecimal(part).div(w).times(100).toFixed(1));
}

module.exports = { ZERO, toDecimal, toMoney, percentage };
