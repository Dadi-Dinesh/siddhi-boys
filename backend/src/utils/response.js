// Every API response uses the same shape so the frontend can handle them uniformly:
//   { success: true,  message?: "...", data: ... }
//   { success: false, message: "..." }

function sendSuccess(res, data, message, status = 200) {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  return res.status(status).json(body);
}

// Throw this from services/controllers for expected errors, e.g.
//   throw new AppError('Member not found', 404)
// The error handler turns it into { success: false, message }.
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

module.exports = { sendSuccess, AppError };
