const prisma = require('../config/prisma');
const { comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { AppError } = require('../utils/response');
const validate = require('../utils/validate');

// The only user fields ever sent to the frontend. The password is never included.
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phoneNumber: true,
  profileImageUrl: true,
  role: true,
  isActive: true,
};

// A real bcrypt hash of a random string. When the email doesn't exist we still
// run a password comparison against this, so the response takes the same time
// and attackers can't tell which emails are registered.
const DUMMY_HASH = '$2b$10$zOv2DITfLZjOa93vAg8dr.pjYRaSrF2xQ9EqP6iHU.84xyz0ijIxe';

async function login(email, password) {
  if (typeof email !== 'string' || !email.trim()) {
    throw new AppError('Email is required', 400);
  }
  if (typeof password !== 'string' || !password.trim()) {
    throw new AppError('Password is required', 400);
  }
  const cleanEmail = validate.email(email); // trimmed, lower-case, valid format

  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  const passwordOk = await comparePassword(password, user ? user.password : DUMMY_HASH);

  // Same message for "no such user" and "wrong password" on purpose.
  if (!user || !passwordOk) {
    throw new AppError('Invalid email or password', 401);
  }

  // Only revealed after the correct password was given.
  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Please contact the admin.', 403);
  }

  const token = generateToken({ userId: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImageUrl: user.profileImageUrl,
      role: user.role,
    },
    token,
  };
}

module.exports = { login, publicUserSelect };
