const path = require('path');
const multer = require('multer');
const { AppError } = require('./response');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SCREENSHOT_FOLDER = 'siddhiboys/payment-screenshots';

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIMES.has(file.mimetype) || !ALLOWED_EXTS.has(ext)) {
    return cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
  }
  cb(null, true);
};

// The file is kept in memory only long enough to send it to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Uploads a payment screenshot to Cloudinary and returns its URL.
// type "authenticated" means the image is NOT publicly listed or guessable: only the
// signed URL Cloudinary returns can open it, and that URL is stored on the server only.
// Members and admins view screenshots through the protected API route instead.
function uploadScreenshotToCloudinary(file) {
  if (!isCloudinaryConfigured()) {
    throw new AppError('Image upload is not configured on the server. Please contact the admin.', 503);
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: SCREENSHOT_FOLDER, type: 'authenticated', resource_type: 'image' },
      (err, result) => {
        if (err || !result?.secure_url) {
          return reject(new AppError('Could not upload the screenshot. Please try again.', 502));
        }
        resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });
}

// Downloads a stored screenshot (server side) so it can be streamed to a logged-in user.
async function fetchScreenshot(url) {
  // Only ever fetch from Cloudinary, never from any other address stored in the database.
  if (typeof url !== 'string' || !url.startsWith('https://res.cloudinary.com/')) {
    throw new AppError('Screenshot image not found', 404);
  }
  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new AppError('Could not load the screenshot. Please try again.', 502);
  }
  if (!response.ok) throw new AppError('Screenshot image not found', 404);
  return {
    contentType: response.headers.get('content-type') || 'image/jpeg',
    body: Buffer.from(await response.arrayBuffer()),
  };
}

const PROFILE_FOLDER = 'siddhiboys/profiles';

// Uploads a member's profile photo to Cloudinary and returns its URL.
function uploadProfilePhotoToCloudinary(file) {
  if (!file) return null;
  if (!isCloudinaryConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      return `https://res.cloudinary.com/siddhiboys/image/upload/v1/mock/profile_${Date.now()}.png`;
    }
    throw new AppError('Image upload is not configured on the server. Please contact the admin.', 503);
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: PROFILE_FOLDER,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      },
      (err, result) => {
        if (err || !result?.secure_url) {
          return reject(new AppError('Could not upload the profile photo. Please try again.', 502));
        }
        resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });
}

// Attempts to delete an old photo from Cloudinary when replaced.
async function deleteCloudinaryImage(url) {
  if (!url || typeof url !== 'string' || !isCloudinaryConfigured()) return;
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
    if (match && match[1]) {
      await cloudinary.uploader.destroy(match[1]);
    }
  } catch {
    // Non-fatal if old image could not be removed
  }
}

const profileFieldsUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'profileImage', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

function extractProfileFile(req) {
  if (req.file) return req.file;
  if (req.files) {
    for (const key of ['photo', 'profilePhoto', 'profileImage', 'image']) {
      if (req.files[key] && req.files[key][0]) return req.files[key][0];
    }
  }
  return null;
}

function handleProfilePhotoUpload(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }
  profileFieldsUpload(req, res, (err) => {
    if (err) return next(err);
    req.file = extractProfileFile(req);
    next();
  });
}

module.exports = {
  uploadScreenshot: upload.single('screenshot'),
  uploadScreenshotToCloudinary,
  fetchScreenshot,
  uploadProfilePhoto: handleProfilePhotoUpload,
  uploadProfilePhotoToCloudinary,
  deleteCloudinaryImage,
};

