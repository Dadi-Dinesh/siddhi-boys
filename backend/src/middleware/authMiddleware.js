const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');
const { AppError } = require('../utils/response');
const { publicUserSelect } = require('../services/authService');

// Requires a valid "Authorization: Bearer <token>" header.
// On success, the logged-in user (without password) is available as req.user.
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Please log in to continue', 401);
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError('Your session has expired. Please log in again.', 401);
  }

  // Always load the user fresh from the database. This means a deactivated
  // user, or a user whose role changed, is handled correctly even if their
  // old token hasn't expired yet. (A token blacklist could be checked here later.)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: publicUserSelect,
  });

  if (!user || !user.isActive) {
    throw new AppError('Your session is no longer valid. Please log in again.', 401);
  }

  req.user = user;
  next();
}

// Use after authenticate. Only ADMIN users get through.
//   router.post('/', authenticate, requireAdmin, controller)
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    throw new AppError('You do not have permission to do this', 403);
  }
  next();
}

module.exports = { authenticate, requireAdmin };
