const { Prisma } = require('@prisma/client');
const { AppError } = require('../utils/response');

// Unknown route → 404
function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found' });
}

// Turns any error into a safe { success: false, message } response.
// Raw database errors and stack traces are only logged on the server.
// (Express 5 forwards errors from async route handlers here automatically.)
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Something went wrong. Please try again.';

  if (err instanceof AppError) {
    // Our own expected errors: validation, auth, not found, etc.
    status = err.status;
    message = err.message;
  } else if (err.type === 'entity.parse.failed') {
    // Request body was not valid JSON
    status = 400;
    message = 'Invalid request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request is too large';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File size exceeds the 5MB limit';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    message = 'Unexpected file upload field';
  } else if (err.status >= 400 && err.status < 500) {
    // Other request problems reported by Express (e.g. unsupported encoding)
    status = err.status;
    message = 'Invalid request';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      status = 409;
      message = 'A record with these details already exists';
    } else if (err.code === 'P2025') {
      status = 404;
      message = 'Record not found';
    } else if (err.code === 'P2003') {
      status = 409;
      message = 'This record is linked to other data and cannot be removed';
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    status = 503;
    message = 'Database is unavailable. Please try again shortly.';
  }

  // Unexpected errors are logged on the server only. In production just the summary is
  // logged, because full database errors can contain the data that was being saved.
  if (status >= 500) {
    if (process.env.NODE_ENV === 'production') console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}: ${err.name}${err.code ? ` (${err.code})` : ''}`);
    else console.error(err);
  }

  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
