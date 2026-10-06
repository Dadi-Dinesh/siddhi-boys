const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body || {};
  const result = await authService.login(email, password);
  sendSuccess(res, result, 'Login successful');
}

// GET /api/auth/me  (authenticate middleware has already loaded req.user)
async function me(req, res) {
  const { id, name, email, phone, role } = req.user;
  sendSuccess(res, { id, name, email, phone, role });
}

// Logout needs no API in V1: the frontend simply deletes its stored token.

module.exports = { login, me };
