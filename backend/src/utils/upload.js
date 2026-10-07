const path = require('path');
const multer = require('multer');
const { AppError } = require('./response');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB: Vercel refuses request bodies over 4.5 MB
const SCREENSHOT_FOLDER = 'siddhiboys/payment-screenshots';

// Cloudinary's reason for a failed upload (e.g. "cloud_name mismatch", "Invalid api_key").
// It never contains the API secret. Logged on the server (Vercel → Logs); users get a short message.
function uploadError(kind, err) {
  const reason = err?.error?.message || err?.message || 'no secure_url returned';
  const code = err?.error?.http_code || err?.http_code || '';
  console.error(`Cloudinary ${kind} upload failed: ${reason}${code ? ` (HTTP ${code})` : ''}`);
  // 401 = Cloudinary rejected our credentials: retrying won't help, the server settings must be fixed.
  if (code === 401) {
    return new AppError('Image upload is not set up correctly on the server (Cloudinary settings). Please contact the admin.', 503);
  }
  return new AppError(`Could not upload the ${kind}. Please try again.`, 502);
}

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
          return reject(uploadError('screenshot', err));
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

// Uploads a member's profile photo to Cloudinary (resized to 400×400) and returns its URL.
// Profile photos are ordinary (public) Cloudinary images; payment screenshots are not.
function uploadProfilePhotoToCloudinary(file) {
  if (!isCloudinaryConfigured()) {
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
          return reject(uploadError('profile photo', err));
        }
        resolve(result.secure_url);
      },
    );
    stream.end(file.buffer);
  });
}

// Deletes a replaced/removed profile photo from Cloudinary. Only images in our own profile
// folder are ever deleted. A failure here never blocks saving the member.
async function deleteCloudinaryImage(url) {
  if (typeof url !== 'string' || !isCloudinaryConfigured()) return;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
  if (!match || !match[1].startsWith(`${PROFILE_FOLDER}/`)) return;
  try {
    await cloudinary.uploader.destroy(match[1]);
  } catch {
    // The old image stays on Cloudinary; nothing else is affected.
  }
}

module.exports = {
  uploadScreenshot: upload.single('screenshot'),
  uploadScreenshotToCloudinary,
  fetchScreenshot,
  uploadProfilePhoto: upload.single('photo'), // JSON requests without a file pass straight through
  uploadProfilePhotoToCloudinary,
  deleteCloudinaryImage,
};

