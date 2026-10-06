const jwt = require('jsonwebtoken');

// Only this algorithm is accepted, so a token can't choose a weaker one.
const ALGORITHM = 'HS256';

// The token only identifies the user. It never contains the password.
// Role is included for convenience, but the backend always re-reads the
// user from the database before trusting it (see authMiddleware.js).
function generateToken({ userId, role }) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Throws if the token is invalid, tampered with, expired, or uses another algorithm.
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALGORITHM] });
}

module.exports = { generateToken, verifyToken };
