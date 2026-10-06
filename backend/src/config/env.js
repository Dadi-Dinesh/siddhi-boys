// Checks the environment variables once, at startup, so a missing or unsafe setting
// stops the server with a clear message instead of failing later in a confusing way.
// Secret values are never printed.

const PLACEHOLDER_SECRETS = ['your_super_secret_jwt_key', 'secret', 'changeme', 'jwtsecret', 'development'];
const MIN_SECRET_LENGTH = 32;

function checkEnvironment() {
  const problems = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (!process.env.DATABASE_URL) problems.push('DATABASE_URL is required.');

  const secret = process.env.JWT_SECRET;
  if (!secret) problems.push('JWT_SECRET is required.');
  else if (secret.length < MIN_SECRET_LENGTH || PLACEHOLDER_SECRETS.includes(secret.toLowerCase())) {
    problems.push(`JWT_SECRET must be a long random value (at least ${MIN_SECRET_LENGTH} characters, not the example text).`);
  }

  // In production the browser app's address must be set explicitly (used for CORS).
  if (isProduction && !process.env.CLIENT_URL) problems.push('CLIENT_URL is required in production.');

  // Payment screenshots are stored on Cloudinary, so production needs all three values or CLOUDINARY_URL.
  const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
  const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingCloudinary = cloudinaryVars.filter((name) => !process.env[name]);
  if (isProduction && !hasCloudinaryUrl && missingCloudinary.length) {
    problems.push(`${missingCloudinary.join(', ')} ${missingCloudinary.length === 1 ? 'is' : 'are'} required in production.`);
  }

  return problems;
}

// Settings that are optional during development but worth mentioning at startup.
function environmentWarnings() {
  const warnings = [];
  const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
  if (!hasCloudinaryUrl && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
    warnings.push('Cloudinary is not configured: payment screenshot uploads will fail until CLOUDINARY_* values are set.');
  }
  return warnings;
}

module.exports = { checkEnvironment, environmentWarnings };
