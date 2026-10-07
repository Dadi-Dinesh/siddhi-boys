const { v2: cloudinary } = require('cloudinary');

function cleanEnv(val) {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

function parseCloudinaryUrl(urlStr) {
  if (!urlStr || !urlStr.startsWith('cloudinary://')) return null;
  try {
    const parsed = new URL(urlStr);
    return {
      cloud_name: cleanEnv(parsed.hostname),
      api_key: cleanEnv(decodeURIComponent(parsed.username || '')),
      api_secret: cleanEnv(decodeURIComponent(parsed.password || '')),
    };
  } catch {
    return null;
  }
}

function getCloudinaryConfig() {
  const cloudName = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const apiKey = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const apiSecret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  if (cloudName && apiKey && apiSecret) {
    return {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };
  }

  if (process.env.CLOUDINARY_URL) {
    const fromUrl = parseCloudinaryUrl(cleanEnv(process.env.CLOUDINARY_URL));
    if (fromUrl?.cloud_name && fromUrl?.api_key && fromUrl?.api_secret) {
      return fromUrl;
    }
  }

  return null;
}

function isCloudinaryConfigured() {
  return Boolean(getCloudinaryConfig());
}

function configureCloudinary() {
  const config = getCloudinaryConfig();
  if (!config) {
    const { AppError } = require('../utils/response');
    throw new AppError('Cloudinary is not configured on the server.', 500);
  }
  cloudinary.config({
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret,
    secure: true,
  });
  return config;
}

// Initial configuration attempt at load time
const initialConfig = getCloudinaryConfig();
if (initialConfig) {
  cloudinary.config({
    cloud_name: initialConfig.cloud_name,
    api_key: initialConfig.api_key,
    api_secret: initialConfig.api_secret,
    secure: true,
  });
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  getCloudinaryConfig,
  configureCloudinary,
};


