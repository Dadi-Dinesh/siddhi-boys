const bcrypt = require('bcrypt');

// How much work bcrypt does per hash. 10 is a sensible default:
// fast enough for login, slow enough to make guessing passwords expensive.
const SALT_ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

module.exports = { hashPassword, comparePassword };
