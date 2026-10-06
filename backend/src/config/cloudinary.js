const { v2: cloudinary } = require('cloudinary');

function parseCloudinaryUrl(urlStr) {
  if (!urlStr || !urlStr.startsWith('cloudinary://')) return null;
  try {
    const parsed = new URL(urlStr);
    return {
      cloud_name: parsed.hostname,
      api_key: decodeURIComponent(parsed.username || ''),
      api_secret: decodeURIComponent(parsed.password || ''),
    };
  } catch {
    return null;
  }
}

function getCloudinaryConfig() {
  if (process.env.CLOUDINARY_URL) {
    const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (fromUrl?.cloud_name && fromUrl?.api_key && fromUrl?.api_secret) {
      return fromUrl;
    }
  }
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    };
  }
  return null;
}

function isCloudinaryConfigured() {
  return Boolean(getCloudinaryConfig());
}

const activeConfig = getCloudinaryConfig();
if (activeConfig) {
  cloudinary.config({
    cloud_name: activeConfig.cloud_name,
    api_key: activeConfig.api_key,
    api_secret: activeConfig.api_secret,
    secure: true,
  });
}

module.exports = { cloudinary, isCloudinaryConfigured, getCloudinaryConfig };

