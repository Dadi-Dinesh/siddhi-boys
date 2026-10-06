// Small input-validation helpers. Each one either returns a clean value
// or throws an AppError (400) with a friendly message.
// The backend never trusts data sent from the frontend.
const { Prisma } = require('@prisma/client');
const { AppError } = require('./response');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/; // e.g. 100, 650.5, 99.99
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const MAX_AMOUNT = new Prisma.Decimal('99999999.99'); // fits Decimal(10,2)
const MIN_PASSWORD_LENGTH = 8;

function text(value, field, { required = true, max = 100 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new AppError(`${field} is required`);
    return null;
  }
  if (typeof value !== 'string') throw new AppError(`${field} must be text`);
  const trimmed = value.trim();
  if (!trimmed && required) throw new AppError(`${field} is required`);
  if (trimmed.length > max) throw new AppError(`${field} must be ${max} characters or fewer`);
  return trimmed || null;
}

function email(value) {
  const cleaned = text(value, 'Email', { max: 254 }).toLowerCase();
  if (!EMAIL_REGEX.test(cleaned)) throw new AppError('Please enter a valid email address');
  return cleaned;
}

function password(value) {
  if (typeof value !== 'string' || !value) throw new AppError('Password is required');
  if (value.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  // bcrypt only uses the first 72 bytes, so longer passwords would be silently cut short.
  if (Buffer.byteLength(value, 'utf8') > 72) throw new AppError('Password is too long (maximum 72 characters)');
  return value;
}

function phoneNumber(value, { required = false } = {}) {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    if (required) throw new AppError('Phone number is required');
    return null;
  }
  const str = String(value).trim();
  const digits = str.replace(/\D/g, '');
  let core = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    core = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    core = digits.slice(1);
  }
  if (!/^[6-9]\d{9}$/.test(core)) {
    throw new AppError('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210 or +91 98765 43210)');
  }
  return `+91 ${core}`;
}

function boolean(value, field) {
  if (typeof value !== 'boolean') throw new AppError(`${field} must be true or false`);
  return value;
}

// Accepts numbers or numeric strings like 650, "650", "650.50".
// Returns a Prisma Decimal so no floating-point maths ever touches money.
function amount(value, field = 'Amount') {
  if (value === undefined || value === null || value === '') throw new AppError(`${field} is required`);
  if (typeof value !== 'number' && typeof value !== 'string') throw new AppError(`${field} must be a number`);
  const str = String(value).trim();
  if (!AMOUNT_REGEX.test(str)) {
    throw new AppError(`${field} must be a positive number with at most 2 decimal places`);
  }
  const decimal = new Prisma.Decimal(str);
  if (decimal.lte(0)) throw new AppError(`${field} must be greater than 0`);
  if (decimal.gt(MAX_AMOUNT)) throw new AppError(`${field} is too large`);
  return decimal;
}

function nonNegativeAmount(value, field = 'Amount') {
  if (value === undefined || value === null || value === '') throw new AppError(`${field} is required`);
  if (typeof value !== 'number' && typeof value !== 'string') throw new AppError(`${field} must be a number`);
  const str = String(value).trim();
  if (!AMOUNT_REGEX.test(str)) {
    throw new AppError(`${field} must be a number with at most 2 decimal places`);
  }
  const decimal = new Prisma.Decimal(str);
  if (decimal.lt(0)) throw new AppError(`${field} cannot be negative`);
  if (decimal.gt(MAX_AMOUNT)) throw new AppError(`${field} is too large`);
  return decimal;
}

// "YYYY-MM-DD" → Date at midnight UTC (matches the DATE column in PostgreSQL)
function dateOnly(value, field = 'Date') {
  if (!value) throw new AppError(`${field} is required`);
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
    throw new AppError(`${field} must be in YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  // Rejects impossible dates like 2026-02-31
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new AppError(`${field} is not a valid date`);
  }
  const year = date.getUTCFullYear();
  if (year < 2000 || year > 2100) throw new AppError(`${field} must be between the years 2000 and 2100`);
  return date;
}

// Validates a payment date: required, valid YYYY-MM-DD, and cannot be in the future
function paymentDate(value, field = 'Payment date') {
  const date = dateOnly(value, field);
  const dateStr = value.slice(0, 10);
  const { isFutureDate } = require('./date');
  if (isFutureDate(dateStr)) {
    throw new AppError(`${field} cannot be in the future`);
  }
  return date;
}

function integer(value, field, min, max) {
  const num = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new AppError(`${field} must be a whole number between ${min} and ${max}`);
  }
  return num;
}

const month = (value) => integer(value, 'Month', 1, 12);
const year = (value) => integer(value, 'Year', 2000, 2100);

// An id that isn't even a valid UUID can't exist, so treat it as "not found".
function id(value, label = 'Record') {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
    throw new AppError(`${label} not found`, 404);
  }
  return value;
}

// Allows one value out of a fixed list, e.g. status=PAID
function oneOf(value, field, allowed) {
  const upper = typeof value === 'string' ? value.toUpperCase() : value;
  if (!allowed.includes(upper)) throw new AppError(`${field} must be one of: ${allowed.join(', ')}`);
  return upper;
}

// Optional ?search= value. Ignores anything that isn't a simple string.
function search(value) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 100) : null;
}

module.exports = {
  text,
  email,
  password,
  phoneNumber,
  boolean,
  amount,
  nonNegativeAmount,
  dateOnly,
  paymentDate,
  month,
  year,
  integer,
  id,
  oneOf,
  search,
};
