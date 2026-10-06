const { rateLimit } = require('express-rate-limit');

// Slows down password guessing: after too many FAILED logins from the same IP address,
// further login attempts are refused for a while. Successful logins don't count.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes and try again.' },
});

module.exports = { loginLimiter };
